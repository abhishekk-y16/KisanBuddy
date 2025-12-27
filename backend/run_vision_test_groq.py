import base64, io, os, json, sys
import numpy as np
from PIL import Image
import httpx

# generate a 512x512 textured image with varied brightness
arr = np.random.randint(60,200,size=(512,512,3),dtype=np.uint8)
# add some lines to increase edges
for i in range(50,462,40):
    arr[i:i+2,50:462] = [10,80,20]

img = Image.fromarray(arr, 'RGB')
buf = io.BytesIO()
img.save(buf, format='JPEG', quality=85)
b = buf.getvalue()
b64 = base64.b64encode(b).decode('utf-8')

payload = {
    "image_base64": b64,
    "crop": "Tomato",
    "language": "en",
    "_nonce": 54321
}

url = 'http://127.0.0.1:8000/api/vision_diagnostic'
try:
    with httpx.Client(timeout=120.0) as client:
        r = client.post(url, json=payload)
        print('STATUS', r.status_code)
        try:
            print(json.dumps(r.json(), indent=2)[:20000])
        except Exception:
            print((r.text or '')[:2000])
except Exception as e:
    print('ERR', e)
    sys.exit(2)
