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
  private trackTextures: {[key: string]: THREE.Texture} = {};

  constructor(private scene: THREE.Scene) {
    this.mesh = new THREE.Group();
    this.startPosition = new THREE.Vector3(0, 0, -35);
    this.segments = [];
    
    // Preload textures first
    this.preloadTextures().then(() => {
      this.createTrack();
      this.createEnvironment();
    }).catch(error => {
      console.error("Error preloading textures:", error);
      // Create fallback track if texture loading fails
      this.createTrack();
      this.createEnvironment();
    });
  }

  private async preloadTextures(): Promise<void> {
    const textureLoader = new THREE.TextureLoader();
    const textureUrls = [
      '/textures/track/Asphalt_004_COLOR.jpg',
      '/textures/track/Asphalt_004_NRM.jpg',
      '/textures/track/Asphalt_004_ROUGH.jpg',
      '/textures/ground/Substance_Graph_BaseColor.jpg',
      '/textures/ground/Substance_Graph_Normal.jpg'
    ];

    const loadTexture = (url: string): Promise<THREE.Texture> => {
      return new Promise((resolve, reject) => {
        textureLoader.load(
          url,
          texture => {
            this.trackTextures[url] = texture;
            resolve(texture);
          },
          undefined,
          error => reject(error)
        );
      });
    };

    try {
      await Promise.all(textureUrls.map(url => loadTexture(url)));
      console.log("All track textures preloaded successfully");
    } catch (error) {
      console.warn("Some textures failed to load:", error);
      // Continue with available textures
    }
  }

  private createTrack() {
    // Create initial track segments
    for (let i = 0; i < this.SEGMENTS_TO_KEEP; i++) {
      this.addTrackSegment(i * this.SEGMENT_LENGTH);
    }
    
    // Add start line
    this.addStartLine();
  }

  private createEnvironment() {
    try {
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
      this.createGround();
      
      // Add mountains in the distance
      this.addMountains();
      
      // Add forest
      this.addForest();
      
      // Add cityscape in the distance
      this.addCityscape();
      
      // Add atmospheric fog for depth
      this.scene.fog = new THREE.FogExp2(0x88ccee, 0.00125);
    } catch (error) {
      console.error("Error creating environment:", error);
      // Create a simple fallback environment
      this.createFallbackEnvironment();
    }
  }

  private createGround() {
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 128, 128);
    
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

    // Apply textures if they were preloaded
    const baseColorTexture = this.trackTextures['/textures/ground/Substance_Graph_BaseColor.jpg'];
    if (baseColorTexture) {
      baseColorTexture.wrapS = baseColorTexture.wrapT = THREE.RepeatWrapping;
      baseColorTexture.repeat.set(200, 200);
      groundMaterial.map = baseColorTexture;
      groundMaterial.needsUpdate = true;
      console.log('Ground texture loaded successfully');
    }
    
    const normalTexture = this.trackTextures['/textures/ground/Substance_Graph_Normal.jpg'];
    if (normalTexture) {
      normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
      normalTexture.repeat.set(200, 200);
      groundMaterial.normalMap = normalTexture;
      groundMaterial.needsUpdate = true;
    }
  }

  private createFallbackEnvironment() {
    // Simple ground
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x2d5a27 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    this.mesh.add(ground);
    
    // Simple sky color
    this.scene.background = new THREE.Color(0x87ceeb);
    
    // Simple fog
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.002);
  }

  private addMountains() {
    try {
      // Create mountain range using a more efficient approach
      const mountainCount = 20;
      const mountainRadius = 1000;
      
      // Create a template mountain
      const mountainGeometry = new THREE.ConeGeometry(100, 300, 4);
      const mountainMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.8,
        flatShading: true
      });
      
      // Create mountain range
      const mountainRange = new THREE.Group();
      
      for (let i = 0; i < mountainCount; i++) {
        const angle = (i / mountainCount) * Math.PI * 2;
        const radius = mountainRadius + (Math.random() * 200 - 100);
        
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        
        // Position mountain
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        mountain.position.set(x, -50, z);
        
        // Randomize scale
        const scale = 0.5 + Math.random() * 1.5;
        mountain.scale.set(scale, scale + Math.random(), scale);
        
        // Randomize rotation
        mountain.rotation.y = Math.random() * Math.PI;
        
        mountainRange.add(mountain);
      }
      
      this.mesh.add(mountainRange);
    } catch (error) {
      console.error("Error creating mountains:", error);
    }
  }

  private addTrackSegment(zPosition: number) {
    const segment = new THREE.Group();
    
    // Create track surface with basic material first
    const trackGeometry = new THREE.PlaneGeometry(20, this.SEGMENT_LENGTH, 20, 100);
    
    // Create basic material first without textures
    const trackMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.1
    });

    // Create the track mesh
    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.rotation.x = -Math.PI / 2;
    track.position.z = zPosition + this.SEGMENT_LENGTH / 2;
    track.receiveShadow = true;
    segment.add(track);
    
    // Apply textures if they were preloaded
    const colorTexture = this.trackTextures['/textures/track/Asphalt_004_COLOR.jpg'];
    if (colorTexture) {
      colorTexture.wrapS = colorTexture.wrapT = THREE.RepeatWrapping;
      colorTexture.repeat.set(2, this.SEGMENT_LENGTH / 10);
      trackMaterial.map = colorTexture;
      trackMaterial.needsUpdate = true;
      console.log('Track texture loaded successfully');
    }
    
    const normalTexture = this.trackTextures['/textures/track/Asphalt_004_NRM.jpg'];
    if (normalTexture) {
      normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
      normalTexture.repeat.set(2, this.SEGMENT_LENGTH / 10);
      trackMaterial.normalMap = normalTexture;
      trackMaterial.needsUpdate = true;
    }
    
    const roughnessTexture = this.trackTextures['/textures/track/Asphalt_004_ROUGH.jpg'];
    if (roughnessTexture) {
      roughnessTexture.wrapS = roughnessTexture.wrapT = THREE.RepeatWrapping;
      roughnessTexture.repeat.set(2, this.SEGMENT_LENGTH / 10);
      trackMaterial.roughnessMap = roughnessTexture;
      trackMaterial.needsUpdate = true;
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

    // Center line (dashed)
    for (let z = 0; z < this.SEGMENT_LENGTH; z += 5) {
      if (z % 10 < 5) { // Create dashed pattern
        const dashLength = 3;
        const centerDash = new THREE.Mesh(
          new THREE.PlaneGeometry(0.3, dashLength),
          markingMaterial
        );
        centerDash.rotation.x = -Math.PI / 2;
        centerDash.position.set(0, 0.01, zPosition + z + dashLength/2);
        segment.add(centerDash);
      }
    }

    // Side lines (continuous)
    const leftLine = new THREE.Mesh(markingGeometry, markingMaterial);
    leftLine.rotation.x = -Math.PI / 2;
    leftLine.position.set(-9, 0.01, zPosition + this.SEGMENT_LENGTH/2);
    segment.add(leftLine);

    const rightLine = new THREE.Mesh(markingGeometry, markingMaterial);
    rightLine.rotation.x = -Math.PI / 2;
    rightLine.position.set(9, 0.01, zPosition + this.SEGMENT_LENGTH/2);
    segment.add(rightLine);

    // Add barriers and lights for this segment
    this.addBarriers(segment, zPosition);
    
    // Add random props to make the track more interesting
    this.addRandomProps(segment, zPosition);
  }

  private addRandomProps(segment: THREE.Group, zPosition: number) {
    // Add random props along the track
    const propCount = 5 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < propCount; i++) {
      // Determine side of track (left or right)
      const side = Math.random() > 0.5 ? 1 : -1;
      const distance = 12 + Math.random() * 10; // Distance from track center
      const z = zPosition + Math.random() * this.SEGMENT_LENGTH;
      
      // Choose prop type
      const propType = Math.floor(Math.random() * 3);
      
      switch (propType) {
        case 0: // Traffic cone
          const coneGeometry = new THREE.ConeGeometry(0.3, 0.8, 16);
          const coneMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            roughness: 0.7
          });
          const cone = new THREE.Mesh(coneGeometry, coneMaterial);
          cone.position.set(side * distance, 0.4, z);
          segment.add(cone);
          break;
          
        case 1: // Billboard
          const billboardGeometry = new THREE.BoxGeometry(5, 3, 0.2);
          const billboardMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.5
          });
          const billboard = new THREE.Mesh(billboardGeometry, billboardMaterial);
          billboard.position.set(side * distance, 1.5, z);
          billboard.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
          segment.add(billboard);
          
          // Add support pole
          const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
          const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.5,
            roughness: 0.5
          });
          const pole = new THREE.Mesh(poleGeometry, poleMaterial);
          pole.position.set(side * distance, 0, z);
          segment.add(pole);
          break;
          
        case 2: // Small bush
          const bushGeometry = new THREE.SphereGeometry(0.7, 8, 8);
          const bushMaterial = new THREE.MeshStandardMaterial({
            color: 0x228822,
            roughness: 0.9
          });
          const bush = new THREE.Mesh(bushGeometry, bushMaterial);
          bush.position.set(side * distance, 0.7, z);
          bush.scale.y = 0.7;
          segment.add(bush);
          break;
      }
    }
  }

  addBarriers(segment: THREE.Group, zPosition: number) {
    // Create barrier geometry and material
    const barrierGeometry = new THREE.BoxGeometry(0.5, 1, this.SEGMENT_LENGTH);
    const barrierMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      metalness: 0.7,
      roughness: 0.3
    });

    // Left barrier
    const leftBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    leftBarrier.position.set(-10, 0.5, zPosition + this.SEGMENT_LENGTH/2);
    segment.add(leftBarrier);

    // Right barrier
    const rightBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    rightBarrier.position.set(10, 0.5, zPosition + this.SEGMENT_LENGTH/2);
    segment.add(rightBarrier);

    // Add barrier lights
    this.addBarrierLights(segment, zPosition);
  }

  addCityscape() {
    try {
      const buildingCount = 30;
      const maxDistance = 150;
      const buildingGroup = new THREE.Group();

      // Create a few building templates to reuse
      const buildingGeometries = [
        new THREE.BoxGeometry(1, 1, 1), // Will be scaled
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.CylinderGeometry(0.5, 0.5, 1, 8) // Cylindrical building
      ];
      
      const buildingMaterials = [
        new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: 0x606060, roughness: 0.6 }),
        new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.5 }),
        new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 0.4 })
      ];

      for (let i = 0; i < buildingCount; i++) {
        // Select random building type
        const typeIndex = Math.floor(Math.random() * buildingGeometries.length);
        const geometry = buildingGeometries[typeIndex];
        const material = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)];
        
        const building = new THREE.Mesh(geometry, material);
        
        // Randomize building dimensions
        const height = 5 + Math.random() * 25;
        const width = 3 + Math.random() * 8;
        const depth = 3 + Math.random() * 8;
        
        building.scale.set(width, height, depth);
        
        // Position buildings on both sides of the track
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (30 + Math.random() * maxDistance);
        const z = (Math.random() - 0.5) * maxDistance * 4;
        
        building.position.set(x, height/2, z);
        buildingGroup.add(building);
        
        // Add windows (simple emissive material)
        if (Math.random() > 0.3) { // Not all buildings have lights
          const windowsMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.7,
            emissive: 0xffffaa,
            emissiveIntensity: 0.2
          });
          
          // Front windows
          const frontWindows = new THREE.Mesh(
            new THREE.PlaneGeometry(width * 0.8, height * 0.8),
            windowsMaterial
          );
          frontWindows.position.z = depth/2 + 0.1;
          frontWindows.position.y = 0;
          
          // Create window pattern
          const windowCanvas = document.createElement('canvas');
          windowCanvas.width = 64;
          windowCanvas.height = 64;
          const ctx = windowCanvas.getContext('2d');
          
          if (ctx) {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, 64, 64);
            
            // Draw random lit windows
            ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
            for (let w = 0; w < 8; w++) {
              for (let h = 0; h < 8; h++) {
                if (Math.random() > 0.5) {
                  ctx.fillRect(w * 8, h * 8, 7, 7);
                }
              }
            }
            
            const windowTexture = new THREE.CanvasTexture(windowCanvas);
            windowsMaterial.map = windowTexture;
          }
          
          building.add(frontWindows);
        }
      }
      
      this.mesh.add(buildingGroup);
    } catch (error) {
      console.error("Error creating cityscape:", error);
    }
  }

  addForest() {
    try {
      const treeCount = 100;
      const forestRadius = 200;
      const forestGroup = new THREE.Group();
      
      // Create tree template
      const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
      const leavesGeometry = new THREE.ConeGeometry(1, 2, 8);
      const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x1a472a });
      
      for (let i = 0; i < treeCount; i++) {
        // Create tree group
        const tree = new THREE.Group();
        
        // Create trunk
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 0.75;
        tree.add(trunk);
        
        // Create leaves (2-3 cones stacked)
        const leavesCount = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < leavesCount; j++) {
          const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
          leaves.position.y = 1.5 + j * 1.2;
          leaves.scale.set(
            0.8 - j * 0.2,
            1,
            0.8 - j * 0.2
          );
          tree.add(leaves);
        }
        
        // Position tree randomly in a ring around the track
        const angle = Math.random() * Math.PI * 2;
        const radius = 50 + Math.random() * forestRadius;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Randomize tree scale
        const scale = 0.5 + Math.random() * 1.5;
        tree.scale.set(scale, scale, scale);
        
        tree.position.set(x, 0, z);
        forestGroup.add(tree);
      }
      
      this.mesh.add(forestGroup);
    } catch (error) {
      console.error("Error creating forest:", error);
    }
  }

  updateInfiniteTrack(playerPosition: THREE.Vector3): boolean {
    // Check if player has moved past a segment
    if (playerPosition.z < -this.SEGMENT_LENGTH) {
      try {
        // Remove oldest segment
        const oldSegment = this.segments.shift();
        if (oldSegment) {
          this.mesh.remove(oldSegment);
          
          // Dispose of geometries and materials to prevent memory leaks
          oldSegment.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (child.geometry) {
                child.geometry.dispose();
              }
              
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(material => material.dispose());
                } else {
                  child.material.dispose();
                }
              }
            }
          });
        }

        // Add new segment ahead
        const lastSegment = this.segments[this.segments.length - 1];
        const newZ = lastSegment ? lastSegment.position.z + this.SEGMENT_LENGTH : 0;
        this.addTrackSegment(newZ);

        // Reset player Z position
        playerPosition.z += this.SEGMENT_LENGTH;
        return true;
      } catch (error) {
        console.error("Error updating infinite track:", error);
        return false;
      }
    }
    return false;
  }

  addBarrierLights(segment: THREE.Group, zPosition: number) {
    // Create a basic emissive material that doesn't depend on textures
    const stripGeometry = new THREE.BoxGeometry(0.1, 0.1, this.SEGMENT_LENGTH);
    const stripMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5
    });

    // Add lights to the segment
    const leftStrip = new THREE.Mesh(stripGeometry, stripMaterial);
    leftStrip.position.set(-10.25, 1, zPosition + this.SEGMENT_LENGTH/2);
    segment.add(leftStrip);

    const rightStrip = leftStrip.clone();
    rightStrip.position.set(10.25, 1, zPosition + this.SEGMENT_LENGTH/2);
    segment.add(rightStrip);
    
    // Add point lights at intervals
    const lightCount = 5;
    const lightSpacing = this.SEGMENT_LENGTH / lightCount;
    
    for (let i = 0; i < lightCount; i++) {
      const z = zPosition + i * lightSpacing;
      
      // Left light
      if (i % 2 === 0) { // Alternate sides for performance
        const leftLight = new THREE.PointLight(0x00ff00, 0.5, 10);
        leftLight.position.set(-10.25, 1, z);
        segment.add(leftLight);
      } else {
        // Right light
        const rightLight = new THREE.PointLight(0x00ff00, 0.5, 10);
        rightLight.position.set(10.25, 1, z);
        segment.add(rightLight);
      }
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
    
    // Add checkered pattern
    const checkerGeometry = new THREE.PlaneGeometry(20, 2);
    const checkerCanvas = document.createElement('canvas');
    checkerCanvas.width = 512;
    checkerCanvas.height = 64;
    const ctx = checkerCanvas.getContext('2d');
    
    if (ctx) {
      const squareSize = 32;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 512, 64);
      
      ctx.fillStyle = 'black';
      for (let x = 0; x < 512; x += squareSize * 2) {
        for (let y = 0; y < 64; y += squareSize) {
          if ((x / squareSize + y / squareSize) % 2 === 0) {
            ctx.fillRect(x, y, squareSize, squareSize);
            ctx.fillRect(x + squareSize, y + squareSize, squareSize, squareSize);
          } else {
            ctx.fillRect(x + squareSize, y, squareSize, squareSize);
            ctx.fillRect(x, y + squareSize, squareSize, squareSize);
          }
        }
      }
      
      const checkerTexture = new THREE.CanvasTexture(checkerCanvas);
      const checkerMaterial = new THREE.MeshStandardMaterial({
        map: checkerTexture,
        roughness: 0.5
      });
      
      const checkerLine = new THREE.Mesh(checkerGeometry, checkerMaterial);
      checkerLine.rotation.x = -Math.PI / 2;
      checkerLine.position.set(0, 0.02, -40); // Slightly above the white line
      this.mesh.add(checkerLine);
    }
  }
}