from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app, raise_server_exceptions=True)
try:
    response = client.post("/auth/login", data={"username": "admin", "password": "test"})
    print(response.status_code)
    print(response.json())
except Exception as e:
    import traceback
    traceback.print_exc()
