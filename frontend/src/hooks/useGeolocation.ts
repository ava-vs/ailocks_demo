import { useState, useEffect } from 'react';
import { useAilockStore } from '../store/ailockStore';
import { useAuthStore } from '../store/authStore';

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export const useGeolocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setLocation } = useAilockStore();
  const { isAuthenticated } = useAuthStore();

  const getCurrentLocation = async () => {
    if (!navigator.geolocation || !isAuthenticated) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocoding to get city/country
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const data = await response.json();
        
        const locationData: LocationData = {
          latitude,
          longitude,
          city: data.city || data.locality,
          country: data.countryName
        };
        
        setLocation(locationData);
      } catch (geocodeError) {
        // If reverse geocoding fails, still set the coordinates
        setLocation({ latitude, longitude });
      }
    } catch (err) {
      setError('Unable to retrieve your location');
      console.error('Geolocation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      getCurrentLocation();
    }
  }, [isAuthenticated]);

  return { loading, error, getCurrentLocation };
};