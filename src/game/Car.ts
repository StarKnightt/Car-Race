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
  headlights: THREE.SpotLight[];
  taillights: THREE.PointLight[];
  nitroActive: boolean;
  lastNitroUpdateTime: number;

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
    this.headlights = [];
    this.taillights = [];
    this.nitroActive = false;
    this.lastNitroUpdateTime = 0;

    this.setupSounds();  // Setup sounds first
    this.createCar();    // Then create the car
  }

  setupSounds() {
    try {
      const createAudio = (path: string, volume: number, loop: boolean = false): HTMLAudioElement | null => {
        try {
          const audio = new Audio(path);
          audio.volume = volume;
          audio.loop = loop;
          
          // Force preload
          audio.preload = 'auto';
          
          // Create a blob URL for better compatibility
          fetch(path)
            .then(response => {
              if (!response.ok) {
                throw new Error(`Failed to fetch audio: ${path}`);
              }
              return response.blob();
            })
            .then(blob => {
              const blobUrl = URL.createObjectURL(blob);
              audio.src = blobUrl;
              console.log(`Audio loaded successfully: ${path}`);
            })
            .catch(error => {
              console.warn(`Failed to create blob URL for ${path}:`, error);
            });
            
          return audio;
        } catch (e) {
          console.warn(`Failed to create audio for ${path}:`, e);
          return null;
        }
      };
      
      // Setup all sounds with proper error handling
      this.engineSound = createAudio('/audio/engine.mp3', 0.4, true);
      this.engineStartSound = createAudio('/audio/start.mp3', 0.5);
      this.turboSound = createAudio('/audio/turbo.mp3', 0.3);
      this.engineRevSound = createAudio('/audio/rev.mp3', 0.3);
      this.nitroSound = createAudio('/audio/nitro.mp3', 0.4);
      this.missileSound = createAudio('/audio/missile.mp3', 0.5);
      
    } catch (e) {
      console.error('Error setting up sounds:', e);
    }
  }

  setCarColor(color: number) {
    this.carColor = color;
    // Find all car body parts and update their color
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.isCarBody) {
        (child.material as THREE.MeshStandardMaterial).color.set(color);
      }
    });
  }

  createCar() {
    try {
      // Create car body
      const bodyGeometry = new THREE.BoxGeometry(2, 0.6, 4);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: this.carColor,
        roughness: 0.2,
        metalness: 0.8
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.5;
      body.castShadow = true;
      body.receiveShadow = true;
      body.userData.isCarBody = true;
      this.mesh.add(body);

      // Create car roof
      const roofGeometry = new THREE.BoxGeometry(1.8, 0.4, 2);
      const roofMaterial = new THREE.MeshStandardMaterial({
        color: this.carColor,
        roughness: 0.2,
        metalness: 0.8
      });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = 1.0;
      roof.position.z = -0.2;
      roof.castShadow = true;
      roof.receiveShadow = true;
      roof.userData.isCarBody = true;
      this.mesh.add(roof);

      // Create windshield
      const windshieldGeometry = new THREE.PlaneGeometry(1.7, 0.5);
      const windshieldMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.7
      });
      const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
      windshield.position.set(0, 0.8, 0.8);
      windshield.rotation.x = Math.PI / 4;
      this.mesh.add(windshield);

      // Create rear window
      const rearWindowGeometry = new THREE.PlaneGeometry(1.7, 0.5);
      const rearWindow = new THREE.Mesh(rearWindowGeometry, windshieldMaterial.clone());
      rearWindow.position.set(0, 0.8, -1.2);
      rearWindow.rotation.x = -Math.PI / 4;
      this.mesh.add(rearWindow);

      // Add detailed wheels
      this.addDetailedWheels();

      // Add headlights
      this.addHeadlights();

      // Add taillights
      this.addTaillights();

      // Add exhaust pipes
      this.addExhaustPipes();

      // Add spoiler
      this.addSpoiler();

    } catch (error) {
      console.error('Error creating car:', error);
      // Create a simple fallback car if detailed creation fails
      this.createFallbackCar();
    }
  }

  // Add a new method to create a simple fallback car
  createFallbackCar() {
    // Simple car body
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: this.carColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    this.mesh.add(body);

    // Simple wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
    const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
    
    // Front left wheel
    const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFL.position.set(-1.2, 0.5, 1.2);
    wheelFL.rotation.z = Math.PI / 2;
    this.mesh.add(wheelFL);
    
    // Front right wheel
    const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFR.position.set(1.2, 0.5, 1.2);
    wheelFR.rotation.z = Math.PI / 2;
    this.mesh.add(wheelFR);
    
    // Rear left wheel
    const wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRL.position.set(-1.2, 0.5, -1.2);
    wheelRL.rotation.z = Math.PI / 2;
    this.mesh.add(wheelRL);
    
    // Rear right wheel
    const wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRR.position.set(1.2, 0.5, -1.2);
    wheelRR.rotation.z = Math.PI / 2;
    this.mesh.add(wheelRR);
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
    try {
      // Create headlight geometry
      const headlightGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      const headlightMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffcc,
        emissive: 0xffffcc,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8
      });

      // Left headlight
      const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
      leftHeadlight.position.set(-0.6, 0.5, -1.9);
      leftHeadlight.userData = { isHeadlightGlow: true };
      this.mesh.add(leftHeadlight);

      // Right headlight
      const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
      rightHeadlight.position.set(0.6, 0.5, -1.9);
      rightHeadlight.userData = { isHeadlightGlow: true };
      this.mesh.add(rightHeadlight);

      // Create actual light sources
      const leftLight = new THREE.SpotLight(0xffffcc, 2, 50, Math.PI / 6, 0.5, 2);
      leftLight.position.set(-0.6, 0.5, -1.9);
      leftLight.target.position.set(-0.6, 0, -10);
      this.mesh.add(leftLight);
      this.mesh.add(leftLight.target);
      leftLight.visible = this.headlightsOn;
      this.headlights.push(leftLight);

      const rightLight = new THREE.SpotLight(0xffffcc, 2, 50, Math.PI / 6, 0.5, 2);
      rightLight.position.set(0.6, 0.5, -1.9);
      rightLight.target.position.set(0.6, 0, -10);
      this.mesh.add(rightLight);
      this.mesh.add(rightLight.target);
      rightLight.visible = this.headlightsOn;
      this.headlights.push(rightLight);

      // Add light cones for visual effect
      const coneGeometry = new THREE.ConeGeometry(2, 10, 32);
      const coneMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffcc,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide
      });

      const leftCone = new THREE.Mesh(coneGeometry, coneMaterial);
      leftCone.position.set(-0.6, 0.5, -6.9);
      leftCone.rotation.x = Math.PI / 2;
      leftCone.visible = this.headlightsOn;
      leftCone.userData = { isLightCone: true };
      this.mesh.add(leftCone);

      const rightCone = new THREE.Mesh(coneGeometry, coneMaterial);
      rightCone.position.set(0.6, 0.5, -6.9);
      rightCone.rotation.x = Math.PI / 2;
      rightCone.visible = this.headlightsOn;
      rightCone.userData = { isLightCone: true };
      this.mesh.add(rightCone);

      // Add lens flares
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load('/textures/particles/flame.png', 
        texture => {
          if (texture) {
            // Left flare
            const leftFlare = new Lensflare();
            leftFlare.addElement(new LensflareElement(texture, 200, 0));
            leftFlare.addElement(new LensflareElement(texture, 100, 0.6));
            leftFlare.addElement(new LensflareElement(texture, 70, 0.7));
            leftFlare.position.set(-0.6, 0.5, -1.9);
            leftFlare.visible = this.headlightsOn;
            leftFlare.userData = { isHeadlightLensflare: true };
            this.mesh.add(leftFlare);
            
            // Right flare
            const rightFlare = new Lensflare();
            rightFlare.addElement(new LensflareElement(texture, 200, 0));
            rightFlare.addElement(new LensflareElement(texture, 100, 0.6));
            rightFlare.addElement(new LensflareElement(texture, 70, 0.7));
            rightFlare.position.set(0.6, 0.5, -1.9);
            rightFlare.visible = this.headlightsOn;
            rightFlare.userData = { isHeadlightLensflare: true };
            this.mesh.add(rightFlare);
          }
        },
        undefined,
        error => console.warn('Failed to load flare texture:', error)
      );
    } catch (error) {
      console.error('Error creating headlights:', error);
    }
  }

  toggleHeadlights() {
    this.headlightsOn = !this.headlightsOn;
    
    // Toggle visibility of headlight beams and intensity of lights
    this.headlights.forEach(light => {
      light.visible = this.headlightsOn;
      light.intensity = this.headlightsOn ? 2 : 0;
    });
    
    // Find headlight lens flares and toggle them
    this.mesh.traverse(child => {
      if (child.userData && child.userData.isHeadlightLensflare) {
        child.visible = this.headlightsOn;
      }
      
      // Also toggle the headlight glow materials
      if (child instanceof THREE.Mesh && child.userData.isHeadlightGlow) {
        const material = child.material as THREE.MeshBasicMaterial;
        material.opacity = this.headlightsOn ? 1 : 0.2;
      }
    });
    
    // Toggle taillights intensity
    this.taillights.forEach(light => {
      light.intensity = this.headlightsOn ? 2 : 0.5;
    });
  }

  addTaillights() {
    try {
      // Create taillight geometry
      const taillightGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      const taillightMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8
      });

      // Left taillight
      const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
      leftTaillight.position.set(-0.6, 0.5, 1.9);
      this.mesh.add(leftTaillight);

      // Right taillight
      const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
      rightTaillight.position.set(0.6, 0.5, 1.9);
      this.mesh.add(rightTaillight);

      // Add actual light sources
      const leftLight = new THREE.PointLight(0xff0000, 0.5, 5);
      leftLight.position.set(-0.6, 0.5, 1.9);
      this.mesh.add(leftLight);
      this.taillights.push(leftLight);

      const rightLight = new THREE.PointLight(0xff0000, 0.5, 5);
      rightLight.position.set(0.6, 0.5, 1.9);
      this.mesh.add(rightLight);
      this.taillights.push(rightLight);

      // Add brake light in the middle
      const brakeLight = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.1, 0.1),
        new THREE.MeshStandardMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 0.5
        })
      );
      brakeLight.position.set(0, 0.8, 1.9);
      this.mesh.add(brakeLight);

      // Add brake light illumination
      const brakeIllumination = new THREE.PointLight(0xff0000, 0.5, 5);
      brakeIllumination.position.set(0, 0.8, 1.9);
      this.mesh.add(brakeIllumination);
      this.taillights.push(brakeIllumination);
    } catch (error) {
      console.error('Error creating taillights:', error);
    }
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

  addSpoiler() {
    // Create spoiler
    const spoilerBaseGeometry = new THREE.BoxGeometry(1.8, 0.1, 0.3);
    const spoilerMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.5,
      metalness: 0.5
    });
    const spoilerBase = new THREE.Mesh(spoilerBaseGeometry, spoilerMaterial);
    spoilerBase.position.set(0, 1.1, -1.8);
    this.mesh.add(spoilerBase);

    // Spoiler stands
    const standGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
    const leftStand = new THREE.Mesh(standGeometry, spoilerMaterial);
    leftStand.position.set(-0.8, 1.2, -1.8);
    this.mesh.add(leftStand);

    const rightStand = new THREE.Mesh(standGeometry, spoilerMaterial);
    rightStand.position.set(0.8, 1.2, -1.8);
    this.mesh.add(rightStand);

    // Spoiler wing
    const wingGeometry = new THREE.BoxGeometry(2, 0.1, 0.4);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: this.carColor,
      roughness: 0.2,
      metalness: 0.8
    });
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.position.set(0, 1.4, -1.8);
    wing.userData.isCarBody = true;
    this.mesh.add(wing);
  }

  createNitroEffect() {
    try {
      // Create particle system for nitro effect
      const particleCount = 500;
      const particleGeometry = new THREE.BufferGeometry();
      
      // Create initial positions for particles
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      
      const color1 = new THREE.Color(0x00ffff); // Cyan
      const color2 = new THREE.Color(0x0000ff); // Blue
      
      for (let i = 0; i < particleCount; i++) {
        // Random position within a cone shape behind the car
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 0.5; // x
        positions[i3 + 1] = (Math.random() - 0.5) * 0.5; // y
        positions[i3 + 2] = (Math.random() * 2) - 3; // z (behind the car)
        
        // Color gradient from cyan to blue
        const ratio = Math.random();
        const mixedColor = color1.clone().lerp(color2, ratio);
        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
        
        // Random sizes
        sizes[i] = Math.random() * 0.1 + 0.05;
      }
      
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      // Load texture for particles
      const textureLoader = new THREE.TextureLoader();
      let particleTexture: THREE.Texture;
      
      try {
        particleTexture = textureLoader.load('/textures/particles/flame.png');
      } catch (e) {
        console.warn('Failed to load particle texture, using fallback');
        // Create a fallback texture
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
          gradient.addColorStop(0, 'rgba(255,255,255,1)');
          gradient.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 64, 64);
        }
        particleTexture = new THREE.CanvasTexture(canvas);
      }
      
      // Create shader material for particles
      const particleMaterial = new THREE.PointsMaterial({
        size: 0.1,
        map: particleTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        vertexColors: true
      });
      
      // Create particle system
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      particles.position.set(0, 0.5, -2); // Position at the exhaust
      particles.visible = false; // Initially hidden
      this.mesh.add(particles);
      this.nitroParticles.push(particles);
      
    } catch (error) {
      console.error('Error creating nitro effect:', error);
    }
  }

  updateNitroEffect(controls: GameControls) {
    const currentTime = performance.now();
    
    // Check if nitro is activated
    if (controls.nitro && this.nitroCharge > 0) {
      this.nitroActive = true;
      
      // Decrease nitro charge
      this.nitroCharge = Math.max(0, this.nitroCharge - 1);
      
      // Show nitro particles
      this.nitroParticles.forEach(particles => {
        particles.visible = true;
        this.updateParticlePositions(particles);
      });
      
      // Play nitro sound if available
      if (this.nitroSound && this.nitroSound.paused) {
        try {
          this.nitroSound.currentTime = 0;
          this.nitroSound.play().catch(e => console.warn('Failed to play nitro sound:', e));
        } catch (e) {
          console.warn('Error playing nitro sound:', e);
        }
      }
    } else {
      this.nitroActive = false;
      
      // Hide nitro particles
      this.nitroParticles.forEach(particles => {
        particles.visible = false;
      });
      
      // Stop nitro sound if playing
      if (this.nitroSound && !this.nitroSound.paused) {
        try {
          this.nitroSound.pause();
        } catch (e) {
          console.warn('Error pausing nitro sound:', e);
        }
      }
      
      // Recharge nitro if not in use
      if (currentTime - this.lastNitroUpdateTime > 100) { // Recharge every 100ms
        this.nitroCharge = Math.min(this.nitroMax, this.nitroCharge + this.nitroRechargeRate);
        this.lastNitroUpdateTime = currentTime;
      }
    }
  }

  update(controls: GameControls, scene?: THREE.Scene) {
    try {
      // Update nitro effect
      this.updateNitroEffect(controls);
      
      // Handle acceleration
      if (controls.forward) {
        // Apply nitro boost if active
        if (this.nitroActive && this.nitroCharge > 0) {
          this.speed += this.acceleration * 1.5;
          this.maxSpeed = this.turboSpeed;
        } else {
          this.speed += this.acceleration;
          this.maxSpeed = 0.25;
        }
        
        // Play engine rev sound when starting to move
        if (Math.abs(this.speed) < 0.05 && this.engineRevSound && this.engineRevSound.paused) {
          try {
            this.engineRevSound.currentTime = 0;
            const playPromise = this.engineRevSound.play();
            if (playPromise !== undefined) {
              playPromise.catch(e => console.warn('Failed to play rev sound:', e));
            }
          } catch (e) {
            console.warn('Error playing rev sound:', e);
          }
        }
      } else if (controls.backward) {
        this.speed -= this.acceleration;
      } else {
        // Apply deceleration when no input
        if (this.speed > 0) {
          this.speed = Math.max(0, this.speed - this.deceleration);
        } else if (this.speed < 0) {
          this.speed = Math.min(0, this.speed + this.deceleration);
        }
      }
      
      // Apply braking - increase brake light intensity when braking
      if (controls.brake) {
        this.speed *= 0.95;
        
        // Increase brake light intensity
        this.taillights.forEach(light => {
          light.intensity = 2.0; // Brighter when braking
        });
      } else {
        // Normal taillight intensity when not braking
        this.taillights.forEach(light => {
          light.intensity = this.headlightsOn ? 1.0 : 0.5;
        });
      }
      
      // Clamp speed to max speed
      this.speed = Math.max(-this.maxSpeed / 2, Math.min(this.maxSpeed, this.speed));
      
      // Handle turning
      if (this.speed !== 0) {
        const turnFactor = Math.abs(this.speed) / this.maxSpeed; // More effective turning at higher speeds
        
        if (controls.left) {
          this.mesh.rotation.y += this.rotationSpeed * turnFactor;
        }
        if (controls.right) {
          this.mesh.rotation.y -= this.rotationSpeed * turnFactor;
        }
      }
      
      // Update direction vector based on car's rotation
      this.direction.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
      
      // Move car in the direction it's facing
      this.mesh.position.add(this.direction.clone().multiplyScalar(this.speed));
      
      // Update engine sound pitch based on speed
      if (this.engineSound) {
        try {
          // Ensure the engine sound is playing
          if (this.engineSound.paused) {
            const playPromise = this.engineSound.play();
            if (playPromise !== undefined) {
              playPromise.catch(e => console.warn('Failed to play engine sound:', e));
            }
          }
          
          // Adjust playback rate based on speed
          const speedFactor = Math.abs(this.speed) / this.maxSpeed;
          this.engineSound.playbackRate = 0.8 + speedFactor * 0.7;
          
          // Adjust volume based on speed
          this.engineSound.volume = 0.2 + speedFactor * 0.3;
        } catch (e) {
          console.warn('Error updating engine sound:', e);
        }
      }
      
      // Handle missile firing
      if (controls.fire && this.missileCount > 0 && scene) {
        const currentTime = performance.now();
        if (currentTime - this.lastMissileTime > 1000) { // Cooldown of 1 second
          this.fireMissile(scene);
          this.missileCount--;
          this.lastMissileTime = currentTime;
        }
      }
      
      // Recharge missiles over time
      const currentTime = performance.now();
      if (this.missileCount < this.maxMissiles && currentTime - this.lastMissileTime > this.missileRechargeTime) {
        this.missileCount++;
        this.lastMissileTime = currentTime;
      }
      
      // Update missiles
      this.updateMissiles(scene);
      
      // Animate wheels rotation based on speed
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.isWheel) {
          child.rotation.x += this.speed * 0.5;
        }
      });
      
      // Update headlight targets to follow car direction
      this.headlights.forEach(light => {
        if (light instanceof THREE.SpotLight && light.target) {
          const targetDistance = 10;
          const targetPosition = this.mesh.position.clone().add(
            this.direction.clone().multiplyScalar(targetDistance)
          );
          light.target.position.copy(targetPosition);
        }
      });
      
    } catch (error) {
      console.error('Error in car update:', error);
    }
  }

  private updateParticlePositions(particles: THREE.Points) {
    if (!particles.geometry.attributes.position) return;
    
    const positions = particles.geometry.attributes.position.array as Float32Array;
    const count = positions.length / 3;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Move particles backward (in local z)
      positions[i3 + 2] -= 0.1 * (Math.random() + 0.5);
      
      // If particle goes too far, reset it
      if (positions[i3 + 2] < -5) {
        positions[i3] = (Math.random() - 0.5) * 0.5;
        positions[i3 + 1] = (Math.random() - 0.5) * 0.5;
        positions[i3 + 2] = -2;
      }
    }
    
    particles.geometry.attributes.position.needsUpdate = true;
  }

  updateMissiles(scene?: THREE.Scene) {
    if (!scene) return;
    
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const missile = this.missiles[i];
      
      // Move missile forward
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(missile.quaternion);
      missile.position.add(direction.multiplyScalar(0.8));
      
      // Add trail effect
      this.addMissileTrail(missile, scene);
      
      // Remove missile if it goes too far
      if (missile.position.distanceTo(this.mesh.position) > 100) {
        scene.remove(missile);
        this.missiles.splice(i, 1);
      }
    }
  }

  addMissileTrail(missile: THREE.Mesh, scene: THREE.Scene) {
    // Create a small particle for the trail
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.7
    });
    
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(missile.position);
    scene.add(particle);
    
    // Fade out and remove after a short time
    setTimeout(() => {
      scene.remove(particle);
    }, 500);
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
}