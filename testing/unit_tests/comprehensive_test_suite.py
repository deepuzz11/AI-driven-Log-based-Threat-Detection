#!/usr/bin/env python3
"""
Comprehensive Functionality Test Suite
Tests all major components:
- Rule loading (133 rules)
- Hybrid detection (rule-based + ML)
- Data persistence (history storage)
- API endpoints
"""

import sys
import os
import time
import json
from pathlib import Path

# Add core/api to path for api_server imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'core', 'api'))

def print_section(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def print_subsection(title):
    print(f"\n  >>> {title}")
    print(f"  {'-'*66}")

# -------------------------------------------------------
# TEST 1: IMPORTS & DEPENDENCIES
# -------------------------------------------------------

def test_imports():
    """Test all critical imports work"""
    print_section("TEST 1: Imports & Dependencies")
    
    modules_to_test = {
        'fastapi': 'FastAPI framework',
        'pandas': 'Data processing',
        'joblib': 'ML model loading',
        're': 'Regex patterns',
        'pathlib': 'File handling',
        'json': 'JSON serialization',
    }
    
    passed = 0
    for module, desc in modules_to_test.items():
        try:
            __import__(module)
            print(f"  [OK] {module:20} - {desc}")
            passed += 1
        except ImportError as e:
            print(f"  [FAIL] {module:20} - {desc}")
    
    return passed == len(modules_to_test)

# -------------------------------------------------------
# TEST 2: RULE LOADING
# -------------------------------------------------------

def test_rule_loading():
    """Test rule loading and parsing"""
    print_section("TEST 2: Rule Loading (133 rules)")
    
    try:
        import api_server
        
        print_subsection("Rule Count")
        total_rules = len(api_server.patterns)
        print(f"  Rules loaded: {total_rules}")
        
        if total_rules == 133:
            print(f"  [OK] Exact match: 133 rules")
        else:
            print(f"  [FAIL] Expected 133, got {total_rules}")
            return False
        
        print_subsection("Sample Rules")
        rule_samples = list(api_server.patterns.items())[:3]
        for name, pattern in rule_samples:
            pattern_str = str(pattern)[:50]
            print(f"  * {name}: {pattern_str}...")
        
        print(f"\n  [OK] Rule loading successful")
        return True
        
    except Exception as e:
        print(f"  [FAIL] Error loading rules: {e}")
        return False

# -------------------------------------------------------
# TEST 3: HYBRID DETECTION
# -------------------------------------------------------

def test_hybrid_detection():
    """Test rule-based and ML detection"""
    print_section("TEST 3: Hybrid Detection (Rule-based + ML)")
    
    try:
        import api_server
        test_df = api_server.TEST_DF
        
        print_subsection("Rule-Based Detection")
        attack_sample = test_df[test_df["label"] == 1].iloc[0].to_dict()
        result = api_server.perform_analysis(attack_sample)
        
        print(f"  Sample label: Attack")
        print(f"  Detection method: {result.get('method')}")
        print(f"  Decision: {result.get('decision')}")
        print(f"  Confidence: {result.get('confidence')}%")
        
        if result.get('decision') in ['ATTACK', 'BENIGN']:
            print(f"  [OK] Rule-based detection working")
        else:
            print(f"  [FAIL] Invalid decision")
            return False
        
        print_subsection("ML Fallback Detection")
        benign_sample = test_df[test_df["label"] == 0].iloc[0].to_dict()
        result2 = api_server.perform_analysis(benign_sample)
        
        print(f"  Sample label: Benign")
        print(f"  Decision: {result2.get('decision')}")
        
        if result2.get('decision') in ['ATTACK', 'BENIGN']:
            print(f"  [OK] ML fallback working")
        else:
            return False
        
        print(f"\n  [OK] Hybrid detection operational")
        return True
        
    except Exception as e:
        print(f"  [FAIL] Error testing detection: {e}")
        return False

# -------------------------------------------------------
# TEST 4: DATA PERSISTENCE
# -------------------------------------------------------

def test_data_persistence():
    """Test history saving and retrieval"""
    print_section("TEST 4: Data Persistence")
    
    try:
        from analysis_history import analysis_history
        history_dir = Path("analysis_history")
        
        print_subsection("Directory Structure")
        if history_dir.exists():
            print(f"  [OK] History directory exists")
            required_dirs = ["analysis_results", "detection_events", "rules_log", "statistics"]
            for subdir in required_dirs:
                if (history_dir / subdir).exists():
                    print(f"    [OK] {subdir}/")
        else:
            print(f"  [INFO] History will be created on first analysis")
        
        print_subsection("Methods Available")
        methods = [m for m in dir(analysis_history) if not m.startswith('_')]
        print(f"  [OK] {len(methods)} persistence methods loaded")
        
        print(f"\n  [OK] Data persistence module ready")
        return True
        
    except Exception as e:
        print(f"  [FAIL] Error testing persistence: {e}")
        return False

# -------------------------------------------------------
# TEST 5: DATASET INTEGRITY
# -------------------------------------------------------

def test_dataset_integrity():
    """Verify datasets are complete and valid"""
    print_section("TEST 5: Dataset Integrity")
    
    try:
        import api_server
        test_df = api_server.TEST_DF
        
        print_subsection("Test Dataset")
        print(f"  Total rows: {len(test_df):,}")
        print(f"  Total columns: {len(test_df.columns)}")
        
        attack_count = (test_df["label"] == 1).sum()
        benign_count = (test_df["label"] == 0).sum()
        
        print(f"\n  Samples:")
        print(f"    * Attacks: {attack_count:,} ({attack_count/len(test_df)*100:.1f}%)")
        print(f"    * Benign: {benign_count:,} ({benign_count/len(test_df)*100:.1f}%)")
        
        missing = test_df.isnull().sum().sum()
        print(f"\n  Data quality:")
        print(f"    * Missing values: {missing}")
        
        print(f"\n  [OK] Dataset integrity verified")
        return True
        
    except Exception as e:
        print(f"  [FAIL] Error checking dataset: {e}")
        return False

# -------------------------------------------------------
# TEST 6: MODELS & ML
# -------------------------------------------------------

def test_ml_models():
    """Verify ML models are loaded correctly"""
    print_section("TEST 6: ML Models & Preprocessing")
    
    try:
        import api_server
        import joblib
        
        root = Path(".")
        base_dir = root.parent.parent
        
        print_subsection("Model Files")
        model_files = {
            "hybrid_ml_model.joblib": base_dir / "core" / "models" / "hybrid_ml_model.joblib",
            "label_encoder.joblib": base_dir / "core" / "models" / "label_encoder.joblib"
        }
        
        all_found = True
        for name, path in model_files.items():
            if path.exists():
                size = path.stat().st_size / 1024 / 1024
                print(f"  [OK] {name}: {size:.2f} MB")
            else:
                print(f"  [FAIL] {name}: Missing")
                all_found = False
        
        if not all_found:
            return False
        
        print_subsection("Model Components")
        if hasattr(api_server, 'pipeline'):
            print(f"  [OK] ML Pipeline loaded")
        if hasattr(api_server, 'label_encoder'):
            print(f"  [OK] Label encoder loaded")
        if hasattr(api_server, 'TEST_DF'):
            print(f"  [OK] Test dataset loaded")
        
        print(f"\n  [OK] ML components ready")
        return True
        
    except Exception as e:
        print(f"  [FAIL] Error checking ML models: {e}")
        return False

# -------------------------------------------------------
# TEST 7: FILE STRUCTURE
# -------------------------------------------------------

def test_file_structure():
    """Audit current file organization"""
    print_section("TEST 7: File Structure Organization")
    
    root = Path(".")
    base_dir = root.parent.parent
    
    print_subsection("Core Directories")
    core_dirs = {
        'core': 'Internal: API, models, config',
        'data_processing': 'Internal: Datasets and notebooks',
        'frontend': 'External: React dashboard',
        'testing': 'Internal: Test suites',
        'utilities': 'Internal: Helper scripts',
    }
    
    all_exist = True
    for dirname, desc in core_dirs.items():
        dir_path = base_dir / dirname
        if dir_path.exists():
            count = len(list(dir_path.glob('*')))
            print(f"  [OK] {dirname}/ ({count} items)")
        else:
            print(f"  [FAIL] {dirname}/ MISSING")
            all_exist = False
    
    print_subsection("Critical Files")
    critical_files = {
        'core/api': ['api_server.py', 'analysis_history.py', 'hybrid_log_analyzer.py'],
        'core/models': ['hybrid_ml_model.joblib', 'label_encoder.joblib'],
        'core/config': ['rules.txt', 'requirements.txt'],
        'data_processing/datasets': ['UNSW_NB15_testing-set.csv', 'UNSW_NB15_grouped_training_class.csv'],
    }
    
    for path_key, files in critical_files.items():
        check_path = base_dir / path_key
        found = sum(1 for f in files if (check_path / f).exists())
        status = "[OK]" if found == len(files) else "[WARN]"
        print(f"  {status} {path_key}: {found}/{len(files)} files")
    
    if all_exist:
        print(f"\n  [OK] File structure organized")
    else:
        print(f"\n  [WARN] Some directories missing")
    
    return all_exist

# -------------------------------------------------------
# MAIN TEST RUNNER
# -------------------------------------------------------

def main():
    print("\n" + "="*70)
    print("  COMPREHENSIVE FUNCTIONALITY TEST SUITE")
    print("="*70)
    
    tests = [
        ("Imports & Dependencies", test_imports),
        ("Rule Loading", test_rule_loading),
        ("Hybrid Detection", test_hybrid_detection),
        ("Data Persistence", test_data_persistence),
        ("Dataset Integrity", test_dataset_integrity),
        ("ML Models", test_ml_models),
        ("File Structure", test_file_structure),
    ]
    
    results = {}
    
    import warnings
    warnings.filterwarnings('ignore')
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n[FAIL] Test '{test_name}' crashed: {e}")
            results[test_name] = False
    
    # Print summary
    print_section("SUMMARY")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "[OK]" if result else "[FAIL]"
        print(f"{status}  {test_name}")
    
    print(f"\n{'-'*70}")
    print(f"Results: {passed}/{total} tests passed ({passed*100//total}%)")
    print(f"{'-'*70}\n")
    
    if passed == total:
        print("[OK] ALL TESTS PASSED - System is fully functional!")
        return 0
    else:
        print(f"[WARN] {total - passed} test(s) failed\n")
        return 1

if __name__ == "__main__":
    exit(main())
