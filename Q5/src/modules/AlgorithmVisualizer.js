/**
 * Algorithm Visualizer Module
 * Interactive visualization of sorting and searching algorithms
 */

class AlgorithmVisualizer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {
            width: 800,
            height: 400,
            barWidth: 20,
            barSpacing: 2,
            animationSpeed: 100,
            colors: {
                default: '#3498db',
                comparing: '#e74c3c',
                sorted: '#2ecc71',
                pivot: '#f39c12',
                target: '#9b59b6'
            },
            ...options
        };
        
        this.setupCanvas();
        this.reset();
    }

    setupCanvas() {
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    reset() {
        this.data = [];
        this.originalData = [];
        this.currentStep = 0;
        this.totalSteps = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.comparisons = 0;
        this.swaps = 0;
        this.highlightedIndices = [];
        this.algorithm = null;
        this.callbacks = {
            onStep: null,
            onComplete: null,
            onComparison: null,
            onSwap: null
        };
    }

    generateRandomData(size = 20, min = 10, max = 200) {
        this.data = Array.from({ length: size }, () => 
            Math.floor(Math.random() * (max - min + 1)) + min
        );
        this.originalData = [...this.data];
        this.render();
    }

    setData(data) {
        this.data = [...data];
        this.originalData = [...data];
        this.render();
    }

    // Bubble Sort Implementation
    async bubbleSort() {
        this.algorithm = 'bubble_sort';
        this.isRunning = true;
        this.comparisons = 0;
        this.swaps = 0;
        
        const n = this.data.length;
        
        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                if (!this.isRunning) return;
                
                // Highlight comparing elements
                this.highlightedIndices = [j, j + 1];
                this.comparisons++;
                this.callbacks.onComparison?.(j, j + 1, this.comparisons);
                this.render();
                await this.delay();
                
                if (this.data[j] > this.data[j + 1]) {
                    // Swap elements
                    [this.data[j], this.data[j + 1]] = [this.data[j + 1], this.data[j]];
                    this.swaps++;
                    this.callbacks.onSwap?.(j, j + 1, this.swaps);
                    this.render();
                    await this.delay();
                }
            }
            // Mark sorted element
            this.highlightedIndices = [n - 1 - i];
            this.render();
        }
        
        this.isRunning = false;
        this.highlightedIndices = [];
        this.callbacks.onComplete?.({ comparisons: this.comparisons, swaps: this.swaps });
        this.render();
    }

    // Quick Sort Implementation
    async quickSort(low = 0, high = this.data.length - 1) {
        if (this.algorithm !== 'quick_sort') {
            this.algorithm = 'quick_sort';
            this.isRunning = true;
            this.comparisons = 0;
            this.swaps = 0;
        }
        
        if (low < high) {
            const pivotIndex = await this.partition(low, high);
            await this.quickSort(low, pivotIndex - 1);
            await this.quickSort(pivotIndex + 1, high);
        }
        
        if (low === 0 && high === this.data.length - 1) {
            this.isRunning = false;
            this.highlightedIndices = [];
            this.callbacks.onComplete?.({ comparisons: this.comparisons, swaps: this.swaps });
            this.render();
        }
    }

    async partition(low, high) {
        const pivot = this.data[high];
        let i = low - 1;
        
        for (let j = low; j < high; j++) {
            if (!this.isRunning) return i + 1;
            
            this.highlightedIndices = [j, high];
            this.comparisons++;
            this.callbacks.onComparison?.(j, high, this.comparisons);
            this.render();
            await this.delay();
            
            if (this.data[j] < pivot) {
                i++;
                [this.data[i], this.data[j]] = [this.data[j], this.data[i]];
                this.swaps++;
                this.callbacks.onSwap?.(i, j, this.swaps);
                this.render();
                await this.delay();
            }
        }
        
        [this.data[i + 1], this.data[high]] = [this.data[high], this.data[i + 1]];
        this.swaps++;
        this.callbacks.onSwap?.(i + 1, high, this.swaps);
        this.render();
        await this.delay();
        
        return i + 1;
    }

    // Binary Search Implementation
    async binarySearch(target) {
        this.algorithm = 'binary_search';
        this.isRunning = true;
        this.comparisons = 0;
        
        let left = 0;
        let right = this.data.length - 1;
        
        // First, ensure data is sorted
        this.data.sort((a, b) => a - b);
        this.render();
        await this.delay(500);
        
        while (left <= right) {
            if (!this.isRunning) return -1;
            
            const mid = Math.floor((left + right) / 2);
            this.highlightedIndices = [left, mid, right];
            this.comparisons++;
            this.callbacks.onComparison?.(mid, target, this.comparisons);
            this.render();
            await this.delay();
            
            if (this.data[mid] === target) {
                this.highlightedIndices = [mid];
                this.isRunning = false;
                this.callbacks.onComplete?.({ found: true, index: mid, comparisons: this.comparisons });
                this.render();
                return mid;
            } else if (this.data[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        this.isRunning = false;
        this.highlightedIndices = [];
        this.callbacks.onComplete?.({ found: false, comparisons: this.comparisons });
        this.render();
        return -1;
    }

    // Linear Search Implementation
    async linearSearch(target) {
        this.algorithm = 'linear_search';
        this.isRunning = true;
        this.comparisons = 0;
        
        for (let i = 0; i < this.data.length; i++) {
            if (!this.isRunning) return -1;
            
            this.highlightedIndices = [i];
            this.comparisons++;
            this.callbacks.onComparison?.(i, target, this.comparisons);
            this.render();
            await this.delay();
            
            if (this.data[i] === target) {
                this.highlightedIndices = [i];
                this.isRunning = false;
                this.callbacks.onComplete?.({ found: true, index: i, comparisons: this.comparisons });
                this.render();
                return i;
            }
        }
        
        this.isRunning = false;
        this.highlightedIndices = [];
        this.callbacks.onComplete?.({ found: false, comparisons: this.comparisons });
        this.render();
        return -1;
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.data.length === 0) return;
        
        const maxValue = Math.max(...this.data);
        const barWidth = (this.canvas.width - (this.data.length - 1) * this.options.barSpacing) / this.data.length;
        const barHeight = (this.canvas.height - 60) / maxValue;
        
        this.data.forEach((value, index) => {
            const x = index * (barWidth + this.options.barSpacing);
            const y = this.canvas.height - 30 - (value * barHeight);
            const height = value * barHeight;
            
            // Choose color based on state
            let color = this.options.colors.default;
            if (this.highlightedIndices.includes(index)) {
                if (this.algorithm === 'binary_search') {
                    color = this.options.colors.target;
                } else if (this.algorithm === 'quick_sort' && index === this.data.length - 1) {
                    color = this.options.colors.pivot;
                } else {
                    color = this.options.colors.comparing;
                }
            } else if (this.algorithm === 'bubble_sort' && index >= this.data.length - this.currentStep) {
                color = this.options.colors.sorted;
            }
            
            // Draw bar
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, barWidth, height);
            
            // Draw value label
            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
        });
        
        // Draw algorithm info
        this.drawInfo();
    }

    drawInfo() {
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        let y = 20;
        this.ctx.fillText(`Algorithm: ${this.algorithm || 'None'}`, 10, y);
        y += 20;
        this.ctx.fillText(`Comparisons: ${this.comparisons}`, 10, y);
        y += 20;
        this.ctx.fillText(`Swaps: ${this.swaps}`, 10, y);
        
        if (this.isRunning) {
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillText('Running...', 10, y + 20);
        } else if (this.algorithm) {
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.fillText('Complete', 10, y + 20);
        }
    }

    delay(ms = this.options.animationSpeed) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Control methods
    play() {
        this.isPaused = false;
        this.isRunning = true;
    }

    pause() {
        this.isPaused = true;
        this.isRunning = false;
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.reset();
        this.render();
    }

    setSpeed(speed) {
        this.options.animationSpeed = Math.max(10, Math.min(1000, speed));
    }

    // Event handlers
    onStep(callback) {
        this.callbacks.onStep = callback;
    }

    onComplete(callback) {
        this.callbacks.onComplete = callback;
    }

    onComparison(callback) {
        this.callbacks.onComparison = callback;
    }

    onSwap(callback) {
        this.callbacks.onSwap = callback;
    }

    // Get current state
    getState() {
        return {
            data: [...this.data],
            originalData: [...this.originalData],
            algorithm: this.algorithm,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            comparisons: this.comparisons,
            swaps: this.swaps,
            highlightedIndices: [...this.highlightedIndices]
        };
    }

    // Set state (for restoration)
    setState(state) {
        this.data = [...state.data];
        this.originalData = [...state.originalData];
        this.algorithm = state.algorithm;
        this.isRunning = state.isRunning;
        this.isPaused = state.isPaused;
        this.comparisons = state.comparisons;
        this.swaps = state.swaps;
        this.highlightedIndices = [...state.highlightedIndices];
        this.render();
    }

    destroy() {
        this.stop();
        this.callbacks = {};
    }
}

module.exports = AlgorithmVisualizer;
