#!/usr/bin/env python3
"""Quick test for /api/crop_detect endpoint.
Creates a small RGB image, encodes to base64 JPEG, and POSTs to the backend.
Prints the HTTP status and response JSON, exits nonzero on failure.
"""
import sys
import base64
from io import BytesIO

try:
    from PIL import Image
except Exception:
    print("Pillow not available; please install pillow to run this test")
    sys.exit(2)

import httpx

def make_test_image():
    img = Image.new("RGB", (64, 64), (120, 200, 80))
    buf = BytesIO()
    img.save(buf, format="JPEG")
    return base64.b64encode(buf.getvalue()).decode('utf-8')

def run_test(url="http://127.0.0.1:8000/api/crop_detect"):
    b64 = make_test_image()
    payload = {"image_base64": b64}
    try:
        with httpx.Client(timeout=30.0) as client:
            r = client.post(url, json=payload)
            print("HTTP", r.status_code)
            try:
                j = r.json()
                print("JSON RESPONSE:", j)
                if isinstance(j, dict) and 'crop' in j and 'confidence' in j:
                    print("Test OK: crop and confidence present")
                    return 0
                else:
                    print("Test FAIL: missing keys in JSON")
                    return 3
            except Exception as e:
                print("Failed to parse JSON:", e)
                print(r.text[:1000])
                return 4
    except Exception as e:
        print("Request failed:", e)
        return 5

if __name__ == '__main__':
    code = run_test()
    sys.exit(code)
