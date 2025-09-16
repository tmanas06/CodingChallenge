#!/usr/bin/env python3
"""
Comprehensive test suite for Educational Content Fetcher
Tests all functionality including caching, error recovery, and scalability
"""

import unittest
import json
import tempfile
import os
import sys
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock
import requests

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from educational_content_fetcher import EducationalContentFetcher, EducationalContent

class TestEducationalContentFetcher(unittest.TestCase):
    """Test cases for EducationalContentFetcher class"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.fetcher = EducationalContentFetcher(cache_enabled=False)
        self.fetcher.output_dir = Path(self.temp_dir)
        self.fetcher.images_dir = self.fetcher.output_dir / "images"
        self.fetcher.packages_dir = self.fetcher.output_dir / "packages"
        self.fetcher.images_dir.mkdir(exist_ok=True)
        self.fetcher.packages_dir.mkdir(exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_educational_content_creation(self):
        """Test EducationalContent dataclass creation"""
        content = EducationalContent(
            id="test-id",
            title="Test Topic",
            description="Test description",
            page_url="https://example.com",
            image_url="test.jpg",
            license="CC BY-SA 4.0",
            attribution="Test Attribution",
            learning_objectives=["Learn something"],
            difficulty_level="high_school",
            related_topics=["Related Topic"],
            created_at="2024-01-01T00:00:00Z"
        )
        
        self.assertEqual(content.title, "Test Topic")
        self.assertEqual(content.difficulty_level, "high_school")
        self.assertEqual(len(content.learning_objectives), 1)
    
    def test_cache_key_generation(self):
        """Test cache key generation"""
        key1 = self.fetcher.get_cache_key("photosynthesis", "content")
        key2 = self.fetcher.get_cache_key("photosynthesis", "content")
        key3 = self.fetcher.get_cache_key("mitochondria", "content")
        
        self.assertEqual(key1, key2)  # Same input should generate same key
        self.assertNotEqual(key1, key3)  # Different input should generate different key
        self.assertEqual(len(key1), 32)  # MD5 hash length
    
    def test_topic_mappings(self):
        """Test topic-specific mappings"""
        # Test known topic
        self.assertIn("photosynthesis", self.fetcher.topic_mappings)
        self.assertIn("learning_objectives", self.fetcher.topic_mappings["photosynthesis"])
        self.assertIn("difficulty_level", self.fetcher.topic_mappings["photosynthesis"])
        
        # Test unknown topic
        self.assertNotIn("unknown_topic", self.fetcher.topic_mappings)
    
    @patch('requests.get')
    def test_fetch_wikipedia_content_success(self, mock_get):
        """Test successful Wikipedia content fetching"""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "query": {
                "pages": {
                    "123": {
                        "extract": "Photosynthesis is the process...",
                        "fullurl": "https://en.wikipedia.org/wiki/Photosynthesis",
                        "original": {
                            "source": "https://example.com/image.jpg"
                        }
                    }
                }
            }
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        description, image_url, page_url, license_info = self.fetcher.fetch_wikipedia_content("Photosynthesis")
        
        self.assertIn("Photosynthesis", description)
        self.assertIn("https://example.com/image.jpg", image_url)
        self.assertIn("wikipedia.org", page_url)
        self.assertEqual(license_info, "CC BY-SA 4.0")
    
    @patch('requests.get')
    def test_fetch_wikipedia_content_failure(self, mock_get):
        """Test Wikipedia content fetching with API failure"""
        # Mock API failure
        mock_get.side_effect = requests.exceptions.RequestException("API Error")
        
        description, image_url, page_url, license_info = self.fetcher.fetch_wikipedia_content("Unknown Topic")
        
        self.assertIn("Educational content about Unknown Topic", description)
        self.assertIsNone(image_url)
        self.assertIn("wikipedia.org", page_url)
    
    def test_generate_fallback_content(self):
        """Test fallback content generation"""
        description, image_url, page_url, license_info = self.fetcher._generate_fallback_content("Test Topic")
        
        self.assertIn("Educational content about Test Topic", description)
        self.assertIn("wikipedia.org", page_url)
        self.assertEqual(license_info, "CC BY-SA 4.0")
    
    def test_create_educational_diagram(self):
        """Test educational diagram creation"""
        diagram_path = self.fetcher._create_educational_diagram("Test Topic")
        
        self.assertTrue(os.path.exists(diagram_path))
        with open(diagram_path, 'r') as f:
            content = f.read()
            self.assertIn("EDUCATIONAL DIAGRAM", content)
            self.assertIn("Test Topic", content)
    
    def test_build_educational_metadata_known_topic(self):
        """Test metadata building for known topic"""
        content = self.fetcher.build_educational_metadata(
            "Photosynthesis",
            "Test description",
            "test.jpg",
            "https://example.com",
            "CC BY-SA 4.0"
        )
        
        self.assertEqual(content.title, "Photosynthesis")
        self.assertEqual(content.difficulty_level, "high_school")
        self.assertGreater(len(content.learning_objectives), 3)
        self.assertIn("Cell Biology", content.related_topics)
        self.assertEqual(content.educational_value, 8)
    
    def test_build_educational_metadata_unknown_topic(self):
        """Test metadata building for unknown topic"""
        content = self.fetcher.build_educational_metadata(
            "Unknown Topic",
            "Test description",
            "test.jpg",
            "https://example.com",
            "CC BY-SA 4.0"
        )
        
        self.assertEqual(content.title, "Unknown Topic")
        self.assertEqual(content.difficulty_level, "high_school")
        self.assertEqual(len(content.learning_objectives), 4)
        self.assertEqual(content.educational_value, 6)
    
    def test_save_content(self):
        """Test content saving to JSON file"""
        content = EducationalContent(
            id="test-id",
            title="Test Topic",
            description="Test description",
            page_url="https://example.com",
            image_url="test.jpg",
            license="CC BY-SA 4.0",
            attribution="Test Attribution",
            learning_objectives=["Learn something"],
            difficulty_level="high_school",
            related_topics=["Related Topic"],
            created_at="2024-01-01T00:00:00Z"
        )
        
        output_file = self.fetcher.save_content(content)
        
        self.assertTrue(os.path.exists(output_file))
        with open(output_file, 'r') as f:
            data = json.load(f)
            self.assertEqual(data["title"], "Test Topic")
            self.assertEqual(data["id"], "test-id")
    
    def test_save_batch_results(self):
        """Test batch results saving"""
        contents = [
            EducationalContent(
                id="test-id-1",
                title="Topic 1",
                description="Description 1",
                page_url="https://example1.com",
                image_url="test1.jpg",
                license="CC BY-SA 4.0",
                attribution="Test Attribution",
                learning_objectives=["Learn 1"],
                difficulty_level="high_school",
                related_topics=["Related 1"],
                created_at="2024-01-01T00:00:00Z"
            ),
            EducationalContent(
                id="test-id-2",
                title="Topic 2",
                description="Description 2",
                page_url="https://example2.com",
                image_url="test2.jpg",
                license="CC BY-SA 4.0",
                attribution="Test Attribution",
                learning_objectives=["Learn 2"],
                difficulty_level="middle_school",
                related_topics=["Related 2"],
                created_at="2024-01-01T00:00:00Z"
            )
        ]
        
        output_file = self.fetcher.save_batch_results(contents)
        
        self.assertTrue(os.path.exists(output_file))
        with open(output_file, 'r') as f:
            data = json.load(f)
            self.assertEqual(len(data), 2)
            self.assertEqual(data[0]["title"], "Topic 1")
            self.assertEqual(data[1]["title"], "Topic 2")
    
    @patch('requests.get')
    def test_download_image_success(self, mock_get):
        """Test successful image download"""
        # Mock successful image download
        mock_response = MagicMock()
        mock_response.content = b"fake image data"
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        image_path = self.fetcher.download_image("https://example.com/image.jpg", "Test Topic")
        
        self.assertTrue(os.path.exists(image_path))
        with open(image_path, 'rb') as f:
            self.assertEqual(f.read(), b"fake image data")
    
    def test_download_image_failure(self):
        """Test image download failure"""
        # Test with invalid URL
        image_path = self.fetcher.download_image("invalid_url", "Test Topic")
        
        # Should create educational diagram as fallback
        self.assertTrue(os.path.exists(image_path))
        self.assertIn("diagram", image_path)
    
    def test_process_topics_batch(self):
        """Test batch processing of multiple topics"""
        topics = ["Photosynthesis", "Mitochondria", "DNA Structure"]
        
        with patch.object(self.fetcher, 'process_topic') as mock_process:
            mock_content = EducationalContent(
                id="test-id",
                title="Test Topic",
                description="Test description",
                page_url="https://example.com",
                image_url="test.jpg",
                license="CC BY-SA 4.0",
                attribution="Test Attribution",
                learning_objectives=["Learn something"],
                difficulty_level="high_school",
                related_topics=["Related Topic"],
                created_at="2024-01-01T00:00:00Z"
            )
            mock_process.return_value = mock_content
            
            results = self.fetcher.process_topics_batch(topics)
            
            self.assertEqual(len(results), 3)
            self.assertEqual(mock_process.call_count, 3)
    
    def test_json_schema_validation(self):
        """Test JSON schema validation"""
        # Load schema
        with open("schema.json") as f:
            schema = json.load(f)
        
        # Test valid content
        valid_content = {
            "id": "test-id",
            "title": "Test Topic",
            "description": "This is a test description for educational content",
            "page_url": "https://example.com",
            "image_url": "test.jpg",
            "license": "CC BY-SA 4.0",
            "attribution": "Test Attribution",
            "learning_objectives": [
                "Understand the concept of test topic",
                "Identify key features of test topic",
                "Explain the importance of test topic"
            ],
            "difficulty_level": "high_school",
            "related_topics": ["Topic 1", "Topic 2"],
            "created_at": "2024-01-01T00:00:00Z",
            "source": "wikipedia",
            "image_quality": "high",
            "educational_value": 8
        }
        
        from jsonschema import validate
        try:
            validate(instance=valid_content, schema=schema)
            self.assertTrue(True)  # Validation passed
        except Exception as e:
            self.fail(f"Valid content failed validation: {e}")
        
        # Test invalid content (missing required field)
        invalid_content = valid_content.copy()
        del invalid_content["title"]
        
        with self.assertRaises(Exception):
            validate(instance=invalid_content, schema=schema)

class TestCaching(unittest.TestCase):
    """Test caching functionality"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.fetcher = EducationalContentFetcher(cache_enabled=True)
        self.fetcher.cache_dir = Path(self.temp_dir)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_cache_content_and_retrieve(self):
        """Test caching and retrieving content"""
        cache_key = "test_key"
        test_data = {"test": "data"}
        
        # Cache content
        self.fetcher.cache_content(cache_key, test_data)
        
        # Retrieve content
        retrieved_data = self.fetcher.is_cached(cache_key)
        
        self.assertIsNotNone(retrieved_data)
        self.assertEqual(retrieved_data, test_data)
    
    def test_cache_expiry(self):
        """Test cache expiry functionality"""
        cache_key = "test_key"
        test_data = {"test": "data"}
        
        # Cache content
        self.fetcher.cache_content(cache_key, test_data)
        
        # Manually set old timestamp to simulate expiry
        cache_file = self.fetcher.cache_dir / f"{cache_key}.json"
        with open(cache_file, 'r') as f:
            cache_data = json.load(f)
        cache_data['cached_at'] = 0  # Very old timestamp
        with open(cache_file, 'w') as f:
            json.dump(cache_data, f)
        
        # Try to retrieve expired content
        retrieved_data = self.fetcher.is_cached(cache_key)
        
        self.assertIsNone(retrieved_data)  # Should be None due to expiry

class TestErrorRecovery(unittest.TestCase):
    """Test error recovery and fallback mechanisms"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.fetcher = EducationalContentFetcher(cache_enabled=False)
        self.fetcher.output_dir = Path(self.temp_dir)
        self.fetcher.images_dir = self.fetcher.output_dir / "images"
        self.fetcher.packages_dir = self.fetcher.output_dir / "packages"
        self.fetcher.images_dir.mkdir(exist_ok=True)
        self.fetcher.packages_dir.mkdir(exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    @patch('requests.get')
    def test_network_error_recovery(self, mock_get):
        """Test recovery from network errors"""
        # Mock network error
        mock_get.side_effect = requests.exceptions.ConnectionError("Network error")
        
        # Should not raise exception, should return fallback content
        description, image_url, page_url, license_info = self.fetcher.fetch_wikipedia_content("Test Topic")
        
        self.assertIn("Educational content about Test Topic", description)
        self.assertIsNone(image_url)
    
    def test_invalid_topic_handling(self):
        """Test handling of invalid or empty topics"""
        # Test with empty topic
        content = self.fetcher.build_educational_metadata("", "Description", None, "URL", "License")
        self.assertEqual(content.title, "")
        
        # Test with None topic
        content = self.fetcher.build_educational_metadata(None, "Description", None, "URL", "License")
        self.assertIsNone(content.title)

class TestScalability(unittest.TestCase):
    """Test scalability considerations"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.fetcher = EducationalContentFetcher(cache_enabled=True)
        self.fetcher.output_dir = Path(self.temp_dir)
        self.fetcher.images_dir = self.fetcher.output_dir / "images"
        self.fetcher.packages_dir = self.fetcher.output_dir / "packages"
        self.fetcher.images_dir.mkdir(exist_ok=True)
        self.fetcher.packages_dir.mkdir(exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_large_batch_processing(self):
        """Test processing large batch of topics"""
        # Create large list of topics
        topics = [f"Topic {i}" for i in range(50)]
        
        with patch.object(self.fetcher, 'process_topic') as mock_process:
            mock_content = EducationalContent(
                id="test-id",
                title="Test Topic",
                description="Test description",
                page_url="https://example.com",
                image_url="test.jpg",
                license="CC BY-SA 4.0",
                attribution="Test Attribution",
                learning_objectives=["Learn something"],
                difficulty_level="high_school",
                related_topics=["Related Topic"],
                created_at="2024-01-01T00:00:00Z"
            )
            mock_process.return_value = mock_content
            
            # Process large batch
            results = self.fetcher.process_topics_batch(topics)
            
            self.assertEqual(len(results), 50)
            self.assertEqual(mock_process.call_count, 50)
    
    def test_memory_efficiency(self):
        """Test memory efficiency with large content"""
        # Create content with large description
        large_description = "A" * 10000  # 10KB description
        
        content = self.fetcher.build_educational_metadata(
            "Large Topic",
            large_description,
            "test.jpg",
            "https://example.com",
            "CC BY-SA 4.0"
        )
        
        # Should handle large content without issues
        self.assertEqual(len(content.description), 10000)
        self.assertIsNotNone(content.id)

if __name__ == "__main__":
    # Set up test environment
    os.environ["UNSPLASH_ACCESS_KEY"] = "test_key"
    os.environ["PEXELS_API_KEY"] = "test_key"
    
    # Run tests
    unittest.main(verbosity=2)
