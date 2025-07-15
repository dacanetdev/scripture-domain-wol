import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContextBackend';
import { playerStorage, gameSessionStorage } from '../utils/storage';
import Header from './Header';
import { BookOpenIcon, ShieldCheckIcon, UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import AppLogo from './AppLogo';

const DEBUG_MODE = process.env.REACT_APP_DEBUG_MODE === 'true';

const TEAM_EMOJIS = ['☀️', '📖', '🙏', '🌟', '❤️', '✨', '⚡', '🦁', '🐉', '🦅'];

const GameLobby: React.FC = () => {
  const { teams, gameId, gameCode, isAdmin, gameState, joinTeam, connectToGame, isConnected, isInitializing } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [viewGameValid, setViewGameValid] = useState(false);
  const [newTeamEmoji, setNewTeamEmoji] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
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
    const isPlayerJoined = playerStorage.isJoined(teams, gameId);
    console.log('Navigation useEffect:', { 
      isPlayerJoined, 
      gameState, 
      gameId, 
      teams: teams.length,
      playerData: playerStorage.get(),
      sessionGameId: gameSessionStorage.get()
    });
    
    if (isPlayerJoined) {
      if (gameState === 'playing' || gameState === 'round') {
        console.log('Redirecting to /game (playing/round)');
        navigate('/game');
      } else if (gameState === 'results') {
        console.log('Redirecting to /results');
        navigate('/results');
      } else if (gameState === 'lobby') {
        // If player has joined a team, go to game screen even in lobby state
        console.log('Redirecting to /game (lobby state)');
        navigate('/game');
      }
    }
  }, [gameState, navigate, teams, gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debug logging
  useEffect(() => {
    console.log('GameLobby rendered:', { isAdmin, teams: teams.length, gameId });
  }, [isAdmin, teams, gameId]);

  // Connect to backend when game code is entered
  useEffect(() => {
    if (joinCode.trim().length >= 3) {
      // Connect to the game on backend using the game code as gameId
      const gameId = joinCode.trim();
      setIsConnecting(true);
      connectToGame(gameId);
      
      // Set a timeout to stop connecting if it takes too long
      const timeoutId = setTimeout(() => {
        setIsConnecting(false);
      }, 3000); // 3 second timeout
      
      return () => clearTimeout(timeoutId);
    } else {
      setIsConnecting(false);
    }
  }, [joinCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update connecting state and viewGameValid based on connection status
  useEffect(() => {
    const trimmedCode = joinCode.trim();
    const isValidLength = trimmedCode.length >= 3;
    const isGameConnected = isConnected && !!gameId; // Check if we have a gameId (meaning we found and connected to a game)
    
    // Update connecting state
    if (isGameConnected) {
      setIsConnecting(false);
    }
    
    // Update viewGameValid - check if we have a gameId and the gameCode matches
    setViewGameValid(isValidLength && !!gameId && gameCode === trimmedCode);
  }, [isConnected, gameId, gameCode, joinCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time validation of game code
  // Game code change handler is now inline in the input onChange

  const handleJoinTeam = () => {
    if (!playerName.trim() || !selectedTeam) return;
    if (!joinCode.trim()) {
      setJoinError('Por favor ingresa el código del juego.');
      return;
    }
    if (!gameId) {
      setJoinError('No se pudo conectar al juego. Verifica el código.');
      return;
    }
    console.log('handleJoinTeam START:', { selectedTeam, playerName, newTeamEmoji, joinCode, gameId });
    
    joinTeam(selectedTeam, playerName.trim(), newTeamEmoji);
    
    const playerData = {
      name: playerName.trim(),
      teamId: selectedTeam,
      gameId: gameId // Use the full gameId from context, not the partial code
    };
    console.log('Saving player data:', playerData);
    playerStorage.set(playerData);
    
    // Set game session to ensure isJoined check works properly
    console.log('Setting game session:', gameId);
    gameSessionStorage.set(gameId);
    
    console.log('handleJoinTeam END - clearing form state');
    setPlayerName('');
    setSelectedTeam(null);
    setJoinCode('');
    setJoinError('');
    setNewTeamEmoji('');
    // Remove immediate navigation - let useEffect handle it based on game state
  };

  const realTeams = teams.filter(team => team.id !== 'viewer' && team.id !== 'admin');

  // Only enable join if connected to the correct game
  const canJoin = playerName.trim() && joinCode.trim() && selectedTeam && isConnected && gameCode === joinCode.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green p-2 sm:p-4 relative overflow-x-hidden">
      {/* Decorative SVG background */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10">
        <AppLogo />
      </div>
      <Header />
      <div className="max-w-md mx-auto z-10">
        {DEBUG_MODE && gameId && isConnected && (
          <div className="card p-4 mb-4 animate-fade-in">
            <p className="text-sm text-gray-600 mb-2 flex items-center gap-2"><ShieldCheckIcon className="w-5 h-5 text-victory-gold animate-bounce-slow" /> Juego Conectado:</p>
            <p className="text-2xl font-mono font-bold text-dark-purple bg-light-gold rounded-lg p-2 animate-pulse-slow">
              {gameId.toUpperCase()}
            </p>
            <p className="text-xs text-green-600 mt-1">✅ Conectado y listo para jugar</p>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline flex items-center gap-1"
            >
              <ArrowRightIcon className="w-4 h-4" /> Conectar a otro juego
            </button>
          </div>
        )}

        {/* Player Join Section */}
        <div className="card p-4 sm:p-6 mb-6 bg-white/90 rounded-2xl shadow-2xl animate-fade-in">
          <h3 className="text-xl sm:text-2xl font-bold text-dark-purple mb-4 flex items-center gap-2">
            <UserGroupIcon className="w-6 h-6 text-celestial-blue animate-bounce" />
            Únete a la Batalla
          </h3>
          {/* Always require game code to join */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <ShieldCheckIcon className="w-5 h-5 text-victory-gold animate-glow" /> Ingresa el código del juego
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={e => {
                setJoinCode(e.target.value);
                setJoinError('');
              }}
              placeholder="Código del Juego (mínimo 3 caracteres)"
              className={`w-full px-4 py-3 border rounded-lg mb-2 text-lg font-mono tracking-widest ${
                isConnecting ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              maxLength={20}
            />
            {isConnecting && (
              <div className="text-blue-600 text-sm mb-2 flex items-center gap-1">
                <ArrowRightIcon className="w-4 h-4 animate-bounce-slow" /> Conectando al juego...
                <div className="text-xs text-gray-500 mt-1">
                  {!isConnected ? "Estableciendo conexión..." : "Conectado, verificando juego..."}
                </div>
              </div>
            )}
            {!isConnecting && joinCode.trim().length >= 3 && !isConnected && (
              <div className="text-red-600 text-sm mb-2">❌ Error de conexión. Verifica el código del juego.</div>
            )}
            {!isConnecting && joinCode.trim().length >= 3 && isConnected && gameCode === joinCode.trim() && (
              <div className="text-green-600 text-sm mb-2">✅ Conectado al juego</div>
            )}
            {joinError && <div className="text-red-600 mb-2">{joinError}</div>}
            {/* Ver Juego button for projection */}
            {viewGameValid && (
              <button
                onClick={async () => {
                  // Connect to game
                  connectToGame(joinCode.trim());
                  // Wait for state synchronization to complete
                  let attempts = 0;
                  const maxAttempts = 50; // 5 seconds max wait
                  while (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                    if (!isInitializing) {
                      break;
                    }
                  }
                  navigate('/dashboard');
                }}
                className="btn-secondary w-full text-xl py-3 mb-2 bg-yellow-400 text-dark-purple font-bold rounded-lg shadow hover:bg-yellow-500 flex items-center justify-center gap-2"
                style={{ marginBottom: '1rem' }}
              >
                <BookOpenIcon className="w-6 h-6 text-celestial-blue animate-glow" /> Ver Juego
              </button>
            )}
          </div>
          {/* Player Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <UserGroupIcon className="w-5 h-5 text-yellow-400 animate-bounce" /> Tu Nombre
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ingresa tu nombre"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-gold focus:border-transparent text-lg"
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
              {realTeams.length > 0 && (
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-2"
                  value={selectedTeam || ''}
                  onChange={e => setSelectedTeam(e.target.value)}
                >
                  <option value="">-- Elige un equipo existente --</option>
                  {realTeams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.emoji} {team.name} ({team.players.length} jugadores)
                    </option>
                  ))}
                </select>
              )}
              
              {/* Always show input for creating new team if under 6 teams */}
              {realTeams.length < 6 && (
                <div className="mb-2">
                  <input
                    type="text"
                    value={selectedTeam && !realTeams.find(t => t.id === selectedTeam) ? selectedTeam : ''}
                    onChange={e => setSelectedTeam(e.target.value)}
                    placeholder="O escribe el nombre de un equipo nuevo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    maxLength={20}
                  />
                </div>
              )}
              
              {/* Show error if max teams reached */}
              {realTeams.length >= 6 && !selectedTeam && (
                <div className="text-red-600 text-sm mb-2">Máximo 6 equipos. Selecciona uno existente.</div>
              )}
              
              {/* Show emoji selection for new teams */}
              {realTeams.length < 6 && selectedTeam && !realTeams.find(t => t.id === selectedTeam) && (
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Elige un emoji para tu equipo</label>
                  
                  {/* Show available emojis */}
                  <div className="mb-2">
                    <div className="text-xs text-gray-600 mb-1">Emojis disponibles:</div>
                    <div className="flex flex-wrap gap-2">
                      {TEAM_EMOJIS
                        .filter(emoji => !realTeams.some(team => team.emoji === emoji)) // Filter out emojis already taken
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
                  {realTeams.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-600 mb-1">Emojis tomados:</div>
                      <div className="flex flex-wrap gap-2">
                        {realTeams.map(team => (
                          <span key={team.id} className="text-2xl px-3 py-1 rounded-lg border-2 border-gray-300 bg-gray-100 text-gray-400">
                            {team.emoji}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Show message if no emojis available */}
                  {TEAM_EMOJIS.every(emoji => realTeams.some(team => team.emoji === emoji)) && (
                    <div className="text-red-600 text-sm mt-2">
                      No hay emojis disponibles. Todos los emojis han sido tomados.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Show message if there are no real teams yet */}
          {realTeams.length === 0 && (
            <div className="text-gray-500 text-sm mt-2">No hay equipos aún. ¡Crea el primero!</div>
          )}

                    {/* Debug info */}
          <div className="text-xs text-gray-500 mb-2">
            Debug: Teams: {teams.length}, Player: {playerName.trim() ? '✓' : '✗'}, Code: {joinCode.trim() ? '✓' : '✗'}
          </div>

          {/* Join Button - Show if player has name, code, and team selected */}
          {playerName.trim() && joinCode.trim() && selectedTeam && (
            <button
              onClick={() => {
                handleJoinTeam();
                setNewTeamEmoji('');
                setSelectedTeam(null);
              }}
              className="btn-primary w-full"
              disabled={!canJoin}
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