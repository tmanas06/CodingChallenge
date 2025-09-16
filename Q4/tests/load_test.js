#!/usr/bin/env node
/**
 * Load Testing Script for Adaptive Learning Tracker
 * Simulates high load scenarios to test system performance
 */

const { performance } = require('perf_hooks');
const request = require('supertest');
const { app } = require('../adaptive_learning_tracker');

class LoadTester {
    constructor(app) {
        this.app = app;
        this.results = [];
        this.startTime = null;
        this.endTime = null;
    }

    async runLoadTest(config) {
        const {
            endpoint,
            method = 'GET',
            data = null,
            concurrency = 10,
            duration = 10000, // 10 seconds
            rampUp = 1000 // 1 second ramp up
        } = config;

        console.log(`🚀 Starting load test: ${method} ${endpoint}`);
        console.log(`📊 Concurrency: ${concurrency}, Duration: ${duration}ms`);
        
        this.startTime = performance.now();
        this.results = [];
        
        const promises = [];
        let requestCount = 0;
        
        // Ramp up phase
        const rampUpInterval = setInterval(() => {
            for (let i = 0; i < concurrency; i++) {
                promises.push(this.makeRequest(endpoint, method, data, requestCount++));
            }
        }, rampUp);
        
        // Stop after duration
        setTimeout(() => {
            clearInterval(rampUpInterval);
            this.endTime = performance.now();
        }, duration);
        
        // Wait for all requests to complete
        await Promise.allSettled(promises);
        
        return this.analyzeResults();
    }

    async makeRequest(endpoint, method, data, requestId) {
        const requestStart = performance.now();
        
        try {
            let req;
            if (method === 'GET') {
                req = request(this.app).get(endpoint);
            } else if (method === 'POST') {
                req = request(this.app).post(endpoint).send(data);
            } else if (method === 'PUT') {
                req = request(this.app).put(endpoint).send(data);
            } else if (method === 'DELETE') {
                req = request(this.app).delete(endpoint);
            }
            
            const response = await req;
            const requestEnd = performance.now();
            
            this.results.push({
                requestId,
                success: true,
                status: response.status,
                duration: requestEnd - requestStart,
                timestamp: requestStart,
                responseSize: JSON.stringify(response.body).length
            });
            
        } catch (error) {
            const requestEnd = performance.now();
            this.results.push({
                requestId,
                success: false,
                error: error.message,
                duration: requestEnd - requestStart,
                timestamp: requestStart
            });
        }
    }

    analyzeResults() {
        const totalDuration = this.endTime - this.startTime;
        const successful = this.results.filter(r => r.success);
        const failed = this.results.filter(r => !r.success);
        const durations = successful.map(r => r.duration);
        
        const stats = {
            total: this.results.length,
            successful: successful.length,
            failed: failed.length,
            successRate: (successful.length / this.results.length) * 100,
            totalDuration: totalDuration,
            requestsPerSecond: this.results.length / (totalDuration / 1000),
            avgResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
            minResponseTime: Math.min(...durations),
            maxResponseTime: Math.max(...durations),
            p50ResponseTime: this.percentile(durations, 50),
            p90ResponseTime: this.percentile(durations, 90),
            p95ResponseTime: this.percentile(durations, 95),
            p99ResponseTime: this.percentile(durations, 99)
        };
        
        return stats;
    }

    percentile(arr, p) {
        const sorted = arr.sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }

    printResults(stats) {
        console.log('\n📈 Load Test Results');
        console.log('==================');
        console.log(`Total Requests: ${stats.total}`);
        console.log(`Successful: ${stats.successful} (${stats.successRate.toFixed(2)}%)`);
        console.log(`Failed: ${stats.failed}`);
        console.log(`Duration: ${stats.totalDuration.toFixed(2)}ms`);
        console.log(`Requests/sec: ${stats.requestsPerSecond.toFixed(2)}`);
        console.log(`\nResponse Times:`);
        console.log(`  Average: ${stats.avgResponseTime.toFixed(2)}ms`);
        console.log(`  Min: ${stats.minResponseTime.toFixed(2)}ms`);
        console.log(`  Max: ${stats.maxResponseTime.toFixed(2)}ms`);
        console.log(`  P50: ${stats.p50ResponseTime.toFixed(2)}ms`);
        console.log(`  P90: ${stats.p90ResponseTime.toFixed(2)}ms`);
        console.log(`  P95: ${stats.p95ResponseTime.toFixed(2)}ms`);
        console.log(`  P99: ${stats.p99ResponseTime.toFixed(2)}ms`);
    }
}

// Test scenarios
const scenarios = [
    {
        name: 'Health Check Load Test',
        config: {
            endpoint: '/health',
            method: 'GET',
            concurrency: 50,
            duration: 10000
        }
    },
    {
        name: 'User Progress Load Test',
        config: {
            endpoint: '/api/progress/user1',
            method: 'GET',
            concurrency: 30,
            duration: 15000
        }
    },
    {
        name: 'Learning Path Load Test',
        config: {
            endpoint: '/api/learning-path/user1',
            method: 'GET',
            concurrency: 20,
            duration: 15000
        }
    },
    {
        name: 'Assessment Start Load Test',
        config: {
            endpoint: '/api/assessment/start',
            method: 'POST',
            data: { userId: 'user1', skillId: 'javascript_fundamentals' },
            concurrency: 10,
            duration: 20000
        }
    },
    {
        name: 'Bulk Operations Load Test',
        config: {
            endpoint: '/api/bulk/progress',
            method: 'POST',
            data: { userIds: Array.from({ length: 50 }, (_, i) => `user${i}`) },
            concurrency: 5,
            duration: 30000
        }
    },
    {
        name: 'System Health Load Test',
        config: {
            endpoint: '/api/system/health',
            method: 'GET',
            concurrency: 20,
            duration: 10000
        }
    }
];

async function runAllLoadTests() {
    const tester = new LoadTester(app);
    const allResults = [];
    
    console.log('🧪 Adaptive Learning Tracker Load Testing Suite');
    console.log('===============================================\n');
    
    for (const scenario of scenarios) {
        console.log(`\n🔍 Running: ${scenario.name}`);
        console.log('─'.repeat(50));
        
        const results = await tester.runLoadTest(scenario.config);
        tester.printResults(results);
        
        allResults.push({
            scenario: scenario.name,
            ...results
        });
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary
    console.log('\n📊 Overall Summary');
    console.log('==================');
    
    const totalRequests = allResults.reduce((sum, r) => sum + r.total, 0);
    const totalSuccessful = allResults.reduce((sum, r) => sum + r.successful, 0);
    const avgRPS = allResults.reduce((sum, r) => sum + r.requestsPerSecond, 0) / allResults.length;
    const avgResponseTime = allResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / allResults.length;
    
    console.log(`Total Requests Across All Tests: ${totalRequests}`);
    console.log(`Total Successful: ${totalSuccessful} (${(totalSuccessful/totalRequests*100).toFixed(2)}%)`);
    console.log(`Average RPS: ${avgRPS.toFixed(2)}`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    
    // Performance thresholds
    console.log('\n🎯 Performance Analysis');
    console.log('=======================');
    
    const slowTests = allResults.filter(r => r.avgResponseTime > 100);
    const lowSuccessTests = allResults.filter(r => r.successRate < 95);
    const lowRPSTests = allResults.filter(r => r.requestsPerSecond < 10);
    
    if (slowTests.length > 0) {
        console.log('⚠️  Slow Tests (>100ms avg response time):');
        slowTests.forEach(test => {
            console.log(`   - ${test.scenario}: ${test.avgResponseTime.toFixed(2)}ms`);
        });
    }
    
    if (lowSuccessTests.length > 0) {
        console.log('⚠️  Low Success Rate Tests (<95%):');
        lowSuccessTests.forEach(test => {
            console.log(`   - ${test.scenario}: ${test.successRate.toFixed(2)}%`);
        });
    }
    
    if (lowRPSTests.length > 0) {
        console.log('⚠️  Low Throughput Tests (<10 RPS):');
        lowRPSTests.forEach(test => {
            console.log(`   - ${test.scenario}: ${test.requestsPerSecond.toFixed(2)} RPS`);
        });
    }
    
    if (slowTests.length === 0 && lowSuccessTests.length === 0 && lowRPSTests.length === 0) {
        console.log('✅ All tests passed performance thresholds!');
    }
    
    console.log('\n🏁 Load testing completed!');
}

// Run the load tests
if (require.main === module) {
    runAllLoadTests().catch(console.error);
}

module.exports = { LoadTester, runAllLoadTests };
