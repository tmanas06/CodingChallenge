#!/usr/bin/env python3
"""
Educational Content Fetcher - Wikipedia/Wikimedia Integration
Fetches educational content and images from Wikipedia/Wikimedia with enhanced metadata
"""

import argparse
import json
import os
import requests
import logging
import time
import hashlib
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from jsonschema import validate, ValidationError

# Try to load python-dotenv for .env file support
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("educational_content.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# API Configuration
WIKI_API = "https://en.wikipedia.org/w/api.php"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
WIKIMEDIA_API = "https://www.wikimedia.org/api/rest_v1"

# Free image generation APIs (fallback)
UNSPLASH_API = "https://api.unsplash.com/search/photos"
PEXELS_API = "https://api.pexels.com/v1/search"

# Cache configuration
CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok=True)
CACHE_EXPIRY = 24 * 60 * 60  # 24 hours

@dataclass
class EducationalContent:
    """Data class for educational content"""
    id: str
    title: str
    description: str
    page_url: str
    image_url: str
    license: str
    attribution: str
    learning_objectives: List[str]
    difficulty_level: str
    related_topics: List[str]
    created_at: str
    source: str = "wikipedia"
    image_quality: str = "high"
    educational_value: int = 5  # 1-10 scale

class EducationalContentFetcher:
    """Main class for fetching and processing educational content"""
    
    def __init__(self, cache_enabled: bool = True):
        self.cache_enabled = cache_enabled
        self.output_dir = Path("output")
        self.images_dir = self.output_dir / "images"
        self.packages_dir = self.output_dir / "packages"
        
        # Create directories
        self.output_dir.mkdir(exist_ok=True)
        self.images_dir.mkdir(exist_ok=True)
        self.packages_dir.mkdir(exist_ok=True)
        
        # Load API keys
        self.unsplash_key = os.getenv("UNSPLASH_ACCESS_KEY")
        self.pexels_key = os.getenv("PEXELS_API_KEY")
        
        # Educational topic mappings
        self.topic_mappings = {
            "photosynthesis": {
                "learning_objectives": [
                    "Understand the process of converting light energy to chemical energy",
                    "Identify the key components: chlorophyll, sunlight, water, and carbon dioxide",
                    "Explain the role of photosynthesis in the carbon cycle",
                    "Describe the structure and function of chloroplasts"
                ],
                "difficulty_level": "high_school",
                "related_topics": ["Cell Biology", "Biochemistry", "Ecology", "Plant Science"],
                "keywords": ["photosynthesis", "chlorophyll", "chloroplast", "glucose", "oxygen"]
            },
            "solar_system": {
                "learning_objectives": [
                    "Identify the eight planets and their characteristics",
                    "Understand the structure and composition of the solar system",
                    "Explain planetary motion and gravitational forces",
                    "Describe the role of the sun as the central star"
                ],
                "difficulty_level": "middle_school",
                "related_topics": ["Astronomy", "Physics", "Space Science", "Planetary Science"],
                "keywords": ["solar system", "planets", "sun", "orbit", "gravity"]
            },
            "dna_structure": {
                "learning_objectives": [
                    "Understand the double helix structure of DNA",
                    "Identify the four nucleotide bases and their pairing rules",
                    "Explain how DNA stores genetic information",
                    "Describe the role of DNA in protein synthesis"
                ],
                "difficulty_level": "high_school",
                "related_topics": ["Genetics", "Molecular Biology", "Biochemistry", "Evolution"],
                "keywords": ["dna", "double helix", "nucleotide", "genetic code", "chromosome"]
            },
            "mitochondria": {
                "learning_objectives": [
                    "Understand cellular respiration process",
                    "Identify mitochondrial structure components",
                    "Explain ATP production mechanism",
                    "Describe the endosymbiotic theory of mitochondria"
                ],
                "difficulty_level": "high_school",
                "related_topics": ["Cell Biology", "Biochemistry", "Energy Production", "Evolution"],
                "keywords": ["mitochondria", "atp", "cellular respiration", "cristae", "matrix"]
            }
        }
    
    def get_cache_key(self, topic: str, content_type: str = "content") -> str:
        """Generate cache key for topic and content type"""
        return hashlib.md5(f"{topic}_{content_type}".encode()).hexdigest()
    
    def is_cached(self, cache_key: str) -> Optional[Dict]:
        """Check if content is cached and not expired"""
        if not self.cache_enabled:
            return None
        
        cache_file = CACHE_DIR / f"{cache_key}.json"
        if not cache_file.exists():
            return None
        
        try:
            with open(cache_file, 'r') as f:
                cached_data = json.load(f)
            
            # Check if cache is expired
            cache_time = cached_data.get('cached_at', 0)
            if time.time() - cache_time > CACHE_EXPIRY:
                cache_file.unlink()  # Remove expired cache
                return None
            
            return cached_data.get('data')
        except Exception as e:
            logger.warning(f"Error reading cache: {e}")
            return None
    
    def cache_content(self, cache_key: str, content: Dict) -> None:
        """Cache content with timestamp"""
        if not self.cache_enabled:
            return
        
        try:
            cache_data = {
                'cached_at': time.time(),
                'data': content
            }
            cache_file = CACHE_DIR / f"{cache_key}.json"
            with open(cache_file, 'w') as f:
                json.dump(cache_data, f)
            logger.info(f"Content cached: {cache_key}")
        except Exception as e:
            logger.warning(f"Error caching content: {e}")
    
    def fetch_wikipedia_content(self, topic: str) -> Tuple[str, str, str, str]:
        """Fetch content from Wikipedia with enhanced error handling"""
        cache_key = self.get_cache_key(topic, "wikipedia")
        cached_content = self.is_cached(cache_key)
        
        if cached_content:
            logger.info(f"Using cached Wikipedia content for: {topic}")
            return (
                cached_content['description'],
                cached_content['image_url'],
                cached_content['page_url'],
                cached_content['license']
            )
        
        try:
            # Search for the topic first
            search_params = {
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": topic,
                "srlimit": 1
            }
            
            headers = {
                'User-Agent': 'EducationalContentFetcher/1.0 (Educational Tool; contact@example.com)'
            }
            
            response = requests.get(WIKI_API, params=search_params, headers=headers, timeout=10)
            response.raise_for_status()
            search_data = response.json()
            
            if not search_data.get("query", {}).get("search"):
                logger.warning(f"No Wikipedia page found for: {topic}")
                return self._generate_fallback_content(topic)
            
            # Get the first search result
            page_title = search_data["query"]["search"][0]["title"]
            
            # Fetch detailed content
            params = {
                "action": "query",
                "format": "json",
                "prop": "extracts|pageimages|info",
                "titles": page_title,
                "exintro": True,
                "explaintext": True,
                "piprop": "original|thumbnail",
                "pithumbsize": 800,
                "inprop": "url"
            }
            
            response = requests.get(WIKI_API, params=params, headers=headers, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            page = next(iter(data["query"]["pages"].values()))
            
            if page.get("missing"):
                logger.warning(f"Wikipedia page missing for: {page_title}")
                return self._generate_fallback_content(topic)
            
            description = page.get("extract", "No description available.")
            page_url = page.get("fullurl", f"https://en.wikipedia.org/wiki/{page_title.replace(' ', '_')}")
            
            # Get image information
            image_url = None
            license_info = "CC BY-SA 4.0"
            
            if "original" in page.get("pageimage", {}):
                image_url = page["original"]["source"]
            elif "thumbnail" in page.get("pageimage", {}):
                image_url = page["thumbnail"]["source"]
            
            # Try to get better image from Wikimedia Commons
            if not image_url:
                image_url, license_info = self._fetch_commons_image(topic)
            
            content = {
                'description': description,
                'image_url': image_url,
                'page_url': page_url,
                'license': license_info
            }
            
            self.cache_content(cache_key, content)
            
            return description, image_url, page_url, license_info
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                logger.warning(f"Wikipedia API access forbidden (403). This may be due to rate limiting or IP restrictions. Using fallback content.")
            else:
                logger.error(f"Wikipedia API HTTP error {e.response.status_code}: {e}")
            return self._generate_fallback_content(topic)
        except requests.exceptions.RequestException as e:
            logger.error(f"Wikipedia API error: {e}")
            return self._generate_fallback_content(topic)
        except Exception as e:
            logger.error(f"Unexpected error fetching Wikipedia content: {e}")
            return self._generate_fallback_content(topic)
    
    def _fetch_commons_image(self, topic: str) -> Tuple[Optional[str], str]:
        """Fetch image from Wikimedia Commons"""
        try:
            params = {
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": f"filetype:bitmap {topic}",
                "srnamespace": 6,  # File namespace
                "srlimit": 5
            }
            
            headers = {
                'User-Agent': 'EducationalContentFetcher/1.0 (Educational Tool; contact@example.com)'
            }
            
            response = requests.get(COMMONS_API, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if not data.get("query", {}).get("search"):
                return None, "CC BY-SA 4.0"
            
            # Get the first image
            file_title = data["query"]["search"][0]["title"]
            
            # Get image URL
            image_params = {
                "action": "query",
                "format": "json",
                "prop": "imageinfo",
                "titles": file_title,
                "iiprop": "url|extmetadata"
            }
            
            response = requests.get(COMMONS_API, params=image_params, headers=headers, timeout=10)
            response.raise_for_status()
            image_data = response.json()
            
            page = next(iter(image_data["query"]["pages"].values()))
            if "imageinfo" in page:
                image_url = page["imageinfo"][0]["url"]
                # Try to get license info
                metadata = page["imageinfo"][0].get("extmetadata", {})
                license_info = metadata.get("LicenseShortName", {}).get("value", "CC BY-SA 4.0")
                return image_url, license_info
            
        except Exception as e:
            logger.warning(f"Error fetching Commons image: {e}")
        
        return None, "CC BY-SA 4.0"
    
    def _generate_fallback_content(self, topic: str) -> Tuple[str, str, str, str]:
        """Generate fallback content when Wikipedia fails"""
        logger.info(f"Generating fallback content for: {topic}")
        
        # Use topic mappings for better fallback content
        topic_lower = topic.lower().replace(" ", "_")
        if topic_lower in self.topic_mappings:
            mapping = self.topic_mappings[topic_lower]
            description = f"Educational content about {topic}. {mapping['learning_objectives'][0]}"
        else:
            description = f"Educational content about {topic}. Learn about the key concepts, processes, and importance of {topic} in scientific and educational contexts."
        
        return (
            description,
            None,  # Will be handled by image generation
            f"https://en.wikipedia.org/wiki/{topic.replace(' ', '_')}",
            "CC BY-SA 4.0"
        )
    
    def generate_fallback_image(self, topic: str) -> str:
        """Generate fallback image using free APIs or create placeholder"""
        try:
            # Try Unsplash first
            if self.unsplash_key:
                image_url = self._fetch_unsplash_image(topic)
                if image_url:
                    return image_url
            
            # Try Pexels
            if self.pexels_key:
                image_url = self._fetch_pexels_image(topic)
                if image_url:
                    return image_url
            
            # Create educational diagram placeholder
            return self._create_educational_diagram(topic)
            
        except Exception as e:
            logger.warning(f"Error generating fallback image: {e}")
            return self._create_educational_diagram(topic)
    
    def _fetch_unsplash_image(self, topic: str) -> Optional[str]:
        """Fetch image from Unsplash API"""
        try:
            headers = {"Authorization": f"Client-ID {self.unsplash_key}"}
            params = {"query": topic, "per_page": 1, "orientation": "landscape"}
            
            response = requests.get(UNSPLASH_API, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get("results"):
                return data["results"][0]["urls"]["regular"]
        except Exception as e:
            logger.warning(f"Unsplash API error: {e}")
        
        return None
    
    def _fetch_pexels_image(self, topic: str) -> Optional[str]:
        """Fetch image from Pexels API"""
        try:
            headers = {"Authorization": self.pexels_key}
            params = {"query": topic, "per_page": 1, "orientation": "landscape"}
            
            response = requests.get(PEXELS_API, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get("photos"):
                return data["photos"][0]["src"]["large"]
        except Exception as e:
            logger.warning(f"Pexels API error: {e}")
        
        return None
    
    def _create_educational_diagram(self, topic: str) -> str:
        """Create educational diagram placeholder"""
        # Create a simple text-based diagram
        diagram_content = f"""EDUCATIONAL DIAGRAM: {topic.upper()}

This would be a generated educational diagram showing:
- Key concepts and processes related to {topic}
- Visual representations of important structures
- Educational labels and annotations
- Professional scientific illustration style

Generated by: Educational Content Fetcher
Topic: {topic}
Type: Educational Diagram
"""
        
        diagram_path = self.images_dir / f"{topic.replace(' ', '_')}_diagram.txt"
        with open(diagram_path, 'w', encoding='utf-8') as f:
            f.write(diagram_content)
        
        logger.info(f"Created educational diagram: {diagram_path}")
        return str(diagram_path)
    
    def download_image(self, image_url: str, topic: str) -> str:
        """Download and save image locally"""
        try:
            if not image_url or image_url.startswith("http"):
                return image_url
            
            # Generate filename
            filename = f"{topic.replace(' ', '_')}_{hashlib.md5(image_url.encode()).hexdigest()[:8]}.jpg"
            image_path = self.images_dir / filename
            
            # Download image
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            
            with open(image_path, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"Downloaded image: {image_path}")
            return str(image_path)
            
        except Exception as e:
            logger.warning(f"Error downloading image: {e}")
            return self._create_educational_diagram(topic)
    
    def build_educational_metadata(self, topic: str, description: str, image_url: str, 
                                 page_url: str, license_info: str) -> EducationalContent:
        """Build comprehensive educational metadata"""
        
        # Get topic-specific information
        topic_lower = topic.lower().replace(" ", "_")
        topic_info = self.topic_mappings.get(topic_lower, {})
        
        # Determine difficulty level
        difficulty_level = topic_info.get("difficulty_level", "high_school")
        
        # Generate learning objectives
        if topic_info.get("learning_objectives"):
            learning_objectives = topic_info["learning_objectives"]
        else:
            learning_objectives = [
                f"Understand the fundamental concepts of {topic}",
                f"Identify key components and processes in {topic}",
                f"Explain the importance and applications of {topic}",
                f"Analyze the relationship between {topic} and related scientific principles"
            ]
        
        # Generate related topics
        if topic_info.get("related_topics"):
            related_topics = topic_info["related_topics"]
        else:
            related_topics = [
                f"{topic} Fundamentals",
                f"Advanced {topic}",
                f"{topic} Applications",
                "Scientific Methodology"
            ]
        
        # Determine educational value
        educational_value = 8 if topic_info else 6
        
        return EducationalContent(
            id=str(uuid.uuid4()),
            title=topic,
            description=description,
            page_url=page_url,
            image_url=image_url or "generated_placeholder.png",
            license=license_info,
            attribution="Wikipedia/Wikimedia Commons" if image_url else "Generated Educational Content",
            learning_objectives=learning_objectives,
            difficulty_level=difficulty_level,
            related_topics=related_topics,
            created_at=datetime.now(timezone.utc).isoformat(),
            source="wikipedia" if page_url else "generated",
            image_quality="high" if image_url else "generated",
            educational_value=educational_value
        )
    
    def process_topic(self, topic: str) -> EducationalContent:
        """Process a single educational topic"""
        logger.info(f"Processing educational topic: {topic}")
        
        # Fetch Wikipedia content
        description, image_url, page_url, license_info = self.fetch_wikipedia_content(topic)
        
        # Handle image
        if not image_url:
            logger.info(f"No Wikipedia image found for {topic}, generating fallback")
            image_url = self.generate_fallback_image(topic)
        else:
            # Download image locally
            image_url = self.download_image(image_url, topic)
        
        # Build metadata
        content = self.build_educational_metadata(topic, description, image_url, page_url, license_info)
        
        return content
    
    def process_topics_batch(self, topics: List[str]) -> List[EducationalContent]:
        """Process multiple topics in batch with progress tracking"""
        logger.info(f"Processing batch of {len(topics)} topics")
        
        results = []
        for i, topic in enumerate(topics, 1):
            logger.info(f"Progress: {i}/{len(topics)} - Processing: {topic}")
            try:
                content = self.process_topic(topic)
                results.append(content)
                time.sleep(1)  # Rate limiting
            except Exception as e:
                logger.error(f"Error processing {topic}: {e}")
                # Create fallback content
                fallback_content = EducationalContent(
                    id=str(uuid.uuid4()),
                    title=topic,
                    description=f"Educational content about {topic}",
                    page_url=f"https://en.wikipedia.org/wiki/{topic.replace(' ', '_')}",
                    image_url=self._create_educational_diagram(topic),
                    license="CC BY-SA 4.0",
                    attribution="Generated Educational Content",
                    learning_objectives=[f"Learn about {topic}"],
                    difficulty_level="high_school",
                    related_topics=[f"{topic} Basics"],
                    created_at=datetime.now(timezone.utc).isoformat(),
                    source="generated",
                    educational_value=5
                )
                results.append(fallback_content)
        
        return results
    
    def save_content(self, content: EducationalContent) -> str:
        """Save educational content to JSON file"""
        output_file = self.packages_dir / f"{content.title.replace(' ', '_')}.json"
        
        # Convert to dict for JSON serialization
        content_dict = {
            "id": content.id,
            "title": content.title,
            "description": content.description,
            "page_url": content.page_url,
            "image_url": content.image_url,
            "license": content.license,
            "attribution": content.attribution,
            "learning_objectives": content.learning_objectives,
            "difficulty_level": content.difficulty_level,
            "related_topics": content.related_topics,
            "created_at": content.created_at,
            "source": content.source,
            "image_quality": content.image_quality,
            "educational_value": content.educational_value
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(content_dict, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved educational content: {output_file}")
        return str(output_file)
    
    def save_batch_results(self, contents: List[EducationalContent]) -> str:
        """Save batch results to a single JSON file"""
        output_file = self.packages_dir / "educational_packages_batch.json"
        
        # Convert all contents to dicts
        contents_dict = []
        for content in contents:
            content_dict = {
                "id": content.id,
                "title": content.title,
                "description": content.description,
                "page_url": content.page_url,
                "image_url": content.image_url,
                "license": content.license,
                "attribution": content.attribution,
                "learning_objectives": content.learning_objectives,
                "difficulty_level": content.difficulty_level,
                "related_topics": content.related_topics,
                "created_at": content.created_at,
                "source": content.source,
                "image_quality": content.image_quality,
                "educational_value": content.educational_value
            }
            contents_dict.append(content_dict)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(contents_dict, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved batch results: {output_file}")
        return str(output_file)

def main():
    parser = argparse.ArgumentParser(
        description="Fetch Wikipedia/Wikimedia educational content with enhanced metadata",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python educational_content_fetcher.py --topic "Photosynthesis"
  python educational_content_fetcher.py --topic "Solar System" --batch
  python educational_content_fetcher.py --topics "DNA Structure,Mitochondria,Cell Division" --batch
  python educational_content_fetcher.py --topic "Mitochondria" --no-cache
        """
    )
    
    parser.add_argument(
        "--topic", 
        type=str, 
        help="Single educational topic (e.g., Photosynthesis)"
    )
    parser.add_argument(
        "--topics", 
        type=str, 
        help="Comma-separated list of topics (e.g., 'DNA Structure,Mitochondria,Cell Division')"
    )
    parser.add_argument(
        "--batch", 
        action="store_true",
        help="Process topics in batch mode"
    )
    parser.add_argument(
        "--no-cache", 
        action="store_true",
        help="Disable caching"
    )
    parser.add_argument(
        "--verbose", 
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Validate arguments
    if not args.topic and not args.topics:
        logger.error("Please provide either --topic or --topics")
        return 1
    
    try:
        fetcher = EducationalContentFetcher(cache_enabled=not args.no_cache)
        
        if args.topics:
            # Batch processing
            topics = [topic.strip() for topic in args.topics.split(",")]
            logger.info(f"Starting batch processing of {len(topics)} topics")
            
            results = fetcher.process_topics_batch(topics)
            output_file = fetcher.save_batch_results(results)
            
            logger.info(f"[SUCCESS] Batch processing completed!")
            logger.info(f"[SAVED] Results saved to: {output_file}")
            logger.info(f"[PROCESSED] Processed {len(results)} topics successfully")
            
        else:
            # Single topic processing
            content = fetcher.process_topic(args.topic)
            output_file = fetcher.save_content(content)
            
            logger.info(f"[SUCCESS] Educational content generated successfully!")
            logger.info(f"[SAVED] Saved to: {output_file}")
            logger.info(f"[TOPIC] Topic: {content.title}")
            logger.info(f"[OBJECTIVES] Learning objectives: {len(content.learning_objectives)}")
            logger.info(f"[RELATED] Related topics: {len(content.related_topics)}")
        
    except KeyboardInterrupt:
        logger.info("Processing interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
