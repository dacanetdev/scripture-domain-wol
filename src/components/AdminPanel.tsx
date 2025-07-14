import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../context/GameContextBackend';
import { Team, Response as TeamResponse, Scripture } from '../types';
import Header from './Header';
import { adminStorage } from '../utils/storage';

const AdminPanel: React.FC = () => {
  const {
    gameState,
    currentRound,
    currentScenario,
    teams,
    responses,
    roundTimer,
    setTeamRoundScore,
    nextRound,
    scenarios,
    scriptures,
    startGame,
    gameId,
    gameCode,
    isAdmin,
    startRound,
    setAdmin,
    teamRoundScores,
    isInitializing,
    connectToGameAsAdmin,
    isConnected
  } = useGame();

  // Add state for connecting to existing games
  const [joinCode, setJoinCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [confirmAdvance, setConfirmAdvance] = useState(false);
  
  // Add ref to prevent multiple connection attempts
  const connectionAttemptRef = useRef<string | null>(null);

  // Helper function to split scenario into scripture reference and case
  const splitScenario = (scenario: string) => {
    const dashIndex = scenario.indexOf(' - ');
    if (dashIndex === -1) {
      return { scripture: scenario, case: '' };
    }
    return {
      scripture: scenario.substring(0, dashIndex).trim(),
      case: scenario.substring(dashIndex + 3).trim()
    };
  };

  const { scripture: scenarioScripture, case: scenarioCase } = splitScenario(currentScenario);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => {
    console.log('AdminPanel: Initializing admin panel');
    setAdmin(true);
    
    // Check if admin has a saved game and connect to it
    const adminData = adminStorage.get();
    console.log('AdminPanel: Admin data from storage:', adminData);
    
    if (adminData && adminData.isAdmin && adminData.gameId && !gameId) {
      console.log('Admin has saved game, connecting to:', adminData.gameId);
      connectToGameAsAdmin(adminData.gameId);
    } else {
      console.log('AdminPanel: No saved game or already connected', { 
        hasAdminData: !!adminData, 
        isAdmin: adminData?.isAdmin, 
        hasGameId: !!adminData?.gameId, 
        currentGameId: gameId 
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect to backend when game code is entered
  useEffect(() => {
    if (joinCode.trim().length >= 3) {
      const trimmedCode = joinCode.trim();
      
      // Prevent multiple connection attempts for the same code
      if (connectionAttemptRef.current === trimmedCode) {
        return;
      }
      
      // Check if this admin is the original creator of this game
      const adminData = adminStorage.get();
      const isOriginalCreator = adminData && adminData.gameCode === trimmedCode;
      
      console.log('AdminPanel: Connecting to game:', { 
        joinCode: trimmedCode, 
        adminData, 
        isOriginalCreator,
        currentGameId: gameId,
        currentGameCode: gameCode,
        isInitializing,
        isConnected
      });
      
      // Mark this connection attempt
      connectionAttemptRef.current = trimmedCode;
      setIsConnecting(true);
      
      if (isOriginalCreator) {
        // If this is the original creator, connect using the full game ID
        console.log('Admin is original creator, connecting with full game ID:', adminData.gameId);
        connectToGameAsAdmin(adminData.gameId);
      } else {
        // If this is a new admin joining, connect using the game code
        console.log('New admin joining game with code:', trimmedCode);
        connectToGameAsAdmin(trimmedCode);
      }
      
      // Set a timeout to stop connecting if it takes too long
      const timeoutId = setTimeout(() => {
        console.log('AdminPanel: Connection timeout reached');
        setIsConnecting(false);
        connectionAttemptRef.current = null;
      }, 5000); // 5 second timeout
      
      return () => {
        clearTimeout(timeoutId);
        connectionAttemptRef.current = null;
      };
    } else {
      setIsConnecting(false);
      connectionAttemptRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinCode, gameId, gameCode, isInitializing, isConnected]);

  // Update connecting state based on connection status
  useEffect(() => {
    const trimmedCode = joinCode.trim();
    
    // Check if we're connected and have a game
    const isGameConnected = isConnected && !!gameId;
    
    console.log('AdminPanel: Connection status update:', {
      isGameConnected,
      isConnected,
      gameId,
      gameCode,
      joinCode: trimmedCode,
      isInitializing
    });
    
    // If we have a game and we're connected, stop connecting
    if (isGameConnected) {
      console.log('Game connected successfully:', { gameId, gameCode, joinCode: trimmedCode });
      setIsConnecting(false);
      connectionAttemptRef.current = null;
      
      // Save admin info if we don't have it already
      const adminData = adminStorage.get();
      if (!adminData || !adminData.gameId) {
        console.log('Saving admin info for connected game:', { gameId, gameCode });
        adminStorage.set({ isAdmin: true, gameId, gameCode: gameCode || undefined });
      }
    }
    
    // If we're not connected and we have a join code, keep connecting
    if (!isConnected && trimmedCode.length >= 3) {
      setIsConnecting(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, gameId, gameCode, joinCode]);



  // Show loading state while initializing - MUST be after all hooks
  // But allow admin to proceed if there's no game yet (for starting new games)
  if (isInitializing && gameId) {
    console.log('AdminPanel: Showing initializing state', { isInitializing, gameId, gameCode, isConnected });
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green p-4">
        <Header />
        <div className="max-w-md mx-auto">
          <div className="card p-8 text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <div className="text-lg text-dark-purple font-bold mb-2">Sincronizando con el juego...</div>
            <div className="text-gray-600">Conectando con el estado actual del juego...</div>
            <div className="text-xs text-gray-500 mt-2">
              Debug: {gameId} | {gameCode} | Connected: {isConnected ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debug: log game state changes
  // (Removed for production)

  // Safety check to ensure all variables are defined
  if (!teamRoundScores) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green p-4">
        <Header />
        <div className="max-w-md mx-auto">
          <div className="card p-8 text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <div className="text-lg text-dark-purple font-bold mb-2">Cargando...</div>
            <div className="text-gray-600">Por favor espera...</div>
          </div>
        </div>
      </div>
    );
  }

  // Removed unused variables

  const handlePointsChange = (teamId: string, points: number) => {
    // Update points immediately
    setTeamRoundScore(teamId, currentRound, points, 0);
  };

  const handleStartGame = () => {
    startGame(6);
  };

  const handleRestartGame = () => {
    // Clear all localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reload the page to reset everything
    window.location.reload();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTeamEmoji = (teamName: string): string => {
    switch (teamName) {
      case 'Equipo Luz': return '☀️';
      case 'Equipo Verdad': return '📖';
      case 'Equipo Fe': return '🙏';
      case 'Equipo Esperanza': return '🌟';
      case 'Equipo Caridad': return '❤️';
      case 'Equipo Virtud': return '✨';
      default: return '⚔️';
    }
  };

  // Validation logic for Next Round button
  const allResponsesScored = (() => {
    const teamsWithResponses = responses.length;
    const teamsWithScores = (teamRoundScores || []).filter(score => 
      score.roundNumber === currentRound
    ).length;
    return teamsWithResponses > 0 && teamsWithResponses === teamsWithScores;
  })();
  const roundIsOver = roundTimer === 0;
  const canProceedToNextRound = () => {
    return roundIsOver || allResponsesScored;
  };

  const getNextRoundButtonText = () => {
    if (teams.length === 0) {
      return '❌ No hay equipos para continuar';
    }
    
    if (!canProceedToNextRound()) {
      const teamsWithResponses = responses.length;
      const teamsWithScores = (teamRoundScores || []).filter(score => 
        score.roundNumber === currentRound
      ).length;
      
      if (roundTimer > 0) {
        return `⏳ Esperando respuestas (${formatTime(roundTimer)})`;
      } else {
        const unscoredResponses = teamsWithResponses - teamsWithScores;
        if (unscoredResponses > 0) {
          return `📝 Calificar ${unscoredResponses} respuesta${unscoredResponses !== 1 ? 's' : ''}`;
        } else {
          return '⚔️ Siguiente Ronda';
        }
      }
    }
    
    return currentRound >= 14 ? '🏁 Terminar Juego' : '⚔️ Siguiente Ronda';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green p-4">
      <Header />
      <div className="max-w-md mx-auto">
        {/* Game code always visible */}
        {gameId && (
          <div className="card p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Código del Juego:</p>
            <p className="text-2xl font-mono font-bold text-dark-purple bg-light-gold rounded-lg p-2">
              {gameCode?.toUpperCase()}
            </p>
          </div>
        )}
        {/* Remove timer display from admin panel */}
        {/* Keep scenario, responses, and controls only */}
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-light-gold mb-2">
            👑 Control de Administrador
          </h1>
          <h2 className="text-xl text-white mb-4">Ronda {currentRound}</h2>
        </div>

        {/* Connect to Existing Game - Show when no game is connected and admin doesn't have a saved game */}
        {!gameId && !adminStorage.get()?.gameId && (
          <div className="card p-6 mb-6">
            <h3 className="text-xl font-bold text-dark-purple mb-4">🔗 Conectar a Juego Existente</h3>
            <p className="text-sm text-gray-600 mb-4">
              Ingresa el código del juego para conectarte como administrador.
            </p>
            <div className="mb-4">
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                placeholder="Código del Juego (mínimo 3 caracteres)"
                className={`w-full px-4 py-3 border rounded-lg mb-2 ${
                  isConnecting ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                maxLength={20}
              />
              {isConnecting && (
                <div className="text-blue-600 text-sm mb-2">
                  🔄 Conectando al juego...
                  <div className="text-xs text-gray-500 mt-1">
                    {!isConnected ? "Estableciendo conexión..." : "Conectado, verificando juego..."}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Debug: Connected={isConnected}, GameId={gameId}, GameCode={gameCode}
                  </div>
                </div>
              )}
              {!isConnecting && joinCode.trim().length >= 3 && !isConnected && (
                <div className="text-red-600 text-sm mb-2">❌ Error de conexión. Verifica el código del juego.</div>
              )}
              {!isConnecting && joinCode.trim().length >= 3 && isConnected && gameId && (
                <div className="text-green-600 text-sm mb-2">✅ Conectado al juego</div>
              )}
            </div>
          </div>
        )}

        {/* New Admin Option - Show when admin has a saved game but wants to connect to a different game */}
        {!gameId && adminStorage.get()?.gameId && (
          <div className="card p-6 mb-6">
            <h3 className="text-xl font-bold text-dark-purple mb-4">🔄 Conectando a tu Juego</h3>
            <p className="text-sm text-gray-600 mb-4">
              Conectando automáticamente a tu juego guardado...
            </p>
            <div className="text-center">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <div className="text-blue-600">Conectando al juego...</div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  adminStorage.clear();
                  window.location.reload();
                }}
                className="w-full py-2 px-4 rounded-lg font-semibold transition-all bg-gray-600 hover:bg-gray-700 text-white border-2 border-gray-700"
              >
                🔄 Conectar a Otro Juego
              </button>
              <div className="text-sm text-gray-600 text-center mt-2">
                Si quieres conectarte como admin a un juego diferente
              </div>
            </div>
          </div>
        )}

        {/* Start Game Option - Show when game hasn't started */}
        {gameState === 'lobby' && (
          <div className="card p-6 mb-6">
            <h3 className="text-xl font-bold text-dark-purple mb-4">🚀 Iniciar Juego</h3>
            <p className="text-sm text-gray-600 mb-4">
              Haz clic en el botón para comenzar el juego. Todos los jugadores que se hayan unido a equipos participarán.
            </p>
            <button
              onClick={handleStartGame}
              className="btn-primary w-full"
            >
              🚀 Iniciar Nuevo Juego
            </button>
          </div>
        )}
        {/* Start Round Option - Show when game is playing and round hasn't started yet */}
        {gameState === 'playing' && isAdmin && (
          <div className="card p-6 mb-6">
            <h3 className="text-xl font-bold text-dark-purple mb-4">⚡ Iniciar Ronda</h3>
            <p className="text-sm text-gray-600 mb-4">
              Haz clic en el botón para iniciar la ronda actual y activar el temporizador.
            </p>
            <button
              onClick={startRound}
              className="btn-primary w-full"
            >
              ⚡ Iniciar Ronda
            </button>
          </div>
        )}
        {/* Current Scenario */}
        {currentRound > 0 && currentRound <= scenarios.length && (
          <div className="card p-6 mb-6">
            <h3 className="text-xl font-bold text-dark-purple mb-4">🎯 Escenario Actual</h3>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg">
                <div className="font-bold mb-2">Caso Misional:</div>
                "{scenarioCase}"
              </div>
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-4 rounded-lg">
                <div className="font-bold mb-2">Respuesta Correcta (Escritura):</div>
                "{scenarioScripture}"
              </div>
            </div>
          </div>
        )}
        {/* Team Responses */}
        {responses.length > 0 && (
          <div className="card p-6 mb-6">
            <h3 className="text-xl font-bold text-dark-purple mb-4">📝 Respuestas de Equipos</h3>
            <div className="space-y-4">
              {teams
                .filter(team => team.id !== 'admin' && team.id !== 'viewer') // Filter out admin and viewer teams
                .map((team: Team) => {
                  const response = responses.find((r: TeamResponse) => r.teamId === team.id);
                  const scripture = response ? scriptures.find((s: Scripture) => s.id === response.scriptureId) : null;
                
                return (
                  <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="text-2xl">{getTeamEmoji(team.name)}</div>
                      <div className="font-bold text-gray-800">{team.name}</div>
                      {response && (
                        <div className="text-sm text-green-600 font-bold">
                          ✓ Enviado ({response.speedScore} pts velocidad)
                        </div>
                      )}
                    </div>
                    
                    {response ? (
                      <div className="space-y-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm font-semibold text-blue-800 mb-1">
                            Escritura Seleccionada: {scripture?.reference}
                          </div>
                          <div className="text-xs text-blue-600">
                            "{scripture?.text.substring(0, 100)}..."
                          </div>
                        </div>
                        
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm font-semibold text-green-800 mb-1">
                            Respuesta del Equipo:
                          </div>
                          <div className="text-sm text-green-700">
                            "{response.response}"
                          </div>
                        </div>
                        {/* Total Points Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Puntos Totales (0-3)
                          </label>
                          <div className="flex space-x-2">
                            {[0, 1, 2, 3].map(points => {
                              const currentScore = (teamRoundScores || []).find(s => s.teamId === team.id && s.roundNumber === currentRound)?.totalScore || 0;
                              return (
                                <button
                                  key={points}
                                  onClick={() => handlePointsChange(team.id, points)}
                                  className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                                    currentScore === points
                                      ? 'border-light-gold bg-light-gold text-dark-purple'
                                      : 'border-gray-300 hover:border-light-gold'
                                  }`}
                                >
                                  {points}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-4">
                        ⏳ Esperando respuesta...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Admin Actions */}
        <div className="card p-6 mb-6">
          <h3 className="text-xl font-bold text-dark-purple mb-4">⚡ Acciones de Administrador</h3>
          <button
            onClick={() => {
              if (!roundIsOver && allResponsesScored && !confirmAdvance) {
                setConfirmAdvance(true);
              } else {
                setConfirmAdvance(false);
                nextRound();
              }
            }}
            disabled={!canProceedToNextRound()}
            className={`w-full mb-4 py-3 px-4 rounded-lg font-semibold transition-all ${
              canProceedToNextRound()
                ? 'btn-primary'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {getNextRoundButtonText()}
          </button>
          {/* Inline confirmation button if all answers are scored but timer is still running */}
          {allResponsesScored && !roundIsOver && confirmAdvance && (
            <button
              onClick={() => {
                setConfirmAdvance(false);
                nextRound();
              }}
              className="w-full mb-4 py-3 px-4 rounded-lg font-semibold transition-all bg-yellow-500 text-dark-purple border-2 border-yellow-700"
            >
              ✅ Confirmar y avanzar ahora (el tiempo no ha terminado)
            </button>
          )}
          {!canProceedToNextRound() && (
            <div className="text-sm text-gray-600 text-center">
              {teams.length === 0 
                ? 'No hay equipos registrados en el juego.'
                : roundTimer > 0
                  ? `Esperando respuestas de equipos o que termine el tiempo (${formatTime(roundTimer)}).`
                  : (() => {
                      const teamsWithResponses = responses.length;
                      const teamsWithScores = (teamRoundScores || []).filter(score => 
                        score.roundNumber === currentRound
                      ).length;
                      const unscoredResponses = teamsWithResponses - teamsWithScores;
                      return `Debes calificar ${unscoredResponses} respuesta${unscoredResponses !== 1 ? 's' : ''} antes de continuar.`;
                    })()
              }
            </div>
          )}
          
          {/* Emergency Restart Button */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <button
              onClick={handleRestartGame}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all bg-red-600 hover:bg-red-700 text-white border-2 border-red-700"
            >
              🔄 Reiniciar Juego
            </button>
            <div className="text-sm text-gray-600 text-center mt-2">
              ⚠️ Esto borrará todos los datos y reiniciará el juego desde el principio.
            </div>
          </div>
        </div>
        {/* Quick Stats */}
        <div className="card p-6">
          <h3 className="text-xl font-bold text-dark-purple mb-4">📊 Estadísticas Rápidas</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{teams.length}</div>
              <div className="text-gray-500">Equipos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{responses.length}</div>
              <div className="text-gray-500">Respuestas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{currentRound}</div>
              <div className="text-gray-500">Ronda</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{formatTime(roundTimer)}</div>
              <div className="text-gray-500">Tiempo Restante</div>
            </div>
          </div>
          
          {/* Debug Info */}
          {process.env.REACT_APP_DEBUG_MODE === 'true' && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
              <div className="font-bold mb-2">Debug Info:</div>
              <div>Game ID: {gameId || 'None'}</div>
              <div>Game Code: {gameCode || 'None'}</div>
              <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
              <div>Initializing: {isInitializing ? 'Yes' : 'No'}</div>
              <div>Teams Count: {teams.length}</div>
              <div>Teams: {teams.map(t => `${t.name}(${t.players.length})`).join(', ')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 