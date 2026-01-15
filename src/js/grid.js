// grid management stuff

class Grid {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.grid = [];
        this.startNode = null;
        this.endNode = null;
        this.isDrawing = false;
        this.isDragging = false;
        this.dragType = null;
        
        this.init();
    }

    init() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = {
                    row,
                    col,
                    type: 'empty',
                    weight: 1,
                    element: null
                };
            }
        }
        
        // randomize start and end positions, placing them as far apart as possible
        this.randomizeStartEnd();
    }
    
    randomizeStartEnd() {
        // place start near top-left, end near middle-right
        const startRow = 2;
        const startCol = 4;
        const midRow = Math.floor(this.rows / 2);
        const endCol = Math.floor(3 * this.cols / 4);
        
        // ensure start and end are always set
        if (this.startNode) {
            this.startNode.type = 'empty';
            this.updateNodeElement(this.startNode);
        }
        if (this.endNode) {
            this.endNode.type = 'empty';
            this.updateNodeElement(this.endNode);
        }
        
        this.setNodeType(startRow, startCol, 'start');
        this.setNodeType(midRow, endCol, 'end');
    }

    render(container) {
        if (!container) {
            console.warn('[Grid] Container not found');
            return false;
        }
        
        // ensure container is visible
        if (container.offsetWidth === 0 || container.offsetHeight === 0) {
            console.warn('[Grid] Container not visible');
        }
        
        // clear and prepare container
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        container.style.display = 'grid';
        container.style.gap = '2px';
        container.style.width = 'fit-content';
        container.style.height = 'fit-content';
        
        // create all elements first (synchronous)
        const elements = [];
        const totalNodes = this.rows * this.cols;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                if (!node) {
                    console.warn(`[Grid] Missing node at ${row},${col}`);
                    continue;
                }
                
                const element = document.createElement('div');
                element.className = `node ${node.type}`;
                element.dataset.row = row;
                element.dataset.col = col;
                
                node.element = element;
                elements.push(element);
            }
        }
        
        // append all at once for faster rendering
        if (elements.length !== totalNodes) {
            console.warn(`[Grid] Element count mismatch: ${elements.length} vs ${totalNodes}`);
        }
        
        container.append(...elements);
        
        // force synchronous layout to ensure all nodes are in DOM
        void container.offsetHeight;
        void container.offsetWidth;
        
        // verify all nodes are properly attached
        let allAttached = true;
        let missingCount = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                if (node) {
                    if (!node.element) {
                        allAttached = false;
                        missingCount++;
                    } else if (!node.element.parentNode) {
                        allAttached = false;
                        missingCount++;
                    } else if (node.element.parentNode !== container) {
                        allAttached = false;
                        missingCount++;
                    }
                }
            }
        }
        
        if (!allAttached) {
            console.warn(`[Grid] ${missingCount} nodes not properly attached`);
        }
        
        return allAttached;
    }
    
    // verify grid is fully ready
    isReady() {
        const container = document.getElementById('grid');
        if (!container) return false;
        
        // check all nodes have elements and are in DOM
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                if (!node) return false;
                if (!node.element) return false;
                if (!node.element.parentNode) return false;
                if (node.element.parentNode !== container) return false;
            }
        }
        
        return true;
    }
    
    // wait for grid to be ready
    async waitForReady(maxWait = 1000) {
        const startTime = performance.now();
        
        while (!this.isReady()) {
            if (performance.now() - startTime > maxWait) {
                console.error('[Grid] Timeout waiting for grid to be ready');
                return false;
            }
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
        
        return true;
    }

    setNodeType(row, col, type) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
        
        const node = this.grid[row][col];
        const oldType = node.type;
        
        if (type === 'start') {
            if (this.startNode && this.startNode !== node) {
                this.startNode.type = 'empty';
                this.updateNodeElement(this.startNode);
            }
            this.startNode = node;
        } else if (type === 'end') {
            if (this.endNode && this.endNode !== node) {
                this.endNode.type = 'empty';
                this.updateNodeElement(this.endNode);
            }
            this.endNode = node;
        } else if (oldType === 'start') {
            this.startNode = null;
        } else if (oldType === 'end') {
            this.endNode = null;
        }
        
        if (oldType === 'start' || oldType === 'end') {
            if (type !== 'start' && type !== 'end') {
                if (oldType === 'start') this.startNode = null;
                if (oldType === 'end') this.endNode = null;
            }
        }
        
        node.type = type;
        this.updateNodeElement(node);
    }

    updateNodeElement(node) {
        if (!node.element) return;
        node.element.className = `node ${node.type}`;
        
        // show weight if > 1 (and not a wall/start/end)
        if (node.weight > 1 && node.type !== 'wall' && node.type !== 'start' && node.type !== 'end') {
            node.element.dataset.weight = node.weight;
            // show weight number, but for weight 15 show "15" or just the number
            node.element.textContent = node.weight;
        } else {
            // remove the data-weight attribute completely to clear styling
            node.element.removeAttribute('data-weight');
            node.element.textContent = '';
        }
    }

    getNode(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
        return this.grid[row][col];
    }

    clearPath() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                if (node.type === 'visited' || node.type === 'path') {
                    node.type = 'empty';
                    this.updateNodeElement(node);
                }
            }
        }
    }

    reset() {
        // only reset nodes that are actually filled (not already empty)
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                if (node && 
                    node.type !== 'start' && 
                    node.type !== 'end' && 
                    node.type !== 'empty') {
                    node.type = 'empty';
                    this.updateNodeElement(node);
                }
                // clear any animation styles
                if (node && node.element) {
                    node.element.style.transform = '';
                    node.element.style.opacity = '';
                    node.element.style.transition = '';
                }
            }
        }
    }
    
    // get count of nodes that need resetting (for performance tracking)
    getFilledNodesCount() {
        let count = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                if (node && 
                    node.type !== 'start' && 
                    node.type !== 'end' && 
                    node.type !== 'empty') {
                    count++;
                }
            }
        }
        return count;
    }
    
    getNodesByType(type) {
        const nodes = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                if (node.type === type) {
                    nodes.push(node);
                }
            }
        }
        return nodes;
    }

    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0]
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = node.row + dr;
            const newCol = node.col + dc;
            const neighbor = this.getNode(newRow, newCol);
            if (neighbor && neighbor.type !== 'wall') {
                neighbors.push(neighbor);
            }
        }
        
        return neighbors;
    }

    setupEventListeners() {
        const gridElement = document.getElementById('grid');
        
        gridElement.addEventListener('mousedown', (e) => {
            const node = this.getNodeFromEvent(e);
            if (!node) return;
            
            if (node.type === 'start' || node.type === 'end') {
                this.isDragging = true;
                this.dragType = node.type;
                node.element.classList.add('dragging');
            } else {
                this.isDrawing = true;
                const newType = node.type === 'wall' ? 'empty' : 'wall';
                this.setNodeType(node.row, node.col, newType);
            }
        });
        
        gridElement.addEventListener('mousemove', (e) => {
            const node = this.getNodeFromEvent(e);
            if (!node) return;
            
            if (this.isDragging && this.dragType) {
                if (node.type === 'empty' || (this.dragType === 'start' && node.type === 'end') || 
                    (this.dragType === 'end' && node.type === 'start')) {
                    this.setNodeType(node.row, node.col, this.dragType);
                }
            } else if (this.isDrawing) {
                if (node.type !== 'start' && node.type !== 'end') {
                    this.setNodeType(node.row, node.col, 'wall');
                }
            }
        });
        
        gridElement.addEventListener('mouseup', () => {
            if (this.isDragging) {
                const draggingNode = this.grid.flat().find(n => n.element?.classList.contains('dragging'));
                if (draggingNode) {
                    draggingNode.element.classList.remove('dragging');
                }
            }
            this.isDrawing = false;
            this.isDragging = false;
            this.dragType = null;
        });
        
        gridElement.addEventListener('mouseleave', () => {
            if (this.isDragging) {
                const draggingNode = this.grid.flat().find(n => n.element?.classList.contains('dragging'));
                if (draggingNode) {
                    draggingNode.element.classList.remove('dragging');
                }
            }
            this.isDrawing = false;
            this.isDragging = false;
            this.dragType = null;
        });
    }

    addRandomWeights() {
        // add random weights to empty nodes (weight 2-5)
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                if (node && node.type === 'empty' && Math.random() < 0.3) {
                    node.weight = Math.floor(Math.random() * 4) + 2; // 2-5
                    this.updateNodeElement(node);
                }
            }
        }
    }

    clearWeights() {
        // reset all weights to 1
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                if (node) {
                    node.weight = 1;
                    this.updateNodeElement(node);
                }
            }
        }
    }

    getNodeFromEvent(e) {
        const element = e.target.closest('.node');
        if (!element) return null;
        
        const row = parseInt(element.dataset.row);
        const col = parseInt(element.dataset.col);
        return this.getNode(row, col);
    }
}
