#!/usr/bin/env python3
"""
FastAPI backend for the Hybrid Log Analyzer.
Provides analysis endpoints for the React frontend.
"""

import re
import os
import time
import random
import joblib
import numpy as np
import pandas as pd
import json
import uvicorn

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────
BASE_DIR           = os.path.dirname(os.path.abspath(__file__))
RULE_FILE          = os.path.join(BASE_DIR, "rules.txt")
ML_MODEL_PATH      = os.path.join(BASE_DIR, "hybrid_ml_model.joblib")
LABEL_ENCODER_PATH = os.path.join(BASE_DIR, "label_encoder.joblib")
TESTING_CSV        = os.path.join(BASE_DIR, "UNSW_NB15_testing-set.csv")

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
# FASTAPI APP
# ─────────────────────────────────────────────────────────────
app = FastAPI(title="Hybrid Log Analyzer API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic models ─────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    row: dict

class AddRuleRequest(BaseModel):
    name: str
    regex: str
    category: str
    severity: str = "HIGH"
    remedy: str = "Auto-learned anomaly."


# ─── Helper to sanitize numpy types ──────────────────────────

def _sanitize_row(row: dict) -> dict:
    return {k: (int(v) if isinstance(v, (np.integer,)) else
                float(v) if isinstance(v, (np.floating,)) else
                str(v) if pd.isna(v) else v)
            for k, v in row.items()}


# ─── Endpoints ────────────────────────────────────────────────

@app.get("/api/stats")
def stats():
    total   = len(TEST_DF)
    attacks = int((TEST_DF["label"] == 1).sum())
    benign  = total - attacks
    cats    = sorted(TEST_DF["attack_cat"].dropna().unique().tolist())
    return {"total": total, "attacks": attacks, "benign": benign,
            "categories": cats, "rules_count": len(patterns)}


@app.get("/api/sample/random")
def sample_random(cat: str = Query("ALL")):
    if cat == "ALL":
        subset = TEST_DF
    else:
        subset = TEST_DF[TEST_DF["attack_cat"] == cat]
    if subset.empty:
        raise HTTPException(status_code=404, detail=f"No rows for category '{cat}'")
    iloc_idx   = random.randint(0, len(subset) - 1)
    actual_idx = int(subset.index[iloc_idx])
    row = _sanitize_row(subset.iloc[iloc_idx].to_dict())
    return {"index": actual_idx, "row": row}


@app.get("/api/sample/{idx}")
def sample_by_index(idx: int):
    if idx < 0 or idx >= len(TEST_DF):
        raise HTTPException(status_code=400, detail="Index out of range")
    row = _sanitize_row(TEST_DF.iloc[idx].to_dict())
    return {"index": idx, "row": row}


def perform_analysis(row):
    total_start = time.perf_counter()
    log_line    = build_log_string(row)

    # Step 1: Rule-based
    rule_t0   = time.perf_counter()
    rule_hits = rule_based_check(log_line)
    rule_time = time.perf_counter() - rule_t0

    if rule_hits:
        cat = rule_hits[0]["category"]
        total_time = time.perf_counter() - total_start
        return {
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
            "row":             row
        }

    # Step 2: ML Fallback
    pred, ml_time, conf, feat_imp, class_probs = ml_detect(row)
    is_attack  = pred.lower() not in ("benign", "normal")
    total_time = time.perf_counter() - total_start

    return {
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
        "row":               row
    }


@app.post("/api/analyze")
def analyze(body: AnalyzeRequest):
    if not body.row:
        raise HTTPException(status_code=400, detail="No row data provided")
    return perform_analysis(body.row)


@app.get("/api/stream")
def stream_logs():
    def event_stream():
        log_path = os.path.join(BASE_DIR, "realtime_log_generator", "realtime_traffic.log")

        if not os.path.exists(log_path):
            with open(log_path, "w") as f:
                f.write("")

        with open(log_path, "r") as f:
            f.seek(0, os.SEEK_END)
            while True:
                line = f.readline()
                if not line:
                    time.sleep(0.1)
                    continue
                try:
                    row = json.loads(line.strip())
                    analysis = perform_analysis(row)
                    yield f"data: {json.dumps(analysis)}\n\n"
                except Exception:
                    pass

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/api/add-rule")
def add_rule(body: AddRuleRequest):
    if not body.name or not body.regex or not body.category:
        raise HTTPException(status_code=400, detail="name, regex, and category are required")
    try:
        re.compile(body.regex)
    except re.error as e:
        raise HTTPException(status_code=400, detail=f"Invalid regex: {e}")
    added = add_rule_to_file(body.name, body.regex, body.category, body.severity, body.remedy)
    return {"added": added, "rules_count": len(patterns)}


# ─────────────────────────────────────────────────────────────
# ENTRYPOINT
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
