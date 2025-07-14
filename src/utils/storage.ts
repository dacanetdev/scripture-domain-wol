// Storage utility functions for consistent data management

// Storage keys
export const STORAGE_KEYS = {
  PLAYER: 'scriptureDominionPlayer',
  ADMIN: 'scriptureDominionAdmin',
  GAME_SESSION: 'scriptureDominionGameId',
  GAME_STATE: 'scriptureDominionState'
} as const;

// Player data (session-specific, per-tab)
export const playerStorage = {
  get: () => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.PLAYER);
    return saved ? JSON.parse(saved) : null;
  },
  set: (playerData: { name: string; teamId: string; gameId?: string }) => {
    sessionStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(playerData));
  },
  clear: () => {
    sessionStorage.removeItem(STORAGE_KEYS.PLAYER);
  },
  isJoined: (teams: { id: string }[], gameId: string | null): boolean => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.PLAYER);
    const sessionGameId = sessionStorage.getItem(STORAGE_KEYS.GAME_SESSION);
    if (!saved || !gameId || sessionGameId !== gameId) return false;
    const { name, teamId } = JSON.parse(saved);
    if (!name || !teamId) return false;
    return teams.some(t => t.id === teamId);
  }
};

// Admin data (session-specific, per-tab)
export const adminStorage = {
  get: () => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.ADMIN);
    return saved ? JSON.parse(saved) : false;
  },
  set: (isAdmin: boolean) => {
    sessionStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(isAdmin));
  },
  clear: () => {
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN);
  }
};

// Game session data (session-specific, per-tab)
export const gameSessionStorage = {
  get: () => {
    return sessionStorage.getItem(STORAGE_KEYS.GAME_SESSION);
  },
  set: (gameId: string) => {
    sessionStorage.setItem(STORAGE_KEYS.GAME_SESSION, gameId);
  },
  clear: () => {
    sessionStorage.removeItem(STORAGE_KEYS.GAME_SESSION);
  }
};

// Game state data (shared across tabs)
export const gameStateStorage = {
  get: () => {
    const saved = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
    return saved ? JSON.parse(saved) : null;
  },
  set: (gameState: any) => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(gameState));
  },
  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
  }
};

// Clear session storage only (preserve game context)
export const clearSessionStorage = () => {
  sessionStorage.clear();
};

// Clear all storage (useful for resetting the entire game)
export const clearAllStorage = () => {
  sessionStorage.clear();
  localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
}; 