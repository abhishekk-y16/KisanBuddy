#!/usr/bin/env python3
"""In-process test for /api/crop_detect using FastAPI TestClient.
This avoids running uvicorn and exercises the endpoint with a generated image.
"""
import sys
import base64
from io import BytesIO

try:
    from PIL import Image
except Exception:
    print("Pillow not available; please install pillow to run this test")
    sys.exit(2)

import os
import sys
from fastapi.testclient import TestClient

# Ensure project root is on sys.path so `import backend.main` works
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

def make_test_image_b64():
    img = Image.new("RGB", (64,64), (200,120,80))
    buf = BytesIO()
    img.save(buf, format='JPEG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')

def run_local_test():
    # Import app (this will load backend.services.vision with updated prompts)
    try:
        from backend.main import app
    except Exception as e:
        print('Failed to import app:', e)
        return 2

    client = TestClient(app)
    payload = {"image_base64": make_test_image_b64()}
    r = client.post('/api/crop_detect', json=payload)
    print('HTTP', r.status_code)
    try:
        j = r.json()
        print('JSON:', j)
        if isinstance(j, dict) and 'crop' in j and 'confidence' in j:
            print('Local test OK')
            return 0
        else:
            print('Local test FAIL: missing keys')
            return 3
    except Exception as e:
        print('Failed to parse JSON:', e)
        print(r.text[:1000])
        return 4

if __name__ == '__main__':
    sys.exit(run_local_test())
