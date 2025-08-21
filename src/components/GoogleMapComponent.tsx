import React, { useEffect, useRef, useState } from 'react';
import { GoogleMapsRenderer } from '../utils/google-maps-integration';
import { Maximize2, Navigation, ZoomIn, ZoomOut, MapPin, Loader } from 'lucide-react';

interface GoogleMapComponentProps {
  pickup: [number, number];
  delivery: [number, number];
  waypoints?: [number, number][];
  hub?: string | null;
  result?: any;
  className?: string;
  height?: string;
  showControls?: boolean;
  interactive?: boolean;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  pickup,
  delivery,
  waypoints = [],
  hub,
  result,
  className = '',
  height = '400px',
  showControls = true,
  interactive = true
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
        const allPoints = [pickup, delivery, ...waypoints];
        const centerLat = allPoints.reduce((sum, point) => sum + point[0], 0) / allPoints.length;
        const centerLng = allPoints.reduce((sum, point) => sum + point[1], 0) / allPoints.length;
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
            <div style="padding: 12px; min-width: 250px; font-family: Arial, sans-serif;">
              <h3 style="margin: 0 0 10px 0; color: #059669; font-weight: bold; font-size: 16px;">📦 Pickup Location</h3>
              <div style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Coordinates:</strong> ${pickup[0].toFixed(6)}, ${pickup[1].toFixed(6)}</div>
              ${result?.selectedVehicle ? `<div style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Vehicle:</strong> ${result.selectedVehicle}</div>` : ''}
              ${result?.cargoSpecs ? `<div style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Cargo:</strong> ${result.cargoSpecs.weight}kg, ${result.cargoSpecs.volume.toLocaleString()}cm³</div>` : ''}
              ${result?.distancesKm?.pickupLeg ? `<div style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Distance to ${hub ? 'Hub' : 'Delivery'}:</strong> ${result.distancesKm.pickupLeg}km</div>` : ''}
            </div>
          `
        );

        // Add delivery marker
        mapRenderer.addMarker(
          delivery,
          'Delivery Location',
          'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          `
            <div style="padding: 12px; min-width: 250px; font-family: Arial, sans-serif;">
              <h3 style="margin: 0 0 10px 0; color: #DC2626; font-weight: bold; font-size: 16px;">🎯 Delivery Location</h3>
              <div style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Coordinates:</strong> ${delivery[0].toFixed(6)}, ${delivery[1].toFixed(6)}</div>
              ${result?.totalCost ? `<div style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Total Cost:</strong> ₹${result.totalCost}</div>` : ''}
              ${result?.totalTime ? `<div style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>ETA:</strong> ${result.totalTime} minutes</div>` : ''}
              ${result?.savings ? `<div style="margin: 6px 0; color: #059669; font-size: 14px; font-weight: bold;"><strong>Savings:</strong> ₹${result.savings}</div>` : ''}
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
              <div style="padding: 12px; min-width: 250px; font-family: Arial, sans-serif;">
                <h3 style="margin: 0 0 10px 0; color: #2563EB; font-weight: bold; font-size: 16px;">🏢 ${hub.charAt(0).toUpperCase() + hub.slice(1).replace('-', ' ')} Hub</h3>
                <div style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Coordinates:</strong> ${hubCoord[0].toFixed(6)}, ${hubCoord[1].toFixed(6)}</div>
                ${result?.distancesKm?.pickupLeg ? `<div style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>From Pickup:</strong> ${result.distancesKm.pickupLeg} km</div>` : ''}
                ${result?.distancesKm?.deliveryLeg ? `<div style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>To Delivery:</strong> ${result.distancesKm.deliveryLeg} km</div>` : ''}
                ${result?.strategy ? `<div style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Strategy:</strong> ${result.strategy}</div>` : ''}
              </div>
            `
          );
        }

        // Display route
        if (interactive) {
          await mapRenderer.displayRoute(pickup, delivery, waypoints);
        }

        // Fit bounds to show all markers
        if (window.google) {
          const bounds = new google.maps.LatLngBounds();
          bounds.extend({ lat: pickup[0], lng: pickup[1] });
          bounds.extend({ lat: delivery[0], lng: delivery[1] });
          waypoints.forEach(point => {
            bounds.extend({ lat: point[0], lng: point[1] });
          });
          mapRenderer.fitBounds(bounds);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing Google Map:', error);
        setError('Failed to load Google Maps. Please check your internet connection and API configuration.');
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (mapRendererRef.current) {
        mapRendererRef.current.clearMarkers();
      }
    };
  }, [pickup, delivery, waypoints, hub, result, interactive]);

  const handleZoomIn = () => {
    if (mapRendererRef.current) {
      const currentMap = mapRendererRef.current.getMap();
      if (currentMap) {
        const currentZoom = currentMap.getZoom() || 12;
        mapRendererRef.current.setZoom(Math.min(currentZoom + 1, 20));
      }
    }
  };

  const handleZoomOut = () => {
    if (mapRendererRef.current) {
      const currentMap = mapRendererRef.current.getMap();
      if (currentMap) {
        const currentZoom = currentMap.getZoom() || 12;
        mapRendererRef.current.setZoom(Math.max(currentZoom - 1, 1));
      }
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
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200`} style={{ height }}>
        <div className="text-center p-8">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Map Unavailable</h3>
          <p className="text-gray-500 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full rounded-lg overflow-hidden border border-gray-200"
        style={{ height: isFullscreen ? '100vh' : height }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading Google Maps...</p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {!isLoading && !error && showControls && (
        <>
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <button
              onClick={handleZoomIn}
              className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleZoomOut}
              className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleFitBounds}
              className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
              title="Fit to Route"
            >
              <Navigation className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <span className="text-gray-600 font-bold text-sm">✕</span>
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {/* Route Info Overlay */}
          {result && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-sm max-w-xs backdrop-blur-sm">
              <div className="space-y-2">
                <div className="font-semibold text-base mb-2">Route Information</div>
                <div><strong>Distance:</strong> {result.totalDistance} km</div>
                <div><strong>Time:</strong> {result.totalTime} min</div>
                <div><strong>Cost:</strong> ₹{result.totalCost}</div>
                <div><strong>Vehicle:</strong> {result.selectedVehicle}</div>
                {result.hub && <div><strong>Hub:</strong> {result.hub.replace('-', ' ')}</div>}
                {result.savings && <div className="text-green-400 font-semibold"><strong>Savings:</strong> ₹{result.savings}</div>}
                {result.strategy && <div><strong>Strategy:</strong> {result.strategy}</div>}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-95 p-3 rounded-lg text-sm shadow-md border border-gray-200">
            <div className="font-semibold mb-2">Map Legend</div>
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