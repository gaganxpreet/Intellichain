import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Truck, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg group-hover:scale-105 transition-transform duration-200">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              Intelli-Chain
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`font-medium transition-colors duration-200 hover:text-blue-600 ${
                isActive('/') ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              Home
            </Link>
            <Link
              to="/book"
              className={`font-medium transition-colors duration-200 hover:text-blue-600 ${
                isActive('/book') ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              Book Shipment
            </Link>
            <Link
              to="/optimizer"
              className={`font-medium transition-colors duration-200 hover:text-blue-600 ${
                isActive('/optimizer') ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              Optimizer
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg animate-slide-down">
            <div className="px-4 py-4 space-y-4">
              <Link
                to="/"
                className="block font-medium text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/book"
                className="block font-medium text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Book Shipment
              </Link>
              <Link
                to="/optimizer"
                className="block font-medium text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Optimizer
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;