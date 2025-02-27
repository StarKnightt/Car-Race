import * as THREE from 'three';
import { GameControls } from './GameControls';

export class Car {
  mesh: THREE.Group;
  speed: number;
  acceleration: number;
  deceleration: number;
  maxSpeed: number;
  rotationSpeed: number;
  direction: THREE.Vector3;
  engineSound: HTMLAudioElement | null;
  turboBoost: boolean;
  turboSpeed: number;
  turboAcceleration: number;
  turboSound: HTMLAudioElement | null;
  engineRevSound: HTMLAudioElement | null;
  nitroCharge: number;
  nitroMax: number;
  nitroRechargeRate: number;
  nitroSound: HTMLAudioElement | null;
  missiles: THREE.Mesh[];
  missileSound: HTMLAudioElement | null;
  maxMissiles: number;
  missileCount: number;
  missileRechargeTime: number;
  lastMissileTime: number;

  constructor() {
    this.mesh = new THREE.Group();
    this.speed = 0;
    this.acceleration = 0.015;
    this.deceleration = 0.008;
    this.maxSpeed = 0.25;
    this.rotationSpeed = 0.035;
    this.direction = new THREE.Vector3(0, 0, -1);
    this.engineSound = null;
    this.turboBoost = false;
    this.turboSpeed = 0.4;
    this.turboAcceleration = 0.02;
    this.engineRevSound = null;
    this.turboSound = null;
    this.nitroCharge = 100;
    this.nitroMax = 100;
    this.nitroRechargeRate = 0.2;
    this.nitroSound = null;
    this.missiles = [];
    this.missileSound = null;
    this.maxMissiles = 3;
    this.missileCount = this.maxMissiles;
    this.missileRechargeTime = 5000; // 5 seconds
    this.lastMissileTime = 0;

    this.setupSounds();  // Setup sounds first
    this.createCar();    // Then create the car
  }

  setupSounds() {
    try {
      // Engine sound
      this.engineSound = new Audio('/sounds/engine.mp3');
      this.engineSound.loop = true;
      this.engineSound.volume = 0;

      // Engine rev sound
      this.engineRevSound = new Audio('/sounds/engineRev.mp3');
      this.engineRevSound.volume = 0.3;

      // Turbo sound
      this.turboSound = new Audio('/sounds/turbo.mp3');
      this.turboSound.volume = 0.4;

      // Nitro sound
      this.nitroSound = new Audio('/sounds/nitro.mp3');
      this.nitroSound.volume = 0.3;

      // Missile sound
      this.missileSound = new Audio('/sounds/missile.mp3');
      this.missileSound.volume = 0.4;

      // Preload sounds
      this.engineSound.load();
      this.engineRevSound?.load();
      this.turboSound?.load();
      this.nitroSound.load();
      this.missileSound?.load();
    } catch (error) {
      console.warn('Unable to setup sounds:', error);
      this.engineSound = null;
      this.engineRevSound = null;
      this.turboSound = null;
      this.nitroSound = null;
      this.missileSound = null;
    }
  }

  createCar() {
    // Car body - more detailed with better materials
    const bodyGeometry = new THREE.BoxGeometry(1.8, 0.5, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      roughness: 0.2,
      metalness: 0.8
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    this.mesh.add(body);

    // Car hood (sloped front)
    const hoodGeometry = new THREE.BoxGeometry(1.8, 0.3, 1);
    const hood = new THREE.Mesh(hoodGeometry, bodyMaterial);
    hood.position.set(0, 0.7, -1.5);
    hood.rotation.x = -0.2;
    hood.castShadow = true;
    hood.receiveShadow = true;
    this.mesh.add(hood);

    // Car cabin
    const cabinGeometry = new THREE.BoxGeometry(1.6, 0.5, 2);
    const cabinMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x111111,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.7
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.y = 1;
    cabin.position.z = 0;
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    this.mesh.add(cabin);

    // Spoiler
    const spoilerStandGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
    const spoilerMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    const spoilerStandLeft = new THREE.Mesh(spoilerStandGeometry, spoilerMaterial);
    spoilerStandLeft.position.set(-0.6, 1, 1.8);
    this.mesh.add(spoilerStandLeft);
    
    const spoilerStandRight = new THREE.Mesh(spoilerStandGeometry, spoilerMaterial);
    spoilerStandRight.position.set(0.6, 1, 1.8);
    this.mesh.add(spoilerStandRight);
    
    const spoilerWingGeometry = new THREE.BoxGeometry(1.8, 0.1, 0.5);
    const spoilerWing = new THREE.Mesh(spoilerWingGeometry, bodyMaterial);
    spoilerWing.position.set(0, 1.2, 1.8);
    spoilerWing.castShadow = true;
    this.mesh.add(spoilerWing);

    // Wheels with better detail
    this.addDetailedWheels();
    
    // Headlights
    this.addHeadlights();
    
    // Taillights
    this.addTaillights();
    
    // Add exhaust pipes
    this.addExhaustPipes();

    // Position the car
    this.mesh.position.set(0, 0, 0);
  }
  
  addDetailedWheels() {
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 24);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x222222,
      roughness: 0.9
    });
    
    const wheelRimMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      roughness: 0.2,
      metalness: 0.8
    });
    
    // Front left wheel
    const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFL.rotation.z = Math.PI / 2;
    wheelFL.position.set(-0.9, 0.4, -1.2);
    wheelFL.castShadow = true;
    wheelFL.receiveShadow = true;
    this.mesh.add(wheelFL);
    
    // Front left wheel rim
    const rimFL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.31, 8),
      wheelRimMaterial
    );
    rimFL.rotation.z = Math.PI / 2;
    rimFL.position.set(-0.9, 0.4, -1.2);
    this.mesh.add(rimFL);
    
    // Front right wheel
    const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFR.rotation.z = Math.PI / 2;
    wheelFR.position.set(0.9, 0.4, -1.2);
    wheelFR.castShadow = true;
    wheelFR.receiveShadow = true;
    this.mesh.add(wheelFR);
    
    // Front right wheel rim
    const rimFR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.31, 8),
      wheelRimMaterial
    );
    rimFR.rotation.z = Math.PI / 2;
    rimFR.position.set(0.9, 0.4, -1.2);
    this.mesh.add(rimFR);

    // Back left wheel
    const wheelBL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelBL.rotation.z = Math.PI / 2;
    wheelBL.position.set(-0.9, 0.4, 1.2);
    wheelBL.castShadow = true;
    wheelBL.receiveShadow = true;
    this.mesh.add(wheelBL);
    
    // Back left wheel rim
    const rimBL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.31, 8),
      wheelRimMaterial
    );
    rimBL.rotation.z = Math.PI / 2;
    rimBL.position.set(-0.9, 0.4, 1.2);
    this.mesh.add(rimBL);
    
    // Back right wheel
    const wheelBR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelBR.rotation.z = Math.PI / 2;
    wheelBR.position.set(0.9, 0.4, 1.2);
    wheelBR.castShadow = true;
    wheelBR.receiveShadow = true;
    this.mesh.add(wheelBR);
    
    // Back right wheel rim
    const rimBR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.31, 8),
      wheelRimMaterial
    );
    rimBR.rotation.z = Math.PI / 2;
    rimBR.position.set(0.9, 0.4, 1.2);
    this.mesh.add(rimBR);
  }

  addHeadlights() {
    const headlightGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const headlightMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffcc,
        emissive: 0xffffcc,
        emissiveIntensity: 0.5
    });

    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-0.6, 0.5, -1.9);
    this.mesh.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(0.6, 0.5, -1.9);
    this.mesh.add(rightHeadlight);
  }

  addTaillights() {
    const taillightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const taillightMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
    });

    const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
    leftTaillight.position.set(-0.6, 0.5, 1.9);
    this.mesh.add(leftTaillight);

    const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
    rightTaillight.position.set(0.6, 0.5, 1.9);
    this.mesh.add(rightTaillight);
  }

  addExhaustPipes() {
    const exhaustGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16);
    const exhaustMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.2
    });

    const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    leftExhaust.rotation.z = Math.PI / 2;
    leftExhaust.position.set(-0.4, 0.2, 2);
    this.mesh.add(leftExhaust);

    const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    rightExhaust.rotation.z = Math.PI / 2;
    rightExhaust.position.set(0.4, 0.2, 2);
    this.mesh.add(rightExhaust);
  }

  fireMissile(scene?: THREE.Scene) {
    if (this.missileCount <= 0) return;
    
    const missileGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3);
    const missileMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
    });

    const missile = new THREE.Mesh(missileGeometry, missileMaterial);
    
    // Position missile at car's front
    missile.position.copy(this.mesh.position);
    missile.position.y += 0.5;
    missile.rotation.copy(this.mesh.rotation);
    missile.translateZ(-2);

    this.missiles.push(missile);
    this.missileCount--;
    this.lastMissileTime = Date.now();

    // Add missile to scene if scene is provided
    if (scene) {
        scene.add(missile);
    }

    if (this.missileSound) {
        this.missileSound.currentTime = 0;
        this.missileSound.play().catch(err => console.warn('Missile sound playback failed:', err));
    }

    return missile;
  }

  update(controls: GameControls, scene?: THREE.Scene) {
    // Handle turbo boost
    this.turboBoost = controls.forward && controls.shift;
    const currentMaxSpeed = this.turboBoost ? this.turboSpeed : this.maxSpeed;
    const currentAcceleration = this.turboBoost ? this.turboAcceleration : this.acceleration;

    // Handle nitro boost
    if (controls.nitro && this.nitroCharge > 0) {
      this.speed = Math.min(this.speed + this.turboAcceleration * 1.5, this.turboSpeed * 1.5);
      this.nitroCharge = Math.max(0, this.nitroCharge - 1);
      
      if (this.nitroSound && this.nitroSound.paused) {
          this.nitroSound.play().catch(err => console.warn('Nitro sound playback failed:', err));
      }
    } else {
        // Recharge nitro when not in use
        this.nitroCharge = Math.min(this.nitroMax, this.nitroCharge + this.nitroRechargeRate);
        if (this.nitroSound && !this.nitroSound.paused) {
            this.nitroSound.pause();
        }
    }

    // Handle acceleration with turbo
    if (controls.forward) {
      this.speed = Math.min(this.speed + currentAcceleration, currentMaxSpeed);
      
      // Play turbo sound when activating boost
      if (this.turboBoost && this.turboSound && this.turboSound.paused) {
        this.turboSound.currentTime = 0;
        this.turboSound.play().catch(err => console.warn('Turbo sound playback failed:', err));
      }
      
      // Play rev sound when starting to move
      if (this.speed < 0.05 && this.engineRevSound && this.engineRevSound.paused) {
        this.engineRevSound.currentTime = 0;
        this.engineRevSound.play().catch(err => console.warn('Rev sound playback failed:', err));
      }
    } else if (controls.backward) {
      this.speed = Math.max(this.speed - this.acceleration, -currentMaxSpeed / 2);
    } else {
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.deceleration);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.deceleration);
      }
    }

    // Enhanced brake effect
    if (controls.brake) {
      this.speed *= 0.92; // Stronger brake effect
    }

    // Enhanced handling at high speeds
    const speedFactor = Math.abs(this.speed) / currentMaxSpeed;
    const currentRotationSpeed = this.rotationSpeed * (1 - speedFactor * 0.3);

    // Handle rotation with speed-based handling
    if (this.speed !== 0) {
      if (controls.left) {
        this.mesh.rotation.y += currentRotationSpeed;
        this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), currentRotationSpeed);
      }
      if (controls.right) {
        this.mesh.rotation.y -= currentRotationSpeed;
        this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), -currentRotationSpeed);
      }
    }

    // Fire missile
    if (controls.fire && this.missileCount > 0) {
      this.fireMissile(scene);
    }

    // Update missiles
    this.updateMissiles();

    // Update position and sound
    const movement = this.direction.clone().multiplyScalar(this.speed);
    this.mesh.position.add(movement);

    // Enhanced engine sound
    if (this.engineSound) {
      const targetVolume = Math.min((Math.abs(this.speed) / this.maxSpeed) * 0.7, 0.7);
      this.engineSound.volume = targetVolume;

      if (this.speed !== 0 && this.engineSound.paused) {
        this.engineSound.play().catch(err => console.warn('Engine sound playback failed:', err));
      } else if (this.speed === 0 && !this.engineSound.paused) {
        this.engineSound.pause();
      }
    }
  }
  updateMissiles() {
    const missileSpeed = 1;
    for (let i = this.missiles.length - 1; i >= 0; i--) {
        const missile = this.missiles[i];
        
        // Move missile forward
        missile.translateZ(-missileSpeed);
        
        // Remove missile if it's too far
        if (missile.position.distanceTo(this.mesh.position) > 100) {
            missile.removeFromParent();  // Remove from scene
            this.missiles.splice(i, 1);  // Remove from array
        }
    }

    // Recharge missiles
    if (this.missileCount < this.maxMissiles && 
        Date.now() - this.lastMissileTime > this.missileRechargeTime) {
        this.missileCount++;
        this.lastMissileTime = Date.now();
    }
  }
}