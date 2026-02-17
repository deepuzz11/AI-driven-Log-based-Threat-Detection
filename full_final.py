#!/usr/bin/env python3
# ============================================================
# HYBRID LOG ANALYZER
# Rule-Based (Primary) + ML-Based (Fallback)
# ============================================================

import re
import time
import json
import joblib
import pandas as pd
from collections import defaultdict

# ============================================================
# 1. LOAD RULES (FROM YOUR ADVANCED LOG ANALYZER)
# ============================================================

rule_tuples = [
    ("dos_syn_flood", r"\b(SYN[- ]?flood|syn flood|SYN-FLOOD)\b", "dos"),
    ("ddos_http_flood", r"\b(http flood|layer7 flood|slowloris)\b", "ddos"),
    ("malware_indicator", r"\b(malware|trojan|ransomware|virus)\b", "malware"),
    ("reverse_shell", r"\b(reverse shell|bash -i >& /dev/tcp|nc -e)\b", "backdoor"),
    ("c2_beacon", r"\b(C2 beacon|beaconing|callback to)\b", "backdoor"),
    ("ssh_bruteforce", r"\b(ssh bruteforce|Failed password for)\b", "auth"),
    ("port_scan", r"\b(nmap scan|port scan|scan detected)\b", "recon"),
]

# Compile rules
patterns = {}
pattern_categories = {}

for name, regex, cat in rule_tuples:
    patterns[name] = re.compile(regex, re.IGNORECASE)
    pattern_categories[name] = cat

# ============================================================
# 2. RULE-BASED SINGLE LOG CHECK
# ============================================================

def rule_based_check_single_log(log_line):
    matched_rules = []
    categories = set()

    for pname, pattern in patterns.items():
        if pattern.search(log_line):
            matched_rules.append(pname)
            categories.add(pattern_categories.get(pname, "other"))

    return {
        "matched": len(matched_rules) > 0,
        "rules": matched_rules,
        "categories": list(categories)
    }

# ============================================================
# 3. EXPLANATION ENGINE
# ============================================================

def explain_detection(rule, log_line):
    return (
        f"Rule Triggered: {rule}\n"
        f"Category: {pattern_categories.get(rule)}\n"
        f"Evidence: {log_line}\n"
        f"Severity: HIGH\n"
        f"Action: Investigate immediately"
    )

# ============================================================
# 4. LOAD ML MODEL (PIPELINE + LABEL ENCODER)
# ============================================================

ML_MODEL_PATH = "hybrid_ml_model.joblib"
LABEL_ENCODER_PATH = "label_encoder.joblib"

ml_model = joblib.load(ML_MODEL_PATH)
label_encoder = joblib.load(LABEL_ENCODER_PATH)

# ============================================================
# 5. ML INFERENCE FUNCTION
# ============================================================

def ml_detect_single_log(feature_dict):
    # Create DF from extracted features
    df = pd.DataFrame([feature_dict])

    # 🔥 ALIGN COLUMNS TO TRAINING SCHEMA
    expected_cols = ml_model.feature_names_in_
    df = df.reindex(columns=expected_cols, fill_value=0)

    start = time.time()
    pred = ml_model.predict(df)
    detect_time = time.time() - start

    return {
        "prediction": label_encoder.inverse_transform(pred)[0],
        "detection_time": detect_time
    }


# ============================================================
# 6. 🔥 HYBRID ANALYSIS CONTROLLER
# ============================================================

def hybrid_analyze_log(log_line, extracted_features=None):
    """
    1️⃣ Rule-based detection FIRST
    2️⃣ ML-based detection ONLY if no rule matched
    """

    start_total = time.time()

    # ---- RULE BASED ----
    rule_result = rule_based_check_single_log(log_line)

    if rule_result["matched"]:
        explanations = [
            explain_detection(rule, log_line)
            for rule in rule_result["rules"]
        ]

        return {
            "method": "rule-based",
            "matched": True,
            "rules": rule_result["rules"],
            "categories": rule_result["categories"],
            "explanations": explanations,
            "total_detection_time": time.time() - start_total
        }

    # ---- ML FALLBACK ----
    if extracted_features is None:
        return {
            "method": "none",
            "matched": False,
            "message": "No rule match and no ML features provided"
        }

    ml_result = ml_detect_single_log(extracted_features)

    return {
        "method": "ml-based",
        "matched": False,
        "ml_prediction": ml_result["prediction"],
        "ml_detection_time": ml_result["detection_time"],
        "total_detection_time": time.time() - start_total
    }

# ============================================================
# 7. FILE-BASED LOG ANALYSIS
# ============================================================

def analyze_log_file_hybrid(log_file, feature_extractor=None):
    results = []

    with open(log_file, "r", errors="ignore") as f:
        for line in f:
            log_line = line.strip()

            features = feature_extractor(log_line) if feature_extractor else None
            result = hybrid_analyze_log(log_line, features)

            results.append({
                "log": log_line,
                "result": result
            })

    return results

# ============================================================
# 8. EXAMPLE FEATURE EXTRACTOR (YOU CAN IMPROVE THIS)
# ============================================================

def simple_feature_extractor(log_line):
    """
    Dummy example — replace with real UNSW-style feature extraction
    """
    return {
        "dur": 0.2,
        "spkts": 10,
        "dpkts": 8,
        "sbytes": 1500,
        "dbytes": 1200,
        "proto": "tcp",
        "service": "http",
        "state": "FIN"
    }

# ============================================================
# 9. MAIN TEST
# ============================================================

if __name__ == "__main__":

    test_logs = [
        "SYN flood detected from multiple IPs",
        "Normal user login successful",
        "Unknown traffic spike without signature",
        "Reverse shell opened using nc -e"
    ]

    for log in test_logs:
        result = hybrid_analyze_log(log, simple_feature_extractor(log))

        print("\n==============================")
        print("LOG:", log)
        print("RESULT:")
        print(json.dumps(result, indent=2))
