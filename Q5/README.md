# Interactive Concept Visualization Tool

A comprehensive JavaScript web application that creates interactive visualizations for complex learning concepts using modern web technologies including Canvas API, WebGL, and SVG.

## 🚀 Features

### Core Visualization Modules
- **Algorithm Visualizer**: Interactive sorting and searching algorithms with step-by-step visualization
- **Physics Simulator**: Real-time physics simulations including pendulum, waves, and projectile motion
- **Math Grapher**: Real-time mathematical function plotting with parameter controls
- **Data Structure Explorer**: Interactive visualization of trees, graphs, and linked lists

### Learning Modes
- **Exploration**: Free-form learning with interactive controls
- **Guided Practice**: Step-by-step tutorials with hints and feedback
- **Assessment**: Interactive quizzes and challenges

### Advanced Features
- **Real-time Analytics**: Track learning progress, understanding scores, and performance metrics
- **Adaptive Learning**: Adjusts difficulty based on user performance
- **Session Management**: Complete learning session tracking and export
- **Accessibility**: Keyboard navigation and responsive design
- **Performance Monitoring**: Built-in performance tracking and optimization

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Canvas API, WebGL
- **Backend**: Node.js, Express.js
- **Visualization**: Custom Canvas renderers, Three.js for 3D graphics
- **Analytics**: Custom learning analytics engine
- **Caching**: In-memory cache with TTL and LRU eviction
- **Testing**: Jest for unit and integration testing

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Q5
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 Usage

### Basic Usage

1. **Select a Module**: Choose from available visualization modules
2. **Interact**: Use controls to manipulate visualizations
3. **Learn**: Follow guided tutorials or explore freely
4. **Track Progress**: Monitor your learning analytics
5. **Export Data**: Save your learning session data

### Available Modules

#### Algorithm Visualizer
- **Bubble Sort**: Step-by-step sorting visualization
- **Quick Sort**: Divide-and-conquer algorithm demonstration
- **Binary Search**: Efficient search algorithm visualization

#### Physics Simulator
- **Pendulum**: Interactive pendulum physics simulation
- **Wave Interference**: Wave superposition and interference patterns
- **Projectile Motion**: Trajectory and physics calculations

#### Math Grapher
- **Function Grapher**: Real-time mathematical function plotting
- **Parametric Curves**: Interactive parametric curve visualization

#### Data Structure Explorer
- **Binary Tree**: Tree traversal and manipulation
- **Graph Traversal**: BFS and DFS algorithms
- **Linked List**: List operations and traversal

### API Endpoints

#### Modules
- `GET /api/modules` - Get all available modules
- `GET /api/modules/:id` - Get specific module configuration

#### Sessions
- `POST /api/sessions` - Create new learning session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id/progress` - Update session progress
- `POST /api/sessions/:id/interactions` - Record interaction

#### Analytics
- `GET /api/analytics/:sessionId` - Get session analytics
- `GET /api/sessions/:id/export` - Export session data

#### System
- `GET /api/health` - System health check
- `GET /api/system/performance` - Performance metrics
- `GET /api/system/cache/stats` - Cache statistics

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run performance tests
npm run test:performance

# Run all tests including performance
npm run test:all
```

### Test Structure
- **Unit Tests**: Individual component testing
- **Integration Tests**: Module interaction testing
- **Performance Tests**: Load and stress testing
- **Visualization Tests**: Canvas and rendering testing

## 📊 Performance

### Benchmarks
- **Module Loading**: < 1 second for 12 modules
- **Session Creation**: < 10ms per session
- **Analytics Calculation**: < 100ms for complex sessions
- **Cache Operations**: < 1ms for 1000 operations
- **Memory Usage**: < 100MB for 1000 sessions

### Optimization Features
- **Caching**: LRU cache with TTL for improved performance
- **Lazy Loading**: Modules loaded on demand
- **Memory Management**: Automatic cleanup of old sessions
- **Performance Monitoring**: Real-time performance tracking

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=production
PORT=3000
CACHE_TTL=3600000
MAX_SESSIONS=1000
```

### Customization
- **Visualization Settings**: Modify colors, sizes, and animations
- **Learning Parameters**: Adjust difficulty curves and feedback
- **Performance Tuning**: Configure cache sizes and cleanup intervals

## 📈 Analytics

### Learning Metrics
- **Understanding Score**: 0-100% based on performance
- **Completion Rate**: Percentage of steps completed
- **Time Spent**: Total learning time per session
- **Mistakes Made**: Error tracking and analysis
- **Efficiency Score**: Performance per time unit

### Export Format
```json
{
  "session_id": "learn_session_001",
  "concept": "bubble_sort_algorithm",
  "interactions": 45,
  "time_spent_minutes": 12,
  "steps_completed": 8,
  "mistakes_made": 2,
  "understanding_score": 0.92,
  "feedback_provided": [
    "Great job identifying the swap operation!",
    "Remember: bubble sort compares adjacent elements"
  ]
}
```

## 🚀 Deployment

### Local Development
```bash
npm start
```

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t interactive-learning .
docker run -p 3000:3000 interactive-learning
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the test cases for examples

## 🔮 Future Enhancements

- **3D Visualizations**: WebGL-based 3D graphics
- **Machine Learning**: AI-powered learning recommendations
- **Collaborative Learning**: Multi-user sessions
- **Mobile App**: React Native mobile application
- **VR Support**: Virtual reality learning experiences

---

**Interactive Concept Visualization Tool** - Making complex concepts accessible through interactive learning experiences.
