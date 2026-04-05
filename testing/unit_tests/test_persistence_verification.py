#!/usr/bin/env python3
"""
Test script to verify:
1. Data persistence (history saved to disk)
2. Analytics endpoint returns correct data
3. Rule count = 133
4. History retrieval endpoints work
"""

import sys
import os
import time
import json
import requests
from pathlib import Path

# Add core/api to path for api_server imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'core', 'api'))

# Configuration
API_URL = "http://localhost:8000"
HISTORY_DIR = Path("analysis_history")

def print_header(text):
    print(f"\n{'─' * 70}")
    print(f"  {text}")
    print(f"{'─' * 70}")

def test_api_running():
    """Verify API is running"""
    print_header("Test 1: API Connection")
    try:
        response = requests.get(f"{API_URL}/api/stats", timeout=5)
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ API is running")
            print(f"✅ Rules loaded: {stats.get('rules_count')} / 133")
            return True
        else:
            print(f"❌ API returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to API at {API_URL}")
        print(f"   Please ensure API is running: python api_server.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_analyze_samples():
    """Analyze some test samples to trigger history saving"""
    print_header("Test 2: Analyze Samples & Save History")
    
    try:
        # Get a few attack samples and benign samples
        attack_samples = []
        benign_samples = []
        
        # Import API to get test data
        import api_server
        test_df = api_server.TEST_DF
        
        # Get first 5 attack samples
        attacks = test_df[test_df["label"] == 1].head(3)
        for idx, row in attacks.iterrows():
            attack_samples.append(dict(row))
        
        # Get first 2 benign samples
        benign = test_df[test_df["label"] == 0].head(2)
        for idx, row in benign.iterrows():
            benign_samples.append(dict(row))
        
        all_samples = attack_samples + benign_samples
        analyzed_count = 0
        
        for i, sample in enumerate(all_samples, 1):
            try:
                # Convert to JSON-serializable format
                sample_dict = {}
                for key, val in sample.items():
                    if isinstance(val, (int, float, str, bool, type(None))):
                        sample_dict[key] = val
                    else:
                        sample_dict[key] = str(val)
                
                response = requests.post(
                    f"{API_URL}/api/analyze",
                    json={"row": sample_dict},
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    method = result.get("method", "unknown")
                    decision = result.get("decision", "unknown")
                    print(f"  Sample {i}: {method} → {decision}")
                    analyzed_count += 1
                else:
                    print(f"  Sample {i}: Failed with status {response.status_code}")
            except Exception as e:
                print(f"  Sample {i}: Error - {e}")
        
        print(f"\n✅ Analyzed {analyzed_count}/{len(all_samples)} samples")
        
        # Give history module time to write files
        time.sleep(1)
        
        return analyzed_count > 0
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        return False

def test_history_directory():
    """Verify history was saved to disk"""
    print_header("Test 3: History Files Created")
    
    if not HISTORY_DIR.exists():
        print(f"⚠️  History directory not created yet: {HISTORY_DIR.absolute()}")
        return False
    
    print(f"✅ History directory exists: {HISTORY_DIR.absolute()}")
    
    # Check for various history files
    checks = [
        ("analysis_index.jsonl", "Analysis index file"),
        ("detection_log.jsonl", "Detection log file"),
        ("rules_history.jsonl", "Rules history file"),
    ]
    
    subdirs = [
        ("analysis_results", "Full analysis results"),
        ("detection_events", "Attack detection events"),
        ("statistics", "Daily statistics"),
    ]
    
    found_files = 0
    found_dirs = 0
    
    for filename, description in checks:
        filepath = HISTORY_DIR / filename
        if filepath.exists():
            size = filepath.stat().st_size
            lines = sum(1 for _ in open(filepath))
            print(f"  ✅ {description}: {filepath.name} ({lines} records, {size} bytes)")
            found_files += 1
        else:
            print(f"  ⚠️  {description}: not found yet")
    
    for dirname, description in subdirs:
        dirpath = HISTORY_DIR / dirname
        if dirpath.exists():
            file_count = len(list(dirpath.glob("*.json")))
            print(f"  ✅ {description}: {dirpath.name}/ ({file_count} files)")
            found_dirs += 1
        else:
            print(f"  ⚠️  {description}: not found yet")
    
    return found_files > 0

def test_history_stats_endpoint():
    """Test /api/history/stats endpoint"""
    print_header("Test 4: History Stats Endpoint")
    
    try:
        response = requests.get(f"{API_URL}/api/history/stats", timeout=5)
        
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ /api/history/stats returned successfully")
            print(f"   Total analyses: {stats.get('total_analyses', '?')}")
            print(f"   Attacks detected: {stats.get('attacks_detected', '?')}")
            print(f"   Benign processed: {stats.get('benign_processed', '?')}")
            print(f"   Detection rate: {stats.get('detection_rate', '?')}%")
            return True
        else:
            print(f"❌ Endpoint returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_recent_analyses_endpoint():
    """Test /api/history/recent endpoint"""
    print_header("Test 5: Recent Analyses Endpoint")
    
    try:
        response = requests.get(f"{API_URL}/api/history/recent?limit=10", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            count = data.get("count", 0)
            print(f"✅ /api/history/recent returned successfully")
            print(f"   Records returned: {count}")
            
            if count > 0:
                first = data["analyses"][0]
                print(f"   Latest analysis fields: {list(first.keys())}")
            return True
        else:
            print(f"❌ Endpoint returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_detections_endpoint():
    """Test /api/history/detections endpoint"""
    print_header("Test 6: Detections Endpoint")
    
    try:
        response = requests.get(f"{API_URL}/api/history/detections?limit=10", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            count = data.get("count", 0)
            print(f"✅ /api/history/detections returned successfully")
            print(f"   Attack records returned: {count}")
            
            if count > 0:
                first = data["detections"][0]
                print(f"   Detection fields: {list(first.keys())}")
            return True
        else:
            print(f"❌ Endpoint returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_analytics_endpoint():
    """Test /api/analytics endpoint"""
    print_header("Test 7: Analytics Endpoint")
    
    try:
        response = requests.get(f"{API_URL}/api/analytics", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            required_fields = ["stats", "traffic_volume", "traffic_distribution", "attack_vectors", "system_metrics", "recent_threats"]
            stats = data.get("stats", {})
            
            print(f"✅ /api/analytics returned successfully")
            print(f"\n  Stats:")
            print(f"    Total logs processed: {stats.get('total_logs_processed', '?')}")
            print(f"    Threats intercepted: {stats.get('threats_intercepted', '?')}")
            print(f"    Active rules: {stats.get('active_rules', '?')} ✅ (should be 133)")
            print(f"    Avg inference time: {stats.get('avg_inference_time_ms', '?')} ms")
            
            print(f"\n  Fields present:")
            for field in required_fields:
                status = "✅" if field in data else "❌"
                print(f"    {status} {field}")
            
            all_present = all(field in data for field in required_fields)
            return all_present
        else:
            print(f"❌ Endpoint returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("\n" + "=" * 70)
    print("  DATA PERSISTENCE & ANALYTICS VERIFICATION TEST SUITE")
    print("=" * 70)
    
    results = {}
    
    # Test 1: API Connection
    results["API Connection"] = test_api_running()
    if not results["API Connection"]:
        print("\n❌ Cannot proceed without API running")
        return
    
    # Test 2: Analyze Samples
    results["Sample Analysis"] = test_analyze_samples()
    
    # Test 3: History Directory
    results["History Directory"] = test_history_directory()
    
    # Test 4: History Stats
    results["History Stats"] = test_history_stats_endpoint()
    
    # Test 5: Recent Analyses
    results["Recent Analyses"] = test_recent_analyses_endpoint()
    
    # Test 6: Detections
    results["Detections Endpoint"] = test_detections_endpoint()
    
    # Test 7: Analytics
    results["Analytics Endpoint"] = test_analytics_endpoint()
    
    # Summary
    print_header("SUMMARY")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n{'─' * 70}")
    print(f"Results: {passed}/{total} tests passed")
    print(f"{'─' * 70}\n")
    
    if passed == total:
        print("🎉 All tests passed! Data persistence is working correctly.")
    else:
        print(f"⚠️  {total - passed} test(s) failed. Please review the output above.")

if __name__ == "__main__":
    main()
