# Pathfinding & Maze Visualizer

A cool interactive tool to visualize how different pathfinding algorithms work. Watch A*, Dijkstra, BFS and others find their way through mazes in real-time. Pretty satisfying to watch, ngl.

## 🔗 Links
[![portfolio](https://img.shields.io/badge/my_portfolio-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://disneyritozx.netlify.app/)

## 🛠️ Tech Stack

![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

## What's Inside

### Pathfinding Algorithms
9 different algorithms you can try:
- **BFS (Breadth-First Search)** - Explores everything level by level, like a wave. Guarantees shortest path in unweighted graphs.
- **DFS (Depth-First Search)** - Goes deep first, sometimes gets lost but finds a way. Does not guarantee shortest path.
- **Dijkstra** - The OG shortest path finder, works great with weights. Guarantees optimal solution in weighted graphs.
- **A*** - Smart and efficient, uses heuristics to find optimal paths. Combines Dijkstra's optimality with heuristic guidance.
- **Greedy Best-First** - Fast but not always optimal, goes straight for the goal. Uses heuristic to always explore node closest to goal.
- **Bidirectional Search** - Searches from both ends, meets in the middle. Often faster than unidirectional search.
- **Swarm** - Balanced search algorithm that balances Dijkstra exploration with A* convergence. Explores more nodes around start while converging to goal.
- **Convergent Swarm** - More aggressive version of Swarm with heavier heuristic weighting. Converges quickly but may not find optimal path.
- **Bidirectional Swarm** - Swarm algorithm searching from both start and end simultaneously. Combines swarm balance with bidirectional speed.

### Heuristics
For the smart algorithms (A*, Greedy, Swarm), you can pick:
- **Manhattan** - City block distance (up/down + left/right)
- **Euclidean** - Straight line distance
- **Chebyshev** - Diagonal movement friendly

### Maze Generation
13 different maze generation algorithms:
- **Recursive Division** - Classic maze, always solvable. Creates perfect maze by recursively dividing grid into smaller sections.
- **Recursive Division (Vertical Skew)** - Similar to Recursive Division but prefers vertical divisions, creating taller maze sections.
- **Recursive Division (Horizontal Skew)** - Similar to Recursive Division but prefers horizontal divisions, creating wider maze sections.
- **Prims** - Uses Prim's algorithm to generate minimum spanning tree maze. Starts from random cell and grows by adding random frontier cells.
- **Kruskal** - Uses Kruskal's algorithm with union-find to generate maze. Randomly removes walls between cells in different sets.
- **Recursive Backtracking** - Uses depth-first search with backtracking. Carves paths by randomly choosing unvisited neighbors and backtracks when stuck.
- **Wilson** - Uses Wilson's algorithm with loop-erased random walks. Randomly walks from unvisited cells until hitting the maze, then adds the path.
- **Ellers** - Generates mazes row by row using union-find. Processes one row at a time, merging sets and creating passages.
- **Side Winder** - Creates mazes by building horizontal runs and randomly carving north passages. Simple and efficient algorithm.
- **Binary Tree** - Each cell randomly connects to either its north or east neighbor. Creates mazes with a clear bias toward one direction.
- **Labyrinth** - Creates spiral-like patterns by carving walls in a circular pattern. Produces visually interesting maze structures.
- **Basic Random** - Generates random maze by placing walls randomly across 25% of the grid cells.
- **Weighted Maze** - Uses recursive division but places random weights instead of walls. Creates mazes suitable for weighted pathfinding algorithms.

## Try It Out

Just clone the repo, open `index.html` in your browser, and you're ready to go.

## Credits

Thanks to [Clement Mihailescu](https://github.com/clementmihailescu) and his [Pathfinding Visualizer](https://github.com/clementmihailescu/Pathfinding-Visualizer) project. Swarm algorithm was made by him btw.

