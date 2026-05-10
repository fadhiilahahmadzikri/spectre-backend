import json
from pathlib import Path

def generate_chunks():
    uncached = Path('graphify-out/.graphify_uncached.txt').read_text().splitlines()
    
    chunks = []
    current_chunk = []
    
    # Simple strategy: 22 files per chunk, but keep images separate
    for f in uncached:
        if f.endswith(('.svg', '.png', '.jpg', '.jpeg', '.webp')):
            if current_chunk:
                chunks.append(current_chunk)
                current_chunk = []
            chunks.append([f])
        else:
            current_chunk.append(f)
            if len(current_chunk) >= 22:
                chunks.append(current_chunk)
                current_chunk = []
    
    if current_chunk:
        chunks.append(current_chunk)
        
    Path('graphify-out/.graphify_chunks.json').write_text(json.dumps(chunks, indent=2))
    print(f'Generated {len(chunks)} chunks.')

if __name__ == '__main__':
    generate_chunks()
