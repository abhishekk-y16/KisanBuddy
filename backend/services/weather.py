import os
from typing import Dict, Any, Optional
import httpx
import logging
from datetime import datetime, timedelta

TOMORROW_API_KEY = os.getenv("TOMORROW_API_KEY", "")
TOMORROW_BASE = "https://api.tomorrow.io/v4/timelines"

logger = logging.getLogger(__name__)


def fetch_weather(location: Dict[str, float], exclude: Optional[str] = "minutely") -> Dict[str, Any]:
    """Fetch weather data from Tomorrow.io or fall back to Open-Meteo.
    
    Requires TOMORROW_API_KEY environment variable for Tomorrow.io.
    Falls back to Open-Meteo (no key required) if unavailable.
    """
    lat = location.get("lat")
    lon = location.get("lng") or location.get("lon")
    if lat is None or lon is None:
        raise ValueError("location requires lat and lng/lon")
    
    # Prefer Tomorrow.io if configured
    if TOMORROW_API_KEY:
        try:
            return fetch_weather_tomorrow(location)
        except Exception as e:
            logger.warning("Tomorrow.io weather fetch failed: %s, falling back to Open-Meteo", e)
            try:
                return fetch_weather_open_meteo(location)
            except Exception as e2:
                raise ValueError(f"Weather API error: {e}; fallback error: {e2}")
    
    # If no Tomorrow.io key, use Open-Meteo directly
    logger.info("TOMORROW_API_KEY not configured, using Open-Meteo")
    return fetch_weather_open_meteo(location)


def fetch_weather_tomorrow(location: Dict[str, float], days: int = 14) -> Dict[str, Any]:
    """Fetch weather using Tomorrow.io Timelines API and normalize to a OneCall-like structure.

    This returns a dict with keys: `source`, `daily`, `current`, `raw` similar to other providers.
    """
    if not TOMORROW_API_KEY:
        raise ValueError("TOMORROW_API_KEY not configured")

    lat = location.get("lat")
    lon = location.get("lng") or location.get("lon")
    if lat is None or lon is None:
        raise ValueError("location requires lat and lng/lon")

    now = datetime.utcnow()
    start = now.isoformat(timespec='seconds') + "Z"
    end = (now + timedelta(days=days)).isoformat(timespec='seconds') + "Z"

    body = {
        "location": f"{lat},{lon}",
        "fields": [
            "temperature",
            "windSpeed",
            "humidity",
            "precipitationProbability",
            "precipitationIntensity"
        ],
        "timesteps": ["current", "1d"],
        "units": "metric",
        "startTime": start,
        "endTime": end,
    }

    params = {"apikey": TOMORROW_API_KEY}

    with httpx.Client(timeout=20.0) as client:
        resp = client.post(TOMORROW_BASE, params=params, json=body)
        resp.raise_for_status()
        raw = resp.json()

    # Parse timelines
    data = raw.get("data", {})
    timelines = data.get("timelines", [])
    daily = []
    current = {}

    # current
    for tl in timelines:
        if tl.get("timestep") == "current":
            intervals = tl.get("intervals", [])
            if intervals:
                vals = intervals[0].get("values", {})
                current = {
                    "dt": intervals[0].get("startTime"),
                    "temp": vals.get("temperature"),
                    "feels_like": vals.get("temperature"),
                    "humidity": vals.get("humidity"),
                    "wind_speed": vals.get("windSpeed", 0.0),
                    "weather": [{"description": ""}],
                }

    # daily
    for tl in timelines:
        if tl.get("timestep") == "1d":
            for interval in tl.get("intervals", [])[:days]:
                vals = interval.get("values", {})
                temp = vals.get("temperature")
                pop = (vals.get("precipitationProbability") or 0) / 100.0
                precip_int = vals.get("precipitationIntensity") or 0.0
                # approximate daily rain as intensity * 24 hours
                rain_mm = float(precip_int or 0.0) * 24.0
                wind = vals.get("windSpeed", 0.0)
                entry = {
                    "dt": interval.get("startTime"),
                    "temp": {"min": temp, "max": temp},
                    "pop": pop,
                    "wind_speed": wind,
                    "rain": rain_mm,
                    "weather": [{"description": ""}],
                }
                daily.append(entry)
            break

    return {"source": "tomorrow", "daily": daily, "current": current, "raw": raw}


def fetch_weather_open_meteo(location: Dict[str, float], days: int = 16) -> Dict[str, Any]:
    """Fallback to Open-Meteo public API. Returns a OneCall-like dict with `daily` entries.

    This provides free global forecasts (up to ~16 days) without an API key and is suitable
    as a fallback for small/remote places in India.
    """
    lat = location.get("lat")
    lon = location.get("lng") or location.get("lon")
    if lat is None or lon is None:
        raise ValueError("location requires lat and lng/lon")

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max",
        "hourly": "temperature_2m,relativehumidity_2m,precipitation,winddirection_10m,wind_speed_10m",
        "timezone": "auto",
        "forecast_days": days,
    }
    with httpx.Client(timeout=20.0) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
        raw = resp.json()

    # Normalize to a minimal OneCall-like structure used by crop_advisories and farmer_report
    daily = []
    d = raw.get("daily", {})
    times = d.get("time", [])
    tmax = d.get("temperature_2m_max", [])
    tmin = d.get("temperature_2m_min", [])
    precip = d.get("precipitation_sum", [])
    windmax = d.get("windspeed_10m_max", [])

    for i, day in enumerate(times):
        # Safe float conversion - handle None values from API
        min_temp = None
        if i < len(tmin) and tmin[i] is not None:
            min_temp = float(tmin[i])
        
        max_temp = None
        if i < len(tmax) and tmax[i] is not None:
            max_temp = float(tmax[i])
        
        wind_val = 0.0
        if i < len(windmax) and windmax[i] is not None:
            wind_val = float(windmax[i])
        
        rain_val = 0.0
        if i < len(precip) and precip[i] is not None:
            rain_val = float(precip[i])
        
        entry = {
            "dt": day,
            "temp": {
                "min": min_temp,
                "max": max_temp,
            },
            "pop": 0.0,
            "wind_speed": wind_val,
            "rain": rain_val,
        }
        daily.append(entry)

    # Build a `current` object from hourly where possible
    current = {}
    try:
        hourly = raw.get("hourly", {})
        htime = hourly.get("time", [])
        if htime:
            # Use first available hourly entry as 'current'
            cur_idx = 0
            temp_h = hourly.get("temperature_2m", [])
            hum_h = hourly.get("relativehumidity_2m", [])
            wind_h = hourly.get("wind_speed_10m", []) or hourly.get("windspeed_10m", [])
            precip_h = hourly.get("precipitation", [])

            temp_val = None
            if cur_idx < len(temp_h) and temp_h[cur_idx] is not None:
                temp_val = float(temp_h[cur_idx])
            
            hum_val = None
            if cur_idx < len(hum_h) and hum_h[cur_idx] is not None:
                hum_val = int(hum_h[cur_idx])
            
            wind_val = 0.0
            if cur_idx < len(wind_h) and wind_h[cur_idx] is not None:
                wind_val = float(wind_h[cur_idx])

            current = {
                "dt": htime[cur_idx],
                "temp": temp_val,
                "feels_like": temp_val,
                "humidity": hum_val,
                "wind_speed": wind_val,
                "weather": [{"description": ""}],
            }
    except Exception:
        current = {"temp": None, "feels_like": None, "humidity": None, "wind_speed": 0.0, "weather": [{"description": ""}]}

    return {"source": "open-meteo", "daily": daily, "current": current, "raw": raw}


def crop_advisories(forecast: Dict[str, Any], crop: Optional[str] = None) -> Dict[str, Any]:
    adv = []
    # Simple rule-based advisories
    # Check daily forecasts for extremes in next 7 days
    days = forecast.get("daily", [])[:7]
    for d in days:
        temp = d.get("temp", {})
        max_t = temp.get("max") if temp else None
        min_t = temp.get("min") if temp else None
        pop = d.get("pop", 0)
        weather = d.get("weather", [])
        main = weather[0]["main"] if weather else ""
        if max_t is not None and max_t >= 40:
            adv.append("High daytime temperatures expected — consider irrigation and heat stress measures.")
        if min_t is not None and min_t <= 2:
            adv.append("Low night temperatures expected — protect sensitive crops from frost.")
        if pop and pop > 0.6:
            adv.append("High probability of heavy rain — secure seedlings and improve drainage.")
        if main.lower() in ["thunderstorm"]:
            adv.append("Thunderstorm risk — avoid field operations and secure shade nets.")
    # Alerts if provided by provider
    alerts = forecast.get("alerts", [])
    for a in alerts:
        adv.append(f"Alert: {a.get('event')}: {a.get('description', '')[:200]}")

    # Basic crop-specific note
    if crop:
        adv.append(f"General advice for {crop}: monitor pest/disease risk after heavy rains; adjust nutrient schedule if stress observed.")

    return {"advisories": adv, "summary_days": len(days)}


def _sum_precip(days: list, days_n: int = 7) -> float:
    total = 0.0
    for d in days[:days_n]:
        # OpenWeather uses 'rain' or 'pop' probabilities; prefer 'rain' mm if present
        r = d.get("rain") or d.get("rain", 0) or 0
        try:
            total += float(r)
        except Exception:
            # sometimes `rain` is dict for hourly; skip
            continue
    return round(total, 2)


def farmer_report(forecast: Dict[str, Any], crop: Optional[str] = None, horizon_days: int = 14) -> Dict[str, Any]:
    """Produce farmer-oriented summary from a OneCall-style forecast.

    Returns:
      - 7/14-day rainfall totals
      - heatwave/frost day counts
      - average windspeed and high-wind warnings
      - recommended irrigation pressure (simple heuristic)
      - daily condensed forecast (date, temp_min, temp_max, pop, wind_speed, rain)
    """
    out = {
        "horizon_days": horizon_days,
        "rain_7d_mm": 0.0,
        "rain_14d_mm": 0.0,
        "heat_days": 0,
        "frost_days": 0,
        "avg_wind_kmh": 0.0,
        "high_wind_days": 0,
        "daily": [],
        "irrigation_recommendation": "no_data",
    }

    daily = forecast.get("daily") or []
    # Ensure we have at least horizon_days entries in daily; clamp
    horizon = min(horizon_days, len(daily)) if daily else 0

    # Build condensed daily list
    wind_sum = 0.0
    wind_count = 0
    for i in range(horizon):
        d = daily[i]
        dt = d.get("dt")
        temp = d.get("temp") or {}
        tmin = temp.get("min") if temp else None
        tmax = temp.get("max") if temp else None
        pop = d.get("pop", 0.0)
        wind = d.get("wind_speed", 0.0)
        rain = d.get("rain", 0.0)

        # basic checks
        if tmax is not None and tmax >= 40:
            out["heat_days"] += 1
        if tmin is not None and tmin <= 2:
            out["frost_days"] += 1
        if wind and wind >= 10.0:
            out["high_wind_days"] += 1

        wind_sum += float(wind or 0.0)
        wind_count += 1

        out["daily"].append({
            "dt": dt,
            "temp_min": tmin,
            "temp_max": tmax,
            "pop": round(float(pop or 0.0), 2),
            "wind_speed_m_s": round(float(wind or 0.0), 2),
            "rain_mm": round(float(rain or 0.0), 2),
        })

    # Rain sums (use whatever rain fields are present)
    out["rain_7d_mm"] = _sum_precip(daily, days_n=min(7, len(daily)))
    out["rain_14d_mm"] = _sum_precip(daily, days_n=min(14, len(daily)))

    out["avg_wind_kmh"] = round((wind_sum / max(1, wind_count)) * 3.6, 2) if wind_count else 0.0

    # Simple irrigation heuristic:
    # - if upcoming 7d rain < 10mm and heat_days > 0 -> recommend irrigating soon
    # - if upcoming 7d rain > 30mm -> delay irrigation
    rain7 = out["rain_7d_mm"]
    if rain7 < 10 and out["heat_days"] > 0:
        out["irrigation_recommendation"] = "Irrigate within next 48 hours; upcoming week looks dry and hot."
    elif rain7 > 30:
        out["irrigation_recommendation"] = "Delay irrigation; substantial rainfall expected in next 7 days."
    else:
        out["irrigation_recommendation"] = "Monitor soil moisture; light rain expected."

    # Add crop-specific note (very basic)
    if crop:
        out["crop_note"] = f"For {crop}: monitor pests after heavy rain; adjust fertiliser if prolonged wet period."

    return out
