import React, { useState } from 'react';
import { Calculator, MapPin, Package, Truck, Route, Clock, IndianRupee, Zap, Target, Info } from 'lucide-react';
import GoogleMapVisualization from '../components/GoogleMapVisualization';
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete';
import { logisticsAlgorithm, geocodeAddress, getFleetStatus, initializeFleet, getAllHubs } from '../utils/logistics-algorithm';
import LoadingSpinner from '../components/LoadingSpinner';

interface OptimizerFormData {
  pickupAddress: string;
  deliveryAddress: string;
  pickupCoords: [number, number] | null;
  deliveryCoords: [number, number] | null;
  loadWeight: number;
  loadLength: number;
  loadWidth: number;
  loadHeight: number;
  strategy: 'auto' | 'p2p';
  optimizeBy: 'cost' | 'time';
  vehiclePreference: string;
}

interface OptimizationResult {
  strategy: string;
  hub: string | null;
  selectedVehicle: string;
  vehicleInstanceId: string;
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  originalCost?: number;
  savings?: number;
  optimalRoute: [number, number][];
  feasibleVehicles: string[];
  fleet: any;
  algorithmDetails: any;
  message: string;
}

const LogisticsOptimizer: React.FC = () => {
  const [formData, setFormData] = useState<OptimizerFormData>({
    pickupAddress: '',
    deliveryAddress: '',
    pickupCoords: null,
    deliveryCoords: null,
    loadWeight: 0,
    loadLength: 0,
    loadWidth: 0,
    loadHeight: 0,
    strategy: 'auto',
    optimizeBy: 'cost',
    vehiclePreference: ''
  });

  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fleetStatus, setFleetStatus] = useState<any>(null);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Load fleet status on component mount
  React.useEffect(() => {
    const fleet = initializeFleet(getAllHubs());
    setFleetStatus(getFleetStatus(fleet));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('load') && name !== 'loadAddress' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handlePickupPlaceSelect = (place: { address: string; coordinates: [number, number] }) => {
    setFormData(prev => ({ ...prev, pickupAddress: place.address, pickupCoords: place.coordinates }));
    setPickupCoords(place.coordinates);
  };

  const handleDeliveryPlaceSelect = (place: { address: string; coordinates: [number, number] }) => {
    setFormData(prev => ({ ...prev, deliveryAddress: place.address, deliveryCoords: place.coordinates }));
    setDeliveryCoords(place.coordinates);
  };

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate inputs
      if (!formData.pickupAddress.trim() || !formData.deliveryAddress.trim()) {
        alert('Please enter both pickup and delivery addresses.');
        return;
      }

      if (formData.loadWeight <= 0 || formData.loadLength <= 0 || formData.loadWidth <= 0 || formData.loadHeight <= 0) {
        alert('Please enter valid cargo dimensions and weight.');
        return;
      }

      // Geocode addresses if not already done
      let finalPickupCoords = pickupCoords || formData.pickupCoords;
      let finalDeliveryCoords = deliveryCoords || formData.deliveryCoords;

      if (!finalPickupCoords) {
        finalPickupCoords = await geocodeAddress(formData.pickupAddress);
        if (!finalPickupCoords) return;
      }

      if (!finalDeliveryCoords) {
        finalDeliveryCoords = await geocodeAddress(formData.deliveryAddress);
        if (!finalDeliveryCoords) return;
      }

      // Update form data with final coordinates
      setFormData(prev => ({
        ...prev,
        pickupCoords: finalPickupCoords,
        deliveryCoords: finalDeliveryCoords
      }));
      
      setPickupCoords(finalPickupCoords);
      setDeliveryCoords(finalDeliveryCoords);

      // Run optimization algorithm
      const fleet = initializeFleet(getAllHubs());
      const optimizationResult = logisticsAlgorithm(
        finalPickupCoords,
        finalDeliveryCoords,
        formData.loadWeight,
        formData.loadLength,
        formData.loadWidth,
        formData.loadHeight,
        formData.strategy,
        formData.optimizeBy,
        formData.vehiclePreference || undefined,
        fleet
      );

      if (optimizationResult.message === 'Shipment not possible') {
        alert('Unable to find a suitable route for your shipment. Please check cargo specifications.');
        return;
      }

      setResult(optimizationResult as OptimizationResult);

    } catch (error) {
      console.error('Optimization error:', error);
      alert('Error during optimization. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Optimizing your logistics route..." />;
  }

  if (!apiKey) {
    return <div className="min-h-screen flex items-center justify-center"><p>Google Maps API key not configured</p></div>;
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6">
              <Calculator className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Logistics Optimizer
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Advanced route optimization with dynamic fleet management and intelligent hub selection
            </p>
          </div>

            <div className="grid lg:grid-cols-3 gap-8">
            {/* Optimizer Form */}
              <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Target className="w-6 h-6 text-blue-400 mr-2" />
                  Route Optimizer
                </h2>

                <form onSubmit={handleOptimize} className="space-y-6">
                  {/* Addresses */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-100 mb-2">
                        Pickup Address *
                      </label>
                      <GooglePlacesAutocomplete
                          value={formData.pickupAddress}
                          onChange={(value) => setFormData(prev => ({ ...prev, pickupAddress: value }))}
                          onPlaceSelect={handlePickupPlaceSelect}
                          placeholder="Enter pickup location"
                          className="bg-white/10 border-white/20 text-white placeholder-blue-200 focus:ring-blue-400"
                        />
                      {pickupCoords && (
                        <div className="text-xs text-green-400 mt-1">
                          ✓ Located: {pickupCoords[0].toFixed(6)}, {pickupCoords[1].toFixed(6)}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-100 mb-2">
                        Delivery Address *
                      </label>
                      <GooglePlacesAutocomplete
                          value={formData.deliveryAddress}
                          onChange={(value) => setFormData(prev => ({ ...prev, deliveryAddress: value }))}
                          onPlaceSelect={handleDeliveryPlaceSelect}
                          placeholder="Enter delivery location"
                          className="bg-white/10 border-white/20 text-white placeholder-blue-200 focus:ring-blue-400"
                        />
                      {deliveryCoords && (
                        <div className="text-xs text-green-400 mt-1">
                          ✓ Located: {deliveryCoords[0].toFixed(6)}, {deliveryCoords[1].toFixed(6)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cargo Specifications */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Package className="w-5 h-5 text-green-400 mr-2" />
                      Cargo Specifications
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-100 mb-2">Weight (kg) *</label>
                        <input
                          type="number"
                          name="loadWeight"
                          value={formData.loadWeight || ''}
                          onChange={handleInputChange}
                          placeholder="0"
                          min="0"
                          step="0.1"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-100 mb-2">Length (cm) *</label>
                        <input
                          type="number"
                          name="loadLength"
                          value={formData.loadLength || ''}
                          onChange={handleInputChange}
                          placeholder="0"
                          min="0"
                          step="0.1"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-100 mb-2">Width (cm) *</label>
                        <input
                          type="number"
                          name="loadWidth"
                          value={formData.loadWidth || ''}
                          onChange={handleInputChange}
                          placeholder="0"
                          min="0"
                          step="0.1"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-100 mb-2">Height (cm) *</label>
                        <input
                          type="number"
                          name="loadHeight"
                          value={formData.loadHeight || ''}
                          onChange={handleInputChange}
                          placeholder="0"
                          min="0"
                          step="0.1"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div className="text-sm text-blue-200">
                      Volume: {(formData.loadLength * formData.loadWidth * formData.loadHeight).toLocaleString()} cm³
                    </div>
                  </div>

                  {/* Optimization Options */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Zap className="w-5 h-5 text-yellow-400 mr-2" />
                      Optimization Options
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-blue-100 mb-2">Strategy</label>
                      <select
                        name="strategy"
                        value={formData.strategy}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        style={{ color: '#fff' }}
                      >
                        <option value="auto" style={{ color: '#000', backgroundColor: '#fff' }}>Auto Optimize (Recommended)</option>
                        <option value="p2p" style={{ color: '#000', backgroundColor: '#fff' }}>Point-to-Point Direct</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-100 mb-2">Optimize By</label>
                      <select
                        name="optimizeBy"
                        value={formData.optimizeBy}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        style={{ color: '#fff' }}
                      >
                        <option value="cost" style={{ color: '#000', backgroundColor: '#fff' }}>Cost Efficiency</option>
                        <option value="time" style={{ color: '#000', backgroundColor: '#fff' }}>Time Efficiency</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-100 mb-2">Vehicle Preference</label>
                      <select
                        name="vehiclePreference"
                        value={formData.vehiclePreference}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        style={{ color: '#fff' }}
                      >
                        <option value="" style={{ color: '#000', backgroundColor: '#fff' }}>Auto Select</option>
                        <option value="2W" style={{ color: '#000', backgroundColor: '#fff' }}>2-Wheeler</option>
                        <option value="Van" style={{ color: '#000', backgroundColor: '#fff' }}>Van</option>
                        <option value="Tempo" style={{ color: '#000', backgroundColor: '#fff' }}>Tempo</option>
                        <option value="Truck" style={{ color: '#000', backgroundColor: '#fff' }}>Truck</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center group"
                  >
                    <Calculator className="w-5 h-5 mr-2" />
                    Optimize Route
                    <Zap className="ml-2 w-5 h-5 group-hover:animate-pulse" />
                  </button>
                </form>

                {/* Fleet Status */}
                {fleetStatus && (
                  <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                      <Truck className="w-4 h-4 text-blue-400 mr-2" />
                      Fleet Status
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(fleetStatus.byType).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-blue-200">
                          <span>{type}:</span>
                          <span>{count as number}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-blue-300 mt-2">
                      Total: {fleetStatus.totalVehicles} vehicles
                    </div>
                  </div>
                )}
              </div>
              </div>

              {/* Results */}
              <div className="lg:col-span-2">
              {result ? (
                <div className="space-y-6">
                  {/* Results Summary */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <Route className="w-6 h-6 text-green-400 mr-2" />
                      Optimization Results
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <IndianRupee className="w-8 h-8 text-green-400 mr-1" />
                          <span className="text-3xl font-bold text-white">
                            {result.totalCost}
                          </span>
                        </div>
                        <p className="text-blue-200">Total Cost</p>
                        {result.savings && (
                          <p className="text-green-400 text-sm">
                            Saved ₹{result.savings}
                          </p>
                        )}
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Route className="w-8 h-8 text-blue-400 mr-1" />
                          <span className="text-3xl font-bold text-white">
                            {result.totalDistance}
                          </span>
                        </div>
                        <p className="text-blue-200">Distance (km)</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Clock className="w-8 h-8 text-orange-400 mr-1" />
                          <span className="text-3xl font-bold text-white">
                            {result.totalTime}
                          </span>
                        </div>
                        <p className="text-blue-200">Time (min)</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Route Details</h4>
                        <div className="space-y-2 text-blue-200">
                          <div className="flex justify-between">
                            <span>Strategy:</span>
                            <span className="text-white font-medium">{result.strategy}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Vehicle:</span>
                            <span className="text-white font-medium">{result.selectedVehicle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Vehicle ID:</span>
                            <span className="text-white font-mono text-sm">{result.vehicleInstanceId}</span>
                          </div>
                          {result.hub && (
                            <div className="flex justify-between">
                              <span>Hub:</span>
                              <span className="text-white font-medium">{result.hub}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Feasible Vehicles</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.feasibleVehicles.map(vehicle => (
                            <span 
                              key={vehicle} 
                              className={`px-3 py-1 rounded-full text-sm ${
                                vehicle === result.selectedVehicle 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-white/20 text-blue-200'
                              }`}
                            >
                              {vehicle} {vehicle === result.selectedVehicle && '✓'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-green-500/20 rounded-xl border border-green-500/30">
                      <div className="flex items-center text-green-400 mb-2">
                        <Info className="w-5 h-5 mr-2" />
                        <span className="font-semibold">Optimization Result</span>
                      </div>
                      <p className="text-green-100">{result.message}</p>
                    </div>
                  </div>

                  {/* Interactive Map */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/20">
                      <h3 className="text-xl font-bold text-white">Interactive Route Map</h3>
                      <p className="text-blue-200">Optimized route visualization with real-time data</p>
                    </div>
                    <div className="h-96">
                      <GoogleMapVisualization
                        pickup={formData.pickupCoords!}
                        delivery={formData.deliveryCoords!}
                        route={result.optimalRoute}
                        hub={result.hub}
                        result={result}
                      />
                    </div>
                  </div>

                  {/* Algorithm Details */}
                  {result.algorithmDetails && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 shadow-2xl">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <Info className="w-6 h-6 text-purple-400 mr-2" />
                        Algorithm Analysis
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3">Optimization Details</h4>
                          <div className="space-y-2 text-blue-200">
                            <div className="flex justify-between">
                              <span>Optimized By:</span>
                              <span className="text-white">{result.algorithmDetails.optimizedBy}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Hubs Considered:</span>
                              <span className="text-white">{result.algorithmDetails.hubsConsidered}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Route Options:</span>
                              <span className="text-white">{result.algorithmDetails.routeOptions}</span>
                            </div>
                            {result.algorithmDetails.userPreference && (
                              <div className="flex justify-between">
                                <span>User Preference:</span>
                                <span className="text-white">{result.algorithmDetails.userPreference}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3">Fleet Utilization</h4>
                          <div className="space-y-2 text-blue-200">
                            <div className="flex justify-between">
                              <span>Total Fleet:</span>
                              <span className="text-white">{result.algorithmDetails.fleetUtilization.totalFleet}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Feasible Vehicles:</span>
                              <span className="text-white">{result.algorithmDetails.fleetUtilization.feasibleVehicles}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Available Vehicles:</span>
                              <span className="text-white">{result.algorithmDetails.fleetUtilization.availableVehicles}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-12 shadow-2xl text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calculator className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Ready to Optimize</h3>
                  <p className="text-blue-200 text-lg">
                    Enter your pickup and delivery details to get started with route optimization.
                  </p>
                </div>
              )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsOptimizer;