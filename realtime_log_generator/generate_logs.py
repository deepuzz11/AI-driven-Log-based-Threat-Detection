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
TESTING_CSV = os.path.join(BASE_DIR, "data_processing", "datasets", "UNSW_NB15_testing-set.csv")

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
    
    def _generate_ip(self):
        """Generate a realistic IPv4 address."""
        # Mix of private and public IPs
        if random.random() < 0.4:
            # Private IP ranges
            return f"192.168.{random.randint(0, 255)}.{random.randint(1, 254)}"
        elif random.random() < 0.5:
            return f"10.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"
        else:
            # Public IP-like addresses
            return f"{random.randint(1, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"
    
    def _generate_port(self):
        """Generate a realistic port number."""
        if random.random() < 0.6:
            # Well-known ports
            known_ports = [80, 443, 22, 21, 25, 53, 110, 143, 8080, 8443, 3306, 5432, 27017]
            return random.choice(known_ports)
        else:
            # Ephemeral or high ports
            return random.randint(49152, 65535)
    
    def generate_log(self, attack_cat=None):
        """Generate a single synthetic network log entry in standard format."""
        if attack_cat is None:
            # Choose category based on distribution
            attack_cat = np.random.choice(
                list(ATTACK_CATEGORIES.keys()),
                p=list(ATTACK_CATEGORIES.values())
            )
        
        # Generate structured network event data
        log_entry = {}
        
        # Core network identifiers
        log_entry['timestamp'] = time.time()
        log_entry['src_ip'] = self._generate_ip()
        log_entry['dst_ip'] = self._generate_ip()
        log_entry['src_port'] = self._generate_port()
        log_entry['dst_port'] = self._generate_port()
        
        # Protocol and service info
        log_entry['proto'] = random.choice(PROTOCOLS)
        log_entry['service'] = random.choice(SERVICES)
        log_entry['state'] = random.choice(STATES)
        
        # Traffic characteristics
        for col in self.numeric_cols:
            if col not in log_entry:  # Skip if already generated
                log_entry[col] = self._generate_value(col, attack_cat)
        
        # Attack classification
        log_entry['attack_cat'] = attack_cat
        log_entry['label'] = 0 if attack_cat == 'Normal' else 1
        
        # Ensure consistency: certain field combinations should match attack types
        if attack_cat == 'DoS':
            log_entry['spkts'] = random.randint(100, 5000)
            log_entry['rate'] = random.uniform(10000, 1000000)
            log_entry['sload'] = random.uniform(1000000, 100000000)
        elif attack_cat == 'Reconnaissance':
            log_entry['proto'] = 'tcp'
            log_entry['state'] = random.choice(['REQ', 'INT'])
            log_entry['spkts'] = random.randint(1, 100)
        elif attack_cat == 'Backdoor':
            log_entry['proto'] = 'tcp'
            log_entry['state'] = 'CON'
            log_entry['dur'] = random.uniform(10, 300)
        
        return log_entry
    
    def generate_syslog_rfc5424(self, log_entry):
        """Convert log entry to RFC 5424 syslog format."""
        timestamp = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(log_entry.get('timestamp', time.time())))
        hostname = 'edge-fw-01'
        app_name = 'traffic-monitor'
        procid = random.randint(1000, 9999)
        msgid = 'ID' + str(random.randint(100, 999))
        
        src_ip = log_entry.get('src_ip', 'unknown')
        dst_ip = log_entry.get('dst_ip', 'unknown')
        src_port = log_entry.get('src_port', '0')
        dst_port = log_entry.get('dst_port', '0')
        proto = log_entry.get('proto', 'unknown').upper()
        
        msg = f"type=flow-log src={src_ip} spt={src_port} dst={dst_ip} dpt={dst_port} proto={proto} action=ALLOW"
        return f"<134>1 {timestamp} {hostname} {app_name} {procid} {msgid} - {msg}"

    def generate_vpc_flow_log(self, log_entry):
        """Convert log entry to AWS VPC Flow Log format."""
        # version account-id interface-id srcaddr dstaddr srcport dstport protocol packets bytes start end action log-status
        version = "2"
        account_id = "123456789012"
        interface_id = "eni-0a1b2c3d4e5f6g7h8"
        src_ip = log_entry.get('src_ip', 'unknown')
        dst_ip = log_entry.get('dst_ip', 'unknown')
        src_port = log_entry.get('src_port', '0')
        dst_port = log_entry.get('dst_port', '0')
        proto_num = "6" if log_entry.get('proto') == 'tcp' else "17" if log_entry.get('proto') == 'udp' else "1"
        pkts = log_entry.get('spkts', 0)
        bytes_val = log_entry.get('sbytes', 0)
        start_time = int(log_entry.get('timestamp', time.time()))
        end_time = start_time + random.randint(1, 10)
        action = "ACCEPT"
        log_status = "OK"
        
        return f"{version} {account_id} {interface_id} {src_ip} {dst_ip} {src_port} {dst_port} {proto_num} {pkts} {bytes_val} {start_time} {end_time} {action} {log_status}"

    def generate_firewall_log(self, log_entry):
        """Convert log entry to Cisco/Palo Alto style firewall event."""
        # Date Time: %ASA-6-302013: Built outbound TCP connection 123456 for outside:1.1.1.1/80 (1.1.1.1/80) to inside:10.0.0.1/1234 (10.0.0.1/1234)
        timestamp = time.strftime('%b %d %Y %H:%M:%S', time.localtime(log_entry.get('timestamp', time.time())))
        conn_id = random.randint(1000000, 9999999)
        src_ip = log_entry.get('src_ip', 'unknown')
        dst_ip = log_entry.get('dst_ip', 'unknown')
        src_port = log_entry.get('src_port', '0')
        dst_port = log_entry.get('dst_port', '0')
        proto = log_entry.get('proto', 'unknown').upper()
        
        return f"{timestamp}: %IDS-4-TRAFFIC: {proto} flow {conn_id} from {src_ip}:{src_port} to {dst_ip}:{dst_port} status=DETECTED packets={log_entry.get('spkts', 0)}"

    def generate_syslog_format(self, log_entry):
        """Convert log entry to standard syslog format."""
        timestamp = time.strftime('%b %d %H:%M:%S', time.localtime(log_entry.get('timestamp', time.time())))
        hostname = 'firewall'
        
        src_ip = log_entry.get('src_ip', 'unknown')
        dst_ip = log_entry.get('dst_ip', 'unknown')
        src_port = log_entry.get('src_port', '0')
        dst_port = log_entry.get('dst_port', '0')
        proto = log_entry.get('proto', 'unknown').upper()
        attack_cat = log_entry.get('attack_cat', 'Normal')
        
        # Construct syslog message
        syslog_msg = (
            f"{timestamp} {hostname} NETFLOW[{random.randint(1000, 9999)}]: "
            f"SRC={src_ip}:{src_port} DST={dst_ip}:{dst_port} PROTO={proto} "
            f"PACKETS={log_entry.get('spkts', 0)} BYTES={log_entry.get('sbytes', 0)} "
            f"CLASS={attack_cat} STATE={log_entry.get('state', 'UNK')}"
        )
        return syslog_msg

def build_log_string(row, generator):
    """Generate a random industry-standard log format representation."""
    choice = random.random()
    if choice < 0.25:
        return generator.generate_syslog_rfc5424(row)
    elif choice < 0.50:
        return generator.generate_vpc_flow_log(row)
    elif choice < 0.75:
        return generator.generate_firewall_log(row)
    else:
        return generator.generate_syslog_format(row)

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
                log_entry = build_log_string(row, generator)
            
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
                    bytes_sent = f"{int(safe_row.get('sbytes', 0))}B"
                    packets_sent = f"{int(safe_row.get('spkts', 0))}"
                    
                    if decision == "BLOCK":
                        status = f"{C_RED}{C_BOLD}[ 🛑 BLOCKED ]{C_RESET}"
                        pred_str = f"{C_RED}{pred}{C_RESET} ({confidence}%)"
                    else:
                        status = f"{C_GREEN}{C_BOLD}[ ✅ ALLOWED ]{C_RESET}"
                        pred_str = f"{C_GREEN}{pred}{C_RESET}"
                        
                    true_label = actual_label + " " * max(0, 12 - len(actual_label))
                    
                    print(f"{time_str} {status} {C_CYAN}Proto:{C_RESET} {proto} | {C_CYAN}Packets:{C_RESET} {packets_sent:<6} | {C_CYAN}Size:{C_RESET} {bytes_sent:<8} | {C_BOLD}True:{C_RESET} {true_label} ➔  {C_BOLD}Pred:{C_RESET} {pred_str}")
                    
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
