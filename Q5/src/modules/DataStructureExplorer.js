/**
 * Data Structure Explorer Module
 * Interactive visualization of data structures like trees, graphs, and linked lists
 */

class DataStructureExplorer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {
            width: 800,
            height: 600,
            nodeRadius: 20,
            colors: {
                background: '#1a1a1a',
                node: '#3498db',
                nodeVisited: '#2ecc71',
                nodeCurrent: '#e74c3c',
                nodeTarget: '#f39c12',
                edge: '#7f8c8d',
                edgeVisited: '#2ecc71',
                text: '#ecf0f1'
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
        this.dataStructure = null;
        this.type = null;
        this.nodes = [];
        this.edges = [];
        this.animation = null;
        this.isRunning = false;
        this.isPaused = false;
        this.currentStep = 0;
        this.visitedNodes = new Set();
        this.currentNode = null;
        this.callbacks = {
            onUpdate: null,
            onComplete: null,
            onNodeClick: null
        };
    }

    // Binary Tree Operations
    createBinaryTree(values = []) {
        this.type = 'binary_tree';
        this.nodes = [];
        this.edges = [];
        
        if (values.length === 0) {
            values = Array.from({ length: 7 }, (_, i) => i + 1);
        }
        
        // Create nodes
        values.forEach((value, index) => {
            this.nodes.push({
                id: index,
                value,
                x: 0, // Will be calculated
                y: 0,
                left: null,
                right: null,
                parent: null,
                visited: false,
                current: false
            });
        });
        
        // Build tree structure
        this.buildBinaryTree();
        this.calculatePositions();
        this.render();
    }

    buildBinaryTree() {
        if (this.nodes.length === 0) return;
        
        // Sort values for balanced tree
        this.nodes.sort((a, b) => a.value - b.value);
        
        // Build tree recursively
        const buildTree = (start, end, parent = null) => {
            if (start > end) return null;
            
            const mid = Math.floor((start + end) / 2);
            const node = this.nodes[mid];
            node.parent = parent;
            
            node.left = buildTree(start, mid - 1, node);
            node.right = buildTree(mid + 1, end, node);
            
            return node;
        };
        
        this.root = buildTree(0, this.nodes.length - 1);
    }

    calculatePositions() {
        if (!this.root) return;
        
        const levelHeight = 80;
        const levelWidth = this.canvas.width / (Math.pow(2, this.getTreeHeight()) + 1);
        
        const calculatePositions = (node, level, position) => {
            if (!node) return;
            
            node.x = position * levelWidth;
            node.y = level * levelHeight + 50;
            
            if (node.left) {
                calculatePositions(node.left, level + 1, position * 2 - 1);
            }
            if (node.right) {
                calculatePositions(node.right, level + 1, position * 2 + 1);
            }
        };
        
        calculatePositions(this.root, 0, Math.pow(2, this.getTreeHeight()) / 2);
        
        // Create edges
        this.edges = [];
        this.createEdges(this.root);
    }

    createEdges(node) {
        if (!node) return;
        
        if (node.left) {
            this.edges.push({
                from: node,
                to: node.left,
                visited: false
            });
            this.createEdges(node.left);
        }
        
        if (node.right) {
            this.edges.push({
                from: node,
                to: node.right,
                visited: false
            });
            this.createEdges(node.right);
        }
    }

    getTreeHeight() {
        const getHeight = (node) => {
            if (!node) return 0;
            return 1 + Math.max(getHeight(node.left), getHeight(node.right));
        };
        return getHeight(this.root);
    }

    // Tree Traversal Algorithms
    async inorderTraversal() {
        this.resetAnimation();
        this.isRunning = true;
        this.animation = 'inorder';
        
        const traverse = async (node) => {
            if (!node || !this.isRunning) return;
            
            // Visit left subtree
            if (node.left) {
                await traverse(node.left);
            }
            
            // Visit current node
            await this.visitNode(node);
            
            // Visit right subtree
            if (node.right) {
                await traverse(node.right);
            }
        };
        
        await traverse(this.root);
        this.completeAnimation();
    }

    async preorderTraversal() {
        this.resetAnimation();
        this.isRunning = true;
        this.animation = 'preorder';
        
        const traverse = async (node) => {
            if (!node || !this.isRunning) return;
            
            // Visit current node
            await this.visitNode(node);
            
            // Visit left subtree
            if (node.left) {
                await traverse(node.left);
            }
            
            // Visit right subtree
            if (node.right) {
                await traverse(node.right);
            }
        };
        
        await traverse(this.root);
        this.completeAnimation();
    }

    async postorderTraversal() {
        this.resetAnimation();
        this.isRunning = true;
        this.animation = 'postorder';
        
        const traverse = async (node) => {
            if (!node || !this.isRunning) return;
            
            // Visit left subtree
            if (node.left) {
                await traverse(node.left);
            }
            
            // Visit right subtree
            if (node.right) {
                await traverse(node.right);
            }
            
            // Visit current node
            await this.visitNode(node);
        };
        
        await traverse(this.root);
        this.completeAnimation();
    }

    // Graph Operations
    createGraph(nodes = [], edges = []) {
        this.type = 'graph';
        this.nodes = nodes.map((value, index) => ({
            id: index,
            value,
            x: Math.random() * (this.canvas.width - 100) + 50,
            y: Math.random() * (this.canvas.height - 100) + 50,
            visited: false,
            current: false,
            neighbors: []
        }));
        
        this.edges = edges.map(edge => ({
            from: this.nodes[edge.from],
            to: this.nodes[edge.to],
            weight: edge.weight || 1,
            visited: false
        }));
        
        // Update neighbors
        this.edges.forEach(edge => {
            edge.from.neighbors.push(edge.to);
            edge.to.neighbors.push(edge.from);
        });
        
        this.render();
    }

    // Graph Traversal Algorithms
    async breadthFirstSearch(startIndex = 0, targetValue = null) {
        this.resetAnimation();
        this.isRunning = true;
        this.animation = 'bfs';
        
        const queue = [this.nodes[startIndex]];
        const visited = new Set();
        
        while (queue.length > 0 && this.isRunning) {
            const current = queue.shift();
            
            if (visited.has(current.id)) continue;
            
            await this.visitNode(current);
            visited.add(current.id);
            
            if (targetValue !== null && current.value === targetValue) {
                this.completeAnimation();
                return current;
            }
            
            // Add neighbors to queue
            current.neighbors.forEach(neighbor => {
                if (!visited.has(neighbor.id) && !queue.includes(neighbor)) {
                    queue.push(neighbor);
                }
            });
            
            await this.delay(500);
        }
        
        this.completeAnimation();
        return null;
    }

    async depthFirstSearch(startIndex = 0, targetValue = null) {
        this.resetAnimation();
        this.isRunning = true;
        this.animation = 'dfs';
        
        const visited = new Set();
        
        const dfs = async (node) => {
            if (!node || visited.has(node.id) || !this.isRunning) return null;
            
            await this.visitNode(node);
            visited.add(node.id);
            
            if (targetValue !== null && node.value === targetValue) {
                return node;
            }
            
            for (const neighbor of node.neighbors) {
                const result = await dfs(neighbor);
                if (result) return result;
            }
            
            return null;
        };
        
        const result = await dfs(this.nodes[startIndex]);
        this.completeAnimation();
        return result;
    }

    // Linked List Operations
    createLinkedList(values = []) {
        this.type = 'linked_list';
        this.nodes = [];
        this.edges = [];
        
        if (values.length === 0) {
            values = Array.from({ length: 5 }, (_, i) => i + 1);
        }
        
        // Create nodes
        values.forEach((value, index) => {
            this.nodes.push({
                id: index,
                value,
                x: 100 + index * 120,
                y: this.canvas.height / 2,
                next: null,
                visited: false,
                current: false
            });
        });
        
        // Create edges (links)
        for (let i = 0; i < this.nodes.length - 1; i++) {
            this.nodes[i].next = this.nodes[i + 1];
            this.edges.push({
                from: this.nodes[i],
                to: this.nodes[i + 1],
                visited: false
            });
        }
        
        this.render();
    }

    // Linked List Traversal
    async traverseLinkedList() {
        this.resetAnimation();
        this.isRunning = true;
        this.animation = 'linked_list_traversal';
        
        let current = this.nodes[0];
        
        while (current && this.isRunning) {
            await this.visitNode(current);
            current = current.next;
            await this.delay(500);
        }
        
        this.completeAnimation();
    }

    // Common methods
    async visitNode(node) {
        node.visited = true;
        node.current = true;
        this.currentNode = node;
        this.visitedNodes.add(node.id);
        
        this.render();
        await this.delay(500);
        
        node.current = false;
        this.currentNode = null;
        this.render();
    }

    resetAnimation() {
        this.visitedNodes.clear();
        this.currentNode = null;
        this.currentStep = 0;
        this.nodes.forEach(node => {
            node.visited = false;
            node.current = false;
        });
        this.edges.forEach(edge => {
            edge.visited = false;
        });
    }

    completeAnimation() {
        this.isRunning = false;
        this.animation = null;
        this.callbacks.onComplete?.(this.getState());
    }

    delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Render methods
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.options.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw edges first
        this.edges.forEach(edge => {
            this.drawEdge(edge);
        });
        
        // Draw nodes
        this.nodes.forEach(node => {
            this.drawNode(node);
        });
        
        // Draw info
        this.drawInfo();
    }

    drawNode(node) {
        const { x, y } = node;
        const radius = this.options.nodeRadius;
        
        // Choose color based on state
        let color = this.options.colors.node;
        if (node.current) {
            color = this.options.colors.nodeCurrent;
        } else if (node.visited) {
            color = this.options.colors.nodeVisited;
        }
        
        // Draw node
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw border
        this.ctx.strokeStyle = this.options.colors.text;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw value
        this.ctx.fillStyle = this.options.colors.text;
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(node.value.toString(), x, y);
    }

    drawEdge(edge) {
        const { from, to, visited } = edge;
        
        // Choose color based on state
        const color = visited ? this.options.colors.edgeVisited : this.options.colors.edge;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = visited ? 3 : 2;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
        
        // Draw arrow for directed edges
        if (this.type === 'linked_list') {
            this.drawArrow(from.x, from.y, to.x, to.y);
        }
    }

    drawArrow(fromX, fromY, toX, toY) {
        const headLength = 10;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
    }

    drawInfo() {
        this.ctx.fillStyle = this.options.colors.text;
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        let y = 20;
        this.ctx.fillText(`Type: ${this.type || 'None'}`, 10, y);
        y += 20;
        this.ctx.fillText(`Nodes: ${this.nodes.length}`, 10, y);
        y += 20;
        this.ctx.fillText(`Edges: ${this.edges.length}`, 10, y);
        y += 20;
        this.ctx.fillText(`Visited: ${this.visitedNodes.size}`, 10, y);
        y += 20;
        
        if (this.animation) {
            this.ctx.fillText(`Animation: ${this.animation}`, 10, y);
            y += 20;
        }
        
        if (this.isRunning) {
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillText('Running...', 10, y);
        }
    }

    // Control methods
    play() {
        this.isRunning = true;
        this.isPaused = false;
    }

    pause() {
        this.isPaused = true;
        this.isRunning = false;
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.resetAnimation();
        this.render();
    }

    // Event handlers
    onUpdate(callback) {
        this.callbacks.onUpdate = callback;
    }

    onComplete(callback) {
        this.callbacks.onComplete = callback;
    }

    onNodeClick(callback) {
        this.callbacks.onNodeClick = callback;
    }

    // Handle mouse events
    handleMouseClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Find clicked node
        const clickedNode = this.nodes.find(node => {
            const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
            return distance <= this.options.nodeRadius;
        });
        
        if (clickedNode) {
            this.callbacks.onNodeClick?.(clickedNode, { x, y });
        }
    }

    // Get current state
    getState() {
        return {
            type: this.type,
            nodes: this.nodes.map(n => ({ ...n })),
            edges: this.edges.map(e => ({ ...e })),
            animation: this.animation,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            visitedNodes: Array.from(this.visitedNodes),
            currentNode: this.currentNode ? { ...this.currentNode } : null
        };
    }

    destroy() {
        this.stop();
        this.callbacks = {};
    }
}

module.exports = DataStructureExplorer;
