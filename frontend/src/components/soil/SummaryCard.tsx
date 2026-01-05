import React from 'react';
import { cleanString } from '@/lib/cleanFallbacks';

export default function SummaryCard({ report }: any) {
  const conf = typeof report?.confidence === 'number' ? report.confidence : (typeof report?.grok_analysis?.confidence === 'number' ? report.grok_analysis.confidence : null);
  const summary = cleanString(report?.summary) || cleanString(report?.short_summary) || cleanString(report?.what_images_show?.summary) || '';
  const notes = cleanString(report?.notes) || '';
  const primaryAction = Array.isArray(report?.recommended_actions?.immediate) && report.recommended_actions.immediate.length ? String(report.recommended_actions.immediate[0]) : null;

  // If there's no meaningful content, don't render the summary card
  if (!summary && !notes && !primaryAction && conf === null && !report?.what_images_show) return null;

  const what = report?.what_images_show || {};
  const likely = what?.likely || report?.likely_nutrient_status || {};
  const natural = report?.natural_improvements || what?.natural_improvements || [];

  return (
    <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-md">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          {summary ? (
            <h2 className="text-2xl font-bold text-neutral-900 leading-tight">{summary}</h2>
          ) : (
            <h2 className="text-2xl font-semibold text-neutral-900">Soil report</h2>
          )}

          {notes && <p className="mt-2 text-sm text-neutral-600">{notes}</p>}

          {report?.submitted_metadata && (
            <div className="mt-4 flex flex-wrap gap-2">
              {report.submitted_metadata.sample_depth_cm !== undefined && (
                <div className="px-3 py-1 bg-neutral-50 rounded-full border text-xs text-neutral-700">Depth: <span className="font-medium">{String(report.submitted_metadata.sample_depth_cm)} cm</span></div>
              )}
              {report.submitted_metadata.soil_texture && (
                <div className="px-3 py-1 bg-neutral-50 rounded-full border text-xs text-neutral-700">Texture: <span className="font-medium">{report.submitted_metadata.soil_texture}</span></div>
              )}
              {report.submitted_metadata.soil_moisture && (
                <div className="px-3 py-1 bg-neutral-50 rounded-full border text-xs text-neutral-700">Moisture: <span className="font-medium">{report.submitted_metadata.soil_moisture}</span></div>
              )}
              {report.submitted_metadata.ph !== undefined && (
                <div className="px-3 py-1 bg-neutral-50 rounded-full border text-xs text-neutral-700">pH: <span className="font-medium">{String(report.submitted_metadata.ph)}</span></div>
              )}
              {report.submitted_metadata.date_sampled && (
                <div className="px-3 py-1 bg-neutral-50 rounded-full border text-xs text-neutral-700">Sampled: <span className="font-medium">{report.submitted_metadata.date_sampled}</span></div>
              )}
            </div>
          )}

          {/* What the images show */}
          { (what.color_description || what.dominant_texture || Object.keys(likely || {}).length) && (
            <div className="mt-6">
              <div className="text-sm font-semibold text-neutral-800">🔍 What the images show</div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {what.color_description && (
                  <div className="p-3 bg-neutral-50 rounded-lg border text-sm text-neutral-700">
                    <div className="text-xs text-neutral-500">Color description</div>
                    <div className="font-medium mt-1">{cleanString(what.color_description)}</div>
                  </div>
                )}

                {what.dominant_texture && (
                  <div className="p-3 bg-neutral-50 rounded-lg border text-sm text-neutral-700">
                    <div className="text-xs text-neutral-500">Dominant texture</div>
                    <div className="font-medium mt-1">{cleanString(what.dominant_texture)}</div>
                  </div>
                )}

                {Object.keys(likely || {}).length > 0 && (
                  <div className="col-span-1 md:col-span-2 p-3 bg-white rounded-lg border">
                    <div className="text-xs text-neutral-500">Likely (visual indicators)</div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(likely).map(([k, v]) => {
                        const keyLabel = (k || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace('P H', 'pH');
                        return (
                          <div key={k} className="p-3 bg-neutral-50 rounded-lg border flex flex-col justify-between h-full">
                            <div className="text-xs text-neutral-500">{keyLabel}</div>
                            <div className="mt-2 text-sm font-semibold text-neutral-800">{cleanString(String(v))}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Natural improvements */}
          {natural && natural.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-semibold text-neutral-800">🌿 Natural Improvements Needed</div>
              <div className="mt-3 grid gap-3">
                {natural.map((n: any, i: number) => (
                  <div key={i} className="p-3 bg-white rounded-lg border flex items-start gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-none mt-1 text-green-600">
                      <path d="M20 6L9 17l-5-5" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-sm text-neutral-700">{cleanString(String(n))}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            {primaryAction && (
              <div>
                <div className="text-xs text-neutral-500">Primary action</div>
                <div className="font-medium mt-1 text-neutral-800">{primaryAction}</div>
              </div>
            )}

            {conf !== null && (
              <div>
                <div className="text-xs text-neutral-500">Model confidence</div>
                <div className="font-semibold mt-1 text-neutral-800">{Number(conf).toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Compact confidence badge */}
        {conf !== null && (
          <div className="w-28 h-28 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-400 flex items-center justify-center shadow-inner">
              <div className="text-white text-lg font-bold">{Math.round(conf * 100)}%</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
