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
  'north': [28.832652, 77.099613],
  'west': [28.685020, 77.098174],
  'south': [28.513000, 77.269200],
  'east': [28.639425, 77.310904],
  'central': [28.700257, 77.167209],
  'micro-mundka': [28.7744, 77.0405],
  'micro-okhla': [28.5358, 77.2764]
};

// Calculate volume in cm³
function calcVolumeCm3(l: number, w: number, h: number): number {
  return l * w * h;
}

// Cost model (per km)
const COST_PER_KM: Record<string, number> = {
  '2W': 7.0,
  'Van': 18.0,
  'Tempo': 25.0,
  'Truck': 35.0
};

// Complete vehicle specifications
const VEHICLES = {
  '2W': {
    speed: 25,
    maxDist: 9,
    maxWeight: 5,
    maxDimensions: [30, 30, 15] as [number, number, number],
    maxVolume: calcVolumeCm3(30, 30, 15)
  },
  'Van': {
    speed: 35,
    maxDist: 30,
    maxWeight: 750,
    maxDimensions: [120, 100, 100] as [number, number, number],
    maxVolume: calcVolumeCm3(120, 100, 100)
  },
  'Tempo': {
    speed: 40,
    maxDist: 70,
    maxWeight: 1200,
    maxDimensions: [180, 140, 130] as [number, number, number],
    maxVolume: calcVolumeCm3(180, 140, 130)
  },
  'Truck': {
    speed: 45,
    maxDist: 100,
    maxWeight: 5000,
    maxDimensions: [300, 200, 200] as [number, number, number],
    maxVolume: calcVolumeCm3(300, 200, 200)
  }
};

const HANDLING_MIN = 10; // hub handling time in minutes

// Vehicle Class (blueprint)
class VehicleClass {
  name: string;
  speed: number;
  maxDist: number;
  maxWeight: number;
  maxDimensions: [number, number, number];
  maxVolume: number;
  costPerKm: number;

  constructor(name: string) {
    this.name = name;
    const spec = VEHICLES[name as keyof typeof VEHICLES];
    this.speed = spec.speed;
    this.maxDist = spec.maxDist;
    this.maxWeight = spec.maxWeight;
    this.maxDimensions = spec.maxDimensions;
    this.maxVolume = spec.maxVolume;
    this.costPerKm = COST_PER_KM[name];
  }
}

const VEHICLE_CLASSES: Record<string, VehicleClass> = {};
Object.keys(VEHICLES).forEach(name => {
  VEHICLE_CLASSES[name] = new VehicleClass(name);
});

// Vehicle Instance (dynamic)
class VehicleInstance {
  id: string;
  typeName: string;
  cls: VehicleClass;
  currentLocation: [number, number];
  homeHub: string;
  remainingCapacityKg: number;
  remainingCapacityVolume: number;
  assignedRoute: [number, number][];

  constructor(id: string, typeName: string, currentLocation: [number, number], homeHub: string) {
    this.id = id;
    this.typeName = typeName;
    this.cls = VEHICLE_CLASSES[typeName];
    this.currentLocation = currentLocation;
    this.homeHub = homeHub;
    this.remainingCapacityKg = this.cls.maxWeight;
    this.remainingCapacityVolume = this.cls.maxVolume;
    this.assignedRoute = [];
  }

  capacityOk(loadWeight: number, loadVolume: number): boolean {
    return this.remainingCapacityKg >= loadWeight && this.remainingCapacityVolume >= loadVolume;
  }

  routeDistance(route?: [number, number][]): number {
    const routeToUse = route || this.assignedRoute;
    if (!routeToUse.length) return 0.0;
    
    const points = [this.currentLocation, ...routeToUse];
    let dist = 0.0;
    for (let i = 0; i < points.length - 1; i++) {
      dist += haversine(points[i], points[i + 1]);
    }
    return dist;
  }

  assignP2PNew(pickup: [number, number], delivery: [number, number], loadWeight: number, loadVolume: number): boolean {
    const legs: [[number, number], [number, number]][] = [
      [this.currentLocation, pickup],
      [pickup, delivery]
    ];
    
    for (const [a, b] of legs) {
      if (haversine(a, b) > this.cls.maxDist) {
        return false;
      }
    }
    
    this.assignedRoute = [pickup, delivery];
    this.remainingCapacityKg -= loadWeight;
    this.remainingCapacityVolume -= loadVolume;
    this.currentLocation = delivery;
    return true;
  }
}

// Google Maps Geocoding with comprehensive error handling
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const apiKey = 'AIzaSyCCO9SNLjp39W_jqN749-wwFaHA2s6svZ8';
    if (!apiKey) {
      console.error('Google Maps API key not found');
      alert('Google Maps API key not configured');
      return null;
    }

    console.log('Geocoding address:', address);
    
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&region=in&key=${apiKey}`;
    
    console.log('Geocoding URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Geocoding HTTP error:', response.status, response.statusText);
      alert(`Network error: ${response.status} ${response.statusText}`);
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
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn('No results found for address:', address);
      alert('Address not found. Please check the address and try again.');
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

// Get feasible vehicle types based on cargo specifications
function getFeasibleVehicleTypes(loadWeightKg: number, loadDimsCm: [number, number, number]): string[] {
  const [l, w, h] = loadDimsCm;
  const loadVolume = calcVolumeCm3(l, w, h);
  const feasible: string[] = [];

  console.log('Checking feasible vehicles for:', {
    weight: loadWeightKg,
    dimensions: loadDimsCm,
    volume: loadVolume
  });

  for (const [vname, props] of Object.entries(VEHICLES)) {
    const [maxL, maxW, maxH] = props.maxDimensions;
    const canCarry = (
      loadWeightKg <= props.maxWeight &&
      loadVolume <= props.maxVolume &&
      l <= maxL && w <= maxW && h <= maxH
    );

    console.log(`Vehicle ${vname}:`, {
      weightOk: loadWeightKg <= props.maxWeight,
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
    strategy: 'P2P Direct',
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

// Fleet Initialization
function initializeFleet(hubs: Record<string, [number, number]>): VehicleInstance[] {
  const fleet: VehicleInstance[] = [];
  
  for (const [hubName, coord] of Object.entries(hubs)) {
    // Add Vans
    for (let i = 1; i <= 3; i++) {
      const vid = `VAN_${hubName.substring(0, 3).toUpperCase()}_${i.toString().padStart(3, '0')}`;
      fleet.push(new VehicleInstance(vid, 'Van', coord, hubName));
    }
    
    // Add Tempos
    for (let i = 1; i <= 2; i++) {
      const vid = `TEMPO_${hubName.substring(0, 3).toUpperCase()}_${i.toString().padStart(3, '0')}`;
      fleet.push(new VehicleInstance(vid, 'Tempo', coord, hubName));
    }
    
    // Add Trucks
    for (let i = 1; i <= 1; i++) {
      const vid = `TRUCK_${hubName.substring(0, 3).toUpperCase()}_${i.toString().padStart(3, '0')}`;
      fleet.push(new VehicleInstance(vid, 'Truck', coord, hubName));
    }
    
    // Add 2-Wheelers
    for (let i = 1; i <= 4; i++) {
      const vid = `2W_${hubName.substring(0, 3).toUpperCase()}_${i.toString().padStart(3, '0')}`;
      fleet.push(new VehicleInstance(vid, '2W', coord, hubName));
    }
  }
  
  return fleet;
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
  vehiclePreference?: string,
  fleet?: VehicleInstance[]
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
  const loadVolume = calcVolumeCm3(loadLengthCm, loadWidthCm, loadHeightCm);
  const feasibleTypes = getFeasibleVehicleTypes(loadWeightKg, loadDims);

  // Initialize fleet if not provided
  if (!fleet) {
    fleet = initializeFleet(HUBS);
  }

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
    fleet: {
      totalVehicles: fleet.length,
      availableByType: fleet.reduce((acc, v) => {
        acc[v.typeName] = (acc[v.typeName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
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
      COST_PER_KM[a] - COST_PER_KM[b]
    );
  }

  console.log('Vehicle evaluation order:', sortedTypes);

  // Find best route among feasible vehicles
  let bestRoute = null;
  let bestVehicle = null;
  let bestVehicleInstance = null;

  for (const vtype of sortedTypes) {
    const route = calculateOptimalRoute(pickup, delivery, vtype);
    if (route) {
      // Find available vehicle instance of this type
      const availableVehicles = fleet.filter(v => 
        v.typeName === vtype && 
        v.capacityOk(loadWeightKg, loadVolume)
      );

      if (availableVehicles.length > 0) {
        // Select closest vehicle to pickup
        const closestVehicle = availableVehicles.reduce((closest, current) => {
          const closestDist = haversine(closest.currentLocation, pickup);
          const currentDist = haversine(current.currentLocation, pickup);
          return currentDist < closestDist ? current : closest;
        });

        const compareValue = optimizeBy === 'cost' ? route.totalCost : route.totalTime;
        const bestValue = optimizeBy === 'cost' ? bestRoute?.totalCost : bestRoute?.totalTime;
        
        if (bestRoute === null || compareValue < bestValue) {
          bestRoute = route;
          bestVehicle = vtype;
          bestVehicleInstance = closestVehicle;
        }
      }
    }
  }

  if (!bestRoute || !bestVehicle || !bestVehicleInstance) {
    console.log('No feasible routes found');
    return { ...baseFail, message: 'No feasible route found for any available vehicle' };
  }

  console.log('Best route selected:', {
    vehicle: bestVehicle,
    vehicleId: bestVehicleInstance.id,
    strategy: bestRoute.strategy,
    cost: bestRoute.totalCost,
    hub: bestRoute.hub
  });

  // Apply shared pooling discounts for auto strategy
  let finalResult = { ...bestRoute };
  if (deliveryStrategyOption === 'auto') {
    if (bestRoute.hub) {
      // Hub-based shared pooling with 25% discount
      const poolingDiscount = 0.25;
      const originalCost = bestRoute.totalCost;
      const sharedCost = originalCost * (1 - poolingDiscount);
      
      finalResult = {
        ...bestRoute,
        strategy: 'Hub-Shared-Pooling',
        totalCost: Math.round(sharedCost * 100) / 100,
        originalCost: Math.round(originalCost * 100) / 100,
        poolingDiscount: poolingDiscount,
        savings: Math.round((originalCost - sharedCost) * 100) / 100
      };
    } else {
      // Direct route with smaller discount
      const poolingDiscount = 0.15;
      const originalCost = bestRoute.totalCost;
      const sharedCost = originalCost * (1 - poolingDiscount);
      
      finalResult = {
        ...bestRoute,
        strategy: 'Direct-Shared-Pooling',
        totalCost: Math.round(sharedCost * 100) / 100,
        originalCost: Math.round(originalCost * 100) / 100,
        poolingDiscount: poolingDiscount,
        savings: Math.round((originalCost - sharedCost) * 100) / 100
      };
    }
  }

  // Assign the shipment to the vehicle
  if (deliveryStrategyOption === 'p2p') {
    bestVehicleInstance.assignP2PNew(pickup, delivery, loadWeightKg, loadVolume);
  }

  const result = {
    feasibleVehicles: feasibleTypes,
    selectedVehicle: bestVehicle,
    vehicleInstanceId: bestVehicleInstance.id,
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
    fleet: {
      totalVehicles: fleet.length,
      availableByType: fleet.reduce((acc, v) => {
        acc[v.typeName] = (acc[v.typeName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      selectedVehicleDetails: {
        id: bestVehicleInstance.id,
        type: bestVehicleInstance.typeName,
        homeHub: bestVehicleInstance.homeHub,
        currentLocation: bestVehicleInstance.currentLocation,
        remainingCapacity: {
          weight: bestVehicleInstance.remainingCapacityKg,
          volume: bestVehicleInstance.remainingCapacityVolume
        }
      }
    },
    algorithmDetails: {
      evaluatedVehicles: sortedTypes,
      optimizedBy: optimizeBy,
      userPreference: vehiclePreference,
      hubsConsidered: Object.keys(HUBS).length,
      routeOptions: feasibleTypes.length,
      fleetUtilization: {
        totalFleet: fleet.length,
        feasibleVehicles: fleet.filter(v => feasibleTypes.includes(v.typeName)).length,
        availableVehicles: fleet.filter(v => 
          feasibleTypes.includes(v.typeName) && 
          v.capacityOk(loadWeightKg, loadVolume)
        ).length
      }
    },
    message: deliveryStrategyOption === 'auto' 
      ? (finalResult.hub 
          ? `Success (Hub-Shared-Pooling via ${finalResult.hub} - ${Math.round((finalResult.poolingDiscount || 0) * 100)}% discount applied!)`
          : `Success (Direct-Shared-Pooling - ${Math.round((finalResult.poolingDiscount || 0) * 100)}% discount applied!)`)
      : 'Success (Direct P2P delivery)'
  };

  console.log('=== FINAL RESULT ===');
  console.log(result);
  console.log('=== LOGISTICS ALGORITHM END ===');

  return result;
}

// API endpoint simulation for /api/optimize
export async function optimizeRoute(payload: {
  pickup: [number, number];
  delivery: [number, number];
  load_weight_kg: number;
  load_length_cm: number;
  load_width_cm: number;
  load_height_cm: number;
  strategy?: 'auto' | 'p2p';
  optimize_by?: 'cost' | 'time';
  vehicle_preference?: string;
}) {
  try {
    const fleet = initializeFleet(HUBS);
    
    const result = logisticsAlgorithm(
      payload.pickup,
      payload.delivery,
      payload.load_weight_kg,
      payload.load_length_cm,
      payload.load_width_cm,
      payload.load_height_cm,
      payload.strategy || 'auto',
      payload.optimize_by || 'cost',
      payload.vehicle_preference,
      fleet
    );

    // Return API-compatible response
    return {
      strategy: result.strategy,
      hub: result.hub,
      vehicle: result.selectedVehicle,
      vehicle_instance_id: result.vehicleInstanceId,
      distance_km: result.totalDistance,
      time_min: result.totalTime,
      cost_inr: result.totalCost,
      original_cost_inr: result.originalCost,
      savings_inr: result.savings,
      optimal_route: result.optimalRoute,
      feasible_vehicles: result.feasibleVehicles,
      fleet_info: result.fleet,
      algorithm_details: result.algorithmDetails,
      message: result.message
    };
  } catch (error) {
    console.error('Optimization error:', error);
    throw new Error('Failed to optimize route');
  }
}

// Utility functions
export function getHubCoordinates(hubName: string): [number, number] | null {
  return HUBS[hubName] || null;
}

export function getAllHubs(): Record<string, [number, number]> {
  return { ...HUBS };
}

export function getVehicleSpecs(vehicleType: string) {
  return VEHICLES[vehicleType as keyof typeof VEHICLES] || null;
}

export function getFleetStatus(fleet?: VehicleInstance[]) {
  if (!fleet) {
    fleet = initializeFleet(HUBS);
  }
  
  return {
    totalVehicles: fleet.length,
    byType: fleet.reduce((acc, v) => {
      acc[v.typeName] = (acc[v.typeName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byHub: fleet.reduce((acc, v) => {
      acc[v.homeHub] = (acc[v.homeHub] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    availableCapacity: fleet.reduce((acc, v) => {
      if (!acc[v.typeName]) {
        acc[v.typeName] = { weight: 0, volume: 0, count: 0 };
      }
      acc[v.typeName].weight += v.remainingCapacityKg;
      acc[v.typeName].volume += v.remainingCapacityVolume;
      acc[v.typeName].count += 1;
      return acc;
    }, {} as Record<string, { weight: number; volume: number; count: number }>)
  };
}