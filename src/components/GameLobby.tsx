import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { playerStorage, adminStorage, gameSessionStorage } from '../utils/storage';
import Header from './Header';

const TEAM_EMOJIS = ['☀️', '📖', '🙏', '🌟', '❤️', '✨', '⚡', '🦁', '🐉', '🦅'];

const GameLobby: React.FC = () => {
  const { teams, gameId, isAdmin, gameState, startGame, joinTeam, setAdmin } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [viewGameValid, setViewGameValid] = useState(false);
  const [newTeamEmoji, setNewTeamEmoji] = useState('');
  const navigate = useNavigate();

  // On mount, check if player is already joined and redirect if needed
  useEffect(() => {
    const playerData = playerStorage.get();
    if (playerData) {
      setPlayerName(playerData.name);
      setSelectedTeam(playerData.teamId);
      // Redirect based on game state
      if (gameState === 'playing' || gameState === 'round') {
        navigate('/game');
      } else if (gameState === 'results') {
        navigate('/results');
      }
    }
  }, [gameState, navigate]);

  // Always redirect to the correct screen based on gameState
  useEffect(() => {
    // Only redirect if player is already joined and not just after joining
    if (playerStorage.isJoined(teams, gameId)) {
      if (gameState === 'playing' || gameState === 'round') {
        navigate('/game');
      } else if (gameState === 'results') {
        navigate('/results');
      } else if (gameState === 'lobby') {
        navigate('/lobby');
      }
    }
  }, [gameState, navigate, teams, gameId]);

  // Debug logging
  useEffect(() => {
    console.log('GameLobby rendered:', { isAdmin, teams: teams.length, gameId });
  }, [isAdmin, teams, gameId]);

  // Helper function to validate if a game code corresponds to an existing game
  const validateGameCode = (code: string): { isValid: boolean; gameId?: string } => {
    const storedState = localStorage.getItem('scriptureDominionState');
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      if (parsedState.gameId && code.trim().toLowerCase() === parsedState.gameId.slice(-6).toLowerCase()) {
        return { isValid: true, gameId: parsedState.gameId };
      }
    }
    return { isValid: false };
  };

  // Helper function to validate game code for 'Ver Juego'
  const validateGameCodeForView = (code: string): boolean => {
    const storedState = localStorage.getItem('scriptureDominionState');
    if (storedState) {
      const parsed = JSON.parse(storedState);
      if (parsed.gameId && code.trim().toLowerCase() === parsed.gameId.slice(-6).toLowerCase()) {
        return true;
      }
    }
    return false;
  };

  // Real-time validation of game code
  const handleGameCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setJoinCode(code);
    
    // Clear error when user starts typing
    if (joinError) {
      setJoinError('');
    }
    
    // Only validate if code is 6 characters long
    if (code.length === 6) {
      const validation = validateGameCode(code);
      if (!validation.isValid) {
        setJoinError('Código de juego no válido. Verifica el código.');
      }
    }
    setViewGameValid(code.length === 6 && validateGameCodeForView(code));
  };

  const handleJoinTeam = () => {
    if (!playerName.trim() || !selectedTeam) return;
    
    // Always require game code to join
    if (!joinCode.trim()) {
      setJoinError('Por favor ingresa el código del juego.');
      return;
    }
    
    // Check if the entered code matches the current game (if one exists)
    if (gameId && joinCode.trim().toLowerCase() !== gameId.slice(-6).toLowerCase()) {
      setJoinError('Código de juego incorrecto. Verifica el código e intenta de nuevo.');
      return;
    }
    
    // If no game exists, check if the entered code corresponds to any existing game
    if (!gameId) {
      const validation = validateGameCode(joinCode);
      if (validation.isValid && validation.gameId) {
        // Found a matching game, allow join
        joinTeam(selectedTeam, playerName.trim());
        const playerData = { 
          name: playerName.trim(), 
          teamId: selectedTeam, 
          gameId: validation.gameId
        };
        playerStorage.set(playerData);
        gameSessionStorage.set(validation.gameId);
        setPlayerName('');
        setSelectedTeam(null);
        setJoinCode('');
        setJoinError('');
        navigate('/game');
        return;
      } else {
        // No matching game found
        setJoinError('No se encontró un juego activo con ese código. Verifica el código o contacta al administrador.');
        return;
      }
    }
    
    // Game exists and code matches, proceed with join
    joinTeam(selectedTeam, playerName.trim(), newTeamEmoji);
    const playerData = { 
      name: playerName.trim(), 
      teamId: selectedTeam, 
      ...(gameId && { gameId }) // Only include gameId if it exists
    };
    // Use storage utilities for consistent data management
    playerStorage.set(playerData);
    if (gameId) gameSessionStorage.set(gameId);
    setPlayerName('');
    setSelectedTeam(null);
    setJoinCode('');
    setJoinError('');
    // Immediately redirect to /game after joining
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green p-4">
      <Header />
      <div className="max-w-md mx-auto">
        {/* Game Code Display */}
        {gameId && gameSessionStorage.get() === gameId && (
          <div className="card p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Código del Juego:</p>
            <p className="text-2xl font-mono font-bold text-dark-purple bg-light-gold rounded-lg p-2">
              {gameId.slice(-6).toUpperCase()}
            </p>
          </div>
        )}

        {/* Player Join Section */}
        <div className="card p-6 mb-6">
          <h3 className="text-xl font-bold text-dark-purple mb-4">👥 Únete a la Batalla</h3>
          {/* Always require game code to join */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingresa el código del juego
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={e => {
                setJoinCode(e.target.value);
                setJoinError('');
                setViewGameValid(e.target.value.length === 6 && validateGameCodeForView(e.target.value));
              }}
              placeholder="Código del Juego"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-2"
              maxLength={6}
            />
            {joinError && <div className="text-red-600 mb-2">{joinError}</div>}
            {/* Ver Juego button for projection */}
            {viewGameValid && (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary w-full text-xl py-3 mb-2 bg-yellow-400 text-dark-purple font-bold rounded-lg shadow hover:bg-yellow-500"
                style={{ marginBottom: '1rem' }}
              >
                👁️ Ver Juego
              </button>
            )}
          </div>
          
          {/* Player Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu Nombre
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ingresa tu nombre"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-gold focus:border-transparent"
              maxLength={20}
            />
          </div>

          {/* Team Selection - Show if player has entered name and game code */}
          {playerName.trim() && joinCode.trim() && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona un equipo existente o crea uno nuevo
              </label>
              
              {/* Show existing teams dropdown if any exist */}
              {teams.length > 0 && (
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-2"
                  value={selectedTeam || ''}
                  onChange={e => setSelectedTeam(e.target.value)}
                >
                  <option value="">-- Elige un equipo existente --</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.emoji} {team.name} ({team.players.length} jugadores)
                    </option>
                  ))}
                </select>
              )}
              
              {/* Always show input for creating new team if under 6 teams */}
              {teams.length < 6 && (
                <div className="mb-2">
                  <input
                    type="text"
                    value={selectedTeam && !teams.find(t => t.id === selectedTeam) ? selectedTeam : ''}
                    onChange={e => setSelectedTeam(e.target.value)}
                    placeholder="O escribe el nombre de un equipo nuevo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    maxLength={20}
                  />
                </div>
              )}
              
              {/* Show error if max teams reached */}
              {teams.length >= 6 && !selectedTeam && (
                <div className="text-red-600 text-sm mb-2">Máximo 6 equipos. Selecciona uno existente.</div>
              )}
              
              {/* Show emoji selection for new teams */}
              {teams.length < 6 && selectedTeam && !teams.find(t => t.id === selectedTeam) && (
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Elige un emoji para tu equipo</label>
                  
                  {/* Show available emojis */}
                  <div className="mb-2">
                    <div className="text-xs text-gray-600 mb-1">Emojis disponibles:</div>
                    <div className="flex flex-wrap gap-2">
                      {TEAM_EMOJIS
                        .filter(emoji => !teams.some(team => team.emoji === emoji)) // Filter out emojis already taken
                        .map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            className={`text-2xl px-3 py-1 rounded-lg border-2 ${newTeamEmoji === emoji ? 'border-light-gold bg-light-gold' : 'border-gray-300 hover:border-light-gold'}`}
                            onClick={() => setNewTeamEmoji(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                    </div>
                  </div>
                  
                  {/* Show taken emojis for reference */}
                  {teams.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-600 mb-1">Emojis tomados:</div>
                      <div className="flex flex-wrap gap-2">
                        {teams.map(team => (
                          <span key={team.id} className="text-2xl px-3 py-1 rounded-lg border-2 border-gray-300 bg-gray-100 text-gray-400">
                            {team.emoji}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Show message if no emojis available */}
                  {TEAM_EMOJIS.every(emoji => teams.some(team => team.emoji === emoji)) && (
                    <div className="text-red-600 text-sm mt-2">
                      No hay emojis disponibles. Todos los emojis han sido tomados.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

                    {/* Debug info */}
          <div className="text-xs text-gray-500 mb-2">
            Debug: Teams: {teams.length}, Player: {playerName.trim() ? '✓' : '✗'}, Code: {joinCode.trim() ? '✓' : '✗'}
          </div>

          {/* Join Button - Show if player has name, code, and team selected */}
          {playerName.trim() && joinCode.trim() && selectedTeam && (
            <button
              onClick={handleJoinTeam}
              className="btn-primary w-full"
              disabled={!teams.find(t => t.id === selectedTeam) && !newTeamEmoji} // Disable if new team without emoji
            >
              ⚔️ Unirse a la Batalla
            </button>
          )}

          {/* Instructions if missing required fields */}
          {(!playerName.trim() || !joinCode.trim()) && (
            <div className="text-center text-gray-500 py-4">
              <div className="text-4xl mb-2">👤</div>
              <div>Ingresa tu nombre y el código del juego para comenzar</div>
            </div>
          )}
          
          {/* Instructions for team selection */}
          {playerName.trim() && joinCode.trim() && !selectedTeam && (
            <div className="text-center text-gray-500 py-2">
              <div className="text-sm">Escribe el nombre de tu equipo para crear uno nuevo</div>
            </div>
          )}
        </div>

        {/* Team Status */}
        {/* Remove any static team list or 'Equipos de Batalla' section. Only keep the dynamic team selection/join UI as already implemented. */}
      </div>
    </div>
  );
};

export default GameLobby; 