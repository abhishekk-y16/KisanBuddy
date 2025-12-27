from dotenv import load_dotenv
import os, httpx, json, sys

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print('NO_GEMINI_KEY')
    sys.exit(2)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

payload = {
    "contents": [{
        "parts": [{"text": "{\"test\": true, \"message\": \"ping\"}"}]
    }],
    "generationConfig": {"temperature": 0.0, "maxOutputTokens": 16}
}

url = f"{GEMINI_API_URL}?key={api_key}"
try:
    with httpx.Client(timeout=20.0) as client:
        r = client.post(url, json=payload)
        print('STATUS', r.status_code)
        text = r.text or ''
        print(text[:2000])
except Exception as e:
    print('ERR', e)
    sys.exit(3)
