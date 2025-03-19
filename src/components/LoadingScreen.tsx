import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  progress: number;
  status: string;
  errors: string[];
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, status, errors }) => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="max-w-md w-full p-8">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Casual Racing</h1>
          <p className="text-gray-400">Loading your racing experience...</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-800 rounded-full h-4 mb-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 text-gray-300 mb-4">
          <Loader2 className="animate-spin" size={20} />
          <span>{status}</span>
        </div>

        {/* Errors (if any) */}
        {errors.length > 0 && (
          <div className="mt-4">
            {errors.map((error, index) => (
              <p key={index} className="text-red-500 text-sm">{error}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;