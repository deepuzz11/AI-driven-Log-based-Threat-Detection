#!/usr/bin/env python3
"""
Master Test Runner - Runs all test suites in the tests/ directory
Discovers and executes all test modules to verify system functionality
"""

import sys
import os
import subprocess
from pathlib import Path

def print_header(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def run_test(test_script):
    """Run a single test script and return result"""
    print(f"Running: {test_script.name}")
    print(f"{'─'*70}")
    
    try:
        result = subprocess.run(
            [sys.executable, str(test_script)],
            capture_output=False,
            timeout=300
        )
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print(f"❌ Test timeout after 5 minutes")
        return False
    except Exception as e:
        print(f"❌ Error running test: {e}")
        return False

def main():
    print_header("MASTER TEST RUNNER - AI-driven Threat Detection System")
    
    # Get list of test files
    tests_dir = Path("tests")
    if not tests_dir.exists():
        print("❌ tests/ directory not found")
        return 1
    
    # Find test files
    test_files = sorted(tests_dir.glob("test_*.py"))
    test_files += sorted(tests_dir.glob("*_test.py"))
    test_files += sorted(tests_dir.glob("comprehensive_test_suite.py"))
    
    # Remove duplicates
    test_files = list(dict.fromkeys(test_files))
    
    if not test_files:
        print("⚠️  No test files found in tests/")
        print("Expected patterns: test_*.py, *_test.py, comprehensive_test_suite.py")
        return 1
    
    print(f"Found {len(test_files)} test suite(s):\n")
    for i, test in enumerate(test_files, 1):
        print(f"  {i}. {test.name}")
    
    # Run tests
    print_header("RUNNING TESTS")
    results = {}
    
    for test_script in test_files:
        results[test_script.name] = run_test(test_script)
        print()
    
    # Summary
    print_header("TEST SUMMARY")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}  {test_name}")
    
    print(f"\n{'─'*70}")
    print(f"Results: {passed}/{total} test suites passed ({passed*100//total if total else 0}%)")
    print(f"{'─'*70}\n")
    
    if passed == total:
        print("✅ ALL TESTS PASSED - System is fully functional!\n")
        return 0
    else:
        print(f"⚠️  {total - passed} test suite(s) failed - Review output above\n")
        return 1

if __name__ == "__main__":
    exit(main())
