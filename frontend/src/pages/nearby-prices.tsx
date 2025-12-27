import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/router'
import { getNearbyPrices } from '@/lib/api'

export default function NearbyPricesPage() {
  const router = useRouter()
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [commodity, setCommodity] = useState('Wheat')
  const [radius, setRadius] = useState('100')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  function askLocation() {
    setError(null)
    if (!navigator.geolocation) {
      setError('Geolocation not supported in this browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const p = pos.coords
        setLat(String(p.latitude))
        setLng(String(p.longitude))
      },
      err => {
        setError(err.message || 'Failed to get location')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function fetchNearby(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setError(null)
    if (!lat || !lng) {
      setError('Please provide or allow access to location')
      return
    }
    try {
      setLoading(true)
      const r = await getNearbyPrices(commodity, { lat: parseFloat(lat), lng: parseFloat(lng) }, parseInt(radius || '200', 10), 20)
      if (r.error) throw new Error(r.error)
      setResults(r.data?.nearby || [])
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch nearby prices')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <main className="max-w-3xl mx-auto px-4">
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Nearby Mandi Prices</h1>
            <div className="text-sm text-neutral-500">Find mandi prices within X km of your location</div>
          </div>

          <form onSubmit={fetchNearby} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Commodity</label>
                <select value={commodity} onChange={(e)=>setCommodity(e.target.value)} className="mt-1 w-full">
                  <option>Wheat</option>
                  <option>Rice</option>
                  <option>Maize</option>
                  <option>Onion</option>
                  <option>Tomato</option>
                  <option>Potato</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Radius (km)</label>
                <select value={radius} onChange={(e)=>setRadius(e.target.value)} className="mt-1 w-full">
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Latitude</label>
                <input value={lat} onChange={(e)=>setLat(e.target.value)} className="mt-1 w-full" placeholder="Allow location or enter lat" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Longitude</label>
                <input value={lng} onChange={(e)=>setLng(e.target.value)} className="mt-1 w-full" placeholder="Allow location or enter lng" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={askLocation}>Allow Location</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Searching…' : 'Find Nearby Prices'}</Button>
              <Button variant="ghost" onClick={() => router.push('/')}>Back</Button>
            </div>
          </form>

          {error && <div className="mt-4 text-red-600">{error}</div>}

          {results.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold">Found {results.length} mandis within {radius} km</h2>
              <ul className="mt-3 space-y-2">
                {results.map((r,i)=> (
                  <li key={i} className="p-3 bg-white rounded shadow-sm flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.city}</div>
                      <div className="text-sm text-neutral-600">{r.state || ''} • {r.distance_km} km • Price: ₹{r.modal_price}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <a className="text-primary-600" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.city + (r.state ? ', ' + r.state : ''))}`}>Open in Maps</a>
                    </div>
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
