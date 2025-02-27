import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Car } from '../game/Car';
import { Track } from '../game/Track';
import { GameControls } from '../game/GameControls';
import { Camera, Maximize2, Minimize2, Gauge, Trophy, Zap, Target } from 'lucide-react';

// Define camera types
type CameraView = 'follow' | 'cockpit' | 'overhead' | 'cinematic';

const RacingGame: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carRef = useRef<Car | null>(null);
  const trackRef = useRef<Track | null>(null);
  const controlsRef = useRef<GameControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [cameraView, setCameraView] = useState<CameraView>('follow');
  const [showControls, setShowControls] = useState(true);
  const cinematicAngleRef = useRef(0);
  const [speed, setSpeed] = useState(0);
  const [lapTime, setLapTime] = useState(0);
  const [bestLapTime, setBestLapTime] = useState<number | null>(null);
  const lapStartTimeRef = useRef<number | null>(null);
  const lastPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const crossedStartLineRef = useRef(false);
  const [nitroLevel, setNitroLevel] = useState(100);
  const [missileCount, setMissileCount] = useState(3);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue background
    scene.fog = new THREE.Fog(0x87ceeb, 50, 150); // Add fog for depth
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Add some point lights for better lighting
    const redLight = new THREE.PointLight(0xff0000, 1, 50);
    redLight.position.set(40, 10, 40);
    scene.add(redLight);

    const blueLight = new THREE.PointLight(0x0000ff, 1, 50);
    blueLight.position.set(-40, 10, -40);
    scene.add(blueLight);

    // Initialize track
    const track = new Track();
    scene.add(track.mesh);
    trackRef.current = track;

    // Initialize car
    const car = new Car();
    scene.add(car.mesh);
    carRef.current = car;
    lastPositionRef.current = car.mesh.position.clone();

    // Initialize controls
    const controls = new GameControls();
    controlsRef.current = controls;

    // Add camera switch key listener
    const handleCameraSwitch = (event: KeyboardEvent) => {
      if (event.key === 'c' || event.key === 'C') {
        setCameraView(prev => {
          const views: CameraView[] = ['follow', 'cockpit', 'overhead', 'cinematic'];
          const currentIndex = views.indexOf(prev);
          const nextIndex = (currentIndex + 1) % views.length;
          return views[nextIndex];
        });
      }
    };

    document.addEventListener('keydown', handleCameraSwitch);

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = (time: number) => {
      if (!carRef.current || !controlsRef.current || !cameraRef.current || !rendererRef.current || !sceneRef.current) return;

      // Update car position based on controls
      carRef.current.update(controlsRef.current, sceneRef.current);
      
      // Update speed display
      setSpeed(Math.abs(carRef.current.speed) * 500); // Scale for display

      // Update camera based on selected view
      updateCameraPosition();
      
      // Check for lap completion
      checkLapCompletion(time);
      
      // Update lap timer
      if (lapStartTimeRef.current !== null) {
        setLapTime(time - lapStartTimeRef.current);
      }

      // Update UI states
      setNitroLevel(carRef.current.nitroCharge);
      setMissileCount(carRef.current.missileCount);

      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const updateCameraPosition = () => {
      if (!carRef.current || !cameraRef.current) return;
      
      const carPosition = carRef.current.mesh.position.clone();
      const carDirection = carRef.current.direction.clone();
      const carRotation = carRef.current.mesh.rotation.y;
      
      switch (cameraView) {
        case 'follow':
          // Third-person follow camera
          const followOffset = new THREE.Vector3(0, 3, 8);
          followOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), carRotation);
          cameraRef.current.position.copy(carPosition).add(followOffset);
          cameraRef.current.lookAt(carPosition);
          break;
          
        case 'cockpit':
          // First-person cockpit view
          const cockpitOffset = new THREE.Vector3(0, 1.2, -0.5);
          cockpitOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), carRotation);
          cameraRef.current.position.copy(carPosition).add(cockpitOffset);
          
          // Look in the direction the car is facing
          const lookTarget = carPosition.clone().add(
            carDirection.clone().multiplyScalar(10)
          );
          cameraRef.current.lookAt(lookTarget);
          break;
          
        case 'overhead':
          // Top-down view
          cameraRef.current.position.set(carPosition.x, 20, carPosition.z);
          cameraRef.current.lookAt(carPosition);
          break;
          
        case 'cinematic':
          // Cinematic rotating camera
          cinematicAngleRef.current += 0.005;
          const radius = 15;
          const height = 5;
          const x = carPosition.x + radius * Math.cos(cinematicAngleRef.current);
          const z = carPosition.z + radius * Math.sin(cinematicAngleRef.current);
          cameraRef.current.position.set(x, height, z);
          cameraRef.current.lookAt(carPosition);
          break;
      }
    };
    
    const checkLapCompletion = (time: number) => {
      if (!carRef.current) return;
      
      const carPosition = carRef.current.mesh.position;
      const lastPosition = lastPositionRef.current;
      
      // Check if car crossed the start/finish line
      // The line is at z = -40 (approximately)
      if (lastPosition.z < -39 && carPosition.z >= -39) {
        // Car crossed the line going forward
        if (!crossedStartLineRef.current) {
          crossedStartLineRef.current = true;
          
          // If this is the first crossing, start the timer
          if (lapStartTimeRef.current === null) {
            lapStartTimeRef.current = time;
          } else {
            // Complete a lap
            const lapTimeValue = time - lapStartTimeRef.current;
            
            // Update best lap time
            if (bestLapTime === null || lapTimeValue < bestLapTime) {
              setBestLapTime(lapTimeValue);
            }
            
            // Reset lap timer
            lapStartTimeRef.current = time;
          }
        }
      } else if (lastPosition.z > -41 && carPosition.z <= -41) {
        // Car crossed the line going backward
        crossedStartLineRef.current = false;
      }
      
      // Update last position
      lastPositionRef.current = carPosition.clone();
    };

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleCameraSwitch);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [cameraView]);

  const handleCameraChange = (view: CameraView) => {
    setCameraView(view);
  };
  
  // Format time in mm:ss.ms format
  const formatTime = (timeMs: number) => {
    const totalSeconds = timeMs / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  return (
    <div className="game-container" ref={mountRef} style={{ width: '100%', height: '100vh' }}>
      {showControls && (
        <div className="game-ui absolute top-4 left-4 bg-black bg-opacity-70 text-white p-4 rounded-lg shadow-lg backdrop-blur-sm">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">Asphalt Racing</h2>
            <button 
              onClick={() => setShowControls(false)} 
              className="text-white hover:text-gray-300"
            >
              <Minimize2 size={18} />
            </button>
          </div>
          <p className="mt-2">Use WASD or arrow keys to drive</p>
          <p>Space to brake</p>
          <p>Press C to cycle camera views</p>
          
          <div className="mt-4">
            <p className="font-bold mb-2">Camera Views:</p>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleCameraChange('follow')}
                className={`px-2 py-1 rounded text-sm flex items-center justify-center ${cameraView === 'follow' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <Camera size={14} className="mr-1" /> Follow
              </button>
              <button 
                onClick={() => handleCameraChange('cockpit')}
                className={`px-2 py-1 rounded text-sm flex items-center justify-center ${cameraView === 'cockpit' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <Camera size={14} className="mr-1" /> Cockpit
              </button>
              <button 
                onClick={() => handleCameraChange('overhead')}
                className={`px-2 py-1 rounded text-sm flex items-center justify-center ${cameraView === 'overhead' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <Camera size={14} className="mr-1" /> Overhead
              </button>
              <button 
                onClick={() => handleCameraChange('cinematic')}
                className={`px-2 py-1 rounded text-sm flex items-center justify-center ${cameraView === 'cinematic' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <Camera size={14} className="mr-1" /> Cinematic
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!showControls && (
        <button 
          onClick={() => setShowControls(true)}
          className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded hover:bg-opacity-80 shadow-lg backdrop-blur-sm"
        >
          <Maximize2 size={18} />
        </button>
      )}
      
      {/* Speedometer */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm flex items-center">
        <Gauge size={20} className="mr-2" />
        <p className="text-xl font-bold">{Math.round(speed)} km/h</p>
      </div>
      
      {/* Lap timer */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm">
        <div className="flex items-center mb-1">
          <p className="text-sm mr-2">Current Lap:</p>
          <p className="text-lg font-mono">{formatTime(lapTime)}</p>
        </div>
        {bestLapTime !== null && (
          <div className="flex items-center text-yellow-400">
            <Trophy size={16} className="mr-2" />
            <p className="text-sm mr-2">Best Lap:</p>
            <p className="text-lg font-mono">{formatTime(bestLapTime)}</p>
          </div>
        )}
      </div>
      
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded shadow-lg backdrop-blur-sm">
        <p className="text-sm">Camera: {cameraView.charAt(0).toUpperCase() + cameraView.slice(1)}</p>
      </div>

      {/* Add Nitro Gauge */}
      <div className="absolute bottom-20 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm">
        <div className="flex items-center mb-1">
          <Zap className="mr-2" size={20} color={nitroLevel > 0 ? "#00ff00" : "#ff0000"} />
          <div className="w-32 h-2 bg-gray-700 rounded">
            <div 
              className="h-full bg-blue-500 rounded transition-all duration-200"
              style={{ width: `${nitroLevel}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-center mt-1">NITRO (E)</p>
      </div>

      {/* Add Missile Counter */}
      <div className="absolute bottom-20 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm">
        <div className="flex items-center">
          <Target className="mr-2" size={20} color={missileCount > 0 ? "#ff0000" : "#666666"} />
          <span className="text-xl font-bold">{missileCount}</span>
        </div>
        <p className="text-xs text-center mt-1">MISSILES (F)</p>
      </div>
    </div>
  );
};

export default RacingGame;