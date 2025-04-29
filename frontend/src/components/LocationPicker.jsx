import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const LocationPicker = ({ 
  initialLocation, 
  onLocationChange, 
  onCoordinatesChange,
  placeholder = "Enter location" 
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [location, setLocation] = useState(initialLocation || '');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Using refs to prevent recreation of map instances on re-renders
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const lastSelectedPosition = useRef(null);
  
  // Default to Colombo, Sri Lanka
  const COLOMBO_COORDINATES = { lat: 6.9271, lng: 79.8612 };

  // Safe way to get API key - with fallback
  const getGoogleMapsApiKey = () => {
    // Try various ways to access environment variables
    const envKey = typeof import.meta !== 'undefined' ? 
      import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || 
      import.meta.env?.REACT_APP_GOOGLE_MAPS_API_KEY : undefined;
    
    // Check if window has injected API key (sometimes done in production)
    const windowKey = typeof window !== 'undefined' ? 
      window.GOOGLE_MAPS_API_KEY : undefined;
    
    // Return the first available key or empty string if none found
    return envKey || windowKey || '';
  };

  // Load Google Maps API script
  useEffect(() => {
    // Skip if already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      console.error('Google Maps API key not found');
      setMapError(true);
      return;
    }

    const googleMapsScript = document.createElement('script');
    googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    googleMapsScript.async = true;
    googleMapsScript.defer = true;
    
    googleMapsScript.onload = () => {
      setMapLoaded(true);
    };
    
    googleMapsScript.onerror = () => {
      console.error('Failed to load Google Maps API');
      setMapError(true);
    };
    
    document.head.appendChild(googleMapsScript);
    
    return () => {
      if (document.head.contains(googleMapsScript)) {
        document.head.removeChild(googleMapsScript);
      }
    };
  }, []);

  // Function to handle forward geocoding (address to coordinates)
  const forwardGeocode = (address) => {
    if (!window.google || !window.google.maps || !mapInstanceRef.current || !markerRef.current) return;
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        
        // Update map and marker
        mapInstanceRef.current.setCenter(location);
        markerRef.current.setPosition(location);
        
        // Update last selected position
        lastSelectedPosition.current = {
          lat: location.lat(),
          lng: location.lng()
        };
        
        // Update coordinates
        onCoordinatesChange({
          lat: location.lat(),
          lng: location.lng()
        });
        
        // Update location with formatted address
        const formattedAddress = results[0].formatted_address;
        setLocation(formattedAddress);
        onLocationChange(formattedAddress);
      } else {
        console.warn(`Geocoding failed for "${address}": ${status}`);
      }
    });
  };
  
  // Function to handle reverse geocoding (coordinates to address)
  const reverseGeocode = (coords) => {
    if (!window.google || !window.google.maps) return;
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: coords }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;
        setLocation(address);
        onLocationChange(address);
      } else {
        console.warn(`Reverse geocoding failed: ${status}`);
      }
    });
  };

  // Initialize map once API is loaded - only run ONCE
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || isInitialized) return;
    
    try {
      // Create map instance
      const map = new window.google.maps.Map(mapRef.current, {
        center: COLOMBO_COORDINATES,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true
      });
      
      // Create marker
      const marker = new window.google.maps.Marker({
        position: COLOMBO_COORDINATES,
        map: map,
        draggable: true,
        animation: window.google.maps.Animation.DROP
      });
      
      // Store in refs
      mapInstanceRef.current = map;
      markerRef.current = marker;
      lastSelectedPosition.current = COLOMBO_COORDINATES;
      
      // Setup map click handler
      map.addListener('click', (event) => {
        const clickedPos = event.latLng;
        marker.setPosition(clickedPos);
        
        // Store last selected position
        const lat = clickedPos.lat();
        const lng = clickedPos.lng();
        lastSelectedPosition.current = { lat, lng };
        
        // Update coordinates
        onCoordinatesChange({ lat, lng });
        
        // Reverse geocode to get address
        reverseGeocode({ lat, lng });
      });
      
      // Setup marker drag handler
      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        const lat = position.lat();
        const lng = position.lng();
        
        // Store last selected position
        lastSelectedPosition.current = { lat, lng };
        
        // Update coordinates
        onCoordinatesChange({ lat, lng });
        
        // Reverse geocode
        reverseGeocode({ lat, lng });
      });
      
      // Initialize Places Autocomplete
      if (window.google.maps.places && inputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode', 'establishment'],
          fields: ['place_id', 'formatted_address', 'geometry', 'name']
        });
        
        autocompleteRef.current = autocomplete;
        
        // Set autocomplete bounds to current map view
        autocomplete.bindTo('bounds', map);
        
        // When a place is selected
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (!place.geometry || !place.geometry.location) {
            console.warn('No details available for place:', place.name);
            return;
          }
          
          // If the place has a geometry, present it on the map
          if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
          } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
          }
          
          // Update marker position
          marker.setPosition(place.geometry.location);
          
          // Store last selected position
          lastSelectedPosition.current = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          
          // Get the address and coordinates
          const formattedAddress = place.formatted_address || place.name || '';
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          
          // Update state and parent component
          setLocation(formattedAddress);
          onLocationChange(formattedAddress);
          onCoordinatesChange({ lat, lng });
        });
      }
      
      // If initial location is provided, try to geocode
      if (initialLocation && initialLocation.trim() !== '') {
        forwardGeocode(initialLocation);
      } else {
        // If no initial location, use default and reverse geocode
        reverseGeocode(COLOMBO_COORDINATES);
        onCoordinatesChange(COLOMBO_COORDINATES);
      }
      
      // Mark as initialized to prevent recreation
      setIsInitialized(true);
      
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(true);
    }
  }, [mapLoaded, initialLocation, isInitialized]);
  
  // Effect to restore map position when component re-renders
  useEffect(() => {
    if (isInitialized && mapInstanceRef.current && markerRef.current && lastSelectedPosition.current) {
      // Restore the last selected position
      mapInstanceRef.current.setCenter(lastSelectedPosition.current);
      markerRef.current.setPosition(lastSelectedPosition.current);
    }
  }, [isInitialized]);

  // Handle input change
  const handleLocationChange = (e) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    onLocationChange(newLocation);
  };

  // Handle manual location update button click
  const handleUpdateLocation = () => {
    if (!location.trim() || !mapLoaded || mapError) return;
    forwardGeocode(location);
  };
  
  // Handle 'Enter' key in input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpdateLocation();
    }
  };

  // Styles
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '10px'
  };

  const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    position: 'relative'
  };

  const inputGroupStyle = {
    display: 'flex',
    width: '100%'
  };

  const inputStyle = {
    flex: 1,
    padding: '10px',
    borderRadius: '4px 0 0 4px',
    border: '1px solid #ddd',
    borderRight: 'none'
  };

  const buttonStyle = {
    padding: '10px 15px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '0 4px 4px 0',
    cursor: 'pointer'
  };

  const instructionStyle = {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginBottom: '5px'
  };

  const errorStyle = {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '8px',
    height: '300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #ddd'
  };
  
  const loadingOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    zIndex: 10
  };

  if (mapError) {
    return (
      <div style={containerStyle}>
        <div style={instructionStyle}>
          Enter a location address manually
        </div>
        <div style={inputGroupStyle}>
          <input
            type="text"
            value={location}
            onChange={handleLocationChange}
            placeholder={placeholder}
            style={inputStyle}
          />
          <button 
            type="button" 
            onClick={handleUpdateLocation}
            style={buttonStyle}
          >
            Update
          </button>
        </div>
        <div style={errorStyle}>
          Unable to load map. You can still enter an address manually.
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={instructionStyle}>
        Select a location by searching, clicking on the map, or dragging the marker
      </div>
      
      <div style={inputGroupStyle}>
        <input
          ref={inputRef}
          type="text"
          value={location}
          onChange={handleLocationChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          style={inputStyle}
        />
        <button 
          type="button" 
          onClick={handleUpdateLocation}
          style={buttonStyle}
        >
          Update Map
        </button>
      </div>
      
      <div style={mapContainerStyle}>
        <div id="map-container" ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
        {!mapLoaded && (
          <div style={loadingOverlayStyle}>
            Loading map...
          </div>
        )}
      </div>
    </div>
  );
};

LocationPicker.propTypes = {
  initialLocation: PropTypes.string,
  onLocationChange: PropTypes.func.isRequired,
  onCoordinatesChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string
};

export default LocationPicker;