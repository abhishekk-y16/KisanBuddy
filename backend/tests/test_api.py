import json
from fastapi.testclient import TestClient
import pytest

from backend.main import app

client = TestClient(app)


def test_anthrokrishi_parcel_by_location():
    # Call anthrokrishi_parcel with location and expect s2_cell to be returned
    payload = {"location": {"lat": 17.3850, "lng": 78.4867}}
    r = client.post("/api/anthrokrishi_parcel", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "s2_cell" in data
    assert isinstance(data["s2_cell"], str)


def test_vision_poi_stub(monkeypatch):
    # Patch poi_using_models to return deterministic output
    def fake_poi(b64):
        return {"DLA": 5.0, "TLA": 100.0, "POI": 5.0, "stage": "low", "pipeline": "test"}

    monkeypatch.setattr("services.vision.poi_using_models", fake_poi)
    payload = {"image_base64": "ZmFrZV9pbWFnZQ=="}
    r = client.post("/api/vision_poi", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["POI"] == 5.0
    assert data["stage"] == "low"


def test_agmarknet_nearby_stub(monkeypatch):
    # Patch find_nearest_mandis to avoid network calls
    def fake_find(commodity, origin, radius_km=100, top_n=5, fuel_rate_per_ton_km=0.05, mandi_fees=0.0):
        return [
            {"city": "TestMandi", "state": "TS", "modal_price": 1200.0, "distance_km": 10.0, "effective_price": 1199.5}
        ]

    monkeypatch.setattr("services.agmarknet.find_nearest_mandis", fake_find)
    payload = {
        "commodity": "Tomato",
        "location": {"lat": 17.3850, "lng": 78.4867},
        "radius_km": 50,
        "top_n": 3,
        "fuel_rate_per_ton_km": 0.05,
        "mandi_fees": 10.0
    }
    r = client.post("/api/agmarknet_nearby", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "nearby" in data
    assert len(data["nearby"]) == 1
    assert data["nearby"][0]["city"] == "TestMandi"