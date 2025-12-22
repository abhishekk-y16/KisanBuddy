import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/router'

export default function FilterMarketsPage() {
  const router = useRouter()
  const [text, setText] = useState('Sirali APMC\nBaran APMC\nEtawah APMC\nSitapur APMC\nBadayoun APMC')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [radius, setRadius] = useState('100')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  async function runFilter(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setError(null)
    const lines = text.split('\n').map(s => s.trim()).filter(Boolean)
    if (!lines.length) {
      setError('Please paste at least one market name')
      return
    }
    if (!lat || !lng) {
      setError('Please enter latitude and longitude')
      return
    }

    const apiBase = (process.env.NEXT_PUBLIC_API_URL as string) || 'http://localhost:8080'
    const payload = {
      markets: lines.map(n => ({ name: n })),
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radius_km: parseFloat(radius || '100')
    }

    try {
      setLoading(true)
      const res = await fetch(`${apiBase}/api/filter_markets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const txt = await res.text().catch(()=>null)
        throw new Error(txt || 'Server error')
      }
      const j = await res.json()
      setResults(j.markets || [])
    } catch (err: any) {
      setError(err.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <main className="max-w-3xl mx-auto px-4">
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Filter Markets by Distance</h1>
            <div className="text-sm text-neutral-500">Find markets within radius from your location</div>
          </div>

          <form onSubmit={runFilter} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">Paste market names (one per line)</label>
              <textarea value={text} onChange={(e)=>setText(e.target.value)} rows={6} className="mt-1 w-full" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Latitude</label>
                <input value={lat} onChange={(e)=>setLat(e.target.value)} className="mt-1 w-full" placeholder="21.229682" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Longitude</label>
                <input value={lng} onChange={(e)=>setLng(e.target.value)} className="mt-1 w-full" placeholder="81.348352" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Radius km</label>
                <input value={radius} onChange={(e)=>setRadius(e.target.value)} className="mt-1 w-full" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? 'Filtering…' : 'Filter Markets'}</Button>
              <Button variant="ghost" onClick={() => router.push('/')}>Back</Button>
            </div>
          </form>

          {error && <div className="mt-4 text-red-600">{error}</div>}

          {results.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold">Markets within {radius} km</h2>
              <ul className="mt-3 space-y-2">
                {results.map((r,i)=> (
                  <li key={i} className="p-3 bg-white rounded shadow-sm flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.name || r.city}</div>
                      <div className="text-sm text-neutral-600">{r.distance_km} km • {r.lat?.toFixed?.(4)},{r.lon?.toFixed?.(4)}</div>
                    </div>
                    <a className="text-primary-600" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name||r.city)}`}>Open in Maps</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
