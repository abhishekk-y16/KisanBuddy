import json, urllib.request

data={"commodity":"Tomato","location":{"lat":28.7041,"lng":77.1025},"radius_km":100,"top_n":5}
req=urllib.request.Request("http://127.0.0.1:8000/api/agmarknet_nearby", data=json.dumps(data).encode(), headers={'Content-Type':'application/json'})
try:
    res=urllib.request.urlopen(req, timeout=30)
    body=res.read().decode()
    print('STATUS', res.status)
    print(body)
except Exception as e:
    import traceback
    traceback.print_exc()
    print('ERROR', e)
