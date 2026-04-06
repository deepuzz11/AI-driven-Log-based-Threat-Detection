import requests

url = "http://127.0.0.1:8000/api/analyze"

data = {
    "row": {
        "proto": "tcp",
        "service": "http",
        "state": "FIN",
        "attack_cat": "Fuzzers",
        "label": 1
    }
}

response = requests.post(url, json=data)
print(response.json())
