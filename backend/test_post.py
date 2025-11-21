import requests
import json

url = "http://localhost:8000/api/scores"
data = {
    "player_name": "TestPlayer",
    "score": 1000,
    "coins": 50,
    "enemies_defeated": 10,
    "distance": 100,
    "level": 3,
    "game_mode": "levels"
}

print("Testing POST to backend...")
print(f"URL: {url}")
print(f"Data: {json.dumps(data, indent=2)}")

try:
    response = requests.post(url, json=data)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"\nError: {e}")
