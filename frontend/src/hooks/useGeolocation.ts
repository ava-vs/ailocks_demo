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
  const { setLocation } = useAilockStore();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultLocation: LocationData = {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'USA',
  };

  const setAsDefaultLocation = (reason: string) => {
    console.log(`Setting default location (New York) because: ${reason}`);
    setLocation(defaultLocation);
    setLoading(false);
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setAsDefaultLocation('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          const locationData: LocationData = {
            latitude,
            longitude,
            city: data.city || data.locality || 'Unknown City',
            country: data.countryName || 'Unknown Country',
          };
          console.log('Successfully fetched geolocation:', locationData);
          setLocation(locationData);
        } catch (geocodeError) {
          console.error('Reverse geocoding failed:', geocodeError);
          setAsDefaultLocation('Reverse geocoding failed');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setAsDefaultLocation(`Geolocation permission denied or error: ${err.message}`);
      }
    );
  };

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, attempting to get location...');
      getCurrentLocation();
    }
  }, [isAuthenticated]);

  return { loading, error, getCurrentLocation };
};