// step-based maze generation system with performance optimizations

// step types
const STEP_TYPES = {
    CARVE: 'carve',  // make cell empty (path)
    WALL: 'wall'     // make cell wall
};

// debug performance (global, declared once)
if (typeof DEBUG_PERF === 'undefined') {
    window.DEBUG_PERF = false; // set to true for performance logging
}
const perfLog = {
    generation: 0,
    wallInit: 0,
    animation: 0,
    totalSteps: 0,
    domUpdates: 0,
    styleRecalcs: 0
};

function logPerf(phase, time) {
    if (window.DEBUG_PERF) {
        console.log(`[PERF] ${phase}: ${time.toFixed(2)}ms`);
    }
}

// maze step instruction
class MazeStep {
    constructor(type, row, col, weight = null) {
        this.type = type;
        this.row = row;
        this.col = col;
        this.weight = weight;
    }
}

// recursive division maze algorithm - exact copy from pathfinding visualizer
class RecursiveDivision {
    static generate(rows, cols, startNode, endNode) {
        const startTime = performance.now();
        const steps = [];
        const wallsSet = new Set();
        
        // create board-like object for compatibility with original algorithm
        const board = {
            rows: rows,
            cols: cols,
            height: rows,
            width: cols,
            start: startNode ? `${startNode.row}-${startNode.col}` : null,
            target: endNode ? `${endNode.row}-${endNode.col}` : null,
            object: null,
            nodes: {}
        };
        
        // build node map for checking
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const nodeId = `${r}-${c}`;
                board.nodes[nodeId] = {
                    id: nodeId,
                    status: (r === startNode?.row && c === startNode?.col) ? 'start' : 
                            (r === endNode?.row && c === endNode?.col) ? 'target' : 'unvisited'
                };
            }
        }
        
        // call recursive division exactly as pathfinding visualizer does
        // starts from 2, height-3, 2, width-3 to leave border
        this.recursiveDivision(board, 2, rows - 3, 2, cols - 3, 'horizontal', false, 'wall', wallsSet, steps);
        
        const endTime = performance.now();
        perfLog.generation = endTime - startTime;
        perfLog.totalSteps = steps.length;
        logPerf('Maze Generation', perfLog.generation);
        logPerf('Total Steps', perfLog.totalSteps);
        
        return steps;
    }
    
    static recursiveDivision(board, rowStart, rowEnd, colStart, colEnd, orientation, surroundingWalls, type, wallsSet, steps) {
        if (rowEnd < rowStart || colEnd < colStart) {
            return;
        }
        
        if (!surroundingWalls) {
            const relevantIds = [board.start, board.target];
            if (board.object) relevantIds.push(board.object);
            
            // create border walls, only skip the actual start/end cells
            Object.keys(board.nodes).forEach(nodeId => {
                if (!relevantIds.includes(nodeId)) {
                    const r = parseInt(nodeId.split("-")[0]);
                    const c = parseInt(nodeId.split("-")[1]);
                    if (r === 0 || c === 0 || r === board.height - 1 || c === board.width - 1) {
                        const key = `${r},${c}`;
                        if (!wallsSet.has(key)) {
                            wallsSet.add(key);
                            steps.push(new MazeStep(STEP_TYPES.WALL, r, c));
                        }
                    }
                }
            });
            surroundingWalls = true;
        }
        
        if (orientation === 'horizontal') {
            const possibleRows = [];
            for (let number = rowStart; number <= rowEnd; number += 2) {
                possibleRows.push(number);
            }
            const possibleCols = [];
            for (let number = colStart - 1; number <= colEnd + 1; number += 2) {
                possibleCols.push(number);
            }
            
            if (possibleRows.length === 0) return;
            
            const randomRowIndex = Math.floor(Math.random() * possibleRows.length);
            const randomColIndex = Math.floor(Math.random() * possibleCols.length);
            const currentRow = possibleRows[randomRowIndex];
            const colRandom = possibleCols[randomColIndex];
            
            Object.keys(board.nodes).forEach(nodeId => {
                const r = parseInt(nodeId.split("-")[0]);
                const c = parseInt(nodeId.split("-")[1]);
                if (r === currentRow && c !== colRandom && c >= colStart - 1 && c <= colEnd + 1) {
                    // skip if this is start, target, or object node
                    if (nodeId === board.start || nodeId === board.target || nodeId === board.object) {
                        return;
                    }
                    const key = `${r},${c}`;
                    if (!wallsSet.has(key)) {
                        wallsSet.add(key);
                        steps.push(new MazeStep(STEP_TYPES.WALL, r, c));
                    }
                }
            });
            
            if (currentRow - 2 - rowStart > colEnd - colStart) {
                this.recursiveDivision(board, rowStart, currentRow - 2, colStart, colEnd, orientation, surroundingWalls, type, wallsSet, steps);
            } else {
                this.recursiveDivision(board, rowStart, currentRow - 2, colStart, colEnd, 'vertical', surroundingWalls, type, wallsSet, steps);
            }
            
            if (rowEnd - (currentRow + 2) > colEnd - colStart) {
                this.recursiveDivision(board, currentRow + 2, rowEnd, colStart, colEnd, orientation, surroundingWalls, type, wallsSet, steps);
            } else {
                this.recursiveDivision(board, currentRow + 2, rowEnd, colStart, colEnd, 'vertical', surroundingWalls, type, wallsSet, steps);
            }
        } else {
            const possibleCols = [];
            for (let number = colStart; number <= colEnd; number += 2) {
                possibleCols.push(number);
            }
            const possibleRows = [];
            for (let number = rowStart - 1; number <= rowEnd + 1; number += 2) {
                possibleRows.push(number);
            }
            
            if (possibleCols.length === 0) return;
            
            const randomColIndex = Math.floor(Math.random() * possibleCols.length);
            const randomRowIndex = Math.floor(Math.random() * possibleRows.length);
            const currentCol = possibleCols[randomColIndex];
            const rowRandom = possibleRows[randomRowIndex];
            
            Object.keys(board.nodes).forEach(nodeId => {
                const r = parseInt(nodeId.split("-")[0]);
                const c = parseInt(nodeId.split("-")[1]);
                if (c === currentCol && r !== rowRandom && r >= rowStart - 1 && r <= rowEnd + 1) {
                    // skip if this is start, target, or object node
                    if (nodeId === board.start || nodeId === board.target || nodeId === board.object) {
                        return;
                    }
                    const key = `${r},${c}`;
                    if (!wallsSet.has(key)) {
                        wallsSet.add(key);
                        steps.push(new MazeStep(STEP_TYPES.WALL, r, c));
                    }
                }
            });
            
            if (rowEnd - rowStart > currentCol - 2 - colStart) {
                this.recursiveDivision(board, rowStart, rowEnd, colStart, currentCol - 2, 'horizontal', surroundingWalls, type, wallsSet, steps);
            } else {
                this.recursiveDivision(board, rowStart, rowEnd, colStart, currentCol - 2, orientation, surroundingWalls, type, wallsSet, steps);
            }
            
            if (rowEnd - rowStart > colEnd - (currentCol + 2)) {
                this.recursiveDivision(board, rowStart, rowEnd, currentCol + 2, colEnd, 'horizontal', surroundingWalls, type, wallsSet, steps);
            } else {
                this.recursiveDivision(board, rowStart, rowEnd, currentCol + 2, colEnd, orientation, surroundingWalls, type, wallsSet, steps);
            }
        }
    }
}

// recursive division with vertical skew
class RecursiveDivisionVertical {
    static generate(rows, cols, startNode, endNode) {
        const startTime = performance.now();
        const steps = [];
        const wallsSet = new Set();
        
        const board = {
            rows: rows,
            cols: cols,
            height: rows,
            width: cols,
            start: startNode ? `${startNode.row}-${startNode.col}` : null,
            target: endNode ? `${endNode.row}-${endNode.col}` : null,
            object: null,
            nodes: {}
        };
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const nodeId = `${r}-${c}`;
                board.nodes[nodeId] = {
                    id: nodeId,
                    status: (r === startNode?.row && c === startNode?.col) ? 'start' : 
                            (r === endNode?.row && c === endNode?.col) ? 'target' : 'unvisited'
                };
            }
        }
        
        this.recursiveDivision(board, 2, rows - 3, 2, cols - 3, 'vertical', false, 'wall', wallsSet, steps);
        
        const endTime = performance.now();
        perfLog.generation = endTime - startTime;
        perfLog.totalSteps = steps.length;
        logPerf('Maze Generation', perfLog.generation);
        
        return steps;
    }
    
    static recursiveDivision(board, rowStart, rowEnd, colStart, colEnd, orientation, surroundingWalls, type, wallsSet, steps) {
        if (rowEnd < rowStart || colEnd < colStart) return;
        
        if (!surroundingWalls) {
            const relevantIds = [board.start, board.target];
            if (board.object) relevantIds.push(board.object);
            
            Object.keys(board.nodes).forEach(nodeId => {
                if (!relevantIds.includes(nodeId)) {
                    const r = parseInt(nodeId.split("-")[0]);
                    const c = parseInt(nodeId.split("-")[1]);
                    if (r === 0 || c === 0 || r === board.height - 1 || c === board.width - 1) {
                        const key = `${r},${c}`;
                        if (!wallsSet.has(key)) {
                            wallsSet.add(key);
                            steps.push(new MazeStep(STEP_TYPES.WALL, r, c));
                        }
                    }
                }
            });
            surroundingWalls = true;
        }
        
        if (orientation === 'horizontal') {
            const possibleRows = [];
            for (let number = rowStart; number <= rowEnd; number += 2) {
                possibleRows.push(number);
            }
            const possibleCols = [];
            for (let number = colStart - 1; number <= colEnd + 1; number += 2) {
                possibleCols.push(number);
            }
            
            if (possibleRows.length === 0) return;
            
            const randomRowIndex = Math.floor(Math.random() * possibleRows.length);
            const randomColIndex = Math.floor(Math.random() * possibleCols.length);
            const currentRow = possibleRows[randomRowIndex];
            const colRandom = possibleCols[randomColIndex];
            
            Object.keys(board.nodes).forEach(nodeId => {
                const r = parseInt(nodeId.split("-")[0]);
                const c = parseInt(nodeId.split("-")[1]);
                if (r === currentRow && c !== colRandom && c >= colStart - 1 && c <= colEnd + 1) {
                    if (nodeId === board.start || nodeId === board.target || nodeId === board.object) return;
                    const key = `${r},${c}`;
                    if (!wallsSet.has(key)) {
                        wallsSet.add(key);
                        steps.push(new MazeStep(STEP_TYPES.WALL, r, c));
                    }
                }
            });
            
            if (currentRow - 2 - rowStart > colEnd - colStart) {
                this.recursiveDivision(board, rowStart, currentRow - 2, colStart, colEnd, orientation, surroundingWalls, type, wallsSet, steps);
            } else {
                this.recursiveDivision(board, rowStart, currentRow - 2, colStart, colEnd, 'vertical', surroundingWalls, type, wallsSet, steps);
            }
            
            if (rowEnd - (currentRow + 2) > colEnd - colStart) {
                this.recursiveDivision(board, currentRow + 2, rowEnd, colStart, colEnd, 'vertical', surroundingWalls, type, wallsSet, steps);
            } else {
                this.recursiveDivision(board, currentRow + 2, rowEnd, colStart, colEnd, 'vertical', surroundingWalls, type, wallsSet, steps);
            }
        } else {
            const possibleCols = [];
            for (let number = colStart; number <= colEnd; number += 2) {
                possibleCols.push(number);
            }
            const possibleRows = [];
            for (let number = rowStart - 1; number <= rowEnd + 1; number += 2) {
                possibleRows.push(number);
            }
            
            if (possibleCols.length === 0) return;
            
            const randomColIndex = Math.floor(Math.random() * possibleCols.length);
            const randomRowIndex = Math.floor(Math.random() * possibleRows.length);
            const currentCol = possibleCols[randomColIndex];
            const rowRandom = possibleRows[randomRowIndex];
            
            Object.keys(board.nodes).forEach(nodeId => {
                const r = parseInt(nodeId.split("-")[0]);
                const c = parseInt(nodeId.split("-")[1]);
                if (c === currentCol && r !== rowRandom && r >= rowStart - 1 && r <= rowEnd + 1) {
                    if (nodeId === board.start || nodeId === board.target || nodeId === board.object) return;
                    const key = `${r},${c}`;
                    if (!wallsSet.has(key)) {
                        wallsSet.add(key);
                        steps.push(new MazeStep(STEP_TYPES.WALL, r, c));
                    }
                }
            });
            
            if (rowEnd - rowStart > currentCol - 2 - colStart) {
                this.recursiveDivision(board, rowStart, rowEnd, colStart, currentCol - 2, 'vertical', surroundingWalls, type, wallsSet, steps);
            } else {
                this.recursiveDivision(board, rowStart, rowEnd, colStart, currentCol - 2, orientation, surroundingWalls, type, wallsSet, steps);
            }
            
            if (rowEnd - rowStart > colEnd - (currentCol + 2)) {
                this.recursiveDivision(board, rowStart, rowEnd, currentCol + 2, colEnd, 'horizontal', surroundingWalls, type, wallsSet, steps);
            } else {
                this.recursiveDivision(board, rowStart, rowEnd, currentCol + 2, colEnd, orientation, surroundingWalls, type, wallsSet, steps);
            }
        }
    }
}

// recursive division with horizontal skew
class RecursiveDivisionHorizontal {
    static generate(rows, cols, startNode, endNode) {
        const startTime = performance.now();
        const steps = [];
        const wallsSet = new Set();
        
        const board = {
            rows: rows,
            cols: cols,
            height: rows,
            width: cols,
            start: startNode ? `${startNode.row}-${startNode.col}` : null,
            target: endNode ? `${endNode.row}-${endNode.col}` : null,
            object: null,
            nodes: {}
        };
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const nodeId = `${r}-${c}`;
                board.nodes[nodeId] = {
                    id: nodeId,
                    status: (r === startNode?.row && c === startNode?.col) ? 'start' : 
                            (r === endNode?.row && c === endNode?.col) ? 'target' : 'unvisited'
                };
            }
        }
        
        this.recursiveDivision(board, 2, rows - 3, 2, cols - 3, 'horizontal', false, 'wall', wallsSet, steps);
        
        const endTime = performance.now();
        perfLog.generation = endTime - startTime;
        perfLog.totalSteps = steps.length;
        logPerf('Maze Generation', perfLog.generation);
        
        return steps;
    }
    
    static recursiveDivision(board, rowStart, rowEnd, colStart, colEnd, orientation, surroundingWalls, type, wallsSet, steps) {
        if (rowEnd < rowStart || colEnd < colStart) return;
        
        if (!surroundingWalls) {
            const relevantIds = [board.start, board.target];
            if (board.object) relevantIds.push(board.object);
            
            Object.keys(board.nodes).forEach(nodeId => {
                if (!relevantIds.includes(nodeId)) {
                    const r = parseInt(nodeId.split("-")[0]);
                    const c = parseInt(nodeId.split("-")[1]);
                    if (r === 0 || c === 0 || r === board.height - 1 || c === board.width - 1) {
                        const key = `${r},${c}`;
                        if (!wallsSet.has(key)) {
                            wallsSet.add(key);
                            steps.push(new MazeStep(STEP_TYPES.WALL, r, c));
                        }
                    }
                }
            });
            surroundingWalls = true;
        }
        
        if (orientation === 'horizontal') {
            const possibleRows = [];
            for (let number = rowStart; number <= rowEnd; number += 2) {
                possibleRows.push(number);
            }
            const possibleCols = [];
            for (let number = colStart - 1; number <= colEnd + 1; number += 2) {
                possibleCols.push(number);
            }
            
            if (possibleRows.length === 0) return;
            
            const randomRowIndex = Math.floor(Math.random() * possibleRows.length);
            const randomColIndex = Math.floor(Math.random() * possibleCols.length);
            const currentRow = possibleRows[randomRowIndex];
            const colRandom = possibleCols[randomColIndex];
            
            Object.keys(board.nodes).forEach(nodeId => {
                const r = parseInt(nodeId.split("-")[0]);
                const c = parseInt(nodeId.split("-")[1]);
                if (r === currentRow && c !== colRandom && c >= colStart - 1 && c <= colEnd + 1) {
                    if (nodeId === board.start || nodeId === board.target || nodeId === board.object) return;
                    const key = `${r},${c}`;
                    if (!wallsSet.has(key)) {
                        wallsSet.add(key);
                        steps.push(new MazeStep(STEP_TYPES.WALL, r, c));
                    }
                }
            });
            
            if (currentRow - 2 - rowStart > colEnd - colStart) {
                this.recursiveDivision(board, rowStart, currentRow - 2, colStart, colEnd, orientation, surroundingWalls, type, wallsSet, steps);
            } else {
                this.recursiveDivision(board, rowStart, currentRow - 2, colStart, colEnd, 'horizontal', surroundingWalls, type, wallsSet, steps);
            }
            
            if (rowEnd - (currentRow + 2) > colEnd - colStart) {
                this.recursiveDivision(board, currentRow + 2, rowEnd, colStart, colEnd, orientation, surroundingWalls, type, wallsSet, steps);
            } else {
                this.recursiveDivision(board, currentRow + 2, rowEnd, colStart, colEnd, 'vertical', surroundingWalls, type, wallsSet, steps);
            }
        } else {
            const possibleCols = [];
            for (let number = colStart; number <= colEnd; number += 2) {
                possibleCols.push(number);
            }
            const possibleRows = [];
            for (let number = rowStart - 1; number <= rowEnd + 1; number += 2) {
                possibleRows.push(number);
            }
            
            if (possibleCols.length === 0) return;
            
            const randomColIndex = Math.floor(Math.random() * possibleCols.length);
            const randomRowIndex = Math.floor(Math.random() * possibleRows.length);
            const currentCol = possibleCols[randomColIndex];
            const rowRandom = possibleRows[randomRowIndex];
            
            Object.keys(board.nodes).forEach(nodeId => {
                const r = parseInt(nodeId.split("-")[0]);
                const c = parseInt(nodeId.split("-")[1]);
                if (c === currentCol && r !== rowRandom && r >= rowStart - 1 && r <= rowEnd + 1) {
                    if (nodeId === board.start || nodeId === board.target || nodeId === board.object) return;
                    const key = `${r},${c}`;
                    if (!wallsSet.has(key)) {
                        wallsSet.add(key);
                        steps.push(new MazeStep(STEP_TYPES.WALL, r, c));
                    }
                }
            });
            
            if (rowEnd - rowStart > currentCol - 2 - colStart) {
                this.recursiveDivision(board, rowStart, rowEnd, colStart, currentCol - 2, 'horizontal', surroundingWalls, type, wallsSet, steps);
            } else {
                this.recursiveDivision(board, rowStart, rowEnd, colStart, currentCol - 2, 'horizontal', surroundingWalls, type, wallsSet, steps);
            }
            
            if (rowEnd - rowStart > colEnd - (currentCol + 2)) {
                this.recursiveDivision(board, rowStart, rowEnd, currentCol + 2, colEnd, 'horizontal', surroundingWalls, type, wallsSet, steps);
            } else {
                this.recursiveDivision(board, rowStart, rowEnd, currentCol + 2, colEnd, orientation, surroundingWalls, type, wallsSet, steps);
            }
        }
    }
}

// basic random maze
class BasicRandomMaze {
    static generate(rows, cols, startNode, endNode) {
        const startTime = performance.now();
        const steps = [];
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r === startNode?.row && c === startNode?.col) ||
                    (r === endNode?.row && c === endNode?.col)) {
                    continue;
                }
                
                const random = Math.random();
                if (random < 0.25) {
                    steps.push(new MazeStep(STEP_TYPES.WALL, r, c));
                }
            }
        }
        
        const endTime = performance.now();
        perfLog.generation = endTime - startTime;
        perfLog.totalSteps = steps.length;
        logPerf('Maze Generation', perfLog.generation);
        
        return steps;
    }
}

// prim's algorithm for maze generation
class PrimsMaze {
    static generate(rows, cols, startNode, endNode) {
        const startTime = performance.now();
        const steps = [];
        const wallsSet = new Set();
        const visited = new Set();
        
        // prim's algorithm - build directly
        const frontier = [];
        
        // start from a random even cell
        const startR = Math.floor(Math.random() * Math.floor(rows / 2)) * 2;
        const startC = Math.floor(Math.random() * Math.floor(cols / 2)) * 2;
        visited.add(`${startR},${startC}`);
        
        // add neighbors to frontier
        const neighbors = [[0, 2], [2, 0], [0, -2], [-2, 0]];
        for (const [dr, dc] of neighbors) {
            const nr = startR + dr;
            const nc = startC + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && nr % 2 === 0 && nc % 2 === 0) {
                frontier.push({r: nr, c: nc, from: {r: startR, c: startC}});
            }
        }
        
        // track which walls need to exist
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r === startNode?.row && c === startNode?.col) ||
                    (r === endNode?.row && c === endNode?.col)) {
                    continue;
                }
                if (r % 2 === 0 && c % 2 === 0) continue;
                wallsSet.add(`${r},${c}`);
            }
        }
        
        while (frontier.length > 0) {
            const randomIndex = Math.floor(Math.random() * frontier.length);
            const current = frontier.splice(randomIndex, 1)[0];
            const key = `${current.r},${current.c}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            // carve path between current and from
            const midR = (current.r + current.from.r) / 2;
            const midC = (current.c + current.from.c) / 2;
            const midKey = `${midR},${midC}`;
            if (wallsSet.has(midKey)) {
                wallsSet.delete(midKey);
                steps.push(new MazeStep(STEP_TYPES.CARVE, midR, midC));
            }
            
            // add new neighbors
            for (const [dr, dc] of neighbors) {
                const nr = current.r + dr;
                const nc = current.c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && nr % 2 === 0 && nc % 2 === 0) {
                    const nKey = `${nr},${nc}`;
                    if (!visited.has(nKey)) {
                        frontier.push({r: nr, c: nc, from: {r: current.r, c: current.c}});
                    }
                }
            }
        }
        
        // add all remaining walls at once at the end (builds pattern instantly)
        const remainingWalls = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r === startNode?.row && c === startNode?.col) ||
                    (r === endNode?.row && c === endNode?.col)) {
                    continue;
                }
                if (r % 2 === 0 && c % 2 === 0) continue;
                const key = `${r},${c}`;
                if (wallsSet.has(key)) {
                    remainingWalls.push(new MazeStep(STEP_TYPES.WALL, r, c));
                }
            }
        }
        // add walls in single batch at the end
        steps.push(...remainingWalls);
        
        const endTime = performance.now();
        perfLog.generation = endTime - startTime;
        perfLog.totalSteps = steps.length;
        logPerf('Prims Maze Generation', perfLog.generation);
        
        return steps;
    }
}

// kruskal's algorithm for maze generation
class KruskalMaze {
    static generate(rows, cols, startNode, endNode) {
        const startTime = performance.now();
        const steps = [];
        const wallsSet = new Set();
        
        // track all wall positions internally
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r === startNode?.row && c === startNode?.col) ||
                    (r === endNode?.row && c === endNode?.col)) {
                    continue;
                }
                if (r % 2 === 0 && c % 2 === 0) continue;
                wallsSet.add(`${r},${c}`);
            }
        }
        
        // union-find data structure
        const parent = {};
        const find = (r, c) => {
            const key = `${r},${c}`;
            if (!parent[key]) parent[key] = key;
            if (parent[key] !== key) {
                const [pr, pc] = parent[key].split(',').map(Number);
                parent[key] = find(pr, pc);
            }
            return parent[key];
        };
        
        const union = (r1, c1, r2, c2) => {
            const root1 = find(r1, c1);
            const root2 = find(r2, c2);
            if (root1 !== root2) {
                parent[root2] = root1;
                return true;
            }
            return false;
        };
        
        // create list of all walls between cells
        const walls = [];
        for (let r = 0; r < rows; r += 2) {
            for (let c = 0; c < cols; c += 2) {
                if (r + 2 < rows) {
                    walls.push({r: r + 1, c: c, cell1: {r, c}, cell2: {r: r + 2, c}});
                }
                if (c + 2 < cols) {
                    walls.push({r: r, c: c + 1, cell1: {r, c}, cell2: {r, c: c + 2}});
                }
            }
        }
        
        // shuffle walls
        for (let i = walls.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [walls[i], walls[j]] = [walls[j], walls[i]];
        }
        
        // kruskal's algorithm - carve paths
        for (const wall of walls) {
            if (union(wall.cell1.r, wall.cell1.c, wall.cell2.r, wall.cell2.c)) {
                const key = `${wall.r},${wall.c}`;
                if (wallsSet.has(key)) {
                    wallsSet.delete(key);
                    steps.push(new MazeStep(STEP_TYPES.CARVE, wall.r, wall.c));
                }
            }
        }
        
        // add remaining walls at the end
        const remainingWalls = [];
        for (const key of wallsSet) {
            const [r, c] = key.split(',').map(Number);
            remainingWalls.push(new MazeStep(STEP_TYPES.WALL, r, c));
        }
        steps.push(...remainingWalls);
        
        const endTime = performance.now();
        perfLog.generation = endTime - startTime;
        perfLog.totalSteps = steps.length;
        logPerf('Kruskal Maze Generation', perfLog.generation);
        
        return steps;
    }
}

// recursive backtracking maze generation
class RecursiveBacktracking {
    static generate(rows, cols, startNode, endNode) {
        const startTime = performance.now();
        const steps = [];
        const wallsSet = new Set();
        
        // track wall positions internally
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r === startNode?.row && c === startNode?.col) ||
                    (r === endNode?.row && c === endNode?.col)) {
                    continue;
                }
                if (r % 2 === 0 && c % 2 === 0) continue;
                wallsSet.add(`${r},${c}`);
            }
        }
        
        const visited = new Set();
        const stack = [];
        
        // start from a random even cell
        const startR = Math.floor(Math.random() * Math.floor(rows / 2)) * 2;
        const startC = Math.floor(Math.random() * Math.floor(cols / 2)) * 2;
        stack.push({r: startR, c: startC});
        visited.add(`${startR},${startC}`);
        
        const directions = [[0, 2], [2, 0], [0, -2], [-2, 0]];
        
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = [];
            
            for (const [dr, dc] of directions) {
                const nr = current.r + dr;
                const nc = current.c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && 
                    nr % 2 === 0 && nc % 2 === 0 && !visited.has(`${nr},${nc}`)) {
                    neighbors.push({r: nr, c: nc, mid: {r: current.r + dr/2, c: current.c + dc/2}});
                }
            }
            
            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                visited.add(`${next.r},${next.c}`);
                stack.push({r: next.r, c: next.c});
                
                // carve path
                const midKey = `${next.mid.r},${next.mid.c}`;
                if (wallsSet.has(midKey)) {
                    wallsSet.delete(midKey);
                    steps.push(new MazeStep(STEP_TYPES.CARVE, next.mid.r, next.mid.c));
                }
            } else {
                stack.pop();
            }
        }
        
        // add remaining walls at the end
        const remainingWalls = [];
        for (const key of wallsSet) {
            const [r, c] = key.split(',').map(Number);
            remainingWalls.push(new MazeStep(STEP_TYPES.WALL, r, c));
        }
        steps.push(...remainingWalls);
        
        const endTime = performance.now();
        perfLog.generation = endTime - startTime;
        perfLog.totalSteps = steps.length;
        logPerf('Recursive Backtracking Generation', perfLog.generation);
        
        return steps;
    }
}

// wilson's algorithm for maze generation
class WilsonMaze {
    static generate(rows, cols, startNode, endNode) {
        const startTime = performance.now();
        const steps = [];
        const wallsSet = new Set();
        
        // track wall positions internally
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r === startNode?.row && c === startNode?.col) ||
                    (r === endNode?.row && c === endNode?.col)) {
                    continue;
                }
                if (r % 2 === 0 && c % 2 === 0) continue;
                wallsSet.add(`${r},${c}`);
            }
        }
        
        const inMaze = new Set();
        const directions = [[0, 2], [2, 0], [0, -2], [-2, 0]];
        
        // start with one cell in maze
        const startR = Math.floor(Math.random() * Math.floor(rows / 2)) * 2;
        const startC = Math.floor(Math.random() * Math.floor(cols / 2)) * 2;
        inMaze.add(`${startR},${startC}`);
        
        // get all cells that need to be added
        const unvisited = [];
        for (let r = 0; r < rows; r += 2) {
            for (let c = 0; c < cols; c += 2) {
                if (!inMaze.has(`${r},${c}`)) {
                    unvisited.push({r, c});
                }
            }
        }
        
        while (unvisited.length > 0) {
            // pick random unvisited cell
            const randomIndex = Math.floor(Math.random() * unvisited.length);
            let current = unvisited[randomIndex];
            const path = [current];
            const visitedInPath = new Set();
            visitedInPath.add(`${current.r},${current.c}`);
            
            // random walk until we hit the maze
            while (!inMaze.has(`${current.r},${current.c}`)) {
                const neighbors = [];
                for (const [dr, dc] of directions) {
                    const nr = current.r + dr;
                    const nc = current.c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && nr % 2 === 0 && nc % 2 === 0) {
                        neighbors.push({r: nr, c: nc});
                    }
                }
                
                if (neighbors.length === 0) break;
                
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                
                // if we've seen this cell, erase loop
                if (visitedInPath.has(`${next.r},${next.c}`)) {
                    const loopIndex = path.findIndex(p => p.r === next.r && p.c === next.c);
                    path.splice(loopIndex + 1);
                    visitedInPath.clear();
                    for (const p of path) {
                        visitedInPath.add(`${p.r},${p.c}`);
                    }
                } else {
                    path.push(next);
                    visitedInPath.add(`${next.r},${next.c}`);
                }
                
                current = next;
            }
            
            // add path to maze
            for (let i = 0; i < path.length; i++) {
                const cell = path[i];
                inMaze.add(`${cell.r},${cell.c}`);
                const index = unvisited.findIndex(u => u.r === cell.r && u.c === cell.c);
                if (index !== -1) {
                    unvisited.splice(index, 1);
                }
                
                if (i > 0) {
                    const prev = path[i - 1];
                    const midR = (cell.r + prev.r) / 2;
                    const midC = (cell.c + prev.c) / 2;
                    const midKey = `${midR},${midC}`;
                    if (wallsSet.has(midKey)) {
                        wallsSet.delete(midKey);
                        steps.push(new MazeStep(STEP_TYPES.CARVE, midR, midC));
                    }
                }
            }
        }
        
        // add remaining walls at the end
        const remainingWalls = [];
        for (const key of wallsSet) {
            const [r, c] = key.split(',').map(Number);
            remainingWalls.push(new MazeStep(STEP_TYPES.WALL, r, c));
        }
        steps.push(...remainingWalls);
        
        const endTime = performance.now();
        perfLog.generation = endTime - startTime;
        perfLog.totalSteps = steps.length;
        logPerf('Wilson Maze Generation', perfLog.generation);
        
        return steps;
    }
}

// eller's algorithm for maze generation
class EllersMaze {
    static generate(rows, cols, startNode, endNode) {
        const startTime = performance.now();
        const steps = [];
        const wallsSet = new Set();
        
        // track wall positions internally
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r === startNode?.row && c === startNode?.col) ||
                    (r === endNode?.row && c === endNode?.col)) {
                    continue;
                }
                if (r % 2 === 0 && c % 2 === 0) continue;
                wallsSet.add(`${r},${c}`);
            }
        }
        
        // union-find for sets
        const sets = new Map();
        let nextSet = 0;
        
        const getSet = (c) => {
            if (!sets.has(c)) {
                sets.set(c, nextSet++);
            }
            return sets.get(c);
        };
        
        const mergeSets = (c1, c2) => {
            const set1 = sets.get(c1);
            const set2 = sets.get(c2);
            if (set1 !== set2) {
                for (const [col, set] of sets.entries()) {
                    if (set === set2) {
                        sets.set(col, set1);
                    }
                }
            }
        };
        
        // process each row
        for (let r = 0; r < rows; r += 2) {
            // assign sets to cells in current row
            for (let c = 0; c < cols; c += 2) {
                if (!sets.has(c)) {
                    sets.set(c, nextSet++);
                }
            }
            
            // create right walls (except last row)
            if (r < rows - 2) {
                for (let c = 0; c < cols - 2; c += 2) {
                    const shouldMerge = Math.random() < 0.5 || sets.get(c) === sets.get(c + 2);
                    if (!shouldMerge) {
                        mergeSets(c, c + 2);
                        const wallKey = `${r},${c + 1}`;
                        if (wallsSet.has(wallKey)) {
                            wallsSet.delete(wallKey);
                            steps.push(new MazeStep(STEP_TYPES.CARVE, r, c + 1));
                        }
                    }
                }
            }
            
            // create bottom walls
            if (r < rows - 2) {
                const bottomWalls = [];
                for (let c = 0; c < cols; c += 2) {
                    bottomWalls.push(c);
                }
                
                // ensure each set has at least one passage
                const setPassages = new Set();
                for (let c = 0; c < cols; c += 2) {
                    const set = sets.get(c);
                    if (!setPassages.has(set)) {
                        setPassages.add(set);
                        const wallKey = `${r + 1},${c}`;
                        if (wallsSet.has(wallKey)) {
                            wallsSet.delete(wallKey);
                            steps.push(new MazeStep(STEP_TYPES.CARVE, r + 1, c));
                        }
                        bottomWalls.splice(bottomWalls.indexOf(c), 1);
                    }
                }
                
                // randomly remove more bottom walls
                for (const c of bottomWalls) {
                    if (Math.random() < 0.5) {
                        const wallKey = `${r + 1},${c}`;
                        if (wallsSet.has(wallKey)) {
                            wallsSet.delete(wallKey);
                            steps.push(new MazeStep(STEP_TYPES.CARVE, r + 1, c));
                        }
                    }
                }
            }
            
            // prepare for next row
            if (r < rows - 2) {
                const newSets = new Map();
                for (let c = 0; c < cols; c += 2) {
                    const wallKey = `${r + 1},${c}`;
                    if (!wallsSet.has(wallKey)) {
                        newSets.set(c, sets.get(c));
                    } else {
                        newSets.set(c, nextSet++);
                    }
                }
                sets.clear();
                newSets.forEach((set, c) => sets.set(c, set));
            }
        }
        
        // add remaining walls at the end
        const remainingWalls = [];
        for (const key of wallsSet) {
            const [r, c] = key.split(',').map(Number);
            remainingWalls.push(new MazeStep(STEP_TYPES.WALL, r, c));
        }
        steps.push(...remainingWalls);
        
        const endTime = performance.now();
        perfLog.generation = endTime - startTime;
        perfLog.totalSteps = steps.length;
        logPerf('Ellers Maze Generation', perfLog.generation);
        
        return steps;
    }
}

// sidewinder algorithm for maze generation
class SideWinderMaze {
    static generate(rows, cols, startNode, endNode) {
        const startTime = performance.now();
        const steps = [];
        const wallsSet = new Set();
        
        // track wall positions internally
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r === startNode?.row && c === startNode?.col) ||
                    (r === endNode?.row && c === endNode?.col)) {
                    continue;
                }
                if (r % 2 === 0 && c % 2 === 0) continue;
                wallsSet.add(`${r},${c}`);
            }
        }
        
        // sidewinder algorithm
        for (let r = 0; r < rows; r += 2) {
            let run = [];
            
            for (let c = 0; c < cols; c += 2) {
                run.push({r, c});
                
                const atEasternBoundary = (c === cols - 1);
                const atNorthernBoundary = (r === 0);
                
                const shouldCloseOut = atEasternBoundary || (!atNorthernBoundary && Math.random() < 0.5);
                
                if (shouldCloseOut) {
                    const member = run[Math.floor(Math.random() * run.length)];
                    
                    if (!atNorthernBoundary) {
                        const wallKey = `${member.r - 1},${member.c}`;
                        if (wallsSet.has(wallKey)) {
                            wallsSet.delete(wallKey);
                            steps.push(new MazeStep(STEP_TYPES.CARVE, member.r - 1, member.c));
                        }
                    }
                    
                    run = [];
                } else {
                    const current = run[run.length - 1];
                    const wallKey = `${current.r},${current.c + 1}`;
                    if (wallsSet.has(wallKey)) {
                        wallsSet.delete(wallKey);
                        steps.push(new MazeStep(STEP_TYPES.CARVE, current.r, current.c + 1));
                    }
                }
            }
        }
        
        // add remaining walls at the end
        const remainingWalls = [];
        for (const key of wallsSet) {
            const [r, c] = key.split(',').map(Number);
            remainingWalls.push(new MazeStep(STEP_TYPES.WALL, r, c));
        }
        steps.push(...remainingWalls);
        
        const endTime = performance.now();
        perfLog.generation = endTime - startTime;
        perfLog.totalSteps = steps.length;
        logPerf('Side Winder Generation', perfLog.generation);
        
        return steps;
    }
}

// binary tree algorithm for maze generation
class BinaryTreeMaze {
    static generate(rows, cols, startNode, endNode) {
        const startTime = performance.now();
        const steps = [];
        const wallsSet = new Set();
        
        // track wall positions internally
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r === startNode?.row && c === startNode?.col) ||
                    (r === endNode?.row && c === endNode?.col)) {
                    continue;
                }
                if (r % 2 === 0 && c % 2 === 0) continue;
                wallsSet.add(`${r},${c}`);
            }
        }
        
        // binary tree algorithm
        for (let r = 0; r < rows; r += 2) {
            for (let c = 0; c < cols; c += 2) {
                const neighbors = [];
                
                // north neighbor
                if (r > 0) {
                    neighbors.push({r: r - 1, c: c, dir: 'north'});
                }
                // east neighbor
                if (c < cols - 1) {
                    neighbors.push({r: r, c: c + 1, dir: 'east'});
                }
                
                if (neighbors.length > 0) {
                    const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                    const wallKey = `${neighbor.r},${neighbor.c}`;
                    if (wallsSet.has(wallKey)) {
                        wallsSet.delete(wallKey);
                        steps.push(new MazeStep(STEP_TYPES.CARVE, neighbor.r, neighbor.c));
                    }
                }
            }
        }
        
        // add remaining walls at the end
        const remainingWalls = [];
        for (const key of wallsSet) {
            const [r, c] = key.split(',').map(Number);
            remainingWalls.push(new MazeStep(STEP_TYPES.WALL, r, c));
        }
        steps.push(...remainingWalls);
        
        const endTime = performance.now();
        perfLog.generation = endTime - startTime;
        perfLog.totalSteps = steps.length;
        logPerf('Binary Tree Generation', perfLog.generation);
        
        return steps;
    }
}

// labyrinth pattern maze (proper spiral labyrinth)
class LabyrinthMaze {
    static generate(rows, cols, startNode, endNode) {
        const startTime = performance.now();
        const steps = [];
        const wallsSet = new Set();
        
        // helper to get random odd number in range
        const getRandomOddNumber = (min, max) => {
            const range = max - min;
            if (range <= 0) return 0;
            const random = Math.floor(Math.random() * (range / 2 + 1));
            return min + random * 2;
        };
        
        // add stages (horizontal and vertical wall layers)
        for (let row = 1; row < rows / 2; row += 2) {
            for (let col = row; col < cols - row; col++) {
                if ((row === startNode?.row && col === startNode?.col) ||
                    (row === endNode?.row && col === endNode?.col) ||
                    (rows - row - 1 === startNode?.row && col === startNode?.col) ||
                    (rows - row - 1 === endNode?.row && col === endNode?.col)) {
                    continue;
                }
                wallsSet.add(`${row},${col}`);
                wallsSet.add(`${rows - row - 1},${col}`);
            }
        }
        
        for (let col = 1; col < cols / 2; col += 2) {
            for (let row = col; row < rows - col - 1; row++) {
                if ((row === startNode?.row && col === startNode?.col) ||
                    (row === endNode?.row && col === endNode?.col) ||
                    (row === startNode?.row && cols - col - 1 === startNode?.col) ||
                    (row === endNode?.row && cols - col - 1 === endNode?.col)) {
                    continue;
                }
                wallsSet.add(`${row},${col}`);
                wallsSet.add(`${row},${cols - col - 1}`);
            }
        }
        
        // add stages to steps
        for (const key of wallsSet) {
            const [r, c] = key.split(',').map(Number);
            steps.push(new MazeStep(STEP_TYPES.WALL, r, c));
        }
        
        const maxStage = Math.min(rows, cols) / 2 - 2;
        
        for (let stage = 0; stage < maxStage; stage += 2) {
            let left = 0, right = 0, top = 0, bottom = 0;
            
            // add horizontal blocks
            if (rows - 2 * stage > 5) {
                const topCol = getRandomOddNumber(stage + 2, cols - stage - 3);
                const bottomCol = getRandomOddNumber(stage + 2, cols - stage - 3);
                
                if (topCol > 0 && (stage !== startNode?.row || topCol !== startNode?.col) &&
                    (stage !== endNode?.row || topCol !== endNode?.col)) {
                    wallsSet.add(`${stage},${topCol}`);
                    steps.push(new MazeStep(STEP_TYPES.WALL, stage, topCol));
                }
                
                if (bottomCol > 0 && (rows - stage - 1 !== startNode?.row || bottomCol !== startNode?.col) &&
                    (rows - stage - 1 !== endNode?.row || bottomCol !== endNode?.col)) {
                    wallsSet.add(`${rows - stage - 1},${bottomCol}`);
                    steps.push(new MazeStep(STEP_TYPES.WALL, rows - stage - 1, bottomCol));
                }
                
                left = topCol;
                right = bottomCol;
            }
            
            // add vertical blocks
            if (cols - 2 * stage > 5) {
                const leftRow = getRandomOddNumber(stage + 2, rows - stage - 3);
                const rightRow = getRandomOddNumber(stage + 2, rows - stage - 3);
                
                if (leftRow > 0 && (leftRow !== startNode?.row || stage !== startNode?.col) &&
                    (leftRow !== endNode?.row || stage !== endNode?.col)) {
                    wallsSet.add(`${leftRow},${stage}`);
                    steps.push(new MazeStep(STEP_TYPES.WALL, leftRow, stage));
                }
                
                if (rightRow > 0 && (rightRow !== startNode?.row || cols - stage - 1 !== startNode?.col) &&
                    (rightRow !== endNode?.row || cols - stage - 1 !== endNode?.col)) {
                    wallsSet.add(`${rightRow},${cols - stage - 1}`);
                    steps.push(new MazeStep(STEP_TYPES.WALL, rightRow, cols - stage - 1));
                }
                
                top = leftRow;
                bottom = rightRow;
            }
            
            // add gaps to ensure connectivity
            if (rows - 2 * stage > 5 || cols - 2 * stage > 5) {
                const gapCells = [];
                
                // top-right cells
                if (top > 0) {
                    for (let i = top + 1; i < cols - stage - 1; i += 2) {
                        gapCells.push({r: stage + 1, c: i});
                    }
                }
                if (right > 0) {
                    for (let i = stage + 2; i < right; i += 2) {
                        gapCells.push({r: i, c: cols - stage - 2});
                    }
                }
                
                // right-bottom cells
                if (right > 0) {
                    for (let i = right + 1; i < rows - stage - 1; i += 2) {
                        gapCells.push({r: i, c: cols - stage - 2});
                    }
                }
                if (bottom > 0) {
                    for (let i = cols - stage - 3; i > bottom; i -= 2) {
                        gapCells.push({r: rows - stage - 2, c: i});
                    }
                }
                
                // bottom-left cells
                if (bottom > 0) {
                    for (let i = bottom - 1; i > stage; i -= 2) {
                        gapCells.push({r: rows - stage - 2, c: i});
                    }
                }
                if (left > 0) {
                    for (let i = rows - stage - 3; i > left; i -= 2) {
                        gapCells.push({r: i, c: stage + 1});
                    }
                }
                
                // left-top cells
                if (left > 0) {
                    for (let i = left - 1; i > stage + 1; i -= 2) {
                        gapCells.push({r: i, c: stage + 1});
                    }
                }
                if (top > 0) {
                    for (let i = stage + 2; i < top; i += 2) {
                        gapCells.push({r: stage + 1, c: i});
                    }
                }
                
                // carve gaps (remove walls)
                if (top === 0 || right === 0) {
                    // carve at least 2 gaps
                    if (gapCells.length >= 2) {
                        const idx1 = Math.floor(Math.random() * gapCells.length);
                        let idx2 = Math.floor(Math.random() * gapCells.length);
                        while (idx2 === idx1 && gapCells.length > 1) {
                            idx2 = Math.floor(Math.random() * gapCells.length);
                        }
                        const cell1 = gapCells[idx1];
                        const cell2 = gapCells[idx2];
                        if (wallsSet.has(`${cell1.r},${cell1.c}`)) {
                            wallsSet.delete(`${cell1.r},${cell1.c}`);
                            steps.push(new MazeStep(STEP_TYPES.CARVE, cell1.r, cell1.c));
                        }
                        if (wallsSet.has(`${cell2.r},${cell2.c}`)) {
                            wallsSet.delete(`${cell2.r},${cell2.c}`);
                            steps.push(new MazeStep(STEP_TYPES.CARVE, cell2.r, cell2.c));
                        }
                    }
                } else {
                    // carve 4 gaps (one per quadrant)
                    const topRightCells = [];
                    const rightBottomCells = [];
                    const bottomLeftCells = [];
                    const leftTopCells = [];
                    
                    if (top > 0) {
                        for (let i = top + 1; i < cols - stage - 1; i += 2) {
                            topRightCells.push({r: stage + 1, c: i});
                        }
                    }
                    if (right > 0) {
                        for (let i = stage + 2; i < right; i += 2) {
                            topRightCells.push({r: i, c: cols - stage - 2});
                        }
                    }
                    
                    if (right > 0) {
                        for (let i = right + 1; i < rows - stage - 1; i += 2) {
                            rightBottomCells.push({r: i, c: cols - stage - 2});
                        }
                    }
                    if (bottom > 0) {
                        for (let i = cols - stage - 3; i > bottom; i -= 2) {
                            rightBottomCells.push({r: rows - stage - 2, c: i});
                        }
                    }
                    
                    if (bottom > 0) {
                        for (let i = bottom - 1; i > stage; i -= 2) {
                            bottomLeftCells.push({r: rows - stage - 2, c: i});
                        }
                    }
                    if (left > 0) {
                        for (let i = rows - stage - 3; i > left; i -= 2) {
                            bottomLeftCells.push({r: i, c: stage + 1});
                        }
                    }
                    
                    if (left > 0) {
                        for (let i = left - 1; i > stage + 1; i -= 2) {
                            leftTopCells.push({r: i, c: stage + 1});
                        }
                    }
                    if (top > 0) {
                        for (let i = stage + 2; i < top; i += 2) {
                            leftTopCells.push({r: stage + 1, c: i});
                        }
                    }
                    
                    // carve one gap from each quadrant
                    if (topRightCells.length > 0) {
                        const cell = topRightCells[Math.floor(Math.random() * topRightCells.length)];
                        if (wallsSet.has(`${cell.r},${cell.c}`)) {
                            wallsSet.delete(`${cell.r},${cell.c}`);
                            steps.push(new MazeStep(STEP_TYPES.CARVE, cell.r, cell.c));
                        }
                    }
                    if (rightBottomCells.length > 0) {
                        const cell = rightBottomCells[Math.floor(Math.random() * rightBottomCells.length)];
                        if (wallsSet.has(`${cell.r},${cell.c}`)) {
                            wallsSet.delete(`${cell.r},${cell.c}`);
                            steps.push(new MazeStep(STEP_TYPES.CARVE, cell.r, cell.c));
                        }
                    }
                    if (bottomLeftCells.length > 0) {
                        const cell = bottomLeftCells[Math.floor(Math.random() * bottomLeftCells.length)];
                        if (wallsSet.has(`${cell.r},${cell.c}`)) {
                            wallsSet.delete(`${cell.r},${cell.c}`);
                            steps.push(new MazeStep(STEP_TYPES.CARVE, cell.r, cell.c));
                        }
                    }
                    if (leftTopCells.length > 0) {
                        const cell = leftTopCells[Math.floor(Math.random() * leftTopCells.length)];
                        if (wallsSet.has(`${cell.r},${cell.c}`)) {
                            wallsSet.delete(`${cell.r},${cell.c}`);
                            steps.push(new MazeStep(STEP_TYPES.CARVE, cell.r, cell.c));
                        }
                    }
                }
            }
        }
        
        // handle center loop for square grids
        const centerPos = Math.floor(rows / 2);
        if (rows === cols && centerPos % 2 === 0) {
            const centerLoop = [
                {r: centerPos, c: centerPos - 1},
                {r: centerPos, c: centerPos + 1},
                {r: centerPos - 1, c: centerPos},
                {r: centerPos + 1, c: centerPos}
            ];
            
            const random = Math.floor(Math.random() * centerLoop.length);
            const cell = centerLoop[random];
            if (wallsSet.has(`${cell.r},${cell.c}`)) {
                wallsSet.delete(`${cell.r},${cell.c}`);
                steps.push(new MazeStep(STEP_TYPES.CARVE, cell.r, cell.c));
            }
        }
        
        const endTime = performance.now();
        perfLog.generation = endTime - startTime;
        perfLog.totalSteps = steps.length;
        logPerf('Labyrinth Generation', perfLog.generation);
        
        return steps;
    }
}

// maze generator facade
class WeightedMaze {
    static generate(rows, cols, startNode, endNode) {
        const startTime = performance.now();
        const steps = [];
        const weightsSet = new Set();
        
        // create board-like object for compatibility with original algorithm
        const board = {
            rows: rows,
            cols: cols,
            height: rows,
            width: cols,
            start: startNode ? `${startNode.row}-${startNode.col}` : null,
            target: endNode ? `${endNode.row}-${endNode.col}` : null,
            object: null,
            nodes: {}
        };
        
        // build node map for checking
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const nodeId = `${r}-${c}`;
                board.nodes[nodeId] = {
                    id: nodeId,
                    status: (r === startNode?.row && c === startNode?.col) ? 'start' : 
                            (r === endNode?.row && c === endNode?.col) ? 'target' : 'unvisited'
                };
            }
        }
        
        // use recursive division but with random weights instead of walls
        this.recursiveDivision(board, 2, rows - 3, 2, cols - 3, 'horizontal', false, 'weight', weightsSet, steps);
        
        const endTime = performance.now();
        perfLog.generation = endTime - startTime;
        perfLog.totalSteps = steps.length;
        logPerf('Weighted Maze Generation', perfLog.generation);
        logPerf('Total Steps', perfLog.totalSteps);
        
        return steps;
    }
    
    // helper function to get random weight value
    static getRandomWeight() {
        const rand = Math.random();
        // 40% chance for weight 2-3, 30% for 4-5, 30% for 15
        if (rand < 0.4) {
            return Math.random() < 0.5 ? 2 : 3;
        } else if (rand < 0.7) {
            return Math.random() < 0.5 ? 4 : 5;
        } else {
            return 15;
        }
    }
    
    static recursiveDivision(board, rowStart, rowEnd, colStart, colEnd, orientation, surroundingWalls, type, weightsSet, steps) {
        if (rowEnd < rowStart || colEnd < colStart) {
            return;
        }
        
        if (!surroundingWalls) {
            const relevantIds = [board.start, board.target];
            if (board.object) relevantIds.push(board.object);
            
            // create border weights (instead of walls)
            Object.keys(board.nodes).forEach(nodeId => {
                if (!relevantIds.includes(nodeId)) {
                    const r = parseInt(nodeId.split("-")[0]);
                    const c = parseInt(nodeId.split("-")[1]);
                    if (r === 0 || c === 0 || r === board.height - 1 || c === board.width - 1) {
                        const key = `${r},${c}`;
                        if (!weightsSet.has(key)) {
                            weightsSet.add(key);
                            steps.push(new MazeStep('weight', r, c, this.getRandomWeight()));
                        }
                    }
                }
            });
            surroundingWalls = true;
        }
        
        if (orientation === 'horizontal') {
            const possibleRows = [];
            for (let number = rowStart; number <= rowEnd; number += 2) {
                possibleRows.push(number);
            }
            const possibleCols = [];
            for (let number = colStart - 1; number <= colEnd + 1; number += 2) {
                possibleCols.push(number);
            }
            
            if (possibleRows.length === 0) return;
            
            const randomRowIndex = Math.floor(Math.random() * possibleRows.length);
            const randomColIndex = Math.floor(Math.random() * possibleCols.length);
            const currentRow = possibleRows[randomRowIndex];
            const colRandom = possibleCols[randomColIndex];
            
            Object.keys(board.nodes).forEach(nodeId => {
                const r = parseInt(nodeId.split("-")[0]);
                const c = parseInt(nodeId.split("-")[1]);
                if (r === currentRow && c !== colRandom && c >= colStart - 1 && c <= colEnd + 1) {
                    // skip if this is start, target, or object node
                    if (nodeId === board.start || nodeId === board.target || nodeId === board.object) {
                        return;
                    }
                    const key = `${r},${c}`;
                    if (!weightsSet.has(key)) {
                        weightsSet.add(key);
                        steps.push(new MazeStep('weight', r, c, this.getRandomWeight()));
                    }
                }
            });
            
            if (currentRow - 2 - rowStart > colEnd - colStart) {
                this.recursiveDivision(board, rowStart, currentRow - 2, colStart, colEnd, orientation, surroundingWalls, type, weightsSet, steps);
            } else {
                this.recursiveDivision(board, rowStart, currentRow - 2, colStart, colEnd, 'vertical', surroundingWalls, type, weightsSet, steps);
            }
            
            if (rowEnd - (currentRow + 2) > colEnd - colStart) {
                this.recursiveDivision(board, currentRow + 2, rowEnd, colStart, colEnd, orientation, surroundingWalls, type, weightsSet, steps);
            } else {
                this.recursiveDivision(board, currentRow + 2, rowEnd, colStart, colEnd, 'vertical', surroundingWalls, type, weightsSet, steps);
            }
        } else {
            const possibleCols = [];
            for (let number = colStart; number <= colEnd; number += 2) {
                possibleCols.push(number);
            }
            const possibleRows = [];
            for (let number = rowStart - 1; number <= rowEnd + 1; number += 2) {
                possibleRows.push(number);
            }
            
            if (possibleCols.length === 0) return;
            
            const randomColIndex = Math.floor(Math.random() * possibleCols.length);
            const randomRowIndex = Math.floor(Math.random() * possibleRows.length);
            const currentCol = possibleCols[randomColIndex];
            const rowRandom = possibleRows[randomRowIndex];
            
            Object.keys(board.nodes).forEach(nodeId => {
                const r = parseInt(nodeId.split("-")[0]);
                const c = parseInt(nodeId.split("-")[1]);
                if (c === currentCol && r !== rowRandom && r >= rowStart - 1 && r <= rowEnd + 1) {
                    // skip if this is start, target, or object node
                    if (nodeId === board.start || nodeId === board.target || nodeId === board.object) {
                        return;
                    }
                    const key = `${r},${c}`;
                    if (!weightsSet.has(key)) {
                        weightsSet.add(key);
                        steps.push(new MazeStep('weight', r, c, this.getRandomWeight()));
                    }
                }
            });
            
            if (rowEnd - rowStart > currentCol - 2 - colStart) {
                this.recursiveDivision(board, rowStart, rowEnd, colStart, currentCol - 2, 'horizontal', surroundingWalls, type, weightsSet, steps);
            } else {
                this.recursiveDivision(board, rowStart, rowEnd, colStart, currentCol - 2, orientation, surroundingWalls, type, weightsSet, steps);
            }
            
            if (rowEnd - rowStart > colEnd - (currentCol + 2)) {
                this.recursiveDivision(board, rowStart, rowEnd, currentCol + 2, colEnd, 'horizontal', surroundingWalls, type, weightsSet, steps);
            } else {
                this.recursiveDivision(board, rowStart, rowEnd, currentCol + 2, colEnd, orientation, surroundingWalls, type, weightsSet, steps);
            }
        }
    }
}

class MazeGenerator {
    static generate(grid, algorithm = 'recursive-division') {
        switch (algorithm) {
            case 'recursive-division':
                return RecursiveDivision.generate(grid.rows, grid.cols, grid.startNode, grid.endNode);
            case 'recursive-division-vertical':
                return RecursiveDivisionVertical.generate(grid.rows, grid.cols, grid.startNode, grid.endNode);
            case 'recursive-division-horizontal':
                return RecursiveDivisionHorizontal.generate(grid.rows, grid.cols, grid.startNode, grid.endNode);
            case 'basic-random':
                return BasicRandomMaze.generate(grid.rows, grid.cols, grid.startNode, grid.endNode);
            case 'weighted-maze':
                return WeightedMaze.generate(grid.rows, grid.cols, grid.startNode, grid.endNode);
            case 'prims':
                return PrimsMaze.generate(grid.rows, grid.cols, grid.startNode, grid.endNode);
            case 'kruskal':
                return KruskalMaze.generate(grid.rows, grid.cols, grid.startNode, grid.endNode);
            case 'recursive-backtracking':
                return RecursiveBacktracking.generate(grid.rows, grid.cols, grid.startNode, grid.endNode);
            case 'wilson':
                return WilsonMaze.generate(grid.rows, grid.cols, grid.startNode, grid.endNode);
            case 'ellers':
                return EllersMaze.generate(grid.rows, grid.cols, grid.startNode, grid.endNode);
            case 'side-winder':
                return SideWinderMaze.generate(grid.rows, grid.cols, grid.startNode, grid.endNode);
            case 'binary-tree':
                return BinaryTreeMaze.generate(grid.rows, grid.cols, grid.startNode, grid.endNode);
            case 'labyrinth':
                return LabyrinthMaze.generate(grid.rows, grid.cols, grid.startNode, grid.endNode);
            default:
                return RecursiveDivision.generate(grid.rows, grid.cols, grid.startNode, grid.endNode);
        }
    }
    
    // async generator that yields steps as they're created
    static async *generateAsync(grid, algorithm = 'recursive-division') {
        const steps = this.generate(grid, algorithm);
        this.stepCount = 0;
        
        // yield steps one by one for real-time visualization
        for (const step of steps) {
            this.stepCount++;
            yield step;
            // yield control every 10 steps to keep UI responsive
            if (this.stepCount % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
    }
}

// optimized maze step player
class MazeStepPlayer {
    constructor(grid, speed = 5) {
        this.grid = grid;
        this.speed = speed;
        this.isPlaying = false;
        this.steps = [];
        this.animationFrameId = null;
        this.glowTimeouts = new Set(); // track timeouts for cleanup
    }
    
    setSpeed(speed) {
        // smoother, slower animation for better visual effect
        this.speed = Math.max(8, Math.min(25, Math.floor((101 - speed) * 0.3)));
    }
    
    // new method: play maze generation in real-time
    async playRealtime(grid, algorithm, statsCallback = null) {
        if (this.isPlaying) {
            this.stop();
        }
        
        this.isPlaying = true;
        this.steps = [];
        
        // clear any pending timeouts
        this.glowTimeouts.forEach(clearTimeout);
        this.glowTimeouts.clear();
        
        // clear all animation styles from nodes
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const node = grid.getNode(row, col);
                if (node && node.element) {
                    const el = node.element;
                    el.classList.remove('maze-building', 'maze-wall-in', 'maze-carve-in', 'maze-out');
                    el.style.transform = '';
                    el.style.opacity = '';
                    el.style.transition = '';
                }
            }
        }
        
        // wait one frame to ensure reset is rendered
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // generate steps in small batches and play immediately for real-time effect
        const batchSize = Math.max(5, this.calculateBatchSize() * 2); // larger batches for generation
        const stepGenerator = MazeGenerator.generateAsync(grid, algorithm);
        
        let batch = [];
        let stepCount = 0;
        let wallCount = 0;
        const startTime = performance.now();
        
        for await (const step of stepGenerator) {
            if (!this.isPlaying) break;
            
            batch.push(step);
            stepCount++;
            if (step.type === STEP_TYPES.WALL || step.type === 'weight') {
                wallCount++;
            }
            
            // process batch when it reaches size or every few steps
            if (batch.length >= batchSize || stepCount % 10 === 0) {
                await new Promise(resolve => {
                    this.animationFrameId = requestAnimationFrame(() => {
                        this.processBatch(batch);
                        resolve();
                    });
                });
                
                // update stats in real-time
                if (statsCallback && stepCount % 20 === 0) {
                    const elapsed = Math.round(performance.now() - startTime);
                    statsCallback(0, 0, elapsed);
                }
                
                // delay between batches for smooth animation
                await this.delay(this.speed);
                batch = [];
            }
        }
        
        // process remaining steps
        if (batch.length > 0 && this.isPlaying) {
            await new Promise(resolve => {
                this.animationFrameId = requestAnimationFrame(() => {
                    this.processBatch(batch);
                    resolve();
                });
            });
        }
        
        // final stats update
        if (statsCallback) {
            const elapsed = Math.round(performance.now() - startTime);
            statsCallback(0, 0, elapsed);
        }
        
        this.isPlaying = false;
    }
    
    async play(steps) {
        if (this.isPlaying) {
            this.stop();
        }
        
        const startTime = performance.now();
        this.steps = steps;
        this.isPlaying = true;
        
        // clear any pending timeouts
        this.glowTimeouts.forEach(clearTimeout);
        this.glowTimeouts.clear();
        
        // ensure grid is ready before starting
        if (this.grid.isReady && !this.grid.isReady()) {
            logPerf('Waiting for grid', 0);
            const ready = await this.grid.waitForReady(500);
            if (!ready) {
                console.error('[Maze] Grid not ready, aborting');
                this.isPlaying = false;
                return;
            }
        }
        
        // reset grid to empty and clear all animation styles
        this.grid.reset();
        
        // clear weights before generating new maze
        this.grid.clearWeights();
        
        // clear all animation styles from nodes
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const node = this.grid.getNode(row, col);
                if (node && node.element) {
                    const el = node.element;
                    el.classList.remove('maze-building', 'maze-wall-in', 'maze-carve-in', 'maze-out');
                    el.style.transform = '';
                    el.style.opacity = '';
                    el.style.transition = '';
                }
            }
        }
        
        // wait one frame to ensure reset is rendered
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // verify grid is still ready after reset
        if (this.grid.isReady && !this.grid.isReady()) {
            console.warn('[Maze] Grid not ready after reset, waiting...');
            await this.grid.waitForReady(300);
        }
        
        // play steps with optimized batching - builds maze in real-time
        const animStartTime = performance.now();
        await this.playStepsOptimized(steps);
        perfLog.animation = performance.now() - animStartTime;
        logPerf('Animation', perfLog.animation);
        
        const totalTime = performance.now() - startTime;
        logPerf('TOTAL MAZE BUILD', totalTime);
        if (window.DEBUG_PERF) {
            console.log('Performance Summary:', {
                generation: `${perfLog.generation.toFixed(2)}ms`,
                animation: `${perfLog.animation.toFixed(2)}ms`,
                total: `${totalTime.toFixed(2)}ms`,
                steps: perfLog.totalSteps,
                domUpdates: perfLog.domUpdates,
                avgTimePerStep: `${(perfLog.animation / steps.length).toFixed(3)}ms`
            });
        }
        
        this.isPlaying = false;
    }
    
    async playStepsOptimized(steps) {
        // calculate optimal batch size based on speed
        const batchSize = this.calculateBatchSize();
        const totalBatches = Math.ceil(steps.length / batchSize);
        
        logPerf('Batch Size', batchSize);
        logPerf('Total Batches', totalBatches);
        
        let processed = 0;
        const startFrame = performance.now();
        
        for (let i = 0; i < steps.length; i += batchSize) {
            if (!this.isPlaying) break;
            
            const batch = steps.slice(i, i + batchSize);
            const batchStart = performance.now();
            
            // process batch in single frame with frame budget checking
            await new Promise(resolve => {
                this.animationFrameId = requestAnimationFrame(() => {
                    const frameStart = performance.now();
                    this.processBatch(batch);
                    const frameTime = performance.now() - frameStart;
                    
                    // if frame took too long, yield immediately to prevent lag
                    if (frameTime > 8) {
                        // frame budget exceeded, yield next frame
                        requestAnimationFrame(() => resolve());
                    } else {
                        resolve();
                    }
                });
            });
            
            processed += batch.length;
            
            // smoother delay for better animation
            const batchTime = performance.now() - batchStart;
            const targetTime = Math.max(8, this.speed * 0.8); // smoother delay
            if (batchTime < targetTime) {
                await this.delay(targetTime - batchTime);
            }
            
            // yield every batch for smoother animation (prevent lag spikes)
            if (i > 0 && i % batchSize === 0) {
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
        }
        
        const totalFrames = Math.floor((performance.now() - startFrame) / 16.67);
        logPerf('Total Frames', totalFrames);
        logPerf('Steps Processed', processed);
    }
    
    calculateBatchSize() {
        // smaller batches for smoother animation
        if (this.speed <= 10) return 2; // slow - very smooth
        if (this.speed <= 15) return 3; // medium - smooth
        if (this.speed <= 20) return 4; // fast - smoother
        return 5; // very fast - still smooth
    }
    
    processBatch(batch) {
        // process all steps in batch with minimal DOM operations
        const updates = [];
        const processedNodes = new Set(); // prevent duplicate processing
        
        for (const step of batch) {
            const node = this.grid.getNode(step.row, step.col);
            if (!node || node.type === 'start' || node.type === 'end') continue;
            
            // skip if already processed in this batch
            const nodeKey = `${step.row},${step.col}`;
            if (processedNodes.has(nodeKey)) continue;
            processedNodes.add(nodeKey);
            
            // allow animation even if already building (will restart)
            
            if (step.type === STEP_TYPES.CARVE) {
                node.type = 'empty';
            } else if (step.type === STEP_TYPES.WALL) {
                node.type = 'wall';
            } else if (step.type === 'weight' && step.weight) {
                // set weight on empty nodes
                if (node.type === 'empty') {
                    node.weight = step.weight;
                }
            }
            
            if (node.element && node.element.parentNode) {
                updates.push(node);
            }
        }
        
        // batch DOM updates - optimized for smoothness
        if (updates.length > 0) {
            // set initial state for both walls and paths before updating class
            updates.forEach(node => {
                if (node.element) {
                    // set invisible state first for animation
                    node.element.style.transition = 'none';
                    node.element.style.transform = 'scale(0)';
                    node.element.style.opacity = '0';
                }
            });
            
            // force reflow once
            if (updates.length > 0 && updates[0].element) {
                void updates[0].element.offsetHeight;
            }
            
            // update classes in single pass
            updates.forEach(node => {
                this.grid.updateNodeElement(node);
            });
            
            // animate nodes - use requestAnimationFrame to spread triggers
            updates.forEach((node, idx) => {
                // spread animation triggers across frames to prevent lag
                requestAnimationFrame(() => {
                    this.animateNodeFast(node);
                });
            });
            
            perfLog.domUpdates += updates.length;
        }
    }
    
    animateNodeFast(node) {
        if (!node.element || !node.element.parentNode) return;
        
        const el = node.element;
        const isWall = node.type === 'wall';
        const isCarving = node.type === 'empty';
        
        // clear any existing animations
        el.classList.remove('maze-building', 'maze-wall-in', 'maze-carve-in', 'maze-out');
        
        if (isWall) {
            // ensure initial state is set (should already be set in processBatch)
            if (el.style.transform !== 'scale(0)' || el.style.opacity !== '0') {
                el.style.transition = 'none';
                el.style.transform = 'scale(0)';
                el.style.opacity = '0';
            }
            
            el.classList.add('maze-building', 'maze-wall-in');
            
            // use double RAF to ensure initial state is rendered
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (!el.parentNode) return;
                    
                    // animate to popup state
                    el.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out';
                    el.style.transform = 'scale(1.2)';
                    el.style.opacity = '1';
                    
                    // bounce back to normal size
                    const bounceTimeout = setTimeout(() => {
                        if (!el.parentNode) return;
                        el.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
                        el.style.transform = 'scale(1)';
                    }, 250);
                    this.glowTimeouts.add(bounceTimeout);
                    
                    // cleanup after animation completes
                    const timeoutId = setTimeout(() => {
                        if (el.parentNode) {
                            el.classList.remove('maze-building', 'maze-wall-in');
                            el.style.transition = '';
                            el.style.transform = '';
                            el.style.opacity = '';
                        }
                        this.glowTimeouts.delete(timeoutId);
                    }, 450);
                    this.glowTimeouts.add(timeoutId);
                });
            });
        } else if (isCarving) {
            // path carving: fade in with scale animation - slower for smoother look
            // ensure initial state is set
            if (el.style.transform !== 'scale(0)' || el.style.opacity !== '0') {
                el.style.transition = 'none';
                el.style.transform = 'scale(0)';
                el.style.opacity = '0';
            }
            
            el.classList.add('maze-building', 'maze-carve-in');
            
            // animate path carving with slower, smoother fade and scale
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (!el.parentNode) return;
                    
                    // animate to visible state with slower, smoother transition
                    el.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.4s ease-out';
                    el.style.transform = 'scale(1.1)';
                    el.style.opacity = '1';
                    
                    // bounce back to normal size - slower
                    const bounceTimeout = setTimeout(() => {
                        if (!el.parentNode) return;
                        el.style.transition = 'transform 0.25s ease-out';
                        el.style.transform = 'scale(1)';
                    }, 350);
                    this.glowTimeouts.add(bounceTimeout);
                    
                    // cleanup after animation completes
                    const timeoutId = setTimeout(() => {
                        if (el.parentNode) {
                            el.classList.remove('maze-building', 'maze-carve-in');
                            el.style.transition = '';
                            el.style.transform = '';
                            el.style.opacity = '';
                        }
                        this.glowTimeouts.delete(timeoutId);
                    }, 650);
                    this.glowTimeouts.add(timeoutId);
                });
            });
        }
    }
    
    stop() {
        this.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        // clear all pending timeouts
        this.glowTimeouts.forEach(clearTimeout);
        this.glowTimeouts.clear();
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
