import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package, Truck, ArrowRight } from 'lucide-react';

interface QuickQuoteData {
  pickup: string;
  delivery: string;
  vehicleType: string;
}

const QuickQuoteForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<QuickQuoteData>({
    pickup: '',
    delivery: '',
    vehicleType: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to booking form with pre-filled data
    navigate('/book', { state: formData });
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 hover:shadow-3xl transition-all duration-500">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Instant Quote</h3>
        <p className="text-gray-600">Fast, reliable, and cost-effective shipping solutions</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
            <input
              type="text"
              name="pickup"
              placeholder="Pickup Location"
              value={formData.pickup}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              required
            />
          </div>

          <div className="relative">
            <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-600 w-5 h-5" />
            <input
              type="text"
              name="delivery"
              placeholder="Delivery Destination"
              value={formData.delivery}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              required
            />
          </div>

          <div className="relative">
            <Truck className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-600 w-5 h-5" />
            <select
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 appearance-none bg-white"
              required
            >
              <option value="">Select Vehicle Type</option>
              <option value="2W">2-Wheeler</option>
              <option value="Van">Van</option>
              <option value="Tempo">Tempo</option>
              <option value="Truck">Truck</option>
              <option value="auto">Let Us Optimize</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center group"
        >
          Get Quote
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex justify-between text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">30%</div>
            <div className="text-xs text-gray-600">Cost Savings</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">24/7</div>
            <div className="text-xs text-gray-600">Support</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">Real-time</div>
            <div className="text-xs text-gray-600">Tracking</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickQuoteForm;