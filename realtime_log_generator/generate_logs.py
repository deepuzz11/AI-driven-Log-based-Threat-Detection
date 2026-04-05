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

PROTOCOLS = ['tcp', 'udp', 'icmp', 'igmp', 'ospf', 'arp', 'gre']
SERVICES = ['-', 'http', 'ftp', 'ftp-data', 'smtp', 'ssh', 'dns', 'dhcp']
STATES = ['INT', 'FIN', 'REQ', 'ACC', 'CON', 'CLO', 'ECO']
ATTACK_CATEGORIES = {
    'Normal': 0.450,
    'Generic': 0.230,
    'Exploits': 0.135,
    'Fuzzers': 0.070,
    'DoS': 0.050,
    'Reconnaissance': 0.040,
    'Analysis': 0.010,
    'Backdoor': 0.010,
    'Shellcode': 0.003,
    'Worms': 0.002,
}

class SyntheticLogGenerator:
    """Generate synthetic network logs matching UNSW-NB15 dataset characteristics."""
    
    def __init__(self, csv_path):
        """Initialize with dataset statistics."""
        df = pd.read_csv(csv_path)
        self.df_stats = self._compute_stats(df)
        self.numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        self.categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        self.all_cols = df.columns.tolist()
        
    def _compute_stats(self, df):
        """Compute statistics for each numeric column."""
        stats = {}
        for col in df.select_dtypes(include=[np.number]).columns:
            stats[col] = {
                'mean': float(df[col].mean()),
                'std': float(df[col].std()),
                'min': float(df[col].min()),
                'max': float(df[col].max()),
                'q25': float(df[col].quantile(0.25)),
                'q75': float(df[col].quantile(0.75)),
            }
        return stats
    
    def _generate_value(self, col, attack_type='Normal'):
        """Generate a realistic value for a column."""
        if col not in self.df_stats:
            return 0
        
        stats = self.df_stats[col]
        
        # Adjust distributions based on attack type
        if attack_type != 'Normal':
            # Attack logs typically have more variation and extreme values
            mean_mult = random.uniform(1.2, 2.5) if col in ['sbytes', 'dbytes', 'spkts', 'dpkts'] else 1.0
            std_mult = random.uniform(1.5, 3.0) if col in ['sload', 'dload', 'rate'] else 1.0
        else:
            mean_mult = 1.0
            std_mult = 1.0
        
        # Generate value using normal distribution, clipped to realistic bounds
        value = np.random.normal(
            stats['mean'] * mean_mult,
            stats['std'] * std_mult
        )
        value = max(stats['min'], min(value, stats['max'] * 2))
        
        # Return as int or float
        if 'duration' not in col.lower() and col in ['dur', 'rate', 'sload', 'dload', 'sinpkt', 'dinpkt', 
                                                       'sjit', 'djit', 'tcprtt', 'synack', 'ackdat']:
            return float(value)
        else:
            return int(value)
    
    def generate_log(self, attack_cat=None):
        """Generate a single synthetic log entry."""
        if attack_cat is None:
            # Choose category based on distribution
            attack_cat = np.random.choice(
                list(ATTACK_CATEGORIES.keys()),
                p=list(ATTACK_CATEGORIES.values())
            )
        
        log_entry = {}
        
        # Generate numeric fields
        for col in self.numeric_cols:
            if col == 'id':
                # Use timestamp-based ID for uniqueness
                log_entry[col] = int(time.time() * 1000000) % 1000000
            elif col == 'label':
                # Label: 0 = Normal, 1 = Attack
                log_entry[col] = 0 if attack_cat == 'Normal' else 1
            else:
                log_entry[col] = self._generate_value(col, attack_cat)
        
        # Generate categorical fields
        log_entry['proto'] = random.choice(PROTOCOLS)
        log_entry['service'] = random.choice(SERVICES)
        log_entry['state'] = random.choice(STATES)
        log_entry['attack_cat'] = attack_cat
        
        # Ensure consistency: certain field combinations should match attack types
        if attack_cat == 'DoS':
            # DoS attacks typically have high packet rates
            log_entry['spkts'] = random.randint(100, 5000)
            log_entry['rate'] = random.uniform(10000, 1000000)
            log_entry['sload'] = random.uniform(1000000, 100000000)
        elif attack_cat == 'Reconnaissance':
            # Recon often involves TCP connections to many ports
            log_entry['proto'] = 'tcp'
            log_entry['state'] = random.choice(['REQ', 'INT'])
            log_entry['spkts'] = random.randint(1, 100)
        elif attack_cat == 'Backdoor':
            # Backdoors typically have persistent connections
            log_entry['proto'] = 'tcp'
            log_entry['state'] = 'CON'
            log_entry['dur'] = random.uniform(10, 300)
        
        return log_entry

def build_log_string(row):
    """Fallback text representation matching the API format."""
    return " | ".join(f"{k}={row.get(k, '')}" for k in sorted(row.keys()))

def generate_logs(output_type, output_target, eps, api_url):
    print(f"[*] Loading dataset statistics from {TESTING_CSV}...")
    try:
        generator = SyntheticLogGenerator(TESTING_CSV)
    except FileNotFoundError:
        print(f"[!] Error: Could not find dataset at {TESTING_CSV}")
        return
    
    print(f"[*] Initialized synthetic log generator with dataset characteristics.")
    
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
            # Generate synthetic log based on dataset characteristics
            row = generator.generate_log()
            
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
    parser.add_argument("--api-url", default="http://localhost:8000/api/analyze",
                        help="URL of the log analyzer API (used only if --type is 'api').")
    
    args = parser.parse_args()
    
    generate_logs(args.type, args.output, args.eps, args.api_url)
