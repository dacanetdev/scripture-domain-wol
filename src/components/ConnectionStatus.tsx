import React, { useEffect, useState } from 'react';
import { getConnectionStatus, onConnectionStatusChange, getConnectionInfo } from '../services/api';
import { useGame } from '../context/GameContextBackend';

const ConnectionStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState(getConnectionStatus());
  const [connectionInfo, setConnectionInfo] = useState(getConnectionInfo());
  const { gameId, gameCode, isInitializing } = useGame();

  useEffect(() => {
    const unsubscribe = onConnectionStatusChange((newStatus) => {
      setStatus(newStatus);
      setConnectionInfo(getConnectionInfo());
    });

    return unsubscribe;
  }, []);

  // Update connection info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionInfo(getConnectionInfo());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'reconnecting':
        return 'bg-orange-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'reconnecting':
        return 'Reconectando...';
      case 'error':
        return 'Error de Conexión';
      default:
        return 'Desconectado';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
          <span className="text-sm font-semibold text-gray-700">
            {getStatusText()}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <div>Transport: {connectionInfo.transport}</div>
          <div>Socket ID: {connectionInfo.id?.slice(0, 8) || 'N/A'}</div>
          {gameId && <div>Game: {gameCode || gameId.slice(-6)}</div>}
          {isInitializing && <div className="text-orange-600">🔄 Sincronizando...</div>}
        </div>
        
        {status === 'error' && (
          <div className="mt-2 text-xs text-red-600">
            ⚠️ Problemas de sincronización detectados
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatusIndicator; 