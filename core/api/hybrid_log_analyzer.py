#!/usr/bin/env python3
# ============================================================
# SELF-LEARNING HYBRID LOG ANALYZER (FINAL CLEAN VERSION)
# Rule → ML fallback → Auto rule learning
# ML OUTPUT = DIRECT ATTACK / BENIGN DECISION
# ============================================================

import re
import time
import joblib
import pandas as pd

# ============================================================
# CONFIG
# ============================================================

RULE_FILE = "rules.txt"
ML_MODEL_PATH = "hybrid_ml_model.joblib"
LABEL_ENCODER_PATH = "label_encoder.joblib"

# ============================================================
# RULE STORAGE
# ============================================================

patterns = {}
rule_meta = {}

# ============================================================
# LOAD RULES
# ============================================================

def load_rules():

    patterns.clear()
    rule_meta.clear()

    try:
        with open(RULE_FILE, "r", encoding="utf-8") as f:
            for line in f:

                line = line.strip()
                if not line or line.startswith("#"):
                    continue

                # Try tuple format first: ("name", r"pattern", "category")
                if line.endswith(","):
                    line = line[:-1]
                
                name = None
                regex = None
                category = None
                severity = "MEDIUM"
                remedy = "Investigate suspicious activity."

                try:
                    # Try parsing tuple format
                    name, regex, category = eval(line)
                except:
                    # Fall back to pipe-delimited format
                    if "||" in line:
                        parts = line.split("||")
                        name = parts[0].strip()
                        regex = parts[1].strip()
                        category = parts[2].strip() if len(parts) > 2 else "unknown"
                        severity = parts[3].strip() if len(parts) > 3 else "MEDIUM"
                        remedy = parts[4].strip() if len(parts) > 4 else "Investigate suspicious activity."

                if name and regex:
                    try:
                        patterns[name] = re.compile(regex, re.IGNORECASE)
                        rule_meta[name] = {
                            "category": category,
                            "severity": severity,
                            "remedy": remedy
                        }
                    except re.error as e:
                        print(f"[WARNING] Invalid regex in {name}: {e}")

        print(f"[RULE ENGINE] Loaded {len(patterns)} rules.")

    except FileNotFoundError:
        print("[WARNING] rules.txt not found.")


# ============================================================
# CHECK DUPLICATE RULE
# ============================================================

def rule_exists(regex):
    return any(p.pattern == regex for p in patterns.values())


# ============================================================
# ADD AUTO RULE
# ============================================================

def add_rule_to_file(rule_name, regex, category):

    if rule_exists(regex):
        return

    severity = "HIGH"
    remedy = "Auto-learned anomaly detected."

    with open(RULE_FILE, "a", encoding="utf-8") as f:
        f.write(
            f"{rule_name}||{regex}||{category}||{severity}||{remedy}\n"
        )

    print(f"[AUTO-LEARN] Rule added → {rule_name}")
    load_rules()


# ============================================================
# RULE CHECK
# ============================================================

def rule_based_check(log_line):

    matches = []

    for pname, pattern in patterns.items():
        if pattern.search(log_line):

            meta = rule_meta[pname]

            matches.append({
                "rule": pname,
                "category": meta["category"],
                "severity": meta["severity"],
                "remedy": meta["remedy"]
            })

    return matches


# ============================================================
# LOAD ML MODEL
# ============================================================

ml_model = joblib.load(ML_MODEL_PATH)
label_encoder = joblib.load(LABEL_ENCODER_PATH)


# ============================================================
# ML DETECTION (DIRECT CLASSIFICATION)
# ============================================================

def ml_detect(features):

    df = pd.DataFrame([features])
    df = df.reindex(columns=ml_model.feature_names_in_, fill_value=0)

    start = time.perf_counter()

    prediction_encoded = ml_model.predict(df)[0]
    prediction = label_encoder.inverse_transform(
        [prediction_encoded]
    )[0]

    ml_time = time.perf_counter() - start

    return prediction, ml_time


# ============================================================
# AUTO RULE GENERATION
# ============================================================

def auto_generate_rule(log_line):

    keywords = re.findall(r"\b[a-zA-Z]{4,}\b", log_line.lower())

    if len(keywords) < 2:
        return

    pattern = r"\b" + r".*".join(keywords[:4]) + r"\b"
    rule_name = f"ml_auto_{int(time.time())}"

    add_rule_to_file(rule_name, pattern, "anomaly")


# ============================================================
# HYBRID ANALYZER
# ============================================================

def hybrid_analyze_log(log_line, features):

    total_start = time.perf_counter()

    # ---------- RULE ENGINE ----------
    rule_start = time.perf_counter()
    rule_hits = rule_based_check(log_line)
    rule_time = time.perf_counter() - rule_start

    if rule_hits:
        return {
            "method": "rule-based",
            "decision": "ATTACK",
            "matches": rule_hits,
            "rule_detection_time": rule_time,
            "ml_detection_time": 0.0,
            "total_detection_time":
                time.perf_counter() - total_start
        }

    # ---------- ML FALLBACK ----------
    prediction, ml_time = ml_detect(features)

    if prediction.upper() != "BENIGN":

        print("[ML ATTACK DETECTED]")

        auto_generate_rule(log_line)

        return {
            "method": "ml-fallback",
            "decision": "ATTACK",
            "ml_prediction": prediction,
            "auto_rule_added": True,
            "rule_detection_time": rule_time,
            "ml_detection_time": ml_time,
            "total_detection_time":
                time.perf_counter() - total_start
        }

    # ---------- BENIGN ----------
    return {
        "method": "ml-fallback",
        "decision": "BENIGN",
        "ml_prediction": prediction,
        "rule_detection_time": rule_time,
        "ml_detection_time": ml_time,
        "total_detection_time":
            time.perf_counter() - total_start
    }


# ============================================================
# DEMO FEATURE EXTRACTOR
# ============================================================

def simple_feature_extractor(log_line):

    return {
        "dur": 1.0,
        "spkts": 50,
        "dpkts": 40,
        "sbytes": 5000,
        "dbytes": 4200,
        "proto": "tcp",
        "service": "http",
        "state": "FIN",
    }


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    load_rules()

    test_logs = [
        "User login success",
        "Unknown outbound exfil detected",
        "Massive SYN flood attack started",
        "Reverse shell opened using nc -e",
    ]

    for log in test_logs:

        result = hybrid_analyze_log(
            log,
            simple_feature_extractor(log)
        )

        print("\n==============================")
        print("LOG:", log)
        print(result)