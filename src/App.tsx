import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import LandingPage from './pages/LandingPage';
import BookingForm from './pages/BookingForm';
import QuoteResults from './pages/QuoteResults';
import TrackingPage from './pages/TrackingPage';
import LogisticsOptimizer from './pages/LogisticsOptimizer';
import Header from './components/Header';
import './styles/animations.css';

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Configuration Required</h1>
          <p className="text-gray-600">Google Maps API key not configured</p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
          <Header />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/book" element={<BookingForm />} />
            <Route path="/quote" element={<QuoteResults />} />
            <Route path="/tracking/:ticketId" element={<TrackingPage />} />
            <Route path="/optimizer" element={<LogisticsOptimizer />} />
          </Routes>
        </div>
      </Router>
    </LoadScript>
  );
}

export default App;