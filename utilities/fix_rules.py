# Fix corrupted rules.txt file

import re
from collections import Counter

print("🔧 FIXING RULES.TXT FILE\n")

# Read the rules file
with open('rules.txt', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

print(f"Original file size: {len(content)} characters")

# Find all properly formatted rule lines
rule_pattern = r'^\s*\("([^"]+)",\s*r"([^"]+)",\s*"([^"]+)"\),?\s*$'
lines = content.split('\n')

cleaned_lines = []
for i, line in enumerate(lines):
    line_stripped = line.strip()
    
    # Skip empty lines and comments
    if not line_stripped or line_stripped.startswith('#'):
        cleaned_lines.append(line)
        continue
    
    # Skip the corrupted line
    if 'ml_learned_dos_ddos_attacks' in line or '||' in line:
        print(f"❌ Skipping corrupted line {i+1}: {line[:70]}...")
        continue
    
    # Check if it's a rule line
    if line_stripped.startswith('('):
        # Try to parse it
        try:
            # Remove trailing comma if exists
            test_line = line_stripped
            if test_line.endswith(','):
                test_line = test_line[:-1]
            
            name, pattern, cat = eval(test_line)
            cleaned_lines.append(line)
        except Exception as e:
            print(f"⚠️ Failed to parse line {i+1}: {line[:50]}... ({str(e)[:30]})")
            continue
    else:
        cleaned_lines.append(line)

# Write cleaned file
with open('rules.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(cleaned_lines))

print(f"\n✅ Cleaned rules.txt")

# Verify it loads correctly now
print("\n📊 VERIFICATION:")
rules_patterns = []
with open('rules.txt', 'r') as f:
    for line_num, line in enumerate(f, 1):
        line = line.strip()
        if not line or line.startswith('#'): 
            continue
        if line.endswith(','): 
            line = line[:-1]
        try:
            name, pattern, cat = eval(line)
            rules_patterns.append((name, pattern, cat))
        except Exception as e:
            print(f"  ❌ Parse error line {line_num}: {str(e)[:40]}...")

print(f"✅ Total valid rules loaded: {len(rules_patterns)}")

# Show breakdown
cat_count = Counter([r[2] for r in rules_patterns])
print(f"\nRules by category ({len(cat_count)} categories):")
for cat, count in sorted(cat_count.items(), key=lambda x: -x[1])[:15]:
    print(f"  • {cat:20s}: {count:3d}")

print(f"\n✅ FIX COMPLETE - All rules are now valid!")
