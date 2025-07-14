import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Team, Response as TeamResponse, Scripture } from '../types';
import Header from './Header';

const AdminPanel: React.FC = () => {
  const {
    gameState,
    currentRound,
    teams,
    responses,
    roundTimer,
    setTeamRoundScore,
    nextRound,
    scenarios,
    scriptures,
    startGame,
    gameId,
    isAdmin,
    startRound,
    setAdmin,
    teamRoundScores
  } = useGame();

  useEffect(() => {
    setAdmin(true);
  }, [setAdmin]); // Include setAdmin in dependencies

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
  const canProceedToNextRound = () => {
    // Check if there are teams
    if (teams.length === 0) {
      return false;
    }
    
    // Check if all teams that submitted responses have scores
    const teamsWithResponses = responses.length;
    const teamsWithScores = (teamRoundScores || []).filter(score => 
      score.roundNumber === currentRound
    ).length;
    
    // All teams that responded must have scores
    const allResponsesScored = teamsWithResponses === teamsWithScores;
    
    // Check if round is over (timer is 0) or all teams have responded
    const roundIsOver = roundTimer === 0;
    
    // Can proceed if: round is over AND all responses are scored
    return roundIsOver && allResponsesScored;
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
    
    return currentRound >= 12 ? '🏁 Terminar Juego' : '⚔️ Siguiente Ronda';
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
              {gameId.slice(-6).toUpperCase()}
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
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-4 rounded-lg">
              "{scenarios[currentRound - 1]}"
            </div>
          </div>
        )}
        {/* Team Responses */}
        {responses.length > 0 && (
          <div className="card p-6 mb-6">
            <h3 className="text-xl font-bold text-dark-purple mb-4">📝 Respuestas de Equipos</h3>
            <div className="space-y-4">
              {teams.map((team: Team) => {
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
                            {[0, 1, 2, 3].map(score => {
                              const currentScore = (teamRoundScores || []).find(s => s.teamId === team.id && s.roundNumber === currentRound)?.totalScore || 0;
                              return (
                                <button
                                  key={score}
                                  onClick={() => handlePointsChange(team.id, score)}
                                  className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                                    currentScore === score
                                      ? 'border-light-gold bg-light-gold text-dark-purple'
                                      : 'border-gray-300 hover:border-light-gold'
                                  }`}
                                >
                                  {score}
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
            onClick={nextRound}
            disabled={!canProceedToNextRound()}
            className={`w-full mb-4 py-3 px-4 rounded-lg font-semibold transition-all ${
              canProceedToNextRound()
                ? 'btn-primary'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {getNextRoundButtonText()}
          </button>
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
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 