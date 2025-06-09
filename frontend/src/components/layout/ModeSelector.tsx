import React from 'react';
import { Search, Lightbulb, BarChart3 } from 'lucide-react';
import { useAilockStore } from '../../store/ailockStore';
import { AilockMode } from '../../types';

const modes = [
  {
    id: 'researcher' as AilockMode,
    label: 'Researcher',
    icon: Search,
    description: 'Explore and discover',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'creator' as AilockMode,
    label: 'Creator',
    icon: Lightbulb,
    description: 'Build and innovate',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'analyst' as AilockMode,
    label: 'Analyst',
    icon: BarChart3,
    description: 'Analyze and optimize',
    color: 'from-green-500 to-emerald-500'
  }
];

export const ModeSelector: React.FC = () => {
  const { currentMode, setMode } = useAilockStore();

  return (
    <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;
        
        return (
          <button
            key={mode.id}
            onClick={() => setMode(mode.id)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
              ${isActive 
                ? `bg-gradient-to-r ${mode.color} text-white shadow-lg transform scale-105` 
                : 'text-gray-600 hover:bg-white hover:shadow-md'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
};