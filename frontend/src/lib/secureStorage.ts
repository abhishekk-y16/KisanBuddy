import { set, get } from 'idb-keyval';

const KEY_PREFIX = 'kisan_mitra_key_';

export async function ensureKeyForFarmer(farmerId: string) {
  const keyName = KEY_PREFIX + farmerId;
  let key = await get(keyName);
  if (key) return key;

  // Generate a non-extractable AES-GCM 256 key
  const cryptoKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable
    ['encrypt', 'decrypt']
  );

  // Store CryptoKey via idb-keyval (structured clone). Some browsers allow storing CryptoKey objects.
  try {
    await set(keyName, cryptoKey);
    return cryptoKey;
  } catch (e) {
    console.warn('Failed to persist CryptoKey; key will be ephemeral for this session', e);
    return cryptoKey;
  }
}

export async function getKeyForFarmer(farmerId: string) {
  const keyName = KEY_PREFIX + farmerId;
  return await get(keyName);
}

export async function encryptForFarmer(farmerId: string, plaintext: string) {
  const key = await ensureKeyForFarmer(farmerId);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plaintext);
  const ct = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc);
  // Return base64 components
  const combined = new Uint8Array(iv.byteLength + ct.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptForFarmer(farmerId: string, b64: string) {
  const key = await getKeyForFarmer(farmerId);
  if (!key) throw new Error('No key');
  const data = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const iv = data.slice(0, 12);
  const ct = data.slice(12);
  const pt = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}
