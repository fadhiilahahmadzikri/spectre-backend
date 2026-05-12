
from huggingface_hub.utils import filter_repo_objects
from pathlib import Path

def parse_ignore_file(filepath: Path) -> list[str]:
    patterns = []
    if not filepath.exists():
        return patterns
    with open(filepath, encoding="utf-8", errors="ignore") as f:
        for line in f:
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            patterns.append(stripped)
    return patterns

# Ambil semua pola
patterns = parse_ignore_file(Path(".huggingfaceignore")) + parse_ignore_file(Path(".gitignore"))
target = "src/spectre/infrastructure/database/models/tables.py"

print(f"Checking target: {target}")
print("-" * 50)

for p in patterns:
    # Simulasi cara library HF memfilter file
    filtered = list(filter_repo_objects([target], allow_patterns=None, ignore_patterns=[p]))
    if not filtered:
        print(f"BLOCKED BY PATTERN: '{p}'")
    
print("-" * 50)
print("Done.")
