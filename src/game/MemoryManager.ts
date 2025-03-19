import * as THREE from 'three';

export class MemoryManager {
  private trackedObjects: Set<THREE.Object3D>;
  private disposedObjects: Set<THREE.Object3D>;
  private textureCache: Map<string, THREE.Texture>;
  private geometryCache: Map<string, THREE.BufferGeometry>;
  private materialCache: Map<string, THREE.Material>;

  constructor() {
    this.trackedObjects = new Set();
    this.disposedObjects = new Set();
    this.textureCache = new Map();
    this.geometryCache = new Map();
    this.materialCache = new Map();
  }

  trackObject(object: THREE.Object3D): void {
    if (this.disposedObjects.has(object)) {
      console.warn('Attempting to track already disposed object');
      return;
    }
    this.trackedObjects.add(object);
  }

  disposeObject(object: THREE.Object3D): void {
    if (this.disposedObjects.has(object)) {
      return;
    }

    // Recursively dispose of all children
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Dispose of geometry
        if (child.geometry) {
          child.geometry.dispose();
        }

        // Dispose of materials
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => this.disposeMaterial(material));
          } else {
            this.disposeMaterial(child.material);
          }
        }
      }
    });

    // Remove from scene if it has a parent
    if (object.parent) {
      object.parent.remove(object);
    }

    this.trackedObjects.delete(object);
    this.disposedObjects.add(object);
  }

  private disposeMaterial(material: THREE.Material): void {
    // Dispose of any textures used by the material
    if ('map' in material) {
      const mat = material as THREE.MeshStandardMaterial;
      if (mat.map) this.disposeTexture(mat.map);
      if (mat.normalMap) this.disposeTexture(mat.normalMap);
      if (mat.roughnessMap) this.disposeTexture(mat.roughnessMap);
      if (mat.metalnessMap) this.disposeTexture(mat.metalnessMap);
      if (mat.emissiveMap) this.disposeTexture(mat.emissiveMap);
    }

    material.dispose();
  }

  private disposeTexture(texture: THREE.Texture): void {
    if (!texture) return;
    
    // Only dispose if not in cache
    if (!this.textureCache.has(texture.uuid)) {
      texture.dispose();
    }
  }

  cacheTexture(key: string, texture: THREE.Texture): void {
    this.textureCache.set(key, texture);
  }

  cacheGeometry(key: string, geometry: THREE.BufferGeometry): void {
    this.geometryCache.set(key, geometry);
  }

  cacheMaterial(key: string, material: THREE.Material): void {
    this.materialCache.set(key, material);
  }

  getTexture(key: string): THREE.Texture | undefined {
    return this.textureCache.get(key);
  }

  getGeometry(key: string): THREE.BufferGeometry | undefined {
    return this.geometryCache.get(key);
  }

  getMaterial(key: string): THREE.Material | undefined {
    return this.materialCache.get(key);
  }

  cleanup(): void {
    // Dispose of all tracked objects
    this.trackedObjects.forEach(object => {
      this.disposeObject(object);
    });

    // Clear caches
    this.textureCache.forEach(texture => texture.dispose());
    this.geometryCache.forEach(geometry => geometry.dispose());
    this.materialCache.forEach(material => material.dispose());

    this.textureCache.clear();
    this.geometryCache.clear();
    this.materialCache.clear();
    this.trackedObjects.clear();
    this.disposedObjects.clear();

    // Force garbage collection hint
    if ((window as any).gc) {
      (window as any).gc();
    }
  }

  getStats(): {
    trackedObjects: number;
    disposedObjects: number;
    cachedTextures: number;
    cachedGeometries: number;
    cachedMaterials: number;
  } {
    return {
      trackedObjects: this.trackedObjects.size,
      disposedObjects: this.disposedObjects.size,
      cachedTextures: this.textureCache.size,
      cachedGeometries: this.geometryCache.size,
      cachedMaterials: this.materialCache.size
    };
  }
}