// main app logic

let grid;
let animationController;
let mazeStepPlayer;
let isRunning = false;

// calculate grid size to fit viewport perfectly
function calculateGridSize() {
    const containerPadding = 40; // 20px on each side (container padding)
    const gridContainerPadding = 40; // 20px on each side (grid-container padding)
    const statsHeight = 120; // space for stats section at top
    const nodeSize = 25;
    const gap = 2;
    const safetyMargin = 20; // extra margin to prevent cutoff
    
    // available space - account for stats section and safety margin
    const availableWidth = window.innerWidth - containerPadding - gridContainerPadding - safetyMargin;
    const availableHeight = window.innerHeight - containerPadding - gridContainerPadding - statsHeight - safetyMargin;
    
    // calculate: cols * nodeSize + (cols - 1) * gap <= available
    // cols * (nodeSize + gap) - gap <= available
    // cols * (nodeSize + gap) <= available + gap
    const cols = Math.floor((availableWidth + gap) / (nodeSize + gap));
    const rows = Math.floor((availableHeight + gap) / (nodeSize + gap));
    
    // ensure minimum sizes - reduce buffer for rows to make it taller
    return {
        rows: Math.max(10, rows - 1), // subtract only 1 row as buffer to make it taller
        cols: Math.max(15, cols - 2)  // subtract 2 cols as buffer
    };
}

async function init() {
    const size = calculateGridSize();
    grid = new Grid(size.rows, size.cols);
    animationController = new AnimationController(grid);
    mazeStepPlayer = new MazeStepPlayer(grid, 5);
    
    const gridContainer = document.getElementById('grid');
    if (!gridContainer) {
        console.error('[App] Grid container not found');
        return;
    }
    
    // render grid and ensure it's ready
    const rendered = grid.render(gridContainer);
    if (!rendered) {
        console.warn('[App] Grid render incomplete, retrying...');
        await new Promise(resolve => requestAnimationFrame(resolve));
        grid.render(gridContainer);
    }
    
    // wait for grid to be fully ready
    const ready = await grid.waitForReady();
    if (!ready) {
        console.error('[App] Grid failed to initialize properly');
    }
    
    grid.setupEventListeners();
    setupEventListeners();
    updateStats(0, 0, 0);
}

// make init globally accessible
window.init = init;

function setupEventListeners() {
    document.getElementById('btn-run').addEventListener('click', () => {
        const algo = document.getElementById('pathfinding-algo').value;
        runAlgorithm(algo);
    });
    document.getElementById('btn-clear').addEventListener('click', clearPath);
    document.getElementById('btn-reset').addEventListener('click', resetGrid);
    document.getElementById('btn-maze').addEventListener('click', generateMaze);
    document.getElementById('btn-stop').addEventListener('click', stopAlgorithm);
    
    // menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const controlPanel = document.getElementById('control-panel');
    if (menuToggle && controlPanel) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            controlPanel.classList.toggle('open');
        });
    }
    
    // info panel toggle
    setupInfoPanel();
    
    // speed dropdown
    const speedSelect = document.getElementById('speed-select');
    if (speedSelect) {
        speedSelect.addEventListener('change', (e) => {
            const speed = e.target.value;
            let speedValue;
            // map multipliers to speed values (base delay 50ms for 1x)
            // delay = 101 - speed, so speed = 101 - delay
            if (speed === '0.5x') {
                speedValue = 1; // delay = 100ms (half speed)
            } else if (speed === '1x') {
                speedValue = 51; // delay = 50ms (normal)
            } else if (speed === '2x') {
                speedValue = 76; // delay = 25ms (2x faster)
            } else if (speed === '4x') {
                speedValue = 89; // delay = 12ms (4x faster)
            } else if (speed === '8x') {
                speedValue = 95; // delay = 6ms (8x faster)
            } else {
                speedValue = 51; // default to 1x
            }
            animationController.setSpeed(speedValue);
            mazeStepPlayer.setSpeed(speedValue);
        });
        // set default to 1x
        animationController.setSpeed(51);
        mazeStepPlayer.setSpeed(51);
    }
    
    // weight buttons
    const btnAddWeights = document.getElementById('btn-add-weights');
    const btnClearWeights = document.getElementById('btn-clear-weights');
    if (btnAddWeights) {
        btnAddWeights.addEventListener('click', () => {
            grid.addRandomWeights();
        });
    }
    if (btnClearWeights) {
        btnClearWeights.addEventListener('click', () => {
            grid.clearWeights();
        });
    }
}

function setupInfoPanel() {
    const infoPanel = document.getElementById('info-panel');
    const toggleBtn = document.getElementById('info-panel-toggle');
    const closeBtn = document.getElementById('info-panel-close');
    
    if (!infoPanel || !toggleBtn) return;
    
    toggleBtn.addEventListener('click', () => {
        infoPanel.classList.toggle('open');
    });
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            infoPanel.classList.remove('open');
        });
    }
}

async function runAlgorithm(algorithmType) {
    if (isRunning) return;
    
    isRunning = true;
    clearPath();
    hideNotification();
    updateButtons(true);
    
    const startTime = performance.now();
    let result;
    const heuristicType = document.getElementById('heuristic-type').value;
    
    if (algorithmType === 'bfs') {
        result = PathfindingAlgorithms.bfs(grid);
    } else if (algorithmType === 'dfs') {
        result = PathfindingAlgorithms.dfs(grid);
    } else if (algorithmType === 'dijkstra') {
        result = PathfindingAlgorithms.dijkstra(grid);
    } else if (algorithmType === 'greedy') {
        result = PathfindingAlgorithms.greedyBestFirst(grid, heuristicType);
    } else if (algorithmType === 'astar') {
        result = PathfindingAlgorithms.astar(grid, heuristicType);
    } else if (algorithmType === 'swarm') {
        result = PathfindingAlgorithms.swarm(grid, heuristicType);
    } else if (algorithmType === 'convergent-swarm') {
        result = PathfindingAlgorithms.convergentSwarm(grid, heuristicType);
    } else if (algorithmType === 'bidirectional') {
        result = PathfindingAlgorithms.bidirectionalSearch(grid);
    } else if (algorithmType === 'bidirectional-swarm') {
        result = PathfindingAlgorithms.bidirectionalSwarm(grid, heuristicType);
    }
    
    const endTime = performance.now();
    const executionTime = Math.round(endTime - startTime);
    
    // update info panel with current algorithm
    updateInfoPanel(algorithmType, heuristicType);
    
    // animate with real-time stats updates
    await animationController.animatePathfinding(result.visited, result.path, updateStats);
    
    // check if path is impossible
    if (result.path.length === 0 && result.visited.length > 0) {
        showNotification('No path found!');
    }
    
    // final stats update
    updateStats(result.visited.length, result.path.length, executionTime);
    updateButtons(false);
    isRunning = false;
}

async function clearPath() {
    if (isRunning) return;
    animationController.stop();
    hideNotification();
    await GridAnimations.animateClearPath(grid);
    updateStats(0, 0, 0);
}

async function resetGrid() {
    if (isRunning) return;
    animationController.stop();
    hideNotification();
    await GridAnimations.animateReset(grid);
    updateStats(0, 0, 0);
}

function stopAlgorithm() {
    if (!isRunning) return;
    
    animationController.stop();
    mazeStepPlayer.stop();
    isRunning = false;
    updateButtons(false);
    hideNotification();
}

async function generateMaze() {
    if (isRunning) return;
    
    isRunning = true;
    animationController.stop();
    mazeStepPlayer.stop();
    hideNotification();
    updateButtons(true);
    
    try {
        // ensure grid is ready before starting
        if (!grid.isReady()) {
            console.warn('[Maze] Grid not ready, waiting...');
            const ready = await grid.waitForReady(500);
            if (!ready) {
                console.error('[Maze] Grid not ready, aborting');
                updateButtons(false);
                isRunning = false;
                return;
            }
        }
        
        grid.clearPath();
        
        // wait one frame to ensure clearPath is rendered
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // reset grid and prepare for maze generation
        grid.reset();
        grid.clearWeights();
        
        // wait one frame to ensure reset is rendered
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // generate and play maze steps in real-time
        const mazeAlgo = document.getElementById('maze-algo').value;
        
        // update info panel with current maze algorithm
        updateInfoPanel(null, null, mazeAlgo);
        
        // play with real-time stats updates
        await mazeStepPlayer.playRealtime(grid, mazeAlgo, updateStats);
        
        updateStats(0, 0, 0);
    } catch (error) {
        console.error('[Maze] Error during generation:', error);
    } finally {
        updateButtons(false);
        isRunning = false;
    }
}

function updateButtons(disabled) {
    document.getElementById('btn-run').disabled = disabled;
    document.getElementById('btn-clear').disabled = disabled;
    document.getElementById('btn-reset').disabled = disabled;
    document.getElementById('btn-maze').disabled = disabled;
    document.getElementById('btn-stop').disabled = !disabled;
    document.getElementById('pathfinding-algo').disabled = disabled;
    document.getElementById('maze-algo').disabled = disabled;
    document.getElementById('heuristic-type').disabled = disabled;
}

function updateStats(visited, pathLength, time) {
    document.getElementById('stat-visited').textContent = visited;
    document.getElementById('stat-path').textContent = pathLength;
    document.getElementById('stat-time').textContent = `${time}ms`;
}

function updateInfoPanel(pathfindingAlgo = null, heuristicType = null, mazeAlgo = null) {
    const infoPanel = document.getElementById('info-panel');
    if (!infoPanel) return;
    
    // only update if panel is already open (don't force it open)
    if (!infoPanel.classList.contains('open')) return;
    
    const content = infoPanel.querySelector('.info-panel-content');
    if (!content) return;
    
    // remove all highlights
    const sections = content.querySelectorAll('.info-section');
    const items = content.querySelectorAll('.info-item');
    sections.forEach(section => section.classList.remove('highlighted'));
    items.forEach(item => item.classList.remove('highlighted'));
    
    if (pathfindingAlgo) {
        // highlight pathfinding algorithm section
        const pathfindingSection = sections[0];
        if (pathfindingSection) {
            pathfindingSection.classList.add('highlighted');
            const algoName = getAlgorithmDisplayName(pathfindingAlgo);
            const algoItem = Array.from(pathfindingSection.querySelectorAll('.info-item'))
                .find(item => {
                    const strong = item.querySelector('strong');
                    return strong && strong.textContent.includes(algoName);
                });
            if (algoItem) {
                algoItem.classList.add('highlighted');
            }
        }
    } else if (mazeAlgo) {
        // highlight maze generation section (it's the 3rd section, index 2)
        const mazeSection = sections[2];
        if (mazeSection) {
            mazeSection.classList.add('highlighted');
            const algoName = getMazeDisplayName(mazeAlgo);
            const algoItem = Array.from(mazeSection.querySelectorAll('.info-item'))
                .find(item => {
                    const strong = item.querySelector('strong');
                    return strong && strong.textContent.includes(algoName);
                });
            if (algoItem) {
                algoItem.classList.add('highlighted');
            }
        }
    }
}

function getAlgorithmDisplayName(algo) {
    const names = {
        'bfs': 'BFS',
        'dfs': 'DFS',
        'dijkstra': 'Dijkstra',
        'greedy': 'Greedy Best-First',
        'astar': 'A*',
        'swarm': 'Swarm',
        'convergent-swarm': 'Convergent Swarm',
        'bidirectional': 'Bidirectional Search',
        'bidirectional-swarm': 'Bidirectional Swarm'
    };
    return names[algo] || algo;
}

function getMazeDisplayName(algo) {
    const names = {
        'recursive-division': 'Recursive Division',
        'recursive-division-vertical': 'Recursive Division (Vertical Skew)',
        'recursive-division-horizontal': 'Recursive Division (Horizontal Skew)',
        'prims': 'Prims',
        'kruskal': 'Kruskal',
        'recursive-backtracking': 'Recursive Backtracking',
        'wilson': 'Wilson',
        'ellers': 'Ellers',
        'side-winder': 'Side Winder',
        'binary-tree': 'Binary Tree',
        'labyrinth': 'Labyrinth',
        'basic-random': 'Basic Random Maze',
        'weighted-maze': 'Weighted Maze'
    };
    return names[algo] || algo;
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    const text = notification.querySelector('.notification-text');
    text.textContent = message;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        hideNotification();
    }, 3000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.add('hidden');
}

// handle window resize
window.addEventListener('resize', async () => {
    if (!isRunning) {
        if (window.Loader) window.Loader.show();
        try {
            const size = calculateGridSize();
            grid.rows = size.rows;
            grid.cols = size.cols;
            grid.init();
            const gridContainer = document.getElementById('grid');
            grid.render(gridContainer);
            await grid.waitForReady();
            grid.setupEventListeners();
            mazeStepPlayer = new MazeStepPlayer(grid, 5);
        } catch (error) {
            console.error('[App] Error during resize:', error);
        } finally {
            if (window.Loader) window.Loader.hide();
        }
    }
});

// init will be called by loading screen script after everything is ready
// don't auto-init on DOMContentLoaded to avoid race conditions
