import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// HTTP API client
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Socket.IO client
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      timeout: 20000,
      forceNew: true,
    });
    
    socket.on('connect', () => {
      console.log('Connected to server:', socket!.id);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
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
    
    updateTimer: (data: { gameId: string; timer: number }) => {
      getSocket().emit('updateTimer', data);
    },
    
    onGameState: (callback: (gameState: any) => void) => {
      getSocket().on('gameState', callback);
    },
    
    onPlayerJoined: (callback: (data: { playerName: string; teamId: string; emoji: string }) => void) => {
      getSocket().on('playerJoined', callback);
    },
    
    off: (event: string) => {
      getSocket().off(event);
    }
  }
}; 