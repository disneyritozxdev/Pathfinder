// smooth grid animations with performance optimization

// use global DEBUG_PERF if available
const DEBUG_PERF = window.DEBUG_PERF || false;

class GridAnimations {
    static async animateClearPath(grid) {
        const nodesToClear = [];
        
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const node = grid.getNode(row, col);
                if (node && (node.type === 'visited' || node.type === 'path')) {
                    nodesToClear.push(node);
                }
            }
        }
        
        if (nodesToClear.length === 0) return;
        
        // pop animation - all at once for speed
        const batchSize = 60;
        
        for (let i = 0; i < nodesToClear.length; i += batchSize) {
            const batch = nodesToClear.slice(i, i + batchSize);
            
            requestAnimationFrame(() => {
                batch.forEach((node, idx) => {
                    if (node.element) {
                        node.element.style.transition = 'transform 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.15s';
                        node.element.style.transform = 'scale(0)';
                        node.element.style.opacity = '0';
                        
                        setTimeout(() => {
                            if (node.element) {
                                node.type = 'empty';
                                grid.updateNodeElement(node);
                                node.element.style.transform = '';
                                node.element.style.opacity = '';
                                node.element.style.transition = '';
                            }
                        }, 150);
                    }
                });
            });
            
            await new Promise(resolve => setTimeout(resolve, 1));
        }
    }
    
    static async animateReset(grid) {
        const startTime = performance.now();
        
        // only collect nodes that actually need to be reset (not already empty)
        const nodesToReset = [];
        
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const node = grid.getNode(row, col);
                // only reset nodes that are filled (wall, visited, path) - skip empty and start/end
                if (node && 
                    node.type !== 'start' && 
                    node.type !== 'end' && 
                    node.type !== 'empty') {
                    nodesToReset.push(node);
                }
            }
        }
        
        if (nodesToReset.length === 0) {
            if (DEBUG_PERF) console.log('[Reset] No nodes to reset');
            return;
        }
        
        if (DEBUG_PERF) {
            console.log(`[Reset] Resetting ${nodesToReset.length} nodes (out of ${grid.rows * grid.cols} total)`);
        }
        
        // smooth animated reset with optimized batching
        // adaptive batch size based on number of nodes
        const batchSize = nodesToReset.length > 500 ? 80 : nodesToReset.length > 200 ? 50 : 30;
        const delayBetweenBatches = 1; // minimal delay for smooth flow
        
        for (let i = 0; i < nodesToReset.length; i += batchSize) {
            const batch = nodesToReset.slice(i, i + batchSize);
            
            // process batch in single frame
            await new Promise(resolve => {
                requestAnimationFrame(() => {
                    batch.forEach((node) => {
                        if (!node.element || !node.element.parentNode) return;
                        
                        const el = node.element;
                        const originalType = node.type;
                        
                        // animate out smoothly
                        el.style.transition = 'transform 0.18s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.18s ease-out';
                        el.style.transform = 'scale(0.85)';
                        el.style.opacity = '0.4';
                        
                        // reset after animation completes
                        setTimeout(() => {
                            if (!el.parentNode || node.type === 'start' || node.type === 'end') return;
                            
                            // update type
                            node.type = 'empty';
                            grid.updateNodeElement(node);
                            
                            // fade back in smoothly
                            requestAnimationFrame(() => {
                                if (!el.parentNode) return;
                                
                                el.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out';
                                el.style.transform = 'scale(1)';
                                el.style.opacity = '1';
                                
                                // cleanup after fade-in
                                setTimeout(() => {
                                    if (el.parentNode) {
                                        el.style.transition = '';
                                    }
                                }, 150);
                            });
                        }, 180);
                    });
                    
                    resolve();
                });
            });
            
            // minimal delay between batches for smooth cascading effect
            if (i + batchSize < nodesToReset.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }
        
        // wait for all animations to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (DEBUG_PERF) {
            const totalTime = performance.now() - startTime;
            console.log(`[Reset] Completed in ${totalTime.toFixed(2)}ms`);
        }
    }
}
