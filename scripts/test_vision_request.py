import json
import urllib.request

url = 'http://localhost:8080/api/vision_diagnostic'
payload = {"image_url": "https://upload.wikimedia.org/wikipedia/commons/4/47/Tomato_leaf.JPG"}

req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = resp.read().decode('utf-8')
        print('STATUS:', resp.status)
        print(body)
except Exception as e:
    print('ERROR:', e)
