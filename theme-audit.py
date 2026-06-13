import os, re

roots = [
    '/home/ovie/gsws/src/app',
    '/home/ovie/gsws/src/components',
]

patterns = {
    'hardcoded white bg': r"background:\s*['\"]#(?:fff|ffffff)['\"]",
    'hardcoded near-white bg': r"background:\s*['\"]#f[5-9a-f][5-9a-f]?[5-9a-f]?['\"]",
    'hardcoded black text': r"color:\s*['\"]#(?:000|0a0a0a|111111?)['\"]",
    'hardcoded dark bg (#111/#1a1a1a etc)': r"background:\s*['\"]#(?:0a0a0a|111|111111|1a1a1a)['\"]",
    'g-black var (always black)': r"var\(--g-black\)",
    'g-white var (always white)': r"var\(--g-white\)",
    'g-gray-50/100/200 raw (light-only greys)': r"var\(--g-gray-(?:50|100|200)\)",
    'className bg-white/bg-black tailwind': r"className=[\"'][^\"']*bg-(?:white|black)[^\"']*[\"']",
    'hardcoded border light grey': r"border(?:Bottom|Top|Left|Right)?:\s*['\"]1px (?:solid|dashed) #(?:ebebeb|e5e5e5|d4d4d4|f0f0f0|f7f7f7)['\"]",
    'hardcoded text grey (#555/#666/#9a9a9a)': r"color:\s*['\"]#(?:555|666|9a9a9a)['\"]",
}

results = {}
for searchdir in roots:
    for root, dirs, files in os.walk(searchdir):
        for fn in files:
            if not fn.endswith('.tsx') and not fn.endswith('.css'):
                continue
            path = os.path.join(root, fn)
            with open(path, 'r', errors='ignore') as f:
                content = f.read()
            for label, pattern in patterns.items():
                matches = re.findall(pattern, content)
                if matches:
                    rel = path.replace('/home/ovie/gsws/', '')
                    results.setdefault(rel, {})
                    results[rel][label] = len(matches)

total_files = 0
total_hits = 0
for path in sorted(results.keys()):
    total_files += 1
    file_total = sum(results[path].values())
    total_hits += file_total
    print(f"\n{path}  ({file_total} issues)")
    for label, count in results[path].items():
        print(f"  - {label}: {count}")

print(f"\n\n=== SUMMARY: {total_files} files, {total_hits} total issues ===")
