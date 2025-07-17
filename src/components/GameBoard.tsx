import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContextBackend';
import { playerStorage, gameSessionStorage, adminStorage } from '../utils/storage';
import Header from './Header';
import JoinGameModal from './ReconnectModal'; // renamed component
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const GameBoard: React.FC = () => {
  const { gameState, currentRound, teams = [], currentScenario, scriptures, submitResponse, responses, roundTimer, gameId, gameCode, setPlayerSelection, playerSelections, currentPlayer, isInitializing, isConnected, dispatch } = useGame();
  const navigate = useNavigate();
  // Add missing state hooks
  const [showReconnectModal, setShowReconnectModal] = React.useState(false);
  const [isWaitingForJoin, setIsWaitingForJoin] = React.useState(false);
  const [joinCode, setJoinCode] = React.useState('');
  const [joinError, setJoinError] = React.useState('');
  const [waitingTimeout, setWaitingTimeout] = React.useState<NodeJS.Timeout | null>(null);

  // Robust waiting/loading state
  React.useEffect(() => {
    const playerInStorage = playerStorage.get();
    const isPlayerJoined = !!teams.find((t: any) => t.players.includes(currentPlayer?.name));
    if (!currentPlayer && playerInStorage) {
      // Show loading spinner and set a timeout to navigate to lobby if not joined after 3s
      if (!waitingTimeout) {
        const timeout = setTimeout(() => {
          // After 3s, if still not joined, navigate to lobby
          if (!currentPlayer || !isPlayerJoined) {
            navigate('/lobby');
          }
        }, 3000);
        setWaitingTimeout(timeout);
      }
    } else if (currentPlayer && isPlayerJoined && waitingTimeout) {
      // If player is joined, clear timeout
      clearTimeout(waitingTimeout);
      setWaitingTimeout(null);
    }
    // Cleanup on unmount
    return () => {
      if (waitingTimeout) clearTimeout(waitingTimeout);
    };
  }, [currentPlayer, teams, navigate, waitingTimeout]);

  useEffect(() => {
    console.log('GameBoard teams:', teams);
    console.log('isPlayerJoined:', playerStorage.isJoined(teams, gameId));
    console.log('currentPlayer:', currentPlayer);
  }, [teams, currentPlayer, gameId]);

  useEffect(() => {
    // Debounce navigation to allow state to update after reconnection
    const debounce = setTimeout(() => {
      // Check if user is admin
      const isAdmin = adminStorage.isAdmin();
      const adminGameInfo = adminStorage.getGameInfo();
      const isAdminInGame = isAdmin && adminGameInfo && adminGameInfo.gameId === gameId;
      // Check if player is joined using multiple methods
      const playerData = playerStorage.get();
      const hasPlayerData = playerData && playerData.name && playerData.teamId;
      const isConnectedToGame = isConnected && !!gameId;
      // User is considered joined if any of these conditions are met
      const isUserJoined = playerStorage.isJoined(teams, gameId) || isAdminInGame || (hasPlayerData && isConnectedToGame);
      if (isWaitingForJoin) {
        // Show spinner while waiting for confirmation
        if ((gameState === 'playing' || gameState === 'round') && isUserJoined) {
          setIsWaitingForJoin(false);
          navigate('/game');
        }
        // Don't navigate if not confirmed yet
        return;
      }
      if (gameState === 'results' || gameState === 'finished') {
        navigate('/results');
      } else if ((gameState === 'playing' || gameState === 'round') && isUserJoined) {
        navigate('/game');
      } else if (gameState === 'lobby' && !isUserJoined) {
        navigate('/lobby');
      }
      // If gameState is 'lobby' and user has joined (as player or admin), stay on /game
    }, 200); // 200ms debounce
    return () => clearTimeout(debounce);
  }, [gameState, navigate, teams, gameId, isConnected, isWaitingForJoin]);

  useEffect(() => {
    const isPlayerJoined = playerStorage.isJoined(teams, gameId);
    if (isPlayerJoined && !currentPlayer) {
      const playerData = playerStorage.get();
      if (playerData) {
        dispatch({ type: 'SET_CURRENT_PLAYER', payload: playerData });
      }
    }
  }, [teams, gameId, currentPlayer, dispatch]);

  useEffect(() => {
    const isPlayerJoined = playerStorage.isJoined(teams, gameId);
    if (isPlayerJoined && currentPlayer) {
      navigate('/game');
    }
  }, [teams, gameId, currentPlayer, navigate]);

  // Handle join by code (for future extensibility)
  const handleJoinByCode = () => {
    if (joinCode.trim().toLowerCase() === (gameId || '').toLowerCase().slice(-6)) {
      setJoinError('');
      // Allow join (in real app, would trigger backend join)
      // For now, just reload player info from sessionStorage
      const playerInfo = playerStorage.get();
      if (playerInfo) {
        dispatch({ type: 'SET_CURRENT_PLAYER', payload: playerInfo });
      }
    } else {
      setJoinError('Código de juego incorrecto.');
    }
  };

  // Handle reconnection
  const handleReconnect = () => {
    setShowReconnectModal(false);
    setIsWaitingForJoin(true);
    // Refresh player data from storage
    const playerInfo = playerStorage.get();
    if (playerInfo) {
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: playerInfo });
    }
    // Force a page reload to ensure fresh connection
    window.location.reload();
  };

  // Show loading spinner if player is in storage but not yet joined
  const playerInStorage = playerStorage.get();
  if (!currentPlayer && playerInStorage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <div className="text-lg text-dark-purple font-bold mb-2">Re-sincronizando con el juego...</div>
          <div className="text-gray-600">Por favor espera mientras se confirma tu conexión.</div>
        </div>
      </div>
    );
  }

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

  if (!currentPlayer) {
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

  const team = teams.find(t => t.id === currentPlayer.teamId);
  if (!team) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <div className="text-lg text-dark-purple font-bold mb-2">Buscando equipo...</div>
          <div className="text-gray-600">Equipo: {currentPlayer.teamId}</div>
          <div className="text-gray-600">Jugador: {currentPlayer.name}</div>
        </div>
      </div>
    );
  }

  // Check if this team has already submitted a response for this round
  const hasSubmitted = responses.some(r => r.teamId === team.id);
  
  // Get current player's selection
  const playerId = `${currentPlayer.name}-${team.id}`;
  const playerSelection = playerSelections[playerId] || { selectedScripture: null, teamResponse: '' };

  // Remove splitScenario and scenarioCase
  let scenarioCase = '';
  if (currentScenario && typeof currentScenario === 'object' && 'apply' in currentScenario) {
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
            Bienvenido(a) {currentPlayer.name} - Equipo {team.name} {team.emoji}
          </div>
        </div>
        {/* Game code always visible if in session */}
        {gameId && gameSessionStorage.get() === gameId && (
          <div className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Código del Juego:</p>
              <button
                onClick={() => setShowReconnectModal(true)}
                className="flex items-center gap-1 text-sm text-celestial-blue hover:text-blue-600 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Reconectar
              </button>
            </div>
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
                  <div className="text-lg text-gray-700 mb-2">Jugador: <span className="font-bold">{currentPlayer.name}</span></div>
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
      
      {/* Reconnect Modal */}
      <JoinGameModal
        isOpen={showReconnectModal}
        onClose={() => setShowReconnectModal(false)}
        onJoin={handleReconnect}
      />
      {isWaitingForJoin && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-celestial-blue mb-4"></div>
            <div className="text-lg font-bold text-dark-purple mb-2">Reconectando al juego...</div>
            <div className="text-gray-600">Esperando confirmación del servidor...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard; 