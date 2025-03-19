// Extend Performance interface to include Chrome's memory property
interface PerformanceMemory {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
}

// Use declaration merging to extend the global Performance interface
declare global {
  interface Performance {
    memory?: PerformanceMemory;
  }
}

export class PerformanceMonitor {
    private frameCount: number = 0;
    private lastTime: number = 0;
    private fps: number = 0;
    private frameTime: number = 0;
    private memoryUsage: number = 0;
    private fpsHistory: number[] = [];
    private frameTimeHistory: number[] = [];
    private readonly historySize: number = 60;
    private readonly targetFPS: number = 60;
    private readonly targetFrameTime: number = 1000 / this.targetFPS;
    private warningCallback?: (type: string, value: number) => void;
  
    constructor(warningCallback?: (type: string, value: number) => void) {
      this.warningCallback = warningCallback;
      this.lastTime = performance.now();
    }
  
    update(): void {
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastTime;
      this.lastTime = currentTime;
  
      // Update FPS
      this.frameTime = deltaTime;
      this.fps = 1000 / deltaTime;
  
      // Update history
      this.fpsHistory.push(this.fps);
      this.frameTimeHistory.push(this.frameTime);
      if (this.fpsHistory.length > this.historySize) {
        this.fpsHistory.shift();
        this.frameTimeHistory.shift();
      }
  
      // Update memory usage if available
      if (performance.memory) {
        this.memoryUsage = performance.memory.usedJSHeapSize;
      }
  
      // Check for performance issues
      this.checkPerformance();
  
      this.frameCount++;
    }
  
    private checkPerformance(): void {
      // Calculate average FPS over the last second
      const averageFPS = this.getAverageFPS();
      const averageFrameTime = this.getAverageFrameTime();
  
      // Check for low FPS
      if (averageFPS < this.targetFPS * 0.8) {
        this.warningCallback?.('fps', averageFPS);
      }
  
      // Check for high frame times
      if (averageFrameTime > this.targetFrameTime * 1.2) {
        this.warningCallback?.('frameTime', averageFrameTime);
      }
  
      // Check for memory issues
      if (performance.memory && this.memoryUsage > 500 * 1024 * 1024) { // 500MB threshold
        this.warningCallback?.('memory', this.memoryUsage);
      }
    }
  
    getAverageFPS(): number {
      const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
      return sum / this.fpsHistory.length || 0;
    }
  
    getAverageFrameTime(): number {
      const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
      return sum / this.frameTimeHistory.length || 0;
    }
  
    getStats(): {
      fps: number;
      frameTime: number;
      memoryUsage: number;
      averageFPS: number;
      averageFrameTime: number;
    } {
      return {
        fps: this.fps,
        frameTime: this.frameTime,
        memoryUsage: this.memoryUsage,
        averageFPS: this.getAverageFPS(),
        averageFrameTime: this.getAverageFrameTime()
      };
    }
  
    reset(): void {
      this.frameCount = 0;
      this.lastTime = performance.now();
      this.fps = 0;
      this.frameTime = 0;
      this.fpsHistory = [];
      this.frameTimeHistory = [];
    }
  }