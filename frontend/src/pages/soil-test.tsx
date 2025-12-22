import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SoilUploadCard from '@/components/soil/SoilUploadCard';
import ResultSummaryCard from '@/components/soil/ResultSummaryCard';
import ConfidenceMeter from '@/components/soil/ConfidenceMeter';
import StructuredReport from '@/components/soil/StructuredReport';

export default function SoilTestPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileList | null>(null);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!files || files.length === 0) {
      setError('Please select at least one soil image');
      return;
    }
    const form = new FormData();
    for (let i = 0; i < files.length; i++) form.append('images', files[i]);
    if (lat && lng) {
      form.append('location_lat', lat);
      form.append('location_lng', lng);
    }
    if (notes) form.append('notes', notes);

    try {
      setLoading(true);
      const apiBase = (process.env.NEXT_PUBLIC_API_URL as string) || 'http://localhost:8080';
      const res = await fetch(`${apiBase}/api/soil_test`, { method: 'POST', body: form });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Server error');
      }
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run soil test');
    } finally {
      setLoading(false);
    }
  }

  const generatePreviews = (f: FileList | null) => {
    setPreviews([]);
    if (!f || f.length === 0) return;
    const arr: string[] = [];
    for (let i = 0; i < f.length; i++) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target && typeof ev.target.result === 'string') {
          arr.push(ev.target.result);
          if (arr.length === f.length) setPreviews(arr);
        }
      };
      reader.readAsDataURL(f[i]);
    }
  };

  const handleFilesFromCard = (f: FileList | null) => {
    setFiles(f);
    generatePreviews(f);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <main className="max-w-5xl mx-auto px-6 lg:px-8">
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Soil Test</h1>
            <div className="text-sm text-neutral-500">Upload clear photos (1–4). Report is indicative.</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <SoilUploadCard onFiles={handleFilesFromCard} previews={previews} />
              </div>

              <div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Latitude</label>
                    <input type="text" value={lat} onChange={(e) => setLat(e.target.value)} className="mt-1 w-full" placeholder="21.2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Longitude</label>
                    <input type="text" value={lng} onChange={(e) => setLng(e.target.value)} className="mt-1 w-full" placeholder="81.3" />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-neutral-700">Farmer notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full" rows={4} placeholder="Recent crop, irrigation, fertiliser used..."></textarea>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? 'Analysing…' : 'Run Soil Test'}</Button>
              <Button variant="ghost" onClick={() => router.push('/')}>Back</Button>
              <Button variant="ghost" onClick={() => { setFiles(null); setPreviews([]); setReport(null); setError(null); }}>Reset</Button>
            </div>
          </form>

          {error && <div className="mt-4 text-red-600">Error: {error}</div>}

          {report && (
            <div className="mt-6 space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  <StructuredReport report={report} />

                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded shadow-sm">
                      <h3 className="font-semibold">🔍 What the Images Show</h3>
                      <div className="mt-2 text-sm bg-neutral-100 p-3 rounded">
                        {report.what_images_show && Object.keys(report.what_images_show).length ? (
                          <dl className="grid grid-cols-1 gap-2">
                            {Object.entries(report.what_images_show).map(([k, v]) => (
                              <div key={k} className="flex justify-between">
                                <dt className="font-medium text-neutral-700">{k.replace(/_/g, ' ')}</dt>
                                <dd className="text-neutral-600 ml-4">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : (
                          <div className="text-neutral-600">No structured observations available.</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded shadow-sm">
                      <h3 className="font-semibold">⚠️ Problems Identified</h3>
                      <ul className="list-disc ml-6 mt-2">{report.problems_identified && report.problems_identified.length ? report.problems_identified.map((p: string, i: number) => <li key={i}>{p}</li>) : <li>None obvious from images</li>}</ul>
                    </div>
                  </div>

                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded shadow-sm">
                      <h3 className="font-semibold">🧪 Likely Nutrient Status</h3>
                      <div className="mt-2 text-sm bg-neutral-100 p-3 rounded">
                        {report.likely_nutrient_status ? (
                          <ul className="list-none space-y-1">
                            <li><strong>pH:</strong> <span className="ml-2 text-neutral-700">{report.likely_nutrient_status.pH_range || report.likely_nutrient_status.pH || 'Unknown'}</span></li>
                            <li><strong>Organic carbon:</strong> <span className="ml-2 text-neutral-700">{report.likely_nutrient_status.organic_carbon || 'Unknown'}</span></li>
                            <li><strong>N:</strong> <span className="ml-2 text-neutral-700">{report.likely_nutrient_status.N || 'Unknown'}</span></li>
                            <li><strong>P:</strong> <span className="ml-2 text-neutral-700">{report.likely_nutrient_status.P || 'Unknown'}</span></li>
                            <li><strong>K:</strong> <span className="ml-2 text-neutral-700">{report.likely_nutrient_status.K || 'Unknown'}</span></li>
                          </ul>
                        ) : (
                          <div className="text-neutral-600">No nutrient inference available.</div>
                        )}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded shadow-sm">
                      <h3 className="font-semibold">🌿 Natural Improvements</h3>
                      <ul className="list-disc ml-6 mt-2">{report.natural_improvements && report.natural_improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  </div>

                  <div className="mt-4 bg-white p-4 rounded shadow-sm">
                    <h3 className="font-semibold">🌾 Crop Recommendations</h3>
                    <p className="mt-2"><strong>Best:</strong> {report.crop_recommendations?.best?.join(', ')}</p>
                    <p><strong>Avoid:</strong> {report.crop_recommendations?.avoid?.join(', ')}</p>
                  </div>
                </div>

                <aside className="space-y-4">
                  <div className="bg-white p-4 rounded shadow-sm">
                    <h3 className="font-semibold">📍 Nearby Testing Centers</h3>
                    {report.nearby_centers && report.nearby_centers.length ? (
                      <ul className="mt-2">
                        {report.nearby_centers.map((c: any, i: number) => (
                          <li key={i} className="mb-2">
                            <div className="font-medium">{c.name}</div>
                            <div className="text-sm text-neutral-600">{c.service} — {c.distance_km} km</div>
                          </li>
                        ))}
                      </ul>
                    ) : <div className="mt-2 text-sm text-neutral-600">No nearby centers found for this location.</div>}
                  </div>

                  <div className="bg-white p-4 rounded shadow-sm">
                    <h3 className="font-semibold">Model Confidence</h3>
                    <ConfidenceMeter value={typeof report.confidence === 'number' ? report.confidence : (report.confidence === 'indicative' ? 0.6 : 0)} />
                    <div className="text-sm text-neutral-500 mt-2">{report.confidence_note}</div>
                  </div>
                </aside>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
