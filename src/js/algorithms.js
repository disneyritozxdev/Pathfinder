// pathfinding algorithms separated from rendering

class PathfindingAlgorithms {
    static bfs(grid) {
        const visited = [];
        const queue = [grid.startNode];
        const parent = new Map();
        const visitedSet = new Set();
        
        visitedSet.add(`${grid.startNode.row},${grid.startNode.col}`);
        parent.set(grid.startNode, null);
        
        while (queue.length > 0) {
            const current = queue.shift();
            visited.push(current);
            
            if (current === grid.endNode) {
                return {
                    visited: visited,
                    path: this.reconstructPath(parent, grid.startNode, grid.endNode)
                };
            }
            
            const neighbors = grid.getNeighbors(current);
            for (const neighbor of neighbors) {
                const key = `${neighbor.row},${neighbor.col}`;
                if (!visitedSet.has(key)) {
                    visitedSet.add(key);
                    parent.set(neighbor, current);
                    queue.push(neighbor);
                }
            }
        }
        
        return {
            visited: visited,
            path: []
        };
    }

    static astar(grid, heuristicType = 'manhattan') {
        const visited = [];
        const openSet = [grid.startNode];
        const closedSet = new Set();
        const parent = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const startKey = `${grid.startNode.row},${grid.startNode.col}`;
        const endKey = `${grid.endNode.row},${grid.endNode.col}`;
        
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(grid.startNode, grid.endNode, heuristicType));
        
        while (openSet.length > 0) {
            openSet.sort((a, b) => {
                const aKey = `${a.row},${a.col}`;
                const bKey = `${b.row},${b.col}`;
                return fScore.get(aKey) - fScore.get(bKey);
            });
            
            const current = openSet.shift();
            const currentKey = `${current.row},${current.col}`;
            
            if (currentKey === endKey) {
                return {
                    visited: visited,
                    path: this.reconstructPath(parent, grid.startNode, grid.endNode)
                };
            }
            
            closedSet.add(currentKey);
            visited.push(current);
            
            const neighbors = grid.getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (closedSet.has(neighborKey)) continue;
                
                const tentativeGScore = gScore.get(currentKey) + (neighbor.weight || 1);
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
                    continue;
                }
                
                parent.set(neighbor, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, grid.endNode, heuristicType));
            }
        }
        
        return {
            visited: visited,
            path: []
        };
    }

    static heuristic(nodeA, nodeB, type = 'manhattan') {
        const dr = Math.abs(nodeA.row - nodeB.row);
        const dc = Math.abs(nodeA.col - nodeB.col);
        
        switch (type) {
            case 'euclidean':
                return Math.sqrt(dr * dr + dc * dc);
            case 'chebyshev':
                return Math.max(dr, dc);
            case 'manhattan':
            default:
                return dr + dc;
        }
    }

    static reconstructPath(parent, start, end) {
        const path = [];
        let current = end;
        
        while (current !== null && current !== undefined) {
            path.unshift(current);
            current = parent.get(current);
        }
        
        if (path[0] !== start) {
            return [];
        }
        
        return path;
    }

    static dfs(grid) {
        const visited = [];
        const stack = [grid.startNode];
        const parent = new Map();
        const visitedSet = new Set();
        
        visitedSet.add(`${grid.startNode.row},${grid.startNode.col}`);
        parent.set(grid.startNode, null);
        
        while (stack.length > 0) {
            const current = stack.pop();
            visited.push(current);
            
            if (current === grid.endNode) {
                return {
                    visited: visited,
                    path: this.reconstructPath(parent, grid.startNode, grid.endNode)
                };
            }
            
            const neighbors = grid.getNeighbors(current);
            for (const neighbor of neighbors) {
                const key = `${neighbor.row},${neighbor.col}`;
                if (!visitedSet.has(key)) {
                    visitedSet.add(key);
                    parent.set(neighbor, current);
                    stack.push(neighbor);
                }
            }
        }
        
        return {
            visited: visited,
            path: []
        };
    }

    static dijkstra(grid) {
        const visited = [];
        const openSet = [grid.startNode];
        const closedSet = new Set();
        const parent = new Map();
        const dist = new Map();
        
        const startKey = `${grid.startNode.row},${grid.startNode.col}`;
        const endKey = `${grid.endNode.row},${grid.endNode.col}`;
        
        dist.set(startKey, 0);
        
        while (openSet.length > 0) {
            openSet.sort((a, b) => {
                const aKey = `${a.row},${a.col}`;
                const bKey = `${b.row},${b.col}`;
                return (dist.get(aKey) || Infinity) - (dist.get(bKey) || Infinity);
            });
            
            const current = openSet.shift();
            const currentKey = `${current.row},${current.col}`;
            
            if (currentKey === endKey) {
                return {
                    visited: visited,
                    path: this.reconstructPath(parent, grid.startNode, grid.endNode)
                };
            }
            
            closedSet.add(currentKey);
            visited.push(current);
            
            const neighbors = grid.getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (closedSet.has(neighborKey)) continue;
                
                const alt = (dist.get(currentKey) || Infinity) + (neighbor.weight || 1);
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                } else if (alt >= (dist.get(neighborKey) || Infinity)) {
                    continue;
                }
                
                parent.set(neighbor, current);
                dist.set(neighborKey, alt);
            }
        }
        
        return {
            visited: visited,
            path: []
        };
    }

    static greedyBestFirst(grid, heuristicType = 'manhattan') {
        const visited = [];
        const openSet = [grid.startNode];
        const closedSet = new Set();
        const parent = new Map();
        
        const startKey = `${grid.startNode.row},${grid.startNode.col}`;
        const endKey = `${grid.endNode.row},${grid.endNode.col}`;
        
        while (openSet.length > 0) {
            openSet.sort((a, b) => {
                return this.heuristic(a, grid.endNode, heuristicType) - 
                       this.heuristic(b, grid.endNode, heuristicType);
            });
            
            const current = openSet.shift();
            const currentKey = `${current.row},${current.col}`;
            
            if (currentKey === endKey) {
                return {
                    visited: visited,
                    path: this.reconstructPath(parent, grid.startNode, grid.endNode)
                };
            }
            
            closedSet.add(currentKey);
            visited.push(current);
            
            const neighbors = grid.getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (closedSet.has(neighborKey)) continue;
                
                if (!openSet.includes(neighbor)) {
                    parent.set(neighbor, current);
                    openSet.push(neighbor);
                }
            }
        }
        
        return {
            visited: visited,
            path: []
        };
    }

    static bidirectionalSearch(grid) {
        const visited = [];
        const forwardQueue = [grid.startNode];
        const backwardQueue = [grid.endNode];
        const forwardVisited = new Map();
        const backwardVisited = new Map();
        const forwardParent = new Map();
        const backwardParent = new Map();
        
        forwardVisited.set(`${grid.startNode.row},${grid.startNode.col}`, grid.startNode);
        backwardVisited.set(`${grid.endNode.row},${grid.endNode.col}`, grid.endNode);
        forwardParent.set(grid.startNode, null);
        backwardParent.set(grid.endNode, null);
        
        while (forwardQueue.length > 0 && backwardQueue.length > 0) {
            // forward search
            const currentForward = forwardQueue.shift();
            visited.push(currentForward);
            const forwardKey = `${currentForward.row},${currentForward.col}`;
            
            if (backwardVisited.has(forwardKey)) {
                const meetingNode = backwardVisited.get(forwardKey);
                const forwardPath = this.reconstructPath(forwardParent, grid.startNode, currentForward);
                const backwardPath = this.reconstructPath(backwardParent, grid.endNode, meetingNode);
                backwardPath.reverse();
                backwardPath.shift();
                return {
                    visited: visited,
                    path: [...forwardPath, ...backwardPath]
                };
            }
            
            const neighbors = grid.getNeighbors(currentForward);
            for (const neighbor of neighbors) {
                const key = `${neighbor.row},${neighbor.col}`;
                if (!forwardVisited.has(key)) {
                    forwardVisited.set(key, neighbor);
                    forwardParent.set(neighbor, currentForward);
                    forwardQueue.push(neighbor);
                }
            }
            
            // backward search
            const currentBackward = backwardQueue.shift();
            if (currentBackward !== currentForward) {
                visited.push(currentBackward);
            }
            const backwardKey = `${currentBackward.row},${currentBackward.col}`;
            
            if (forwardVisited.has(backwardKey)) {
                const meetingNode = forwardVisited.get(backwardKey);
                const forwardPath = this.reconstructPath(forwardParent, grid.startNode, meetingNode);
                const backwardPath = this.reconstructPath(backwardParent, grid.endNode, currentBackward);
                backwardPath.reverse();
                backwardPath.shift();
                return {
                    visited: visited,
                    path: [...forwardPath, ...backwardPath]
                };
            }
            
            const backwardNeighbors = grid.getNeighbors(currentBackward);
            for (const neighbor of backwardNeighbors) {
                const key = `${neighbor.row},${neighbor.col}`;
                if (!backwardVisited.has(key)) {
                    backwardVisited.set(key, neighbor);
                    backwardParent.set(neighbor, currentBackward);
                    backwardQueue.push(neighbor);
                }
            }
        }
        
        return {
            visited: visited,
            path: []
        };
    }

    // swarm algorithm - balances dijkstra exploration with a* convergence
    static swarm(grid, heuristicType = 'manhattan') {
        const visited = [];
        const openSet = [grid.startNode];
        const closedSet = new Set();
        const parent = new Map();
        const gScore = new Map();
        const swarmScore = new Map();
        
        const startKey = `${grid.startNode.row},${grid.startNode.col}`;
        const endKey = `${grid.endNode.row},${grid.endNode.col}`;
        
        gScore.set(startKey, 0);
        const hStart = this.heuristic(grid.startNode, grid.endNode, heuristicType);
        swarmScore.set(startKey, hStart);
        
        while (openSet.length > 0) {
            // sort by swarm score (balanced g + h)
            openSet.sort((a, b) => {
                const aKey = `${a.row},${a.col}`;
                const bKey = `${b.row},${b.col}`;
                return swarmScore.get(aKey) - swarmScore.get(bKey);
            });
            
            const current = openSet.shift();
            const currentKey = `${current.row},${current.col}`;
            
            if (currentKey === endKey) {
                return {
                    visited: visited,
                    path: this.reconstructPath(parent, grid.startNode, grid.endNode)
                };
            }
            
            closedSet.add(currentKey);
            visited.push(current);
            
            const neighbors = grid.getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (closedSet.has(neighborKey)) continue;
                
                const tentativeG = gScore.get(currentKey) + (neighbor.weight || 1);
                const h = this.heuristic(neighbor, grid.endNode, heuristicType);
                
                // swarm balance: weight g and h more evenly than a*
                const balanceFactor = 0.6; // favor exploration slightly
                const swarmValue = balanceFactor * tentativeG + (1 - balanceFactor) * h;
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                    gScore.set(neighborKey, tentativeG);
                    swarmScore.set(neighborKey, swarmValue);
                    parent.set(neighbor, current);
                } else if (swarmValue < swarmScore.get(neighborKey)) {
                    gScore.set(neighborKey, tentativeG);
                    swarmScore.set(neighborKey, swarmValue);
                    parent.set(neighbor, current);
                }
            }
        }
        
        return {
            visited: visited,
            path: []
        };
    }

    // convergent swarm - faster, more heuristic-heavy version
    static convergentSwarm(grid, heuristicType = 'manhattan') {
        const visited = [];
        const openSet = [grid.startNode];
        const closedSet = new Set();
        const parent = new Map();
        const gScore = new Map();
        const swarmScore = new Map();
        
        const startKey = `${grid.startNode.row},${grid.startNode.col}`;
        const endKey = `${grid.endNode.row},${grid.endNode.col}`;
        
        gScore.set(startKey, 0);
        const hStart = this.heuristic(grid.startNode, grid.endNode, heuristicType);
        swarmScore.set(startKey, hStart);
        
        while (openSet.length > 0) {
            openSet.sort((a, b) => {
                const aKey = `${a.row},${a.col}`;
                const bKey = `${b.row},${b.col}`;
                return swarmScore.get(aKey) - swarmScore.get(bKey);
            });
            
            const current = openSet.shift();
            const currentKey = `${current.row},${current.col}`;
            
            if (currentKey === endKey) {
                return {
                    visited: visited,
                    path: this.reconstructPath(parent, grid.startNode, grid.endNode)
                };
            }
            
            closedSet.add(currentKey);
            visited.push(current);
            
            const neighbors = grid.getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (closedSet.has(neighborKey)) continue;
                
                const tentativeG = gScore.get(currentKey) + (neighbor.weight || 1);
                const h = this.heuristic(neighbor, grid.endNode, heuristicType);
                
                // convergent: heavily favor heuristic for faster convergence
                const balanceFactor = 0.3; // much more heuristic-heavy
                const swarmValue = balanceFactor * tentativeG + (1 - balanceFactor) * h;
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                    gScore.set(neighborKey, tentativeG);
                    swarmScore.set(neighborKey, swarmValue);
                    parent.set(neighbor, current);
                } else if (swarmValue < swarmScore.get(neighborKey)) {
                    gScore.set(neighborKey, tentativeG);
                    swarmScore.set(neighborKey, swarmValue);
                    parent.set(neighbor, current);
                }
            }
        }
        
        return {
            visited: visited,
            path: []
        };
    }

    // bidirectional swarm - swarm from both start and end
    static bidirectionalSwarm(grid, heuristicType = 'manhattan') {
        const visited = [];
        const forwardOpen = [grid.startNode];
        const backwardOpen = [grid.endNode];
        const forwardClosed = new Set();
        const backwardClosed = new Set();
        const forwardParent = new Map();
        const backwardParent = new Map();
        const forwardG = new Map();
        const backwardG = new Map();
        const forwardSwarm = new Map();
        const backwardSwarm = new Map();
        
        const startKey = `${grid.startNode.row},${grid.startNode.col}`;
        const endKey = `${grid.endNode.row},${grid.endNode.col}`;
        
        forwardG.set(startKey, 0);
        backwardG.set(endKey, 0);
        forwardSwarm.set(startKey, this.heuristic(grid.startNode, grid.endNode, heuristicType));
        backwardSwarm.set(endKey, this.heuristic(grid.endNode, grid.startNode, heuristicType));
        forwardParent.set(grid.startNode, null);
        backwardParent.set(grid.endNode, null);
        
        while (forwardOpen.length > 0 && backwardOpen.length > 0) {
            // forward search
            forwardOpen.sort((a, b) => {
                const aKey = `${a.row},${a.col}`;
                const bKey = `${b.row},${b.col}`;
                return forwardSwarm.get(aKey) - forwardSwarm.get(bKey);
            });
            
            const currentForward = forwardOpen.shift();
            const forwardKey = `${currentForward.row},${currentForward.col}`;
            visited.push(currentForward);
            
            if (backwardClosed.has(forwardKey)) {
                const meetingNode = Array.from(backwardClosed).find(key => key === forwardKey);
                const forwardPath = this.reconstructPath(forwardParent, grid.startNode, currentForward);
                const backwardPath = this.reconstructPath(backwardParent, grid.endNode, currentForward);
                backwardPath.reverse();
                backwardPath.shift();
                return {
                    visited: visited,
                    path: [...forwardPath, ...backwardPath]
                };
            }
            
            forwardClosed.add(forwardKey);
            
            const forwardNeighbors = grid.getNeighbors(currentForward);
            for (const neighbor of forwardNeighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (forwardClosed.has(neighborKey)) continue;
                
                const tentativeG = forwardG.get(forwardKey) + (neighbor.weight || 1);
                const h = this.heuristic(neighbor, grid.endNode, heuristicType);
                const balanceFactor = 0.6;
                const swarmValue = balanceFactor * tentativeG + (1 - balanceFactor) * h;
                
                if (!forwardOpen.includes(neighbor)) {
                    forwardOpen.push(neighbor);
                    forwardG.set(neighborKey, tentativeG);
                    forwardSwarm.set(neighborKey, swarmValue);
                    forwardParent.set(neighbor, currentForward);
                } else if (swarmValue < forwardSwarm.get(neighborKey)) {
                    forwardG.set(neighborKey, tentativeG);
                    forwardSwarm.set(neighborKey, swarmValue);
                    forwardParent.set(neighbor, currentForward);
                }
            }
            
            // backward search
            backwardOpen.sort((a, b) => {
                const aKey = `${a.row},${a.col}`;
                const bKey = `${b.row},${b.col}`;
                return backwardSwarm.get(aKey) - backwardSwarm.get(bKey);
            });
            
            const currentBackward = backwardOpen.shift();
            if (currentBackward !== currentForward) {
                visited.push(currentBackward);
            }
            const backwardKey = `${currentBackward.row},${currentBackward.col}`;
            
            if (forwardClosed.has(backwardKey)) {
                const forwardPath = this.reconstructPath(forwardParent, grid.startNode, currentBackward);
                const backwardPath = this.reconstructPath(backwardParent, grid.endNode, currentBackward);
                backwardPath.reverse();
                backwardPath.shift();
                return {
                    visited: visited,
                    path: [...forwardPath, ...backwardPath]
                };
            }
            
            backwardClosed.add(backwardKey);
            
            const backwardNeighbors = grid.getNeighbors(currentBackward);
            for (const neighbor of backwardNeighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (backwardClosed.has(neighborKey)) continue;
                
                const tentativeG = backwardG.get(backwardKey) + (neighbor.weight || 1);
                const h = this.heuristic(neighbor, grid.startNode, heuristicType);
                const balanceFactor = 0.6;
                const swarmValue = balanceFactor * tentativeG + (1 - balanceFactor) * h;
                
                if (!backwardOpen.includes(neighbor)) {
                    backwardOpen.push(neighbor);
                    backwardG.set(neighborKey, tentativeG);
                    backwardSwarm.set(neighborKey, swarmValue);
                    backwardParent.set(neighbor, currentBackward);
                } else if (swarmValue < backwardSwarm.get(neighborKey)) {
                    backwardG.set(neighborKey, tentativeG);
                    backwardSwarm.set(neighborKey, swarmValue);
                    backwardParent.set(neighbor, currentBackward);
                }
            }
        }
        
        return {
            visited: visited,
            path: []
        };
    }
}
