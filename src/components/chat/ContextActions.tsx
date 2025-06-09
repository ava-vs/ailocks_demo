import React from 'react';
import * as LucideIcons from 'lucide-react';
import { useAilockStore } from '../../store/ailockStore';

export const ContextActions: React.FC = () => {
  const { contextActions, currentMode } = useAilockStore();

  if (contextActions.length === 0) return null;

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'researcher': return 'from-blue-500 to-cyan-500';
      case 'creator': return 'from-purple-500 to-pink-500';
      case 'analyst': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="px-6 py-4 border-t border-gray-200/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">
          Context Actions - {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} Mode
        </h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {contextActions.map((action) => {
          const IconComponent = (LucideIcons as any)[action.icon] || LucideIcons.Circle;
          
          return (
            <button
              key={action.id}
              onClick={action.action}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium
                bg-gradient-to-r ${getModeColor(currentMode)} text-white
                hover:shadow-lg transform hover:scale-105 transition-all duration-200
              `}
            >
              <IconComponent className="w-4 h-4" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};