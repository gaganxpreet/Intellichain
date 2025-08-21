import React, { useEffect, useRef, useState } from 'react';
import { GoogleMapsRenderer } from '../utils/google-maps';
import { Maximize2, Navigation, ZoomIn, ZoomOut, MapPin } from 'lucide-react';

interface GoogleMapComponentProps {
  pickup: [number, number];
  delivery: [number, number];
  waypoints?: [number, number][];
  hub?: string | null;
  result?: any;
  className?: string;
  height?: string;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  pickup,
  delivery,
  waypoints = [],
  hub,
  result,
  className = '',
  height = '400px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapRendererRef = useRef<GoogleMapsRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        // Calculate center point
        const centerLat = (pickup[0] + delivery[0]) / 2;
        const centerLng = (pickup[1] + delivery[1]) / 2;
        const center: [number, number] = [centerLat, centerLng];

        // Initialize map
        const mapRenderer = new GoogleMapsRenderer();
        await mapRenderer.initializeMap(mapRef.current, center, 12);
        mapRendererRef.current = mapRenderer;

        // Add pickup marker
        mapRenderer.addMarker(
          pickup,
          'Pickup Location',
          'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
          `
            <div style="padding: 10px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; color: #059669; font-weight: bold;">📦 Pickup Location</h3>
              <p style="margin: 4px 0; color: #374151;"><strong>Coordinates:</strong> ${pickup[0].toFixed(6)}, ${pickup[1].toFixed(6)}</p>
              ${result?.selectedVehicle ? `<p style="margin: 4px 0; color: #374151;"><strong>Vehicle:</strong> ${result.selectedVehicle}</p>` : ''}
              ${result?.cargoSpecs ? `<p style="margin: 4px 0; color: #374151;"><strong>Cargo:</strong> ${result.cargoSpecs.weight}kg, ${result.cargoSpecs.volume.toLocaleString()}cm³</p>` : ''}
            </div>
          `
        );

        // Add delivery marker
        mapRenderer.addMarker(
          delivery,
          'Delivery Location',
          'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          `
            <div style="padding: 10px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; color: #DC2626; font-weight: bold;">🎯 Delivery Location</h3>
              <p style="margin: 4px 0; color: #374151;"><strong>Coordinates:</strong> ${delivery[0].toFixed(6)}, ${delivery[1].toFixed(6)}</p>
              ${result?.totalCost ? `<p style="margin: 4px 0; color: #374151;"><strong>Total Cost:</strong> ₹${result.totalCost}</p>` : ''}
              ${result?.totalTime ? `<p style="margin: 4px 0; color: #374151;"><strong>ETA:</strong> ${result.totalTime} minutes</p>` : ''}
            </div>
          `
        );

        // Add hub marker if exists
        if (hub && waypoints.length > 0) {
          const hubCoord = waypoints[0];
          mapRenderer.addMarker(
            hubCoord,
            `${hub} Hub`,
            'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            `
              <div style="padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #2563EB; font-weight: bold;">🏢 ${hub.charAt(0).toUpperCase() + hub.slice(1).replace('-', ' ')} Hub</h3>
                <p style="margin: 4px 0; color: #374151;"><strong>Coordinates:</strong> ${hubCoord[0].toFixed(6)}, ${hubCoord[1].toFixed(6)}</p>
                ${result?.distancesKm?.pickupLeg ? `<p style="margin: 4px 0; color: #374151;"><strong>From Pickup:</strong> ${result.distancesKm.pickupLeg} km</p>` : ''}
                ${result?.distancesKm?.deliveryLeg ? `<p style="margin: 4px 0; color: #374151;"><strong>To Delivery:</strong> ${result.distancesKm.deliveryLeg} km</p>` : ''}
                ${result?.strategy ? `<p style="margin: 4px 0; color: #374151;"><strong>Strategy:</strong> ${result.strategy}</p>` : ''}
              </div>
            `
          );
        }

        // Display route
        await mapRenderer.displayRoute(pickup, delivery, waypoints);

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing Google Map:', error);
        setError('Failed to load Google Maps. Please check your internet connection.');
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (mapRendererRef.current) {
        mapRendererRef.current.clearMarkers();
      }
    };
  }, [pickup, delivery, waypoints, hub, result]);

  const handleZoomIn = () => {
    if (mapRendererRef.current) {
      mapRendererRef.current.setZoom(15);
    }
  };

  const handleZoomOut = () => {
    if (mapRendererRef.current) {
      mapRendererRef.current.setZoom(10);
    }
  };

  const handleFitBounds = () => {
    if (mapRendererRef.current && window.google) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: pickup[0], lng: pickup[1] });
      bounds.extend({ lat: delivery[0], lng: delivery[1] });
      waypoints.forEach(point => {
        bounds.extend({ lat: point[0], lng: point[1] });
      });
      mapRendererRef.current.fitBounds(bounds);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (error) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`} style={{ height }}>
        <div className="text-center p-8">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Map Unavailable</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full rounded-lg overflow-hidden"
        style={{ height: isFullscreen ? '100vh' : height }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Google Maps...</p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {!isLoading && !error && (
        <>
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <button
              onClick={handleZoomIn}
              className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleZoomOut}
              className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleFitBounds}
              className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
              title="Fit to Route"
            >
              <Navigation className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <span className="text-gray-600 font-bold">✕</span>
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {/* Route Info Overlay */}
          {result && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-sm max-w-xs">
              <div className="space-y-1">
                <div><strong>Distance:</strong> {result.totalDistance} km</div>
                <div><strong>Time:</strong> {result.totalTime} min</div>
                <div><strong>Cost:</strong> ₹{result.totalCost}</div>
                <div><strong>Vehicle:</strong> {result.selectedVehicle}</div>
                {result.hub && <div><strong>Hub:</strong> {result.hub.replace('-', ' ')}</div>}
                {result.savings && <div className="text-green-400"><strong>Savings:</strong> ₹{result.savings}</div>}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg text-sm shadow-md">
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
        </>
      )}
    </div>
  );
};

export default GoogleMapComponent;