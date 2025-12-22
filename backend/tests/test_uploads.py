from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_upload_model_reject_non_pth():
    r = client.post('/api/upload_model', files={'file': ('test.txt', b'abc')})
    assert r.status_code == 400


def test_ndvi_timeseries():
    payload = {"location": {"lat": 17.3850, "lng": 78.4867}}
    r = client.post('/api/ndvi_timeseries', json=payload)
    assert r.status_code == 200
    data = r.json()
    assert 'ndvi_timeseries' in data
    