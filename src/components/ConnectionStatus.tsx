import React, { useEffect, useState } from 'react';
import { onConnectionStatusChange, getConnectionStatus, forceReconnect, testConnection, getConnectionInfo, ConnectionStatus } from '../services/api';

const ConnectionStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(getConnectionStatus());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [connectionInfo, setConnectionInfo] = useState(getConnectionInfo());

  useEffect(() => {
    const unsubscribe = onConnectionStatusChange((newStatus) => {
      setStatus(newStatus);
      setConnectionInfo(getConnectionInfo());
      addLog(`Status changed to: ${newStatus}`);
    });

    // Update connection info periodically
    const interval = setInterval(() => {
      setConnectionInfo(getConnectionInfo());
    }, 2000);

    // Capture console logs for connection debugging
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog.apply(console, args);
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('🔌') || args[0].includes('✅') || args[0].includes('❌') || 
           args[0].includes('🔄') || args[0].includes('🌐') || args[0].includes('⏰'))) {
        addLog(args.join(' '));
      }
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('🔌') || args[0].includes('✅') || args[0].includes('❌') || 
           args[0].includes('🔄') || args[0].includes('🌐') || args[0].includes('⏰'))) {
        addLog(`ERROR: ${args.join(' ')}`);
      }
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('🔌') || args[0].includes('✅') || args[0].includes('❌') || 
           args[0].includes('🔄') || args[0].includes('🌐') || args[0].includes('⏰'))) {
        addLog(`WARN: ${args.join(' ')}`);
      }
    };

    return () => {
      unsubscribe();
      clearInterval(interval);
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConnectionLogs(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult('');
    addLog('🧪 Starting HTTP connection test...');
    
    try {
      const success = await testConnection();
      const result = success ? '✅ HTTP connection successful' : '❌ HTTP connection failed';
      setTestResult(result);
      addLog(result);
    } catch (error) {
      const errorMsg = `❌ Test failed: ${error}`;
      setTestResult(errorMsg);
      addLog(errorMsg);
    } finally {
      setIsTesting(false);
    }
  };

  const handleForceReconnect = () => {
    addLog('🔄 Manual reconnect triggered');
    forceReconnect();
  };

  const clearLogs = () => {
    setConnectionLogs([]);
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
    <div className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor} shadow-lg transition-all duration-300 max-w-md`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>
        <div className="flex space-x-1">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
          >
            {showDetails ? '📋 Ocultar' : '📋 Detalles'}
          </button>
          {status === 'error' && (
            <button
              onClick={handleForceReconnect}
              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
            >
              🔄
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-2">
        <button
          onClick={handleTestConnection}
          disabled={isTesting}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isTesting ? '🧪 Probando...' : '🧪 Probar HTTP'}
        </button>
        {testResult && (
          <div className="mt-1 text-xs text-gray-600">
            {testResult}
          </div>
        )}
      </div>
      
      {showDetails && (
        <div className="mt-3 border-t pt-2">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-gray-700">📊 Logs de Conexión</h4>
            <button
              onClick={clearLogs}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              🗑️ Limpiar
            </button>
          </div>
          
          <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-xs font-mono">
            {connectionLogs.length === 0 ? (
              <p className="text-gray-500">No hay logs aún...</p>
            ) : (
              connectionLogs.map((log, index) => (
                <div key={index} className="text-gray-700 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
          
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <p><strong>🔌 Socket:</strong> {connectionInfo.connected ? '✅ Conectado' : '❌ Desconectado'}</p>
            <p><strong>🚀 Transporte:</strong> {connectionInfo.transport}</p>
            <p><strong>🆔 Socket ID:</strong> {connectionInfo.id || 'N/A'}</p>
            <p><strong>📡 Ready State:</strong> {connectionInfo.readyState}</p>
            <p><strong>🌐 API URL:</strong> {connectionInfo.url}</p>
            <p><strong>📱 Dispositivo:</strong> {navigator.userAgent.includes('Mobile') ? 'Móvil' : 'Escritorio'}</p>
            <p><strong>🌍 Navegador:</strong> {navigator.userAgent.split(' ').pop()?.split('/')[0] || 'Desconocido'}</p>
          </div>
        </div>
      )}
      
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
    </div>
  );
};

export default ConnectionStatusIndicator; 