import React from 'react'
import { cleanString, cleanLikely } from '@/lib/cleanFallbacks';

type Report = {
  color_description?: string
  dominant_texture?: string
  likely?: Record<string, any>
  issues?: string[]
  confidence?: string | number
}

export default function StructuredReport({ report }: { report: Report }) {
  const likely = cleanLikely(report.likely || {})

  return (
    <section className="bg-white p-4 rounded shadow-sm">
      <h2 className="text-lg font-semibold">Soil Observations</h2>

      <div className="mt-3 grid gap-3">
        <div className="flex items-start gap-4">
          <div className="w-36 text-sm text-neutral-600">Color</div>
          <div className="text-neutral-800">{cleanString(report.color_description) || '—'}</div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-36 text-sm text-neutral-600">Texture</div>
          <div className="text-neutral-800">{cleanString(report.dominant_texture) || '—'}</div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-36 text-sm text-neutral-600">Likely (indicative)</div>
          <div className="text-neutral-800">
            <ul className="space-y-1">
              <li><span className="font-medium">pH:</span> <span className="ml-2">{likely.pH_range || likely.pH || 'Unknown'}</span></li>
              <li><span className="font-medium">Organic carbon:</span> <span className="ml-2">{likely.organic_carbon || 'Unknown'}</span></li>
              <li><span className="font-medium">N:</span> <span className="ml-2">{likely.N || 'Unknown'}</span></li>
              <li><span className="font-medium">P:</span> <span className="ml-2">{likely.P || 'Unknown'}</span></li>
              <li><span className="font-medium">K:</span> <span className="ml-2">{likely.K || 'Unknown'}</span></li>
            </ul>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-36 text-sm text-neutral-600">Issues</div>
          <div className="text-neutral-800">{report.issues && report.issues.length ? (<ul className="list-disc ml-5">{report.issues.map((it, i) => <li key={i}>{it}</li>)}</ul>) : (<span className="text-neutral-600">None obvious</span>)}</div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-36 text-sm text-neutral-600">Confidence</div>
          <div className="text-neutral-800">{typeof report.confidence === 'number' ? `${Math.round(report.confidence * 100)}%` : String(report.confidence || 'Indicative')}</div>
        </div>
      </div>
    </section>
  )
}
