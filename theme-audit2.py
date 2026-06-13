import os, re

roots = [
    '/home/ovie/gsws/src/app/(dashboard)',
    '/home/ovie/gsws/src/components',
]

patterns = {
    'tailwind-style light greys (#e5e7eb/#f8fafc/#f3f4f6/#f9fafb)': r"#(?:e5e7eb|f8fafc|f3f4f6|f9fafb|d1d5db)",
    'color #111 (near-black, often invisible on dark)': r"color:\s*['\"]#111['\"]",
    'color #1f1f1f / #1f2937': r"color:\s*['\"]#(?:1f1f1f|1f2937)['\"]",
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
