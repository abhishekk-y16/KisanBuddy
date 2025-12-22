// Cobra VAD glue stub
// Real integration would use a WASM module or native library providing Cobra VAD.
// This stub exposes the same API surface so UI code can be wired up.

export async function initCobraVAD(options: any = {}) {
  console.log('Cobra VAD init (fallback) — energy VAD', options);

  // Energy-based VAD fallback: compute short-time energy on Float32 PCM
  function _toFloat32Array(buffer: ArrayBuffer): Float32Array {
    // If already Float32Array, return view
    if (buffer instanceof Float32Array) return buffer as unknown as Float32Array;
    try {
      return new Float32Array(buffer);
    } catch (e) {
      // Try to interpret as Int16 PCM
      const view = new DataView(buffer);
      const out = new Float32Array(buffer.byteLength / 2);
      for (let i = 0; i < out.length; i++) {
        out[i] = view.getInt16(i * 2, true) / 32768;
      }
      return out;
    }
  }

  async function detectSpeechSegments(buffer: ArrayBuffer, sampleRate = 16000) {
    const pcm = _toFloat32Array(buffer);
    const frameMs = 30;
    const frameLen = Math.max(1, Math.round((sampleRate * frameMs) / 1000));
    const energy: number[] = [];
    for (let i = 0; i < pcm.length; i += frameLen) {
      let sum = 0;
      for (let j = i; j < Math.min(i + frameLen, pcm.length); j++) {
        sum += pcm[j] * pcm[j];
      }
      energy.push(sum / frameLen);
    }
    // adaptive threshold: median * k
    const copy = energy.slice().sort((a, b) => a - b);
    const med = copy[Math.floor(copy.length / 2)] || 0;
    const threshold = Math.max(1e-6, med * 5.0);

    const segments: { start: number; end: number }[] = [];
    let active = false;
    let segStart = 0;
    for (let i = 0; i < energy.length; i++) {
      if (!active && energy[i] > threshold) {
        active = true;
        segStart = i * frameLen;
      } else if (active && energy[i] <= threshold) {
        active = false;
        segments.push({ start: segStart, end: i * frameLen });
      }
    }
    if (active) segments.push({ start: segStart, end: pcm.length });

    // Convert sample indices to byte offsets (Float32 => 4 bytes per sample)
    const byteSegments = segments.map(s => ({ start: s.start * 4, end: s.end * 4 }));
    if (byteSegments.length === 0) return [{ start: 0, end: buffer.byteLength }];
    return byteSegments;
  }

  return {
    processAudioBuffer: async (buffer: ArrayBuffer) => {
      // No-op for fallback
      return buffer;
    },
    detectSpeechSegments: async (buffer: ArrayBuffer, sampleRate = 16000) => {
      try {
        return await detectSpeechSegments(buffer, sampleRate);
      } catch (e) {
        console.warn('VAD fallback failed, returning whole buffer', e);
        return [{ start: 0, end: buffer.byteLength }];
      }
    }
  };
}
