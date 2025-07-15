import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// Better URL detection for mobile
const getApiUrl = () => {
  // Check if we're in production (Railway)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Check if we're on mobile and need to use the same host
  if (window.location.hostname !== 'localhost') {
    // Use the same host as the current page
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  // Default localhost for development
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiUrl();

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📱 User Agent:', navigator.userAgent);
console.log('🔗 Current Location:', window.location.href);

// HTTP API client
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // Even longer timeout for mobile
  headers: {
    'Content-Type': 'application/json',
  },
});

// Connection status management
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

let connectionStatus: ConnectionStatus = 'disconnected';
let connectionStatusCallbacks: ((status: ConnectionStatus) => void)[] = [];

export const onConnectionStatusChange = (callback: (status: ConnectionStatus) => void) => {
  connectionStatusCallbacks.push(callback);
  // Immediately call with current status
  callback(connectionStatus);
  
  // Return unsubscribe function
  return () => {
    connectionStatusCallbacks = connectionStatusCallbacks.filter(cb => cb !== callback);
  };
};

const updateConnectionStatus = (status: ConnectionStatus) => {
  connectionStatus = status;
  connectionStatusCallbacks.forEach(callback => callback(status));
};

// Socket.IO client
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    console.log('🔌 Creating new socket connection to:', API_BASE_URL);
    
    // Enhanced configuration for mobile compatibility
    socket = io(API_BASE_URL, {
      transports: ['polling', 'websocket'], // Try polling first on mobile
      autoConnect: true,
      timeout: 20000, // Even longer timeout for mobile networks
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 20, // More attempts for mobile
      reconnectionDelay: 3000, // Longer initial delay
      reconnectionDelayMax: 20000, // Longer max delay
      upgrade: true, // Allow transport upgrade
      rememberUpgrade: true, // Remember successful transport
      // Better error handling
      rejectUnauthorized: false, // Handle SSL issues
      // Mobile-specific settings
      withCredentials: false, // Disable credentials for mobile
    });
    
    socket.on('connect', () => {
      console.log('✅ Connected to server:', socket!.id);
      console.log('🌐 Transport:', socket!.io.engine.transport.name);
      updateConnectionStatus('connected');
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      updateConnectionStatus('error');
      
      // Log specific error types for debugging
      if (error.message.includes('timeout')) {
        console.warn('🕐 Connection timeout - common on mobile networks');
      } else if (error.message.includes('websocket')) {
        console.warn('🌐 WebSocket failed - falling back to polling');
      } else if (error.message.includes('CORS')) {
        console.warn('🚫 CORS error - check server configuration');
      } else if (error.message.includes('SSL')) {
        console.warn('🔒 SSL/TLS error - check certificate');
      }
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      updateConnectionStatus('disconnected');
      
      // Attempt to reconnect automatically
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        console.log('🔄 Server disconnected, attempting to reconnect...');
        updateConnectionStatus('reconnecting');
        socket!.connect();
      } else if (reason === 'io client disconnect') {
        // Client disconnected intentionally
        console.log('👤 Client disconnected intentionally');
      } else {
        // Network issues, let reconnection handle it
        console.log('🌐 Network disconnect, reconnection will handle it');
        updateConnectionStatus('reconnecting');
      }
    });
    
    socket.on('connect_timeout', () => {
      console.error('⏰ Connection timeout');
      updateConnectionStatus('error');
    });
    
    socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Reconnected after', attemptNumber, 'attempts');
      updateConnectionStatus('connected');
    });
    
    socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
      updateConnectionStatus('error');
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
      updateConnectionStatus('reconnecting');
    });
    
    socket.on('reconnect_failed', () => {
      console.error('💥 Reconnection failed after all attempts');
      updateConnectionStatus('error');
    });
    
    // Handle transport upgrades
    socket.on('upgrade', () => {
      console.log('⬆️ Transport upgraded to WebSocket');
    });
    
    socket.on('upgradeError', (error) => {
      console.warn('⚠️ Transport upgrade failed:', error);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    updateConnectionStatus('disconnected');
  }
};

export const isSocketConnected = (): boolean => {
  return socket ? socket.connected : false;
};

export const getConnectionStatus = (): ConnectionStatus => {
  return connectionStatus;
};

// Enhanced connection management
export const forceReconnect = () => {
  if (socket) {
    console.log('🔄 Force reconnecting...');
    updateConnectionStatus('reconnecting');
    socket.disconnect();
    socket.connect();
  }
};

// Get detailed connection info
export const getConnectionInfo = () => {
  if (!socket) {
    return {
      connected: false,
      transport: 'none',
      url: API_BASE_URL,
      id: null
    };
  }
  
  return {
    connected: socket.connected,
    transport: socket.io.engine.transport.name,
    url: API_BASE_URL,
    id: socket.id,
    readyState: socket.io.engine.readyState
  };
};

// Test connection function
export const testConnection = async () => {
  try {
    console.log('🧪 Testing connection to:', API_BASE_URL);
    const response = await apiClient.get('/api/health');
    console.log('✅ HTTP connection test successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ HTTP connection test failed:', error);
    return false;
  }
};

// API functions
export const api = {
  // Health check
  health: () => apiClient.get('/api/health'),
  
  // Game management
  getGame: (gameId: string) => apiClient.get(`/api/games/${gameId}`),
  getGames: () => apiClient.get('/api/games'),
  
  // Socket events
  socket: {
    joinGame: (data: { gameId: string; playerName: string; teamId: string; emoji?: string; isAdmin: boolean }) => {
      getSocket().emit('joinGame', data);
    },
    
    requestGameState: (gameId: string) => {
      getSocket().emit('requestGameState', { gameId });
    },
    
    startGame: (gameId: string) => {
      getSocket().emit('startGame', { gameId });
    },
    
    startRound: (gameId: string) => {
      getSocket().emit('startRound', { gameId });
    },
    
    submitResponse: (data: { gameId: string; teamId: string; playerId: string; scriptureId: number; response: string }) => {
      getSocket().emit('submitResponse', data);
    },
    
    setTeamRoundScore: (data: { gameId: string; teamId: string; roundNumber: number; speedScore: number; qualityScore: number }) => {
      getSocket().emit('setTeamRoundScore', data);
    },
    
    nextRound: (gameId: string) => {
      getSocket().emit('nextRound', { gameId });
    },
    
    endGame: (gameId: string) => {
      getSocket().emit('endGame', { gameId });
    },
    
    updatePlayerSelection: (data: { gameId: string; playerId: string; selectedScripture: number | null; teamResponse: string }) => {
      getSocket().emit('updatePlayerSelection', data);
    },
    
    onGameState: (callback: (gameState: any) => void) => {
      console.log('API: Registering gameState listener');
      getSocket().on('gameState', callback);
    },
    
    onPlayerJoined: (callback: (data: { playerName: string; teamId: string; emoji: string }) => void) => {
      console.log('API: Registering playerJoined listener');
      getSocket().on('playerJoined', callback);
    },
    
    off: (event: string) => {
      getSocket().off(event);
    }
  }
}; 