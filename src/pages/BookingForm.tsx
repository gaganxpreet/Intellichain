import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Package, Truck, Calculator, ArrowRight, Info } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete';
import { logisticsAlgorithm, geocodeAddress, initializeFleet, getAllHubs } from '../utils/logistics-algorithm';

interface BookingFormData {
  pickup: string;
  delivery: string;
  pickupCoords?: [number, number];
  deliveryCoords?: [number, number];
  weight: number;
  length: number;
  width: number;
  height: number;
  volume: number;
  strategy: 'auto' | 'p2p';
  vehiclePreference: string;
  description: string;
}

const BookingForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledData = location.state as any;

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    pickup: prefilledData?.pickup || '',
    delivery: prefilledData?.delivery || '',
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
    volume: 0,
    strategy: 'auto',
    vehiclePreference: prefilledData?.vehicleType || '',
    description: ''
  });

  const [feasibleVehicles, setFeasibleVehicles] = useState<string[]>([]);
  const [showVolumeWarning, setShowVolumeWarning] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Calculate volume when dimensions change
  useEffect(() => {
    const volume = formData.length * formData.width * formData.height;
    setFormData(prev => ({ ...prev, volume }));
    
    // Check feasible vehicles
    if (formData.weight > 0 && volume > 0) {
      const feasible = getFeasibleVehicleTypes(formData.weight, [formData.length, formData.width, formData.height]);
      setFeasibleVehicles(feasible);
      
      if (feasible.length === 0) {
        setShowVolumeWarning(true);
      } else {
        setShowVolumeWarning(false);
      }
    }
  }, [formData.length, formData.width, formData.height, formData.weight]);

  const getFeasibleVehicleTypes = (weightKg: number, dimensions: [number, number, number]): string[] => {
    const vehicles = {
      '2W': { maxWeight: 5, maxDims: [30, 30, 15], maxVolume: 13500 },
      'Van': { maxWeight: 750, maxDims: [120, 100, 100], maxVolume: 1200000 },
      'Tempo': { maxWeight: 1200, maxDims: [180, 140, 130], maxVolume: 3276000 },
      'Truck': { maxWeight: 5000, maxDims: [300, 200, 200], maxVolume: 12000000 }
    };

    const [l, w, h] = dimensions;
    const volume = l * w * h;

    return Object.entries(vehicles).filter(([_, spec]) => {
      return weightKg <= spec.maxWeight &&
             volume <= spec.maxVolume &&
             l <= spec.maxDims[0] &&
             w <= spec.maxDims[1] &&
             h <= spec.maxDims[2];
    }).map(([name, _]) => name);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'weight' || name === 'length' || name === 'width' || name === 'height' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handlePickupPlaceSelect = (place: { address: string; coordinates: [number, number] }) => {
    setFormData(prev => ({ ...prev, pickup: place.address }));
    setPickupCoords(place.coordinates);
  };

  const handleDeliveryPlaceSelect = (place: { address: string; coordinates: [number, number] }) => {
    setFormData(prev => ({ ...prev, delivery: place.address }));
    setDeliveryCoords(place.coordinates);
  };

  const calculateVolume = () => {
    const volume = formData.length * formData.width * formData.height;
    setFormData(prev => ({ ...prev, volume }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Starting geocoding for addresses...');
      console.log('Pickup address:', formData.pickup);
      console.log('Delivery address:', formData.delivery);
      
      // Validate addresses before geocoding
      if (!formData.pickup.trim() || !formData.delivery.trim()) {
        alert('Please enter both pickup and delivery addresses.');
        return;
      }

      if (formData.weight <= 0 || formData.length <= 0 || formData.width <= 0 || formData.height <= 0) {
        alert('Please enter valid cargo dimensions and weight.');
        return;
      }

      // Use coordinates from Places Autocomplete or fallback to geocoding
      let finalPickupCoords = pickupCoords;
      let finalDeliveryCoords = deliveryCoords;

      if (!finalPickupCoords) {
        console.log('Geocoding pickup address...');
        finalPickupCoords = await geocodeAddress(formData.pickup);
        if (!finalPickupCoords) {
          setIsLoading(false);
          return;
        }
      }

      if (!finalDeliveryCoords) {
        console.log('Geocoding delivery address...');
        finalDeliveryCoords = await geocodeAddress(formData.delivery);
        if (!finalDeliveryCoords) {
          setIsLoading(false);
          return;
        }
      }

      console.log('Final pickup coordinates:', finalPickupCoords);
      console.log('Final delivery coordinates:', finalDeliveryCoords);

      console.log('Running logistics algorithm with coordinates...');
      // Run logistics algorithm
      const fleet = initializeFleet(getAllHubs());
      const result = logisticsAlgorithm(
        finalPickupCoords,
        finalDeliveryCoords,
        formData.weight,
        formData.length,
        formData.width,
        formData.height,
        formData.strategy,
        'cost',
        formData.vehiclePreference || undefined,
        fleet
      );

      console.log('Algorithm result:', result);

      if (!result || result.message === 'Shipment not possible') {
        alert('Unable to find a suitable route for your shipment. Please check cargo specifications.');
        return;
      }

      // Navigate to quote results with the algorithm result
      navigate('/quote', { 
        state: { 
          ...formData, 
          pickupCoords: finalPickupCoords,
          deliveryCoords: finalDeliveryCoords,
          result 
        } 
      });
    } catch (error) {
      console.error('Error calculating quote:', error);
      alert('Error calculating quote. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Calculating optimal route and pricing..." />;
  }

  if (!apiKey) {
    return <div className="min-h-screen flex items-center justify-center"><p>Google Maps API key not configured</p></div>;
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Book Your Shipment
            </h1>
            <p className="text-xl text-gray-600">
              Get the best rates with our intelligent logistics algorithm
            </p>
          </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Section A: Shipment Details */}
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <MapPin className="w-6 h-6 text-blue-600 mr-2" />
                Shipment Details
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Location *
                  </label>
                  <GooglePlacesAutocomplete
                    value={formData.pickup}
                    onChange={(value) => setFormData(prev => ({ ...prev, pickup: value }))}
                    onPlaceSelect={handlePickupPlaceSelect}
                    placeholder="Enter pickup address"
                    icon={<MapPin className="w-5 h-5" />}
                  />
                  {pickupCoords && (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ Located: {pickupCoords[0].toFixed(6)}, {pickupCoords[1].toFixed(6)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Destination *
                  </label>
                  <GooglePlacesAutocomplete
                    value={formData.delivery}
                    onChange={(value) => setFormData(prev => ({ ...prev, delivery: value }))}
                    onPlaceSelect={handleDeliveryPlaceSelect}
                    placeholder="Enter delivery address"
                    icon={<MapPin className="w-5 h-5" />}
                  />
                  {deliveryCoords && (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ Located: {deliveryCoords[0].toFixed(6)}, {deliveryCoords[1].toFixed(6)}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your cargo..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Section B: Cargo Specifications */}
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Package className="w-6 h-6 text-green-600 mr-2" />
                Cargo Specifications
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight || ''}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Length (cm) *
                  </label>
                  <input
                    type="number"
                    name="length"
                    value={formData.length || ''}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Width (cm) *
                  </label>
                  <input
                    type="number"
                    name="width"
                    value={formData.width || ''}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (cm) *
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height || ''}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={calculateVolume}
                  className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Volume: {formData.volume.toLocaleString()} cm³
                </button>
              </div>

              {/* Vehicle Compatibility */}
              {feasibleVehicles.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl">
                  <h4 className="font-medium text-green-800 mb-2">Compatible Vehicles:</h4>
                  <div className="flex flex-wrap gap-2">
                    {feasibleVehicles.map(vehicle => (
                      <span key={vehicle} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {vehicle}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {showVolumeWarning && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center">
                    <Info className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-red-800 font-medium">
                      Warning: Your cargo exceeds the maximum capacity for all available vehicles.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Section C: Service Type */}
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Truck className="w-6 h-6 text-orange-600 mr-2" />
                Service Type
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <label className="relative">
                  <input
                    type="radio"
                    name="strategy"
                    value="auto"
                    checked={formData.strategy === 'auto'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.strategy === 'auto' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <h3 className="font-semibold text-lg mb-2">Let Us Optimize (Recommended)</h3>
                    <p className="text-gray-600">
                      Get the best price using our smart pooling algorithm. Save up to 30% with shared routes.
                    </p>
                    <div className="mt-3 flex items-center text-blue-600 text-sm font-medium">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      Best Value
                    </div>
                  </div>
                </label>

                <label className="relative">
                  <input
                    type="radio"
                    name="strategy"
                    value="p2p"
                    checked={formData.strategy === 'p2p'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.strategy === 'p2p' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <h3 className="font-semibold text-lg mb-2">Direct Point-to-Point</h3>
                    <p className="text-gray-600">
                      Fastest delivery with a dedicated vehicle. No sharing, direct route to destination.
                    </p>
                    <div className="mt-3 flex items-center text-green-600 text-sm font-medium">
                      <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                      Fastest
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Section D: Vehicle Preference */}
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Vehicle Type Preference
              </h2>
              
              <select
                name="vehiclePreference"
                value={formData.vehiclePreference}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Suggest for me</option>
                <option value="2W" disabled={!feasibleVehicles.includes('2W')}>
                  2-Wheeler {!feasibleVehicles.includes('2W') && '(Not suitable)'}
                </option>
                <option value="Van" disabled={!feasibleVehicles.includes('Van')}>
                  Van {!feasibleVehicles.includes('Van') && '(Not suitable)'}
                </option>
                <option value="Tempo" disabled={!feasibleVehicles.includes('Tempo')}>
                  Tempo {!feasibleVehicles.includes('Tempo') && '(Not suitable)'}
                </option>
                <option value="Truck" disabled={!feasibleVehicles.includes('Truck')}>
                  Truck {!feasibleVehicles.includes('Truck') && '(Not suitable)'}
                </option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="p-8">
              <button
                type="submit"
                disabled={feasibleVehicles.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
              >
                Calculate Price & Route
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;