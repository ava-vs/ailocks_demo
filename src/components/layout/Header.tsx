import React from 'react';
import { Brain, MapPin, Wifi, WifiOff } from 'lucide-react';
import { useAilockStore } from '../../store/ailockStore';
import { ModeSelector } from './ModeSelector';

export const Header: React.FC = () => {
  const { isConnected, location } = useAilockStore();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-primary rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Ailocks
              </h1>
              <p className="text-xs text-gray-500">Ai2Ai Network</p>
            </div>
          </div>
          
          <ModeSelector />
        </div>

        <div className="flex items-center space-x-4">
          {location && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{location.city || 'Unknown Location'}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};