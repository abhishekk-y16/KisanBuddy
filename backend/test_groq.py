from dotenv import load_dotenv
import os, httpx, sys, json

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
api_key = os.getenv('GROQ_API_KEY')
if not api_key:
    print('NO_GROQ_KEY')
    sys.exit(2)

GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
payload = {
    'model': os.getenv('GROQ_DEFAULT_MODEL', 'groq/compound'),
    'messages': [{'role':'user','content':'{"test": true, "message": "ping"}'}],
    'max_tokens': 16,
    'temperature': 0.0
}
headers = {'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}
try:
    with httpx.Client(timeout=20.0) as client:
        r = client.post(GROQ_API_URL, json=payload, headers=headers)
        print('STATUS', r.status_code)
        print((r.text or '')[:4000])
except Exception as e:
    print('ERR', e)
    sys.exit(3)
