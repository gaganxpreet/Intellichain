import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Clock, Shield, Users, Star, CheckCircle } from 'lucide-react';
import QuickQuoteForm from '../components/QuickQuoteForm';

const LandingPage: React.FC = () => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-indigo-900/10 to-purple-900/10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  Seamless Cargo
                </span>
                <br />
                <span className="text-gray-900">
                  Connectivity Across
                </span>
                <br />
                <span className="text-orange-500">Delhi's Industrial Areas</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                Smart logistics algorithm that optimizes routes, reduces costs through shared pooling, 
                and connects you with the perfect vehicle for your cargo needs.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/book"
                  className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                >
                  Get Quote Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="inline-flex items-center justify-center border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-blue-600 hover:text-blue-600 transition-all duration-300">
                  How It Works
                </button>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">30%</div>
                  <div className="text-sm text-gray-600 mt-1">Cost Savings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">500+</div>
                  <div className="text-sm text-gray-600 mt-1">Vehicles</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">24/7</div>
                  <div className="text-sm text-gray-600 mt-1">Support</div>
                </div>
              </div>
            </div>

            <div className="animate-fade-in-delay">
              <QuickQuoteForm />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Why Choose Intelli-Chain?
            </h2>
            <p className="text-xl text-gray-600">
              Our smart logistics platform combines cutting-edge technology with local expertise 
              to deliver exceptional results for your cargo needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow">
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Cost-Effective</h3>
              <p className="text-gray-600">
                Smart pooling algorithm reduces costs by up to 30% through intelligent route optimization.
              </p>
            </div>

            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="bg-gradient-to-br from-green-100 to-green-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fast Delivery</h3>
              <p className="text-gray-600">
                Real-time tracking and optimized routes ensure your cargo reaches its destination quickly.
              </p>
            </div>

            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Reliable</h3>
              <p className="text-gray-600">
                Verified drivers and vehicles with comprehensive insurance coverage for peace of mind.
              </p>
            </div>

            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Shared Pooling</h3>
              <p className="text-gray-600">
                Maximize efficiency and minimize costs through our intelligent cargo pooling system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, fast, and efficient. Get your cargo moving in just a few steps.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center relative">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-lg">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Enter Details</h3>
              <p className="text-gray-600">
                Provide pickup location, delivery destination, and cargo specifications.
              </p>
              {/* Connection Line */}
              <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 to-transparent transform -translate-x-6"></div>
            </div>

            <div className="text-center relative">
              <div className="bg-gradient-to-br from-green-600 to-green-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-lg">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Get Quote</h3>
              <p className="text-gray-600">
                Our algorithm calculates the best route and pricing options for your shipment.
              </p>
              <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-green-300 to-transparent transform -translate-x-6"></div>
            </div>

            <div className="text-center relative">
              <div className="bg-gradient-to-br from-orange-600 to-orange-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-lg">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Track Live</h3>
              <p className="text-gray-600">
                Monitor your shipment in real-time with GPS tracking and status updates.
              </p>
              <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-orange-300 to-transparent transform -translate-x-6"></div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-lg">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivered</h3>
              <p className="text-gray-600">
                Your cargo arrives safely at its destination with confirmation and receipt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              What Our Customers Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6">
                "Intelli-Chain saved us 40% on shipping costs while maintaining excellent delivery times. 
                The shared pooling feature is a game-changer."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-semibold">
                  RK
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">Rajesh Kumar</div>
                  <div className="text-gray-600 text-sm">Manufacturing Manager</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6">
                "Real-time tracking and professional drivers make Intelli-Chain our go-to logistics partner. 
                Highly recommended!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-semibold">
                  PS
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">Priya Sharma</div>
                  <div className="text-gray-600 text-sm">Supply Chain Director</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-2xl hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6">
                "The platform is intuitive and the customer service is outstanding. 
                Our delivery efficiency has improved significantly."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-700 rounded-full flex items-center justify-center text-white font-semibold">
                  AS
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">Amit Singh</div>
                  <div className="text-gray-600 text-sm">Logistics Coordinator</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Logistics?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses who trust Intelli-Chain for their cargo delivery needs.
          </p>
          <Link
            to="/book"
            className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
          >
            Start Your Shipment
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;