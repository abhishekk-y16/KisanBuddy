const FALLBACK_STRINGS = [
  'Visual assessment — lab testing recommended.',
  'Image-based diagnosis is indicative.',
  'Review the evidence and follow sampling instructions.',
  'No visual indicators available',
  'No natural improvements suggested',
  'No follow-ups suggested',
  'None obvious',
  'None obvious from images',
  'AI diagnosis not available or is a fallback/demo result. Only Groq AI outputs are shown on this page.'
];

function isFallbackString(s?: string | null) {
  if (!s) return true;
  const t = String(s).trim();
  if (!t) return true;
  for (const f of FALLBACK_STRINGS) {
    if (t === f) return true;
    if (t.includes(f)) return true;
  }
  // small heuristics
  const lower = t.toLowerCase();
  // Previously we filtered out strings that mentioned 'indicative' + 'lab'
  // which removed many Groq heuristic outputs like "indicative – needs lab test".
  // Keep those visible to the user; only filter clear fallback/demo markers.
  if (lower.includes('fallback') || lower.includes('demo') || lower.includes('heuristic')) return true;
  return false;
}

export function cleanString(s?: string | null) {
  if (!s) return '';
  return isFallbackString(s) ? '' : String(s).trim();
}

export function cleanArray(arr?: any[]) {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.map((a) => String(a || '').trim()).filter((x) => x && !isFallbackString(x));
}

export function cleanLikely(obj?: Record<string, any>) {
  if (!obj || typeof obj !== 'object') return {};
  const out: Record<string, any> = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') {
      const cv = cleanString(v);
      if (cv) out[k] = cv;
    } else {
      out[k] = v;
    }
  }
  return out;
}

export default { cleanString, cleanArray, cleanLikely };
