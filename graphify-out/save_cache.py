import json
from graphify.cache import save_semantic_cache
from pathlib import Path

def save_cache():
    new_path = Path('graphify-out/.graphify_semantic_new.json')
    if new_path.exists():
        new = json.loads(new_path.read_text())
    else:
        new = {'nodes':[],'edges':[],'hyperedges':[]}
        
    saved = save_semantic_cache(new.get('nodes', []), new.get('edges', []), new.get('hyperedges', []))
    print(f'Cached {saved} files')

if __name__ == '__main__':
    save_cache()
