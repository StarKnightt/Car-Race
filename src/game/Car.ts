import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
import { GameControls } from './GameControls';

// Custom shader material interface
interface NitroShaderUniforms {
  [key: string]: { value: any };
  time: { value: number };
  texture: { value: THREE.Texture };
}

interface BeamShaderUniforms {
  [uniform: string]: THREE.IUniform<any>;
  time: { value: number };
  color: { value: THREE.Color };
}

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
  carColor: number;
  nitroParticles: THREE.Points[];
  headlightsOn: boolean;
  engineStartSound: HTMLAudioElement | null;

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
    this.carColor = 0xff0000; // Default red
    this.nitroParticles = [];
    this.headlightsOn = false;
    this.engineStartSound = null;

    this.setupSounds();  // Setup sounds first
    this.createCar();    // Then create the car
  }

  setupSounds() {
    try {
      // Use proper paths to the audio files with leading slash
      try {
        this.engineSound = new Audio('/audio/engine.mp3');
        this.engineSound.loop = true;
        this.engineSound.volume = 0.4; // Lower default volume
      } catch (e) {
        console.warn('Failed to load engine sound:', e);
        this.engineSound = null;
      }

      try {
        this.engineStartSound = new Audio('/audio/start.mp3');
        this.engineStartSound.volume = 0.5;
      } catch (e) {
        console.warn('Failed to load engine start sound:', e);
        this.engineStartSound = null;
      }

      try {
        this.engineRevSound = new Audio('/audio/rev.mp3');
        this.engineRevSound.volume = 0.4;
      } catch (e) {
        console.warn('Failed to load engine rev sound:', e);
        this.engineRevSound = null;
      }

      try {
        this.turboSound = new Audio('/audio/turbo.mp3');
        this.turboSound.volume = 0.3;
      } catch (e) {
        console.warn('Failed to load turbo sound:', e);
        this.turboSound = null;
      }

      try {
        this.nitroSound = new Audio('/audio/nitro.mp3');
        this.nitroSound.volume = 0.4;
      } catch (e) {
        console.warn('Failed to load nitro sound:', e);
        this.nitroSound = null;
      }

      try {
        this.missileSound = new Audio('/audio/missile.mp3');
        this.missileSound.volume = 0.5;
      } catch (e) {
        console.warn('Failed to load missile sound:', e);
        this.missileSound = null;
      }
      
      // Preload sounds
      this.engineSound?.load();
      this.engineStartSound?.load();
      this.engineRevSound?.load();
      this.turboSound?.load();
      this.nitroSound?.load();
      this.missileSound?.load();
      
    } catch (e) {
      console.error('Error in sound setup:', e);
      // Set all sounds to null to be safe
      this.engineSound = null;
      this.engineStartSound = null;
      this.engineRevSound = null;
      this.turboSound = null;
      this.nitroSound = null;
      this.missileSound = null;
    }
  }

  setCarColor(color: number) {
    this.carColor = color;
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (child.userData.isBodyPart) {
          child.material.color.setHex(color);
        }
      }
    });
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

    bodyMaterial.userData = { isBodyPart: true };
    hood.userData = { isBodyPart: true };
    spoilerWing.userData = { isBodyPart: true };
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
        emissiveIntensity: 0
    });

    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-0.6, 0.5, -1.9);
    leftHeadlight.userData = { isHeadlight: true };
    this.mesh.add(leftHeadlight);

    // Add headlight cone
    const lightConeGeometry = new THREE.ConeGeometry(1, 4, 32);
    const lightConeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffcc,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    });

    const leftLightCone = new THREE.Mesh(lightConeGeometry, lightConeMaterial);
    leftLightCone.rotation.x = Math.PI / 2;
    leftLightCone.position.set(-0.6, 0.5, -3.9);
    leftLightCone.visible = false;
    leftLightCone.userData = { isLightCone: true };
    this.mesh.add(leftLightCone);

    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(0.6, 0.5, -1.9);
    rightHeadlight.userData = { isHeadlight: true };
    this.mesh.add(rightHeadlight);

    const rightLightCone = new THREE.Mesh(lightConeGeometry, lightConeMaterial);
    rightLightCone.rotation.x = Math.PI / 2;
    rightLightCone.position.set(0.6, 0.5, -3.9);
    rightLightCone.visible = false;
    rightLightCone.userData = { isLightCone: true };
    this.mesh.add(rightLightCone);

    // Add volumetric headlight beams with proper types
    const headlightBeamGeometry = new THREE.CylinderGeometry(0.1, 2, 10, 32, 1, true);
    const headlightBeamMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0xffffcc) }
      } as BeamShaderUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec2 vUv;
        
        void main() {
          float intensity = pow(1.0 - vUv.y, 2.0) * 0.5;
          gl_FragColor = vec4(color, intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    // Add headlight beams
    const leftBeam = new THREE.Mesh(headlightBeamGeometry, headlightBeamMaterial);
    leftBeam.position.set(-0.6, 0.5, -2.5);
    leftBeam.rotation.x = Math.PI / 2;
    leftBeam.visible = false; // Initially hidden
    leftBeam.userData = { isBeam: true };
    this.mesh.add(leftBeam);

    const rightBeam = leftBeam.clone();
    rightBeam.position.x = 0.6;
    rightBeam.userData = { isBeam: true };
    this.mesh.add(rightBeam);

    // Fix Lensflare creation with proper path
    const textureLoader = new THREE.TextureLoader();
    const lensflare = new Lensflare();
    
    try {
      textureLoader.load('/textures/particles/flame.png', // Use absolute path
        texture => {
          if (texture) {
            lensflare.addElement(new LensflareElement(texture, 200, 0));
            lensflare.addElement(new LensflareElement(texture, 100, 0.6));
            lensflare.addElement(new LensflareElement(texture, 70, 0.7));
            
            // Add to both headlights
            const lensflare2 = new Lensflare();
            lensflare2.copy(lensflare);
            
            // Position the lensflares correctly
            lensflare.position.set(-0.6, 0.5, -1.9);
            lensflare2.position.set(0.6, 0.5, -1.9);
            
            this.mesh.add(lensflare);
            this.mesh.add(lensflare2);
          }
        },
        undefined,
        error => console.warn('Failed to load flare texture:', error)
      );
    } catch (e) {
      console.error('Error creating lens flares:', e);
    }
  }

  toggleHeadlights() {
    this.headlightsOn = !this.headlightsOn;
    
    // Fix headlight toggling by properly traversing the car mesh
    try {
      // 1. Update headlight meshes
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.isHeadlight) {
          const material = child.material as THREE.MeshStandardMaterial;
          material.emissiveIntensity = this.headlightsOn ? 1 : 0;
        }
        
        // 2. Toggle visibility of light cones
        if (child.userData && child.userData.isLightCone) {
          child.visible = this.headlightsOn;
        }
      });
      
      // 3. Update beam visibility - find the child objects that are beams
      const beams: THREE.Mesh<any, any, any>[] = [];
      this.mesh.traverse((child) => {
        // Identify beams by their geometry (cylinder) and material (ShaderMaterial)
        if (child instanceof THREE.Mesh && 
            child.geometry instanceof THREE.CylinderGeometry && 
            child.rotation.x === Math.PI / 2 && 
            (child.position.z === -2.5 || Math.abs(child.position.z + 2.5) < 0.1)) {
          beams.push(child);
        }
      });
      
      // Toggle beam visibility
      beams.forEach(beam => {
        beam.visible = this.headlightsOn;
      });
      
    } catch (error) {
      console.error('Error toggling headlights:', error);
    }
    
    // Optional: Play headlight switch sound
    try {
      const clickSound = new Audio();
      clickSound.src = './audio/click.mp3';
      clickSound.volume = 0.3;
      clickSound.play().catch(() => {}); // Ignore errors
    } catch (e) {
      // Silent fail for sound
    }
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

  createNitroEffect() {
    const particleCount = 500; // More particles
    const textureLoader = new THREE.TextureLoader();
    
    // Create geometry and basic material first
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const lifetimes = new Float32Array(particleCount);

    // Initialize particle properties
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 2] = Math.random() * 3;

      // Create flame color gradient
      colors[i * 3] = Math.random();     // R
      colors[i * 3 + 1] = Math.random() * 0.5; // G
      colors[i * 3 + 2] = 0.1;           // B

      sizes[i] = Math.random() * 0.2 + 0.1;
      lifetimes[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));

    // Use PointsMaterial with better defaults for flame effect
    const material = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.2,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      sizeAttenuation: true,
      depthWrite: false // Prevent particles from blocking each other
    });

    // Load the flame texture from the correct path
    // Remove the duplicate texture loading code - there were two attempts previously
    textureLoader.load('/textures/particles/flame.png',
      texture => {
        if (texture) {
          material.map = texture;
          material.needsUpdate = true;
          console.log('Successfully loaded flame texture');
        }
      },
      undefined,
      error => {
        console.warn('Failed to load flame texture:', error);
        
        // Create fallback texture using canvas
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Create a simple circular gradient for the particle
          const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
          gradient.addColorStop(0.2, 'rgba(255, 200, 0, 0.8)');
          gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.4)');
          gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 32, 32);
          
          // Use this as fallback
          material.map = new THREE.CanvasTexture(canvas);
          material.needsUpdate = true;
        }
      }
    );

    // Create exhaust effects
    const particles = new THREE.Points(geometry, material);
    particles.position.set(0.4, 0.2, 2);
    this.mesh.add(particles);
    this.nitroParticles.push(particles);

    const particles2 = particles.clone();
    particles2.position.set(-0.4, 0.2, 2);
    this.mesh.add(particles2);
    this.nitroParticles.push(particles2);
  }

  fireMissile(scene?: THREE.Scene) {
    if (this.missileCount <= 0 || !scene) return;
    
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

    // Add missile trail effect
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.PointsMaterial({
      color: 0xff4400,
      size: 0.1,
      blending: THREE.AdditiveBlending
    });
    const trail = new THREE.Points(trailGeometry, trailMaterial);
    missile.add(trail);
    
    this.missiles.push(missile);
    this.missileCount--;
    this.lastMissileTime = Date.now();

    scene.add(missile);

    if (this.missileSound) {
      this.missileSound.currentTime = 0;
      this.missileSound.play().catch(err => console.warn('Missile sound playback failed:', err));
    }
  }

  updateNitroEffect(controls: GameControls) {
    this.nitroParticles.forEach(particles => {
      if (controls.nitro && this.nitroCharge > 0) {
        particles.visible = true;
        const positions = (particles.geometry as THREE.BufferGeometry)
          .attributes.position.array as Float32Array;
        
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 2] -= 0.2; // Move particle back
          if (positions[i + 2] < 0) {
            positions[i + 2] = 2; // Reset particle position
            positions[i] = (Math.random() - 0.5) * 0.5;
            positions[i + 1] = (Math.random() - 0.5) * 0.5;
          }
        }
        particles.geometry.attributes.position.needsUpdate = true;
      } else {
        particles.visible = false;
      }
    });
  }

  update(controls: GameControls, scene?: THREE.Scene) {
    // Start engine sound when first moving
    if (controls.forward && Math.abs(this.speed) < 0.01 && this.engineStartSound) {
      this.engineStartSound.currentTime = 0;
      this.engineStartSound.play().catch(console.error);
    }

    // Handle turbo boost
    this.turboBoost = controls.forward && controls.shift;
    const currentMaxSpeed = this.turboBoost ? this.turboSpeed : this.maxSpeed;
    const currentAcceleration = this.turboBoost ? this.turboAcceleration : this.acceleration;

    // Handle nitro boost
    if (controls.nitro && this.nitroCharge > 0) {
      this.speed = Math.min(this.speed + this.turboAcceleration * 2.5, this.turboSpeed * 2);
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
    this.updateMissiles(scene);

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

    // Simplify nitro particle update logic - avoid redundancy 
    this.updateNitroEffect(controls);
  }

  // New helper method to update particle positions
  private updateParticlePositions(particles: THREE.Points) {
    try {
      const positions = (particles.geometry as THREE.BufferGeometry)
        .attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] -= 0.2; // Move particle back
        if (positions[i + 2] < 0) {
          positions[i + 2] = 2; // Reset particle position
          positions[i] = (Math.random() - 0.5) * 0.5;
          positions[i + 1] = (Math.random() - 0.5) * 0.5;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
    } catch (e) {
      console.warn('Error updating particle positions:', e);
    }
  }

  updateMissiles(scene?: THREE.Scene) {
    const missileSpeed = 1;
    this.missiles.forEach((missile, index) => {
      missile.translateZ(-missileSpeed);
      
      // Update missile trail
      const trail = missile.children[0] as THREE.Points;
      const positions = [];
      for (let i = 0; i < 10; i++) {
        const pos = missile.position.clone();
        pos.z += i * 0.1;
        positions.push(pos.x, pos.y, pos.z);
      }
      trail.geometry.setAttribute('position', 
        new THREE.Float32BufferAttribute(positions, 3));
      
      // Remove missile if too far
      if (missile.position.distanceTo(this.mesh.position) > 100) {
        scene?.remove(missile);
        this.missiles.splice(index, 1);
      }
    });

    // Recharge missiles
    if (this.missileCount < this.maxMissiles && 
        Date.now() - this.lastMissileTime > this.missileRechargeTime) {
      this.missileCount++;
      this.lastMissileTime = Date.now();
    }
  }
}