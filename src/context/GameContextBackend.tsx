import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { scenarios as scenarioList, scriptures } from '../data/scriptures';
import { GameContextType, GameState, Team, Response, RoundResult, GameResults, TeamRoundScore } from '../types';
import { api, getSocket, isSocketConnected } from '../services/api';
import { adminStorage } from '../utils/storage';
import { playerStorage } from '../utils/storage';

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameStateType {
  gameId: string | null;
  gameCode: string | null; // Add game code for easy lookup
  gameState: GameState;
  currentRound: number;
  teams: Team[];
  responses: Response[];
  scores: { [key: string]: number };
  currentScenario: any; // Change to object type for scenario
  roundTimer: number;
  lastTimerUpdate: number;
  isAdmin: boolean;
  selectedScripture: number | null;
  teamResponse: string;
  roundResults: RoundResult[];
  teamRoundScores: TeamRoundScore[];
  gameResults: GameResults | null;
  lastUpdate?: number;
  playerSelections: { [playerId: string]: { selectedScripture: number | null; teamResponse: string } };
  // Connection state
  isConnected: boolean;
  currentPlayer: { name: string; teamId: string } | null;
  // Loading state for initial sync
  isInitializing: boolean;
  scenarios: any[]; // Change to array of objects
}

const initialState: GameStateType = {
  gameId: null,
  gameCode: null,
  gameState: 'lobby',
  currentRound: 0,
  teams: [],
  responses: [],
  scores: {},
  currentScenario: null, // Now an object
  roundTimer: 180,
  lastTimerUpdate: Date.now(),
  isAdmin: false,
  selectedScripture: null,
  teamResponse: '',
  roundResults: [],
  teamRoundScores: [],
  gameResults: null,
  playerSelections: {},
  isConnected: false,
  currentPlayer: null,
  isInitializing: true,
  scenarios: scenarioList // Now an array of objects
};

type GameAction =
  | { type: 'SET_GAME_STATE'; payload: Partial<GameStateType> & { id?: string; state?: string } }
  | { type: 'SET_CONNECTION'; payload: boolean }
  | { type: 'SET_CURRENT_PLAYER'; payload: { name: string; teamId: string } | null }
  | { type: 'SET_ADMIN'; payload: boolean }
  | { type: 'SET_INITIALIZING'; payload: boolean }
  | { type: 'RESET_STATE' };

const gameReducer = (state: GameStateType, action: GameAction): GameStateType => {
  switch (action.type) {
    case 'SET_GAME_STATE': {
      const backendState = action.payload;
      const incomingGameId = backendState.id || backendState.gameId;
      const incomingGameCode = backendState.gameCode;
      // Only accept state for the current game
      if (
        (state.gameId && incomingGameId && incomingGameId !== state.gameId) ||
        (state.gameCode && incomingGameCode && incomingGameCode !== state.gameCode)
      ) {
        console.warn('Ignoring gameState for wrong game:', { incomingGameId, stateGameId: state.gameId, incomingGameCode, stateGameCode: state.gameCode });
        return state;
      }
      const playerInStorage = playerStorage.get();
      const incomingTeams = backendState.teams || [];
      if (
        (incomingTeams.length === 0 || !incomingGameId) &&
        (playerInStorage || state.currentPlayer)
      ) {
        console.warn('Ignoring empty or null gameState from backend during reconnect');
        return {
          ...state,
          isInitializing: false,
        };
      }
      // Existing logic for updating state:
      const newState = {
        ...state,
        ...backendState,
        gameId: backendState.id || backendState.gameId || state.gameId,
        gameCode: backendState.gameCode || state.gameCode,
        lastUpdate: Date.now(),
        isInitializing: false,
        scenarios: backendState.scenarios || state.scenarios
      };
      console.log('State updated in reducer:', {
        oldState: state.gameState,
        newState: newState.gameState,
        oldRound: state.currentRound,
        newRound: newState.currentRound,
        oldScenario: state.currentScenario ? 'Set' : 'Not set',
        newScenario: newState.currentScenario ? 'Set' : 'Not set',
        gameId: newState.gameId,
        gameCode: newState.gameCode,
        teamsCount: newState.teams.length,
        isInitializing: newState.isInitializing
      });
      return newState;
    }

    case 'SET_CONNECTION':
      return {
        ...state,
        isConnected: action.payload
      };
    
    case 'SET_CURRENT_PLAYER':
      return {
        ...state,
        currentPlayer: action.payload
      };
    
    case 'SET_ADMIN':
      return {
        ...state,
        isAdmin: action.payload
      };
    
    case 'SET_INITIALIZING':
      return {
        ...state,
        isInitializing: action.payload
      };
    
    case 'RESET_STATE':
      return {
        ...initialState,
        isAdmin: state.isAdmin // Preserve admin status
      };
    
    default:
      return state;
  }
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Use a ref to track the current state for use in event handlers
  const stateRef = React.useRef(state);
  stateRef.current = state;

  // Add ref to track connection attempts to prevent multiple simultaneous connections
  const connectionAttemptRef = React.useRef<string | null>(null);
  const connectionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Always restore currentPlayer from storage on mount or when currentPlayer is null
  React.useEffect(() => {
    const playerData = playerStorage.get();
    if (playerData && !state.currentPlayer) {
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: playerData });
    }
  }, [state.currentPlayer]);

  // Auto-rejoin team if currentPlayer is set but not present in teams array
  React.useEffect(() => {
    const playerData = playerStorage.get();
    if (
      playerData &&
      state.currentPlayer &&
      state.teams.length > 0 &&
      !state.teams.some(
        (team) =>
          team.id === playerData.teamId &&
          team.players.includes(playerData.name)
      )
    ) {
      const socket = getSocket();
      socket.emit('joinGame', {
        gameId: playerData.gameId,
        playerName: playerData.name,
        teamId: playerData.teamId,
        emoji: playerData.emoji || '❓',
        isAdmin: false,
      });
    }
  }, [state.currentPlayer, state.teams]);

  // Socket.IO connection and event handling
  useEffect(() => {
    const socket = getSocket();

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
      console.log('Socket transport:', socket.io.engine.transport.name);
      dispatch({ type: 'SET_CONNECTION', payload: true });
      
      // If we have a gameId but were disconnected, try to reconnect to the game
      if (stateRef.current.gameId && !stateRef.current.isInitializing) {
        console.log('Reconnecting to game after socket reconnection:', stateRef.current.gameId);
        api.socket.requestGameState(stateRef.current.gameId);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      dispatch({ type: 'SET_CONNECTION', payload: false });
      
      // If this was an unexpected disconnect, try to reconnect
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.log('Unexpected disconnect, attempting to reconnect...');
        setTimeout(() => {
          if (!isSocketConnected()) {
            socket.connect();
          }
        }, 1000);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      dispatch({ type: 'SET_CONNECTION', payload: false });
    });

    // Check initial connection status
    if (isSocketConnected()) {
      dispatch({ type: 'SET_CONNECTION', payload: true });
    }

    // Handle page visibility changes (tab switching, minimizing)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden, keeping connection alive');
      } else {
        console.log('Page visible, checking connection');
        if (!isSocketConnected()) {
          console.log('Reconnecting after page visibility change');
          socket.connect();
        } else if (stateRef.current.gameId) {
          // Request fresh game state when page becomes visible
          console.log('Requesting fresh game state after page visibility change');
          api.socket.requestGameState(stateRef.current.gameId);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Game state updates from server - only register once
    console.log('Setting up gameState listener...');
    const handleGameState = (gameState: any) => {
      console.log('Received game state update:', { 
        id: gameState.id, 
        gameCode: gameState.gameCode,
        state: gameState.state, 
        currentRound: gameState.currentRound,
        teams: gameState.teams?.length || 0,
        currentScenario: gameState.currentScenario ? 'Set' : 'Not set',
        roundTimer: gameState.roundTimer,
        timestamp: new Date().toISOString()
      });
      
      // Validate game state before processing
      if (!gameState || !gameState.id) {
        console.warn('Received invalid game state:', gameState);
        return;
      }
      
      // Check if this is a response to our requestGameState call
      if (stateRef.current.isInitializing) {
        console.log('This appears to be the initial state sync response - will set isInitializing to false');
      }
      
      // Clear connection attempt ref when we receive a valid game state
      if (gameState.id && connectionAttemptRef.current === gameState.id) {
        console.log('Clearing connection attempt ref for successful connection:', gameState.id);
        connectionAttemptRef.current = null;
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
      }
      
      // If admin is connecting to a game, save the admin information
      // Check if this is a new admin connection (either no gameId or different gameId)
      if (stateRef.current.isAdmin && gameState.id && gameState.gameCode) {
        const currentGameId = stateRef.current.gameId;
        const isNewConnection = !currentGameId || currentGameId !== gameState.id;
        
        if (isNewConnection) {
          console.log('Admin connecting to game, saving admin info:', { 
            gameId: gameState.id, 
            gameCode: gameState.gameCode,
            currentGameId,
            isNewConnection
          });
          adminStorage.set({ isAdmin: true, gameId: gameState.id, gameCode: gameState.gameCode });
        } else {
          console.log('Admin already connected to this game:', { gameId: gameState.id });
        }
      }
      
      // Ensure we have a valid game state before dispatching
      if (gameState.id && gameState.gameCode) {
        console.log('Dispatching SET_GAME_STATE - this should set isInitializing to false');
        
        // Always dispatch the game state, which will set isInitializing to false
        dispatch({ type: 'SET_GAME_STATE', payload: gameState });
        
        // Double-check that isInitializing is set to false
        setTimeout(() => {
          if (stateRef.current.isInitializing) {
            console.log('Force setting isInitializing to false after game state received');
            dispatch({ type: 'SET_INITIALIZING', payload: false });
          }
        }, 100);
      } else {
        console.log('Received invalid game state, not dispatching:', gameState);
      }
    };
    
    socket.on('gameState', handleGameState);

    // Player joined notifications - only register once
    console.log('Setting up playerJoined listener...');
    const handlePlayerJoined = (data: any) => {
      console.log('Player joined:', data);
    };
    
    socket.on('playerJoined', handlePlayerJoined);

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error received:', error);
      // Don't set connection to false for errors, just log them
    });

    // Response rejection handling
    socket.on('responseRejected', (data) => {
      console.warn('Response rejected:', data);
      // Could dispatch an action to show error message to user
    });

    // Cleanup function - single return statement
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Remove socket listeners properly
      socket.off('gameState', handleGameState);
      socket.off('playerJoined', handlePlayerJoined);
      socket.off('error');
      socket.off('responseRejected');
      // Clear connection refs
      connectionAttemptRef.current = null;
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      // Don't disconnect on cleanup, let the socket stay connected
    };
  }, []);

  // Timer effect: only admin runs the timer interval
  // (Removed - timer is now managed by the backend server)
  // useEffect(() => {
  //   let timer: NodeJS.Timeout | null = null;
  //   
  //   if (state.isAdmin && state.gameState === 'round' && state.roundTimer > 0) {
  //     timer = setInterval(() => {
  //       const newTimer = state.roundTimer - 1;
  //       dispatch({ type: 'UPDATE_TIMER', payload: newTimer });
  //       
  //       // Send timer update to server
  //       if (state.gameId) {
  //         api.socket.updateTimer({ gameId: state.gameId, timer: newTimer });
  //       }
  //       
  //       if (newTimer === 0) {
  //         // Round ended
  //         if (state.gameId) {
  //           api.socket.endGame(state.gameId);
  //         }
  //       }
  //     }, 1000);
  //   }
  //   
  //   return () => {
  //     if (timer) clearInterval(timer);
  //   };
  // }, [state.isAdmin, state.gameState, state.roundTimer, state.gameId]);

  // Game management functions
  const startGame = (numTeams: number = 6) => {
    const gameId = Date.now().toString();
    const gameCode = gameId.slice(-6); // Last 6 digits as game code
    console.log('startGame called:', { gameId, gameCode, numTeams });
    
    // Update local state with the new gameId immediately
    dispatch({ type: 'SET_GAME_STATE', payload: { gameId, gameCode } });
    
    // Save admin information
    adminStorage.set({ isAdmin: true, gameId, gameCode });
    
    // Create game on server
    api.socket.joinGame({
      gameId,
      playerName: 'Admin',
      teamId: 'admin',
      isAdmin: true
    });

    // Tell backend to start the game (set state to 'playing', round 1, etc.)
    api.socket.startGame(gameId);

    // Backend will emit the updated state with all the game details
  };

  const startRound = () => {
    if (state.gameId) {
      api.socket.startRound(state.gameId);
    }
  };

  const connectToGame = (gameId: string) => {
    console.log('Connecting to game:', gameId);
    
    // Set initializing to true when connecting to a new game
    dispatch({ type: 'SET_INITIALIZING', payload: true });
    
    // Check if socket is connected first
    if (!isSocketConnected()) {
      console.log('Socket not connected, attempting to connect...');
    }
    
    // Join the game room on the backend to receive updates
    api.socket.joinGame({
      gameId,
      playerName: 'Viewer',
      teamId: 'viewer',
      isAdmin: false
    });
    
    // Don't set gameId immediately - wait for the backend response
    // which will contain the full game ID if a partial match was found
    
    // Request current game state to ensure we have the latest state
    // This is especially important for new tabs/sessions
    setTimeout(() => {
      console.log('Requesting current game state for:', gameId);
      api.socket.requestGameState(gameId);
    }, 100); // Small delay to ensure joinGame completes first
    
    // Set a timeout to reset connection state if no response
    setTimeout(() => {
      if (!stateRef.current.isConnected) {
        console.log('Connection timeout for game:', gameId);
      }
    }, 3000);
    
    // Set a timeout to prevent infinite loading state
    setTimeout(() => {
      console.log('Setting isInitializing to false due to timeout (connectToGame)');
      dispatch({ type: 'SET_INITIALIZING', payload: false });
    }, 5000); // 5 second timeout for initialization
  };

  const connectToGameAsAdmin = (gameId: string) => {
    console.log('Connecting to game as admin:', gameId);
    
    // Prevent multiple simultaneous connection attempts
    if (connectionAttemptRef.current === gameId) {
      console.log('Connection attempt already in progress for:', gameId);
      return;
    }
    
    // Clear any existing timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    // Mark this connection attempt
    connectionAttemptRef.current = gameId;
    
    // Set initializing to true when connecting to a new game
    dispatch({ type: 'SET_INITIALIZING', payload: true });
    
    // Check if socket is connected first
    if (!isSocketConnected()) {
      console.log('Socket not connected, attempting to connect...');
    }
    
    // Join the game room on the backend to receive updates as admin
    api.socket.joinGame({
      gameId,
      playerName: 'Admin',
      teamId: 'admin',
      isAdmin: true
    });
    
    // Don't set gameId immediately - wait for the backend response
    // which will contain the full game ID if a partial match was found
    
    // Request current game state to ensure we have the latest state
    // This is especially important for new tabs/sessions
    setTimeout(() => {
      console.log('Requesting current game state for:', gameId);
      api.socket.requestGameState(gameId);
    }, 100); // Small delay to ensure joinGame completes first
    
    // Set a timeout to reset connection state if no response
    setTimeout(() => {
      if (!stateRef.current.isConnected) {
        console.log('Connection timeout for game:', gameId);
      }
    }, 3000);
    
    // Set a timeout to prevent infinite loading state
    connectionTimeoutRef.current = setTimeout(() => {
      console.log('Setting isInitializing to false due to timeout (connectToGameAsAdmin)');
      dispatch({ type: 'SET_INITIALIZING', payload: false });
      connectionAttemptRef.current = null;
      connectionTimeoutRef.current = null;
    }, 5000); // 5 second timeout for initialization
  };

  const joinTeam = (teamId: string, playerName: string, emoji?: string) => {
    if (state.gameId) {
      console.log('joinTeam called:', { gameId: state.gameId, playerName, teamId, emoji });
      
      // Set initializing to true when joining a team
      dispatch({ type: 'SET_INITIALIZING', payload: true });
      
      api.socket.joinGame({
        gameId: state.gameId,
        playerName,
        teamId,
        emoji,
        isAdmin: false
      });
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: { name: playerName, teamId } });
      
      // Request current game state to ensure we have the latest state
      setTimeout(() => {
        console.log('Requesting current game state after joining team:', state.gameId);
        api.socket.requestGameState(state.gameId!);
      }, 100); // Small delay to ensure joinGame completes first
      
      // Set a timeout to prevent infinite loading state
      setTimeout(() => {
        console.log('Setting isInitializing to false due to timeout (joinTeam)');
        dispatch({ type: 'SET_INITIALIZING', payload: false });
      }, 5000); // 5 second timeout for initialization
      
      // Store the timeout ID so we can clear it if needed
      // Note: In a real implementation, you might want to store this in a ref
      // and clear it when game state is received
    }
  };

  const selectScripture = (scriptureId: number) => {
    dispatch({ type: 'SET_GAME_STATE', payload: { selectedScripture: scriptureId } });
  };

  const updateResponse = (response: string) => {
    dispatch({ type: 'SET_GAME_STATE', payload: { teamResponse: response } });
  };

  const setPlayerSelection = (playerId: string, selectedScripture: number | null, teamResponse: string) => {
    if (state.gameId) {
      api.socket.updatePlayerSelection({
        gameId: state.gameId,
        playerId,
        selectedScripture,
        teamResponse
      });
    }
  };

  const submitResponse = (teamId: string, playerId: string) => {
    const playerSelection = state.playerSelections[playerId];
    if (!playerSelection?.selectedScripture || !playerSelection.teamResponse.trim()) return;
    
    if (state.gameId) {
      const playerName = state.currentPlayer?.name || '';
      api.socket.submitResponse({
        gameId: state.gameId,
        teamId,
        playerId,
        scriptureId: playerSelection.selectedScripture,
        response: playerSelection.teamResponse,
        playerName
      });
    }
  };

  const setQualityScore = (teamId: string, score: number) => {
    // This is now handled by setTeamRoundScore
    console.log('setQualityScore deprecated, use setTeamRoundScore instead');
  };

  const setTeamRoundScore = (teamId: string, roundNumber: number, speedScore: number, qualityScore: number) => {
    if (state.gameId) {
      api.socket.setTeamRoundScore({
        gameId: state.gameId,
        teamId,
        roundNumber,
        speedScore,
        qualityScore
      });
    }
  };

  const clearRoundScores = (roundNumber: number) => {
    // This is now handled by the server when starting a new round
    console.log('clearRoundScores deprecated, handled by server');
  };

  const calculateRoundResults = () => {
    if (state.gameId) {
      api.socket.endGame(state.gameId);
    }
  };

  const endGame = () => {
    if (state.gameId) {
      api.socket.endGame(state.gameId);
    }
  };

  const nextRound = () => {
    if (state.gameId) {
      api.socket.nextRound(state.gameId);
    }
  };

  const setAdmin = (isAdmin: boolean) => {
    dispatch({ type: 'SET_ADMIN', payload: isAdmin });
  };

  const value: GameContextType = {
    ...state,
    dispatch,
    startGame,
    startRound,
    connectToGame,
    connectToGameAsAdmin,
    joinTeam,
    selectScripture,
    updateResponse,
    submitResponse,
    setPlayerSelection,
    setQualityScore,
    setTeamRoundScore,
    clearRoundScores,
    calculateRoundResults,
    endGame,
    nextRound,
    setAdmin,
    scriptures,
    scenarios: state.scenarios
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame debe ser usado dentro de un GameProvider');
  }
  return context;
}; 