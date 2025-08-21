import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import { MapPin, Navigation, Maximize2, ToggleLeft, ToggleRight, Route, Info } from 'lucide-react';

interface GoogleMapVisualizationProps {
  pickup: [number, number];
  delivery: [number, number];
  route: [number, number][];
  hub?: string | null;
  result?: any;
  onDistanceUpdate?: (distanceKm: number) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const GoogleMapVisualization: React.FC<GoogleMapVisualizationProps> = ({ 
  pickup, 
  delivery, 
  route, 
  hub, 
  result,
  onDistanceUpdate
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [showAlgorithmRoute, setShowAlgorithmRoute] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [realDrivingDistance, setRealDrivingDistance] = useState<string>('');
  const [realDrivingDistanceKm, setRealDrivingDistanceKm] = useState<number>(0);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [directionsUrl, setDirectionsUrl] = useState<string>('');

  // Safe numeric conversion utilities
  const toNumber = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v === 'string') {
      const n = parseFloat(v.trim());
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const sumLegMeters = (route?: google.maps.DirectionsRoute): number => {
    if (!route?.legs?.length) return 0;
    const total = route.legs.reduce((m, leg) => m + (leg?.distance?.value ?? 0), 0);
    return total > 0 ? total : 0;
  };

  const round2 = (x: number) => Math.round(x * 100) / 100;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Calculate map center and bounds
  const center = {
    lat: (pickup[0] + delivery[0]) / 2,
    lng: (pickup[1] + delivery[1]) / 2
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
    
    // Fit bounds to show all points
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: pickup[0], lng: pickup[1] });
    bounds.extend({ lat: delivery[0], lng: delivery[1] });
    
    if (hub && route.length > 2) {
      bounds.extend({ lat: route[1][0], lng: route[1][1] });
    }
    
    map.fitBounds(bounds, { padding: 50 });
    
    // Create markers
    createMapMarkers(map);
  }, [pickup, delivery, route, hub]);

  const createMapMarkers = (map: google.maps.Map) => {
    const newMarkers: google.maps.Marker[] = [];
    
    // Pickup marker (green)
    const pickupMarker = new google.maps.Marker({
      position: { lat: pickup[0], lng: pickup[1] },
      map: map,
      title: 'Pickup Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="12" cy="9" r="2.5" fill="#FFFFFF"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 32)
      }
    });
    newMarkers.push(pickupMarker);
    
    // Hub marker (blue) - if hub exists and route has more than 2 points
    if (hub && route.length > 2) {
      const hubMarker = new google.maps.Marker({
        position: { lat: route[1][0], lng: route[1][1] },
        map: map,
        title: `${hub.charAt(0).toUpperCase() + hub.slice(1)} Hub`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="12" cy="9" r="2.5" fill="#FFFFFF"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32)
        }
      });
      newMarkers.push(hubMarker);
    }
    
    // Delivery marker (red)
    const deliveryMarker = new google.maps.Marker({
      position: { lat: delivery[0], lng: delivery[1] },
      map: map,
      title: 'Delivery Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="12" cy="9" r="2.5" fill="#FFFFFF"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 32)
      }
    });
    newMarkers.push(deliveryMarker);
    
    setMarkers(newMarkers);
  };
  const onUnmount = useCallback(() => {
    // Clean up markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
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
          
          // Extract real driving distance from all legs
          if (result.routes && result.routes[0] && result.routes[0].legs) {
            const totalDistanceMeters = sumLegMeters(result.routes[0]);
            const totalDurationSeconds = result.routes[0].legs.reduce((acc, leg) => acc + (leg?.duration?.value ?? 0), 0);
            const totalDistanceKm = totalDistanceMeters > 0 ? totalDistanceMeters / 1000 : 0;
            const totalDurationMin = totalDurationSeconds > 0 ? totalDurationSeconds / 60 : 0;
            const distance = `${totalDistanceKm.toFixed(1)} km`;
            setRealDrivingDistance(distance);
            setRealDrivingDistanceKm(totalDistanceKm);
            
            // Notify parent component of the real distance and duration
            if (onDistanceUpdate) {
              onDistanceUpdate(totalDistanceKm, totalDurationMin);
            }

            // Generate Google Maps directions URL
            const origin = `${pickup[0]},${pickup[1]}`;
            const destination = `${delivery[0]},${delivery[1]}`;
            let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
            
            if (hub && route.length > 2) {
              const waypoint = `${route[1][0]},${route[1][1]}`;
              url += `&waypoints=${waypoint}`;
            }
            
            setDirectionsUrl(url);
          }
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
            <div>Distance: {realDrivingDistance || `${result.totalDistance} km`}</div>
            <div>Time: {result.totalTime} min</div>
            <div>Cost: ₹{(() => {
              if (realDrivingDistanceKm > 0) {
                const ratePerKm = toNumber(
                  result.selectedVehicle === '2W' ? 7 : 
                  result.selectedVehicle === 'Van' ? 18 : 
                  result.selectedVehicle === 'Tempo' ? 25 : 35
                );
                const km = toNumber(realDrivingDistanceKm);
                const discount = toNumber(result.poolingDiscount);
                const baseCost = km * ratePerKm;
                const finalCost = baseCost * (1 - discount);
                return round2(finalCost);
              }
              return toNumber(result.totalCost);
            })()}</div>
            <div>Vehicle: {result.selectedVehicle}</div>
            {result.hub && <div>Hub: {result.hub.replace('-', ' ')}</div>}
            {result.savings && <div className="text-green-400">Savings: ₹{result.savings}</div>}
            {realDrivingDistance && <div className="text-blue-400 text-xs">Real driving distance</div>}
            {directionsUrl && (
              <div className="mt-2">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                >
                  Open in Google Maps
                </a>
              </div>
            )}
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