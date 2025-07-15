import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContextBackend';
import { playerStorage, gameSessionStorage, adminStorage } from '../utils/storage';
import Header from './Header';

const GameBoard: React.FC = () => {
  const {
    gameState,
    currentRound,
    teams,
    currentScenario,
    scriptures,
    submitResponse,
    responses,
    roundTimer,
    gameId,
    gameCode,
    setPlayerSelection,
    playerSelections,
    currentPlayer,
    isInitializing
  } = useGame();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<{ name: string; teamId: string } | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (!currentPlayer) {
      navigate('/lobby');
      return;
    }
    setPlayer(currentPlayer);
  }, [currentPlayer, navigate]);

  useEffect(() => {
    console.log('GameBoard teams:', teams);
    console.log('isPlayerJoined:', playerStorage.isJoined(teams, gameId));
    console.log('player:', player);
  }, [teams, player, gameId]);

  useEffect(() => {
    // Check if user is admin
    const isAdmin = adminStorage.isAdmin();
    const adminGameInfo = adminStorage.getGameInfo();
    const isAdminInGame = isAdmin && adminGameInfo && adminGameInfo.gameId === gameId;
    
    // Only redirect if player is not joined or if game state changes to something other than lobby
    const isPlayerJoined = playerStorage.isJoined(teams, gameId);
    const isUserJoined = isPlayerJoined || isAdminInGame;
    
    console.log('GameBoard navigation check:', {
      gameState,
      isPlayerJoined,
      isAdmin,
      isAdminInGame,
      isUserJoined,
      gameId,
      adminGameInfo
    });
    
    if (gameState === 'results' || gameState === 'finished') {
      navigate('/results');
    } else if (gameState === 'playing' || gameState === 'round') {
      navigate('/game');
    } else if (gameState === 'lobby' && !isUserJoined) {
      navigate('/lobby');
    }
    // If gameState is 'lobby' and user has joined (as player or admin), stay on /game
  }, [gameState, navigate, teams, gameId]);

  // Handle join by code (for future extensibility)
  const handleJoinByCode = () => {
    if (joinCode.trim().toLowerCase() === (gameId || '').toLowerCase().slice(-6)) {
      setJoinError('');
      // Allow join (in real app, would trigger backend join)
      // For now, just reload player info from sessionStorage
      const playerInfo = playerStorage.get();
      if (playerInfo) {
        setPlayer(playerInfo);
      }
    } else {
      setJoinError('Código de juego incorrecto.');
    }
  };

  // After all hooks, do your conditional returns:
  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <div className="text-lg text-dark-purple font-bold mb-2">Sincronizando con el juego...</div>
          <div className="text-gray-600">Conectando con el estado actual del juego...</div>
        </div>
      </div>
    );
  }

  if (!player) {
    const playerInfo = playerStorage.get();
    if (playerInfo) {
      // Player info exists but player state not set yet - show loading
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green">
          <div className="card p-8 max-w-md w-full text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <div className="text-lg text-dark-purple font-bold mb-2">Uniendo al equipo...</div>
            <div className="text-gray-600">Por favor espera...</div>
          </div>
        </div>
      );
    }
    // No player info - show join by code UI
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green">
        <div className="card p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-dark-purple">Unirse a un Juego</h2>
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            placeholder="Código del Juego"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
            maxLength={6}
          />
          {joinError && <div className="text-red-600 mb-2">{joinError}</div>}
          <button
            onClick={handleJoinByCode}
            className="btn-primary w-full"
          >
            Unirse
          </button>
        </div>
      </div>
    );
  }

  const team = teams.find(t => t.id === player.teamId);
  if (!team) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <div className="text-lg text-dark-purple font-bold mb-2">Buscando equipo...</div>
          <div className="text-gray-600">Equipo: {player.teamId}</div>
          <div className="text-gray-600">Jugador: {player.name}</div>
        </div>
      </div>
    );
  }

  // Check if this team has already submitted a response for this round
  const hasSubmitted = responses.some(r => r.teamId === team.id);
  
  // Get current player's selection
  const playerId = `${player.name}-${team.id}`;
  const playerSelection = playerSelections[playerId] || { selectedScripture: null, teamResponse: '' };

  // Remove splitScenario and scenarioCase
  let scenarioScripture = '';
  let scenarioKey = '';
  let scenarioCase = '';
  if (currentScenario && typeof currentScenario === 'object' && 'apply' in currentScenario) {
    scenarioScripture = (currentScenario as any).scripture || '';
    scenarioKey = (currentScenario as any).key || '';
    scenarioCase = (currentScenario as any).apply || '';
  } else if (typeof currentScenario === 'string') {
    scenarioCase = currentScenario;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green p-4">
      <Header />
      <div className="max-w-md mx-auto">
        {/* Welcome message for player - more visible and compact */}
        <div className="text-center mb-3 px-2">
          <div className="text-lg font-bold text-white drop-shadow">
            Bienvenido(a) {player.name} - Equipo {team.name} {team.emoji}
          </div>
        </div>
        {/* Game code always visible if in session */}
        {gameId && gameSessionStorage.get() === gameId && (
          <div className="card p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Código del Juego:</p>
            <p className="text-2xl font-mono font-bold text-dark-purple bg-light-gold rounded-lg p-2">
              {gameCode?.toUpperCase()}
            </p>
          </div>
        )}
        {/* Show content when game has started (playing or round state) */}
        {(gameState === 'playing' || gameState === 'round') && (
          <>
            {/* Show waiting message when round exists but hasn't started */}
            {gameState === 'playing' && (
              <div className="card p-6 mb-6 bg-blue-100 border-2 border-blue-400 shadow-lg flex flex-col items-center">
                <div className="text-5xl mb-4 animate-pulse">⏳</div>
                <div className="text-2xl font-extrabold text-blue-900 mb-2 text-center">En espera que se inicie la Ronda...</div>
                <div className="text-lg text-blue-800 font-semibold text-center mb-4">El administrador iniciará la ronda pronto.</div>
              </div>
            )}
            
            {/* Show round content when gameState is 'round' */}
            {gameState === 'round' && (
              <>
                <div className="card p-6 mb-6">
                  <h2 className="text-2xl font-bold text-dark-purple mb-2">Ronda {currentRound}</h2>
                  <div className="text-lg text-gray-700 mb-2">Caso Misional:</div>
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg mb-4">
                    "{scenarioCase}"
                  </div>
                  <div className="text-lg text-gray-700 mb-2">Equipo: <span className="font-bold">{team.name}</span></div>
                  <div className="text-lg text-gray-700 mb-2">Jugador: <span className="font-bold">{player.name}</span></div>
                  <div className="text-lg text-gray-700 mb-2">Tiempo restante: <span className="font-bold">{Math.floor(roundTimer/60)}:{(roundTimer%60).toString().padStart(2,'0')}</span></div>
                </div>
                {/* Scripture selection and response form */}
                <div className="card p-6 mb-6">
                  <h3 className="text-xl font-bold text-dark-purple mb-4">Selecciona una Escritura</h3>
                  
                  {/* Mobile-friendly scripture selector */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Escritura:
                    </label>
                    <select
                      value={playerSelection.selectedScripture || ''}
                      onChange={(e) => setPlayerSelection(playerId, e.target.value ? parseInt(e.target.value) : null, playerSelection.teamResponse)}
                      className="w-full p-4 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium text-xl min-h-[200px]"
                      disabled={hasSubmitted}
                      size={8}
                      style={{ fontSize: '18px', lineHeight: '1.5' }}
                    >
                      <option value="" style={{ fontSize: '18px', padding: '12px' }}>-- Selecciona una escritura --</option>
                      {scriptures.map(s => (
                        <option key={s.id} value={s.id} style={{ fontSize: '18px', padding: '12px' }}>
                          {s.reference}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Response textarea */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Explica cómo aplica la escritura:
                    </label>
                    <textarea
                      value={playerSelection.teamResponse}
                      onChange={e => setPlayerSelection(playerId, playerSelection.selectedScripture, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="Escribe tu respuesta aquí (máx 100 caracteres)"
                      maxLength={100}
                      disabled={hasSubmitted}
                      rows={3}
                    />
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {playerSelection.teamResponse.length}/100
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    onClick={() => submitResponse(team.id, playerId)}
                    className="btn-primary w-full"
                    disabled={!playerSelection.selectedScripture || !playerSelection.teamResponse.trim() || hasSubmitted}
                  >
                    {hasSubmitted ? 'Respuesta Enviada ✓' : 'Enviar Defensa'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GameBoard; 