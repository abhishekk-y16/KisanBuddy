import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SoilUploader from '@/components/soil/SoilUploader';
import SummaryCard from '@/components/soil/SummaryCard';
import GroqCard from '@/components/soil/GroqCard';
import ConfidenceMeter from '@/components/soil/ConfidenceMeter';
import { cleanString, cleanArray, cleanLikely } from '@/lib/cleanFallbacks';

export default function SoilTestPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[] | null>(null);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [notes, setNotes] = useState('');
  const [sampleDepth, setSampleDepth] = useState('');
  const [soilTexture, setSoilTexture] = useState('');
  const [soilMoisture, setSoilMoisture] = useState('');
  const [recentFertilizer, setRecentFertilizer] = useState('');
  const [observedSymptoms, setObservedSymptoms] = useState('');
  const [phValue, setPhValue] = useState('');
  const [dateSampled, setDateSampled] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [geoAvail, setGeoAvail] = useState<'unknown'|'available'|'unavailable'>('unknown');
  const [geoStatus, setGeoStatus] = useState<string>('idle');
  const [geoPerm, setGeoPerm] = useState<'unknown'|'granted'|'denied'|'prompt'>('unknown');
  const [autoGeoRequested, setAutoGeoRequested] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const merged = [...(files || [])];
    if (!merged || merged.length === 0) {
      setError('Please select at least one soil image');
      return;
    }
    const form = new FormData();
    for (let i = 0; i < merged.length; i++) form.append('images', merged[i]);
    if (lat && lng) {
      form.append('location_lat', lat);
      form.append('location_lng', lng);
    }
    if (notes) form.append('notes', notes);
    if (sampleDepth) form.append('sample_depth_cm', sampleDepth);
    if (soilTexture) form.append('soil_texture', soilTexture);
    if (soilMoisture) form.append('soil_moisture', soilMoisture);
    if (recentFertilizer) form.append('recent_fertilizer', recentFertilizer);
    if (observedSymptoms) form.append('observed_symptoms', observedSymptoms);
    if (phValue) form.append('ph', phValue);
    if (dateSampled) form.append('date_sampled', dateSampled);

    try {
      setLoading(true);
      const r = await (await import('@/lib/api')).formPost<any>('/api/soil_test', form);
      if (r.error) throw new Error(r.error);
      setReport(r.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to run soil test');
    } finally {
      setLoading(false);
    }
  }

  const generatePreviewsFromFiles = (filesArr: File[]) => {
    setPreviews([]);
    if (!filesArr || filesArr.length === 0) return;
    const arr: string[] = [];
    filesArr.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target && typeof ev.target.result === 'string') {
          arr.push(ev.target.result);
          if (arr.length === filesArr.length) setPreviews(arr);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFilesFromCard = (f: File[] | null) => {
    setFiles(f);
    const merged = [...(f || [])];
    generatePreviewsFromFiles(merged);
  };

  // Nearby soil testing centres state
  const [nearbyCenters, setNearbyCenters] = useState<any[]>([]);
  const [centersLoading, setCentersLoading] = useState(false);
  const [centersError, setCentersError] = useState<string | null>(null);

  const fetchNearbyCenters = async (latS?: string, lngS?: string) => {
    const latVal = latS || lat;
    const lngVal = lngS || lng;
    if (!latVal || !lngVal) {
      setCentersError('Location not available');
      return;
    }
    setCentersLoading(true);
    setCentersError(null);
    try {
      const backendBase = (process.env.NEXT_PUBLIC_API_URL as string) || 'http://127.0.0.1:8000';
      const url = `${backendBase.replace(/\/$/, '')}/api/geoapify/places?lat=${encodeURIComponent(latVal)}&lng=${encodeURIComponent(lngVal)}&q=soil+testing&limit=6`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`${res.status}: ${txt.substring(0, 100)}`);
      }
      const j = await res.json();
      const features = Array.isArray(j.features) ? j.features : [];
      setNearbyCenters(features.length > 0 ? features : []);
      if (features.length === 0) {
        setCentersError('No soil testing centres found nearby');
      }
    } catch (e: any) {
      const msg = e?.message || 'Failed to fetch nearby centres';
      setCentersError(msg.includes('timeout') || msg.includes('aborted') ? 'Nearby request timed out (server may be slow). Please Retry Nearby.' : msg);
    } finally {
      setCentersLoading(false);
    }
  };

  // Determine whether Groq AI output is present and usable (not demo/fallback/error)
  const groqUsable = (r: any) => {
    if (!r) return false;
    // Check both grok_analysis and groq_analysis (typo variations)
    const g = r.grok_analysis || r.groq_analysis;
    if (!g) return false;
    if (g.error) return false;
    const pipeline = String(g.pipeline || '').toLowerCase();
    const bad = ['demo', 'fallback', 'heuristic', 'error'];
    for (const b of bad) if (pipeline.includes(b)) return false;
    return true;
  };

  useEffect(() => {
    try {
      const ok = typeof navigator !== 'undefined' && !!navigator.geolocation;
      setGeoAvail(ok ? 'available' : 'unavailable');
    } catch (e) {
      setGeoAvail('unavailable');
    }
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).permissions && (navigator as any).permissions.query) {
        (navigator as any).permissions.query({ name: 'geolocation' }).then((res: any) => {
          if (res.state === 'granted') setGeoPerm('granted');
          else if (res.state === 'denied') setGeoPerm('denied');
          else setGeoPerm('prompt');
          res.onchange = () => {
            try {
              if (res.state === 'granted') setGeoPerm('granted');
              else if (res.state === 'denied') setGeoPerm('denied');
              else setGeoPerm('prompt');
            } catch (e) {}
          };
        }).catch(() => setGeoPerm('unknown'));
      }
    } catch (e) {}

    // Auto-request geolocation on page load (always prompt when user visits this page)
    try {
      const ok = typeof navigator !== 'undefined' && !!navigator.geolocation;
      if (ok) {
        setAutoGeoRequested(true);
        setGeoStatus('auto-requesting');
        try {
          navigator.geolocation.getCurrentPosition((pos) => {
            const latS = String(pos.coords.latitude);
            const lngS = String(pos.coords.longitude);
            setLat(latS);
            setLng(lngS);
            setGeoStatus(`ok: ${latS}, ${lngS}`);
          }, (err) => {
            const msg = err && err.message ? err.message : 'Unknown geolocation error';
            setGeoStatus(`error: ${msg}`);
          }, { enableHighAccuracy: false, timeout: 15000 });
        } catch (e) {
          setGeoStatus('auto-request-failed');
        }
      }
    } catch (e) {}
  }, []);

  // Fetch nearby centres whenever we obtain coords
  useEffect(() => {
    if (lat && lng) {
      fetchNearbyCenters(lat, lng);
    }
  }, [lat, lng]);

  const hasWhatData = Boolean(
    report?.what_images_show?.color_description ||
    report?.what_images_show?.dominant_texture ||
    report?.what_images_show?.likely ||
    ((report?.grok_analysis || report?.groq_analysis) && (
      (report.grok_analysis || report.groq_analysis).color_description || 
      (report.grok_analysis || report.groq_analysis).dominant_texture || 
      (report.grok_analysis || report.groq_analysis).likely
    ))
  );

  const hasNutrientIndicators = Boolean(
    report?.likely_nutrient_status && Object.keys(report.likely_nutrient_status).length > 0
  );

  const hasNaturalImprovements = Array.isArray(report?.natural_improvements) && report.natural_improvements.length > 0;


  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🧪</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Soil Analysis</h1>
                <p className="text-xs text-neutral-500">मिट्टी परीक्षण</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => router.push('/')} className="text-sm">
              ← Home
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sidebar - Tips & Info */}
          <div className="lg:col-span-4 space-y-6">
            <Card variant="elevated" className="bg-white/90 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center">
                    <span className="text-2xl">📸</span>
                  </div>
                  <h2 className="text-lg font-bold text-neutral-900">Photo Tips</h2>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                      <span className="text-green-600">✓</span> Do
                    </h3>
                    <ul className="space-y-1 text-neutral-600 ml-6">
                      <li>• Take photos in natural daylight</li>
                      <li>• Show soil texture and color clearly</li>
                      <li>• Include close-ups and context shots</li>
                      <li>• Capture moist soil when possible</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                      <span className="text-red-600">✗</span> Avoid
                    </h3>
                    <ul className="space-y-1 text-neutral-600 ml-6">
                      <li>• Harsh shadows or direct flash</li>
                      <li>• Blurry or out-of-focus images</li>
                      <li>• Too much vegetation cover</li>
                      <li>• Mixed soil from different areas</li>
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-neutral-200">
                    <h3 className="font-semibold text-neutral-900 mb-2">💡 Pro Tips</h3>
                    <ul className="space-y-1 text-neutral-600">
                      <li>• Sample from 0-15cm depth for accuracy</li>
                      <li>• Note recent fertilizer applications</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
            {/* Nearby Labs feature removed per request */}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            <Card variant="elevated" className="bg-white/90 backdrop-blur-sm">
              <div className="p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-6">Upload Soil Images</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Image Uploader */}
                  <SoilUploader onFiles={handleFilesFromCard} previews={previews} />

                  {/* Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Latitude</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={lat} 
                          onChange={(e) => setLat(e.target.value)} 
                          className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
                          placeholder="21.2" 
                        />
                        <button 
                          type="button" 
                          onClick={async () => {
                            setGeoStatus('requesting');
                            if (!navigator?.geolocation) { 
                              setGeoStatus('unavailable'); 
                              setError('Geolocation not available'); 
                              return; 
                            }
                            setError(null);
                            try {
                              await new Promise<void>((res, rej) => {
                                navigator.geolocation.getCurrentPosition((pos) => {
                                  const latS = String(pos.coords.latitude);
                                  const lngS = String(pos.coords.longitude);
                                  setLat(latS);
                                  setLng(lngS);
                                  setGeoStatus(`ok`);
                                  res();
                                }, (err) => {
                                  const msg = err?.message || 'Location error';
                                  setGeoStatus(`error`);
                                  if (err?.code === 1) setError('Location permission denied');
                                  else setError(msg);
                                  rej(err);
                                }, { enableHighAccuracy: false, timeout: 15000 });
                              });
                            } catch (err: any) {
                              setGeoStatus('failed');
                            }
                          }} 
                          className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-sm font-medium transition"
                        >
                          📍 Use Location
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Longitude</label>
                      <input 
                        type="text" 
                        value={lng} 
                        onChange={(e) => setLng(e.target.value)} 
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
                        placeholder="81.3" 
                      />
                    </div>
                  </div>

                  {/* Farmer Notes */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Farmer Notes (Optional)</label>
                    <textarea 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
                      rows={3} 
                      placeholder="Recent crop, irrigation, fertilizer used..."
                    />
                  </div>

                  {/* Soil Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Depth (cm)</label>
                      <input 
                        type="number" 
                        min={1} 
                        max={500} 
                        value={sampleDepth} 
                        onChange={(e) => setSampleDepth(e.target.value)} 
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
                        placeholder="15" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Texture</label>
                      <select 
                        value={soilTexture} 
                        onChange={(e) => setSoilTexture(e.target.value)} 
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      >
                        <option value="">Select</option>
                        <option>Sandy</option>
                        <option>Loam</option>
                        <option>Clay</option>
                        <option>Silty</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Moisture</label>
                      <select 
                        value={soilMoisture} 
                        onChange={(e) => setSoilMoisture(e.target.value)} 
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      >
                        <option value="">Select</option>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">pH</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        min={0} 
                        max={14} 
                        value={phValue} 
                        onChange={(e) => setPhValue(e.target.value)} 
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
                        placeholder="6.5" 
                      />
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Recent Fertilizer</label>
                      <input 
                        value={recentFertilizer} 
                        onChange={(e) => setRecentFertilizer(e.target.value)} 
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
                        placeholder="e.g. Urea 50kg/ha" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Observed Symptoms</label>
                      <input 
                        value={observedSymptoms} 
                        onChange={(e) => setObservedSymptoms(e.target.value)} 
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
                        placeholder="e.g. salt crusting" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Date Sampled</label>
                    <input 
                      type="date" 
                      value={dateSampled} 
                      onChange={(e) => setDateSampled(e.target.value)} 
                      className="w-48 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
                    />
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 flex items-center gap-2">
                        <span>⚠️</span>
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg"
                    >
                      {loading ? '🔬 Analyzing...' : '🔬 Analyze Soil'}
                    </Button>
                    <Button 
                      variant="secondary" 
                      type="button"
                      onClick={() => { 
                        setFiles(null); 
                        setPreviews([]); 
                        setReport(null); 
                        setError(null); 
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </form>
              </div>
            </Card>

            {/* Nearby Soil Testing Centres */}
            <Card variant="elevated" className="bg-white/90 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">🏪 Nearby Soil Testing Centres</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Button 
                      variant="secondary" 
                    onClick={() => fetchNearbyCenters(lat, lng)}
                    disabled={centersLoading || !lat || !lng}
                    className="px-4 py-2"
                  >
                    {centersLoading ? 'Searching...' : 'Find Nearby Centres'}
                  </Button>
                  {centersError && (
                    <div className="text-sm text-red-600 flex items-center gap-2">
                      <span>⚠️</span>
                      {centersError}
                      {centersError.includes('timed out') && (
                        <button 
                          onClick={() => fetchNearbyCenters(lat, lng)}
                          className="ml-2 underline text-red-700 hover:text-red-800 font-medium"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {nearbyCenters.length > 0 && (
                  <div className="grid gap-3 mt-4">
                    {nearbyCenters.slice(0, 6).map((c, idx) => {
                      const p = c.properties || {};
                      const name = p.name || p.formatted || p.address_line1 || 'Soil Testing Centre';
                      const addr = p.address_line2 || p.address || p.street || '';
                      const phone = p.phone || p.contact_phone || '';
                      const website = p.website || p.url || '';
                      const mapUrl = website || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + addr)}`;
                      return (
                        <a 
                          key={idx} 
                          href={mapUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="font-semibold text-neutral-900 truncate">{name}</div>
                          {addr && <div className="text-sm text-neutral-600 truncate">{addr}</div>}
                          {phone && <div className="text-xs text-neutral-500 mt-1">📞 {phone}</div>}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Results Section */}
            {report && (
              <div className="space-y-6">
                <Card variant="elevated" className="bg-white/90 backdrop-blur-sm">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                        <span className="text-2xl">✓</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-neutral-900">Analysis Results</h2>
                        <p className="text-sm text-neutral-500">Visual assessment with AI when available</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <SummaryCard report={report} />
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Model Confidence</h3>
                          <ConfidenceMeter 
                            value={(report.confidence?.value) || ((report.grok_analysis || report.groq_analysis)?.confidence ?? 0.3)} 
                            photoOnly={true} 
                          />
                        </div>

                        {groqUsable(report) && (
                          <GroqCard grok_analysis={report.grok_analysis || report.groq_analysis} />
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
