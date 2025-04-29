import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const LocationDisplay = ({ location, coordinates, height = '300px' }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const mapRef = useRef(null);
  
  // Default to Colombo, Sri Lanka
  const COLOMBO_COORDINATES = { lat: 6.9271, lng: 79.8612 };

  // Load Google Maps API script
  useEffect(() => {
    // Check if script is already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }
    
    const googleMapsScript = document.createElement('script');
    googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&v=beta`;
    googleMapsScript.async = true;
    googleMapsScript.defer = true;
    
    googleMapsScript.onload = () => {
      setMapLoaded(true);
    };
    
    googleMapsScript.onerror = () => {
      setMapError(true);
      console.error('Failed to load Google Maps API');
    };
    
    document.head.appendChild(googleMapsScript);
    
    return () => {
      // Clean up script when component unmounts
      if (document.head.contains(googleMapsScript)) {
        document.head.removeChild(googleMapsScript);
      }
    };
  }, []);

  // Initialize map once API is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    try {
      // Default to Colombo, Sri Lanka if no coordinates provided
      const defaultLocation = COLOMBO_COORDINATES;
      
      const mapOptions = {
        center: coordinates || defaultLocation,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true
      };
      
      const map = new window.google.maps.Map(mapRef.current, mapOptions);
      
      // Create a marker
      new window.google.maps.Marker({
        position: coordinates || defaultLocation,
        map: map,
        title: location || 'Selected Location'
      });
      
      // If coordinates are not provided but location is, geocode to get coordinates
      if (!coordinates && location) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: location }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const position = results[0].geometry.location;
            map.setCenter(position);
            
            // Add marker at geocoded position
            new window.google.maps.Marker({
              position: position,
              map: map,
              title: location
            });
          } else {
            // If geocoding fails, use default location
            console.warn('Geocoding failed, using default location');
            map.setCenter(defaultLocation);
          }
        });
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(true);
    }
  }, [mapLoaded, location, coordinates]);

  const mapContainerStyle = {
    width: '100%',
    height: height,
    borderRadius: '8px',
    border: '1px solid #ddd',
    overflow: 'hidden'
  };

  const loadingStyle = { 
    textAlign: 'center', 
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    height: height,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #ddd'
  };

  const errorStyle = {
    ...loadingStyle,
    backgroundColor: '#fee2e2',
    color: '#b91c1c'
  };

  if (mapError) {
    return (
      <div style={errorStyle}>
        Unable to load map. Please check your internet connection or API key.
      </div>
    );
  }

  return (
    <div>
      {!mapLoaded ? (
        <div style={loadingStyle}>
          Loading map...
        </div>
      ) : (
        <div id="map-display-container" ref={mapRef} style={mapContainerStyle} />
      )}
    </div>
  );
};

LocationDisplay.propTypes = {
  location: PropTypes.string,
  coordinates: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  height: PropTypes.string
};

export default LocationDisplay; 