import * as THREE from 'three';

interface AssetLoadingProgress {
  total: number;
  loaded: number;
  errors: string[];
}

export class AssetManager {
  private textureLoader: THREE.TextureLoader;
  private audioLoader: THREE.AudioLoader;
  private loadingProgress: AssetLoadingProgress;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;
  private cache: Map<string, any>;

  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.audioLoader = new THREE.AudioLoader();
    this.cache = new Map();
    this.loadingProgress = {
      total: 0,
      loaded: 0,
      errors: []
    };
  }

  async loadTexture(url: string): Promise<THREE.Texture> {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    let attempts = 0;
    while (attempts < this.maxRetries) {
      try {
        const texture = await new Promise<THREE.Texture>((resolve, reject) => {
          this.textureLoader.load(
            url,
            (texture) => {
              this.loadingProgress.loaded++;
              resolve(texture);
            },
            undefined,
            (error) => reject(error)
          );
        });

        this.cache.set(url, texture);
        return texture;
      } catch (error) {
        attempts++;
        if (attempts === this.maxRetries) {
          const fallbackTexture = this.createFallbackTexture();
          this.loadingProgress.errors.push(`Failed to load texture: ${url}`);
          return fallbackTexture;
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }

    throw new Error(`Failed to load texture after ${this.maxRetries} attempts: ${url}`);
  }

  async loadAudio(url: string): Promise<AudioBuffer> {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    let attempts = 0;
    while (attempts < this.maxRetries) {
      try {
        const buffer = await new Promise<AudioBuffer>((resolve, reject) => {
          this.audioLoader.load(
            url,
            (buffer) => {
              this.loadingProgress.loaded++;
              resolve(buffer);
            },
            undefined,
            (error) => reject(error)
          );
        });

        this.cache.set(url, buffer);
        return buffer;
      } catch (error) {
        attempts++;
        if (attempts === this.maxRetries) {
          this.loadingProgress.errors.push(`Failed to load audio: ${url}`);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }

    throw new Error(`Failed to load audio after ${this.maxRetries} attempts: ${url}`);
  }

  private createFallbackTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#FF00FF'; // Magenta for visibility
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 64, 64);
      ctx.font = '10px Arial';
      ctx.fillStyle = '#000000';
      ctx.fillText('ERROR', 12, 32);
    }

    return new THREE.CanvasTexture(canvas);
  }

  getProgress(): number {
    if (this.loadingProgress.total === 0) return 0;
    return (this.loadingProgress.loaded / this.loadingProgress.total) * 100;
  }

  getErrors(): string[] {
    return this.loadingProgress.errors;
  }

  setTotalAssets(total: number) {
    this.loadingProgress.total = total;
  }

  reset() {
    this.loadingProgress = {
      total: 0,
      loaded: 0,
      errors: []
    };
    this.cache.clear();
  }
}