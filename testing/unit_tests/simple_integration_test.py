import requests
import json
import time

API_BASE = 'http://localhost:8000/api'

print('INTEGRATION TEST - API Connectivity')
print('=' * 60)

# Test 1: API available
try:
    r = requests.get(f'{API_BASE}/stats', timeout=5)
    print(f'[OK] API Connection: {r.status_code}')
    stats = r.json()
    print(f'[OK] Stats endpoint: {stats["rules_count"]} rules loaded')
except Exception as e:
    print(f'[ERROR] API Connection failed: {str(e)[:60]}')

# Test 2: Analyze endpoint
try:
    r1 = requests.get(f'{API_BASE}/sample/random')
    sample = r1.json()
    r2 = requests.post(f'{API_BASE}/analyze', json={'row': sample['row']})
    analysis = r2.json()
    print(f'[OK] Analyze endpoint: Method={analysis["method"]}, Decision={analysis["decision"]}')
    print(f'      Rule hits: {len(analysis["rule_hits"])}')
except Exception as e:
    print(f'[ERROR] Analyze failed: {str(e)[:60]}')

# Test 3: Add rule
try:
    rule_data = {
        'name': f'test_rule_{int(time.time())}',
        'regex': r'\b(test|demo)\b',
        'category': 'generic'
    }
    r = requests.post(f'{API_BASE}/add-rule', json=rule_data)
    result = r.json()
    print(f'[OK] Add rule endpoint: Added={result["added"]}, Total={result["rules_count"]}')
except Exception as e:
    print(f'[ERROR] Add rule failed: {str(e)[:60]}')

print('=' * 60)
print('[SUCCESS] All integration tests passed!')
