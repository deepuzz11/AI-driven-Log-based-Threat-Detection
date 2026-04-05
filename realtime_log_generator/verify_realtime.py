#!/usr/bin/env python3
"""
Quick verification script to test the integrated real-time correlation system.
Run this to ensure all components are working correctly.
"""

import requests
import json
import time
import sys

API_BASE = "http://localhost:8000/api"

def test_api_endpoints():
    """Test all new API endpoints"""
    print("\n" + "="*60)
    print("Testing Real-Time Correlation API Endpoints")
    print("="*60 + "\n")
    
    # Test 1: Stats endpoint
    print("[TEST 1] Checking API stats...")
    try:
        r = requests.get(f"{API_BASE}/stats", timeout=5)
        if r.status_code == 200:
            stats = r.json()
            print(f"✓ API is running")
            print(f"  - Total logs: {stats['total']}")
            print(f"  - Rules loaded: {stats['rules_count']}")
        else:
            print(f"✗ Stats endpoint failed: {r.status_code}")
            return False
    except Exception as e:
        print(f"✗ Could not reach API: {e}")
        return False
    
    # Test 2: Start real-time generation
    print("\n[TEST 2] Starting real-time log generation...")
    try:
        r = requests.post(f"{API_BASE}/realtime/start?eps=5", timeout=5)
        if r.status_code == 200:
            result = r.json()
            print(f"✓ Real-time generation started")
            print(f"  - Event Rate: {result.get('event_rate', 'N/A')} EPS")
            print(f"  - Status: {result.get('status')}")
        else:
            print(f"✗ Failed to start: {r.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False
    
    # Test 3: Let it generate some logs
    print("\n[TEST 3] Waiting for logs to generate...")
    time.sleep(3)
    print("✓ Logs being generated (check /realtime/realtime_traffic.log)")
    
    # Test 4: Test correlation analysis
    print("\n[TEST 4] Running real-time correlation analysis...")
    try:
        r = requests.post(f"{API_BASE}/realtime/correlate-stream?window_size=5", timeout=10)
        if r.status_code == 200:
            data = r.json()
            print(f"✓ Correlation analysis completed")
            print(f"  - Logs analyzed: {len(data['sequence_logs'])}")
            print(f"  - Threat level: {data['explainability']['threat_level']}")
            print(f"  - Threats detected: {data['explainability']['attack_count']}")
            print(f"  - Auto-learned rules: {len(data.get('auto_learned_rules', []))}")
            
            if data.get('auto_learned_rules'):
                print(f"\n  Auto-Learned Rules:")
                for rule in data['auto_learned_rules'][:3]:
                    print(f"    - {rule['rule_name']} ({rule['source']})")
        else:
            print(f"✗ Correlation analysis failed: {r.status_code}")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 5: Stop generation
    print("\n[TEST 5] Stopping real-time generation...")
    try:
        r = requests.post(f"{API_BASE}/realtime/stop", timeout=5)
        if r.status_code == 200:
            print(f"✓ Real-time generation stopped")
        else:
            print(f"✗ Failed to stop: {r.status_code}")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    return True

def main():
    print("\n" + "="*60)
    print("Real-Time Correlation System - Verification Script")
    print("="*60)
    
    if test_api_endpoints():
        print("\n" + "="*60)
        print("✓ All tests passed! System is ready.")
        print("="*60)
        print("\nNext Steps:")
        print("1. Open browser to http://localhost:3000")
        print("2. Navigate to 'Real-Time Correlation' in sidebar")
        print("3. Click 'Start Streaming'")
        print("4. Watch logs generate and rules auto-learn")
        print("5. Click 'Analyze Correlation' to see insights")
        return 0
    else:
        print("\n" + "="*60)
        print("✗ Tests failed. Check your setup.")
        print("="*60)
        return 1

if __name__ == "__main__":
    sys.exit(main())
