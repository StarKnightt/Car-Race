import * as THREE from 'three';

export class Track {
  mesh: THREE.Group;
  
  constructor() {
    this.mesh = new THREE.Group();
    this.createTrack();
  }

  createTrack() {
    // Create ground (larger area surrounding the track)
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x3a3a3a,  // Dark gray for surrounding area
      side: THREE.DoubleSide 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.mesh.add(ground);

    // Create race track
    this.createRaceTrack();
    
    // Add environment objects
    this.addEnvironmentObjects();
    
    // Add track barriers
    this.addTrackBarriers();
    
    // Add skid marks
    this.addSkidMarks();
    
    // Add track decorations
    this.addTrackDecorations();
  }

  createRaceTrack() {
    // Create a custom shape for the track
    const trackShape = new THREE.Shape();
    
    // Create a more complex track shape (figure-8 style)
    const trackWidth = 12; // Width of the track
    const trackOuterRadius = 40; // Outer radius
    const trackInnerRadius = trackOuterRadius - trackWidth; // Inner radius
    
    // Create outer track edge (figure-8 shape)
    trackShape.moveTo(0, -trackOuterRadius);
    trackShape.bezierCurveTo(
      trackOuterRadius, -trackOuterRadius,
      trackOuterRadius, trackOuterRadius,
      0, trackOuterRadius
    );
    trackShape.bezierCurveTo(
      -trackOuterRadius, trackOuterRadius,
      -trackOuterRadius, -trackOuterRadius,
      0, -trackOuterRadius
    );
    
    // Create inner track edge (hole)
    const holePath = new THREE.Path();
    holePath.moveTo(0, -trackInnerRadius);
    holePath.bezierCurveTo(
      trackInnerRadius, -trackInnerRadius,
      trackInnerRadius, trackInnerRadius,
      0, trackInnerRadius
    );
    holePath.bezierCurveTo(
      -trackInnerRadius, trackInnerRadius,
      -trackInnerRadius, -trackInnerRadius,
      0, -trackInnerRadius
    );
    trackShape.holes.push(holePath);
    
    // Create track geometry
    const trackGeometry = new THREE.ShapeGeometry(trackShape);
    
    // Create asphalt texture
    const textureLoader = new THREE.TextureLoader();
    const asphaltMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,  // Very dark gray for asphalt
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    
    const track = new THREE.Mesh(trackGeometry, asphaltMaterial);
    track.rotation.x = -Math.PI / 2;
    track.position.y = 0.01; // Slightly above ground to prevent z-fighting
    track.receiveShadow = true;
    this.mesh.add(track);
    
    // Add track markings
    this.addTrackMarkings(trackOuterRadius, trackInnerRadius, trackWidth);
  }
  
  addTrackMarkings(outerRadius: number, innerRadius: number, trackWidth: number) {
    // Create materials for markings
    const whiteLineMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.5,
      side: THREE.DoubleSide 
    });
    
    const yellowLineMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffcc00,
      roughness: 0.5,
      side: THREE.DoubleSide 
    });
    
    // Center dividing line (dashed yellow line)
    const centerRadius = (outerRadius + innerRadius) / 2;
    const centerLineShape = new THREE.Shape();
    centerLineShape.absarc(0, 0, centerRadius, 0, Math.PI * 2, false);
    
    const centerLineGeometry = new THREE.ShapeGeometry(centerLineShape);
    const centerLine = new THREE.Line(
      new THREE.EdgesGeometry(centerLineGeometry),
      new THREE.LineDashedMaterial({ 
        color: 0xffcc00, 
        dashSize: 2, 
        gapSize: 2,
        linewidth: 2
      })
    );
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.02;
    this.mesh.add(centerLine);
    
    // Edge lines (solid white)
    const outerLineShape = new THREE.Shape();
    outerLineShape.absarc(0, 0, outerRadius - 0.2, 0, Math.PI * 2, false);
    
    const outerLineGeometry = new THREE.ShapeGeometry(outerLineShape);
    const outerLine = new THREE.Line(
      new THREE.EdgesGeometry(outerLineGeometry),
      new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 })
    );
    outerLine.rotation.x = -Math.PI / 2;
    outerLine.position.y = 0.02;
    this.mesh.add(outerLine);
    
    const innerLineShape = new THREE.Shape();
    innerLineShape.absarc(0, 0, innerRadius + 0.2, 0, Math.PI * 2, false);
    
    const innerLineGeometry = new THREE.ShapeGeometry(innerLineShape);
    const innerLine = new THREE.Line(
      new THREE.EdgesGeometry(innerLineGeometry),
      new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 })
    );
    innerLine.rotation.x = -Math.PI / 2;
    innerLine.position.y = 0.02;
    this.mesh.add(innerLine);
    
    // Start/finish line
    const startLineGeometry = new THREE.PlaneGeometry(trackWidth, 2);
    const startLineMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.5,
      side: THREE.DoubleSide 
    });
    
    const startLine = new THREE.Mesh(startLineGeometry, startLineMaterial);
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(0, 0.02, -outerRadius + trackWidth/2);
    startLine.receiveShadow = true;
    this.mesh.add(startLine);
    
    // Add checkered pattern to start/finish line
    const checkerCount = 8;
    const checkerSize = trackWidth / checkerCount;
    
    for (let i = 0; i < checkerCount; i++) {
      if (i % 2 === 0) continue; // Skip every other square
      
      const checkerGeometry = new THREE.PlaneGeometry(checkerSize, 2);
      const checkerMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        roughness: 0.5,
        side: THREE.DoubleSide 
      });
      
      const checker = new THREE.Mesh(checkerGeometry, checkerMaterial);
      checker.rotation.x = -Math.PI / 2;
      const xPos = -trackWidth/2 + checkerSize/2 + i * checkerSize;
      checker.position.set(xPos, 0.025, -outerRadius + trackWidth/2);
      checker.receiveShadow = true;
      this.mesh.add(checker);
    }
  }
  
  addTrackBarriers() {
    // Create barrier material
    const barrierMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xdd0000, // Red and white barriers
      roughness: 0.7,
      metalness: 0.3
    });
    
    const stripeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.3
    });
    
    // Outer track barriers
    const outerRadius = 40;
    const segments = 40;
    const barrierHeight = 1;
    const barrierDepth = 0.5;
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const nextAngle = ((i + 1) / segments) * Math.PI * 2;
      
      const x1 = Math.sin(angle) * outerRadius;
      const z1 = Math.cos(angle) * outerRadius;
      const x2 = Math.sin(nextAngle) * outerRadius;
      const z2 = Math.cos(nextAngle) * outerRadius;
      
      // Calculate length and rotation for this barrier segment
      const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
      const rotation = Math.atan2(x2 - x1, z2 - z1);
      
      // Create barrier segment
      const barrierGeometry = new THREE.BoxGeometry(length, barrierHeight, barrierDepth);
      const barrier = new THREE.Mesh(barrierGeometry, i % 2 === 0 ? barrierMaterial : stripeMaterial);
      
      // Position at midpoint of the segment
      barrier.position.set((x1 + x2) / 2, barrierHeight / 2, (z1 + z2) / 2);
      barrier.rotation.y = rotation;
      
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      this.mesh.add(barrier);
    }
    
    // Inner track barriers
    const innerRadius = 28;
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const nextAngle = ((i + 1) / segments) * Math.PI * 2;
      
      const x1 = Math.sin(angle) * innerRadius;
      const z1 = Math.cos(angle) * innerRadius;
      const x2 = Math.sin(nextAngle) * innerRadius;
      const z2 = Math.cos(nextAngle) * innerRadius;
      
      // Calculate length and rotation for this barrier segment
      const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
      const rotation = Math.atan2(x2 - x1, z2 - z1);
      
      // Create barrier segment
      const barrierGeometry = new THREE.BoxGeometry(length, barrierHeight, barrierDepth);
      const barrier = new THREE.Mesh(barrierGeometry, i % 2 === 0 ? barrierMaterial : stripeMaterial);
      
      // Position at midpoint of the segment
      barrier.position.set((x1 + x2) / 2, barrierHeight / 2, (z1 + z2) / 2);
      barrier.rotation.y = rotation;
      
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      this.mesh.add(barrier);
    }
  }
  
  addSkidMarks() {
    // Add some random skid marks on the track for visual effect
    const skidMarkMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x111111,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const skidMarkPositions = [
      { x: 30, z: 10, rotation: Math.PI / 4, length: 8 },
      { x: -25, z: 15, rotation: -Math.PI / 3, length: 10 },
      { x: 0, z: -35, rotation: Math.PI / 8, length: 12 },
      { x: 15, z: -20, rotation: -Math.PI / 6, length: 7 },
      { x: -15, z: -30, rotation: Math.PI / 5, length: 9 }
    ];
    
    skidMarkPositions.forEach(mark => {
      const skidMarkGeometry = new THREE.PlaneGeometry(mark.length, 0.5);
      const skidMark = new THREE.Mesh(skidMarkGeometry, skidMarkMaterial);
      skidMark.rotation.x = -Math.PI / 2;
      skidMark.rotation.z = mark.rotation;
      skidMark.position.set(mark.x, 0.02, mark.z);
      this.mesh.add(skidMark);
    });
  }
  
  addTrackDecorations() {
    // Add grandstands
    this.addGrandstand(0, -50, Math.PI);
    this.addGrandstand(-50, 0, Math.PI / 2);
    this.addGrandstand(50, 0, -Math.PI / 2);
    
    // Add billboards
    this.addBillboard(30, 50, 0, "RACING");
    this.addBillboard(-30, 50, 0, "CHAMPIONS");
    this.addBillboard(0, -50, Math.PI, "FINISH LINE");
    
    // Add some trees and obstacles
    this.addEnvironmentObjects();
  }
  
  addGrandstand(x: number, z: number, rotation: number) {
    const grandstand = new THREE.Group();
    
    // Base platform
    const baseGeometry = new THREE.BoxGeometry(20, 1, 10);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.5;
    base.castShadow = true;
    base.receiveShadow = true;
    grandstand.add(base);
    
    // Seats (rows)
    const seatRowMaterial = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    const seatCount = 5;
    
    for (let i = 0; i < seatCount; i++) {
      const rowGeometry = new THREE.BoxGeometry(20, 0.5, 1.5);
      const row = new THREE.Mesh(rowGeometry, seatRowMaterial);
      row.position.set(0, 1 + i * 1, -3 + i * 1.5);
      row.castShadow = true;
      row.receiveShadow = true;
      grandstand.add(row);
    }
    
    // Add some spectators (simplified as colored boxes)
    const spectatorColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    const spectatorCount = 30;
    
    for (let i = 0; i < spectatorCount; i++) {
      const row = Math.floor(Math.random() * seatCount);
      const position = -9 + Math.random() * 18;
      
      const spectatorGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
      const spectatorMaterial = new THREE.MeshStandardMaterial({ 
        color: spectatorColors[Math.floor(Math.random() * spectatorColors.length)] 
      });
      
      const spectator = new THREE.Mesh(spectatorGeometry, spectatorMaterial);
      spectator.position.set(position, 1.5 + row * 1, -3 + row * 1.5);
      spectator.castShadow = true;
      spectator.receiveShadow = true;
      grandstand.add(spectator);
    }
    
    // Position and rotate the grandstand
    grandstand.position.set(x, 0, z);
    grandstand.rotation.y = rotation;
    this.mesh.add(grandstand);
  }
  
  addBillboard(x: number, z: number, rotation: number, text: string) {
    const billboard = new THREE.Group();
    
    // Billboard structure
    const postGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    
    const post1 = new THREE.Mesh(postGeometry, postMaterial);
    post1.position.set(-4, 4, 0);
    post1.castShadow = true;
    post1.receiveShadow = true;
    billboard.add(post1);
    
    const post2 = new THREE.Mesh(postGeometry, postMaterial);
    post2.position.set(4, 4, 0);
    post2.castShadow = true;
    post2.receiveShadow = true;
    billboard.add(post2);
    
    // Billboard panel
    const panelGeometry = new THREE.BoxGeometry(10, 3, 0.2);
    const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(0, 6, 0);
    panel.castShadow = true;
    panel.receiveShadow = true;
    billboard.add(panel);
    
    // Position and rotate the billboard
    billboard.position.set(x, 0, z);
    billboard.rotation.y = rotation;
    this.mesh.add(billboard);
  }
  
  addEnvironmentObjects() {
    // Add trees around the track
    const treePositions = [
      { x: -60, z: -60 }, { x: -55, z: -50 }, { x: -65, z: -40 },
      { x: -60, z: 60 }, { x: -50, z: 55 }, { x: -40, z: 65 },
      { x: 60, z: -60 }, { x: 55, z: -50 }, { x: 65, z: -40 },
      { x: 60, z: 60 }, { x: 50, z: 55 }, { x: 40, z: 65 },
      { x: 0, z: -65 }, { x: 0, z: 65 }, { x: -65, z: 0 }, { x: 65, z: 0 }
    ];
    
    treePositions.forEach(pos => {
      this.createTree(pos.x, pos.z);
    });
    
    // Add tire stacks as obstacles
    const tireStackPositions = [
      { x: 35, z: 35 }, { x: -35, z: 35 }, { x: 35, z: -35 }, { x: -35, z: -35 },
      { x: 0, z: 45 }, { x: 0, z: -45 }, { x: 45, z: 0 }, { x: -45, z: 0 }
    ];
    
    tireStackPositions.forEach(pos => {
      this.createTireStack(pos.x, pos.z);
    });
  }
  
  createTree(x: number, z: number) {
    const tree = new THREE.Group();
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 0.9
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);
    
    // Tree foliage (multiple layers for more realistic look)
    const foliageMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2E8B57,
      roughness: 0.8
    });
    
    const foliageGeometry1 = new THREE.ConeGeometry(3, 4, 8);
    const foliage1 = new THREE.Mesh(foliageGeometry1, foliageMaterial);
    foliage1.position.y = 5;
    foliage1.castShadow = true;
    foliage1.receiveShadow = true;
    tree.add(foliage1);
    
    const foliageGeometry2 = new THREE.ConeGeometry(2.5, 3, 8);
    const foliage2 = new THREE.Mesh(foliageGeometry2, foliageMaterial);
    foliage2.position.y = 7;
    foliage2.castShadow = true;
    foliage2.receiveShadow = true;
    tree.add(foliage2);
    
    const foliageGeometry3 = new THREE.ConeGeometry(1.8, 2.5, 8);
    const foliage3 = new THREE.Mesh(foliageGeometry3, foliageMaterial);
    foliage3.position.y = 9;
    foliage3.castShadow = true;
    foliage3.receiveShadow = true;
    tree.add(foliage3);
    
    tree.position.set(x, 0, z);
    // Add some random rotation for variety
    tree.rotation.y = Math.random() * Math.PI * 2;
    this.mesh.add(tree);
  }
  
  createTireStack(x: number, z: number) {
    const tireStack = new THREE.Group();
    const tireMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x111111,
      roughness: 0.9
    });
    
    // Create a stack of tires (3 layers)
    const tireGeometry = new THREE.TorusGeometry(1, 0.4, 8, 24);
    
    // Bottom layer (4 tires)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const tire = new THREE.Mesh(tireGeometry, tireMaterial);
      tire.position.set(Math.cos(angle) * 0.2, 0.4, Math.sin(angle) * 0.2);
      tire.rotation.x = Math.PI / 2;
      tire.castShadow = true;
      tire.receiveShadow = true;
      tireStack.add(tire);
    }
    
    // Middle layer (3 tires)
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const tire = new THREE.Mesh(tireGeometry, tireMaterial);
      tire.position.set(Math.cos(angle) * 0.15, 1.2, Math.sin(angle) * 0.15);
      tire.rotation.x = Math.PI / 2;
      tire.castShadow = true;
      tire.receiveShadow = true;
      tireStack.add(tire);
    }
    
    // Top layer (2 tires)
    for (let i = 0; i < 2; i++) {
      const angle = (i / 2) * Math.PI * 2;
      const tire = new THREE.Mesh(tireGeometry, tireMaterial);
      tire.position.set(Math.cos(angle) * 0.1, 2.0, Math.sin(angle) * 0.1);
      tire.rotation.x = Math.PI / 2;
      tire.castShadow = true;
      tire.receiveShadow = true;
      tireStack.add(tire);
    }
    
    tireStack.position.set(x, 0, z);
    this.mesh.add(tireStack);
  }
}