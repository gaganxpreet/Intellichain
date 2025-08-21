// Complete Logistics Algorithm Implementation
// Based on the provided Python algorithm with full functionality

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

// Delhi logistics hubs with precise coordinates
const HUBS: Record<string, [number, number]> = {
  'north-delhi': [28.832652, 77.099613],
  'west-delhi': [28.685020, 77.098174],
  'south-delhi': [28.513000, 77.269200],
  'east-delhi': [28.639425, 77.310904],
  'central-delhi': [28.700257, 77.167209],
  'micro-mundka': [28.7744, 77.0405],
  'micro-okhla': [28.5358, 77.2764],
  'gurgaon-hub': [28.4595, 77.0266],
  'noida-hub': [28.5355, 77.3910],
  'faridabad-hub': [28.4089, 77.3178],
  'ghaziabad-hub': [28.6692, 77.4538]
};

// Complete vehicle specifications
const VEHICLES = {
  '2W': {
    speed: 25,
    maxDist: 9,
    maxWeight: 5,
    maxDimensions: [30, 30, 15],
    maxVolume: 13500,
    costPerKm: 7.0
  },
  'Van': {
    speed: 35,
    maxDist: 30,
    maxWeight: 750,
    maxDimensions: [120, 100, 100],
    maxVolume: 1200000,
    costPerKm: 18.0
  },
  'Tempo': {
    speed: 40,
    maxDist: 70,
    maxWeight: 1200,
    maxDimensions: [180, 140, 130],
    maxVolume: 3276000,
    costPerKm: 25.0
  },
  'Truck': {
    speed: 45,
    maxDist: 100,
    maxWeight: 5000,
    maxDimensions: [300, 200, 200],
    maxVolume: 12000000,
    costPerKm: 35.0
  }
};

const HANDLING_MIN = 10; // hub handling time in minutes

// Google Maps Geocoding with comprehensive error handling
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const apiKey = 'AIzaSyCCO9SNLjp39W_jqN749-wwFaHA2s6svZ8';
    if (!apiKey) {
      console.error('Google Maps API key not found in environment variables');
      return null;
    }

    console.log('Geocoding address:', address);
    
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&region=in&key=${apiKey}`;
    
    console.log('Geocoding URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Geocoding HTTP error:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    console.log('Geocoding API response:', data);
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const coordinates: [number, number] = [location.lat, location.lng];
      console.log('Successfully geocoded coordinates:', coordinates);
      return coordinates;
    } else if (data.status === 'REQUEST_DENIED') {
      console.error('Google Maps API request denied:', data.error_message);
      alert('Google Maps API access denied. Please check API key and billing.');
      return null;
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('Google Maps API quota exceeded');
      alert('Google Maps API quota exceeded. Please try again later.');
      return null;
    } else {
      console.warn('Geocoding failed:', {
        status: data.status,
        error_message: data.error_message,
        results_count: data.results?.length || 0
      });
      alert(`Geocoding failed: ${data.status}. Please check the address format.`);
      return null;
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    alert('Network error during geocoding. Please check your internet connection.');
    return null;
  }
}

// Calculate cargo volume
function calcVolume(l: number, w: number, h: number): number {
  return l * w * h;
}

// Get feasible vehicle types based on cargo specifications
function getFeasibleVehicleTypes(loadWeight: number, loadDims: [number, number, number]): string[] {
  const [l, w, h] = loadDims;
  const loadVolume = calcVolume(l, w, h);
  const feasible: string[] = [];

  console.log('Checking feasible vehicles for:', {
    weight: loadWeight,
    dimensions: loadDims,
    volume: loadVolume
  });

  for (const [vname, props] of Object.entries(VEHICLES)) {
    const [maxL, maxW, maxH] = props.maxDimensions;
    const canCarry = (
      loadWeight <= props.maxWeight &&
      loadVolume <= props.maxVolume &&
      l <= maxL && w <= maxW && h <= maxH
    );

    console.log(`Vehicle ${vname}:`, {
      weightOk: loadWeight <= props.maxWeight,
      volumeOk: loadVolume <= props.maxVolume,
      dimensionsOk: l <= maxL && w <= maxW && h <= maxH,
      canCarry
    });

    if (canCarry) {
      feasible.push(vname);
    }
  }

  console.log('Feasible vehicles:', feasible);
  return feasible;
}

// Compute direct P2P metrics
function computeDirectMetrics(pickup: [number, number], delivery: [number, number], vtype: string) {
  const props = VEHICLES[vtype as keyof typeof VEHICLES];
  const distance = haversine(pickup, delivery);
  const timeMin = (distance / props.speed) * 60.0;
  const cost = distance * props.costPerKm;

  console.log(`Direct P2P for ${vtype}:`, {
    distance: distance.toFixed(2),
    time: timeMin.toFixed(1),
    cost: cost.toFixed(2)
  });

  return {
    strategy: 'P2P-Direct',
    hub: null,
    vehicles: { pickupVehicle: vtype, deliveryVehicle: vtype },
    distancesKm: { direct: Math.round(distance * 100) / 100 },
    totalDistance: Math.round(distance * 100) / 100,
    totalTime: Math.round(timeMin * 10) / 10,
    totalCost: Math.round(cost * 100) / 100,
    optimalRoute: [pickup, delivery],
    feasible: distance <= props.maxDist
  };
}

// Compute hub-and-spoke metrics
function computeHubSpokeMetrics(pickup: [number, number], delivery: [number, number], vtype: string) {
  const props = VEHICLES[vtype as keyof typeof VEHICLES];
  let best: any = null;

  console.log(`Computing hub-spoke for ${vtype}...`);

  for (const [hubName, hubCoord] of Object.entries(HUBS)) {
    const d1 = haversine(pickup, hubCoord);
    const d2 = haversine(hubCoord, delivery);
    const total = d1 + d2;

    console.log(`Hub ${hubName}:`, {
      pickupToHub: d1.toFixed(2),
      hubToDelivery: d2.toFixed(2),
      total: total.toFixed(2),
      pickupFeasible: d1 <= props.maxDist,
      deliveryFeasible: d2 <= props.maxDist
    });

    if (d1 <= props.maxDist && d2 <= props.maxDist) {
      if (best === null || total < best.totalDistanceUnrounded) {
        const timeMin = ((d1 + d2) / props.speed) * 60.0 + HANDLING_MIN;
        const cost = (d1 + d2) * props.costPerKm;
        
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
          totalDistanceUnrounded: total,
          feasible: true
        };
      }
    }
  }

  if (best) {
    console.log(`Best hub route for ${vtype}:`, {
      hub: best.hub,
      distance: best.totalDistance,
      cost: best.totalCost
    });
  }

  return best;
}

// Calculate optimal route for a vehicle type
function calculateOptimalRoute(pickup: [number, number], delivery: [number, number], vtype: string) {
  console.log(`Calculating optimal route for ${vtype}...`);
  
  const direct = computeDirectMetrics(pickup, delivery, vtype);
  const hub = computeHubSpokeMetrics(pickup, delivery, vtype);

  const candidates = [];
  if (direct && direct.feasible) candidates.push(direct);
  if (hub && hub.feasible) candidates.push(hub);
  
  if (candidates.length === 0) {
    console.log(`No feasible routes for ${vtype}`);
    return null;
  }

  // Select best route based on cost
  const best = candidates.reduce((prev, curr) => 
    prev.totalCost < curr.totalCost ? prev : curr
  );

  console.log(`Best route for ${vtype}:`, {
    strategy: best.strategy,
    cost: best.totalCost,
    distance: best.totalDistance,
    hub: best.hub
  });

  return best;
}

// Apply shared pooling discounts
function applySharedPoolingDiscount(result: any, strategy: 'auto' | 'p2p') {
  if (strategy === 'p2p') {
    // No pooling for P2P
    return {
      ...result,
      strategy: 'P2P-Direct',
      message: 'Success (Direct P2P delivery)',
      poolingDiscount: 0,
      originalCost: result.totalCost
    };
  }

  // Auto strategy - apply pooling discounts
  if (result.hub) {
    // Hub-based shared pooling with 25% discount
    const poolingDiscount = 0.25;
    const originalCost = result.totalCost;
    const sharedCost = originalCost * (1 - poolingDiscount);
    
    return {
      ...result,
      strategy: 'Hub-Shared-Pooling',
      totalCost: Math.round(sharedCost * 100) / 100,
      originalCost: Math.round(originalCost * 100) / 100,
      poolingDiscount: poolingDiscount,
      savings: Math.round((originalCost - sharedCost) * 100) / 100,
      message: `Success (Hub-Shared-Pooling via ${result.hub} - 25% discount applied!)`
    };
  } else {
    // Direct route with smaller discount
    const poolingDiscount = 0.15;
    const originalCost = result.totalCost;
    const sharedCost = originalCost * (1 - poolingDiscount);
    
    return {
      ...result,
      strategy: 'Direct-Shared-Pooling',
      totalCost: Math.round(sharedCost * 100) / 100,
      originalCost: Math.round(originalCost * 100) / 100,
      poolingDiscount: poolingDiscount,
      savings: Math.round((originalCost - sharedCost) * 100) / 100,
      message: `Success (Direct-Shared-Pooling - 15% discount applied!)`
    };
  }
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
  optimizeBy: 'cost' | 'time' = 'cost',
  vehiclePreference?: string
) {
  console.log('=== LOGISTICS ALGORITHM START ===');
  console.log('Input parameters:', {
    pickup,
    delivery,
    weight: loadWeightKg,
    dimensions: [loadLengthCm, loadWidthCm, loadHeightCm],
    strategy: deliveryStrategyOption,
    optimizeBy,
    vehiclePreference
  });

  const loadDims: [number, number, number] = [loadLengthCm, loadWidthCm, loadHeightCm];
  const loadVolume = calcVolume(loadLengthCm, loadWidthCm, loadHeightCm);
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
    originalCost: null,
    savings: null,
    poolingDiscount: null,
    optimalRoute: null,
    cargoSpecs: {
      weight: loadWeightKg,
      dimensions: loadDims,
      volume: loadVolume
    },
    message: 'Shipment not possible'
  };

  if (feasibleTypes.length === 0) {
    console.log('No feasible vehicles found');
    return { ...baseFail, message: 'No vehicles can handle this cargo size/weight' };
  }

  // If user has vehicle preference and it's feasible, prioritize it
  let sortedTypes = [...feasibleTypes];
  if (vehiclePreference && feasibleTypes.includes(vehiclePreference)) {
    sortedTypes = [vehiclePreference, ...feasibleTypes.filter(v => v !== vehiclePreference)];
    console.log('Vehicle preference applied:', vehiclePreference);
  } else {
    // Sort by cost efficiency (cheapest first)
    sortedTypes.sort((a, b) => 
      VEHICLES[a as keyof typeof VEHICLES].costPerKm - VEHICLES[b as keyof typeof VEHICLES].costPerKm
    );
  }

  console.log('Vehicle evaluation order:', sortedTypes);

  // Find best route among feasible vehicles
  let bestRoute = null;
  let bestVehicle = null;

  for (const vtype of sortedTypes) {
    const route = calculateOptimalRoute(pickup, delivery, vtype);
    if (route) {
      const compareValue = optimizeBy === 'cost' ? route.totalCost : route.totalTime;
      const bestValue = optimizeBy === 'cost' ? bestRoute?.totalCost : bestRoute?.totalTime;
      
      if (bestRoute === null || compareValue < bestValue) {
        bestRoute = route;
        bestVehicle = vtype;
      }
    }
  }

  if (!bestRoute || !bestVehicle) {
    console.log('No feasible routes found');
    return { ...baseFail, message: 'No feasible route found for any vehicle' };
  }

  console.log('Best route selected:', {
    vehicle: bestVehicle,
    strategy: bestRoute.strategy,
    cost: bestRoute.totalCost,
    hub: bestRoute.hub
  });

  // Apply shared pooling discounts
  const finalResult = applySharedPoolingDiscount(bestRoute, deliveryStrategyOption);

  // Generate vehicle instance ID
  const instanceId = `${bestVehicle}_${finalResult.strategy.replace(/[^A-Z0-9]/g, '_')}_${Date.now()}`;

  const result = {
    feasibleVehicles: feasibleTypes,
    selectedVehicle: bestVehicle,
    vehicleInstanceId: instanceId,
    strategy: finalResult.strategy,
    hub: finalResult.hub,
    vehicles: finalResult.vehicles,
    distancesKm: finalResult.distancesKm,
    totalDistance: finalResult.totalDistance,
    totalTime: finalResult.totalTime,
    totalCost: finalResult.totalCost,
    originalCost: finalResult.originalCost,
    savings: finalResult.savings,
    poolingDiscount: finalResult.poolingDiscount,
    optimalRoute: finalResult.optimalRoute,
    cargoSpecs: {
      weight: loadWeightKg,
      dimensions: loadDims,
      volume: loadVolume
    },
    algorithmDetails: {
      evaluatedVehicles: sortedTypes,
      optimizedBy: optimizeBy,
      userPreference: vehiclePreference,
      hubsConsidered: Object.keys(HUBS).length,
      routeOptions: feasibleTypes.length
    },
    message: finalResult.message
  };

  console.log('=== FINAL RESULT ===');
  console.log(result);
  console.log('=== LOGISTICS ALGORITHM END ===');

  return result;
}

// Utility function to get hub coordinates
export function getHubCoordinates(hubName: string): [number, number] | null {
  return HUBS[hubName] || null;
}

// Utility function to get all hubs
export function getAllHubs(): Record<string, [number, number]> {
  return { ...HUBS };
}

// Utility function to get vehicle specifications
export function getVehicleSpecs(vehicleType: string) {
  return VEHICLES[vehicleType as keyof typeof VEHICLES] || null;
}