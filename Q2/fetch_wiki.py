import requests
import json
import os
import uuid
from datetime import datetime
from utils import setup_logger, validate_json

logger = setup_logger()

WIKI_API = "https://en.wikipedia.org/w/api.php"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"

def fetch_wikipedia_content(topic):
    try:
        params = {
            "action": "query",
            "format": "json",
            "prop": "extracts|pageimages",
            "titles": topic,
            "exintro": True,
            "explaintext": True,
            "piprop": "original"
        }
        response = requests.get(WIKI_API, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        page = next(iter(data["query"]["pages"].values()))
        description = page.get("extract", "No description available.")
        image_url = page.get("original", {}).get("source", None)
        page_url = f"https://en.wikipedia.org/wiki/{topic.replace(' ', '_')}"
        
        return description, image_url, page_url
    except Exception as e:
        logger.error(f"Error fetching Wikipedia content: {e}")
        return "No description available.", None, None

def build_metadata(topic, description, image_url, page_url):
    metadata = {
        "id": str(uuid.uuid4()),
        "title": topic,
        "description": description,
        "page_url": page_url,
        "image_url": image_url or "generated_placeholder.png",
        "license": "CC BY-SA 4.0",
        "attribution": "Wikipedia/Wikimedia Commons",
        "learning_objectives": [
            f"Understand the concept of {topic}",
            f"Identify key features of {topic}",
            f"Explain the importance of {topic} in real-world context"
        ],
        "difficulty_level": "high_school",
        "related_topics": [f"{topic} basics", f"Advanced {topic}"],
        "created_at": datetime.utcnow().isoformat()
    }
    return metadata

def main(topic):
    description, image_url, page_url = fetch_wikipedia_content(topic)
    metadata = build_metadata(topic, description, image_url, page_url)
    
    # Validate schema
    if not validate_json(metadata, "src/schema.json"):
        logger.error("Generated JSON does not match schema!")
        return
    
    # Save JSON
    output_path = f"output/packages/{topic.replace(' ', '_')}.json"
    os.makedirs("output/packages", exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(metadata, f, indent=2)
    
    logger.info(f"Generated content package for {topic}: {output_path}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Fetch Wikipedia content and generate educational metadata")
    parser.add_argument("--topic", type=str, required=True, help="Educational topic (e.g., Photosynthesis)")
    args = parser.parse_args()
    main(args.topic)
