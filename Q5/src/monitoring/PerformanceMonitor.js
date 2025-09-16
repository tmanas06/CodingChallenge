/**
 * Performance Monitor
 * Tracks performance metrics and system health
 */

class PerformanceMonitor {
    constructor(options = {}) {
        this.options = {
            maxSamples: 1000,
            sampleInterval: 1000, // 1 second
            ...options
        };
        
        this.metrics = {
            responseTime: [],
            memoryUsage: [],
            cpuUsage: [],
            activeConnections: 0,
            errorRate: 0,
            throughput: 0
        };
        
        this.timers = new Map();
        this.counters = new Map();
        this.gauges = new Map();
        
        this.startMonitoring();
    }

    // Start a timer
    startTimer(name) {
        this.timers.set(name, {
            start: process.hrtime.bigint(),
            end: null,
            duration: null
        });
    }

    // End a timer
    endTimer(name) {
        const timer = this.timers.get(name);
        if (!timer) {
            console.warn(`Timer ${name} not found`);
            return null;
        }
        
        timer.end = process.hrtime.bigint();
        timer.duration = Number(timer.end - timer.start) / 1000000; // Convert to milliseconds
        
        // Store in metrics
        if (!this.metrics.responseTime) {
            this.metrics.responseTime = [];
        }
        this.metrics.responseTime.push(timer.duration);
        
        // Keep only recent samples
        if (this.metrics.responseTime.length > this.options.maxSamples) {
            this.metrics.responseTime.shift();
        }
        
        return timer.duration;
    }

    // Increment a counter
    incrementCounter(name, value = 1) {
        const current = this.counters.get(name) || 0;
        this.counters.set(name, current + value);
    }

    // Decrement a counter
    decrementCounter(name, value = 1) {
        const current = this.counters.get(name) || 0;
        this.counters.set(name, Math.max(0, current - value));
    }

    // Set a gauge value
    setGauge(name, value) {
        this.gauges.set(name, value);
    }

    // Get a gauge value
    getGauge(name) {
        return this.gauges.get(name) || 0;
    }

    // Record response time
    recordResponseTime(duration) {
        this.metrics.responseTime.push(duration);
        
        if (this.metrics.responseTime.length > this.options.maxSamples) {
            this.metrics.responseTime.shift();
        }
    }

    // Record memory usage
    recordMemoryUsage() {
        const memUsage = process.memoryUsage();
        this.metrics.memoryUsage.push({
            timestamp: Date.now(),
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external
        });
        
        if (this.metrics.memoryUsage.length > this.options.maxSamples) {
            this.metrics.memoryUsage.shift();
        }
    }

    // Record CPU usage
    recordCpuUsage() {
        const cpuUsage = process.cpuUsage();
        this.metrics.cpuUsage.push({
            timestamp: Date.now(),
            user: cpuUsage.user,
            system: cpuUsage.system
        });
        
        if (this.metrics.cpuUsage.length > this.options.maxSamples) {
            this.metrics.cpuUsage.shift();
        }
    }

    // Start monitoring
    startMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.recordMemoryUsage();
            this.recordCpuUsage();
            this.updateSystemMetrics();
        }, this.options.sampleInterval);
    }

    // Stop monitoring
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    // Update system metrics
    updateSystemMetrics() {
        // Update active connections
        this.metrics.activeConnections = this.getGauge('active_connections');
        
        // Update error rate
        const totalRequests = this.getCounter('total_requests');
        const totalErrors = this.getCounter('total_errors');
        this.metrics.errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
        
        // Update throughput
        this.metrics.throughput = this.getGauge('requests_per_second');
    }

    // Get counter value
    getCounter(name) {
        return this.counters.get(name) || 0;
    }

    // Get performance statistics
    getStats() {
        const responseTimes = this.metrics.responseTime;
        const memoryUsages = this.metrics.memoryUsage;
        
        return {
            responseTime: {
                average: this.calculateAverage(responseTimes),
                min: Math.min(...responseTimes),
                max: Math.max(...responseTimes),
                p95: this.calculatePercentile(responseTimes, 95),
                p99: this.calculatePercentile(responseTimes, 99)
            },
            memory: {
                current: process.memoryUsage(),
                average: this.calculateAverage(memoryUsages.map(m => m.heapUsed)),
                peak: Math.max(...memoryUsages.map(m => m.heapUsed))
            },
            system: {
                uptime: process.uptime(),
                activeConnections: this.metrics.activeConnections,
                errorRate: this.metrics.errorRate,
                throughput: this.metrics.throughput
            },
            counters: Object.fromEntries(this.counters),
            gauges: Object.fromEntries(this.gauges)
        };
    }

    // Calculate average
    calculateAverage(values) {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    // Calculate percentile
    calculatePercentile(values, percentile) {
        if (values.length === 0) return 0;
        
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
    }

    // Get health status
    getHealthStatus() {
        const stats = this.getStats();
        const issues = [];
        
        // Check response time
        if (stats.responseTime.average > 1000) {
            issues.push('High response time');
        }
        
        // Check memory usage
        const memUsage = process.memoryUsage();
        const memUsagePercent = memUsage.heapUsed / memUsage.heapTotal;
        if (memUsagePercent > 0.9) {
            issues.push('High memory usage');
        }
        
        // Check error rate
        if (stats.system.errorRate > 0.1) {
            issues.push('High error rate');
        }
        
        return {
            status: issues.length === 0 ? 'healthy' : 'degraded',
            issues,
            timestamp: new Date().toISOString()
        };
    }

    // Get performance report
    getPerformanceReport() {
        const stats = this.getStats();
        const health = this.getHealthStatus();
        
        return {
            timestamp: new Date().toISOString(),
            health,
            metrics: stats,
            recommendations: this.generateRecommendations(stats)
        };
    }

    // Generate performance recommendations
    generateRecommendations(stats) {
        const recommendations = [];
        
        if (stats.responseTime.average > 500) {
            recommendations.push({
                type: 'performance',
                message: 'Consider optimizing response time',
                priority: 'medium'
            });
        }
        
        if (stats.memory.average > 100 * 1024 * 1024) { // 100MB
            recommendations.push({
                type: 'memory',
                message: 'Consider implementing memory optimization',
                priority: 'low'
            });
        }
        
        if (stats.system.errorRate > 0.05) {
            recommendations.push({
                type: 'reliability',
                message: 'Investigate error sources',
                priority: 'high'
            });
        }
        
        return recommendations;
    }

    // Reset all metrics
    reset() {
        this.metrics = {
            responseTime: [],
            memoryUsage: [],
            cpuUsage: [],
            activeConnections: 0,
            errorRate: 0,
            throughput: 0
        };
        
        this.timers.clear();
        this.counters.clear();
        this.gauges.clear();
    }

    // Export metrics
    exportMetrics() {
        return {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            counters: Object.fromEntries(this.counters),
            gauges: Object.fromEntries(this.gauges),
            stats: this.getStats()
        };
    }

    // Cleanup
    cleanup() {
        this.stopMonitoring();
        this.reset();
    }
}

module.exports = PerformanceMonitor;
