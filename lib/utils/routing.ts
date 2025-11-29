// Utility functions for route calculation using OSRM (Open Source Routing Machine)

export async function fetchRoute(
  start: [number, number], // [lon, lat]
  end: [number, number]
): Promise<[number, number][] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const coordinates = data.routes[0].geometry.coordinates;
      return coordinates as [number, number][];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
}
