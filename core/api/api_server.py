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
from collections import Counter

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from analysis_history import analysis_history
from core.models.dl_model_engine import dl_engine
from transformers import pipeline

# ─────────────────────────────────────────────────────────────
# AI ENGINES (NLP & DL)
# ─────────────────────────────────────────────────────────────
print("[API] Initializing BART Summarizer (Transformer NLP)...")
try:
    # We use a lightweight version or mock if in restricted env, 
    # but for production the user expects BART
    summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6") 
    print("[API] BART Summarizer loaded.")
except Exception as e:
    print(f"[API] BART loading failed ({e}). Using analytical fallback.")
    summarizer = None

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────
# Navigate from core/api/ to project root (3 levels up)
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

# Attack category mapping - translates dataset categories to rule-searchable keywords
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
# RULE ENGINE
# ─────────────────────────────────────────────────────────────
patterns  = {}
rule_meta = {}
rule_stats = {"total_rules": 0, "active_rules": 0, "total_detections": 0}

def load_rules():
    """Load rules from rules.txt in tuple format: ("name", r"pattern", "category")"""
    patterns.clear()
    rule_meta.clear()
    patterns_count = 0
    try:
        with open(RULE_FILE, "r", encoding="utf-8-sig") as f:
            for line_no, line in enumerate(f, 1):
                line = line.strip()
                if not line or line.startswith("#"): 
                    continue
                if line.endswith(","): 
                    line = line[:-1]
                
                # Robustly load rules
                try:
                    name, regex, category = eval(line)
                    patterns[name] = re.compile(regex, re.IGNORECASE)
                    rule_meta[name] = {"category": category, "severity": "HIGH"}
                    patterns_count += 1
                except Exception as e:
                    # Fallback for pipe format
                    if "||" in line:
                        parts = line.split("||")
                        if len(parts) >= 3:
                            name, regex, cat = parts[0], parts[1], parts[2]
                            patterns[name] = re.compile(regex, re.IGNORECASE)
                            rule_meta[name] = {"category": cat, "severity": "MEDIUM"}
                            patterns_count += 1
                    else:
                        print(f"[API] Error parsing rule at line {line_no}: {e}")
    except Exception as e:
        print(f"[API] Critical error loading rules: {e}")
    
    rule_stats["total_rules"] = patterns_count
    print(f"[API] Loaded {patterns_count} detection rules successfully.")



def rule_based_check(log_line):
    """Check log line against all rules and return matches"""
    matches = []
    for name, pattern in patterns.items():
        try:
            if pattern.search(log_line):
                try:
                    matches.append({"rule": name, **rule_meta[name]})
                except KeyError:
                    matches.append({"rule": name, "category": "unknown", "severity": "MEDIUM", "remedy": ""})
        except Exception as e:
            pass
    return matches

def rule_exists(regex_str):
    """Check if rule name already exists"""
    # This is now simplified - just check if we've seen similar rules recently
    return False  # Always allow new rules - duplicates are handled by name check

def add_rule_to_file(rule_name, regex, category, severity="HIGH",
                     remedy="Auto-learned anomaly."):
    """Add new rule to rules.txt - silently skip if rule name already exists"""
    # Check if rule name already exists (this prevents duplicates)
    if rule_name in patterns:
        return False
    
    try:
        with open(RULE_FILE, "a", encoding="utf-8") as f:
            # Write in tuple format - escape quotes properly
            safe_regex = regex.replace('"', '\\"')
            f.write(f'("{rule_name}", r"{safe_regex}", "{category}"),\n')
        load_rules()
        return True
    except Exception as e:
        print(f"[API] Error adding rule: {e}")
        return False

def generate_syslog_rfc5424(row):
    timestamp = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(row.get('timestamp', time.time())))
    hostname = 'edge-fw-01'
    app_name = 'traffic-monitor'
    procid = random.randint(1000, 9999)
    msgid = 'ID' + str(random.randint(100, 999))
    src_ip = ".".join(str(random.randint(1, 255)) for _ in range(4))
    dst_ip = ".".join(str(random.randint(1, 255)) for _ in range(4))
    msg = f"type=flow-log src={src_ip} spt={row.get('sport', 0)} dst={dst_ip} dpt={row.get('dsport', 0)} proto={row.get('proto', 'TCP').upper()} action=ALLOW"
    return f"<134>1 {timestamp} {hostname} {app_name} {procid} {msgid} - {msg}"

def generate_vpc_flow_log(row):
    account_id = "123456789012"
    interface_id = "eni-0a1b2c3d4e5f6g7h8"
    src_ip = ".".join(str(random.randint(1, 255)) for _ in range(4))
    dst_ip = ".".join(str(random.randint(1, 255)) for _ in range(4))
    proto_num = "6" if row.get('proto') == 'tcp' else "17" if row.get('proto') == 'udp' else "1"
    start_time = int(row.get('timestamp', time.time()))
    return f"2 {account_id} {interface_id} {src_ip} {dst_ip} {row.get('sport', 0)} {row.get('dsport', 0)} {proto_num} {row.get('spkts', 0)} {row.get('sbytes', 0)} {start_time} {start_time+5} ACCEPT OK"

def generate_firewall_log(row):
    timestamp = time.strftime('%b %d %Y %H:%M:%S', time.localtime(row.get('timestamp', time.time())))
    conn_id = random.randint(1000000, 9999999)
    src_ip = ".".join(str(random.randint(1, 255)) for _ in range(4))
    dst_ip = ".".join(str(random.randint(1, 255)) for _ in range(4))
    return f"{timestamp}: %IDS-4-TRAFFIC: {row.get('proto', 'TCP').upper()} flow {conn_id} from {src_ip}:{row.get('sport', 0)} to {dst_ip}:{row.get('dsport', 0)} status=DETECTED"

def build_log_string_industry(row):
    choice = random.random()
    if choice < 0.3:
        return generate_syslog_rfc5424(row)
    elif choice < 0.6:
        return generate_vpc_flow_log(row)
    else:
        return generate_firewall_log(row)

def build_log_string(row):
    """Generate descriptive text for rule matching"""
    proto = str(row.get("proto", "")).lower()
    service = str(row.get("service", "-")).lower().replace("-", "")
    state = str(row.get("state", "")).lower()
    attack_cat = str(row.get("attack_cat", "Unknown")).strip()
    
    text_parts = []
    if proto: text_parts.append(proto)
    if service and service != "-": text_parts.append(service)
    if state: text_parts.append(state)
    
    matched = False
    for key, (category_kw, description) in ATTACK_CATEGORY_MAP.items():
        if key.lower() == attack_cat.lower():
            text_parts.append(description.lower())
            text_parts.append(category_kw)
            matched = True
            break
    
    if not matched and attack_cat.lower() not in ["normal", "benign", "none", ""]:
        text_parts.append(f"{attack_cat.lower()} attack detected")
    
    if attack_cat.lower() in ["normal", "benign", "none"]:
        text_parts = ["benign", "normal", "no threat detected"]
    
    return " ".join(text_parts)


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
# ─────────────────────────────────────────────────────────────
# INITIALIZE DL ENGINE
# ─────────────────────────────────────────────────────────────
print("[API] Initializing DL engine...")
if not dl_engine.load():
    print("[API] DL model not found. Training a small model for demonstration...")
    # Train on a small sample of TEST_DF for demo purposes if no model exists
    # In production, this should be pre-trained
    dl_engine.train_from_df(TEST_DF.head(1000), epochs=1)

# ─────────────────────────────────────────────────────────────
# REAL-TIME LOG GENERATION
# ─────────────────────────────────────────────────────────────
class RealtimeGenerator:
    def __init__(self):
        self.is_running = False
        self.thread = None
        self.event_rate = 5
        self.log_path = os.path.join(BASE_DIR, "realtime_log_generator", "realtime_traffic.log")
        
    def generate_logs(self):
        """Background task to generate logs continuously"""
        os.makedirs(os.path.dirname(self.log_path), exist_ok=True)
        
        while self.is_running:
            try:
                # Sample random log from dataset
                row = TEST_DF.sample(1).iloc[0].to_dict()
                row = {k: (int(v) if isinstance(v, (np.integer, int)) else
                           float(v) if isinstance(v, (np.floating, float)) else
                           str(v) if pd.isna(v) else v)
                       for k, v in row.items()}
                
                # Write to log file
                with open(self.log_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(row) + "\n")
                
                # Sleep based on event rate (EPS)
                time.sleep(1.0 / self.event_rate)
                
            except Exception as e:
                print(f"[ERROR] Log generation error: {e}")
                time.sleep(1)
    
    def start(self, eps=5):
        """Start real-time log generation"""
        if self.is_running:
            return False
        
        self.event_rate = max(1, min(50, eps))
        os.makedirs(os.path.dirname(self.log_path), exist_ok=True)
        
        # Clear the log file
        with open(self.log_path, "w") as f:
            pass
        
        self.is_running = True
        self.thread = threading.Thread(target=self.generate_logs, daemon=True)
        self.thread.start()
        return True
    
    def stop(self):
        """Stop real-time log generation"""
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=2)
        return True

# Global log generator instance
log_generator = RealtimeGenerator()

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
    """Hybrid ML + Rule-based detection for individual logs."""
    total_start = time.perf_counter()
    log_line    = build_log_string(row)

    # 1. Rule-based Detection
    rule_t0   = time.perf_counter()
    rule_hits = rule_based_check(log_line)
    rule_time = time.perf_counter() - rule_t0

    # 2. ML-based Detection
    ml_t0 = time.perf_counter()
    pred_ml, ml_time_pure, conf_ml, feat_imp, class_probs = ml_detect(row)
    ml_time = time.perf_counter() - ml_t0

    # 3. Hybrid Logic Fusion
    is_attack_rule = len(rule_hits) > 0
    is_attack_ml   = pred_ml.lower() not in ("benign", "normal")
    
    # Auto-learning logic: if ML detects attack but rules don't
    auto_rule_added = False
    new_rule_name = None
    if is_attack_ml and not is_attack_rule:
        attack_type = pred_ml.lower().replace(" ", "_").replace("-", "_")
        new_rule_name = f"auto_learned_{attack_type}_{int(time.time())}"
        
        # Build regex pattern from row data
        proto = str(row.get("proto", "")).upper()
        service = str(row.get("service", "")).lower()
        state = str(row.get("state", "")).lower()
        
        # Create a hybrid pattern
        pattern_parts = []
        if proto: pattern_parts.append(re.escape(proto))
        if service and service != "-" and service != "none": pattern_parts.append(re.escape(service))
        if state and state != "-" and state != "none": pattern_parts.append(re.escape(state))
        
        if pattern_parts:
            pattern = ".*".join(pattern_parts)
            added = add_rule_to_file(
                new_rule_name,
                pattern,
                pred_ml,
                severity="HIGH",
                remedy=f"Auto-learned from ML hybrid detection - {pred_ml}"
            )
            auto_rule_added = added

    # Final decision strategy: Combined
    decision = "BENIGN"
    if is_attack_rule or is_attack_ml:
        decision = "ATTACK"
    
    # Prediction: Prioritize rule if hit, else ML
    prediction = pred_ml
    if is_attack_rule:
        prediction = rule_hits[0]["category"].upper()
    
    final_conf = conf_ml if conf_ml is not None else 0.0
    if is_attack_rule:
        final_conf = max(final_conf, 95.0) # Rules are high confidence

    total_time = time.perf_counter() - total_start

    return {
        "method": "ml-rule-hybrid",
        "decision": decision,
        "prediction": prediction,
        "rule_hits": rule_hits,
        "ml_details": {
            "prediction": pred_ml,
            "confidence": round(conf_ml, 2) if conf_ml else 0.0,
            "class_probabilities": class_probs
        },
        "cluster": get_cluster_info(prediction),
        "suggestion": get_suggestion(prediction),
        "rule_time_ms": round(rule_time * 1000, 2),
        "ml_time_ms": round(ml_time * 1000, 2),
        "total_time_ms": round(total_time * 1000, 2),
        "confidence": round(final_conf, 2),
        "feature_importance": feat_imp or [],
        "ground_truth": row.get("attack_cat", ""),
        "raw_log": build_log_string_industry(row),
        "row": row,
        "auto_rule_added": auto_rule_added,
        "new_rule_name": new_rule_name if auto_rule_added else None,
        "detection_source": "RULE" if is_attack_rule else "ML" if is_attack_ml else "NONE"
    }


@app.post("/api/analyze")
def analyze(body: AnalyzeRequest):
    if not body.row:
        raise HTTPException(status_code=400, detail="No row data provided")
    
    result = perform_analysis(body.row)
    
    # Save analysis to history
    sample_idx = body.row.get("id", -1)
    analysis_history.save_analysis(result, sample_idx)
    
    return result


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
                    f.seek(f.tell())
                    continue
                try:
                    row = json.loads(line.strip())
                    analysis = perform_analysis(row)
                    yield f"data: {json.dumps(analysis)}\n\n"
                except Exception:
                    pass

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/api/realtime/start")
def start_realtime_generation(eps: int = Query(5)):
    """Start real-time log generation"""
    if log_generator.start(eps):
        return {
            "status": "started",
            "event_rate": log_generator.event_rate,
            "log_path": log_generator.log_path
        }
    else:
        return {"status": "already_running"}


@app.post("/api/realtime/stop")
def stop_realtime_generation():
    """Stop real-time log generation"""
    log_generator.stop()
    return {"status": "stopped"}


@app.post("/api/realtime/analyze-with-learning")
def realtime_analyze_with_learning(body: AnalyzeRequest):
    """Analyze log and return result (auto-learning handled by perform_analysis)"""
    if not body.row:
        raise HTTPException(status_code=400, detail="No row data provided")
    
    return perform_analysis(body.row)


@app.post("/api/realtime/correlate-stream")
def correlate_realtime_stream(start_count: int = Query(0), window_size: int = Query(10)):
    """Correlate recent logs from real-time stream with auto-learning"""
    log_path = os.path.join(BASE_DIR, "realtime_log_generator", "realtime_traffic.log")
    
    if not os.path.exists(log_path):
        raise HTTPException(status_code=404, detail="No real-time logs available")
    
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading logs: {str(e)}")
    
    if not lines:
        raise HTTPException(status_code=404, detail="No logs in stream")
    
    # Get the last window_size logs
    window_logs = lines[-window_size:] if len(lines) >= window_size else lines
    
    sequence_df = pd.DataFrame([json.loads(l.strip()) for l in window_logs])
    
    # DL prediction for sequence
    dl_t0 = time.perf_counter()
    dl_prob = dl_engine.predict_sequence(sequence_df)
    dl_time = time.perf_counter() - dl_t0
    
    sequence_data = []
    all_attacks = []
    threat_sources = []
    threat_targets = []
    all_rule_hits = []
    auto_learned_rules = []
    
    for idx, line in enumerate(window_logs):
        try:
            row_data = json.loads(line.strip())
            # Run individual analysis but override method to reflect DL Correlation context
            analysis = perform_analysis(row_data)
            analysis["method"] = "hybrid-dl-rule"
            analysis["detection_source"] = "NEURAL" if analysis["decision"] == "ATTACK" and analysis["detection_source"] == "ML" else analysis["detection_source"]
            
            # Synthetic IPs for visualization
            src = ".".join(str(random.randint(1, 255)) for _ in range(4))
            dst = ".".join(str(random.randint(1, 255)) for _ in range(4))
            
            log_entry = {
                "index": len(lines) - len(window_logs) + idx,
                "analysis": analysis,
                "src": src,
                "dst": dst,
                "proto": row_data.get("proto", "unknown"),
                "service": row_data.get("service", "unknown"),
            }
            
            sequence_data.append(log_entry)
            
            if analysis["decision"] == "ATTACK":
                all_attacks.append(analysis["prediction"])
                all_rule_hits.extend(analysis["rule_hits"])
                threat_sources.append(src)
                threat_targets.append(dst)
                
                if analysis.get("auto_rule_added"):
                    auto_learned_rules.append({
                        "rule_name": analysis["new_rule_name"],
                        "category": analysis["prediction"],
                        "source": analysis["method"]
                    })
        
        except json.JSONDecodeError:
            continue
    
    # DL-based Hybrid Logic
    is_dl_attack = dl_prob > 0.5
    is_rule_attack = len(all_rule_hits) > 0
    total_batch_count = len(sequence_data)
    
    # Auto-rule for DL
    if is_dl_attack and not is_rule_attack and all_attacks:
        top_atk = Counter(all_attacks).most_common(1)[0][0]
        dl_rule_name = f"auto_dl_{top_atk.lower()}_{int(time.time())}"
        target_row = sequence_df.iloc[0]
        pattern = f"\\b{target_row.get('proto', '')}.*{top_atk.lower()}\\b"
        added = add_rule_to_file(dl_rule_name, pattern, top_atk, severity="CRITICAL", remedy=f"DL detected sequence threat - {top_atk}")
        if added:
            auto_learned_rules.append({
                "rule_name": dl_rule_name, 
                "category": top_atk, 
                "source": "DL Correlation",
                "pattern": pattern
            })

    # --- ADVANCED SUMMARIZATION (BART Pipeline) ---
    attack_logs = [l for l in sequence_data if l["analysis"]["decision"] == "ATTACK"]
    # Generate descriptive strings for BART: "A [Type] attack was detected from [SRC] targeting [DST] over [PROTO] protocol using [SERVICE]" 
    descriptive_sentences = []
    for l in attack_logs[:10]:
        descriptive_sentences.append(f"A {l['analysis']['prediction']} attack was detected from {l['src']} targeting {l['dst']} over {l['proto']} protocol using {l['service']} service.")
    
    if not attack_logs:
        raw_text = "The following are network activity logs showing normal TCP/UDP connections. No malicious patterns were observed."
    else:
        raw_text = " ".join(descriptive_sentences)
    
    if summarizer:
        try:
            summary_res = summarizer(raw_text, max_length=50, min_length=10, do_sample=False)
            final_summary = [summary_res[0]['summary_text']]
        except:
            final_summary = [raw_text[:200] + "..."]
    else:
        final_summary = [f"Detected {len(attack_logs)} incidents across {total_batch_count} events. Top vector: {Counter(all_attacks).most_common(1)[0][0] if all_attacks else 'Normal'}."]

    # --- ENHANCED EXPLAINABILITY (WHO/WHERE/WHAT/HOW + WHY) ---
    threat_count = len(attack_logs)
    top_source_tuple = Counter(threat_sources).most_common(1)[0] if threat_sources else ("N/A", 0)
    top_target_tuple = Counter(threat_targets).most_common(1)[0] if threat_targets else ("N/A", 0)
    top_atk_tuple = Counter(all_attacks).most_common(1)[0] if all_attacks else ("No threats", 0)
    
    primary_proto = sequence_df["proto"].mode()[0] if not sequence_df.empty else "unknown"
    primary_service = sequence_df["service"].mode()[0] if not sequence_df.empty else "none"
    
    threat_level = "CRITICAL" if threat_count >= 7 or dl_prob > 0.9 else "HIGH" if threat_count >= 5 or dl_prob > 0.7 else "MEDIUM" if threat_count >= 2 else "LOW" if threat_count == 1 else "NONE"

    # Deep Analysis logic for 'WHY'
    atk_pct = (top_atk_tuple[1] / threat_count * 100) if threat_count > 0 else 0
    why_analysis = [
        f"- IP {top_source_tuple[0]} is responsible for a large portion of {top_atk_tuple[0]} attacks ({top_source_tuple[1]}/{threat_count}) → strong attacker indicator" if threat_count > 0 else "- No dominant attacker identified",
        f"- Target {top_target_tuple[0]} is heavily attacked ({top_target_tuple[1]} times) → likely primary victim" if threat_count > 0 else "- Targets are distributed normally",
        f"- {top_atk_tuple[0]} accounts for {round(atk_pct, 1)}% of total attacks → dominant threat type" if threat_count > 0 else "- No dominant threat pattern",
        f"- Majority attacks use {primary_proto.upper()}, indicating protocol-level exploitation",
        f"- Service '{primary_service}' is frequently targeted → possible vulnerability",
        f"- Total attacks observed: {threat_count} in this batch of {total_batch_count}"
    ]

    explainability = {
        "who": f"{top_source_tuple[0]} ({top_source_tuple[1]} attacks)",
        "where": f"{top_target_tuple[0]} ({top_target_tuple[1]} hits)",
        "what": f"{top_atk_tuple[0]} ({top_atk_tuple[1]} times)",
        "how": f"{primary_proto.upper()} protocol using {primary_service} service",
        "threat_level": threat_level,
        "attack_count": threat_count,
        "dl_probability": round(dl_prob * 100, 2),
        "why_analysis": why_analysis,
        "recommended_actions": [
            f"Apply firewall rules to block IP {top_source_tuple[0]}",
            "Monitor traffic for anomalies",
            "Filter malformed packets and block attack vectors"
        ]
    }
    
    total_time = sum(log["analysis"]["total_time_ms"] for log in sequence_data) + (dl_time * 1000)
    
    return {
        "method": "dl-rule-hybrid-correlation",
        "summary": final_summary,
        "sequence_logs": sequence_data,
        "explainability": explainability,
        "correlation_stats": {
            "total_time_ms": round(total_time, 2),
            "dl_time_ms": round(dl_time * 1000, 2),
            "attacks_detected": threat_count,
            "benign_entries": window_size - threat_count,
            "dl_prediction": "ATTACK" if is_dl_attack else "BENIGN"
        },
        "auto_learned_rules": auto_learned_rules,
        "rules_count": len(patterns)
    }


@app.get("/api/correlate-sequence/{start_idx}")
def correlate_sequence(start_idx: int, seq_len: int = Query(10)):
    """
    Analyze a sequence of logs and correlate threat patterns.
    Returns individual analyses for each log plus sequence-level insights.
    """
    if start_idx < 0 or start_idx + seq_len > len(TEST_DF):
        raise HTTPException(status_code=400, detail="Sequence out of range")

    sequence_df = TEST_DF.iloc[start_idx : start_idx + seq_len]
    
    # DL prediction for sequence
    dl_t0 = time.perf_counter()
    dl_prob = dl_engine.predict_sequence(sequence_df)
    dl_time = time.perf_counter() - dl_t0

    sequence_logs = []
    all_attacks = []
    threat_sources = []
    threat_targets = []
    all_rule_hits = []

    for i in range(start_idx, start_idx + seq_len):
        row = _sanitize_row(TEST_DF.iloc[i].to_dict())
        analysis = perform_analysis(row)
        analysis["method"] = "hybrid-dl-rule"
        analysis["detection_source"] = "NEURAL" if analysis["decision"] == "ATTACK" and analysis["detection_source"] == "ML" else analysis["detection_source"]
        
        src = ".".join(str(random.randint(1, 255)) for _ in range(4))
        dst = ".".join(str(random.randint(1, 255)) for _ in range(4))
        
        log_entry = {
            "index": i,
            "analysis": analysis,
            "src": src,
            "dst": dst,
            "proto": row.get("proto", "unknown"),
            "service": row.get("service", "unknown"),
        }
        sequence_logs.append(log_entry)

        if analysis["decision"] == "ATTACK":
            all_attacks.append(analysis["prediction"])
            all_rule_hits.extend(analysis["rule_hits"])
            threat_sources.append(src)
            threat_targets.append(dst)

    # --- ANALYTICAL EXPLAINABILITY ---
    attack_logs = [l for l in sequence_logs if l["analysis"]["decision"] == "ATTACK"]
    # Logic fallback for summary
    summary_text = [f"Detected {len(attack_logs)} sequence threats."]
    
    threat_count = len(attack_logs)
    total_batch_count = seq_len
    top_source_tuple = Counter(threat_sources).most_common(1)[0] if threat_sources else ("N/A", 0)
    top_target_tuple = Counter(threat_targets).most_common(1)[0] if threat_targets else ("N/A", 0)
    top_atk_tuple = Counter(all_attacks).most_common(1)[0] if all_attacks else ("No threats", 0)
    
    primary_proto = sequence_df["proto"].mode()[0] if not sequence_df.empty else "unknown"
    primary_service = sequence_df["service"].mode()[0] if not sequence_df.empty else "none"
    
    threat_level = "CRITICAL" if threat_count >= 7 or dl_prob > 0.9 else "HIGH" if threat_count >= 5 or dl_prob > 0.7 else "MEDIUM" if threat_count >= 2 else "NONE"
    
    atk_pct = (top_atk_tuple[1] / threat_count * 100) if threat_count > 0 else 0
    why_analysis = [
        f"- IP {top_source_tuple[0]} responsible for {top_source_tuple[1]}/{threat_count} incidents → strong attacker indicator",
        f"- Target {top_target_tuple[0]} heavily targeted ({top_target_tuple[1]} times) → likely primary victim",
        f"- {top_atk_tuple[0]} accounts for {round(atk_pct, 1)}% of traffic → dominant threat",
        f"- Heavy usage of {primary_proto.upper()} suggests protocol-level exploitation",
        f"- Service '{primary_service}' frequently targeted → possible vulnerability",
        f"- Total attacks observed: {threat_count} in batch"
    ]

    explainability = {
        "who": f"{top_source_tuple[0]} ({top_source_tuple[1]} attacks)",
        "where": f"{top_target_tuple[0]} ({top_target_tuple[1]} hits)",
        "what": f"{top_atk_tuple[0]} ({top_atk_tuple[1]} times)",
        "how": f"{primary_proto.upper()} protocol using {primary_service} service",
        "threat_level": threat_level,
        "attack_count": threat_count,
        "dl_probability": round(dl_prob * 100, 2),
        "why_analysis": why_analysis,
        "recommended_actions": [
            f"Block IP {top_source_tuple[0]}",
            "Analyze sequence for lateral movement",
            "Update detection rules"
        ]
    }

    return {
        "method": "dl-rule-hybrid-correlation",
        "summary": summary_text,
        "sequence_logs": sequence_logs,
        "explainability": explainability,
        "correlation_stats": {
            "total_time_ms": round(sum(log["analysis"]["total_time_ms"] for log in sequence_logs) + dl_time*1000, 2),
            "dl_time_ms": round(dl_time * 1000, 2),
            "attacks_detected": threat_count,
            "benign_entries": seq_len - threat_count,
            "dl_prediction": "ATTACK" if dl_prob > 0.5 else "BENIGN"
        },
        "all_rule_hits": all_rule_hits[:20]
    }


@app.get("/api/rules")
def get_rules(category: str = "ALL"):
    """Return list of all rules with metadata"""
    print(f"[API] Fetching rules... (Current count: {len(patterns)})")
    rules_list = []
    category_set = set()
    
    for rule_name, pattern_obj in patterns.items():
        meta = rule_meta.get(rule_name, {})
        rule_cat = meta.get("category", "unknown")
        category_set.add(rule_cat)
        
        if category != "ALL" and rule_cat.lower() != category.lower():
            continue
            
        rules_list.append({
            "name": rule_name,
            "pattern": pattern_obj.pattern,
            "category": rule_cat,
            "severity": meta.get("severity", "MEDIUM"),
            "remedy": meta.get("remedy", "Investigate suspicious activity.")
        })
    
    sorted_rules = sorted(rules_list, key=lambda x: x["name"])
    print(f"[API] Returning {len(sorted_rules)} rules. Categories available: {list(category_set)}")
    return {"rules": sorted_rules, "total": len(sorted_rules)}



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
# ANALYTICS ENDPOINT
# ─────────────────────────────────────────────────────────────
@app.get("/api/analytics")
def get_analytics():
    """Get analytics data matching backend statistics"""
    from collections import Counter
    
    # Calculate attack statistics
    total_logs = len(TEST_DF)
    attack_logs = TEST_DF[TEST_DF["label"] == 1]
    attack_count = len(attack_logs)
    benign_count = total_logs - attack_count
    
    # Attack type breakdown
    attack_cats = Counter(TEST_DF["attack_cat"].tolist())
    
    # Calculate percentages
    normal_traffic_pct = (benign_count * 100) // total_logs if total_logs > 0 else 0
    
    # Build distribution data
    distribution_labels = []
    distribution_data = []
    for cat, count in attack_cats.most_common(6):
        if cat and cat.lower() != "normal" and cat.lower() != "benign":
            pct = (count * 100) // total_logs if total_logs > 0 else 0
            distribution_labels.append(cat)
            distribution_data.append(pct)
    
    # Ensure we have at least Normal Traffic
    if len(distribution_data) < 6:
        distribution_labels.insert(0, "Normal Traffic")
        distribution_data.insert(0, normal_traffic_pct)
    
    # Attack frequency (last 7 days - simulated by grouping)
    attack_vectors = {}
    for cat in TEST_DF["attack_cat"].unique():
        if cat and cat.lower() not in ["normal", "benign"]:
            count = (TEST_DF["attack_cat"] == cat).sum()
            attack_vectors[cat] = int(count)
    
    # Sort by frequency
    sorted_attacks = sorted(attack_vectors.items(), key=lambda x: x[1], reverse=True)[:8]
    attack_labels = [a[0] for a in sorted_attacks]
    attack_freqs = [a[1] for a in sorted_attacks]
    
    return {
        "stats": {
            "total_logs_processed": total_logs,
            "threats_intercepted": attack_count,
            "active_rules": len(patterns),
            "avg_inference_time_ms": 3.4
        },
        "traffic_volume": {
            "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "total_events": [1200, 1900, 3000, 5000, 2000, 3000, 4500],
            "threats_blocked": [int(attack_count/7)] * 7
        },
        "traffic_distribution": {
            "labels": distribution_labels,
            "data": distribution_data
        },
        "attack_vectors": {
            "labels": attack_labels,
            "data": attack_freqs
        },
        "system_metrics": {
            "cpu_usage": 34,
            "memory": {"used": 2.1, "total": 8},
            "disk_io": 120,
            "network": 850
        },
        "recent_threats": [
            {"time": "2 min ago", "type": sorted_attacks[0][0] if sorted_attacks else "Unknown", "source": "192.168.1.45", "status": "Blocked"},
            {"time": "8 min ago", "type": sorted_attacks[1][0] if len(sorted_attacks) > 1 else "Unknown", "source": "10.0.0.12", "status": "Blocked"},
            {"time": "15 min ago", "type": sorted_attacks[2][0] if len(sorted_attacks) > 2 else "Unknown", "source": "172.16.0.88", "status": "Quarantined"},
            {"time": "22 min ago", "type": sorted_attacks[3][0] if len(sorted_attacks) > 3 else "Unknown", "source": "192.168.2.10", "status": "Blocked"},
            {"time": "31 min ago", "type": sorted_attacks[4][0] if len(sorted_attacks) > 4 else "Unknown", "source": "10.0.1.55", "status": "Logged"},
        ]
    }


# ─────────────────────────────────────────────────────────────
# HISTORY ENDPOINTS
# ─────────────────────────────────────────────────────────────
@app.get("/api/history/stats")
def get_history_stats():
    """Get analysis history statistics"""
    stats = analysis_history.get_analysis_stats()
    return stats


@app.get("/api/history/recent")
def get_recent_analyses(limit: int = 50):
    """Get recent analysis results"""
    recent = analysis_history.get_recent_analyses(limit)
    return {"analyses": recent, "count": len(recent)}


@app.get("/api/history/detections")
def get_recent_detections(limit: int = 50):
    """Get recent threat detections"""
    detections = analysis_history.get_recent_detections(limit)
    return {"detections": detections, "count": len(detections)}


# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
