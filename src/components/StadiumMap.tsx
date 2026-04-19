import React from 'react';
import { getCrowdLevel } from '../utils/crowdUtils';

interface StadiumMapProps {
  zones: any[];
  activeRoute?: string[];
}

// Map logical graph nodes to SVG coordinates for the new rectangular stadium
const NodeCoordinates: Record<string, { x: number, y: number }> = {
  gateA: { x: 30, y: 125 },
  gateB: { x: 370, y: 125 },
  sector1: { x: 200, y: 50 },
  sector2: { x: 200, y: 200 },
  centerJunction: { x: 200, y: 125 },
};

export default function StadiumMap({ zones, activeRoute }: StadiumMapProps) {
  // Helper to find a zone's crowd level by its ID
  const getZoneDensityColor = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return '#e2e8f0'; // slate-200 default
    
    const crowd = zone.crowd;
    if (crowd > 80) return '#ef4444'; // red-500
    if (crowd > 70) return '#f97316'; // orange-500
    if (crowd > 40) return '#eab308'; // yellow-500
    return '#10b981'; // emerald-500
  };

  const getZonePulse = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone && zone.crowd > 80 ? 'animate-pulse' : '';
  };

  // Build SVG path data for the active route
  let routePathD = '';
  if (activeRoute && activeRoute.length > 1) {
    const points = activeRoute.map(node => NodeCoordinates[node]).filter(Boolean);
    if (points.length === activeRoute.length) {
      routePathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
    }
  }

  return (
    <div className="w-full flex items-center justify-center p-4 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner overflow-hidden relative">
      <div className="relative w-full max-w-sm aspect-video">
        <svg viewBox="0 0 400 250" className="w-full h-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
            
          {/* Base Stadium Footprint (Rectangular / Soccer Style) */}
          <rect x="10" y="10" width="380" height="230" rx="20" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="4"/>
          
          {/* Sector 1 (North Stand) */}
          <rect 
            x="50" y="30" width="300" height="40" rx="10" 
            fill={getZoneDensityColor('sector1')} 
            className={`transition-colors duration-700 ${getZonePulse('sector1')}`}
          />
          <text x="200" y="55" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" className="drop-shadow-md">North Stand (Sec 1)</text>

          {/* Sector 2 (South Stand) */}
          <rect 
            x="50" y="180" width="300" height="40" rx="10" 
            fill={getZoneDensityColor('sector2')} 
            className={`transition-colors duration-700 ${getZonePulse('sector2')}`}
          />
          <text x="200" y="205" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" className="drop-shadow-md">South Stand (Sec 2)</text>

          {/* Gate A (West) */}
          <rect 
            x="15" y="95" width="30" height="60" rx="8" 
            fill="#f8fafc" stroke={getZoneDensityColor('gateA')} strokeWidth="4" 
            className={`transition-all duration-700 ${getZonePulse('gateA')}`}
          />
          <text x="30" y="129" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="bold" transform="rotate(-90 30 125)">Gate A</text>

          {/* Gate B (East) */}
          <rect 
             x="355" y="95" width="30" height="60" rx="8" 
             fill="#f8fafc" stroke={getZoneDensityColor('gateB')} strokeWidth="4" 
             className={`transition-all duration-700 ${getZonePulse('gateB')}`}
          />
          <text x="370" y="129" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="bold" transform="rotate(90 370 125)">Gate B</text>

          {/* Pitch / Field */}
          <rect x="70" y="75" width="260" height="100" rx="5" fill="#22c55e" opacity="0.8"/>
          {/* Penalty boxes */}
          <rect x="70" y="95" width="40" height="60" fill="none" stroke="white" strokeWidth="2" opacity="0.5"/>
          <rect x="290" y="95" width="40" height="60" fill="none" stroke="white" strokeWidth="2" opacity="0.5"/>
          {/* Centerline and circle */}
          <line x1="200" y1="75" x2="200" y2="175" stroke="white" strokeWidth="2" opacity="0.5"/>
          <circle cx="200" cy="125" r="20" fill="none" stroke="white" strokeWidth="2" opacity="0.5"/>
          
          {/* Route Path (if active) */}
          {routePathD && (
            <>
              {/* Glow / Outline */}
              <path d={routePathD} stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" className="animate-pulse" />
              {/* Main Line */}
              <path d={routePathD} stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Highlight Nodes on path */}
              {activeRoute?.map((nodeId, idx) => {
                 const p = NodeCoordinates[nodeId];
                 if (!p) return null;
                 const isEndpoint = idx === 0 || idx === activeRoute.length - 1;
                 return (
                   <circle 
                     key={`route-dot-${nodeId}`} 
                     cx={p.x} cy={p.y} r={isEndpoint ? "6" : "4"} 
                     fill={isEndpoint ? "#1d4ed8" : "#fff"} 
                     stroke="#2563eb" strokeWidth="3" 
                   />
                 );
              })}
            </>
          )}
          
        </svg>
      </div>
    </div>
  );
}
