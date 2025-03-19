import React, { useState, useEffect } from 'react';
import RacingGame from './components/RacingGame';
import LoadingScreen from './components/LoadingScreen';
import { AssetManager } from './game/AssetManager';

// Create a singleton instance of AssetManager
const assetManager = new AssetManager();

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [loadingErrors, setLoadingErrors] = useState<string[]>([]);

  useEffect(() => {
    const preloadAssets = async () => {
      try {
        // Set total number of assets to load
        const totalAssets = 15; // Update this number based on actual assets
        assetManager.setTotalAssets(totalAssets);
        setLoadingStatus('Loading textures...');

        // Preload textures
        const textureUrls = [
          '/textures/track/Asphalt_004_COLOR.jpg',
          '/textures/track/Asphalt_004_NRM.jpg',
          '/textures/track/Asphalt_004_ROUGH.jpg',
          '/textures/ground/Substance_Graph_BaseColor.jpg',
          '/textures/ground/Substance_Graph_Normal.jpg',
          '/textures/particles/flame.png'
        ];

        for (const url of textureUrls) {
          await assetManager.loadTexture(url);
          setLoadingProgress(assetManager.getProgress());
        }

        setLoadingStatus('Loading audio...');

        // Preload audio
        const audioUrls = [
          '/audio/engine-loop.mp3',
          '/audio/engine-start.mp3',
          '/audio/turbo.mp3',
          '/audio/engine-rev.mp3',
          '/audio/nitro.mp3',
          '/audio/missile.mp3'
        ];

        for (const url of audioUrls) {
          await assetManager.loadAudio(url);
          setLoadingProgress(assetManager.getProgress());
        }

        // Check for any errors
        const errors = assetManager.getErrors();
        if (errors.length > 0) {
          setLoadingErrors(errors);
        }

        setLoadingStatus('Ready!');
        setTimeout(() => setIsLoading(false), 500); // Short delay for smooth transition
      } catch (error) {
        console.error('Error loading assets:', error);
        setLoadingErrors(prev => [...prev, 'Failed to load some game assets']);
      }
    };

    preloadAssets();
  }, []);

  if (isLoading) {
    return (
      <LoadingScreen
        progress={loadingProgress}
        status={loadingStatus}
        errors={loadingErrors}
      />
    );
  }

  return <RacingGame assetManager={assetManager} />;
}

export default App;