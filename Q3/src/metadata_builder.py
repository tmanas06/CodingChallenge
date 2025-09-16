import json
import time
import uuid

def build_metadata(concept, animation_path, duration, audience, model):
    tricky_questions = [
        f"Explain the physics behind {concept}.",
        f"How does {concept} change if parameters vary?",
        f"Where is {concept} applied in real-world systems?"
    ]

    metadata = {
        "id": f"anim_{uuid.uuid4().hex[:6]}",
        "concept": concept,
        "model": model,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "animation_type": "gif",
        "duration": duration,
        "target_audience": audience,
        "learning_goals": [
            f"Understand the basics of {concept}",
            f"Visualize {concept} dynamically",
            f"Apply {concept} to practical examples"
        ],
        "key_learning_points": [
            f"{concept} illustrated in motion",
            "Highlights cause-effect relationships",
            "Links visual understanding with theory"
        ],
        "tricky_questions": tricky_questions,
        "animation_url": animation_path
    }

    out_file = f"outputs/metadata/{concept.replace(' ', '_')}.json"
    with open(out_file, "w") as f:
        json.dump(metadata, f, indent=2)

    return metadata
