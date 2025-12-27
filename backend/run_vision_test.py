import base64, io, os, json, sys
from PIL import Image
import httpx

# create a simple 512x512 green image
img = Image.new('RGB', (512,512), color=(34,139,34))
buf = io.BytesIO()
img.save(buf, format='JPEG')
b = buf.getvalue()
b64 = base64.b64encode(b).decode('utf-8')

payload = {
    "image_base64": b64,
    "crop": "Tomato",
    "language": "en",
    "_nonce": 12345
}

url = 'http://127.0.0.1:8000/api/vision_diagnostic'
try:
    with httpx.Client(timeout=120.0) as client:
        r = client.post(url, json=payload)
        print('STATUS', r.status_code)
        try:
            print(json.dumps(r.json(), indent=2)[:10000])
        except Exception:
            print((r.text or '')[:2000])
except Exception as e:
    print('ERR', e)
    sys.exit(2)
