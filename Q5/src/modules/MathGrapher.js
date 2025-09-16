/**
 * Math Grapher Module
 * Real-time mathematical function plotting with interactive controls
 */

class MathGrapher {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {
            width: 800,
            height: 600,
            padding: 50,
            gridSize: 20,
            colors: {
                background: '#1a1a1a',
                grid: '#333333',
                axes: '#ffffff',
                function: '#e74c3c',
                point: '#2ecc71',
                tangent: '#f39c12'
            },
            ...options
        };
        
        this.setupCanvas();
        this.reset();
    }

    setupCanvas() {
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.ctx.fillStyle = this.options.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    reset() {
        this.functions = [];
        this.points = [];
        this.range = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.showGrid = true;
        this.showAxes = true;
        this.showDerivative = false;
        this.animationTime = 0;
        this.isAnimating = false;
        this.callbacks = {
            onUpdate: null,
            onPointClick: null
        };
    }

    // Add a mathematical function
    addFunction(expression, color = this.options.colors.function, options = {}) {
        const func = {
            id: Date.now() + Math.random(),
            expression,
            color,
            visible: true,
            animated: false,
            parameters: {},
            ...options
        };
        
        this.functions.push(func);
        this.render();
        return func.id;
    }

    // Remove a function
    removeFunction(id) {
        this.functions = this.functions.filter(f => f.id !== id);
        this.render();
    }

    // Update function parameters
    updateFunction(id, updates) {
        const func = this.functions.find(f => f.id === id);
        if (func) {
            Object.assign(func, updates);
            this.render();
        }
    }

    // Parse and evaluate mathematical expressions
    evaluateFunction(expression, x, parameters = {}) {
        try {
            // Replace parameter placeholders
            let expr = expression;
            for (const [key, value] of Object.entries(parameters)) {
                expr = expr.replace(new RegExp(key, 'g'), value);
            }
            
            // Replace x with actual value
            expr = expr.replace(/x/g, `(${x})`);
            
            // Handle common mathematical functions
            expr = expr.replace(/sin/g, 'Math.sin');
            expr = expr.replace(/cos/g, 'Math.cos');
            expr = expr.replace(/tan/g, 'Math.tan');
            expr = expr.replace(/log/g, 'Math.log');
            expr = expr.replace(/ln/g, 'Math.log');
            expr = expr.replace(/sqrt/g, 'Math.sqrt');
            expr = expr.replace(/abs/g, 'Math.abs');
            expr = expr.replace(/pow/g, 'Math.pow');
            expr = expr.replace(/\^/g, '**');
            
            // Evaluate the expression
            return eval(expr);
        } catch (error) {
            console.error('Error evaluating function:', error);
            return NaN;
        }
    }

    // Convert screen coordinates to mathematical coordinates
    screenToMath(screenX, screenY) {
        const x = (screenX - this.options.padding) / this.getScaleX() + this.range.xMin + this.pan.x;
        const y = (this.canvas.height - this.options.padding - screenY) / this.getScaleY() + this.range.yMin + this.pan.y;
        return { x, y };
    }

    // Convert mathematical coordinates to screen coordinates
    mathToScreen(mathX, mathY) {
        const screenX = (mathX - this.range.xMin - this.pan.x) * this.getScaleX() + this.options.padding;
        const screenY = this.canvas.height - this.options.padding - (mathY - this.range.yMin - this.pan.y) * this.getScaleY();
        return { screenX, screenY };
    }

    getScaleX() {
        return (this.canvas.width - 2 * this.options.padding) / (this.range.xMax - this.range.xMin) * this.zoom;
    }

    getScaleY() {
        return (this.canvas.height - 2 * this.options.padding) / (this.range.yMax - this.range.yMin) * this.zoom;
    }

    // Generate points for a function
    generateFunctionPoints(func, resolution = 1) {
        const points = [];
        const step = (this.range.xMax - this.range.xMin) / (this.canvas.width * resolution);
        
        for (let x = this.range.xMin; x <= this.range.xMax; x += step) {
            const y = this.evaluateFunction(func.expression, x, func.parameters);
            if (!isNaN(y) && isFinite(y)) {
                const { screenX, screenY } = this.mathToScreen(x, y);
                if (screenX >= 0 && screenX <= this.canvas.width && 
                    screenY >= 0 && screenY <= this.canvas.height) {
                    points.push({ x, y, screenX, screenY });
                }
            }
        }
        
        return points;
    }

    // Calculate derivative at a point
    calculateDerivative(expression, x, h = 0.001) {
        const f1 = this.evaluateFunction(expression, x + h);
        const f2 = this.evaluateFunction(expression, x - h);
        return (f1 - f2) / (2 * h);
    }

    // Render the graph
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.options.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }
        
        // Draw axes
        if (this.showAxes) {
            this.drawAxes();
        }
        
        // Draw functions
        this.functions.forEach(func => {
            if (func.visible) {
                this.drawFunction(func);
            }
        });
        
        // Draw points
        this.points.forEach(point => {
            this.drawPoint(point);
        });
        
        // Draw info
        this.drawInfo();
    }

    drawGrid() {
        this.ctx.strokeStyle = this.options.colors.grid;
        this.ctx.lineWidth = 0.5;
        
        // Vertical grid lines
        const stepX = (this.range.xMax - this.range.xMin) / this.options.gridSize;
        for (let x = this.range.xMin; x <= this.range.xMax; x += stepX) {
            const { screenX } = this.mathToScreen(x, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal grid lines
        const stepY = (this.range.yMax - this.range.yMin) / this.options.gridSize;
        for (let y = this.range.yMin; y <= this.range.yMax; y += stepY) {
            const { screenY } = this.mathToScreen(0, y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.canvas.width, screenY);
            this.ctx.stroke();
        }
    }

    drawAxes() {
        this.ctx.strokeStyle = this.options.colors.axes;
        this.ctx.lineWidth = 2;
        
        // X-axis
        const { screenY: yAxisY } = this.mathToScreen(0, 0);
        if (yAxisY >= 0 && yAxisY <= this.canvas.height) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, yAxisY);
            this.ctx.lineTo(this.canvas.width, yAxisY);
            this.ctx.stroke();
        }
        
        // Y-axis
        const { screenX: xAxisX } = this.mathToScreen(0, 0);
        if (xAxisX >= 0 && xAxisX <= this.canvas.width) {
            this.ctx.beginPath();
            this.ctx.moveTo(xAxisX, 0);
            this.ctx.lineTo(xAxisX, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw axis labels
        this.drawAxisLabels();
    }

    drawAxisLabels() {
        this.ctx.fillStyle = this.options.colors.axes;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        
        // X-axis labels
        const stepX = (this.range.xMax - this.range.xMin) / 10;
        for (let x = this.range.xMin; x <= this.range.xMax; x += stepX) {
            const { screenX, screenY } = this.mathToScreen(x, 0);
            if (screenX >= 0 && screenX <= this.canvas.width) {
                this.ctx.fillText(x.toFixed(1), screenX, screenY + 15);
            }
        }
        
        // Y-axis labels
        this.ctx.textAlign = 'right';
        const stepY = (this.range.yMax - this.range.yMin) / 10;
        for (let y = this.range.yMin; y <= this.range.yMax; y += stepY) {
            const { screenX, screenY } = this.mathToScreen(0, y);
            if (screenY >= 0 && screenY <= this.canvas.height) {
                this.ctx.fillText(y.toFixed(1), screenX - 5, screenY + 4);
            }
        }
    }

    drawFunction(func) {
        const points = this.generateFunctionPoints(func);
        if (points.length < 2) return;
        
        this.ctx.strokeStyle = func.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        points.forEach((point, index) => {
            if (index === 0) {
                this.ctx.moveTo(point.screenX, point.screenY);
            } else {
                this.ctx.lineTo(point.screenX, point.screenY);
            }
        });
        
        this.ctx.stroke();
        
        // Draw derivative if enabled
        if (this.showDerivative) {
            this.drawDerivative(func);
        }
    }

    drawDerivative(func) {
        const points = this.generateFunctionPoints(func, 2);
        if (points.length < 2) return;
        
        this.ctx.strokeStyle = this.options.colors.tangent;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) {
                this.ctx.moveTo(point.screenX, point.screenY);
            } else {
                const derivative = this.calculateDerivative(func.expression, point.x);
                const { screenX: nextX, screenY: nextY } = this.mathToScreen(
                    point.x + 0.1, 
                    point.y + derivative * 0.1
                );
                this.ctx.lineTo(nextX, nextY);
            }
        });
        
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawPoint(point) {
        const { screenX, screenY } = this.mathToScreen(point.x, point.y);
        
        this.ctx.fillStyle = point.color || this.options.colors.point;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, point.radius || 5, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw point label if provided
        if (point.label) {
            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(point.label, screenX + 8, screenY - 8);
        }
    }

    drawInfo() {
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        let y = 20;
        this.ctx.fillText(`Range: [${this.range.xMin.toFixed(1)}, ${this.range.xMax.toFixed(1)}] x [${this.range.yMin.toFixed(1)}, ${this.range.yMax.toFixed(1)}]`, 10, y);
        y += 20;
        this.ctx.fillText(`Zoom: ${this.zoom.toFixed(2)}x`, 10, y);
        y += 20;
        this.ctx.fillText(`Functions: ${this.functions.length}`, 10, y);
        y += 20;
        this.ctx.fillText(`Points: ${this.points.length}`, 10, y);
    }

    // Add a point to the graph
    addPoint(x, y, options = {}) {
        const point = {
            x,
            y,
            color: options.color || this.options.colors.point,
            radius: options.radius || 5,
            label: options.label || null,
            ...options
        };
        
        this.points.push(point);
        this.render();
        return point;
    }

    // Remove a point
    removePoint(index) {
        if (index >= 0 && index < this.points.length) {
            this.points.splice(index, 1);
            this.render();
        }
    }

    // Clear all points
    clearPoints() {
        this.points = [];
        this.render();
    }

    // Zoom functionality
    zoomIn(factor = 1.2) {
        this.zoom *= factor;
        this.render();
    }

    zoomOut(factor = 1.2) {
        this.zoom /= factor;
        this.render();
    }

    // Pan functionality
    pan(dx, dy) {
        this.pan.x += dx;
        this.pan.y += dy;
        this.render();
    }

    // Set view range
    setRange(xMin, xMax, yMin, yMax) {
        this.range = { xMin, xMax, yMin, yMax };
        this.render();
    }

    // Toggle features
    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.render();
    }

    toggleAxes() {
        this.showAxes = !this.showAxes;
        this.render();
    }

    toggleDerivative() {
        this.showDerivative = !this.showDerivative;
        this.render();
    }

    // Animation
    startAnimation() {
        this.isAnimating = true;
        this.animationTime = 0;
        this.animate();
    }

    stopAnimation() {
        this.isAnimating = false;
    }

    animate() {
        if (!this.isAnimating) return;
        
        this.animationTime += 0.016; // ~60 FPS
        
        // Update animated functions
        this.functions.forEach(func => {
            if (func.animated) {
                // Update parameters based on time
                if (func.animation) {
                    func.parameters = func.animation(this.animationTime);
                }
            }
        });
        
        this.render();
        this.callbacks.onUpdate?.(this.getState());
        
        requestAnimationFrame(() => this.animate());
    }

    // Event handlers
    onUpdate(callback) {
        this.callbacks.onUpdate = callback;
    }

    onPointClick(callback) {
        this.callbacks.onPointClick = callback;
    }

    // Handle mouse events
    handleMouseClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const mathCoords = this.screenToMath(x, y);
        this.callbacks.onPointClick?.(mathCoords, { x, y });
    }

    // Get current state
    getState() {
        return {
            functions: this.functions.map(f => ({ ...f })),
            points: this.points.map(p => ({ ...p })),
            range: { ...this.range },
            zoom: this.zoom,
            pan: { ...this.pan },
            showGrid: this.showGrid,
            showAxes: this.showAxes,
            showDerivative: this.showDerivative,
            isAnimating: this.isAnimating,
            animationTime: this.animationTime
        };
    }

    // Export data
    exportData() {
        return {
            functions: this.functions,
            points: this.points,
            range: this.range,
            zoom: this.zoom,
            pan: this.pan,
            settings: {
                showGrid: this.showGrid,
                showAxes: this.showAxes,
                showDerivative: this.showDerivative
            }
        };
    }

    // Import data
    importData(data) {
        if (data.functions) this.functions = data.functions;
        if (data.points) this.points = data.points;
        if (data.range) this.range = data.range;
        if (data.zoom) this.zoom = data.zoom;
        if (data.pan) this.pan = data.pan;
        if (data.settings) {
            this.showGrid = data.settings.showGrid ?? this.showGrid;
            this.showAxes = data.settings.showAxes ?? this.showAxes;
            this.showDerivative = data.settings.showDerivative ?? this.showDerivative;
        }
        this.render();
    }

    destroy() {
        this.stopAnimation();
        this.callbacks = {};
    }
}

module.exports = MathGrapher;
