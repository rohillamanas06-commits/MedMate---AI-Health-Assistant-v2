import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Star, Clock, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

interface Hospital {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  open_now?: boolean;
  place_id?: string;
}

export default function Hospitals() {
  const { theme } = useTheme();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response: any = await api.findNearbyHospitals(latitude, longitude);
            setHospitals(response.hospitals || []);
            setUserLocation({ lat: latitude, lng: longitude });
            toast.success(`Found ${response.hospitals?.length || 0} nearby hospitals`);
          } catch (error) {
            toast.error('Failed to find hospitals');
          } finally {
            setLoading(false);
          }
        },
        () => {
          toast.error('Location access denied');
          setLoading(false);
        }
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };

  const getDirections = (hospital: Hospital) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;
    window.open(url, '_blank');
  };

  const calculateDistance = (lat: number, lng: number) => {
    if (!userLocation) return null;

    const R = 6371; // Earth's radius in km
    const dLat = ((lat - userLocation.lat) * Math.PI) / 180;
    const dLng = ((lng - userLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8">
      <div className="container max-w-6xl">
        <div className="mb-8 text-center animate-slide-up">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Find Nearby Hospitals</h1>
          <p className="text-muted-foreground text-lg">
            Locate medical facilities near you using your current location
          </p>
        </div>


        {loading ? (
          <Card className="p-12 text-center glass">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Searching for hospitals...</p>
          </Card>
        ) : hospitals.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {hospitals.map((hospital, index) => (
              <Card
                key={index}
                className="p-6 hover-lift glass animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{hospital.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {hospital.address}
                    </p>
                  </div>
                  {hospital.rating > 0 && (
                    <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="text-sm font-semibold">{hospital.rating}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {userLocation && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Navigation className="h-4 w-4" />
                      <span>
                        {calculateDistance(hospital.latitude, hospital.longitude)} km away
                      </span>
                    </div>
                  )}
                  {hospital.open_now !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <span
                        className={hospital.open_now ? (theme === 'med' ? 'text-green-500' : 'text-secondary') : 'text-destructive'}
                      >
                        {hospital.open_now ? 'Open Now' : 'Closed'}
                      </span>
                    </div>
                  )}
                </div>

                <Button onClick={() => getDirections(hospital)} className="w-full">
                  <Navigation className="h-4 w-4 mr-2" />
                  Get Directions
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center glass">
            <MapPin className="h-24 w-24 mx-auto mb-4 text-muted-foreground opacity-30 animate-float" />
            <h3 className="text-xl font-semibold mb-2">No Hospitals Found</h3>
            <p className="text-muted-foreground mb-6">
              Use your current location to find nearby hospitals
            </p>
            <Button onClick={handleCurrentLocation}>
              <Navigation className="h-4 w-4 mr-2" />
              Use Current Location
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
