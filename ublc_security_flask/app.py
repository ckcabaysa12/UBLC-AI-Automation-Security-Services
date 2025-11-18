from flask import Flask, jsonify
import requests

app = Flask(__name__)

@app.route('/')
def home():
    return 'UBLC Security Flask App is running.'

@app.route('/test-lost-found')
def test_lost_found():
    url = "http://localhost:5678/webhook/security-hook"
    data = {
        "intent": "security_lost_found",
        "payload": {
            "ItemID": "LF-001",
            "ItemName": "Black Umbrella",
            "Description": "Found near library entrance",
            "LocationFound": "Library",
            "DateFound": "2025-11-15",
            "ClaimStatus": "Unclaimed",
            "Notes": "No visible markings"
        }
    }
    response = requests.post(url, json=data)
    return jsonify(response.json())

if __name__ == '__main__':
    app.run(debug=True)
