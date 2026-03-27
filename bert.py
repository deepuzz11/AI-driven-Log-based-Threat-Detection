# ============================
# SOC SYSTEM: FINAL PRO VERSION
# ============================

import os
os.environ["USE_TF"] = "0"

import pandas as pd
import time
import random
from transformers import pipeline
from collections import Counter

# ============================
# LOAD DATASET
# ============================
df = pd.read_csv("UNSW_NB15_training-set.csv")
df = df.sample(frac=1).reset_index(drop=True)

# ============================
# LOAD MODEL
# ============================
print("⏳ Loading AI model...\n")

summarizer = pipeline(
    "summarization",
    model="facebook/bart-large-cnn",
    framework="pt"
)

print("✅ Model Loaded!\n")

# ============================
# RANDOM IP
# ============================
def random_ip():
    return ".".join(str(random.randint(1, 255)) for _ in range(4))

# ============================
# ATTACK & TARGET POOLS
# ============================
attack_ip_pool = {}
target_ip_pool = {}

# ============================
# LOG GENERATION
# ============================
def row_to_structured_log(row):

    attack = str(row.get('attack_cat', "Normal")).strip()
    label = row.get('label', 0)

    if attack not in attack_ip_pool:
        attack_ip_pool[attack] = [random_ip() for _ in range(3)]

    if attack not in target_ip_pool:
        target_ip_pool[attack] = [random_ip() for _ in range(2)]

    if label == 0 or attack.lower() == "nan":
        src = random_ip()
        dst = random_ip()
        attack_type = "normal"
    else:
        src = random.choice(attack_ip_pool[attack])
        dst = random.choice(target_ip_pool[attack])
        attack_type = attack.lower()

    proto = str(row.get('proto', 'unknown')).upper()
    service = str(row.get('service', 'unknown'))

    if attack_type == "normal":
        text = f"A normal {proto} connection was observed from {src} to {dst} using {service} service."
    else:
        text = f"A {attack} attack was detected from {src} targeting {dst} over {proto} protocol using {service}."

    return {
        "text": text,
        "src": src,
        "dst": dst,
        "proto": proto,
        "service": service,
        "attack": attack_type
    }

# ============================
# REMEDY ENGINE (IMPROVED)
# ============================
def get_remedy(attack, ip):

    attack = str(attack).strip().lower()

    remedies = {
         "dos": [
            f"Block IP {ip}, enable rate limiting.",
            f"Activate DDoS protection systems.",
            f"Filter incoming traffic spikes.",
            f"Use CDN or load balancer to absorb traffic.",
            f"Apply SYN flood protection mechanisms."
        ],

        "exploits": [
            f"Patch vulnerable services immediately.",
            f"Block IP {ip}, monitor logs.",
            f"Update system and security patches.",
            f"Disable vulnerable endpoints.",
            f"Perform vulnerability scanning."
        ],

        # 🔥 FUZZERS (10+ options)
        "fuzzers": [
            f"Filter malformed packets from IP {ip}.",
            f"Enable strict input validation.",
            f"Deploy Web Application Firewall (WAF).",
            f"Block IP {ip} temporarily.",
            f"Inspect abnormal payload patterns.",
            f"Apply rate limiting on input requests.",
            f"Monitor unusual request formats.",
            f"Log and analyze fuzzing attempts.",
            f"Enable application-level validation.",
            f"Restrict unexpected input sizes.",
            f"Perform code hardening for input handling.",
            f"Check API endpoints for vulnerabilities."
        ],

        # 🔥 RECONNAISSANCE (10+ options)
        "reconnaissance": [
            f"Block IP {ip} and monitor scanning attempts.",
            f"Enable intrusion detection system (IDS).",
            f"Close unused ports immediately.",
            f"Limit ICMP and ping responses.",
            f"Monitor port scanning activity.",
            f"Enable firewall logging rules.",
            f"Restrict network exposure.",
            f"Deploy honeypots to detect scanning.",
            f"Analyze connection attempts frequency.",
            f"Enable geo-blocking if required.",
            f"Apply network segmentation.",
            f"Disable unnecessary services."
        ],

        # 🔥 GENERIC (20 options)
        "generic": [
            f"Apply firewall rules for IP {ip}.",
            f"Monitor traffic patterns from {ip}.",
            f"Analyze packets for anomalies.",
            f"Enable intrusion detection systems.",
            f"Inspect unusual protocol behavior.",
            f"Log and analyze suspicious sessions.",
            f"Block suspicious ports temporarily.",
            f"Enable deep packet inspection.",
            f"Check for unusual traffic bursts.",
            f"Monitor bandwidth usage anomalies.",
            f"Restrict unknown outbound traffic.",
            f"Verify protocol compliance.",
            f"Analyze DNS request patterns.",
            f"Audit firewall logs.",
            f"Enable network segmentation.",
            f"Monitor real-time traffic flows.",
            f"Inspect encrypted traffic if possible.",
            f"Correlate logs across systems.",
            f"Apply stricter access controls.",
            f"Review network security policies."
        ],

        "backdoor": [
            f"Isolate affected system from network.",
            f"Remove unauthorized access and credentials.",
            f"Perform full system integrity check.",
            f"Reinstall compromised systems.",
            f"Check for persistence mechanisms."
        ],

        "worms": [
            f"Disconnect infected systems immediately.",
            f"Run antivirus and malware scans.",
            f"Block IP {ip} across network.",
            f"Apply network quarantine.",
            f"Update all endpoints with patches."
        ]
    }


    options = remedies.get(attack, [f"Monitor suspicious activity from IP {ip}."])
    return random.choice(options)

# ============================
# EXPLAINABILITY (FINAL)
# ============================
def generate_explanation(structured_batch):

    attacks = [log for log in structured_batch if log["attack"] != "normal"]

    if not attacks:
        return "\n🔎 No attacks detected in this batch.\n"

    attack_types = [log["attack"] for log in attacks]
    attack_count = Counter(attack_types)

    top_attack, attack_freq = attack_count.most_common(1)[0]

    filtered_logs = [log for log in attacks if log["attack"] == top_attack]

    src_count = Counter([log["src"] for log in filtered_logs])
    dst_count = Counter([log["dst"] for log in filtered_logs])
    proto_count = Counter([log["proto"] for log in filtered_logs])
    service_count = Counter([log["service"] for log in filtered_logs])

    top_attacker, attacker_hits = src_count.most_common(1)[0]
    top_target, target_hits = dst_count.most_common(1)[0]
    top_proto, _ = proto_count.most_common(1)[0]
    top_service, _ = service_count.most_common(1)[0]

    total_attacks = len(attacks)

    # Threat level
    if total_attacks > 15:
        threat_level = "🔴 HIGH"
    elif total_attacks > 7:
        threat_level = "🟠 MEDIUM"
    else:
        threat_level = "🟢 LOW"

    explanation = "\n🔎 EXPLAINABILITY REPORT:\n"

    explanation += f"• WHO: {top_attacker} ({attacker_hits} attacks)\n"
    explanation += f"• WHERE: {top_target} ({target_hits} hits)\n"
    explanation += f"• WHAT: {top_attack.upper()} ({attack_freq} times)\n"
    explanation += f"• HOW: {top_proto} protocol using {top_service} service\n"

    explanation += f"\n🚨 THREAT LEVEL: {threat_level}\n"

    # ======================
    # 🧠 DYNAMIC WHY ANALYSIS
    # ======================
    explanation += "\n🧠 WHY ANALYSIS:\n"

    attack_ratio = (attack_freq / total_attacks) * 100

    if attacker_hits > (attack_freq * 0.4):
        explanation += f"- IP {top_attacker} is responsible for a large portion of {top_attack.upper()} attacks ({attacker_hits}/{attack_freq}) → strong attacker indicator\n"
    else:
        explanation += f"- {top_attack.upper()} attacks are distributed across multiple IPs → coordinated activity\n"

    if target_hits > (attack_freq * 0.4):
        explanation += f"- Target {top_target} is heavily attacked ({target_hits} times) → likely primary victim\n"
    else:
        explanation += f"- Multiple targets are affected → scanning behavior\n"

    explanation += f"- {top_attack.upper()} accounts for {attack_ratio:.1f}% of total attacks → dominant threat type\n"
    explanation += f"- Majority attacks use {top_proto}, indicating protocol-level exploitation\n"

    if top_service not in ["-", "unknown"]:
        explanation += f"- Service '{top_service}' is frequently targeted → possible vulnerability\n"

    explanation += f"- Total attacks observed: {total_attacks} in this batch\n"

    # ======================
    # 🛡️ MULTIPLE REMEDIES
    # ======================
    explanation += "\n🛡️ RECOMMENDED ACTIONS:\n"
    for attack, _ in attack_count.most_common(2):
        attack_logs = [log for log in attacks if log["attack"] == attack]
        attack_src_ips = [log["src"] for log in attack_logs]
        attack_src_count = Counter(attack_src_ips)
        attack_top_ip, _ = attack_src_count.most_common(1)[0]
        explanation += f"- {get_remedy(attack, attack_top_ip)}\n"
    return explanation

# ============================
# SETTINGS
# ============================
BATCH_SIZE = 50
DELAY = 0.1

logs_batch = []
structured_batch = []
i = 0

print("🚀 SOC System Started...")
print("👉 Press CTRL + C to stop\n")

# ============================
# MAIN LOOP
# ============================
try:
    while True:

        row = df.iloc[i % len(df)]
        log_data = row_to_structured_log(row)

        print(f"[LOG {i+1}] {log_data['text']}")

        logs_batch.append(log_data["text"])
        structured_batch.append(log_data)

        i += 1

        if len(logs_batch) == BATCH_SIZE:

            print("\n🔍 Summarizing last 50 logs...\n")

            combined_logs = " ".join(logs_batch)
            combined_logs = "Network logs: " + combined_logs
            combined_logs = combined_logs[:1024]

            try:
                summary = summarizer(
                    combined_logs,
                    max_length=120,
                    min_length=60,
                    do_sample=False
                )

                print("🧠 SUMMARY:")
                print(summary[0]['summary_text'])

            except Exception as e:
                print("❌ Summarization error:", e)

            print(generate_explanation(structured_batch))

            print("\n" + "="*80 + "\n")

            logs_batch = []
            structured_batch = []

        time.sleep(DELAY)

except KeyboardInterrupt:
    print("\n\n🛑 SOC System Stopped")