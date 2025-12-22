# Frontend Integration Notes

This file documents quick usage for the new frontend helpers:

- `src/lib/secureStorage.ts` - Web Crypto AES-256-GCM non-extractable key generation, store via `idb-keyval`.
  - Usage example:

```ts
import { ensureKeyForFarmer, encryptForFarmer, decryptForFarmer } from './lib/secureStorage';

await ensureKeyForFarmer('FARMER123');
const ct = await encryptForFarmer('FARMER123', 'sensitive-data');
const pt = await decryptForFarmer('FARMER123', ct);
```

- `src/lib/rxdb.ts` - Lightweight IndexedDB helper using `idb` for local diagnosis storage. Replace with `rxdb`+CRDT adapter in production.

- `src/lib/cobraVAD.ts` - Cobra VAD stub exposing `initCobraVAD()`; integrate real WASM or native library later.

Installation:

```bash
cd frontend
npm install
```

Build and export:

```bash
npm run build
npm run export
```
