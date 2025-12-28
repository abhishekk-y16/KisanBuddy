import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './ui';
import { getHazards } from '@/lib/api';

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

  const [hazards, setHazards] = useState<{ flood_risk?: number; drought_risk?: number; window_days?: number } | null>(null);
  const [hazardsError, setHazardsError] = useState<string | null>(null);

  // Fetch hazards when location is available
  useEffect(() => {
    let mounted = true;
    async function loadHazards() {
      if (!location) return;
      try {
        const resp = await getHazards(location);
        if (!mounted) return;
        if (resp.error) {
          setHazardsError(resp.error);
          setHazards(null);
          return;
        }
        setHazards(resp.data ?? null);
        setHazardsError(null);
      } catch (e) {
        if (!mounted) return;
        setHazardsError((e as any)?.message ?? 'Failed to load hazards');
        setHazards(null);
      }
    }
    loadHazards();
    return () => { mounted = false; };
  }, [location]);

  const mapIframe = null; // map intentionally removed — show hazards instead

  const content = (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-neutral-500 mb-2">{placeName ? placeName : (location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Location unknown')}</div>
        {hazardsError && (
          <div className="text-xs text-red-600">{hazardsError}</div>
        )}
        {hazards ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded">
              <div className="text-xs text-neutral-600">Flood Risk</div>
              <div className="text-2xl font-semibold text-amber-700">{typeof hazards.flood_risk === 'number' ? `${Math.round(hazards.flood_risk * 100)}%` : '--'}</div>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <div className="text-xs text-neutral-600">Drought Risk</div>
              <div className="text-2xl font-semibold text-yellow-700">{typeof hazards.drought_risk === 'number' ? `${Math.round(hazards.drought_risk * 100)}%` : '--'}</div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded">
              <div className="text-xs text-neutral-600">Advisory Window (days)</div>
              <div className="text-2xl font-semibold text-slate-800">{Math.min(hazards.window_days ?? 7, 7)}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-neutral-500">No hazard data available.</div>
        )}
      </div>
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
