import httpx
import json

url = 'http://127.0.0.1:8000/api/vision_diagnostic'
payload = {"image_url": "https://upload.wikimedia.org/wikipedia/commons/4/47/Tomato_leaf.JPG"}

print('Posting to', url)
with httpx.Client(timeout=120.0) as client:
    r = client.post(url, json=payload)
    print('HTTP', r.status_code)
    try:
        data = r.json()
        print(json.dumps(data, indent=2)[:4000])
    except Exception:
        print(r.text[:4000])
