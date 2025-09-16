/**
 * Performance Test Suite
 */

const VisualizationEngine = require('../src/core/VisualizationEngine');
const LearningAnalytics = require('../src/analytics/LearningAnalytics');
const SessionManager = require('../src/session/SessionManager');
const CacheManager = require('../src/cache/CacheManager');
const PerformanceMonitor = require('../src/monitoring/PerformanceMonitor');

describe('Performance Tests', () => {
    let engine, analytics, sessionManager, cacheManager, performanceMonitor;

    beforeEach(() => {
        engine = new VisualizationEngine();
        analytics = new LearningAnalytics();
        sessionManager = new SessionManager();
        cacheManager = new CacheManager();
        performanceMonitor = new PerformanceMonitor();
    });

    afterEach(() => {
        if (engine) engine.cleanup();
        if (analytics) analytics.clear();
        if (sessionManager) sessionManager.clear();
        if (cacheManager) cacheManager.destroy();
        if (performanceMonitor) performanceMonitor.cleanup();
    });

    test('should load modules within acceptable time', async () => {
        const startTime = Date.now();
        const modules = await engine.getAvailableModules();
        const loadTime = Date.now() - startTime;
        
        expect(loadTime).toBeLessThan(1000); // Should load within 1 second
        expect(modules.length).toBeGreaterThan(0);
    });

    test('should create sessions efficiently', () => {
        const startTime = Date.now();
        
        for (let i = 0; i < 100; i++) {
            sessionManager.createSession(`module_${i}`, `user_${i}`, 'exploration');
        }
        
        const createTime = Date.now() - startTime;
        expect(createTime).toBeLessThan(1000); // Should create 100 sessions within 1 second
    });

    test('should handle concurrent session operations', async () => {
        const promises = [];
        const startTime = Date.now();
        
        // Create multiple sessions concurrently
        for (let i = 0; i < 50; i++) {
            promises.push(
                new Promise(resolve => {
                    const session = sessionManager.createSession(`module_${i}`, `user_${i}`, 'exploration');
                    resolve(session);
                })
            );
        }
        
        await Promise.all(promises);
        const concurrentTime = Date.now() - startTime;
        
        expect(concurrentTime).toBeLessThan(2000); // Should handle 50 concurrent operations within 2 seconds
    });

    test('should cache operations efficiently', () => {
        const startTime = Date.now();
        
        // Perform cache operations
        for (let i = 0; i < 1000; i++) {
            cacheManager.set(`key_${i}`, { data: `value_${i}` });
        }
        
        for (let i = 0; i < 1000; i++) {
            cacheManager.get(`key_${i}`);
        }
        
        const cacheTime = Date.now() - startTime;
        expect(cacheTime).toBeLessThan(500); // Should handle 2000 cache operations within 500ms
    });

    test('should record interactions efficiently', () => {
        const session = analytics.createSession('perf_session', 'test_module', 'user_1', 'exploration');
        const startTime = Date.now();
        
        // Record many interactions
        for (let i = 0; i < 1000; i++) {
            analytics.recordInteraction(session.sessionId, {
                type: 'test_interaction',
                data: { step: i },
                success: true,
                responseTime: Math.random() * 100
            });
        }
        
        const recordTime = Date.now() - startTime;
        expect(recordTime).toBeLessThan(1000); // Should record 1000 interactions within 1 second
    });

    test('should calculate analytics efficiently', () => {
        // Create test data
        const session = analytics.createSession('analytics_session', 'test_module', 'user_1', 'exploration');
        
        for (let i = 0; i < 100; i++) {
            analytics.recordInteraction(session.sessionId, {
                type: 'step_complete',
                success: Math.random() > 0.2, // 80% success rate
                responseTime: Math.random() * 500
            });
        }
        
        analytics.updateProgress(session.sessionId, {
            currentStep: 80,
            totalSteps: 100
        });
        
        const startTime = Date.now();
        const sessionAnalytics = analytics.getSessionAnalytics(session.sessionId);
        const analyticsTime = Date.now() - startTime;
        
        expect(analyticsTime).toBeLessThan(100); // Should calculate analytics within 100ms
        expect(sessionAnalytics).toHaveProperty('understandingScore');
        expect(sessionAnalytics).toHaveProperty('performance');
    });

    test('should monitor performance without overhead', () => {
        const startTime = Date.now();
        
        // Perform operations while monitoring
        performanceMonitor.startTimer('test_operation');
        
        // Simulate work
        const workStart = Date.now();
        while (Date.now() - workStart < 10) {
            // Busy wait for 10ms
        }
        
        performanceMonitor.endTimer('test_operation');
        
        const monitorTime = Date.now() - startTime;
        expect(monitorTime).toBeLessThan(50); // Monitoring should add minimal overhead
        
        const stats = performanceMonitor.getStats();
        expect(stats.responseTime.average).toBeGreaterThan(0);
    });

    test('should handle memory efficiently', () => {
        const initialMemory = process.memoryUsage();
        
        // Create many sessions and interactions
        for (let i = 0; i < 1000; i++) {
            const session = analytics.createSession(`memory_session_${i}`, 'test_module', `user_${i}`, 'exploration');
            
            for (let j = 0; j < 10; j++) {
                analytics.recordInteraction(session.sessionId, {
                    type: 'memory_test',
                    data: { iteration: j },
                    success: true
                });
            }
        }
        
        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        
        // Memory increase should be reasonable (less than 100MB)
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    test('should handle large datasets', async () => {
        const startTime = Date.now();
        
        // Create large dataset
        const largeData = Array.from({ length: 10000 }, (_, i) => ({
            id: i,
            value: Math.random() * 1000,
            timestamp: Date.now()
        }));
        
        // Store in cache
        cacheManager.set('large_dataset', largeData);
        
        // Retrieve and process
        const retrievedData = cacheManager.get('large_dataset');
        const processedData = retrievedData.filter(item => item.value > 500);
        
        const processTime = Date.now() - startTime;
        
        expect(processTime).toBeLessThan(2000); // Should handle large dataset within 2 seconds
        expect(processedData.length).toBeGreaterThan(0);
    });

    test('should maintain performance under load', async () => {
        const startTime = Date.now();
        const promises = [];
        
        // Simulate concurrent load
        for (let i = 0; i < 20; i++) {
            promises.push(
                new Promise(async resolve => {
                    const session = sessionManager.createSession(`load_test_${i}`, 'test_module', `user_${i}`, 'exploration');
                    
                    for (let j = 0; j < 50; j++) {
                        analytics.recordInteraction(session.sessionId, {
                            type: 'load_test',
                            data: { iteration: j },
                            success: true,
                            responseTime: Math.random() * 100
                        });
                    }
                    
                    resolve(session);
                })
            );
        }
        
        await Promise.all(promises);
        const loadTime = Date.now() - startTime;
        
        expect(loadTime).toBeLessThan(5000); // Should handle load within 5 seconds
        
        const stats = sessionManager.getSessionStats();
        expect(stats.total).toBe(20);
    });

    test('should cleanup resources efficiently', () => {
        const startTime = Date.now();
        
        // Create resources
        for (let i = 0; i < 100; i++) {
            analytics.createSession(`cleanup_session_${i}`, 'test_module', `user_${i}`, 'exploration');
            cacheManager.set(`cleanup_key_${i}`, { data: `value_${i}` });
        }
        
        // Cleanup
        analytics.clear();
        cacheManager.clear();
        
        const cleanupTime = Date.now() - startTime;
        expect(cleanupTime).toBeLessThan(1000); // Should cleanup within 1 second
        
        expect(analytics.sessions.size).toBe(0);
        expect(cacheManager.size()).toBe(0);
    });
});
