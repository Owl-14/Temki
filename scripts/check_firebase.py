import json
import urllib.error
import urllib.request

API_KEY = "AIzaSyDhzsKHmqA1qSSATx8olFO4gStDOwMlBT8"
PROJECT = "temki-1409"


def post(url, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return exc.code, body


checks = []

status, body = post(
    f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}",
    {
        "email": "probe-check@example.com",
        "password": "probe-check-123456",
        "returnSecureToken": True,
    },
)
checks.append(("Auth signUp endpoint", status, body[:400]))

status, body = post(
    f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents:runQuery?key={API_KEY}",
    {
        "structuredQuery": {
            "from": [{"collectionId": "users"}],
            "limit": 1,
        }
    },
)
checks.append(("Firestore runQuery", status, body[:400]))

for name, status, snippet in checks:
    print(f"\n=== {name} ===")
    print(f"HTTP {status}")
    print(snippet)
