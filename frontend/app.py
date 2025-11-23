from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

# ✅ Store your Cohere API key in an environment variable
COHERE_API_KEY = os.getenv("COHERE_API_KEY")

@app.route("/chat", methods=["POST"])
def chat():
    user_text = request.json.get("prompt", "")
    headers = {
        "Authorization": f"Bearer {COHERE_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "command",
        "prompt": user_text,
        "max_tokens": 100,
        "temperature": 0.7
    }
    res = requests.post("https://api.cohere.ai/v1/generate", headers=headers, json=payload)
    data = res.json()
    reply = data.get("generations", [{}])[0].get("text", "").strip()
    return jsonify({"reply": reply})
