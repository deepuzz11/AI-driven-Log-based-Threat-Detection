import os
import time
import json
import random
import argparse
import pandas as pd
import numpy as np
import requests

# Set path relative to the script location (parent project root directory)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTING_CSV = os.path.join(BASE_DIR, "UNSW_NB15_testing-set.csv")

def build_log_string(row):
    """Fallback text representation matching the API format."""
    return " | ".join(f"{k}={row.get(k, '')}" for k in sorted(row.keys()))

def generate_logs(output_type, output_target, eps, api_url):
    print(f"[*] Loading dataset from {TESTING_CSV}...")
    try:
        df = pd.read_csv(TESTING_CSV)
    except FileNotFoundError:
        print(f"[!] Error: Could not find dataset at {TESTING_CSV}")
        return
    
    print(f"[*] Loaded {len(df)} rows.")
    
    # ANSI Colors
    C_BLUE = '\033[94m'
    C_CYAN = '\033[96m'
    C_GREEN = '\033[92m'
    C_RED = '\033[91m'
    C_YELLOW = '\033[93m'
    C_RESET = '\033[0m'
    C_BOLD = '\033[1m'

    print(f"\n{C_CYAN}{C_BOLD}======================================================{C_RESET}")
    print(f"{C_CYAN}{C_BOLD}   🛡️  NexusGuard AI - Active Edge Monitor  🛡️{C_RESET}")
    print(f"{C_CYAN}{C_BOLD}======================================================{C_RESET}")
    print(f" {C_BOLD}Target Pipeline:{C_RESET} {api_url}")
    print(f" {C_BOLD}Stream Output:{C_RESET}   {output_target}")
    print(f" {C_BOLD}Event Rate:{C_RESET}      {eps} EPS")
    print(f" {C_BOLD}Status:{C_RESET}          {C_GREEN}ONLINE AND SCANNING{C_RESET}")
    print(f"{C_CYAN}------------------------------------------------------{C_RESET}")
    print(f"{C_YELLOW}[*] Press Ctrl+C to gracefully stop the live feed.{C_RESET}\n")
    
    try:
        while True:
            # Randomly sample a row
            row = df.sample(1).iloc[0].to_dict()
            
            # Convert numpy types to native Python types for clean JSON serialization
            row = {k: (int(v) if isinstance(v, (np.integer, int)) else  # type: ignore
                       float(v) if isinstance(v, (np.floating, float)) else  # type: ignore
                       str(v) if pd.isna(v) else v)
                   for k, v in row.items()}
            
            log_entry = None
            if output_type == "json":
                log_entry = json.dumps(row)
            elif output_type == "text":
                log_entry = build_log_string(row)
            
            # 1. First, Always write to the log file so the SSE Stream still picks it up for the frontend
            if output_target != "stdout":
                with open(output_target, "a", encoding="utf-8") as f:
                    f.write(json.dumps(row) + "\n")
            
            # 2. Then, hit the API directly so the CLI tool acts as an active scanner for the user
            try:
                res = requests.post(api_url, json={"row": row}, timeout=5)
                safe_row = dict(row)
                actual_label = str(safe_row.get("attack_cat", "Benign"))
                
                if res.status_code == 200:
                    api_data = res.json()
                    pred = api_data.get('prediction', 'Unknown')
                    decision = api_data.get('decision', 'PASS')
                    confidence = api_data.get('confidence', 100)
                    
                    time_str = f"{C_BLUE}[{time.strftime('%H:%M:%S')}]{C_RESET}"
                    proto = str(safe_row.get('proto', 'UNK')).upper()
                    proto = proto + " " * max(0, 4 - len(proto))
                    bytes_sent = str(safe_row.get('sbytes', 0)) + "B"
                    
                    if decision == "BLOCK":
                        status = f"{C_RED}{C_BOLD}[ 🛑 BLOCKED ]{C_RESET}"
                        pred_str = f"{C_RED}{pred}{C_RESET} ({confidence}%)"
                    else:
                        status = f"{C_GREEN}{C_BOLD}[ ✅ ALLOWED ]{C_RESET}"
                        pred_str = f"{C_GREEN}{pred}{C_RESET}"
                        
                    true_label = actual_label + " " * max(0, 12 - len(actual_label))
                    
                    print(f"{time_str} {status} {C_CYAN}Proto:{C_RESET} {proto} | {C_CYAN}Size:{C_RESET} {bytes_sent:<6} | {C_BOLD}True:{C_RESET} {true_label} ➔  {C_BOLD}Pred:{C_RESET} {pred_str}")
                    
                else:
                    print(f"{C_YELLOW}[{time.strftime('%H:%M:%S')}] API Error -> Status {res.status_code}{C_RESET}")
                    
            except requests.exceptions.RequestException as e:
                print(f"{C_RED}[{time.strftime('%H:%M:%S')}] Failed to connect to NexusGuard Engine (API down?){C_RESET}")
            
            # Sleep to strictly match Events Per Second (EPS)
            # Add small random jitter (+- 20%) to make streaming look more organic
            base_sleep = 1.0 / eps
            jitter = random.uniform(-base_sleep * 0.2, base_sleep * 0.2)
            time.sleep(max(0.01, base_sleep + jitter))
            
    except KeyboardInterrupt:
        print("\n[*] Stopping real-time log generation gracefully.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Real-time network log generator for hybrid pipeline")
    parser.add_argument("--type", choices=["json", "text", "api"], default="json", 
                        help="Format of the output logs: json (default), text, or direct API push.")
    parser.add_argument("--output", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "realtime_traffic.log"), 
                        help="Output target destination: 'stdout' or a file path. (Default: realtime_log_generator/realtime_traffic.log)")
    parser.add_argument("--eps", type=float, default=2.0, 
                        help="Events Per Second (EPS) target rate. (Default: 2.0)")
    parser.add_argument("--api-url", default="http://localhost:5000/api/analyze",
                        help="URL of the log analyzer API (used only if --type is 'api').")
    
    args = parser.parse_args()
    
    generate_logs(args.type, args.output, args.eps, args.api_url)
