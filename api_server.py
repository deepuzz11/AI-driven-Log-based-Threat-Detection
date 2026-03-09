#!/usr/bin/env python3
"""
Flask API backend for the Hybrid Log Analyzer.
Serves the React frontend and provides analysis endpoints.
"""

import re
import os
import time
import random
import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────
BASE_DIR           = os.path.dirname(os.path.abspath(__file__))
RULE_FILE          = os.path.join(BASE_DIR, "rules.txt")
ML_MODEL_PATH      = os.path.join(BASE_DIR, "hybrid_ml_model.joblib")
LABEL_ENCODER_PATH = os.path.join(BASE_DIR, "label_encoder.joblib")
TESTING_CSV        = os.path.join(BASE_DIR, "UNSW_NB15_testing-set.csv")
FRONTEND_DIR       = os.path.join(BASE_DIR, "frontend", "dist")

# ─────────────────────────────────────────────────────────────
# CLUSTER MAP
# ─────────────────────────────────────────────────────────────
CLUSTER_MAP = {
    "Shellcode":       {"cluster": 1, "label": "Cluster 1 — Active Exploitation"},
    "Fuzzers":         {"cluster": 1, "label": "Cluster 1 — Active Exploitation"},
    "Exploits":        {"cluster": 1, "label": "Cluster 1 — Active Exploitation"},
    "Reconnaissance":  {"cluster": 1, "label": "Cluster 1 — Active Exploitation"},
    "Worms":           {"cluster": 1, "label": "Cluster 1 — Active Exploitation"},
    "Analysis":        {"cluster": 2, "label": "Cluster 2 — Stealth / Persistence"},
    "Backdoor":        {"cluster": 2, "label": "Cluster 2 — Stealth / Persistence"},
    "DoS":             {"cluster": 2, "label": "Cluster 2 — Stealth / Persistence"},
    "Generic":         {"cluster": 3, "label": "Cluster 3 — Generic Anomaly"},
    "Normal":          {"cluster": 0, "label": "Benign Traffic"},
    "Benign":          {"cluster": 0, "label": "Benign Traffic"},
}

CLUSTER_DESCRIPTIONS = {
    0: "Normal, benign network traffic with no signs of malicious behaviour.",
    1: "Active exploitation — shellcode, fuzzing, exploit kits, recon probes, worm propagation.",
    2: "Stealthy, persistent threats — backdoors, DoS, forensic-evasion activity.",
    3: "Generic / unclassified anomaly — requires manual triage.",
}

SUGGESTIONS = {
    "DoS":            "Block offending IPs via firewall. Enable rate-limiting. Scale bandwidth or use CDN-level DDoS mitigation.",
    "Fuzzers":        "Patch exposed services. Enable input-validation hardening. Review application error logs for crash patterns.",
    "Exploits":       "Apply CVE patches immediately. Deploy WAF rules. Isolate the affected host and perform forensic analysis.",
    "Reconnaissance": "Enable port-scan detection (Snort/Suricata). Block ICMP sweeps. Alert on excessive failed connections.",
    "Worms":          "Quarantine host immediately. Block lateral movement via SMB/RPC. Scan all network shares for propagation.",
    "Shellcode":      "Terminate malicious process. Enable DEP/ASLR on OS. Review memory anomaly alerts from EDR.",
    "Backdoor":       "Revoke all active sessions. Rotate credentials. Audit startup scripts, crontabs, and listening ports.",
    "Analysis":       "Review packet captures for exfiltration patterns. Cross-check with SIEM alerts.",
    "Generic":        "Log and escalate to Tier-2 analyst. Correlate with other events in the same time window.",
    "Normal":         "No action required. Traffic appears benign.",
    "Benign":         "No action required. Traffic appears benign.",
}

# ─────────────────────────────────────────────────────────────
# RULE ENGINE
# ─────────────────────────────────────────────────────────────
patterns  = {}
rule_meta = {}

def load_rules():
    patterns.clear()
    rule_meta.clear()
    try:
        with open(RULE_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or "||" not in line:
                    continue
                parts    = line.split("||")
                name     = parts[0]
                regex    = parts[1]
                category = parts[2]
                severity = parts[3] if len(parts) > 3 else "MEDIUM"
                remedy   = parts[4] if len(parts) > 4 else "Investigate suspicious activity."
                try:
                    patterns[name]  = re.compile(regex, re.IGNORECASE)
                    rule_meta[name] = {"category": category, "severity": severity, "remedy": remedy}
                except re.error:
                    pass
    except FileNotFoundError:
        pass

def rule_based_check(log_line):
    return [
        {"rule": n, **rule_meta[n]}
        for n, p in patterns.items() if p.search(log_line)
    ]

def rule_exists(regex):
    return any(p.pattern == regex for p in patterns.values())

def add_rule_to_file(rule_name, regex, category, severity="HIGH",
                     remedy="Auto-learned anomaly."):
    if rule_exists(regex):
        return False
    with open(RULE_FILE, "a", encoding="utf-8") as f:
        f.write(f"{rule_name}||{regex}||{category}||{severity}||{remedy}\n")
    load_rules()
    return True

def build_log_string(row):
    return " | ".join(f"{k}={v}" for k, v in row.items())

# ─────────────────────────────────────────────────────────────
# ML ENGINE
# ─────────────────────────────────────────────────────────────
print("[API] Loading ML model...")
ml_model      = joblib.load(ML_MODEL_PATH)
label_encoder = joblib.load(LABEL_ENCODER_PATH)

def ml_detect(features):
    df = pd.DataFrame([features])
    df = df.reindex(columns=ml_model.feature_names_in_, fill_value=0)
    t0 = time.perf_counter()
    pred_enc = ml_model.predict(df)[0]
    pred     = label_encoder.inverse_transform([pred_enc])[0]
    elapsed  = time.perf_counter() - t0
    conf, feat_imp = None, None
    try:
        proba = ml_model.predict_proba(df)[0]
        conf  = float(np.max(proba)) * 100
        # all class probabilities
        class_probs = {label_encoder.inverse_transform([i])[0]: float(p)
                       for i, p in enumerate(proba)}
        if hasattr(ml_model, "feature_importances_"):
            importances = ml_model.feature_importances_
            idxs = np.argsort(importances)[::-1][:10]
            feat_imp = [{"feature": ml_model.feature_names_in_[i],
                         "importance": float(importances[i])} for i in idxs]
    except Exception:
        class_probs = {}
    return pred, elapsed, conf, feat_imp, class_probs

def get_cluster_info(attack_cat):
    for key, val in CLUSTER_MAP.items():
        if key.lower() in attack_cat.lower():
            c = val["cluster"]
            return {
                "cluster": c,
                "label": val["label"],
                "description": CLUSTER_DESCRIPTIONS.get(c, ""),
            }
    return {"cluster": 3, "label": "Cluster 3 — Generic Anomaly",
            "description": CLUSTER_DESCRIPTIONS[3]}

def get_suggestion(pred):
    for key, text in SUGGESTIONS.items():
        if key.lower() in pred.lower():
            return text
    return SUGGESTIONS.get("Generic", "Investigate and escalate.")

# ─────────────────────────────────────────────────────────────
# LOAD DATA
# ─────────────────────────────────────────────────────────────
print("[API] Loading testing dataset...")
TEST_DF = pd.read_csv(TESTING_CSV)
print(f"[API] Loaded {len(TEST_DF)} rows.")
load_rules()
print(f"[API] Loaded {len(patterns)} rules.")

# ─────────────────────────────────────────────────────────────
# FLASK APP
# ─────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)


@app.route("/api/stats")
def stats():
    total   = len(TEST_DF)
    attacks = int((TEST_DF["label"] == 1).sum())
    benign  = total - attacks
    cats    = sorted(TEST_DF["attack_cat"].dropna().unique().tolist())
    return jsonify({"total": total, "attacks": attacks, "benign": benign,
                    "categories": cats, "rules_count": len(patterns)})


@app.route("/api/sample/random")
def sample_random():
    cat = request.args.get("cat", "ALL")
    if cat == "ALL":
        subset = TEST_DF
    else:
        subset = TEST_DF[TEST_DF["attack_cat"] == cat]
    if subset.empty:
        return jsonify({"error": f"No rows for category '{cat}'"}), 404
    iloc_idx  = random.randint(0, len(subset) - 1)
    actual_idx = int(subset.index[iloc_idx])
    row = subset.iloc[iloc_idx].to_dict()
    # Convert numpy types to native Python
    row = {k: (int(v) if isinstance(v, (np.integer,)) else
               float(v) if isinstance(v, (np.floating,)) else
               str(v) if pd.isna(v) else v)
           for k, v in row.items()}
    return jsonify({"index": actual_idx, "row": row})


@app.route("/api/sample/<int:idx>")
def sample_by_index(idx):
    if idx < 0 or idx >= len(TEST_DF):
        return jsonify({"error": "Index out of range"}), 400
    row = TEST_DF.iloc[idx].to_dict()
    row = {k: (int(v) if isinstance(v, (np.integer,)) else
               float(v) if isinstance(v, (np.floating,)) else
               str(v) if pd.isna(v) else v)
           for k, v in row.items()}
    return jsonify({"index": idx, "row": row})


@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    row  = data.get("row", {})
    if not row:
        return jsonify({"error": "No row data provided"}), 400

    total_start = time.perf_counter()
    log_line    = build_log_string(row)

    # Step 1: Rule-based
    rule_t0   = time.perf_counter()
    rule_hits = rule_based_check(log_line)
    rule_time = time.perf_counter() - rule_t0

    if rule_hits:
        cat = rule_hits[0]["category"]
        total_time = time.perf_counter() - total_start
        return jsonify({
            "method":          "rule-based",
            "decision":        "ATTACK",
            "prediction":      cat.upper(),
            "rule_hits":       rule_hits,
            "cluster":         get_cluster_info(cat),
            "suggestion":      get_suggestion(cat),
            "rule_time_ms":    round(rule_time * 1000, 2),
            "ml_time_ms":      0,
            "total_time_ms":   round(total_time * 1000, 2),
            "confidence":      100.0,
            "feature_importance": [],
            "class_probabilities": {},
            "ground_truth":    row.get("attack_cat", ""),
        })

    # Step 2: ML Fallback
    pred, ml_time, conf, feat_imp, class_probs = ml_detect(row)
    is_attack  = pred.lower() not in ("benign", "normal")
    total_time = time.perf_counter() - total_start

    return jsonify({
        "method":            "ml-fallback",
        "decision":          "ATTACK" if is_attack else "BENIGN",
        "prediction":        pred,
        "rule_hits":         [],
        "cluster":           get_cluster_info(pred),
        "suggestion":        get_suggestion(pred),
        "rule_time_ms":      round(rule_time * 1000, 2),
        "ml_time_ms":        round(ml_time * 1000, 2),
        "total_time_ms":     round(total_time * 1000, 2),
        "confidence":        round(conf, 2) if conf else None,
        "feature_importance": feat_imp or [],
        "class_probabilities": {k: round(v * 100, 2) for k, v in class_probs.items()},
        "ground_truth":      row.get("attack_cat", ""),
    })


@app.route("/api/add-rule", methods=["POST"])
def add_rule():
    data    = request.get_json()
    name    = data.get("name", "").strip()
    regex   = data.get("regex", "").strip()
    cat     = data.get("category", "").strip()
    sev     = data.get("severity", "HIGH").strip()
    remedy  = data.get("remedy", "Auto-learned anomaly.").strip()
    if not name or not regex or not cat:
        return jsonify({"error": "name, regex, and category are required"}), 400
    try:
        re.compile(regex)
    except re.error as e:
        return jsonify({"error": f"Invalid regex: {e}"}), 400
    added = add_rule_to_file(name, regex, cat, sev, remedy)
    return jsonify({"added": added, "rules_count": len(patterns)})


# Serve React frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # If the requested path is not an API route and not a file that exists,
    # serve the main index.html file so React Router can handle it.
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


if __name__ == "__main__":
    app.run(debug=True, port=5000)
