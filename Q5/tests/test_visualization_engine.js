/**
 * Test Suite for Visualization Engine
 */

const VisualizationEngine = require('../src/core/VisualizationEngine');

describe('VisualizationEngine', () => {
    let engine;

    beforeEach(() => {
        engine = new VisualizationEngine();
    });

    afterEach(() => {
        if (engine) {
            engine.cleanup();
        }
    });

    test('should initialize with empty modules', () => {
        expect(engine.modules).toBeDefined();
        expect(engine.activeVisualizations).toBeDefined();
    });

    test('should get available modules', async () => {
        const modules = await engine.getAvailableModules();
        
        expect(Array.isArray(modules)).toBe(true);
        expect(modules.length).toBeGreaterThan(0);
        
        // Check module structure
        modules.forEach(module => {
            expect(module).toHaveProperty('id');
            expect(module).toHaveProperty('name');
            expect(module).toHaveProperty('type');
            expect(module).toHaveProperty('description');
            expect(module).toHaveProperty('difficulty');
            expect(module).toHaveProperty('estimatedTime');
        });
    });

    test('should get module configuration', async () => {
        const config = await engine.getModuleConfig('bubble_sort');
        
        expect(config).toHaveProperty('id', 'bubble_sort');
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('type', 'algorithm');
        expect(config).toHaveProperty('features');
        expect(config).toHaveProperty('requirements');
        expect(config).toHaveProperty('examples');
        expect(Array.isArray(config.features)).toBe(true);
        expect(Array.isArray(config.requirements)).toBe(true);
        expect(Array.isArray(config.examples)).toBe(true);
    });

    test('should throw error for non-existent module', async () => {
        await expect(engine.getModuleConfig('non_existent_module'))
            .rejects.toThrow('Module non_existent_module not found');
    });

    test('should create visualization for valid module', async () => {
        const mockCanvas = {
            getContext: jest.fn().mockReturnValue({
                fillRect: jest.fn(),
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 0
            }),
            width: 800,
            height: 600
        };

        const result = await engine.createVisualization('bubble_sort', mockCanvas);
        
        expect(result).toHaveProperty('sessionId');
        expect(result).toHaveProperty('visualization');
        expect(result).toHaveProperty('config');
        expect(result.config.id).toBe('bubble_sort');
    });

    test('should throw error for invalid module', async () => {
        const mockCanvas = { getContext: jest.fn() };
        
        await expect(engine.createVisualization('invalid_module', mockCanvas))
            .rejects.toThrow('Module invalid_module not found');
    });

    test('should get visualization by session ID', async () => {
        const mockCanvas = { getContext: jest.fn() };
        const result = await engine.createVisualization('bubble_sort', mockCanvas);
        
        const visualization = engine.getVisualization(result.sessionId);
        expect(visualization).toBeDefined();
    });

    test('should destroy visualization', async () => {
        const mockCanvas = { getContext: jest.fn() };
        const result = await engine.createVisualization('bubble_sort', mockCanvas);
        
        engine.destroyVisualization(result.sessionId);
        
        const visualization = engine.getVisualization(result.sessionId);
        expect(visualization).toBeUndefined();
    });

    test('should have correct module types', async () => {
        const modules = await engine.getAvailableModules();
        const types = [...new Set(modules.map(m => m.type))];
        
        expect(types).toContain('algorithm');
        expect(types).toContain('physics');
        expect(types).toContain('mathematics');
        expect(types).toContain('data_structure');
    });

    test('should have difficulty levels', async () => {
        const modules = await engine.getAvailableModules();
        const difficulties = [...new Set(modules.map(m => m.difficulty))];
        
        expect(difficulties).toContain('beginner');
        expect(difficulties).toContain('intermediate');
        expect(difficulties).toContain('advanced');
    });
});
