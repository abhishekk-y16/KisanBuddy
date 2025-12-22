from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_sync_push_pull():
    docs = [{"id": "d1", "payload": {"foo": "bar"}, "updated_at": 1.0}]
    r = client.post('/api/sync/push', json=docs)
    assert r.status_code == 200
    r2 = client.get('/api/sync/pull')
    assert r2.status_code == 200
    data = r2.json()
    assert 'docs' in data
    