import json
from fastapi.testclient import TestClient
import pytest

from backend.main import app

client = TestClient(app)


def test_spread_velocity_basic(monkeypatch):
    # Patch NDVI timeseries and weather to deterministic values
    def fake_ndvi(location, days=30):
        today = '2025-12-20'
        ts = []
        # create slight decline over 7 days
        for i in range(30):
            ts.append({"date": f"2025-12-{i+1:02d}", "ndvi": 0.6 - i * 0.001})
        return {"location": location, "days": days, "ndvi_timeseries": ts}

    def fake_weather(location):
        # return hourly humidity 80% for 48 hours
        hours = [{"humidity": 80} for _ in range(48)]
        return {"hourly": hours}

    monkeypatch.setattr("services.earth_engine.fetch_ndvi_timeseries", fake_ndvi)
    monkeypatch.setattr("services.weather.fetch_weather", fake_weather)

    payload = {"location": {"lat": 17.3850, "lng": 78.4867}, "current_poi": 20.0}
    r = client.post("/api/spread_velocity", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "velocity_pct_per_day" in data
    assert data["poi"] == 20.0
    