
from huggingface_hub import HfApi

api = HfApi()
repo_id = "thewhitenigs/spectre-backend"

commits = api.list_repo_commits(repo_id=repo_id, repo_type="space")
last_commit = commits[0]

print(f"Latest Commit ID: {last_commit.commit_id}")
print(f"Message: {last_commit.message}")
print(f"Date: {last_commit.created_at}")
print("-" * 50)

# Cek apakah commit ini mengandung kata 'models' atau 'tables.py'
# Tapi list_repo_commits tidak kasih list file berubah. 
# Kita list files saja lagi tapi pastikan ambil data terbaru.

files = api.list_repo_files(repo_id=repo_id, repo_type="space")
target = "src/spectre/infrastructure/database/models/tables.py"

if target in files:
    print(f"SUCCESS: {target} IS PRESENT on remote.")
else:
    print(f"FAILED: {target} IS STILL MISSING.")
    # List folder database
    db_files = [f for f in files if f.startswith("src/spectre/infrastructure/database/")]
    print("\nFiles in database folder:")
    for f in db_files:
        print(f"  - {f}")
