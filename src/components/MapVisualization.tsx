import React, { useEffect, useRef } from 'react';
import { MapPin, Navigation, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

interface MapVisualizationProps {
  pickup: [number, number];
  delivery: [number, number];
  route: [number, number][];
  hub?: string | null;
  result?: any;
}

const MapVisualization: React.FC<MapVisualizationProps> = ({ pickup, delivery, route, hub, result }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [mapLoaded, setMapLoaded] = React.useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    const initializeMap = async () => {
      try {
        const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        
        if (!mapboxToken || mapboxToken === 'your_mapbox_token_here') {
          console.warn('Mapbox token not configured, using fallback visualization');
          createFallbackVisualization();
          return;
        }

        try {
          // Dynamically import Mapbox GL JS
          const mapboxgl = await import('mapbox-gl');
          mapboxgl.default.accessToken = mapboxToken;

          // Clear existing map
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
          }

          // Calculate bounds for the route
          const bounds = new mapboxgl.default.LngLatBounds();
          route.forEach(coord => bounds.extend([coord[1], coord[0]])); // Note: Mapbox uses [lng, lat]

          // Create map
          const map = new mapboxgl.default.Map({
            container: mapRef.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            bounds: bounds,
            fitBoundsOptions: { padding: 50 },
            interactive: true,
            attributionControl: true,
            logoPosition: 'bottom-right'
          });

          mapInstanceRef.current = map;

          // Add navigation controls
          map.addControl(new mapboxgl.default.NavigationControl(), 'top-right');
          map.addControl(new mapboxgl.default.FullscreenControl(), 'top-right');
          map.addControl(new mapboxgl.default.ScaleControl(), 'bottom-left');

          // Add error handler for map
          map.on('error', (e) => {
            console.warn('Mapbox error, falling back to SVG visualization:', e.error);
            createFallbackVisualization();
          });

          map.on('load', () => {
            console.log('Mapbox map loaded successfully');
            setMapLoaded(true);
            
            // Add route line
            const routeCoordinates = route.map(coord => [coord[1], coord[0]]); // Convert to [lng, lat]
            console.log('Route coordinates for map:', routeCoordinates);
          
            map.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: routeCoordinates
                }
              }
            });

            map.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#FF6B35',
                'line-width': 6,
                'line-opacity': 0.8
              }
            });

            // Add route animation
            map.addLayer({
              id: 'route-animation',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#FFFFFF',
                'line-width': 4,
                'line-opacity': 0.6,
                'line-dasharray': [2, 4]
              }
            });

            // Add pickup marker
            const pickupMarker = new mapboxgl.default.Marker({ 
              color: '#10B981',
              scale: 1.2
            })
              .setLngLat([pickup[1], pickup[0]])
              .setPopup(new mapboxgl.default.Popup({ offset: 25 }).setHTML(`
                <div class="p-3">
                  <div class="font-semibold text-green-800 mb-2">📦 Pickup Location</div>
                  <div class="text-sm text-gray-600">Coordinates: ${pickup[0].toFixed(6)}, ${pickup[1].toFixed(6)}</div>
                  ${result?.vehicles?.pickupVehicle ? `<div class="text-sm text-blue-600 mt-1">Vehicle: ${result.vehicles.pickupVehicle}</div>` : ''}
                </div>
              `))
              .addTo(map);

            // Add delivery marker
            const deliveryMarker = new mapboxgl.default.Marker({ 
              color: '#EF4444',
              scale: 1.2
            })
              .setLngLat([delivery[1], delivery[0]])
              .setPopup(new mapboxgl.default.Popup({ offset: 25 }).setHTML(`
                <div class="p-3">
                  <div class="font-semibold text-red-800 mb-2">🎯 Delivery Location</div>
                  <div class="text-sm text-gray-600">Coordinates: ${delivery[0].toFixed(6)}, ${delivery[1].toFixed(6)}</div>
                  ${result?.vehicles?.deliveryVehicle ? `<div class="text-sm text-blue-600 mt-1">Vehicle: ${result.vehicles.deliveryVehicle}</div>` : ''}
                </div>
              `))
              .addTo(map);

            // Add hub marker if exists
            if (hub && route.length > 2) {
              const hubCoord = route[1]; // Hub is typically the middle point
              console.log('Adding hub marker at:', hubCoord);
              const hubMarker = new mapboxgl.default.Marker({ 
                color: '#3B82F6',
                scale: 1.5
              })
                .setLngLat([hubCoord[1], hubCoord[0]])
                .setPopup(new mapboxgl.default.Popup({ offset: 25 }).setHTML(`
                  <div class="p-3">
                    <div class="font-semibold text-blue-800 mb-2">🏢 ${hub.charAt(0).toUpperCase() + hub.slice(1)} Hub</div>
                    <div class="text-sm text-gray-600">Coordinates: ${hubCoord[0].toFixed(6)}, ${hubCoord[1].toFixed(6)}</div>
                    ${result?.distancesKm?.pickupLeg ? `<div class="text-sm text-green-600 mt-1">From Pickup: ${result.distancesKm.pickupLeg} km</div>` : ''}
                    ${result?.distancesKm?.deliveryLeg ? `<div class="text-sm text-orange-600">To Delivery: ${result.distancesKm.deliveryLeg} km</div>` : ''}
                  </div>
                `))
                .addTo(map);
            }

            // Add click handlers for interactivity
            map.on('click', 'route', (e) => {
              const coordinates = e.lngLat;
              new mapboxgl.default.Popup({ offset: 25 })
                .setLngLat(coordinates)
                .setHTML(`
                  <div class="p-3">
                    <div class="font-semibold text-orange-800 mb-2">🛣️ Route Point</div>
                    <div class="text-sm text-gray-600">Coordinates: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}</div>
                    <div class="text-sm text-blue-600 mt-1">Total Distance: ${result?.totalDistance || 'N/A'} km</div>
                    <div class="text-sm text-green-600">Estimated Time: ${result?.totalTime || 'N/A'} min</div>
                  </div>
                `)
                .addTo(map);
            });

            // Change cursor on hover
            map.on('mouseenter', 'route', () => {
              map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'route', () => {
              map.getCanvas().style.cursor = '';
            });
          });

        } catch (mapboxError) {
          console.warn('Failed to initialize Mapbox, using fallback visualization:', mapboxError);
          createFallbackVisualization();
        }
      } catch (error) {
        console.warn('Error in map initialization, using fallback visualization:', error);
        createFallbackVisualization();
      }
    };

    const createFallbackVisualization = () => {
      if (!mapRef.current) return;
      
      mapRef.current.innerHTML = '';

      // Create enhanced SVG visualization
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('viewBox', '0 0 500 400');
      svg.style.background = 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)';

      // Calculate positions based on actual coordinates
      const minLat = Math.min(pickup[0], delivery[0], ...(route.length > 2 ? [route[1][0]] : []));
      const maxLat = Math.max(pickup[0], delivery[0], ...(route.length > 2 ? [route[1][0]] : []));
      const minLng = Math.min(pickup[1], delivery[1], ...(route.length > 2 ? [route[1][1]] : []));
      const maxLng = Math.max(pickup[1], delivery[1], ...(route.length > 2 ? [route[1][1]] : []));

      const latRange = maxLat - minLat || 0.01;
      const lngRange = maxLng - minLng || 0.01;

      const mapCoord = (lat: number, lng: number): [number, number] => {
        const x = 50 + ((lng - minLng) / lngRange) * 400;
        const y = 350 - ((lat - minLat) / latRange) * 300; // Flip Y axis
        return [x, y];
      };

      const [pickupX, pickupY] = mapCoord(pickup[0], pickup[1]);
      const [deliveryX, deliveryY] = mapCoord(delivery[0], delivery[1]);

      // Draw route path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let pathData = `M ${pickupX} ${pickupY}`;
      
      if (hub && route.length > 2) {
        const [hubX, hubY] = mapCoord(route[1][0], route[1][1]);
        pathData += ` L ${hubX} ${hubY} L ${deliveryX} ${deliveryY}`;
        
        // Hub marker
        const hubMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hubMarker.setAttribute('cx', hubX.toString());
        hubMarker.setAttribute('cy', hubY.toString());
        hubMarker.setAttribute('r', '8');
        hubMarker.setAttribute('fill', '#60A5FA');
        hubMarker.setAttribute('stroke', 'white');
        hubMarker.setAttribute('stroke-width', '4');
        svg.appendChild(hubMarker);

        // Hub label
        const hubLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        hubLabel.setAttribute('x', (hubX).toString());
        hubLabel.setAttribute('y', (hubY - 15).toString());
        hubLabel.setAttribute('text-anchor', 'middle');
        hubLabel.setAttribute('font-family', 'Arial, sans-serif');
        hubLabel.setAttribute('font-size', '14');
        hubLabel.setAttribute('font-weight', 'bold');
        hubLabel.setAttribute('fill', 'white');
        hubLabel.textContent = `🏢 ${hub.charAt(0).toUpperCase() + hub.slice(1)} Hub`;
        svg.appendChild(hubLabel);
      } else {
        pathData += ` L ${deliveryX} ${deliveryY}`;
      }
      
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', '#FF6B35');
      path.setAttribute('stroke-width', '6');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      
      // Add animation
      const pathLength = path.getTotalLength();
      path.style.strokeDasharray = `${pathLength} ${pathLength}`;
      path.style.strokeDashoffset = pathLength.toString();
      path.style.animation = 'dash 2s ease-in-out forwards';

      svg.appendChild(path);

      // Pickup marker
      const pickupMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pickupMarker.setAttribute('cx', pickupX.toString());
      pickupMarker.setAttribute('cy', pickupY.toString());
      pickupMarker.setAttribute('r', '12');
      pickupMarker.setAttribute('fill', '#10B981');
      pickupMarker.setAttribute('stroke', 'white');
      pickupMarker.setAttribute('stroke-width', '4');
      svg.appendChild(pickupMarker);

      // Pickup label
      const pickupLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      pickupLabel.setAttribute('x', pickupX.toString());
      pickupLabel.setAttribute('y', (pickupY + 25).toString());
      pickupLabel.setAttribute('text-anchor', 'middle');
      pickupLabel.setAttribute('font-family', 'Arial, sans-serif');
      pickupLabel.setAttribute('font-size', '14');
      pickupLabel.setAttribute('font-weight', 'bold');
      pickupLabel.setAttribute('fill', 'white');
      pickupLabel.textContent = '📦 Pickup';
      svg.appendChild(pickupLabel);

      // Delivery marker
      const deliveryMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      deliveryMarker.setAttribute('cx', deliveryX.toString());
      deliveryMarker.setAttribute('cy', deliveryY.toString());
      deliveryMarker.setAttribute('r', '12');
      deliveryMarker.setAttribute('fill', '#EF4444');
      deliveryMarker.setAttribute('stroke', 'white');
      deliveryMarker.setAttribute('stroke-width', '4');
      svg.appendChild(deliveryMarker);

      // Delivery label
      const deliveryLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      deliveryLabel.setAttribute('x', deliveryX.toString());
      deliveryLabel.setAttribute('y', (deliveryY + 25).toString());
      deliveryLabel.setAttribute('text-anchor', 'middle');
      deliveryLabel.setAttribute('font-family', 'Arial, sans-serif');
      deliveryLabel.setAttribute('font-size', '14');
      deliveryLabel.setAttribute('font-weight', 'bold');
      deliveryLabel.setAttribute('fill', 'white');
      deliveryLabel.textContent = '🎯 Delivery';
      svg.appendChild(deliveryLabel);

      mapRef.current.appendChild(svg);
      setMapLoaded(true);
    };

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes dash {
        to {
          stroke-dashoffset: 0;
        }
      }
    `;
    if (!document.head.querySelector('style[data-map-animation]')) {
      style.setAttribute('data-map-animation', 'true');
      document.head.appendChild(style);
    }

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pickup, delivery, route, hub]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const zoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const zoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const fitBounds = () => {
    if (mapInstanceRef.current && route.length > 0) {
      const mapboxgl = require('mapbox-gl');
      const bounds = new mapboxgl.LngLatBounds();
      route.forEach(coord => bounds.extend([coord[1], coord[0]]));
      mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
    }
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'w-full h-full'}`}>
      <div
        ref={mapRef} 
        className="w-full h-full rounded-lg relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900"
      >
        {/* Legend */}
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-white">📦 Pickup</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-white">🎯 Delivery</span>
            </div>
            {hub && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-white">🏢 Hub</span>
              </div>
            )}
          </div>
        </div>

        {/* Route Info */}
        {result && (
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10 text-white text-sm">
            <div className="space-y-1">
              <div>Distance: <span className="font-semibold text-orange-400">{result.totalDistance} km</span></div>
              <div>Time: <span className="font-semibold text-green-400">{result.totalTime} min</span></div>
              <div>Cost: <span className="font-semibold text-blue-400">₹{result.totalCost}</span></div>
              <div>Vehicle: <span className="font-semibold text-purple-400">{result.selectedVehicle}</span></div>
            </div>
          </div>
        )}

        {/* Custom Controls */}
        {!mapInstanceRef.current && (
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-10">
            <button
              onClick={zoomIn}
              className="bg-white/90 hover:bg-white p-2 rounded-lg shadow-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={zoomOut}
              className="bg-white/90 hover:bg-white p-2 rounded-lg shadow-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={fitBounds}
              className="bg-white/90 hover:bg-white p-2 rounded-lg shadow-lg transition-colors"
              title="Fit to Route"
            >
              <Navigation className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        )}

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-4 left-4 bg-white/90 hover:bg-white p-2 rounded-lg shadow-lg transition-colors z-10"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          <Maximize2 className="w-4 h-4 text-gray-700" />
        </button>

        {/* Loading Indicator */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 z-20">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <div>Loading Interactive Map...</div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Close Button */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg z-50 transition-colors"
          title="Exit Fullscreen"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default MapVisualization;