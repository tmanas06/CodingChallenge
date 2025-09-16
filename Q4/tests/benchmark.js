#!/usr/bin/env node
/**
 * Benchmark Script for Adaptive Learning Tracker
 * Measures performance of core operations
 */

const { performance } = require('perf_hooks');
const { ProgressTracker, CacheManager, SpacedRepetitionAlgorithm, AssessmentEngine } = require('../adaptive_learning_tracker');

class BenchmarkSuite {
    constructor() {
        this.results = [];
        this.progressTracker = new ProgressTracker();
        this.cacheManager = new CacheManager();
        this.spacedRepetition = new SpacedRepetitionAlgorithm();
        this.assessmentEngine = new AssessmentEngine();
    }

    async runBenchmark(name, operation, iterations = 1000) {
        console.log(`🏃 Running benchmark: ${name}`);
        
        const times = [];
        
        // Warm up
        for (let i = 0; i < 10; i++) {
            try {
                await operation();
            } catch (error) {
                // Ignore warm-up errors
            }
        }
        
        // Benchmark
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            try {
                await operation();
                const end = performance.now();
                times.push(end - start);
            } catch (error) {
                // Record failed operations
                times.push(-1);
            }
        }
        
        const successfulTimes = times.filter(t => t > 0);
        const failedCount = times.filter(t => t === -1).length;
        
        const stats = {
            name,
            iterations,
            successful: successfulTimes.length,
            failed: failedCount,
            successRate: (successfulTimes.length / iterations) * 100,
            avgTime: successfulTimes.reduce((a, b) => a + b, 0) / successfulTimes.length,
            minTime: Math.min(...successfulTimes),
            maxTime: Math.max(...successfulTimes),
            p50: this.percentile(successfulTimes, 50),
            p90: this.percentile(successfulTimes, 90),
            p95: this.percentile(successfulTimes, 95),
            p99: this.percentile(successfulTimes, 99)
        };
        
        this.results.push(stats);
        return stats;
    }

    percentile(arr, p) {
        if (arr.length === 0) return 0;
        const sorted = arr.sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }

    printResults() {
        console.log('\n📊 Benchmark Results');
        console.log('====================');
        
        this.results.forEach(result => {
            console.log(`\n${result.name}:`);
            console.log(`  Iterations: ${result.iterations}`);
            console.log(`  Success Rate: ${result.successRate.toFixed(2)}%`);
            console.log(`  Average Time: ${result.avgTime.toFixed(2)}ms`);
            console.log(`  Min Time: ${result.minTime.toFixed(2)}ms`);
            console.log(`  Max Time: ${result.maxTime.toFixed(2)}ms`);
            console.log(`  P50: ${result.p50.toFixed(2)}ms`);
            console.log(`  P90: ${result.p90.toFixed(2)}ms`);
            console.log(`  P95: ${result.p95.toFixed(2)}ms`);
            console.log(`  P99: ${result.p99.toFixed(2)}ms`);
        });
    }

    async runAllBenchmarks() {
        console.log('🚀 Adaptive Learning Tracker Benchmark Suite');
        console.log('============================================\n');

        // Cache benchmarks
        await this.runBenchmark('Cache Set Operations', async () => {
            const key = `benchmark_${Math.random()}`;
            await this.cacheManager.set(key, { data: 'test' });
        }, 1000);

        await this.runBenchmark('Cache Get Operations', async () => {
            const key = `benchmark_${Math.random()}`;
            await this.cacheManager.get(key);
        }, 1000);

        await this.runBenchmark('Cache Hit Operations', async () => {
            const key = 'hit_test_key';
            await this.cacheManager.set(key, { data: 'test' });
            await this.cacheManager.get(key);
        }, 1000);

        // Spaced repetition benchmarks
        await this.runBenchmark('Spaced Repetition Calculations', async () => {
            this.spacedRepetition.calculateNextReview(4, 7, 2.5);
        }, 1000);

        // User progress benchmarks
        await this.runBenchmark('Get User Progress', async () => {
            await this.progressTracker.getUserProgress(`benchmark_user_${Math.random()}`);
        }, 100);

        await this.runBenchmark('Save User Progress', async () => {
            const userId = `benchmark_user_${Math.random()}`;
            const progress = await this.progressTracker.getUserProgress(userId);
            progress.total_time_spent += 60;
            await this.progressTracker.saveUserProgress(userId, progress);
        }, 100);

        // Assessment benchmarks
        await this.runBenchmark('Assessment Generation', async () => {
            const skill = {
                skill_id: 'test_skill',
                title: 'Test Skill',
                assessments: [{
                    type: 'multiple_choice',
                    questions: [{
                        question: 'Test question?',
                        options: ['A', 'B', 'C', 'D'],
                        correct_answer: 0,
                        explanation: 'Test explanation'
                    }]
                }]
            };
            this.assessmentEngine.generateAssessment(skill, 1);
        }, 1000);

        await this.runBenchmark('Assessment Evaluation', async () => {
            const assessment = {
                type: 'multiple_choice',
                correct_answer: 0,
                time_limit: 60
            };
            this.assessmentEngine.evaluateResponse(assessment, 0, 30);
        }, 1000);

        // Performance calculation benchmarks
        await this.runBenchmark('Performance Calculations', async () => {
            this.assessmentEngine.calculatePerformance(85, 30, 60);
        }, 1000);

        // Concurrent operations benchmark
        await this.runBenchmark('Concurrent Cache Operations', async () => {
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(this.cacheManager.set(`concurrent_${i}`, { data: i }));
                promises.push(this.cacheManager.get(`concurrent_${i}`));
            }
            await Promise.all(promises);
        }, 100);

        // Memory usage benchmark
        await this.runBenchmark('Memory Intensive Operations', async () => {
            const largeData = {
                data: 'x'.repeat(1000), // 1KB
                timestamp: Date.now(),
                array: Array.from({ length: 100 }, (_, i) => i)
            };
            
            for (let i = 0; i < 10; i++) {
                await this.cacheManager.set(`memory_${i}`, largeData);
            }
        }, 50);

        this.printResults();
        this.printSummary();
    }

    printSummary() {
        console.log('\n📈 Performance Summary');
        console.log('======================');
        
        const avgTimes = this.results.map(r => r.avgTime);
        const fastest = Math.min(...avgTimes);
        const slowest = Math.max(...avgTimes);
        
        console.log(`Fastest Operation: ${fastest.toFixed(2)}ms`);
        console.log(`Slowest Operation: ${slowest.toFixed(2)}ms`);
        console.log(`Performance Range: ${(slowest / fastest).toFixed(2)}x`);
        
        // Performance thresholds
        const slowOperations = this.results.filter(r => r.avgTime > 10);
        const verySlowOperations = this.results.filter(r => r.avgTime > 100);
        
        if (verySlowOperations.length > 0) {
            console.log('\n⚠️  Very Slow Operations (>100ms):');
            verySlowOperations.forEach(op => {
                console.log(`   - ${op.name}: ${op.avgTime.toFixed(2)}ms`);
            });
        } else if (slowOperations.length > 0) {
            console.log('\n⚠️  Slow Operations (>10ms):');
            slowOperations.forEach(op => {
                console.log(`   - ${op.name}: ${op.avgTime.toFixed(2)}ms`);
            });
        } else {
            console.log('\n✅ All operations are performing well (<10ms average)');
        }
        
        // Success rate analysis
        const lowSuccessOperations = this.results.filter(r => r.successRate < 95);
        if (lowSuccessOperations.length > 0) {
            console.log('\n⚠️  Low Success Rate Operations (<95%):');
            lowSuccessOperations.forEach(op => {
                console.log(`   - ${op.name}: ${op.successRate.toFixed(2)}%`);
            });
        } else {
            console.log('\n✅ All operations have high success rates (>95%)');
        }
        
        // Recommendations
        console.log('\n💡 Recommendations');
        console.log('==================');
        
        if (slowOperations.length > 0) {
            console.log('- Consider optimizing slow operations for better performance');
        }
        
        if (lowSuccessOperations.length > 0) {
            console.log('- Review error handling for operations with low success rates');
        }
        
        const cacheOps = this.results.filter(r => r.name.includes('Cache'));
        const avgCacheTime = cacheOps.reduce((sum, r) => sum + r.avgTime, 0) / cacheOps.length;
        
        if (avgCacheTime > 1) {
            console.log('- Cache operations could be optimized for better performance');
        }
        
        console.log('- Consider implementing connection pooling for database operations');
        console.log('- Monitor memory usage in production with large datasets');
        console.log('- Implement caching strategies for frequently accessed data');
    }
}

// Run benchmarks
async function runBenchmarks() {
    const suite = new BenchmarkSuite();
    await suite.runAllBenchmarks();
}

// Run if called directly
if (require.main === module) {
    runBenchmarks().catch(console.error);
}

module.exports = { BenchmarkSuite, runBenchmarks };
