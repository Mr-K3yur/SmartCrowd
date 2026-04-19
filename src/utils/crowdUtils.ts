/**
 * Determines crowd level category based on percentage/count.
 */
export const getCrowdLevel = (crowd: number): 'high' | 'medium' | 'low' => {
    if (crowd > 70) return 'high';
    if (crowd > 40) return 'medium';
    return 'low';
  };
  
  /**
   * Calculates estimated wait time in minutes based on people in queue and processing rate.
   */
  export const calculateWaitTime = (people: number, service_rate: number): number => {
    if (!service_rate || service_rate <= 0) return 0;
    return Math.ceil(people / service_rate);
  };
  
