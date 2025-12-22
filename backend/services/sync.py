import os
import sqlite3
from typing import List, Dict, Any, Optional

BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "sync.db")


def _get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_sync_db():
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS sync_docs (
            id TEXT PRIMARY KEY,
            payload TEXT,
            updated_at REAL
        )
        """
    )
    conn.commit()
    conn.close()


def push_docs(docs: List[Dict[str, Any]]):
    init_sync_db()
    conn = _get_conn()
    cur = conn.cursor()
    for d in docs:
        doc_id = d.get("id") or d.get("_id")
        payload = d
        updated = d.get("updated_at") or d.get("ts") or 0.0
        cur.execute(
            "INSERT OR REPLACE INTO sync_docs (id, payload, updated_at) VALUES (?, ?, ?)",
            (doc_id, str(payload), float(updated)),
        )
    conn.commit()
    conn.close()


def pull_docs(since_ts: Optional[float] = None) -> List[Dict[str, Any]]:
    init_sync_db()
    conn = _get_conn()
    cur = conn.cursor()
    if since_ts:
        cur.execute("SELECT id, payload, updated_at FROM sync_docs WHERE updated_at > ? ORDER BY updated_at", (since_ts,))
    else:
        cur.execute("SELECT id, payload, updated_at FROM sync_docs ORDER BY updated_at")
    rows = cur.fetchall()
    out = []
    for r in rows:
        try:
            # payload stored as str repr; in production store JSON
            out.append({"id": r["id"], "payload": r["payload"], "updated_at": r["updated_at"]})
        except Exception:
            continue
    conn.close()
    return out


class WebSocketHub:
    """Simple WebSocket hub for relay-based CRDT replication gateway.

    Clients connect and send JSON messages of the form:
      {"type":"patch"|"state","doc_id":..., "payload": {...}, "ts": 123456.0}

    The hub persists messages into the same `sync_docs` table (LWW by ts)
    and broadcasts incoming patches to all connected clients (except sender).
    """
    def __init__(self):
        from typing import Set
        self.connections: Set = set()

    def connect(self, websocket):
        self.connections.add(websocket)

    def disconnect(self, websocket):
        try:
            self.connections.remove(websocket)
        except Exception:
            pass

    async def broadcast_json(self, message: Dict[str, Any], exclude=None):
        import json, asyncio
        coros = []
        for ws in list(self.connections):
            if exclude is not None and ws is exclude:
                continue
            try:
                coros.append(ws.send_json(message))
            except Exception:
                try:
                    # older starlette/ws may require text
                    coros.append(ws.send_text(json.dumps(message)))
                except Exception:
                    pass
        if coros:
            await asyncio.gather(*coros, return_exceptions=True)

    def persist_patch(self, msg: Dict[str, Any]):
        # Persist the incoming document as LWW into sync_docs
        init_sync_db()
        conn = _get_conn()
        cur = conn.cursor()
        doc_id = msg.get("doc_id") or msg.get("id")
        payload = msg.get("payload") or {}
        ts = float(msg.get("ts") or msg.get("updated_at") or __import__('time').time())
        try:
            cur.execute(
                "INSERT OR REPLACE INTO sync_docs (id, payload, updated_at) VALUES (?, ?, ?)",
                (doc_id, str(payload), ts),
            )
            conn.commit()
        finally:
            conn.close()


# Single shared hub instance imported by FastAPI websocket endpoint
hub = WebSocketHub()
