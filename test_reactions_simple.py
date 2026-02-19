import requests

# Configuration
API_URL = "http://localhost:8000"
MESSAGE_ID = "698aebe0d449026978c5b582"

def test_reactions_http():
    print(f"Testing POST {API_URL}/chat/messages/{MESSAGE_ID}/reactions")
    try:
        response = requests.post(f"{API_URL}/chat/messages/{MESSAGE_ID}/reactions", json={"emoji": "❤️"})
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 404:
            print("FAILED: Endpoint still returns 404")
        elif response.status_code == 405:
            print("FAILED: Method Not Allowed")
        elif response.status_code == 401:
            print("SUCCESS: Endpoint found, but unauthorized (Expected for unauthenticated request)")
        elif response.status_code == 200:
            print("SUCCESS: Reaction toggled (if auth was bypassed)")
    except Exception as e:
        print(f"HTTP Request failed: {e}")

if __name__ == "__main__":
    test_reactions_http()
