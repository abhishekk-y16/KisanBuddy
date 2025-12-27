import os
import sys
import json
import httpx

# Try environment first
key = os.getenv('GEMINI_API_KEY')
# If not in env, try reading .env at repo root
if not key:
    try:
        with open(os.path.join(os.path.dirname(__file__), '..', '.env'), 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip().startswith('GEMINI_API_KEY'):
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        val = parts[1].strip()
                        if val:
                            val = val.split('#', 1)[0].strip()
                            val = val.split()[0].strip()
                            key = val
                            break
    except Exception:
        pass

if not key:
    print('ERROR: GEMINI_API_KEY not found in environment or .env')
    sys.exit(2)

# Do a minimal REST call to the Generative Language API to validate the key
model = 'gemini-2.5-flash'
url = f'https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={key}'
headers = {'Content-Type': 'application/json'}
payload = {
    'contents': [
        {'parts': [{'text': 'PING: please respond with a short confirmation message.'}]}
    ],
    'generationConfig': {'temperature': 0.0, 'maxOutputTokens': 16}
}

try:
    with httpx.Client(timeout=15.0) as client:
        r = client.post(url, json=payload, headers=headers)
        if r.status_code == 200:
            # Success - do not print the response content in full
            print('OK: API key accepted (HTTP 200)')
            try:
                data = r.json()
                # Try to show small confirmation if present
                # Look for text in candidates or choices
                txt = None
                if 'candidates' in data:
                    c = data.get('candidates')
                    if isinstance(c, list) and len(c) > 0:
                        content = c[0].get('content', {})
                        parts = content.get('parts', [])
                        if parts and isinstance(parts, list):
                            txt = parts[0].get('text')
                if not txt and 'choices' in data:
                    choices = data.get('choices')
                    if isinstance(choices, list) and len(choices) > 0:
                        msg = choices[0].get('message', {})
                        txt = msg.get('content') if isinstance(msg, dict) else None
                if txt:
                    print('Model response (truncated):', repr(str(txt)[:200]))
                sys.exit(0)
            except Exception:
                print('OK: API key accepted (HTTP 200) — response parse failed (non-critical)')
                sys.exit(0)
        else:
            # Print helpful error message but don't reveal the key
            try:
                err = r.json()
                # Attempt to extract message field
                msg = err.get('error', err)
                print(f'ERROR: HTTP {r.status_code} —', json.dumps(msg)[:1000])
            except Exception:
                print(f'ERROR: HTTP {r.status_code} — {r.text[:500]}')
            sys.exit(3)
except Exception as e:
    print('ERROR: Request failed —', str(e))
    sys.exit(4)
