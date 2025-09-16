/**
 * Performance and Load Testing Suite
 * Tests system performance under various load conditions
 */

const { performance } = require('perf_hooks');
const request = require('supertest');
const { app, ProgressTracker, CacheManager, PerformanceMonitor } = require('../adaptive_learning_tracker');

describe('Performance Tests', () => {
    let progressTracker;
    let cacheManager;
    let performanceMonitor;

    beforeEach(() => {
        progressTracker = new ProgressTracker();
        cacheManager = new CacheManager();
        performanceMonitor = new PerformanceMonitor();
    });

    describe('Cache Performance', () => {
        test('should handle high cache hit rates efficiently', async () => {
            const testData = { test: 'data', timestamp: Date.now() };
            const key = 'test_key';
            
            // Warm up cache
            await cacheManager.set(key, testData);
            
            const iterations = 1000;
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                await cacheManager.get(key);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            const avgTime = duration / iterations;
            
            expect(avgTime).toBeLessThan(1); // Should be under 1ms per operation
            expect(cacheManager.getStats().hitRate).toBe('100.00%');
        });

        test('should handle cache misses efficiently', async () => {
            const iterations = 1000;
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                await cacheManager.get(`nonexistent_key_${i}`);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            const avgTime = duration / iterations;
            
            expect(avgTime).toBeLessThan(1); // Should be under 1ms per operation
        });

        test('should handle large cache sizes', async () => {
            const largeData = {
                data: 'x'.repeat(10000), // 10KB of data
                timestamp: Date.now()
            };
            
            const iterations = 100;
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                await cacheManager.set(`large_key_${i}`, largeData);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            const avgTime = duration / iterations;
            
            expect(avgTime).toBeLessThan(10); // Should be under 10ms per operation
            expect(cacheManager.getStats().size).toBe(iterations);
        });
    });

    describe('API Performance', () => {
        test('should handle concurrent user progress requests', async () => {
            const userIds = Array.from({ length: 50 }, (_, i) => `user_${i}`);
            const startTime = performance.now();
            
            const promises = userIds.map(userId => 
                request(app).get(`/api/progress/${userId}`)
            );
            
            const responses = await Promise.all(promises);
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(responses).toHaveLength(50);
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
            
            // All responses should be successful
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });
        });

        test('should handle bulk operations efficiently', async () => {
            const userIds = Array.from({ length: 100 }, (_, i) => `bulk_user_${i}`);
            const startTime = performance.now();
            
            const response = await request(app)
                .post('/api/bulk/progress')
                .send({ userIds });
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(response.status).toBe(200);
            expect(response.body.successful).toBe(100);
            expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
        });

        test('should handle assessment operations under load', async () => {
            const userId = 'load_test_user';
            const skillId = 'javascript_fundamentals';
            
            // Start multiple assessments concurrently
            const promises = Array.from({ length: 20 }, () => 
                request(app)
                    .post('/api/assessment/start')
                    .send({ userId, skillId })
            );
            
            const startTime = performance.now();
            const responses = await Promise.allSettled(promises);
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            const successful = responses.filter(r => r.status === 'fulfilled').length;
            expect(successful).toBeGreaterThan(0);
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        });
    });

    describe('Memory Performance', () => {
        test('should not leak memory with repeated operations', async () => {
            const initialMemory = process.memoryUsage();
            
            // Perform many operations
            for (let i = 0; i < 1000; i++) {
                await progressTracker.getUserProgress(`memory_test_user_${i}`);
                await cacheManager.set(`memory_test_key_${i}`, { data: i });
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            
            // Memory increase should be reasonable (less than 50MB)
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        });

        test('should handle cache cleanup efficiently', async () => {
            // Fill cache with many entries
            for (let i = 0; i < 1000; i++) {
                await cacheManager.set(`cleanup_test_${i}`, { data: i }, 100); // 100ms TTL
            }
            
            const startTime = performance.now();
            const cleared = await cacheManager.clearExpired();
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(cleared).toBe(1000);
            expect(duration).toBeLessThan(100); // Should complete within 100ms
        });
    });

    describe('Database Performance', () => {
        test('should handle rapid user progress updates', async () => {
            const userId = 'rapid_update_user';
            const startTime = performance.now();
            
            // Simulate rapid updates
            for (let i = 0; i < 100; i++) {
                const progress = await progressTracker.getUserProgress(userId);
                progress.total_time_spent += 60; // Add 1 minute
                await progressTracker.saveUserProgress(userId, progress);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            const avgTime = duration / 100;
            
            expect(avgTime).toBeLessThan(50); // Should be under 50ms per operation
        });

        test('should handle large skill trees efficiently', async () => {
            // Create a large skill tree
            const largeSkillTree = {};
            for (let i = 0; i < 1000; i++) {
                largeSkillTree[`skill_${i}`] = {
                    skill_id: `skill_${i}`,
                    title: `Skill ${i}`,
                    prerequisites: i > 0 ? [`skill_${i-1}`] : [],
                    difficulty_level: Math.floor(Math.random() * 5) + 1,
                    mastery_threshold: 0.85
                };
            }
            
            const startTime = performance.now();
            
            // Simulate loading and processing large skill tree
            const skillIds = Object.keys(largeSkillTree);
            const availableSkills = skillIds.filter(id => 
                largeSkillTree[id].prerequisites.length === 0
            );
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(availableSkills.length).toBe(1); // Only first skill should be available
            expect(duration).toBeLessThan(100); // Should complete within 100ms
        });
    });

    describe('Concurrent Operations', () => {
        test('should handle mixed concurrent operations', async () => {
            const operations = [];
            
            // Mix of different operations
            for (let i = 0; i < 50; i++) {
                operations.push(progressTracker.getUserProgress(`concurrent_user_${i}`));
                operations.push(cacheManager.set(`concurrent_key_${i}`, { data: i }));
                operations.push(cacheManager.get(`concurrent_key_${i}`));
            }
            
            const startTime = performance.now();
            const results = await Promise.allSettled(operations);
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            const successful = results.filter(r => r.status === 'fulfilled').length;
            expect(successful).toBeGreaterThan(100); // Most operations should succeed
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        });

        test('should handle cache operations under concurrent load', async () => {
            const operations = [];
            
            // Mix of cache operations
            for (let i = 0; i < 200; i++) {
                operations.push(cacheManager.set(`concurrent_cache_${i}`, { data: i }));
                operations.push(cacheManager.get(`concurrent_cache_${i}`));
                operations.push(cacheManager.delete(`concurrent_cache_${i}`));
            }
            
            const startTime = performance.now();
            await Promise.allSettled(operations);
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
        });
    });

    describe('Error Recovery Performance', () => {
        test('should handle retry operations efficiently', async () => {
            const { ErrorRecoveryManager } = require('../adaptive_learning_tracker');
            const errorRecovery = new ErrorRecoveryManager();
            
            let attemptCount = 0;
            const failingOperation = () => {
                attemptCount++;
                if (attemptCount < 3) {
                    throw new Error('Simulated failure');
                }
                return 'success';
            };
            
            const startTime = performance.now();
            const result = await errorRecovery.executeWithRetry(failingOperation, 'test_retry');
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(result).toBe('success');
            expect(attemptCount).toBe(3);
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds (with retries)
        });
    });

    describe('Performance Monitoring', () => {
        test('should track performance metrics accurately', () => {
            const operation = 'test_operation';
            
            // Simulate some operations
            for (let i = 0; i < 10; i++) {
                performanceMonitor.startTimer(operation);
                // Simulate work
                const start = performance.now();
                while (performance.now() - start < 1) { /* busy wait 1ms */ }
                performanceMonitor.endTimer(operation);
            }
            
            const stats = performanceMonitor.getStats(operation);
            expect(stats).toBeDefined();
            expect(stats.count).toBe(10);
            expect(stats.avg).toBeGreaterThan(0);
            expect(stats.min).toBeGreaterThan(0);
            expect(stats.max).toBeGreaterThan(0);
        });
    });

    describe('Scalability Tests', () => {
        test('should handle increasing user load', async () => {
            const userCounts = [10, 50, 100, 200];
            const results = [];
            
            for (const count of userCounts) {
                const userIds = Array.from({ length: count }, (_, i) => `scalability_user_${i}`);
                const startTime = performance.now();
                
                const promises = userIds.map(userId => 
                    progressTracker.getUserProgress(userId)
                );
                
                await Promise.all(promises);
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                results.push({ count, duration, avgPerUser: duration / count });
            }
            
            // Performance should scale reasonably
            results.forEach(result => {
                expect(result.avgPerUser).toBeLessThan(100); // Under 100ms per user
            });
        });

        test('should handle increasing cache size', async () => {
            const cacheSizes = [100, 500, 1000, 2000];
            const results = [];
            
            for (const size of cacheSizes) {
                // Clear cache
                await cacheManager.clear();
                
                const startTime = performance.now();
                
                // Fill cache
                for (let i = 0; i < size; i++) {
                    await cacheManager.set(`size_test_${i}`, { data: i });
                }
                
                // Test retrieval
                for (let i = 0; i < size; i++) {
                    await cacheManager.get(`size_test_${i}`);
                }
                
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                results.push({ size, duration, avgPerOperation: duration / (size * 2) });
            }
            
            // Performance should remain reasonable even with large cache
            results.forEach(result => {
                expect(result.avgPerOperation).toBeLessThan(5); // Under 5ms per operation
            });
        });
    });
});

// Load testing utilities
class LoadTester {
    constructor(app) {
        this.app = app;
        this.results = [];
    }

    async runLoadTest(endpoint, method = 'GET', data = null, concurrency = 10, duration = 10000) {
        const startTime = Date.now();
        const promises = [];
        
        const makeRequest = async () => {
            const requestStart = Date.now();
            try {
                let req;
                if (method === 'GET') {
                    req = request(this.app).get(endpoint);
                } else if (method === 'POST') {
                    req = request(this.app).post(endpoint).send(data);
                }
                
                const response = await req;
                const requestEnd = Date.now();
                
                this.results.push({
                    success: true,
                    status: response.status,
                    duration: requestEnd - requestStart,
                    timestamp: requestStart
                });
            } catch (error) {
                const requestEnd = Date.now();
                this.results.push({
                    success: false,
                    error: error.message,
                    duration: requestEnd - requestStart,
                    timestamp: requestStart
                });
            }
        };
        
        // Start concurrent requests
        const interval = setInterval(() => {
            for (let i = 0; i < concurrency; i++) {
                promises.push(makeRequest());
            }
        }, 100);
        
        // Stop after duration
        setTimeout(() => {
            clearInterval(interval);
        }, duration);
        
        await Promise.all(promises);
        
        return this.analyzeResults();
    }

    analyzeResults() {
        const successful = this.results.filter(r => r.success);
        const failed = this.results.filter(r => !r.success);
        const durations = successful.map(r => r.duration);
        
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);
        
        return {
            total: this.results.length,
            successful: successful.length,
            failed: failed.length,
            successRate: (successful.length / this.results.length) * 100,
            avgDuration,
            minDuration,
            maxDuration,
            requestsPerSecond: this.results.length / ((Date.now() - this.results[0]?.timestamp) / 1000)
        };
    }
}

module.exports = { LoadTester };
