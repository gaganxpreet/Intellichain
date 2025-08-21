import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Truck, Clock, IndianRupee, CheckCircle, Star, Route, Package, Info } from 'lucide-react';
import GoogleMapComponent from '../components/GoogleMapComponent';

interface QuoteResultsState {
  pickup: string;
  delivery: string;
  pickupCoords: [number, number];
  deliveryCoords: [number, number];
  weight: number;
  length: number;
  width: number;
  height: number;
  volume: number;
  strategy: 'auto' | 'p2p';
  vehiclePreference: string;
  description: string;
  result: any;
}

const QuoteResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as QuoteResultsState;
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!state || !state.result) {
      navigate('/book');
    }
  }, [state, navigate]);

  if (!state || !state.result) {
    return null;
  }

  const { result } = state;

  const handleConfirmBooking = () => {
    setIsConfirming(true);
    
    // Generate a mock ticket ID
    const ticketId = `TC${Date.now().toString().slice(-8)}`;
    
    // Simulate booking confirmation delay
    setTimeout(() => {
      navigate(`/tracking/${ticketId}`, { 
        state: { 
          ...state, 
          ticketId,
          status: 'confirmed',
          confirmedAt: new Date().toISOString()
        } 
      });
    }, 2000);
  };

  const getSavingsInfo = () => {
    if (result.savings && result.originalCost) {
      return {
        savings: result.savings,
        percentage: Math.round((result.poolingDiscount || 0) * 100),
        originalCost: result.originalCost
      };
    }
    return null;
  };

  const savingsInfo = getSavingsInfo();

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Your Quote is Ready!
            </h1>
            <p className="text-xl text-gray-600">
              {result.message}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quote Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Status Banner */}
                <div className={`px-6 py-4 text-center ${
                  result.strategy.includes('Shared-Pooling')
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                } text-white`}>
                  <div className="flex items-center justify-center mb-2">
                    {result.strategy.includes('Shared-Pooling') ? (
                      <Star className="w-5 h-5 mr-2" />
                    ) : (
                      <Truck className="w-5 h-5 mr-2" />
                    )}
                    <span className="font-semibold">
                      {result.strategy.includes('Shared-Pooling') ? 
                        (result.strategy === 'Hub-Shared-Pooling' ? 'Hub Smart Pooling' : 'Direct Smart Pooling') 
                        : 'Direct P2P'}
                    </span>
                  </div>
                  {savingsInfo && (
                    <div className="text-sm opacity-90">
                      You save ₹{savingsInfo.savings} ({savingsInfo.percentage}% discount) - Original: ₹{savingsInfo.originalCost}
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Total Cost */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-2">
                      <IndianRupee className="w-8 h-8 text-gray-700 mr-1" />
                      <span className="text-4xl font-bold text-gray-900">
                        {result.totalCost}
                      </span>
                    </div>
                    <p className="text-gray-600">Total Shipping Cost</p>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center">
                        <Truck className="w-5 h-5 text-blue-600 mr-3" />
                        <span className="text-gray-700">Vehicle Type</span>
                      </div>
                      <span className="font-semibold text-gray-900">{result.selectedVehicle}</span>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center">
                        <Route className="w-5 h-5 text-green-600 mr-3" />
                        <span className="text-gray-700">Distance</span>
                      </div>
                      <span className="font-semibold text-gray-900">{result.totalDistance} km</span>
                    </div>

                    {result.totalTime && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 text-orange-600 mr-3" />
                          <span className="text-gray-700">Estimated Time</span>
                        </div>
                        <span className="font-semibold text-gray-900">{result.totalTime} min</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center">
                        <Route className="w-5 h-5 text-purple-600 mr-3" />
                        <span className="text-gray-700">Route Strategy</span>
                      </div>
                      <span className="font-semibold text-gray-900">{result.strategy}</span>
                    </div>

                    {result.vehicles && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="flex items-center">
                          <Truck className="w-5 h-5 text-indigo-600 mr-3" />
                          <span className="text-gray-700">Vehicle Assignment</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {result.vehicles.pickupVehicle === result.vehicles.deliveryVehicle 
                            ? result.vehicles.pickupVehicle 
                            : `${result.vehicles.pickupVehicle} → ${result.vehicles.deliveryVehicle}`}
                        </span>
                      </div>
                    )}

                    {result.cargoSpecs && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="flex items-center">
                          <Package className="w-5 h-5 text-green-600 mr-3" />
                          <span className="text-gray-700">Cargo Volume</span>
                        </div>
                        <span className="font-semibold text-gray-900">{result.cargoSpecs.volume.toLocaleString()} cm³</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleConfirmBooking}
                    disabled={isConfirming}
                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                  >
                    {isConfirming ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Confirming Booking...
                      </>
                    ) : (
                      <>
                        Confirm & Book This Shipment
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Route Breakdown */}
              {result.distancesKm && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Breakdown</h3>
                  <div className="space-y-3">
                    {result.distancesKm?.pickupLeg && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pickup to {result.hub ? 'Hub' : 'Delivery'}:</span>
                        <span className="font-medium">{result.distancesKm.pickupLeg} km</span>
                      </div>
                    )}
                    {result.distancesKm?.deliveryLeg && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hub to Delivery:</span>
                        <span className="font-medium">{result.distancesKm.deliveryLeg} km</span>
                      </div>
                    )}
                    {result.distancesKm?.directRouteKm && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Direct Route:</span>
                        <span className="font-medium">{result.distancesKm.directRouteKm} km</span>
                      </div>
                    )}
                    {result.distancesKm?.direct && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Direct Distance:</span>
                        <span className="font-medium">{result.distancesKm.direct} km</span>
                      </div>
                    )}
                    {result.distancesKm?.totalRouteKm && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Route:</span>
                        <span className="font-medium">{result.distancesKm.totalRouteKm} km</span>
                      </div>
                    )}
                    <hr />
                    <div className="flex justify-between font-semibold">
                      <span>Total Distance:</span>
                      <span>{result.totalDistance} km</span>
                    </div>
                    {savingsInfo && (
                      <>
                        <hr />
                        <div className="flex justify-between text-green-600 font-semibold">
                          <span>Total Savings:</span>
                          <span>₹{savingsInfo.savings} ({savingsInfo.percentage}%)</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Cargo Details */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cargo Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm">Weight</span>
                    <div className="font-medium">{state.weight} kg</div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Volume</span>
                    <div className="font-medium">{state.volume?.toLocaleString()} cm³</div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Dimensions</span>
                    <div className="font-medium">{state.length} × {state.width} × {state.height} cm</div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Strategy</span>
                    <div className="font-medium">{state.strategy === 'auto' ? 'Optimized' : 'Point-to-Point'}</div>
                  </div>
                </div>
                {state.description && (
                  <div className="mt-4">
                    <span className="text-gray-600 text-sm">Description</span>
                    <div className="font-medium">{state.description}</div>
                  </div>
                )}
              </div>

              {/* Algorithm Details */}
              {result.algorithmDetails && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Info className="w-5 h-5 text-blue-600 mr-2" />
                    Algorithm Analysis
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600 text-sm">Feasible Vehicles</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {result.feasibleVehicles.map((vehicle: string) => (
                          <span 
                            key={vehicle} 
                            className={`px-3 py-1 rounded-full text-sm ${
                              vehicle === result.selectedVehicle 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {vehicle} {vehicle === result.selectedVehicle && '✓'}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">Optimization Details</span>
                      <div className="text-sm bg-white px-3 py-2 rounded border mt-1">
                        <div>Optimized by: {result.algorithmDetails.optimizedBy}</div>
                        <div>Hubs considered: {result.algorithmDetails.hubsConsidered}</div>
                        <div>Route options: {result.algorithmDetails.routeOptions}</div>
                        {result.algorithmDetails.userPreference && (
                          <div>User preference: {result.algorithmDetails.userPreference}</div>
                        )}
                      </div>
                    </div>
                    {result.vehicleInstanceId && (
                      <div>
                        <span className="text-gray-600 text-sm">Vehicle Instance ID</span>
                        <div className="font-mono text-sm bg-white px-2 py-1 rounded border">
                          {result.vehicleInstanceId}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Map Visualization */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Route Visualization</h2>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">Pickup: {state.pickup}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">Delivery: {state.delivery}</span>
                    </div>
                    {result.hub && (
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-gray-600">Hub: {result.hub}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <GoogleMapComponent
                    pickup={state.pickupCoords}
                    delivery={state.deliveryCoords}
                    waypoints={result.hub && result.optimalRoute?.length > 2 ? [result.optimalRoute[1]] : []}
                    hub={result.hub}
                    result={result}
                    height="400px"
                  />
              </div>

              {/* Additional Info */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Why This Route?</h3>
                  <p className="text-gray-700">
                    Our algorithm selected this route based on {state.strategy === 'auto' ? 
                      (result.hub ? 'hub-based shared pooling for maximum cost savings' : 'direct shared pooling optimization') 
                      : 'fastest direct delivery'}. 
                    The chosen vehicle type ({result.selectedVehicle}) is perfectly suited for your cargo specifications.
                    {result.hub && (
                      <span className="block mt-2 text-sm text-blue-600 font-medium">
                        Route via {result.hub} hub enables cargo consolidation with other shipments.
                      </span>
                    )}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Next?</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Vehicle assignment within 15 minutes
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Driver contact & live tracking
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Real-time delivery updates
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteResults;