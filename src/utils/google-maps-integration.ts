// Complete Google Maps Platform Integration
// Comprehensive implementation of all Google Maps APIs for logistics platform

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDHZ8vNg7vF2K3lM9xQ4pR6tE8wY1sA2bC';

// Initialize Google Maps JavaScript API
export const initializeGoogleMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry,routes&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    (window as any).initGoogleMaps = () => {
      console.log('Google Maps API loaded successfully');
      resolve();
    };

    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });
};

// 1. PLACES API - Address Autocomplete
export class PlacesService {
  private autocompleteService: google.maps.places.AutocompleteService;
  private placesService: google.maps.places.PlacesService;

  constructor() {
    this.autocompleteService = new google.maps.places.AutocompleteService();
    const div = document.createElement('div');
    this.placesService = new google.maps.places.PlacesService(div);
  }

  async getAddressSuggestions(input: string): Promise<google.maps.places.AutocompletePrediction[]> {
    return new Promise((resolve, reject) => {
      if (input.length < 3) {
        resolve([]);
        return;
      }

      this.autocompleteService.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: 'in' },
          types: ['establishment', 'geocode'],
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(28.4, 76.8), // Southwest Delhi
            new google.maps.LatLng(28.9, 77.5)  // Northeast Delhi
          )
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions);
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            console.error('Places API error:', status);
            reject(new Error(`Places API error: ${status}`));
          }
        }
      );
    });
  }

  async getPlaceDetails(placeId: string): Promise<google.maps.places.PlaceResult> {
    return new Promise((resolve, reject) => {
      this.placesService.getDetails(
        {
          placeId,
          fields: ['geometry', 'formatted_address', 'name', 'place_id']
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            reject(new Error(`Place details error: ${status}`));
          }
        }
      );
    });
  }
}

// 2. GEOCODING API - Address ↔ Coordinates
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    if (!address || address.trim().length === 0) {
      throw new Error('Address cannot be empty');
    }

    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&region=in&key=${GOOGLE_MAPS_API_KEY}`;
    
    console.log('Geocoding address:', address);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Geocoding response:', data);
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const coordinates: [number, number] = [location.lat, location.lng];
      console.log('Successfully geocoded coordinates:', coordinates);
      return coordinates;
    } else if (data.status === 'REQUEST_DENIED') {
      throw new Error(`Google Maps API access denied: ${data.error_message || 'Check API key and billing'}`);
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('Google Maps API quota exceeded. Please try again later.');
    } else if (data.status === 'ZERO_RESULTS') {
      throw new Error('Address not found. Please check the address and try again.');
    } else {
      throw new Error(`Geocoding failed: ${data.status}`);
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

// 3. DISTANCE MATRIX API - Calculate travel distance & ETA
export interface DistanceMatrixElement {
  distance: {
    text: string;
    value: number; // in meters
  };
  duration: {
    text: string;
    value: number; // in seconds
  };
  status: string;
}

export async function getDistanceMatrix(
  origins: [number, number][],
  destinations: [number, number][],
  travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT' = 'DRIVING'
): Promise<DistanceMatrixElement[][]> {
  try {
    const originsStr = origins.map(([lat, lng]) => `${lat},${lng}`).join('|');
    const destinationsStr = destinations.map(([lat, lng]) => `${lat},${lng}`).join('|');
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&mode=${travelMode}&units=metric&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      return data.rows.map((row: any) => row.elements);
    } else {
      throw new Error(`Distance Matrix API error: ${data.status}`);
    }
  } catch (error) {
    console.error('Distance Matrix API error:', error);
    throw error;
  }
}

// 4. DIRECTIONS/ROUTES API - Generate optimal delivery routes
export interface DirectionsResult {
  routes: google.maps.DirectionsRoute[];
  status: string;
  geocoded_waypoints?: any[];
}

export async function getDirections(
  origin: [number, number],
  destination: [number, number],
  waypoints?: [number, number][],
  optimizeWaypoints: boolean = true
): Promise<DirectionsResult> {
  return new Promise((resolve, reject) => {
    const directionsService = new google.maps.DirectionsService();
    
    const waypointsFormatted = waypoints?.map(([lat, lng]) => ({
      location: new google.maps.LatLng(lat, lng),
      stopover: true
    })) || [];

    directionsService.route(
      {
        origin: new google.maps.LatLng(origin[0], origin[1]),
        destination: new google.maps.LatLng(destination[0], destination[1]),
        waypoints: waypointsFormatted,
        optimizeWaypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          resolve({ 
            routes: result.routes, 
            status,
            geocoded_waypoints: result.geocoded_waypoints 
          });
        } else {
          reject(new Error(`Directions API error: ${status}`));
        }
      }
    );
  });
}

// 5. ROADS API - Snap GPS traces for accurate live tracking
export interface SnappedPoint {
  location: {
    latitude: number;
    longitude: number;
  };
  originalIndex?: number;
  placeId: string;
}

export async function snapToRoads(path: [number, number][]): Promise<SnappedPoint[]> {
  try {
    if (path.length === 0) {
      return [];
    }

    const pathStr = path.map(([lat, lng]) => `${lat},${lng}`).join('|');
    const url = `https://roads.googleapis.com/v1/snapToRoads?path=${pathStr}&interpolate=true&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.snappedPoints) {
      return data.snappedPoints;
    } else if (data.error) {
      throw new Error(`Roads API error: ${data.error.message}`);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Roads API error:', error);
    throw error;
  }
}

// 6. GEOLOCATION API - Get current location
export async function getCurrentLocation(): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        let errorMessage = 'Unknown geolocation error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

// Watch position for live tracking
export function watchPosition(
  callback: (position: [number, number]) => void,
  errorCallback?: (error: GeolocationPositionError) => void
): number {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser');
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback([position.coords.latitude, position.coords.longitude]);
    },
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 30000
    }
  );
}

export function clearWatch(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
}

// 7. MAPS JAVASCRIPT API - Interactive map component
export class GoogleMapsRenderer {
  private map: google.maps.Map | null = null;
  private directionsRenderer: google.maps.DirectionsRenderer | null = null;
  private markers: google.maps.Marker[] = [];
  private infoWindows: google.maps.InfoWindow[] = [];

  async initializeMap(
    container: HTMLElement, 
    center: [number, number], 
    zoom: number = 12
  ): Promise<void> {
    await initializeGoogleMaps();
    
    this.map = new google.maps.Map(container, {
      center: { lat: center[0], lng: center[1] },
      zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true
    });

    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#FF6B35',
        strokeWeight: 6,
        strokeOpacity: 0.8
      }
    });
    
    this.directionsRenderer.setMap(this.map);
  }

  addMarker(
    position: [number, number], 
    title: string, 
    icon?: string,
    infoContent?: string
  ): google.maps.Marker {
    if (!this.map) throw new Error('Map not initialized');

    const marker = new google.maps.Marker({
      position: { lat: position[0], lng: position[1] },
      map: this.map,
      title,
      icon: icon ? {
        url: icon,
        scaledSize: new google.maps.Size(40, 40)
      } : undefined,
      animation: google.maps.Animation.DROP
    });

    if (infoContent) {
      const infoWindow = new google.maps.InfoWindow({
        content: infoContent
      });

      marker.addListener('click', () => {
        // Close all other info windows
        this.infoWindows.forEach(iw => iw.close());
        infoWindow.open(this.map, marker);
      });

      this.infoWindows.push(infoWindow);
    }

    this.markers.push(marker);
    return marker;
  }

  async displayRoute(
    origin: [number, number],
    destination: [number, number],
    waypoints?: [number, number][]
  ): Promise<void> {
    if (!this.map || !this.directionsRenderer) throw new Error('Map not initialized');

    try {
      const result = await getDirections(origin, destination, waypoints);
      this.directionsRenderer.setDirections(result);
    } catch (error) {
      console.error('Error displaying route:', error);
      throw error;
    }
  }

  clearMarkers(): void {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
    this.infoWindows.forEach(iw => iw.close());
    this.infoWindows = [];
  }

  fitBounds(bounds: google.maps.LatLngBounds): void {
    if (!this.map) throw new Error('Map not initialized');
    this.map.fitBounds(bounds);
  }

  panTo(position: [number, number]): void {
    if (!this.map) throw new Error('Map not initialized');
    this.map.panTo({ lat: position[0], lng: position[1] });
  }

  setZoom(zoom: number): void {
    if (!this.map) throw new Error('Map not initialized');
    this.map.setZoom(zoom);
  }

  getMap(): google.maps.Map | null {
    return this.map;
  }
}

// 8. MAPS EMBED API - Display map previews
export function generateEmbedMapUrl(
  center: [number, number],
  zoom: number = 15,
  markers?: Array<{ position: [number, number]; label?: string }>
): string {
  const baseUrl = 'https://www.google.com/maps/embed/v1/view';
  const params = new URLSearchParams({
    key: GOOGLE_MAPS_API_KEY,
    center: `${center[0]},${center[1]}`,
    zoom: zoom.toString()
  });

  if (markers && markers.length > 0) {
    const markerParams = markers.map(marker => 
      `${marker.position[0]},${marker.position[1]}`
    ).join('|');
    params.set('markers', markerParams);
  }

  return `${baseUrl}?${params.toString()}`;
}

// Utility functions
export function calculateDistance(point1: [number, number], point2: [number, number]): number {
  const R = 6371; // Earth's radius in km
  const dLat = (point2[0] - point1[0]) * Math.PI / 180;
  const dLon = (point2[1] - point1[1]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1[0] * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Error handling utilities
export function handleGoogleMapsError(error: any): string {
  if (error.message?.includes('REQUEST_DENIED')) {
    return 'Google Maps API access denied. Please check API key configuration.';
  } else if (error.message?.includes('OVER_QUERY_LIMIT')) {
    return 'Google Maps API quota exceeded. Please try again later.';
  } else if (error.message?.includes('ZERO_RESULTS')) {
    return 'No results found. Please check your input and try again.';
  } else {
    return error.message || 'An error occurred with Google Maps services.';
  }
}