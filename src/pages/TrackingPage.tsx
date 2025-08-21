import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Truck, MapPin, Clock, CheckCircle, Phone, User, Package, Route } from 'lucide-react';

interface TrackingState {
  ticketId: string;
  pickup: string;
  delivery: string;
  result: any;
  status: string;
  confirmedAt: string;
}

const TrackingPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const location = useLocation();
  const state = location.state as TrackingState;
  
  const [currentStatus, setCurrentStatus] = useState('confirmed');
  const [driverAssigned, setDriverAssigned] = useState(false);

  // Simulate status progression
  useEffect(() => {
    const statusProgression = [
      { status: 'confirmed', delay: 0 },
      { status: 'vehicle_assigned', delay: 5000 },
      { status: 'pickup_initiated', delay: 10000 },
      { status: 'in_transit', delay: 15000 },
      { status: 'out_for_delivery', delay: 20000 }
    ];

    statusProgression.forEach(({ status, delay }) => {
      setTimeout(() => {
        setCurrentStatus(status);
        if (status === 'vehicle_assigned') {
          setDriverAssigned(true);
        }
      }, delay);
    });
  }, []);

  const getStatusInfo = (status: string) => {
    const statusMap = {
      confirmed: { label: 'Booking Confirmed', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      vehicle_assigned: { label: 'Vehicle Assigned', color: 'text-green-600', bgColor: 'bg-green-100' },
      pickup_initiated: { label: 'Going to Pickup', color: 'text-orange-600', bgColor: 'bg-orange-100' },
      in_transit: { label: 'In Transit', color: 'text-purple-600', bgColor: 'bg-purple-100' },
      out_for_delivery: { label: 'Out for Delivery', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
      delivered: { label: 'Delivered', color: 'text-green-600', bgColor: 'bg-green-100' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.confirmed;
  };

  const mockDriver = {
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    vehicle: 'DL 8C AB 1234',
    rating: 4.8,
    trips: 1247
  };

  if (!state && !ticketId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Tracking Link</h1>
          <p className="text-gray-600">Please check your ticket ID and try again.</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(currentStatus);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Track Your Shipment
            </h1>
            <p className="text-xl text-gray-600">
              Ticket ID: <span className="font-mono font-semibold">{ticketId}</span>
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Status Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Status Card */}
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${statusInfo.bgColor} rounded-full mb-4`}>
                    <Truck className={`w-8 h-8 ${statusInfo.color}`} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{statusInfo.label}</h2>
                  <p className="text-gray-600">
                    {currentStatus === 'confirmed' && 'Your booking has been confirmed and we\'re finding the perfect vehicle.'}
                    {currentStatus === 'vehicle_assigned' && 'A driver has been assigned to your shipment!'}
                    {currentStatus === 'pickup_initiated' && 'Driver is on the way to pickup location.'}
                    {currentStatus === 'in_transit' && 'Your cargo is being transported to the destination.'}
                    {currentStatus === 'out_for_delivery' && 'Driver is approaching the delivery location.'}
                  </p>
                </div>

                {/* Status Timeline */}
                <div className="space-y-4">
                  {[
                    { key: 'confirmed', label: 'Request Received', icon: CheckCircle },
                    { key: 'vehicle_assigned', label: 'Vehicle Assigned', icon: Truck },
                    { key: 'pickup_initiated', label: 'Going to Pickup', icon: MapPin },
                    { key: 'in_transit', label: 'In Transit', icon: Route },
                    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Package },
                    { key: 'delivered', label: 'Delivered', icon: CheckCircle }
                  ].map((step, index) => {
                    const isCompleted = ['confirmed', 'vehicle_assigned', 'pickup_initiated', 'in_transit', 'out_for_delivery'].slice(0, ['confirmed', 'vehicle_assigned', 'pickup_initiated', 'in_transit', 'out_for_delivery'].indexOf(currentStatus) + 1).includes(step.key);
                    const isActive = step.key === currentStatus;
                    const Icon = step.icon;

                    return (
                      <div key={step.key} className="flex items-center">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-200'
                        }`}>
                          <Icon className={`w-5 h-5 ${isCompleted || isActive ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className={`font-medium ${isCompleted ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                            {step.label}
                          </div>
                          {isCompleted && step.key === 'confirmed' && (
                            <div className="text-sm text-gray-500 mt-1">
                              {new Date().toLocaleString()}
                            </div>
                          )}
                          {isActive && step.key === 'vehicle_assigned' && (
                            <div className="text-sm text-gray-500 mt-1">
                              Driver assigned just now
                            </div>
                          )}
                        </div>
                        {index < 5 && (
                          <div className={`absolute ml-5 mt-10 w-0.5 h-8 ${isCompleted ? 'bg-green-300' : 'bg-gray-200'}`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Map Placeholder */}
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900">Live Map</h3>
                  <p className="text-gray-600">Real-time vehicle location</p>
                </div>
                <div className="h-80 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {!driverAssigned 
                        ? 'Vehicle location will appear once driver is assigned'
                        : 'Live tracking will begin once driver starts journey'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Shipment Info */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipment Details</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">From</div>
                    <div className="font-medium">{state?.pickup || 'Pickup Location'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">To</div>
                    <div className="font-medium">{state?.delivery || 'Delivery Location'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Vehicle</div>
                    <div className="font-medium">{state?.result?.selectedVehicle || 'Van'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Cost</div>
                    <div className="font-medium text-green-600">₹{state?.result?.totalCost || '450'}</div>
                  </div>
                </div>
              </div>

              {/* Driver Info */}
              {driverAssigned && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Information</h3>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-semibold">
                      {mockDriver.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{mockDriver.name}</div>
                      <div className="text-sm text-gray-600">{mockDriver.trips} trips completed</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Rating</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">{mockDriver.rating}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-sm ${i < Math.floor(mockDriver.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Vehicle</span>
                      <span className="font-medium font-mono">{mockDriver.vehicle}</span>
                    </div>
                  </div>

                  <button className="w-full mt-4 bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Driver
                  </button>
                </div>
              )}

              {/* Support */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
                <p className="text-gray-700 mb-4 text-sm">
                  Our support team is available 24/7 to assist you with any questions about your shipment.
                </p>
                <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;