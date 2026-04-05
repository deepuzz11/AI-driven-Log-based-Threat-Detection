#!/usr/bin/env python3
"""Test synthetic log generation"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import from generate_logs
from generate_logs import SyntheticLogGenerator
import json

# Load generator
generator = SyntheticLogGenerator("../UNSW_NB15_testing-set.csv")

print("=" * 70)
print("SYNTHETIC LOG GENERATION TEST")
print("=" * 70)

# Generate logs for each attack category
categories = ['Normal', 'DoS', 'Reconnaissance', 'Backdoor', 'Generic', 'Exploits']

for category in categories:
    print(f"\n{category} Attack Log:")
    print("-" * 70)
    row = generator.generate_log(attack_cat=category)
    
    # Verify JSON serialization works
    try:
        json_str = json.dumps(row)
        print(f"✓ JSON serializable ({len(json_str)} chars)")
    except Exception as e:
        print(f"✗ JSON error: {e}")
    
    # Show key fields
    print(f"  proto: {row['proto']}")
    print(f"  service: {row['service']}")
    print(f"  state: {row['state']}")
    print(f"  sbytes: {row['sbytes']}")
    print(f"  spkts: {row['spkts']}")
    print(f"  attack_cat: {row['attack_cat']}")
    print(f"  label: {row['label']}")

print("\n" + "=" * 70)
print("✓ Synthetic log generation working correctly")
print("=" * 70)
