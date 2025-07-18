import React from 'react';

export interface Scripture {
  id: number;
  reference: string;
  text: string;
  key: string;
  apply: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  players: string[];
  totalScore: number;
  emoji: string;
}

export interface Response {
  teamId: string;
  scriptureId: number;
  response: string;
  timestamp: number;
  speedScore: number;
  qualityScore: number;
  playerName?: string;
  roundNumber?: number; // Add round number
}

export interface RoundResult {
  teamId: string;
  totalScore: number;
  roundNumber: number;
}

export interface TeamRoundScore {
  teamId: string;
  roundNumber: number;
  speedScore: number;
  qualityScore: number;
  totalScore: number;
}

export interface GameResults {
  [teamId: string]: number; // Total points across all rounds
}

export type GameState = 'lobby' | 'playing' | 'round' | 'results' | 'finished';

export interface GameContextType {
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
  // Backend connection state
  isConnected: boolean;
  currentPlayer: { name: string; teamId: string } | null;
  // Loading state for initial sync
  isInitializing: boolean;
  startGame: (numTeams?: number) => void;
  startRound: () => void;
  connectToGame: (gameId: string) => void;
  connectToGameAsAdmin: (gameId: string) => void;
  joinTeam: (teamId: string, playerName: string, emoji?: string) => void;
  selectScripture: (scriptureId: number) => void;
  updateResponse: (response: string) => void;
  submitResponse: (teamId: string, playerId: string) => void;
  setPlayerSelection: (playerId: string, selectedScripture: number | null, teamResponse: string) => void;
  setQualityScore: (teamId: string, score: number) => void;
  setTeamRoundScore: (teamId: string, roundNumber: number, speedScore: number, qualityScore: number) => void;
  clearRoundScores: (roundNumber: number) => void;
  calculateRoundResults: () => void;
  endGame: () => void;
  nextRound: () => void;
  setAdmin: (isAdmin: boolean) => void;
  scriptures: Scripture[];
  scenarios: string[];
  dispatch: React.Dispatch<any>; // Add this line for context actions
} 