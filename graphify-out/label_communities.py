import sys, json
from graphify.build import build_from_json
from graphify.cluster import score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from pathlib import Path

def main():
    extraction_path = Path('graphify-out/.graphify_extract.json')
    detection_path = Path('graphify-out/.graphify_detect.json')
    analysis_path = Path('graphify-out/.graphify_analysis.json')
    
    extraction = json.loads(extraction_path.read_text())
    detection  = json.loads(detection_path.read_text())
    analysis   = json.loads(analysis_path.read_text())

    G = build_from_json(extraction)
    communities = {int(k): v for k, v in analysis['communities'].items()}
    cohesion = {int(k): v for k, v in analysis['cohesion'].items()}
    tokens = {'input': extraction.get('input_tokens', 0), 'output': extraction.get('output_tokens', 0)}

    labels = {cid: f'Community {cid}' for cid in communities}
    labels.update({
        0: "Authentication Use Cases",
        1: "Redis Cache & Rate Limiting",
        2: "Aura Ring UI Components",
        3: "Domain Entities & Repositories",
        4: "API Request/Response Schemas",
        5: "Centralized Logging Infrastructure",
        6: "Database Seeding Framework",
        7: "ML Model Interfaces & Errors",
        8: "Face ID Use Cases",
        9: "Domain Exceptions",
        10: "Face Embedding Unit Tests",
        11: "Custom ML Layers (Attention)",
        12: "App Configuration & API Client",
        13: "Database ORM Models",
        14: "Base Repository Methods"
    })

    questions = suggest_questions(G, communities, labels)

    report = generate(G, communities, cohesion, labels, analysis['gods'], analysis['surprises'], detection, tokens, '.', suggested_questions=questions)
    Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')
    Path('graphify-out/.graphify_labels.json').write_text(json.dumps({str(k): v for k, v in labels.items()}))
    print('Report updated with community labels')

if __name__ == '__main__':
    main()
