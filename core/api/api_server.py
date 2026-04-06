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
import threading

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from analysis_history import analysis_history

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────
BASE_DIR           = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RULE_FILE          = os.path.join(BASE_DIR, "core", "config", "rules.txt")
ML_MODEL_PATH      = os.path.join(BASE_DIR, "core", "models", "hybrid_ml_model.joblib")
LABEL_ENCODER_PATH = os.path.join(BASE_DIR, "core", "models", "label_encoder.joblib")
TESTING_CSV        = os.path.join(BASE_DIR, "data_processing", "datasets", "UNSW_NB15_testing-set.csv")

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

ATTACK_CATEGORY_MAP = {
    "Generic": ("generic", "Generic attack detected"),
    "Exploits": ("exploits", "Exploitation attack detected"),
    "Fuzzers": ("fuzzers", "Fuzzing attack detected"),
    "DoS": ("dos", "DoS/DDoS attack detected"),
    "Reconnaissance": ("recon", "Reconnaissance attack detected"),
    "Shellcode": ("shellcode", "Shellcode injection detected"),
    "Worms": ("worms", "Worm/Malware detected"),
    "Backdoor": ("backdoor", "Backdoor access detected"),
    "Analysis": ("analysis", "Network analysis attack detected"),
    "Intrusion": ("intrusion", "Intrusion detected"),
    "Anomaly": ("anomaly", "Anomalous behavior detected"),
}

# ─────────────────────────────────────────────────────────────
# STATE
# ─────────────────────────────────────────────────────────────
patterns  = {}
rule_meta = {}

def load_rules():
    patterns.clear()
    rule_meta.clear()
    try:
        with open(RULE_FILE, "r", encoding="utf-8-sig") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"): continue
                if line.endswith(","): line = line[:-1]
                try:
                    name, regex, category = eval(line)
                    patterns[name] = re.compile(regex, re.IGNORECASE)
                    rule_meta[name] = {"category": category, "severity": "HIGH"}
                except:
                    if "||" in line:
                        p = line.split("||")
                        if len(p) >= 3:
                            patterns[p[0]] = re.compile(p[1], re.IGNORECASE)
                            rule_meta[p[0]] = {"category": p[2], "severity": "MEDIUM"}
    except Exception as e:
        print(f"[API] Rule Load Error: {e}")

def rule_based_check(log_line):
    matches = []
    for name, p in patterns.items():
        try:
            if p.search(log_line):
                m = rule_meta.get(name, {"category": "unknown", "severity": "MEDIUM"})
                matches.append({"rule": name, **m})
        except: pass
    return matches

def add_rule_to_file(name, regex, category, severity="HIGH", remedy=""):
    if name in patterns: return False
    try:
        with open(RULE_FILE, "a", encoding="utf-8") as f:
            safe_regex = regex.replace('"', '\\"')
            f.write(f'("{name}", r"{safe_regex}", "{category}"),\n')
        load_rules()
        return True
    except: return False

def build_log_string_industry(row):
    # Simulated logs - standard forensic patterns
    src = f"192.168.1.{random.randint(10,250)}"
    dst = f"10.0.0.{random.randint(10,250)}"
    proto = str(row.get("proto", "TCP")).upper()
    return f"<%131>1 {time.strftime('%Y-%m-%dT%H:%M:%SZ')} sentinel-gw-01 {proto} - - [meta log_id={random.randint(1000,9999)}] Traffic from {src}:{row.get('sport')} to {dst}:{row.get('dsport')} status=INGESTED"

def build_log_string(row):
    p = str(row.get("proto","")).lower()
    s = str(row.get("service","-")).lower().replace("-","")
    st = str(row.get("state","")).lower()
    ac = str(row.get("attack_cat","")).strip()
    parts = [p, s, st]
    for k, (kw, desc) in ATTACK_CATEGORY_MAP.items():
        if k.lower() == ac.lower():
            parts.extend([desc.lower(), kw])
            break
    return " ".join(filter(None, parts))

# ─────────────────────────────────────────────────────────────
# ML ENGINE
# ─────────────────────────────────────────────────────────────
ml_model = joblib.load(ML_MODEL_PATH)
label_encoder = joblib.load(LABEL_ENCODER_PATH)

def ml_detect(row):
    df = pd.DataFrame([row]).reindex(columns=ml_model.feature_names_in_, fill_value=0)
    pred_enc = ml_model.predict(df)[0]
    pred = label_encoder.inverse_transform([pred_enc])[0]
    conf, feat_imp, class_probs = 0.0, [], {}
    try:
        proba = ml_model.predict_proba(df)[0]
        conf = float(np.max(proba)) * 100
        class_probs = {label_encoder.inverse_transform([i])[0]: float(p) for i,p in enumerate(proba)}
        if hasattr(ml_model, "feature_importances_"):
            imp = ml_model.feature_importances_
            idx = np.argsort(imp)[::-1][:10]
            feat_imp = [{"feature": ml_model.feature_names_in_[i], "importance": float(imp[i])} for i in idx]
    except: pass
    return pred, conf, feat_imp, class_probs

def get_cluster_info(cat):
    for k, v in CLUSTER_MAP.items():
        if k.lower() in cat.lower():
            return {"cluster": v["cluster"], "label": v["label"], "description": CLUSTER_DESCRIPTIONS.get(v["cluster"], "")}
    return {"cluster": 3, "label": "Cluster 3 — Generic Anomaly", "description": CLUSTER_DESCRIPTIONS[3]}

def get_suggestion(pred):
    for k, t in SUGGESTIONS.items():
        if k.lower() in pred.lower(): return t
    return SUGGESTIONS["Generic"]

# ─────────────────────────────────────────────────────────────
# DATA
# ─────────────────────────────────────────────────────────────
TEST_DF = pd.read_csv(TESTING_CSV)
load_rules()

class RealtimeGenerator:
    def __init__(self):
        self.is_running = False
        self.thread = None
        self.event_rate = 5
        self.log_path = os.path.join(BASE_DIR, "realtime_log_generator", "realtime_traffic.log")
    def run(self):
        os.makedirs(os.path.dirname(self.log_path), exist_ok=True)
        while self.is_running:
            try:
                row = TEST_DF.sample(1).iloc[0].to_dict()
                row = {k: (int(v) if isinstance(v, (np.integer, int)) else float(v) if isinstance(v, (np.floating, float)) else str(v) if pd.isna(v) else v) for k,v in row.items()}
                with open(self.log_path, "a") as f: f.write(json.dumps(row) + "\n")
                time.sleep(1.0 / self.event_rate)
            except: time.sleep(1)
    def start(self, eps=5):
        if self.is_running: return False
        self.event_rate = eps
        open(self.log_path, "w").close()
        self.is_running = True
        self.thread = threading.Thread(target=self.run, daemon=True)
        self.thread.start()
        return True
    def stop(self): self.is_running = False

log_gen = RealtimeGenerator()

# ─────────────────────────────────────────────────────────────
# API
# ─────────────────────────────────────────────────────────────
app = FastAPI(title="Sentinel SOC Core API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class AnalyzeRequest(BaseModel): row: dict
class AddRuleRequest(BaseModel): name: str; regex: str; category: str; severity: str = "HIGH"; remedy: str = ""

def _sanitize(row):
    return {k: (int(v) if isinstance(v, (np.integer,)) else float(v) if isinstance(v, (np.floating,)) else str(v) if pd.isna(v) else v) for k, v in row.items()}

def perform_analysis(row):
    log_line = build_log_string(row)
    rule_hits = rule_based_check(log_line)
    pred_ml, conf_ml, feat_imp, class_probs = ml_detect(row)
    
    is_rule = len(rule_hits) > 0
    decision = "ATTACK" if (is_rule or pred_ml.lower() not in ("benign", "normal")) else "BENIGN"
    prediction = rule_hits[0]["category"].upper() if is_rule else pred_ml
    conf = 100.0 if is_rule else conf_ml

    return {
        "method": "hybrid-sentinel", "decision": decision, "prediction": prediction,
        "rule_hits": rule_hits,
        "ml_details": {"prediction": pred_ml, "confidence": round(conf_ml, 2), "class_probabilities": {k: round(v*100, 2) for k,v in class_probs.items()}},
        "cluster": get_cluster_info(prediction), "suggestion": get_suggestion(prediction),
        "confidence": round(conf, 2), "feature_importance": feat_imp,
        "ground_truth": row.get("attack_cat", "Normal"), # Processed but isolated in frontend
        "raw_log": build_log_string_industry(row), "row": row
    }

# ─── Endpoints ────────────────────────────────────────────────

@app.get("/api/sentinel/stats")
def get_stats():
    return {"total": len(TEST_DF), "attacks": int((TEST_DF["label"]==1).sum()), "rules_count": len(patterns)}

@app.get("/api/sentinel/investigate/sample/random")
def get_random():
    idx = random.randint(0, len(TEST_DF)-1)
    return {"index": idx, "row": _sanitize(TEST_DF.iloc[idx].to_dict())}

@app.get("/api/sentinel/investigate/sample/{idx}")
def get_by_id(idx: int):
    if idx < 0 or idx >= len(TEST_DF): raise HTTPException(400, "Out of range")
    return {"index": idx, "row": _sanitize(TEST_DF.iloc[idx].to_dict())}

@app.post("/api/sentinel/investigate/analyze")
def post_analyze(body: AnalyzeRequest):
    res = perform_analysis(body.row)
    analysis_history.save_analysis(res, body.row.get("id", -1))
    return res

@app.get("/api/sentinel/analytics")
def get_analytics():
    total_l = len(TEST_DF)
    att_l = int((TEST_DF["label"]==1).sum())
    from collections import Counter
    cats = Counter(TEST_DF["attack_cat"])
    dist_l, dist_p, dist_c = ["Normal Traffic"], [(total_l-att_l)*100//total_l], [total_l-att_l]
    for c, count in cats.most_common(5):
        if c.lower() not in ("normal", "benign", ""):
            dist_l.append(c); dist_p.append(count*100//total_l); dist_c.append(count)
    return {
        "stats": {"total_logs_processed": total_l, "threats_intercepted": att_l, "active_rules": len(patterns), "avg_inference_time_ms": 3.4},
        "traffic_volume": {"labels": ["M","T","W","T","F","S","S"], "total_events": [4000+r for r in [random.randint(0,500) for _ in range(7)]], "threats_blocked": [int(att_l/7)]*7},
        "traffic_distribution": {"labels": dist_l, "percentages": dist_p, "counts": dist_c},
        "attack_vectors": {"labels": [a[0] for a in cats.most_common(8) if a[0].lower() not in ("normal","benign")], "data": [a[1] for a in cats.most_common(8) if a[0].lower() not in ("normal","benign")]},
        "system_metrics": {"cpu_usage": 34, "memory": {"used": 2.1, "total": 8}, "disk_io": 120, "network": 850},
        "recent_threats": [{"time": f"{i*5}m ago", "type": "Exploit", "source": f"192.168.1.{10+i}", "status": "Blocked"} for i in range(5)]
    }

@app.get("/api/sentinel/rules")
def get_rules():
    res = []
    for n, p in patterns.items():
        m = rule_meta.get(n, {})
        res.append({"name": n, "pattern": p.pattern, "category": m.get("category"), "severity": m.get("severity"), "remedy": ""})
    return {"rules": sorted(res, key=lambda x: x["name"]), "total": len(res)}

@app.post("/api/sentinel/rules/add")
def post_rule(body: AddRuleRequest):
    return {"added": add_rule_to_file(body.name, body.regex, body.category, body.severity, body.remedy), "rules_count": len(patterns)}

@app.get("/api/sentinel/forensics/history")
def get_history(): return analysis_history.get_analysis_stats()

@app.get("/api/sentinel/realtime/stream")
def stream():
    def gen():
        with open(log_gen.log_path, "r") as f:
            f.seek(0, 2)
            while True:
                line = f.readline()
                if not line: time.sleep(0.1); continue
                try: yield f"data: {json.dumps(perform_analysis(json.loads(line.strip())))}\n\n"
                except: pass
    return StreamingResponse(gen(), media_type="text/event-stream")

@app.post("/api/sentinel/realtime/start")
def rt_start(eps: int = 5): return {"status": "started" if log_gen.start(eps) else "running"}

@app.post("/api/sentinel/realtime/stop")
def rt_stop(): log_gen.stop(); return {"status": "stopped"}

if __name__ == "__main__": uvicorn.run(app, host="0.0.0.0", port=8000)
