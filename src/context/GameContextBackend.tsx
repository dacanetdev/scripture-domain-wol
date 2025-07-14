import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { scenarios, scriptures } from '../data/scriptures';
import { GameContextType, GameState, Team, Response, RoundResult, GameResults, TeamRoundScore } from '../types';
import { api, getSocket, isSocketConnected } from '../services/api';
import { adminStorage } from '../utils/storage';

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameStateType {
  gameId: string | null;
  gameCode: string | null; // Add game code for easy lookup
  gameState: GameState;
  currentRound: number;
  teams: Team[];
  responses: Response[];
  scores: { [key: string]: number };
  currentScenario: string;
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
}

const initialState: GameStateType = {
  gameId: null,
  gameCode: null,
  gameState: 'lobby',
  currentRound: 0,
  teams: [],
  responses: [],
  scores: {},
  currentScenario: '',
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
  isInitializing: true
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
    case 'SET_GAME_STATE':
      // Map backend response to frontend state structure
      const backendState = action.payload;
      console.log('SET_GAME_STATE reducer called with payload:', backendState);
      console.log('Current state before update:', {
        gameId: state.gameId,
        gameCode: state.gameCode,
        isInitializing: state.isInitializing,
        isConnected: state.isConnected
      });
      
      const newState = {
        ...state,
        gameId: backendState.id || backendState.gameId || state.gameId,
        gameCode: backendState.gameCode || state.gameCode, // Update gameCode
        gameState: (backendState.state || backendState.gameState || state.gameState) as GameState,
        currentRound: backendState.currentRound ?? state.currentRound,
        teams: backendState.teams || state.teams,
        responses: backendState.responses || state.responses,
        scores: backendState.scores || state.scores,
        currentScenario: backendState.currentScenario || state.currentScenario,
        roundTimer: backendState.roundTimer ?? state.roundTimer,
        lastTimerUpdate: backendState.lastTimerUpdate ?? state.lastTimerUpdate,
        roundResults: backendState.roundResults || state.roundResults,
        teamRoundScores: backendState.teamRoundScores || state.teamRoundScores,
        gameResults: backendState.gameResults || state.gameResults,
        playerSelections: backendState.playerSelections || state.playerSelections,
        lastUpdate: Date.now(),
        // Mark as initialized when we receive the first game state
        isInitializing: false
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

  // Socket.IO connection and event handling
  useEffect(() => {
    const socket = getSocket();

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
      console.log('Socket transport:', socket.io.engine.transport.name);
      dispatch({ type: 'SET_CONNECTION', payload: true });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
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
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Game state updates from server - only register once
    console.log('Setting up gameState listener...');
    const handleGameState = (gameState: any) => {
      console.log('Received game state update:', { 
        id: gameState.id, 
        state: gameState.state, 
        currentRound: gameState.currentRound,
        teams: gameState.teams?.length || 0,
        currentScenario: gameState.currentScenario ? 'Set' : 'Not set',
        roundTimer: gameState.roundTimer,
        timestamp: new Date().toISOString()
      });
      console.log('Full game state received:', gameState);
      
      // Check if this is a response to our requestGameState call
      if (stateRef.current.isInitializing) {
        console.log('This appears to be the initial state sync response - will set isInitializing to false');
      }
      
      // If admin is connecting to a game, save the admin information
      if (stateRef.current.isAdmin && gameState.id && gameState.gameCode && !stateRef.current.gameId) {
        console.log('Admin connecting to game, saving admin info:', { gameId: gameState.id, gameCode: gameState.gameCode });
        adminStorage.set({ isAdmin: true, gameId: gameState.id, gameCode: gameState.gameCode });
      }
      
      console.log('Dispatching SET_GAME_STATE - this should set isInitializing to false');
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
    };
    
    socket.on('gameState', handleGameState);

    // Player joined notifications - only register once
    console.log('Setting up playerJoined listener...');
    const handlePlayerJoined = (data: any) => {
      console.log('Player joined:', data);
    };
    
    socket.on('playerJoined', handlePlayerJoined);

    // Cleanup function - single return statement
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Remove socket listeners properly
      socket.off('gameState', handleGameState);
      socket.off('playerJoined', handlePlayerJoined);
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
    setTimeout(() => {
      console.log('Setting isInitializing to false due to timeout (connectToGameAsAdmin)');
      dispatch({ type: 'SET_INITIALIZING', payload: false });
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
      api.socket.submitResponse({
        gameId: state.gameId,
        teamId,
        playerId,
        scriptureId: playerSelection.selectedScripture,
        response: playerSelection.teamResponse
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
    nextRound,
    setAdmin,
    scriptures,
    scenarios
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