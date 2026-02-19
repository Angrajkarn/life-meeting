import urllib.request
import json
import traceback
import random

url = "http://localhost:8000/auth/signup"
data = {
    "full_name": "Test User",
    "email": f"testuser_{random.randint(1000,9999)}@example.com",
    "password": "longpassword" * 10 
}

req = urllib.request.Request(
    url, 
    data=json.dumps(data).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print(f"Body: {response.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(f"Body: {e.read().decode('utf-8')}")
except Exception:
    traceback.print_exc()
