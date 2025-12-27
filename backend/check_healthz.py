import urllib.request, json

try:
    with urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=5) as r:
        print('STATUS', r.status)
        print(r.read().decode('utf-8'))
except Exception as e:
    print('ERR', e)
    raise
