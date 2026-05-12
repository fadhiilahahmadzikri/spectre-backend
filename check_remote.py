
from huggingface_hub import HfApi
import sys

def check_remote_file(repo_id, target_file):
    api = HfApi()
    try:
        files = api.list_repo_files(repo_id=repo_id, repo_type="space")
        if target_file in files:
            print(f"FOUND: {target_file} exists on remote.")
        else:
            print(f"NOT FOUND: {target_file} is missing from remote.")
            
        # Also check directory
        dir_path = "/".join(target_file.split("/")[:-1])
        matches = [f for f in files if f.startswith(dir_path)]
        if matches:
            print(f"\nFiles in {dir_path}/:")
            for m in matches:
                print(f"  - {m}")
        else:
            print(f"\nDirectory {dir_path}/ does not exist on remote.")
            
    except Exception as e:
        print(f"Error: {e}")

repo = "thewhitenigs/spectre-backend"
target = "src/spectre/infrastructure/database/models/tables.py"
check_remote_file(repo, target)
