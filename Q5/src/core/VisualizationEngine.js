/**
 * Core Visualization Engine
 * Handles Canvas API, WebGL, and SVG rendering for interactive visualizations
 */

const AlgorithmVisualizer = require('../modules/AlgorithmVisualizer');
const PhysicsSimulator = require('../modules/PhysicsSimulator');
const MathGrapher = require('../modules/MathGrapher');
const DataStructureExplorer = require('../modules/DataStructureExplorer');
const CacheManager = require('../cache/CacheManager');

class VisualizationEngine {
    constructor() {
        this.modules = new Map();
        this.activeVisualizations = new Map();
        this.cacheManager = new CacheManager();
        this.initializeModules();
    }

    initializeModules() {
        // Register available visualization modules
        this.modules.set('bubble_sort', {
            id: 'bubble_sort',
            name: 'Bubble Sort Algorithm',
            type: 'algorithm',
            description: 'Interactive visualization of bubble sort algorithm',
            difficulty: 'beginner',
            estimatedTime: 10,
            class: AlgorithmVisualizer
        });

        this.modules.set('quick_sort', {
            id: 'quick_sort',
            name: 'Quick Sort Algorithm',
            type: 'algorithm',
            description: 'Interactive visualization of quick sort algorithm',
            difficulty: 'intermediate',
            estimatedTime: 15,
            class: AlgorithmVisualizer
        });

        this.modules.set('binary_search', {
            id: 'binary_search',
            name: 'Binary Search Algorithm',
            type: 'algorithm',
            description: 'Interactive visualization of binary search algorithm',
            difficulty: 'beginner',
            estimatedTime: 8,
            class: AlgorithmVisualizer
        });

        this.modules.set('pendulum', {
            id: 'pendulum',
            name: 'Pendulum Physics',
            type: 'physics',
            description: 'Interactive pendulum simulation with physics',
            difficulty: 'intermediate',
            estimatedTime: 12,
            class: PhysicsSimulator
        });

        this.modules.set('wave_interference', {
            id: 'wave_interference',
            name: 'Wave Interference',
            type: 'physics',
            description: 'Interactive wave interference simulation',
            difficulty: 'advanced',
            estimatedTime: 20,
            class: PhysicsSimulator
        });

        this.modules.set('projectile_motion', {
            id: 'projectile_motion',
            name: 'Projectile Motion',
            type: 'physics',
            description: 'Interactive projectile motion simulation',
            difficulty: 'intermediate',
            estimatedTime: 15,
            class: PhysicsSimulator
        });

        this.modules.set('function_grapher', {
            id: 'function_grapher',
            name: 'Mathematical Function Grapher',
            type: 'mathematics',
            description: 'Real-time mathematical function plotting',
            difficulty: 'beginner',
            estimatedTime: 10,
            class: MathGrapher
        });

        this.modules.set('parametric_curves', {
            id: 'parametric_curves',
            name: 'Parametric Curves',
            type: 'mathematics',
            description: 'Interactive parametric curve visualization',
            difficulty: 'intermediate',
            estimatedTime: 15,
            class: MathGrapher
        });

        this.modules.set('binary_tree', {
            id: 'binary_tree',
            name: 'Binary Tree Explorer',
            type: 'data_structure',
            description: 'Interactive binary tree visualization and manipulation',
            difficulty: 'intermediate',
            estimatedTime: 15,
            class: DataStructureExplorer
        });

        this.modules.set('graph_traversal', {
            id: 'graph_traversal',
            name: 'Graph Traversal',
            type: 'data_structure',
            description: 'Interactive graph traversal algorithms (BFS, DFS)',
            difficulty: 'intermediate',
            estimatedTime: 18,
            class: DataStructureExplorer
        });

        this.modules.set('linked_list', {
            id: 'linked_list',
            name: 'Linked List Explorer',
            type: 'data_structure',
            description: 'Interactive linked list visualization and operations',
            difficulty: 'beginner',
            estimatedTime: 12,
            class: DataStructureExplorer
        });
    }

    async getAvailableModules() {
        const cacheKey = 'available_modules';
        let modules = await this.cacheManager.get(cacheKey);
        
        if (!modules) {
            modules = Array.from(this.modules.values()).map(module => ({
                id: module.id,
                name: module.name,
                type: module.type,
                description: module.description,
                difficulty: module.difficulty,
                estimatedTime: module.estimatedTime
            }));
            
            await this.cacheManager.set(cacheKey, modules, 3600); // Cache for 1 hour
        }
        
        return modules;
    }

    async getModuleConfig(moduleId) {
        const cacheKey = `module_config_${moduleId}`;
        let config = await this.cacheManager.get(cacheKey);
        
        if (!config) {
            const module = this.modules.get(moduleId);
            if (!module) {
                throw new Error(`Module ${moduleId} not found`);
            }
            
            config = {
                id: module.id,
                name: module.name,
                type: module.type,
                description: module.description,
                difficulty: module.difficulty,
                estimatedTime: module.estimatedTime,
                learningModes: ['exploration', 'guided', 'assessment'],
                features: this.getModuleFeatures(module.type),
                requirements: this.getModuleRequirements(module.type),
                examples: this.getModuleExamples(moduleId)
            };
            
            await this.cacheManager.set(cacheKey, config, 1800); // Cache for 30 minutes
        }
        
        return config;
    }

    getModuleFeatures(type) {
        const features = {
            algorithm: [
                'Step-by-step visualization',
                'Speed control',
                'Comparison with other algorithms',
                'Performance metrics',
                'Interactive controls'
            ],
            physics: [
                'Real-time simulation',
                'Parameter adjustment',
                'Multiple scenarios',
                'Data logging',
                '3D visualization'
            ],
            mathematics: [
                'Real-time plotting',
                'Parameter sliders',
                'Multiple function types',
                'Export capabilities',
                'Interactive exploration'
            ],
            data_structure: [
                'Interactive manipulation',
                'Animation controls',
                'Multiple operations',
                'Visual feedback',
                'Step-by-step guidance'
            ]
        };
        
        return features[type] || [];
    }

    getModuleRequirements(type) {
        const requirements = {
            algorithm: ['Basic programming knowledge', 'Understanding of arrays'],
            physics: ['Basic physics concepts', 'Mathematical understanding'],
            mathematics: ['Basic algebra', 'Function concepts'],
            data_structure: ['Basic programming', 'Understanding of data organization']
        };
        
        return requirements[type] || [];
    }

    getModuleExamples(moduleId) {
        const examples = {
            bubble_sort: [
                { input: [64, 34, 25, 12, 22, 11, 90], description: 'Random array' },
                { input: [1, 2, 3, 4, 5], description: 'Already sorted' },
                { input: [5, 4, 3, 2, 1], description: 'Reverse sorted' }
            ],
            quick_sort: [
                { input: [10, 7, 8, 9, 1, 5], description: 'Random array' },
                { input: [1, 2, 3, 4, 5], description: 'Already sorted' },
                { input: [5, 4, 3, 2, 1], description: 'Reverse sorted' }
            ],
            binary_search: [
                { array: [1, 3, 5, 7, 9, 11, 13, 15], target: 7, description: 'Find 7 in sorted array' },
                { array: [2, 4, 6, 8, 10, 12, 14, 16], target: 5, description: 'Search for non-existent element' }
            ],
            pendulum: [
                { length: 1, angle: 30, mass: 1, description: 'Simple pendulum' },
                { length: 2, angle: 45, mass: 2, description: 'Heavy pendulum' }
            ],
            function_grapher: [
                { function: 'sin(x)', range: [-2*Math.PI, 2*Math.PI], description: 'Sine wave' },
                { function: 'x^2', range: [-5, 5], description: 'Parabola' },
                { function: 'log(x)', range: [0.1, 10], description: 'Logarithmic function' }
            ]
        };
        
        return examples[moduleId] || [];
    }

    async createVisualization(moduleId, canvas, options = {}) {
        const module = this.modules.get(moduleId);
        if (!module) {
            throw new Error(`Module ${moduleId} not found`);
        }

        const VisualizationClass = module.class;
        const visualization = new VisualizationClass(canvas, options);
        
        const sessionId = options.sessionId || `viz_${Date.now()}`;
        this.activeVisualizations.set(sessionId, visualization);
        
        return {
            sessionId,
            visualization,
            config: await this.getModuleConfig(moduleId)
        };
    }

    getVisualization(sessionId) {
        return this.activeVisualizations.get(sessionId);
    }

    destroyVisualization(sessionId) {
        const visualization = this.activeVisualizations.get(sessionId);
        if (visualization) {
            visualization.destroy();
            this.activeVisualizations.delete(sessionId);
        }
    }

    async cleanup() {
        // Clean up all active visualizations
        for (const [sessionId, visualization] of this.activeVisualizations) {
            visualization.destroy();
        }
        this.activeVisualizations.clear();
        
        // Clear cache
        await this.cacheManager.clear();
    }
}

module.exports = VisualizationEngine;
