import React from 'react'

type Props = { value?: number }

export default function ConfidenceMeter({ value = 0 }: Props) {
  const pct = Math.max(0, Math.min(1, value))
  const color = pct > 0.75 ? 'bg-green-500' : pct > 0.45 ? 'bg-yellow-500' : 'bg-red-500'
  const label = pct > 0.75 ? 'High' : pct > 0.45 ? 'Moderate' : 'Low'

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-600">Model confidence</div>
        <div className="text-sm font-medium text-neutral-700">{label} — {Math.round(pct * 100)}%</div>
      </div>
      <div className="mt-1 w-full bg-neutral-100 rounded h-3 overflow-hidden">
        <div className={`${color} h-3`} style={{ width: `${Math.round(pct * 100)}%` }} />
      </div>
    </div>
  )
}
