# 🎯 Shape-Based Analogy Question Generator

A comprehensive Python tool that generates educational analogy questions focused on geometric shapes and spatial relationships, complete with visual representations using the Hugging Face API.

## 🚀 Quick Start

### 1. Installation
```bash
# Clone the repository
git clone [your-repo-link]
cd shape-analogy-generator

# Install dependencies
pip install -r requirements.txt
```

### 2. Setup API Token
```bash
# Get your token from: https://huggingface.co/settings/tokens
export HF_API_TOKEN="your_token_here"  # Linux/macOS
set HF_API_TOKEN=your_token_here       # Windows
```

### 3. Generate Analogies
```bash
# Generate 1 beginner analogy (default)
python shape_analogy.py

# Generate 5 intermediate analogies
python shape_analogy.py --n 5 --complexity intermediate

# Generate 10 advanced analogies with verbose output
python shape_analogy.py --n 10 --complexity advanced --verbose
```

## 📊 Sample Output

### Q1: Generated Analogy Example
```json
{
  "id": "analogy_001",
  "prompt": "Hexagon is to 6 sides as Octagon is to 8 sides",
  "model": "stabilityai/stable-diffusion-2-1",
  "seed": 5821,
  "created_at": "2025-09-16T13:02:15.100Z",
  "image_url": "output/images/analogy_001.png",
  "complexity_level": "intermediate",
  "estimated_time_minutes": 5,
  "tricky_questions": [
    "How many diagonals does a hexagon have?",
    "What is the sum of interior angles in an octagon?",
    "Which polygon has more symmetry axes: hexagon or octagon?"
  ]
}
```

## 🎯 Features

- **Shape Analogies**: Generate educational analogies comparing geometric shapes
- **Visual Generation**: Create PNG images using Hugging Face's Stable Diffusion
- **Multiple Complexity Levels**: Beginner, intermediate, and advanced difficulty
- **Enhanced Metadata**: Rich JSON output with questions, timing, and complexity info
- **Caching System**: Avoid regenerating identical images
- **Comprehensive Testing**: Unit tests and validation
- **Error Handling**: Robust error recovery and logging
- **Progress Tracking**: Real-time progress indicators

## 📋 Requirements

- Python 3.7+
- Hugging Face API token
- Internet connection for API calls

## 🔧 Command Line Arguments

| Argument | Type | Default | Description |
|----------|------|---------|-------------|
| `--n` | int | 1 | Number of analogies to generate |
| `--complexity` | str | beginner | Complexity level (beginner/intermediate/advanced) |
| `--verbose` | flag | False | Enable verbose logging |

## 📁 Project Structure

```
shape-analogy-generator/
├── shape_analogy.py              # Main generator script
├── requirements.txt              # Python dependencies
├── schema.json                   # JSON schema definition
├── README.md                     # This documentation
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── tests/
│   └── test_shape_analogy.py     # Unit tests
└── output/                       # Generated files
    ├── analogies.json            # Main output file
    ├── analogy_001.json          # Individual analogy files
    └── images/
        ├── analogy_001.png       # Generated images
        └── ...
```

## 🎓 Complexity Levels

### Beginner
- **Shapes**: Triangle, Square, Pentagon, Hexagon, Octagon
- **Relationships**: Basic sides, angles, symmetry
- **Time**: ~2 minutes per question

### Intermediate  
- **Shapes**: Heptagon, Nonagon, Decagon, Dodecagon
- **Relationships**: Diagonals, vertices, interior angles
- **Time**: ~4 minutes per question

### Advanced
- **Shapes**: Tridecagon, Tetradecagon, Pentadecagon, Icosagon
- **Relationships**: Complex mathematical properties
- **Time**: ~6 minutes per question

## 🧪 Testing

```bash
# Run all tests
python -m pytest tests/ -v

# Run specific test file
python tests/test_shape_analogy.py

# Run with coverage
python -m pytest tests/ --cov=shape_analogy --cov-report=html
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `HF_API_TOKEN` | Hugging Face API token | Yes |

### .env File Support

The generator supports `.env` files for easy configuration. Copy `env.example` to `.env` and customize:

```env
# Required
HF_API_TOKEN=your_hugging_face_token_here

# Optional overrides
DEFAULT_ANALOGIES=5
DEFAULT_COMPLEXITY=intermediate
LOG_LEVEL=DEBUG
VERBOSE_OUTPUT=true
```

## 🛠️ Troubleshooting

### Common Issues

1. **Missing API Token**
   ```
   Error: Missing HF_API_TOKEN environment variable
   ```
   **Solution**: Set your Hugging Face API token as shown in the setup section.

2. **API Rate Limiting**
   ```
   Warning: API request failed: 429 Too Many Requests
   ```
   **Solution**: The script automatically retries with backoff. Wait a few minutes and try again.

3. **Image Generation Fails**
   ```
   Error: Image generation failed for analogy_001, skipping
   ```
   **Solution**: Check your internet connection and API token validity.

### Debug Mode

Enable verbose logging for detailed information:

```bash
python shape_analogy.py --verbose
```

## 📝 API Usage and Licensing

### Hugging Face API
- **Model**: `stabilityai/stable-diffusion-2-1`
- **License**: CreativeML Open RAIL-M
- **Usage**: Educational and research purposes
- **Rate Limits**: Subject to Hugging Face's terms of service

### Generated Content
- **Images**: Generated using Stable Diffusion (CreativeML Open RAIL-M license)
- **Questions**: Original educational content
- **Metadata**: Structured data for educational use

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Hugging Face](https://huggingface.co/) for the Stable Diffusion API
- [Stability AI](https://stability.ai/) for the Stable Diffusion model
- The open-source community for various Python libraries

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the test cases for usage examples
3. Enable verbose logging for detailed error information
4. Check the generated log file: `shape_analogy.log`

---

**Happy Learning! 🎓**