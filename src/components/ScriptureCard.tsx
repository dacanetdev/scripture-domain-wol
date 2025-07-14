import React from 'react';
import { Scripture } from '../types';

interface ScriptureCardProps {
  scripture: Scripture;
  isSelected: boolean;
  onSelect: (scriptureId: number) => void;
}

const ScriptureCard: React.FC<ScriptureCardProps> = ({ scripture, isSelected, onSelect }) => {
  return (
    <div
      className={`scripture-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(scripture.id)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
            isSelected 
              ? 'bg-light-gold text-dark-purple' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            📖
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-gray-800 text-lg">
              {scripture.reference}
            </h4>
            {isSelected && (
              <div className="text-light-gold text-2xl">✓</div>
            )}
          </div>
          
          <p className="text-gray-700 text-sm mb-3 leading-relaxed">
            "{scripture.text}"
          </p>
          
          <div className="space-y-2">
            <div className="bg-blue-50 p-2 rounded-lg">
              <div className="text-xs font-semibold text-blue-700 mb-1">💡 Clave:</div>
              <div className="text-sm text-blue-800">{scripture.key}</div>
            </div>
            
            <div className="bg-green-50 p-2 rounded-lg">
              <div className="text-xs font-semibold text-green-700 mb-1">🎯 Aplicar:</div>
              <div className="text-sm text-green-800">{scripture.apply}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptureCard; 