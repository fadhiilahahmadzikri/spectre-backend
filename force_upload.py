
from huggingface_hub import HfApi
import os

api = HfApi()
repo_id = "thewhitenigs/spectre-backend"
file_path = "src/spectre/infrastructure/database/models/tables.py"
local_path = "D:/spectre/src/spectre/infrastructure/database/models/tables.py"

if not os.path.exists(local_path):
    print(f"CRITICAL: Local file not found at {local_path}")
    exit(1)

print(f"Force uploading {file_path}...")
try:
    api.upload_file(
        path_or_fileobj=local_path,
        path_in_repo=file_path,
        repo_id=repo_id,
        repo_type="space",
        commit_message="force upload missing models/tables.py"
    )
    print("SUCCESS: File uploaded successfully.")
except Exception as e:
    print(f"FAILED: {e}")
