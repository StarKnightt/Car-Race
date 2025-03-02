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
    
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5a27,
      roughness: 0.9
    });

    // Add texture repetition
    groundMaterial.map!.wrapS = groundMaterial.map!.wrapT = THREE.RepeatWrapping;
    groundMaterial.map!.repeat.set(200, 200);
    groundMaterial.normalMap!.wrapS = groundMaterial.normalMap!.wrapT = THREE.RepeatWrapping;
    groundMaterial.normalMap!.repeat.set(200, 200);
    groundMaterial.roughnessMap!.wrapS = groundMaterial.roughnessMap!.wrapT = THREE.RepeatWrapping;
    groundMaterial.roughnessMap!.repeat.set(200, 200);

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.mesh.add(ground);

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
    
    // Create track surface with better detail
    const trackGeometry = new THREE.PlaneGeometry(20, this.SEGMENT_LENGTH, 40, 200);
    const trackTextureLoader = new THREE.TextureLoader();
    
    const trackMaterial = new THREE.MeshStandardMaterial({
      map: trackTextureLoader.load('/textures/track/asphalt_diffuse.jpg'),
      normalMap: trackTextureLoader.load('/textures/track/asphalt_normal.jpg'),
      roughnessMap: trackTextureLoader.load('/textures/track/asphalt_roughness.jpg'),
      displacementMap: trackTextureLoader.load('/textures/track/asphalt_height.jpg'),
      displacementScale: 0.2,
      roughness: 0.7,
      metalness: 0.1
    });

    // Add texture repetition for track
    trackMaterial.map!.wrapS = trackMaterial.map!.wrapT = THREE.RepeatWrapping;
    trackMaterial.map!.repeat.set(2, this.SEGMENT_LENGTH / 10);

    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.rotation.x = -Math.PI / 2;
    track.position.z = zPosition;
    track.receiveShadow = true;
    segment.add(track);

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
    throw new Error('Method not implemented.');
  }

  addCityscape() {
    throw new Error('Method not implemented.');
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
    throw new Error('Method not implemented.');
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

  private addBarrierLights() {
    const stripGeometry = new THREE.BoxGeometry(0.1, 0.1, 100);
    const stripMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5
    });

    const leftStrip = new THREE.Mesh(stripGeometry, stripMaterial);
    leftStrip.position.set(-10.25, 1, 0);
    this.mesh.add(leftStrip);

    const rightStrip = leftStrip.clone();
    rightStrip.position.set(10.25, 1, 0);
    this.mesh.add(rightStrip);
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