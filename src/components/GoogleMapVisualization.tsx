import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import { MapPin, Navigation, Maximize2, ToggleLeft, ToggleRight, Route, Info } from 'lucide-react';

interface GoogleMapVisualizationProps {
  pickup: [number, number];
  delivery: [number, number];
  route: [number, number][];
  hub?: string | null;
  result?: any;
}

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const GoogleMapVisualization: React.FC<GoogleMapVisualizationProps> = ({ 
  pickup, 
  delivery, 
  route, 
  hub, 
  result 
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [showAlgorithmRoute, setShowAlgorithmRoute] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Calculate map center and bounds
  const center = {
    lat: (pickup[0] + delivery[0]) / 2,
    lng: (pickup[1] + delivery[1]) / 2
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // Fit bounds to show all points
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: pickup[0], lng: pickup[1] });
    bounds.extend({ lat: delivery[0], lng: delivery[1] });
    
    if (hub && route.length > 2) {
      bounds.extend({ lat: route[1][0], lng: route[1][1] });
    }
    
    map.fitBounds(bounds, { padding: 50 });
  }, [pickup, delivery, route, hub]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Get Google Directions for real driving route
  useEffect(() => {
    if (!map || !window.google) return;

    const directionsService = new window.google.maps.DirectionsService();
    
    const waypoints = [];
    if (hub && route.length > 2) {
      waypoints.push({
        location: { lat: route[1][0], lng: route[1][1] },
        stopover: true
      });
    }

    directionsService.route(
      {
        origin: { lat: pickup[0], lng: pickup[1] },
        destination: { lat: delivery[0], lng: delivery[1] },
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false
      },
      (result, status) => {
        if (status === 'OK' && result) {
          setDirectionsResponse(result);
        } else {
          console.warn('Directions request failed:', status);
        }
      }
    );
  }, [map, pickup, delivery, route, hub]);

  const toggleRouteView = () => {
    setShowAlgorithmRoute(!showAlgorithmRoute);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getMarkerIcon = (type: 'pickup' | 'delivery' | 'hub') => {
    const colors = {
      pickup: '#10B981', // green
      delivery: '#EF4444', // red
      hub: '#3B82F6' // blue
    };
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: colors[type],
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 3,
      scale: 8
    };
  };

  const renderAlgorithmRoute = () => {
    if (!map || !showAlgorithmRoute || route.length < 2) return null;

    const path = route.map(coord => ({ lat: coord[0], lng: coord[1] }));
    
    return new window.google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#FF6B35',
      strokeOpacity: 1.0,
      strokeWeight: 4,
      map: map
    });
  };

  // Render algorithm route when toggled
  useEffect(() => {
    let polyline: google.maps.Polyline | null = null;
    
    if (map && showAlgorithmRoute && route.length >= 2) {
      const path = route.map(coord => ({ lat: coord[0], lng: coord[1] }));
      
      polyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#FF6B35',
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map: map
      });
    }

    return () => {
      if (polyline) {
        polyline.setMap(null);
      }
    };
  }, [map, showAlgorithmRoute, route]);

  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Google Maps API key not configured</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'h-96'}`}>
      <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={12}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            mapTypeId: 'hybrid',
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: false,
            zoomControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          }}
        >
          {/* Pickup Marker */}
          <Marker
            position={{ lat: pickup[0], lng: pickup[1] }}
            icon={getMarkerIcon('pickup')}
            onClick={() => setSelectedMarker('pickup')}
          />

          {/* Delivery Marker */}
          <Marker
            position={{ lat: delivery[0], lng: delivery[1] }}
            icon={getMarkerIcon('delivery')}
            onClick={() => setSelectedMarker('delivery')}
          />

          {/* Hub Marker */}
          {hub && route.length > 2 && (
            <Marker
              position={{ lat: route[1][0], lng: route[1][1] }}
              icon={getMarkerIcon('hub')}
              onClick={() => setSelectedMarker('hub')}
            />
          )}

          {/* Google Directions Route */}
          {directionsResponse && !showAlgorithmRoute && (
            <DirectionsRenderer
              directions={directionsResponse}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#4285F4',
                  strokeWeight: 4,
                  strokeOpacity: 0.8
                }
              }}
            />
          )}

          {/* Info Windows */}
          {selectedMarker === 'pickup' && (
            <InfoWindow
              position={{ lat: pickup[0], lng: pickup[1] }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2">
                <strong className="text-green-600">📦 Pickup Location</strong><br />
                Coordinates: {pickup[0].toFixed(6)}, {pickup[1].toFixed(6)}<br />
                {result?.vehicles?.pickupVehicle && `Vehicle: ${result.vehicles.pickupVehicle}`}<br />
                {result?.cargoSpecs && `Cargo: ${result.cargoSpecs.weight}kg, ${result.cargoSpecs.volume.toLocaleString()}cm³`}
              </div>
            </InfoWindow>
          )}

          {selectedMarker === 'delivery' && (
            <InfoWindow
              position={{ lat: delivery[0], lng: delivery[1] }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2">
                <strong className="text-red-600">🎯 Delivery Location</strong><br />
                Coordinates: {delivery[0].toFixed(6)}, {delivery[1].toFixed(6)}<br />
                {result?.vehicles?.deliveryVehicle && `Vehicle: ${result.vehicles.deliveryVehicle}`}<br />
                {result?.totalCost && `Total Cost: ₹${result.totalCost}`}
              </div>
            </InfoWindow>
          )}

          {selectedMarker === 'hub' && hub && route.length > 2 && (
            <InfoWindow
              position={{ lat: route[1][0], lng: route[1][1] }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2">
                <strong className="text-blue-600">🏢 {hub.charAt(0).toUpperCase() + hub.slice(1).replace('-', ' ')} Hub</strong><br />
                Coordinates: {route[1][0].toFixed(6)}, {route[1][1].toFixed(6)}<br />
                {result?.distancesKm?.pickupLeg && `From Pickup: ${result.distancesKm.pickupLeg} km`}<br />
                {result?.distancesKm?.deliveryLeg && `To Delivery: ${result.distancesKm.deliveryLeg} km`}<br />
                {result?.strategy?.includes('Hub') && `Strategy: ${result.strategy}`}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>📦 Pickup</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>🎯 Delivery</span>
          </div>
          {hub && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>🏢 Hub</span>
            </div>
          )}
        </div>
      </div>

      {/* Route Info */}
      {result && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-sm">
          <div className="space-y-1">
            <div>Distance: {result.totalDistance} km</div>
            <div>Time: {result.totalTime} min</div>
            <div>Cost: ₹{result.totalCost}</div>
            <div>Vehicle: {result.selectedVehicle}</div>
            {result.hub && <div>Hub: {result.hub.replace('-', ' ')}</div>}
            {result.savings && <div className="text-green-400">Savings: ₹{result.savings}</div>}
          </div>
        </div>
      )}

      {/* Route Toggle */}
      <div className="absolute top-4 right-16 bg-black bg-opacity-75 text-white p-2 rounded-lg">
        <button
          onClick={toggleRouteView}
          className="flex items-center space-x-2 text-sm hover:text-blue-400 transition-colors"
        >
          {showAlgorithmRoute ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          <span>{showAlgorithmRoute ? 'Algorithm Route' : 'Google Route'}</span>
        </button>
      </div>

      {/* Fullscreen Toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 bg-white p-2 rounded shadow hover:bg-gray-100"
      >
        <Maximize2 size={16} />
      </button>

      {/* Fullscreen Close Button */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 z-10"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default GoogleMapVisualization;