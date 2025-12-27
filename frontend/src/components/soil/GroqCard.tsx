import React from 'react';
import { cleanString, cleanArray, cleanLikely } from '@/lib/cleanFallbacks';

export default function GroqCard({ grok_analysis }: any) {
  const isGrokUsable = (g: any) => {
    if (!g) return false;
    if (g.error) return false;
    const p = (g.pipeline || '').toString();
    if (!p) return true;
    const bad = ['demo', 'fallback', 'heuristic', 'error'];
    for (const b of bad) if (p.includes(b)) return false;
    return true;
  };

  if (!isGrokUsable(grok_analysis)) return null;
  const color = cleanString(grok_analysis?.color_description);
  const texture = cleanString(grok_analysis?.dominant_texture);
  const followups = cleanArray(grok_analysis?.suggested_followups);
  const naturalImprovements = cleanArray(grok_analysis?.natural_improvements);
  const likelyObj = cleanLikely(grok_analysis?.likely);
  return (
    <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">AI Analysis</h3>
          {grok_analysis?.diagnosis && (
            <div className="text-sm text-neutral-600 mt-1">{grok_analysis.diagnosis}{grok_analysis.diagnosisHindi ? ` — ${grok_analysis.diagnosisHindi}` : ''}</div>
          )}
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-2">
            <div className="text-xs text-neutral-500">Confidence</div>
            <div className="px-2 py-1 rounded-full bg-green-100 text-green-800 font-semibold text-sm">
                {isGrokUsable(grok_analysis) && grok_analysis?.confidence ? String(grok_analysis.confidence) : 'N/A'}
              </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <div className="text-xs text-neutral-500">Color</div>
            <div className="mt-1 text-neutral-800 font-medium">{color || '—'}</div>
          </div>

          <div>
            <div className="text-xs text-neutral-500">Texture</div>
            <div className="mt-1 text-neutral-800 font-medium">{texture || '—'}</div>
          </div>

            {grok_analysis?.warnings && grok_analysis.warnings.length > 0 && (
            <div className="mt-1 text-xs text-amber-700">
              {grok_analysis.warnings.map((w: string, i: number) => (
                <div key={i}>⚠️ {w}</div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs text-neutral-500">Visual indicators</div>
          <div className="mt-2 bg-neutral-50 border border-neutral-100 rounded p-3 text-sm text-neutral-700">
            {Object.keys(likelyObj || {}).length ? (
              Object.entries(likelyObj).map(([k, v]: any) => (
                <div key={k} className="flex justify-between py-1 border-b last:border-b-0">
                  <div className="text-neutral-600">{k.replace(/_/g, ' ')}</div>
                  <div className="font-medium text-neutral-800">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
                </div>
              ))
            ) : (
              <div className="text-neutral-600">No visual indicators available</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-neutral-500">Suggested follow-ups</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {followups.map((s: string, i: number) => (
              <span key={i} className="text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded">{s}</span>
            ))}
            {followups.length === 0 && (
              <div className="text-neutral-600 text-sm">No follow-ups suggested</div>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-500">Natural improvements (AI)</div>
          <ul className="mt-2 list-disc ml-5 text-sm text-neutral-700">
            {naturalImprovements.slice(0,5).map((n: string, i: number) => (
              <li key={i}>{n}</li>
            ))}
            {naturalImprovements.length === 0 && (
              <div className="text-neutral-600">No natural improvements suggested</div>
            )}
          </ul>
        </div>
      </div>

      {grok_analysis?.nearby_testing_advice && (
        <div className="mt-4 p-3 rounded border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-700">
          <strong>Nearby testing advice:</strong> {grok_analysis.nearby_testing_advice}
        </div>
      )}
    </div>
  );
}
