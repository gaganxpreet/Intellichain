import React, { useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: { address: string; coordinates: [number, number] }) => void;
  placeholder: string;
  className?: string;
  icon?: React.ReactNode;
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  className = '',
  icon
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    // Initialize autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment', 'geocode'],
      componentRestrictions: { country: 'in' }, // Restrict to India
      fields: ['formatted_address', 'geometry.location', 'name']
    });

    // Handle place selection
    const handlePlaceSelect = () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.geometry?.location && place.formatted_address) {
        const coordinates: [number, number] = [
          place.geometry.location.lat(),
          place.geometry.location.lng()
        ];
        
        onPlaceSelect({
          address: place.formatted_address,
          coordinates
        });
      }
    };

    autocompleteRef.current.addListener('place_changed', handlePlaceSelect);

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onPlaceSelect]);

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 z-10">
          {icon}
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${className}`}
      />
    </div>
  );
};

export default GooglePlacesAutocomplete;