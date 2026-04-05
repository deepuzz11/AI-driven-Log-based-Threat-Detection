#!/usr/bin/env python3
"""Quick test of synthetic log stream (5 logs only)"""
import sys
import os
import json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from generate_logs import SyntheticLogGenerator

# Initialize generator
print("Initializing synthetic log generator...")
generator = SyntheticLogGenerator("../UNSW_NB15_testing-set.csv")

print("\nGenerating 5 sample logs...\n")

for i in range(5):
    row = generator.generate_log()
    
    # Test JSON serialization
    json_line = json.dumps(row)
    
    # Show summary
    cat = row.get('attack_cat', 'Unknown')
    proto = row.get('proto', 'UNK')
    sbytes = row.get('sbytes', 0)
    label = row.get('label', 0)
    
    status = "ATTACK" if label == 1 else "CLEAN"
    print(f"[{i+1}] {proto.upper():<5} | {cat:<15} | {sbytes:>8} bytes | [{status}]")

print("\n✓ All logs generated and serializable")
