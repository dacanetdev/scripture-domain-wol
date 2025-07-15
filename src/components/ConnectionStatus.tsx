import React, { useEffect, useState } from 'react';
import { onConnectionStatusChange, getConnectionStatus, forceReconnect, testConnection, ConnectionStatus } from '../services/api';

const ConnectionStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(getConnectionStatus());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onConnectionStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult('');
    
    try {
      const success = await testConnection();
      setTestResult(success ? '✅ HTTP connection successful' : '❌ HTTP connection failed');
    } catch (error) {
      setTestResult('❌ Test failed');
    } finally {
      setIsTesting(false);
    }
  };

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
    <div className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor} shadow-lg transition-all duration-300 max-w-sm`}>
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
      
      <div className="mt-2">
        <button
          onClick={handleTestConnection}
          disabled={isTesting}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isTesting ? '🧪 Probando...' : '🧪 Probar Conexión'}
        </button>
        {testResult && (
          <div className="mt-1 text-xs text-gray-600">
            {testResult}
          </div>
        )}
      </div>
      
      {status === 'error' && (
        <div className="mt-2 text-xs text-gray-600">
          <p>💡 Consejos para móviles:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Verifica tu conexión a internet</li>
            <li>Intenta cambiar entre WiFi y datos móviles</li>
            <li>Recarga la página si el problema persiste</li>
            <li>Verifica que no estés en modo avión</li>
            <li>Prueba en Chrome o Firefox</li>
          </ul>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        <p>📱 {navigator.userAgent.includes('Mobile') ? 'Dispositivo móvil detectado' : 'Dispositivo de escritorio'}</p>
        <p>🌐 {`${window.location.protocol}//${window.location.host}`}</p>
      </div>
    </div>
  );
};

export default ConnectionStatusIndicator; 