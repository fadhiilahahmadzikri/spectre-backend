import json
from pathlib import Path

def inspect_communities():
    analysis = json.loads(Path('graphify-out/.graphify_analysis.json').read_text())
    graph = json.loads(Path('graphify-out/graph.json').read_text())
    
    nodes = {n['id']: n for n in graph['nodes']}
    communities = {int(k): v for k, v in analysis['communities'].items()}
    
    # Sort communities by size
    sorted_cids = sorted(communities.keys(), key=lambda x: len(communities[x]), reverse=True)
    
    for cid in sorted_cids[:15]:
        c_nodes = communities[cid]
        labels = [nodes[nid].get('label', nid) for nid in c_nodes[:10]]
        print(f"Community {cid} ({len(c_nodes)} nodes): {', '.join(labels)}")

if __name__ == '__main__':
    inspect_communities()
