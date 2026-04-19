export interface RouteDetail {
    path: string[];
    pathNames: string[];
    estimatedTime: number;
    isCongested: boolean;
    congestionReason?: string;
}

export interface RouteResult {
    primary: RouteDetail | null;
    alternative: RouteDetail | null;
}

// Internal Graph definition
const stadiumGraph: Record<string, Record<string, number>> = {
    gateA: { centerJunction: 3, sector1: 5, sector2: 7 },
    gateB: { centerJunction: 3, sector1: 7, sector2: 5 },
    sector1: { centerJunction: 4, gateA: 5, gateB: 7, sector2: 10 },
    sector2: { centerJunction: 4, gateA: 7, gateB: 5, sector1: 10 },
    centerJunction: { gateA: 3, gateB: 3, sector1: 4, sector2: 4 },
};

const NodeNames: Record<string, string> = {
    gateA: "Gate A",
    gateB: "Gate B",
    sector1: "Sector 1",
    sector2: "Sector 2",
    centerJunction: "Main Concourse"
};

/**
 * Applies a time penalty multiplier based on the crowd percentage.
 * Over 80% = huge delay, over 60 = moderate, etc.
 */
const getCrowdMultiplier = (nodeId: string, zones: any[]): number => {
    if (nodeId === 'centerJunction') return 1.2; // Baseline slight slowdown for common area
    const zone = zones.find(z => z.id === nodeId);
    if (!zone) return 1.0;
    
    if (zone.crowd > 80) return 2.5;
    if (zone.crowd > 60) return 1.5;
    if (zone.crowd > 40) return 1.2;
    return 1.0;
};

// Standard Dijkstra search
const findShortestPath = (start: string, end: string, zones: any[], avoidEdges: Array<[string, string]> = []): RouteDetail | null => {
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const queue = new Set<string>();

    for (const node in stadiumGraph) {
        distances[node] = Infinity;
        previous[node] = null;
        queue.add(node);
    }
    
    distances[start] = 0;

    while (queue.size > 0) {
        let current = Array.from(queue).reduce((minNode, node) => 
            distances[node] < distances[minNode] ? node : minNode
        );

        if (distances[current] === Infinity) break;
        if (current === end) {
            const path: string[] = [];
            let currNode: string | null = current;
            while (currNode !== null) {
                path.unshift(currNode);
                currNode = previous[currNode];
            }
            
            let isCongested = distances[end] > 15;
            let congestionReason: string | undefined = undefined;

            for (let i = 1; i < path.length; i++) {
                const node = path[i];
                if (node === 'centerJunction') continue;
                const zone = zones.find((z: any) => z.id === node);
                if (zone && zone.crowd > 75) {
                    isCongested = true;
                    congestionReason = `Severe crowding detected at ${NodeNames[node] || node}.`;
                    break;
                } else if (zone && zone.crowd > 50) {
                    isCongested = true;
                    congestionReason = `Moderate delays passing through ${NodeNames[node] || node}.`;
                    break;
                }
            }

            if (isCongested && !congestionReason) {
                congestionReason = 'General high venue traffic slowing traversal rates.';
            }

            return {
                path,
                pathNames: path.map(n => NodeNames[n] || n),
                estimatedTime: Math.ceil(distances[end]),
                isCongested,
                congestionReason
            };
        }

        queue.delete(current);

        for (const neighbor in stadiumGraph[current]) {
            // Check if we strictly avoid this edge (for finding alt routes)
            if (avoidEdges.some(e => (e[0] === current && e[1] === neighbor) || (e[0] === neighbor && e[1] === current))) {
                continue;
            }

            const baseTime = stadiumGraph[current][neighbor];
            const multiplier = getCrowdMultiplier(neighbor, zones);
            const timeCost = baseTime * multiplier;

            const alt = distances[current] + timeCost;
            if (alt < distances[neighbor]) {
                distances[neighbor] = alt;
                previous[neighbor] = current;
            }
        }
    }
    return null;
};

export const findBestRouteInfo = (sourceId: string, destinationId: string, zones: any[]): RouteResult => {
    if (!sourceId || !destinationId || sourceId === destinationId) {
        return { primary: null, alternative: null };
    }

    // 1. Find the primary optimal route
    const primary = findShortestPath(sourceId, destinationId, zones);

    // 2. To find an alternative, heavily penalize or block the primary route's worst edge
    let alternative: RouteDetail | null = null;
    if (primary && primary.path.length > 2) {
        // Collect edges of primary route, skip endpoints if possible
        const edges: Array<[string, string]> = [];
        for (let i = 0; i < primary.path.length - 1; i++) {
            edges.push([primary.path[i], primary.path[i+1]]);
        }
        
        // Let's just avoid the first main segment (that isn't the destination directly)
        const blockEdge = edges[0] || edges[1];
        alternative = findShortestPath(sourceId, destinationId, zones, [blockEdge]);
        
        // If alternative is heavily skewed or exactly the same (unlikely with blocked edge), nullify
        if (alternative && alternative.path.join() === primary.path.join()) {
            alternative = null;
        }
    }

    return { primary, alternative };
};
  
