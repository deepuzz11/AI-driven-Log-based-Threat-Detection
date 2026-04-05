import re

count = 0
rules = []
with open('rules.txt', 'r') as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if line.endswith(','):
            line = line[:-1]
        if line.startswith('('):
            try:
                name, pattern, category = eval(line)
                count += 1
                rules.append(name)
            except:
                pass

print(f'Total rules in rules.txt: {count}')
print(f'\nFirst 10 rules: {rules[:10]}')
print(f'Last 10 rules: {rules[-10:]}')
