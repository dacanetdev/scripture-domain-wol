import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { scenarios, scriptures } from '../data/scriptures';
import { GameContextType, GameState, Team, Response, RoundResult, GameResults, TeamRoundScore } from '../types';
import { api, getSocket } from '../services/api';

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameStateType {
  gameId: string | null;
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
}

const initialState: GameStateType = {
  gameId: null,
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
  currentPlayer: null
};

type GameAction =
  | { type: 'SET_GAME_STATE'; payload: Partial<GameStateType> }
  | { type: 'SET_CONNECTION'; payload: boolean }
  | { type: 'SET_CURRENT_PLAYER'; payload: { name: string; teamId: string } | null }
  | { type: 'SET_ADMIN'; payload: boolean }
  | { type: 'UPDATE_TIMER'; payload: number }
  | { type: 'RESET_STATE' };

const gameReducer = (state: GameStateType, action: GameAction): GameStateType => {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return {
        ...state,
        ...action.payload,
        lastUpdate: Date.now()
      };
    
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
    
    case 'UPDATE_TIMER':
      return {
        ...state,
        roundTimer: action.payload,
        lastTimerUpdate: Date.now()
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

  // Socket.IO connection and event handling
  useEffect(() => {
    const socket = getSocket();

    // Connection events
    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTION', payload: true });
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'SET_CONNECTION', payload: false });
    });

    // Game state updates from server
    api.socket.onGameState((gameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
    });

    // Player joined notifications
    api.socket.onPlayerJoined((data) => {
      console.log('Player joined:', data);
    });

    return () => {
      api.socket.off('gameState');
      api.socket.off('playerJoined');
      socket.disconnect();
    };
  }, []);

  // Timer effect: only admin runs the timer interval
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (state.isAdmin && state.gameState === 'round' && state.roundTimer > 0) {
      timer = setInterval(() => {
        const newTimer = state.roundTimer - 1;
        dispatch({ type: 'UPDATE_TIMER', payload: newTimer });
        
        // Send timer update to server
        if (state.gameId) {
          api.socket.updateTimer({ gameId: state.gameId, timer: newTimer });
        }
        
        if (newTimer === 0) {
          // Round ended
          if (state.gameId) {
            api.socket.endGame(state.gameId);
          }
        }
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.isAdmin, state.gameState, state.roundTimer, state.gameId]);

  // Game management functions
  const startGame = (numTeams: number = 6) => {
    const gameId = Date.now().toString();
    
    // Create game on server
    api.socket.joinGame({
      gameId,
      playerName: 'Admin',
      teamId: 'admin',
      isAdmin: true
    });
    
    dispatch({ type: 'SET_GAME_STATE', payload: { gameId, gameState: 'playing' } });
  };

  const startRound = () => {
    if (state.gameId) {
      api.socket.startRound(state.gameId);
    }
  };

  const joinTeam = (teamId: string, playerName: string, emoji?: string) => {
    if (state.gameId) {
      api.socket.joinGame({
        gameId: state.gameId,
        playerName,
        teamId,
        emoji,
        isAdmin: false
      });
      
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: { name: playerName, teamId } });
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