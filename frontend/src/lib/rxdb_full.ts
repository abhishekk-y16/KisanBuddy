import { createRxDatabase, addRxPlugin } from 'rxdb'
// Import IDB adapter and replication plugin dynamically at runtime
// to avoid breaking environments without build-time setup.

let db: any = null

export async function initRxDB() {
  if (db) return db
  try {
    const { getRxStorageIndexedDB } = await import('rxdb/plugins/storage-indexeddb')
    const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode')
    addRxPlugin(RxDBDevModePlugin)
    const storage = getRxStorageIndexedDB()
    db = await createRxDatabase({ name: 'kisan_mitra_rxdb', storage })

    // create a simple diagnoses collection
    if (!db.collections || !db.collections.diagnoses) {
      await db.addCollections({
        diagnoses: {
          schema: {
            title: 'diagnosis schema',
            version: 0,
            primaryKey: 'id',
            type: 'object',
            properties: {
              id: { type: 'string' },
              user: { type: 'string' },
              createdAt: { type: 'string' },
              payload: { type: 'object' }
            }
          }
        }
      })
    }

    return db
  } catch (e) {
    console.warn('RxDB not available in this environment', e)
    throw e
  }
}

export async function demoPushPullSync(db: any, userId: string) {
  // Simple LWW (last-write-wins) demo sync harness using polling to backend endpoints.
  const col = db.diagnoses
  // Push local docs
  const all = await col.find().exec()
  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '') || `${location.protocol}//${location.hostname}:${location.port}`;
  for (const doc of all) {
    try {
      await fetch(`${base}/api/diagnosis_history`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(doc.toJSON()) })
    } catch (e) {
      // ignore network errors
    }
  }

  // Pull remote history and upsert
  try {
    const r = await fetch(`${base}/api/diagnosis_history`)
    if (r.ok) {
      const body = await r.json()
      const remote = body.history || []
      for (const item of remote) {
        try {
          await col.upsert({ id: item.id || item._id || String(Math.random()), user: userId, createdAt: item.createdAt || new Date().toISOString(), payload: item })
        } catch (e) {}
      }
    }
  } catch (e) {}

  // WebSocket-based replication (gateway at /ws/sync)
  try {
    const wsProto = (base.startsWith('https') ? 'wss' : 'ws');
    // derive host from base (strip protocol)
    const host = base.replace(/^https?:\/\//, '');
    const url = `${wsProto}://${host.replace(/\/$/, '')}/ws/sync`;
    const ws = new WebSocket(url)
    ws.addEventListener('open', () => console.log('rxdb sync ws connected'))
    ws.addEventListener('message', async (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        const docId = msg.doc_id || msg.id || (msg.payload && msg.payload.id)
        const payload = msg.payload || {}
        if (!docId) return
        await col.upsert({ id: docId, user: userId, createdAt: new Date().toISOString(), payload })
      } catch (e) {
        // ignore
      }
    })

    // Send local documents as patches on open
    ws.addEventListener('open', async () => {
      const docs = await col.find().exec()
      for (const d of docs) {
        try {
          const j = d.toJSON()
          ws.send(JSON.stringify({ type: 'patch', doc_id: j.id, payload: j, ts: Date.now() / 1000.0 }))
        } catch (e) {}
      }
    })
  } catch (e) {
    console.warn('WS replication not available', e)
  }
}
