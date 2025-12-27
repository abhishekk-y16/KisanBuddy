import React from 'react'
import { cleanString } from '@/lib/cleanFallbacks';

type Props = {
  report: any
}

export default function ResultSummaryCard({ report }: Props) {
  const cleanedSummary = cleanString(report?.summary)
  const hasSummary = Boolean(cleanedSummary)
  const hasConfidence = typeof report?.confidence === 'number' || report?.confidence === 'indicative'

  if (!hasSummary && !hasConfidence) return null

  const confidence = typeof report?.confidence === 'number'
    ? report.confidence
    : (report?.confidence === 'indicative' ? 0.6 : null)

  function exportReport() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'soil_report.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="bg-white p-4 rounded-lg shadow-sm border border-neutral-100">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">🌱 Soil Condition Summary</h2>
          {hasSummary && <p className="mt-2 text-neutral-700 text-sm">{cleanedSummary}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            {confidence !== null && (
              <div className="text-xs text-neutral-500">Photo confidence</div>
            )}
            {confidence !== null && (
              <div className="mt-1 w-24 h-4 bg-neutral-100 rounded overflow-hidden">
                <div style={{ width: `${Math.round(confidence * 100)}%` }} className={`h-4 ${confidence > 0.75 ? 'bg-green-500' : confidence > 0.45 ? 'bg-yellow-500' : 'bg-red-500'}`} />
              </div>
            )}
            {confidence !== null && (
              <div className="text-xs text-neutral-500 mt-1">{Math.round(confidence * 100)}%</div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <button onClick={() => window.print()} className="px-3 py-2 bg-neutral-50 border rounded-md text-sm">Print</button>
            <button onClick={exportReport} className="px-3 py-2 bg-primary-600 text-white rounded-md text-sm">Export</button>
          </div>
        </div>
      </div>
    </section>
  )
}
