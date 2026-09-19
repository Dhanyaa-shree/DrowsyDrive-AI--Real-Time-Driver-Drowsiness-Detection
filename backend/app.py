from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from inference import predict_from_bytes, predict_from_base64

app = Flask(__name__)
CORS(app)

# ---- In-memory stats ----
STATS = {
    "total": 0,
    "alerts": 0,
    "mild": 0,
    "conf_sum": 0.0,
    "recent": []
}

def _record(result):
    STATS["total"] += 1
    if result["fatigue_stage"] == 2:
        STATS["alerts"] += 1
    elif result["fatigue_stage"] == 1:
        STATS["mild"] += 1
    STATS["conf_sum"] += result["confidence"]
    result["timestamp"] = datetime.utcnow().isoformat()
    STATS["recent"].append(result)
    if len(STATS["recent"]) > 20:
        STATS["recent"].pop(0)

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/api/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "no file"}), 400
    result = predict_from_bytes(request.files["file"].read())
    _record(result)
    return jsonify(result)

@app.route("/api/predict_frame", methods=["POST"])
def predict_frame():
    payload = request.get_json(silent=True) or {}
    b64 = payload.get("image")
    if not b64:
        return jsonify({"error": "no image"}), 400
    result = predict_from_base64(b64)
    _record(result)
    return jsonify(result)

@app.route("/api/stats")
def stats():
    t = STATS["total"]
    avg = round(STATS["conf_sum"] / t, 3) if t else 0
    safe = round((t - STATS["alerts"]) / t * 100, 1) if t else 100
    return jsonify({
        "total": t,
        "alerts": STATS["alerts"],
        "mild": STATS["mild"],
        "safe_pct": safe,
        "avg_confidence": avg,
        "recent": STATS["recent"][::-1]
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)