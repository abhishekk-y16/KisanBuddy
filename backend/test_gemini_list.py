from dotenv import load_dotenv
import os, httpx, sys, json

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print('NO_GEMINI_KEY'); sys.exit(2)

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
try:
    with httpx.Client(timeout=20.0) as client:
        r = client.get(url)
        print('STATUS', r.status_code)
        print(r.text[:5000])
except Exception as e:
    print('ERR', e)
    sys.exit(3)
