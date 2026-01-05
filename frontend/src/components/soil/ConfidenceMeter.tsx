import React from 'react'

type Props = { value?: number; photoOnly?: boolean }

export default function ConfidenceMeter({ value = 0, photoOnly = false }: Props) {
  // For photo-only soil analysis, cap at low confidence regardless of input
  let pct = Math.max(0, Math.min(1, value))
  if (photoOnly) {
    pct = Math.min(pct, 0.35)  // Cap at 35% for photo-only analysis
  }
  
  const color = pct > 0.75 ? 'bg-green-500' : pct > 0.45 ? 'bg-yellow-500' : 'bg-red-500'
  const label = pct > 0.75 ? 'High' : pct > 0.45 ? 'Moderate' : 'Low'

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-700 font-medium">
          {photoOnly ? 'Photo confidence' : 'Model confidence'}
        </div>
        <div className="text-sm font-semibold text-neutral-800">{label} — {Math.round(pct * 100)}%</div>
      </div>
      <div className="mt-1 w-full bg-neutral-200 rounded h-3 overflow-hidden">
        <div className={`${color} h-3`} style={{ width: `${Math.round(pct * 100)}%` }} />
      </div>
      {photoOnly && (
        <div className="mt-2 text-xs text-amber-700 italic">
          ⚠️ Photo-Based Analysis Provides Visual Cues Only
        </div>
      )}
    </div>
  )
}
