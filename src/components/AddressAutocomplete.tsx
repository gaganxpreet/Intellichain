import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { PlacesAutocomplete, initializeGoogleMaps } from '../utils/google-maps';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, coordinates?: [number, number]) => void;
  placeholder: string;
  icon?: React.ReactNode;
  required?: boolean;
  className?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder,
  icon,
  required = false,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placesService, setPlacesService] = useState<PlacesAutocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializePlaces = async () => {
      try {
        await initializeGoogleMaps();
        setPlacesService(new PlacesAutocomplete());
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
      }
    };

    initializePlaces();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (!placesService || inputValue.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const predictions = await placesService.getSuggestions(inputValue);
      setSuggestions(predictions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService) return;

    try {
      const placeDetails = await placesService.getPlaceDetails(prediction.place_id);
      const coordinates: [number, number] = [
        placeDetails.geometry?.location?.lat() || 0,
        placeDetails.geometry?.location?.lng() || 0
      ];
      
      onChange(prediction.description, coordinates);
      setShowSuggestions(false);
      setSuggestions([]);
    } catch (error) {
      console.error('Error fetching place details:', error);
      onChange(prediction.description);
      setShowSuggestions(false);
    }
  };

  const clearInput = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500`}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        
        {/* Loading or Clear button */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          ) : value ? (
            <button
              type="button"
              onClick={clearInput}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSuggestionClick(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
            >
              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-sm text-gray-600">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && suggestions.length === 0 && !isLoading && value.length >= 3 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
          No locations found. Try a different search term.
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;