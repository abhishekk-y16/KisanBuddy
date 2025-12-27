import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './ui';

interface WeatherModalProps {
  onClose?: () => void;
  inline?: boolean;
}

export function WeatherModal({ onClose, inline = false }: WeatherModalProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError(true),
      { timeout: 10000 }
    );
  }, []);

  // Reverse-geocode the coordinates to a human-readable place name using Nominatim
  useEffect(() => {
    let mounted = true;
    async function fetchPlace() {
      if (!location) {
        setPlaceName(null);
        return;
      }
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.lat}&lon=${location.lng}`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!mounted) return;
        if (!res.ok) {
          setPlaceName(null);
          return;
        }
        const data = await res.json();
        const display = data.display_name || data.name || null;
        setPlaceName(display);
      } catch (e) {
        setPlaceName(null);
      }
    }
    fetchPlace();
    return () => { mounted = false; };
  }, [location]);

  const mapIframe = location ? (
    <div className="rounded-xl overflow-hidden border">
      <div className="px-3 py-2 bg-neutral-50 text-sm text-neutral-700">
        {placeName ? placeName : `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
      </div>
      <a href={`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=12/${location.lat}/${location.lng}`} target="_blank" rel="noreferrer">
        <iframe
          title="Map preview"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.05}%2C${location.lat - 0.05}%2C${location.lng + 0.05}%2C${location.lat + 0.05}&layer=mapnik&marker=${location.lat}%2C${location.lng}`}
          style={{ width: '100%', height: '240px', border: 0 }}
        />
      </a>
      <p className="text-xs text-neutral-400 p-2">Map preview (OpenStreetMap). Tap map to open full map.</p>
    </div>
  ) : (
    <div className="text-center py-8">
      <p className="text-sm text-neutral-500">Location not available. Allow location access to see local hazards.</p>
      <Button variant="primary" onClick={() => window.location.reload()}>Enable Location</Button>
    </div>
  );

  const content = (
    <div className="space-y-4">
      {mapIframe}
    </div>
  );

  if (inline) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Weather Hazards</h2>
            <p className="text-sm text-neutral-500">मौसम चेतावनी</p>
          </div>
        </div>
        <div className="space-y-4">{content}</div>
      </div>
    );
  }

  return (
    <Modal title="Weather Hazards" subtitle="मौसम चेतावनी" onClose={onClose ?? (() => {})}>
      {content}
    </Modal>
  );
}
