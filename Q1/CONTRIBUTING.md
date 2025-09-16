# Contributing to Shape Analogy Generator

Thank you for your interest in contributing to the Shape Analogy Generator! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/shape-analogy-generator.git
   cd shape-analogy-generator
   ```
3. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ Development Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment**:
   ```bash
   cp env.example .env
   # Edit .env with your API token
   ```

3. **Run tests**:
   ```bash
   python -m pytest tests/ -v
   ```

## 📝 Making Changes

### Code Style
- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Write clear, descriptive variable names
- Add docstrings to functions and classes

### Testing
- Add tests for new functionality
- Ensure all tests pass before submitting
- Aim for good test coverage

### Documentation
- Update README.md if adding new features
- Add docstrings to new functions
- Update comments for complex logic

## 🧪 Testing Your Changes

Before submitting a pull request:

1. **Run the test suite**:
   ```bash
   python -m pytest tests/ -v
   ```

2. **Test the main script**:
   ```bash
   python shape_analogy.py --help
   python shape_analogy.py --n 1 --complexity beginner
   ```

3. **Check code quality**:
   ```bash
   python -m flake8 shape_analogy.py
   ```

## 📋 Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Create a pull request** with:
   - Clear description of changes
   - Reference to any related issues
   - Screenshots if UI changes

## 🐛 Reporting Issues

When reporting issues, please include:

- **Python version**
- **Operating system**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Error messages** (if any)

## 💡 Feature Requests

We welcome feature requests! Please:

1. **Check existing issues** first
2. **Describe the feature** clearly
3. **Explain the use case**
4. **Consider implementation complexity**

## 📚 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the golden rule

## 🤝 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing! 🎉
