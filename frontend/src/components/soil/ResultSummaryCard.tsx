import React from 'react'

type Props = {
  report: any
}

export default function ResultSummaryCard({ report }: Props) {
  const summary = report?.summary || 'No summary available.'
  const confidence = typeof report?.confidence === 'number' ? report.confidence : (report?.confidence === 'indicative' ? 0.6 : 0)

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
    <section className="bg-white p-4 rounded shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">🌱 Soil Condition Summary</h2>
          <p className="mt-2 text-neutral-700">{summary}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button onClick={() => window.print()} className="px-3 py-2 bg-neutral-50 border rounded-md text-sm">Print</button>
          <button onClick={exportReport} className="px-3 py-2 bg-primary-600 text-white rounded-md text-sm">Export JSON</button>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-neutral-600">Confidence</div>
        <div className="mt-2 w-full bg-neutral-100 rounded overflow-hidden h-4">
          <div style={{ width: `${Math.round(confidence * 100)}%` }} className={`h-4 ${confidence > 0.75 ? 'bg-green-500' : confidence > 0.45 ? 'bg-yellow-500' : 'bg-red-500'}`} />
        </div>
        <div className="text-xs text-neutral-500 mt-1">{Math.round(confidence * 100)}% — {report.confidence_note || 'Image-based diagnosis is indicative.'}</div>
      </div>
    </section>
  )
}
