import React, { useState } from 'react';
import RacingGame from './components/RacingGame';
import { Play, Settings, Camera, Trophy } from 'lucide-react';

function App() {
  const [gameStarted, setGameStarted] = useState(false);

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center">
        <div className="bg-white bg-opacity-10 backdrop-blur-md p-8 rounded-lg shadow-2xl text-center max-w-md w-full">
          <h1 className="text-4xl font-bold text-white mb-6">Asphalt Racing</h1>
          <p className="text-gray-200 mb-8">
            Experience high-speed racing action on a professional asphalt track with realistic physics and stunning visuals.
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => setGameStarted(true)}
              className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
            >
              <Play className="mr-2" size={20} />
              Start Racing
            </button>
            <div className="flex justify-between gap-4">
              <button className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center">
                <Settings className="mr-2" size={16} />
                Options
              </button>
              <button className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center">
                <Camera className="mr-2" size={16} />
                Camera Views
              </button>
              <button className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center">
                <Trophy className="mr-2" size={16} />
                Leaderboard
              </button>
            </div>
          </div>
          <div className="mt-8 text-gray-300 text-sm">
            <h3 className="font-bold mb-2">Controls:</h3>
            <ul className="text-left space-y-1">
              <li>WASD or Arrow Keys: Drive</li>
              <li>Space: Brake</li>
              <li>C: Change Camera View</li>
              <li>E: Nitro Boost</li>
              <li>F: Fire Missile</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return <RacingGame />;
}

export default App;