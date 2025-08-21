// Logistics Algorithm - JavaScript Implementation
// Based on the provided Python algorithm

// Helper: Haversine formula for distance calculation
function haversine(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371.0; // Earth radius in km
  const lat1 = (coord1[0] * Math.PI) / 180;
  const lon1 = (coord1[1] * Math.PI) / 180;
  const lat2 = (coord2[0] * Math.PI) / 180;
  const lon2 = (coord2[1] * Math.PI) / 180;
  
  const dlon = lon2 - lon1;
  const dlat = lat2 - lat1;
  
  const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // distance in km
}

// Hub coordinates - Delhi logistics hubs
const HUBS: Record<string, [number, number]> = {
  north: [28.832652, 77.099613],
  west: [28.685020, 77.098174],
  south: [28.513000, 77.269200],
  east: [28.639425, 77.310904],
  central: [28.700257, 77.167209],
  'micro-mundka': [28.7744, 77.0405],
  'micro-okhla': [28.5358, 77.2764]
};

// Vehicle specifications
const VEHICLES = {
  '2W': {
    speed: 25,
    maxDist: 9,
    maxWeight: 5,
    maxDimensions: [30, 30, 15],
    maxVolume: 13500
  },
  'Van': {
    speed: 35,
    maxDist: 30,
    maxWeight: 750,
    maxDimensions: [120, 100, 100],
    maxVolume: 1200000
  },
  'Tempo': {
    speed: 40,
    maxDist: 70,
    maxWeight: 1200,
    maxDimensions: [180, 140, 130],
    maxVolume: 3276000
  },
  'Truck': {
    speed: 45,
    maxDist: 100,
    maxWeight: 5000,
    maxDimensions: [300, 200, 200],
    maxVolume: 12000000
  }
};

// Cost per km
const COST_PER_KM = {
  '2W': 7.0,
  'Van': 18.0,
  'Tempo': 25.0,
  'Truck': 35.0
};

const HANDLING_MIN = 10; // hub handling time in minutes

function calcVolume(l: number, w: number, h: number): number {
  return l * w * h;
}

function getFeasibleVehicleTypes(loadWeight: number, loadDims: [number, number, number]): string[] {
  const [l, w, h] = loadDims;
  const loadVolume = calcVolume(l, w, h);
  const feasible: string[] = [];

  for (const [vname, props] of Object.entries(VEHICLES)) {
    const [maxL, maxW, maxH] = props.maxDimensions;
    if (
      loadWeight <= props.maxWeight &&
      loadVolume <= props.maxVolume &&
      l <= maxL && w <= maxW && h <= maxH
    ) {
      feasible.push(vname);
    }
  }

  return feasible;
}

function computeDirectMetrics(pickup: [number, number], delivery: [number, number], vtype: string) {
  const props = VEHICLES[vtype as keyof typeof VEHICLES];
  const distance = haversine(pickup, delivery);
  const timeMin = (distance / props.speed) * 60.0;
  const cost = distance * COST_PER_KM[vtype as keyof typeof COST_PER_KM];

  return {
    strategy: 'P2P Direct',
    hub: null,
    vehicles: { pickupVehicle: vtype, deliveryVehicle: vtype },
    distancesKm: { direct: Math.round(distance * 100) / 100 },
    totalDistance: Math.round(distance * 100) / 100,
    totalTime: Math.round(timeMin * 10) / 10,
    totalCost: Math.round(cost * 100) / 100,
    optimalRoute: [pickup, delivery]
  };
}

function computeHubSpokeMetrics(pickup: [number, number], delivery: [number, number], vtype: string) {
  const props = VEHICLES[vtype as keyof typeof VEHICLES];
  let best: any = null;

  for (const [hubName, hubCoord] of Object.entries(HUBS)) {
    const d1 = haversine(pickup, hubCoord);
    const d2 = haversine(hubCoord, delivery);
    const total = d1 + d2;

    if (d1 <= props.maxDist && d2 <= props.maxDist) {
      if (best === null || total < best.totalDistanceUnrounded) {
        const timeMin = ((d1 + d2) / props.speed) * 60.0 + HANDLING_MIN;
        const cost = (d1 + d2) * COST_PER_KM[vtype as keyof typeof COST_PER_KM];
        
        best = {
          strategy: 'Hub-and-Spoke',
          hub: hubName,
          vehicles: { pickupVehicle: vtype, deliveryVehicle: vtype },
          distancesKm: { 
            pickupLeg: Math.round(d1 * 100) / 100, 
            deliveryLeg: Math.round(d2 * 100) / 100 
          },
          totalDistance: Math.round(total * 100) / 100,
          totalTime: Math.round(timeMin * 10) / 10,
          totalCost: Math.round(cost * 100) / 100,
          optimalRoute: [pickup, hubCoord, delivery],
          totalDistanceUnrounded: total
        };
      }
    }
  }

  return best;
}

function calculateOptimalRoute(pickup: [number, number], delivery: [number, number], vtype: string) {
  const direct = computeDirectMetrics(pickup, delivery, vtype);
  const hub = computeHubSpokeMetrics(pickup, delivery, vtype);

  const candidates = [];
  if (direct) candidates.push(direct);
  if (hub) candidates.push(hub);
  
  if (candidates.length === 0) return null;

  const best = candidates.reduce((prev, curr) => 
    prev.totalCost < curr.totalCost ? prev : curr
  );

  return {
    route: best.optimalRoute,
    distance: best.totalDistance,
    cost: best.totalCost,
    time: best.totalTime,
    strategy: best.strategy,
    hub: best.hub
  };
}

// Main logistics algorithm
export function logisticsAlgorithm(
  pickup: [number, number],
  delivery: [number, number],
  loadWeightKg: number,
  loadLengthCm: number,
  loadWidthCm: number,
  loadHeightCm: number,
  deliveryStrategyOption: 'auto' | 'p2p' = 'auto',
  optimizeBy: 'cost' | 'time' = 'cost'
) {
  const loadDims: [number, number, number] = [loadLengthCm, loadWidthCm, loadHeightCm];
  const feasibleTypes = getFeasibleVehicleTypes(loadWeightKg, loadDims);

  const baseFail = {
    feasibleVehicles: feasibleTypes,
    selectedVehicle: null,
    vehicleInstanceId: null,
    strategy: null,
    hub: null,
    vehicles: null,
    distancesKm: null,
    totalDistance: null,
    totalTime: null,
    totalCost: null,
    optimalRoute: null,
    message: 'Shipment not possible'
  };

  if (feasibleTypes.length === 0) {
    return baseFail;
  }

  // Sort feasible types by cost efficiency
  const sortedTypes = feasibleTypes.sort((a, b) => 
    COST_PER_KM[a as keyof typeof COST_PER_KM] - COST_PER_KM[b as keyof typeof COST_PER_KM]
  );

  // Find best route among feasible vehicles
  let bestRoute = null;
  let bestVehicle = null;

  for (const vtype of sortedTypes) {
    const route = calculateOptimalRoute(pickup, delivery, vtype);
    if (route && (bestRoute === null || route.cost < bestRoute.cost)) {
      bestRoute = route;
      bestVehicle = vtype;
    }
  }

  if (!bestRoute || !bestVehicle) {
    return { ...baseFail, message: 'No feasible route found' };
  }

  // For P2P strategy, return direct result
  if (deliveryStrategyOption === 'p2p') {
    return {
      feasibleVehicles: feasibleTypes,
      selectedVehicle: bestVehicle,
      vehicleInstanceId: `${bestVehicle}_${Date.now()}`,
      strategy: 'P2P',
      hub: bestRoute.hub,
      vehicles: { pickupVehicle: bestVehicle, deliveryVehicle: bestVehicle },
      distancesKm: { directOrRouteKm: bestRoute.distance },
      totalDistance: bestRoute.distance,
      totalTime: bestRoute.time,
      totalCost: bestRoute.cost,
      optimalRoute: bestRoute.route,
      message: 'Success (P2P assigned)'
    };
  }

  // For auto strategy, simulate shared pooling discount
  if (deliveryStrategyOption === 'auto') {
    // Check if route uses hub (shared pooling through hub)
    const usesHub = bestRoute.hub !== null;
    
    if (usesHub) {
      // Hub-based shared pooling with 25% discount
      const poolingDiscount = 0.25;
      const sharedCost = bestRoute.cost * (1 - poolingDiscount);
      
      return {
        feasibleVehicles: feasibleTypes,
        selectedVehicle: bestVehicle,
        vehicleInstanceId: `${bestVehicle}_HUB_POOL_${Date.now()}`,
        strategy: 'Hub-Shared-Pooling',
        hub: bestRoute.hub,
        vehicles: { pickupVehicle: bestVehicle, deliveryVehicle: bestVehicle },
        distancesKm: { 
          pickupLeg: bestRoute.route.length > 2 ? haversine(bestRoute.route[0], bestRoute.route[1]) : bestRoute.distance,
          deliveryLeg: bestRoute.route.length > 2 ? haversine(bestRoute.route[1], bestRoute.route[2]) : 0,
          totalRouteKm: bestRoute.distance 
        },
        totalDistance: bestRoute.distance,
        totalTime: bestRoute.time,
        totalCost: Math.round(sharedCost * 100) / 100,
        optimalRoute: bestRoute.route,
        message: `Success (Hub-Shared-Pooling via ${bestRoute.hub} hub - 25% discount applied!)`
      };
    } else {
      // Direct route with smaller discount
      const poolingDiscount = 0.15; // 15% discount for direct shared pooling
      const sharedCost = bestRoute.cost * (1 - poolingDiscount);
      
      return {
        feasibleVehicles: feasibleTypes,
        selectedVehicle: bestVehicle,
        vehicleInstanceId: `${bestVehicle}_DIRECT_POOL_${Date.now()}`,
        strategy: 'Direct-Shared-Pooling',
        hub: null,
        vehicles: { pickupVehicle: bestVehicle, deliveryVehicle: bestVehicle },
        distancesKm: { directRouteKm: bestRoute.distance },
        totalDistance: bestRoute.distance,
        totalTime: bestRoute.time,
        totalCost: Math.round(sharedCost * 100) / 100,
        optimalRoute: bestRoute.route,
        message: `Success (Direct-Shared-Pooling - 15% discount applied!)`
      };
    }
  }

  return { ...baseFail, message: `Unknown delivery strategy: ${deliveryStrategyOption}` };
}

// Geocoding function using Google Maps API
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAlMDVtvXh2JDqgh8ok37qOmiIdo7-KLME';
    if (!apiKey) {
      console.error('Google Maps API key not found');
      return null;
    }

    console.log('Geocoding address:', address);
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    console.log('Geocoding response:', data);
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log('Geocoded coordinates:', [location.lat, location.lng]);
      return [location.lat, location.lng];
    }
    
    console.warn('Geocoding failed:', data.status, data.error_message);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}