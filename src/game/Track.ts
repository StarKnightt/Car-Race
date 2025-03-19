import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export class Track {
  getSegmentLength(): number {
    return this.SEGMENT_LENGTH;
  }
  mesh: THREE.Group;
  startPosition: THREE.Vector3;
  segments: THREE.Group[];
  private readonly SEGMENT_LENGTH = 100;
  private readonly SEGMENTS_TO_KEEP = 3;

  constructor(private scene: THREE.Scene) {
    this.mesh = new THREE.Group();
    this.startPosition = new THREE.Vector3(0, 0, -35);
    this.segments = [];
    this.createTrack();
    this.createEnvironment();
  }

  private createTrack() {
    // Create advanced race track
    const trackWidth = 20;
    const trackLength = this.SEGMENT_LENGTH * this.SEGMENTS_TO_KEEP;
    
    const trackGeometry = new THREE.PlaneGeometry(trackWidth, trackLength, 200, 200);
    const trackTextureLoader = new THREE.TextureLoader();
    
    // Load high-quality track textures
    const trackMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.1
    });

    // Add track details
    this.addTrackDetails();
  }

  private createEnvironment() {
    // Create sky with proper implementation
    const sky = new Sky();
    sky.scale.setScalar(450000);
    this.mesh.add(sky);

    // Configure sky parameters
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    // Add sun position calculation
    const sun = new THREE.Vector3();
    const phi = THREE.MathUtils.degToRad(90 - 2);  // Elevation
    const theta = THREE.MathUtils.degToRad(180);    // Azimuth
    sun.setFromSphericalCoords(1, phi, theta);
    skyUniforms['sunPosition'].value.copy(sun);

    // Create ground with better texturing
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 256, 256);
    const textureLoader = new THREE.TextureLoader();
    
    // Create basic material first, then load textures
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5a27,
      roughness: 0.9
    });
    
    // Ground mesh creation without depending on textures
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.mesh.add(ground);

    // Try to load textures and apply them if successful
    try {
      // Use correct paths to the available textures with leading slash
      textureLoader.load('/textures/ground/Substance_Graph_BaseColor.jpg', 
        texture => {
          if (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(200, 200);
            groundMaterial.map = texture;
            groundMaterial.needsUpdate = true;
            console.log('Ground texture loaded successfully');
          }
        },
        undefined,
        error => console.warn('Failed to load ground texture:', error)
      );
      
      textureLoader.load('/textures/ground/Substance_Graph_Normal.jpg', 
        texture => {
          if (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(200, 200);
            groundMaterial.normalMap = texture;
            groundMaterial.needsUpdate = true;
          }
        },
        undefined,
        error => console.warn('Failed to load normal texture:', error)
      );
      
      textureLoader.load('/textures/ground/Substance_Graph_Roughness.jpg', 
        texture => {
          if (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(200, 200);
            groundMaterial.roughnessMap = texture;
            groundMaterial.needsUpdate = true;
          }
        },
        undefined,
        error => console.warn('Failed to load roughness texture:', error)
      );
    } catch (e) {
      console.error('Error loading textures:', e);
    }

    // Add mountains in the distance
    this.addMountains();
    
    // Add atmospheric fog for depth
    this.scene.fog = new THREE.FogExp2(0x88ccee, 0.00125);

    // Create initial track segments
    for (let i = 0; i < this.SEGMENTS_TO_KEEP; i++) {
      this.addTrackSegment(i * this.SEGMENT_LENGTH);
    }
  }

  private addMountains() {
    const mountainGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const mountainCount = 20;
    const mountainRadius = 1000;

    for (let i = 0; i < mountainCount; i++) {
      const angle = (i / mountainCount) * Math.PI * 2;
      const radius = mountainRadius + (Math.random() * 200 - 100);
      const height = 200 + Math.random() * 300;
      
      // Create mountain peaks with multiple vertices
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      vertices.push(
        x, 0, z,
        x + 50, height, z + 50,
        x - 50, height, z - 50
      );
    }

    const mountainMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true
    });

    mountainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    mountainGeometry.computeVertexNormals();

    const mountains = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountains.castShadow = true;
    mountains.receiveShadow = true;
    this.mesh.add(mountains);
  }

  private addTrackSegment(zPosition: number) {
    const segment = new THREE.Group();
    
    // Create a procedural track texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    let trackTexture: THREE.CanvasTexture | null = null;
    
    if (ctx) {
      // Base asphalt color
      ctx.fillStyle = '#333333';
      ctx.fillRect(0, 0, 512, 512);
      
      // Add rough asphalt texture
      for (let i = 0; i < 10000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 2 + 0.5;
        ctx.fillStyle = `rgba(20, 20, 20, ${Math.random() * 0.3})`;
        ctx.fillRect(x, y, size, size);
      }
      
      // Add lane markers
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(256 - 5, 0, 10, 512);
      
      // Create dashed side lines
      for (let y = 0; y < 512; y += 50) {
        ctx.fillRect(50, y, 10, 30);
        ctx.fillRect(452, y, 10, 30);
      }
      
      trackTexture = new THREE.CanvasTexture(canvas);
      trackTexture.wrapS = trackTexture.wrapT = THREE.RepeatWrapping;
      trackTexture.repeat.set(1, this.SEGMENT_LENGTH / 20);
    }

    // Create track surface with basic material first
    const trackGeometry = new THREE.PlaneGeometry(20, this.SEGMENT_LENGTH, 40, 200);
    const trackTextureLoader = new THREE.TextureLoader();
    
    // Create basic material first without textures
    const trackMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.1
    });

    // Create the track mesh
    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.rotation.x = -Math.PI / 2;
    track.position.z = zPosition;
    track.receiveShadow = true;
    segment.add(track);
    
    // Try to load textures and apply them if successful
    try {
      trackTextureLoader.load('/textures/track/Asphalt_004_COLOR.jpg',
        texture => {
          if (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, this.SEGMENT_LENGTH / 10);
            trackMaterial.map = texture;
            trackMaterial.needsUpdate = true;
            console.log('Track texture loaded successfully');
          }
        },
        undefined,
        error => console.warn('Failed to load road texture:', error)
      );
      
      trackTextureLoader.load('/textures/track/Asphalt_004_NRM.jpg',
        texture => {
          if (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, this.SEGMENT_LENGTH / 10);
            trackMaterial.normalMap = texture;
            trackMaterial.needsUpdate = true;
          }
        },
        undefined,
        error => console.warn('Failed to load road normal texture:', error)
      );
      
      trackTextureLoader.load('/textures/track/Asphalt_004_ROUGH.jpg',
        texture => {
          if (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, this.SEGMENT_LENGTH / 10);
            trackMaterial.roughnessMap = texture;
            trackMaterial.needsUpdate = true;
          }
        },
        undefined,
        error => console.warn('Failed to load road roughness texture:', error)
      );
      
      trackTextureLoader.load('/textures/track/Asphalt_004_DISP.png',
        texture => {
          if (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, this.SEGMENT_LENGTH / 10);
            trackMaterial.displacementMap = texture;
            trackMaterial.displacementScale = 0.2;
            trackMaterial.needsUpdate = true;
          }
        },
        undefined,
        error => console.warn('Failed to load road displacement texture:', error)
      );
    } catch (e) {
      console.error('Error loading track textures:', e);
    }
    
    // Add segment details
    this.addSegmentDetails(segment, zPosition);

    this.segments.push(segment);
    this.mesh.add(segment);
  }

  private addSegmentDetails(segment: THREE.Group, zPosition: number) {
    // Add road markings
    const markingGeometry = new THREE.PlaneGeometry(0.3, this.SEGMENT_LENGTH);
    const markingMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
      roughness: 0.4
    });

    // Center line
    const centerLine = new THREE.Mesh(markingGeometry, markingMaterial);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.01;
    centerLine.position.z = zPosition;
    segment.add(centerLine);

    // Add barriers and lights for this segment
    this.addBarriers(segment, zPosition);
  }

  addBarriers(segment: THREE.Group<THREE.Object3DEventMap>, zPosition: number) {
    const barrierGeometry = new THREE.BoxGeometry(0.5, 1, this.SEGMENT_LENGTH);
    const barrierMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      metalness: 0.7,
      roughness: 0.3
    });

    // Left barrier
    const leftBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    leftBarrier.position.set(-10, 0.5, zPosition);
    segment.add(leftBarrier);

    // Right barrier
    const rightBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    rightBarrier.position.set(10, 0.5, zPosition);
    segment.add(rightBarrier);

    // Add barrier lights
    this.addBarrierLights(segment, zPosition);
  }

  addCityscape() {
    const buildingCount = 20;
    const maxDistance = 100;

    for (let i = 0; i < buildingCount; i++) {
      const height = 5 + Math.random() * 15;
      const width = 3 + Math.random() * 5;
      const depth = 3 + Math.random() * 5;

      const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
      const buildingMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.7
      });

      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      
      // Position buildings on both sides of the track
      const side = Math.random() > 0.5 ? 1 : -1;
      const x = side * (20 + Math.random() * maxDistance);
      const z = (Math.random() - 0.5) * maxDistance * 2;
      
      building.position.set(x, height/2, z);
      this.mesh.add(building);
    }
  }

  private addTrackDetails() {
    // Add realistic road markings
    this.addRoadMarkings();
    
    // Add LED barrier lights
    this.addBarrierLights();
    
    // Add dynamic track elements
    this.addTrackProps();
  }

  addTrackProps() {
    // Add track decorations
    const decorationCount = 10;
    for (let i = 0; i < decorationCount; i++) {
      const x = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * this.SEGMENT_LENGTH;
      
      // Add random props (like traffic cones, barriers, etc.)
      const propGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
      const propMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        roughness: 0.7
      });
      
      const prop = new THREE.Mesh(propGeometry, propMaterial);
      prop.position.set(x, 0.4, z);
      this.mesh.add(prop);
    }
  }

  private addRoadMarkings() {
    // Add dynamic glowing road markings
    const markingsMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5
    });
    // ...implement road markings...
  }

  private addForest() {
    const treeGeometry = new THREE.ConeGeometry(2, 5, 8);
    const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x1a472a });
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2817 });

    // Create tree template
    const treeTemplate = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    treeTemplate.add(trunk);
    
    const leaves = new THREE.Mesh(treeGeometry, treeMaterial);
    leaves.position.y = 4;
    treeTemplate.add(leaves);

    // Add trees on both sides
    for (let z = -100; z <= 100; z += 10) {
      for (let x = 15; x <= 50; x += 5) {
        // Add trees with random variations
        const leftTree = treeTemplate.clone();
        leftTree.position.set(-x, 0, z);
        leftTree.rotation.y = Math.random() * Math.PI;
        leftTree.scale.setScalar(0.5 + Math.random() * 0.5);
        this.mesh.add(leftTree);

        const rightTree = treeTemplate.clone();
        rightTree.position.set(x, 0, z);
        rightTree.rotation.y = Math.random() * Math.PI;
        rightTree.scale.setScalar(0.5 + Math.random() * 0.5);
        this.mesh.add(rightTree);
      }
    }
  }

  updateInfiniteTrack(playerPosition: THREE.Vector3): boolean {
    // Check if player has moved past a segment
    if (playerPosition.z < -this.SEGMENT_LENGTH) {
      // Remove oldest segment
      const oldSegment = this.segments.shift();
      if (oldSegment) {
        this.mesh.remove(oldSegment);
      }

      // Add new segment ahead
      const lastSegment = this.segments[this.segments.length - 1];
      const newZ = lastSegment ? lastSegment.position.z + this.SEGMENT_LENGTH : 0;
      this.addTrackSegment(newZ);

      // Reset player Z position
      playerPosition.z += this.SEGMENT_LENGTH;
      return true;
    }
    return false;
  }

  private addTrackMarkings() {
    const lineGeometry = new THREE.PlaneGeometry(0.5, 100);
    const lineMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5
    });

    // Center line
    const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.01;
    this.mesh.add(centerLine);

    // Side lines
    const leftLine = centerLine.clone();
    leftLine.position.x = -9;
    this.mesh.add(leftLine);

    const rightLine = centerLine.clone();
    rightLine.position.x = 9;
    this.mesh.add(rightLine);
  }

  private addModernBarriers() {
    const barrierGeometry = new THREE.BoxGeometry(0.5, 1, 100);
    const barrierTexture = new THREE.TextureLoader().load('/textures/barrier.jpg');
    const barrierMaterial = new THREE.MeshStandardMaterial({
      map: barrierTexture,
      roughness: 0.7,
      metalness: 0.3
    });

    const leftBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    leftBarrier.position.set(-10.25, 0.5, 0);
    this.mesh.add(leftBarrier);

    const rightBarrier = leftBarrier.clone();
    rightBarrier.position.set(10.25, 0.5, 0);
    this.mesh.add(rightBarrier);

    // Add glowing strip on barriers
    this.addBarrierLights();
  }

  addBarrierLights(segment?: THREE.Group, zPosition?: number) {
    // Handle both the older method call pattern and the newer one
    const isSpecificSegment = segment !== undefined && zPosition !== undefined;
    
    // Create a basic emissive material that doesn't depend on textures
    const stripGeometry = new THREE.BoxGeometry(0.1, 0.1, 
      isSpecificSegment ? this.SEGMENT_LENGTH : 100);
    const stripMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5
    });

    if (isSpecificSegment) {
      // Add lights to a specific segment
      const leftStrip = new THREE.Mesh(stripGeometry, stripMaterial);
      leftStrip.position.set(-10.25, 1, zPosition!);
      segment!.add(leftStrip);

      const rightStrip = leftStrip.clone();
      rightStrip.position.set(10.25, 1, zPosition!);
      segment!.add(rightStrip);
    } else {
      // Original method without parameters - adding to track mesh directly
      const leftStrip = new THREE.Mesh(stripGeometry, stripMaterial);
      leftStrip.position.set(-10.25, 1, 0);
      this.mesh.add(leftStrip);

      const rightStrip = leftStrip.clone();
      rightStrip.position.set(10.25, 1, 0);
      this.mesh.add(rightStrip);
    }
  }

  private addEnvironmentDetails() {
    // Add reflective bollards
    this.addBollards();
    
    // Add distance markers
    this.addDistanceMarkers();
  }

  private addBollards() {
    const bollardGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
    const bollardMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.8,
      roughness: 0.2
    });

    for (let z = -45; z <= 45; z += 5) {
      const leftBollard = new THREE.Mesh(bollardGeometry, bollardMaterial);
      leftBollard.position.set(-9.5, 0.25, z);
      this.mesh.add(leftBollard);

      const rightBollard = leftBollard.clone();
      rightBollard.position.x = 9.5;
      this.mesh.add(rightBollard);
    }
  }

  private addDistanceMarkers() {
    const markerGeometry = new THREE.PlaneGeometry(1, 0.5);
    const markerMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });

    for (let z = -40; z <= 40; z += 10) {
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.rotation.x = -Math.PI / 2;
      marker.rotation.z = Math.PI / 2;
      marker.position.set(-9, 0.01, z);
      this.mesh.add(marker);
    }
  }

  private addStartLine() {
    const startLineGeometry = new THREE.PlaneGeometry(20, 2);
    const startLineMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5
    });

    const startLine = new THREE.Mesh(startLineGeometry, startLineMaterial);
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(0, 0.01, -40);
    this.mesh.add(startLine);
  }
}