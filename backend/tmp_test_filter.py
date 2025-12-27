import os, sys, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from services.agmarknet import filter_markets_by_distance

origin = (21.2293, 81.3481)
markets = [
    {"name": "Nagpur APMC", "lat": 20.5340173, "lon": 78.8327986},
    {"name": "Mumbai APMC", "lat": 19.0830223, "lon": 73.0096292},
    {"name": "Ahmedabad APMC", "lat": 22.9977445, "lon": 72.5371222},
    {"name": "Ranebennur APMC", "lat": 14.6213399, "lon": 75.6391703},
    {"name": "Kalyan APMC", "lat": 19.1824833, "lon": 74.1005514}
]

for radius in (100, 200, 500):
    out = filter_markets_by_distance(markets, origin, radius_km=radius)
    print(f"\n--- radius_km={radius} -> {len(out)} markets ---")
    print(json.dumps(out, indent=2))
