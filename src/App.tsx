import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import BookingForm from './pages/BookingForm';
import QuoteResults from './pages/QuoteResults';
import TrackingPage from './pages/TrackingPage';
import Header from './components/Header';
import './styles/animations.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <Header />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/book" element={<BookingForm />} />
          <Route path="/quote" element={<QuoteResults />} />
          <Route path="/tracking/:ticketId" element={<TrackingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;