import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { teamColors, scenarios, scriptures } from '../data/scriptures';
import { GameContextType, GameState, Team, Response, RoundResult, GameResults, TeamRoundScore } from '../types';
import { adminStorage, gameStateStorage, playerStorage } from '../utils/storage';

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
  teamRoundScores: TeamRoundScore[]; // New: track scores per round per team
  gameResults: GameResults | null;
  lastUpdate?: number;
  // Individual player states (session-specific)
  playerSelections: { [playerId: string]: { selectedScripture: number | null; teamResponse: string } };
}

const initialState: GameStateType = {
  gameId: null,
  gameState: 'lobby',
  currentRound: 0,
  teams: [], // Start with no teams
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
  playerSelections: {}
};

type GameAction =
  | { type: 'START_GAME'; payload: { gameId: string; teams: Team[] } }
  | { type: 'START_ROUND' }
  | { type: 'NEXT_ROUND' }
  | { type: 'UPDATE_TIMER'; payload: number }
  | { type: 'SELECT_SCRIPTURE'; payload: number }
  | { type: 'UPDATE_RESPONSE'; payload: string }
  | { type: 'SUBMIT_RESPONSE'; payload: { teamId: string; scriptureId: number; response: string; speedScore: number } }
  | { type: 'SET_QUALITY_SCORE'; payload: { teamId: string; score: number } }
  | { type: 'SET_TEAM_ROUND_SCORE'; payload: { teamId: string; roundNumber: number; speedScore: number; qualityScore: number } }
  | { type: 'CLEAR_ROUND_SCORES'; payload: number }
  | { type: 'END_ROUND' }
  | { type: 'END_GAME' }
  | { type: 'SET_ADMIN'; payload: boolean }
  | { type: 'JOIN_TEAM'; payload: { teamId: string; playerName: string; emoji?: string } }
  | { type: 'SYNC_STATE'; payload: Partial<GameStateType> }
  | { type: 'SET_PLAYER_SELECTION'; payload: { playerId: string; selectedScripture: number | null; teamResponse: string } }
  | { type: 'CLEAR_PLAYER_SELECTIONS' };

const gameReducer = (state: GameStateType, action: GameAction): GameStateType => {
  switch (action.type) {
    case 'START_GAME':
      const startedState = {
        ...state,
        gameId: action.payload.gameId,
        gameState: 'playing' as GameState,
        currentRound: 1,
        teams: action.payload.teams,
        currentScenario: scenarios[0],
        roundTimer: 180,
        lastTimerUpdate: Date.now()
      };
      localStorage.setItem('scriptureDominionState', JSON.stringify(startedState));
      return startedState;
    case 'START_ROUND':
      return {
        ...state,
        gameState: 'round',
        roundTimer: 180,
        lastTimerUpdate: Date.now()
      };
    case 'NEXT_ROUND':
      const nextRound = state.currentRound + 1;
      return {
        ...state,
        currentRound: nextRound,
        currentScenario: scenarios[nextRound - 1],
        roundTimer: 180,
        lastTimerUpdate: Date.now(),
        responses: [],
        selectedScripture: null,
        teamResponse: '',
        roundResults: [],
        gameState: 'playing' // Keep as 'playing' (waiting for admin to start round)
      };
    
    case 'UPDATE_TIMER':
      return {
        ...state,
        roundTimer: action.payload,
        lastTimerUpdate: Date.now()
      };
    
    case 'SELECT_SCRIPTURE':
      return {
        ...state,
        selectedScripture: action.payload
      };
    
    case 'UPDATE_RESPONSE':
      return {
        ...state,
        teamResponse: action.payload
      };
    
    case 'SUBMIT_RESPONSE':
      const newResponse: Response = {
        teamId: action.payload.teamId,
        scriptureId: action.payload.scriptureId,
        response: action.payload.response,
        timestamp: Date.now(),
        speedScore: 0, // No default points - admin will set them
        qualityScore: 0
      };
      
      return {
        ...state,
        responses: [...state.responses, newResponse]
      };
    
    case 'SET_QUALITY_SCORE':
      return {
        ...state,
        responses: state.responses.map(r => 
          r.teamId === action.payload.teamId 
            ? { ...r, qualityScore: action.payload.score }
            : r
        )
      };

    case 'SET_TEAM_ROUND_SCORE':
      const existingScoreIndex = state.teamRoundScores.findIndex(
        s => s.teamId === action.payload.teamId && s.roundNumber === action.payload.roundNumber
      );
      
      const newTeamRoundScore: TeamRoundScore = {
        teamId: action.payload.teamId,
        roundNumber: action.payload.roundNumber,
        speedScore: action.payload.speedScore,
        qualityScore: action.payload.qualityScore,
        totalScore: action.payload.speedScore + action.payload.qualityScore
      };

      if (existingScoreIndex >= 0) {
        // Update existing score
        const updatedScores = [...state.teamRoundScores];
        updatedScores[existingScoreIndex] = newTeamRoundScore;
        return {
          ...state,
          teamRoundScores: updatedScores
        };
      } else {
        // Add new score
        return {
          ...state,
          teamRoundScores: [...state.teamRoundScores, newTeamRoundScore]
        };
      }

    case 'CLEAR_ROUND_SCORES':
      return {
        ...state,
        teamRoundScores: state.teamRoundScores.filter(s => s.roundNumber !== action.payload)
      };
    
    case 'END_ROUND':
      const roundScores: RoundResult[] = state.responses.map(r => ({
        teamId: r.teamId,
        totalScore: r.speedScore + r.qualityScore,
        roundNumber: state.currentRound
      }));
      
      return {
        ...state,
        roundResults: roundScores,
        gameState: 'round'
      };
    
    case 'END_GAME':
      const finalScores: GameResults = {};
      state.teams.forEach(team => {
        finalScores[team.id] = state.responses
          .filter(r => r.teamId === team.id)
          .reduce((sum, r) => sum + r.speedScore + r.qualityScore, 0);
      });
      
      return {
        ...state,
        gameState: 'results',
        gameResults: finalScores
      };
    
    case 'SET_ADMIN':
      return {
        ...state,
        isAdmin: action.payload
      };
    
    case 'JOIN_TEAM':
      let updatedTeams = state.teams;
      // If team doesn't exist and we have less than 6 teams, add it
      if (!state.teams.find(team => team.id === action.payload.teamId) && state.teams.length < 6) {
        updatedTeams = [
          ...state.teams,
          {
            id: action.payload.teamId,
            name: action.payload.teamId, // Use teamId as name for new teams
            color: teamColors[state.teams.length % teamColors.length],
            players: [action.payload.playerName],
            totalScore: 0,
            emoji: action.payload.emoji || '❓'
          }
        ];
      } else {
        // Add player to existing team
        updatedTeams = state.teams.map(team =>
          team.id === action.payload.teamId
            ? { ...team, players: [...team.players, action.payload.playerName] }
            : team
        );
      }
      // Persist updated teams to localStorage
      const updatedState = {
        ...state,
        teams: updatedTeams
      };
      localStorage.setItem('scriptureDominionState', JSON.stringify(updatedState));
      return updatedState;
    
    case 'SYNC_STATE':
      // Never overwrite isAdmin from synced state
      const { isAdmin: _ignore, ...rest } = action.payload;
      return {
        ...state,
        ...rest
      };
    
    case 'SET_PLAYER_SELECTION':
      return {
        ...state,
        playerSelections: {
          ...state.playerSelections,
          [action.payload.playerId]: {
            selectedScripture: action.payload.selectedScripture,
            teamResponse: action.payload.teamResponse
          }
        }
      };
    
    case 'CLEAR_PLAYER_SELECTIONS':
      return {
        ...state,
        playerSelections: {}
      };
    
    default:
      return state;
  }
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(
    gameReducer,
    initialState,
    (init) => {
      const stored = gameStateStorage.get();
      return stored ? { ...init, ...stored } : init;
    }
  );

  // Remove the SYNC_STATE dispatch from the first useEffect, as it's now handled by lazy init
  useEffect(() => {
    // Check if this is a new session (no existing session data)
    const existingPlayer = playerStorage.get();
    const existingAdmin = adminStorage.get();
    // If this is a completely new session, start as a new user (non-admin)
    if (!existingPlayer && !existingAdmin) {
      dispatch({ type: 'SET_ADMIN', payload: false });
    } else {
      // Load existing session data
      if (existingAdmin) {
        dispatch({ type: 'SET_ADMIN', payload: existingAdmin });
      }
    }
  }, []);

  // Listen for storage events to sync state across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'scriptureDominionState' && e.newValue) {
        dispatch({ type: 'SYNC_STATE', payload: JSON.parse(e.newValue) });
      }
      // Note: Admin state is now session-specific, so no cross-tab sync needed
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Save state to localStorage on every change, but avoid infinite loops
  useEffect(() => {
    const currentStored = gameStateStorage.get();
    const { isAdmin: _ignore, ...stateToStore } = state;
    
    // Only save if the state has actually changed
    if (JSON.stringify(currentStored) !== JSON.stringify(stateToStore)) {
      gameStateStorage.set(stateToStore);
    }
  }, [state]);

  // Timer effect: only admin runs the timer interval
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    // Only run timer if this session is admin
    if (state.isAdmin && state.gameState === 'round' && state.roundTimer > 0) {
      timer = setInterval(() => {
        dispatch({ type: 'UPDATE_TIMER', payload: state.roundTimer - 1 });
      }, 1000);
    }
    if (state.isAdmin && state.gameState === 'round' && state.roundTimer === 0) {
      dispatch({ type: 'END_ROUND' });
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.isAdmin, state.gameState, state.roundTimer]);

  const startGame = (numTeams: number = 6) => {
    const gameId = Date.now().toString();
    const teams: Team[] = [];
    
    dispatch({
      type: 'START_GAME',
      payload: { gameId, teams }
    });
  };

  const startRound = () => {
    // Clear any existing scores for this round
    clearRoundScores(state.currentRound);
    // Clear player selections for new round
    dispatch({ type: 'CLEAR_PLAYER_SELECTIONS' });
    dispatch({ type: 'START_ROUND' });
  };

  const joinTeam = (teamId: string, playerName: string, emoji?: string) => {
    dispatch({
      type: 'JOIN_TEAM',
      payload: { teamId, playerName, emoji }
    });
  };

  const selectScripture = (scriptureId: number) => {
    dispatch({
      type: 'SELECT_SCRIPTURE',
      payload: scriptureId
    });
  };

  const updateResponse = (response: string) => {
    dispatch({
      type: 'UPDATE_RESPONSE',
      payload: response
    });
  };

  const setPlayerSelection = (playerId: string, selectedScripture: number | null, teamResponse: string) => {
    dispatch({
      type: 'SET_PLAYER_SELECTION',
      payload: { playerId, selectedScripture, teamResponse }
    });
  };

  const submitResponse = (teamId: string, playerId: string) => {
    const playerSelection = state.playerSelections[playerId];
    if (!playerSelection?.selectedScripture || !playerSelection.teamResponse.trim()) return;
    
    // Check if team has already submitted
    if (state.responses.some(r => r.teamId === teamId)) return;
    
    const speedScore = Math.max(1, Math.floor((180 - state.roundTimer) / 30) + 1);
    
    dispatch({
      type: 'SUBMIT_RESPONSE',
      payload: {
        teamId,
        scriptureId: playerSelection.selectedScripture,
        response: playerSelection.teamResponse,
        speedScore
      }
    });
  };

  const setQualityScore = (teamId: string, score: number) => {
    dispatch({
      type: 'SET_QUALITY_SCORE',
      payload: { teamId, score }
    });
  };

  const setTeamRoundScore = (teamId: string, roundNumber: number, speedScore: number, qualityScore: number) => {
    dispatch({
      type: 'SET_TEAM_ROUND_SCORE',
      payload: { teamId, roundNumber, speedScore, qualityScore }
    });
  };

  const clearRoundScores = (roundNumber: number) => {
    dispatch({
      type: 'CLEAR_ROUND_SCORES',
      payload: roundNumber
    });
  };

  const calculateRoundResults = () => {
    dispatch({ type: 'END_ROUND' });
  };

  const nextRound = () => {
    if (state.currentRound >= scenarios.length) {
      dispatch({ type: 'END_GAME' });
    } else {
      dispatch({ type: 'NEXT_ROUND' });
    }
  };

  const setAdmin = (isAdmin: boolean) => {
    dispatch({
      type: 'SET_ADMIN',
      payload: isAdmin
    });
    // Use storage utilities for consistent data management
    adminStorage.set(isAdmin);
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