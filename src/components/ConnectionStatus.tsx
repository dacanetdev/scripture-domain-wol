import React, { useEffect, useState } from 'react';
import { onConnectionStatusChange, getConnectionStatus, forceReconnect, ConnectionStatus } from '../services/api';

const ConnectionStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(getConnectionStatus());

  useEffect(() => {
    const unsubscribe = onConnectionStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  const getStatusConfig = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return {
          text: '✅ Conectado',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300'
        };
      case 'connecting':
        return {
          text: '🔄 Conectando...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-300'
        };
      case 'reconnecting':
        return {
          text: '🔄 Reconectando...',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-300'
        };
      case 'disconnected':
        return {
          text: '❌ Desconectado',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300'
        };
      case 'error':
        return {
          text: '💥 Error de conexión',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300'
        };
      default:
        return {
          text: '❓ Estado desconocido',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor} shadow-lg transition-all duration-300`}>
      <div className="flex items-center space-x-2">
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>
        {status === 'error' && (
          <button
            onClick={forceReconnect}
            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
          >
            Reintentar
          </button>
        )}
      </div>
      
      {/* Mobile-specific tips */}
      {status === 'error' && (
        <div className="mt-2 text-xs text-gray-600 max-w-xs">
          <p>💡 Consejos para móviles:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Verifica tu conexión a internet</li>
            <li>Intenta cambiar entre WiFi y datos móviles</li>
            <li>Recarga la página si el problema persiste</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator; 