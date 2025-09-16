/**
 * Error Recovery Manager
 * Handles errors and implements recovery strategies
 */

class ErrorRecovery {
    constructor(options = {}) {
        this.options = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2,
            ...options
        };
        
        this.retryCounts = new Map();
        this.errorStats = {
            totalErrors: 0,
            recoveredErrors: 0,
            failedRecoveries: 0,
            errorTypes: {}
        };
    }

    // Retry a function with exponential backoff
    async retry(fn, context = '', retryOptions = {}) {
        const options = { ...this.options, ...retryOptions };
        const retryKey = `${context}_${Date.now()}`;
        
        for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
            try {
                const result = await fn();
                this.recordSuccess(retryKey);
                return result;
            } catch (error) {
                this.recordError(error, context);
                
                if (attempt === options.maxRetries) {
                    this.recordFailedRecovery(retryKey);
                    throw error;
                }
                
                const delay = this.calculateDelay(attempt, options);
                await this.sleep(delay);
            }
        }
    }

    // Calculate delay with exponential backoff
    calculateDelay(attempt, options) {
        const delay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt);
        return Math.min(delay, options.maxDelay);
    }

    // Sleep utility
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Record successful operation
    recordSuccess(retryKey) {
        this.retryCounts.delete(retryKey);
        this.errorStats.recoveredErrors++;
    }

    // Record error
    recordError(error, context) {
        this.errorStats.totalErrors++;
        
        const errorType = error.constructor.name;
        this.errorStats.errorTypes[errorType] = 
            (this.errorStats.errorTypes[errorType] || 0) + 1;
        
        console.error(`Error in ${context}:`, error.message);
    }

    // Record failed recovery
    recordFailedRecovery(retryKey) {
        this.errorStats.failedRecoveries++;
        this.retryCounts.delete(retryKey);
    }

    // Handle API errors
    handleApiError(error, req, res) {
        const errorType = error.constructor.name;
        let statusCode = 500;
        let message = 'Internal server error';
        
        switch (errorType) {
            case 'ValidationError':
                statusCode = 400;
                message = 'Validation error';
                break;
            case 'NotFoundError':
                statusCode = 404;
                message = 'Resource not found';
                break;
            case 'UnauthorizedError':
                statusCode = 401;
                message = 'Unauthorized';
                break;
            case 'ForbiddenError':
                statusCode = 403;
                message = 'Forbidden';
                break;
            case 'TimeoutError':
                statusCode = 408;
                message = 'Request timeout';
                break;
            default:
                if (error.statusCode) {
                    statusCode = error.statusCode;
                    message = error.message;
                }
        }
        
        res.status(statusCode).json({
            error: message,
            type: errorType,
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
        });
    }

    // Handle visualization errors
    handleVisualizationError(error, sessionId) {
        console.error(`Visualization error for session ${sessionId}:`, error);
        
        // Try to recover visualization state
        return this.retry(async () => {
            // Recovery logic would go here
            return { recovered: true, sessionId };
        }, `visualization_${sessionId}`);
    }

    // Handle data corruption
    handleDataCorruption(error, dataType) {
        console.error(`Data corruption in ${dataType}:`, error);
        
        // Try to recover from backup or regenerate data
        return this.retry(async () => {
            // Data recovery logic would go here
            return { recovered: true, dataType };
        }, `data_recovery_${dataType}`);
    }

    // Handle network errors
    handleNetworkError(error, operation) {
        console.error(`Network error during ${operation}:`, error);
        
        return this.retry(async () => {
            // Network retry logic would go here
            return { recovered: true, operation };
        }, `network_${operation}`);
    }

    // Get error statistics
    getErrorStats() {
        return {
            ...this.errorStats,
            recoveryRate: this.errorStats.totalErrors > 0 ? 
                this.errorStats.recoveredErrors / this.errorStats.totalErrors : 0
        };
    }

    // Reset error statistics
    resetStats() {
        this.errorStats = {
            totalErrors: 0,
            recoveredErrors: 0,
            failedRecoveries: 0,
            errorTypes: {}
        };
        this.retryCounts.clear();
    }

    // Create error with context
    createError(message, type = 'Error', context = {}) {
        const error = new Error(message);
        error.type = type;
        error.context = context;
        error.timestamp = new Date().toISOString();
        return error;
    }

    // Validate data integrity
    validateData(data, schema) {
        try {
            // Basic validation logic
            if (!data || typeof data !== 'object') {
                throw this.createError('Invalid data format', 'ValidationError');
            }
            
            // Schema validation would go here
            return { valid: true, data };
        } catch (error) {
            return { valid: false, error };
        }
    }

    // Cleanup resources
    cleanup() {
        this.retryCounts.clear();
        this.resetStats();
    }
}

module.exports = ErrorRecovery;
