// animation system for pathfinding

class AnimationController {
    constructor(grid) {
        this.grid = grid;
        this.isAnimating = false;
        this.speed = 50;
    }

    setSpeed(speed) {
        this.speed = 101 - speed; // invert so higher slider = faster
    }

    async animatePathfinding(visited, path, statsCallback = null) {
        if (this.isAnimating) {
            this.stop();
        }
        
        this.isAnimating = true;
        this.grid.clearPath();
        const startTime = performance.now();
        
        // animate visited nodes
        for (let i = 0; i < visited.length; i++) {
            if (!this.isAnimating) break;
            
            const node = visited[i];
            if (node.type === 'start' || node.type === 'end') continue;
            
            node.type = 'visited';
            this.grid.updateNodeElement(node);
            
            // update stats in real-time
            if (statsCallback && i % 5 === 0) {
                const elapsed = Math.round(performance.now() - startTime);
                statsCallback(i + 1, 0, elapsed);
            }
            
            await this.delay(this.speed);
        }
        
        // animate final path
        let pathLength = 0;
        if (this.isAnimating && path.length > 0) {
            for (let i = 0; i < path.length; i++) {
                if (!this.isAnimating) break;
                
                const node = path[i];
                if (node.type === 'start' || node.type === 'end') continue;
                
                node.type = 'path';
                this.grid.updateNodeElement(node);
                pathLength++;
                
                // update stats in real-time
                if (statsCallback) {
                    const elapsed = Math.round(performance.now() - startTime);
                    statsCallback(visited.length, pathLength, elapsed);
                }
                
                await this.delay(this.speed * 0.5);
            }
        }
        
        // final stats update
        if (statsCallback) {
            const elapsed = Math.round(performance.now() - startTime);
            statsCallback(visited.length, pathLength, elapsed);
        }
        
        this.isAnimating = false;
    }

    stop() {
        this.isAnimating = false;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
