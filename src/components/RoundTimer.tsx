import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContextBackend';

const RoundTimer: React.FC = () => {
  const { roundTimer, lastTimerUpdate, gameState } = useGame();
  const [localTimer, setLocalTimer] = useState(roundTimer);
  const [lastSyncTime, setLastSyncTime] = useState(lastTimerUpdate);

  // Sync with context timer when it changes (e.g., from storage events)
  useEffect(() => {
    if (lastTimerUpdate !== lastSyncTime) {
      setLocalTimer(roundTimer);
      setLastSyncTime(lastTimerUpdate);
    }
  }, [roundTimer, lastTimerUpdate, lastSyncTime]);

  useEffect(() => {
    if (gameState === 'playing' && localTimer > 0) {
      const interval = setInterval(() => {
        setLocalTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameState, localTimer]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    if (localTimer > 120) return 'text-green-400';
    if (localTimer > 60) return 'text-yellow-400';
    if (localTimer > 30) return 'text-orange-400';
    return 'text-red-400 animate-pulse';
  };

  const getTimerSize = (): string => {
    if (localTimer > 120) return 'text-5xl';
    if (localTimer > 60) return 'text-6xl';
    if (localTimer > 30) return 'text-7xl';
    return 'text-8xl';
  };

  return (
    <div className="text-center">
      <div className={`timer ${getTimerColor()} ${getTimerSize()} font-mono mb-2`}>
        {formatTime(localTimer)}
      </div>
      
      <div className="text-white text-sm mb-4">
        {localTimer > 120 && '⚡ ¡Mucho tiempo!'}
        {localTimer <= 120 && localTimer > 60 && '⏰ ¡Hora de elegir!'}
        {localTimer <= 60 && localTimer > 30 && '🔥 ¡Date prisa!'}
        {localTimer <= 30 && localTimer > 0 && '🚨 ¡Momentos finales!'}
        {localTimer === 0 && '⏰ ¡Se acabó el tiempo!'}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
        <div
          className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 h-2 rounded-full transition-all duration-1000"
          style={{ width: `${(localTimer / 180) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default RoundTimer; 