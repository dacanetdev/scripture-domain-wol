import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContextBackend';
import { Response as TeamResponse } from '../types';
import Header from './Header';
import { SparklesIcon, BookOpenIcon, ShieldCheckIcon, StopIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import AppLogo from './AppLogo';
import { formatTime } from '../utils/formatTime';
import { useNavigate } from 'react-router-dom';
import QRCodeDisplay from './QRCodeDisplay';
import { adminStorage } from '../utils/storage';
import JoinGameModal from './ReconnectModal'; // renamed component

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [connectionTimeout, setConnectionTimeout] = useState(false);
  const {
    gameState,
    currentRound,
    currentScenario,
    roundTimer,
    teams,
    responses,
    teamRoundScores,
    gameId,
    gameCode,
    isInitializing,
    scenarios: scenariosRaw,
    endGame,
    connectToGameAsAdmin,
    isConnected
  } = useGame();
  const scenarios = scenariosRaw as any[];

  // Remove splitScenario and scenarioCase

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Initialize dashboard on mount - check for stored admin data or dashboard game code
  useEffect(() => {
    const adminData = adminStorage.get();
    const dashboardGameCode = localStorage.getItem('dashboardGameCode');
    
    if (adminData && adminData.gameId && !gameId && !isInitializing) {
      console.log('Dashboard: Found stored admin data, connecting to game:', adminData.gameId);
      connectToGameAsAdmin(adminData.gameId);
    } else if (dashboardGameCode && !gameId && !isInitializing) {
      console.log('Dashboard: Found dashboard game code, connecting to game:', dashboardGameCode);
      connectToGameAsAdmin(dashboardGameCode);
    }
  }, [connectToGameAsAdmin, gameId, isInitializing]); // Include dependencies to fix warning

  // Set up connection timeout
  useEffect(() => {
    if (isInitializing && !gameId) {
      const timeout = setTimeout(() => {
        console.log('Dashboard: Connection timeout reached');
        setConnectionTimeout(true);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    } else {
      setConnectionTimeout(false);
    }
  }, [isInitializing, gameId]);

  // Connect to game if we have a gameId
  useEffect(() => {
    if (gameId) {
      // The context should already be connected, but let's make sure
      console.log('Dashboard: Game ID available:', gameId);
    }
  }, [gameId]);

  // Navigate to results when game is finished
  useEffect(() => {
    if (gameState === 'finished') {
      navigate('/results');
    }
  }, [gameState, navigate]);

  // Handle end game button click
  const handleEndGame = () => {
    setShowEndGameModal(true);
  };

  // Handle end game confirmation
  const confirmEndGame = () => {
    endGame();
    setShowEndGameModal(false);
  };

  // Handle end game cancellation
  const cancelEndGame = () => {
    setShowEndGameModal(false);
  };

  // Handle retry connection
  const handleRetryConnection = () => {
    setConnectionTimeout(false);
    const adminData = adminStorage.get();
    const dashboardGameCode = localStorage.getItem('dashboardGameCode');
    
    if (adminData && adminData.gameId) {
      console.log('Dashboard: Retrying connection to game:', adminData.gameId);
      connectToGameAsAdmin(adminData.gameId);
    } else if (dashboardGameCode) {
      console.log('Dashboard: Retrying connection to game:', dashboardGameCode);
      connectToGameAsAdmin(dashboardGameCode);
    } else {
      console.log('Dashboard: No game data found for retry');
      navigate('/dashboard-access');
    }
  };

  // Handle reconnection from modal
  const handleReconnect = () => {
    setShowReconnectModal(false);
    // Force a page reload to ensure fresh connection
    window.location.reload();
  };

  // Show loading state while initializing
  // Only show loading if we don't have a gameId yet
  if (isInitializing && !gameId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green flex flex-col items-center justify-center p-8">
        <div className="card bg-white border-2 border-gray-300 rounded-xl shadow-lg px-8 py-6 text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <div className="text-2xl text-dark-purple font-bold mb-2">Conectando al juego...</div>
          <div className="text-lg text-gray-700 mb-2">
            Sincronizando con el estado actual del juego...
          </div>
          <div className="text-gray-500 text-sm">
            Por favor espera un momento.
          </div>
          {!isConnected && (
            <div className="mt-4 text-sm text-orange-600">
              🔄 Estableciendo conexión con el servidor...
            </div>
          )}
          {connectionTimeout && (
            <div className="mt-4">
              <div className="text-sm text-red-600 mb-3">
                ⚠️ Tiempo de conexión agotado
              </div>
              <button
                onClick={handleRetryConnection}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                🔄 Reintentar Conexión
              </button>
            </div>
          )}
          {/* Debug information */}
          {process.env.REACT_APP_DEBUG_MODE === 'true' && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-left">
              <div className="font-bold mb-2">Debug Info:</div>
              <div>Game ID: {gameId || 'None'}</div>
              <div>Game Code: {gameCode || 'None'}</div>
              <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
              <div>Initializing: {isInitializing ? 'Yes' : 'No'}</div>
              <div>Admin Data: {adminStorage.get() ? JSON.stringify(adminStorage.get()) : 'None'}</div>
              <div>Timeout: {connectionTimeout ? 'Yes' : 'No'}</div>
              <div>Game State: {gameState || 'None'}</div>
              <div>Current Round: {currentRound || 'None'}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show error state if no game is connected and no admin data or dashboard game code
  // Also show error if we have game data but no gameId after timeout
  const adminData = adminStorage.get();
  const dashboardGameCode = localStorage.getItem('dashboardGameCode');
  if ((!gameId && !adminData && !dashboardGameCode) || (connectionTimeout && !gameId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green flex flex-col items-center justify-center p-8">
        <div className="card bg-white border-2 border-gray-300 rounded-xl shadow-lg px-8 py-6 text-center">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-2xl text-dark-purple font-bold mb-2">No hay juego activo</div>
          <div className="text-lg text-gray-700 mb-4">
            No se encontró información de juego para conectar.
          </div>
          <button
            onClick={() => navigate('/dashboard-access')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Ir al Panel de Administrador
          </button>
        </div>
      </div>
    );
  }

  // Debug: log game state changes
  // (Removed for production)

  // Get current round responses, showing only the first response per team
  const currentRoundResponses = responses
    .filter(r => r)
    .reduce((acc: TeamResponse[], response) => {
      // Only add if this is the first response for this team
      if (!acc.find(r => r.teamId === response.teamId)) {
        acc.push(response);
      }
      return acc;
    }, [])
    .sort((a, b) => a.timestamp - b.timestamp);

  // Get current round scores from teamRoundScores
  const currentRoundScores = teamRoundScores
    .filter(s => s.roundNumber === currentRound)
    .sort((a, b) => b.totalScore - a.totalScore);

  // Get overall results from all rounds
  const teamScores = teams
    .filter(team => team.id !== 'admin' && team.id !== 'viewer') // Filter out admin and viewer teams
    .map(team => {
      const totalScore = teamRoundScores
        .filter(s => s.teamId === team.id)
        .reduce((sum, s) => sum + s.totalScore, 0);
      return {
        ...team,
        totalScore
      };
    }).sort((a, b) => b.totalScore - a.totalScore);

  // Determine if at least one round exists
  const hasRounds = currentRound > 0;
  // Get all round numbers that have ever existed (up to currentRound)
  const allRoundNumbers = Array.from({ length: currentRound }, (_, i) => i + 1);

  // Ensure currentScenario is always an object for display
  let scenarioObj: { scripture?: string; key?: string; apply: string } | null = null;
  if (currentScenario && typeof currentScenario === 'object' && 'apply' in currentScenario) {
    scenarioObj = currentScenario as { scripture?: string; key?: string; apply: string };
  } else if (currentScenario && typeof currentScenario === 'string') {
    const found = scenarios.find((s: any) => s.apply === currentScenario);
    scenarioObj = found ? found : { apply: currentScenario };
  } else {
    scenarioObj = { apply: '' };
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green flex flex-col items-center justify-start p-2 sm:p-4 md:p-8 relative overflow-x-hidden">
      {/* Decorative SVG background */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <AppLogo />
      </div>
      <Header />
      
      {/* End Game Button - Show when game has started */}
      {hasRounds && gameState !== 'finished' && (
        <div className="w-full flex justify-center mb-4 sm:mb-6 z-10">
          <button
            onClick={handleEndGame}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg border-2 border-red-400 transition-all duration-200 transform hover:scale-105 flex items-center gap-2 animate-pulse"
          >
            <StopIcon className="w-6 h-6" />
            Terminar Juego
          </button>
        </div>
      )}

      {/* QR Code Display - Show when game is active */}
      {gameId && gameCode && (
        <div className="w-full max-w-sm mx-auto mb-4 sm:mb-6 z-10">
          <QRCodeDisplay gameCode={gameCode} gameId={gameId} />
        </div>
      )}

      {/* Game Code Display - Very visible if available */}
      {gameId && (
        <div className="w-full flex justify-center mb-4 sm:mb-8 z-10">
          <div className="card bg-gradient-to-r from-yellow-200 via-light-gold to-victory-gold border-4 border-victory-gold rounded-2xl shadow-2xl px-4 py-4 sm:px-8 sm:py-6 flex flex-col items-center animate-glow">
            <div className="flex items-center justify-between w-full mb-1 sm:mb-2">
              <div className="flex items-center gap-2 text-base sm:text-lg text-dark-purple font-bold">
                <ShieldCheckIcon className="w-6 h-6 text-victory-gold animate-bounce-slow" />
                Código del Juego
              </div>
              <button
                onClick={() => setShowReconnectModal(true)}
                className="flex items-center gap-1 text-sm text-dark-purple hover:text-blue-600 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Reconectar
              </button>
            </div>
            <div className="text-2xl sm:text-4xl font-mono font-extrabold text-dark-purple tracking-widest drop-shadow animate-pulse-slow">
              {gameCode?.toUpperCase()}
            </div>
          </div>
        </div>
      )}
      {/* Show message if no rounds yet */}
      {!hasRounds && (
        <div className="w-full flex flex-col items-center mt-4 sm:mt-8 z-10">
          <div className="card bg-white border-2 border-gray-300 rounded-xl shadow-xl px-4 py-4 sm:px-8 sm:py-6 text-center animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-xl sm:text-2xl text-dark-purple font-bold mb-1 sm:mb-2">
              <BookOpenIcon className="w-7 h-7 text-celestial-blue animate-bounce" />
              ¡Bienvenido al juego!
            </div>
            <div className="text-base sm:text-lg text-gray-700 mb-1 sm:mb-2">
              Esperando a que el administrador inicie la primera ronda...
            </div>
            <div className="text-gray-500 text-xs sm:text-sm">
              Comparte el código del juego con los equipos para que se unan.
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-5xl mx-auto z-10">
        {/* Current Round Details - Show even if no rounds yet */}
        <div className="mb-4 sm:mb-8 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-light-gold mb-1 sm:mb-2 tracking-wide drop-shadow flex items-center justify-center gap-2 animate-victory">
            <SparklesIcon className="w-8 h-8 text-yellow-300 animate-glow" />
            {hasRounds ? `Ronda ${currentRound}` : 'Esperando Primera Ronda'}
          </h1>
          <h2 className="text-lg sm:text-3xl text-white mb-2 sm:mb-4 font-bold drop-shadow animate-fade-in">
            {gameState === 'round' ? '¡Ronda en curso! ⚡' : 'Esperando que el administrador inicie la ronda...'}
          </h2>
          {gameState === 'round' && scenarioObj && (
            <div className="text-lg sm:text-2xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl px-4 py-3 shadow-xl border-4 border-light-gold drop-shadow animate-glow mb-2 sm:mb-4 scenario-text">
              {scenarioObj.apply}
            </div>
          )}
        </div>
        
        {/* Large Timer - Show even if no rounds yet */}
        <div className="flex flex-col items-center mb-6 sm:mb-10">
          <div className="text-4xl sm:text-7xl font-extrabold text-light-gold bg-white px-6 py-3 sm:px-16 sm:py-6 rounded-3xl shadow-xl border-4 border-light-gold tracking-widest mb-1 sm:mb-2 drop-shadow animate-glow">
            {gameState === 'round' ? formatTime(roundTimer) : '--:--'}
          </div>
          <div className="text-lg sm:text-2xl text-white font-bold drop-shadow animate-fade-in">
            {gameState === 'round' ? '⏰ Tiempo restante' : '⏰ Timer'}
          </div>
        </div>

        {/* Current Round Answers - Always show */}
        <div className="mb-6 sm:mb-10">
          <h3 className="text-xl sm:text-3xl text-white font-bold mb-2 sm:mb-4 drop-shadow flex items-center gap-2 animate-fade-in">
            <BookOpenIcon className="w-6 h-6 text-celestial-blue animate-bounce" />
            Respuestas de la Ronda
          </h3>
          <div className="card bg-white rounded-xl shadow-lg p-2 sm:p-6 overflow-x-auto animate-fade-in">
            <table className="w-full min-w-[500px] text-base sm:text-2xl">
              <thead>
                <tr className="bg-light-gold text-dark-purple">
                  <th className="py-2 sm:py-3 px-2 sm:px-4">Orden</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-4">Equipo</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-4">Jugador</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-4">Hora</th>
                </tr>
              </thead>
              <tbody>
                {currentRoundResponses.length > 0 ? (
                  currentRoundResponses.map((r, idx) => {
                    const team = teams.find(t => t.id === r.teamId);
                    // Always use playerName from response
                    const playerName = r.playerName || '\u2014';
                    return (
                      <tr key={r.teamId + '-' + idx} className="text-dark-purple text-base sm:text-2xl border-b border-gray-200">
                        <td className="py-1 sm:py-2 px-2 sm:px-4 text-center font-bold">{idx + 1}</td>
                        <td className="py-1 sm:py-2 px-2 sm:px-4 text-center">{team ? team.name : r.teamId} <span className="ml-1">{team?.emoji}</span></td>
                        <td className="py-1 sm:py-2 px-2 sm:px-4">{playerName}</td>
                        <td className="py-1 sm:py-2 px-2 sm:px-4 text-center font-mono">{new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-2 sm:py-4">
                      {hasRounds ? 'Sin respuestas aún.' : 'Las respuestas aparecerán aquí cuando comience la ronda.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Round Points - Always show */}
        <div className="mb-6 sm:mb-10">
          <h3 className="text-xl sm:text-3xl text-white font-bold mb-2 sm:mb-4 drop-shadow flex items-center gap-2 animate-fade-in">
            <ShieldCheckIcon className="w-6 h-6 text-green-600 animate-bounce-slow" />
            Puntos de la Ronda
          </h3>
          <div className="card bg-white rounded-xl shadow-lg p-2 sm:p-6 overflow-x-auto animate-fade-in">
            <table className="w-full min-w-[300px] text-base sm:text-2xl">
              <thead>
                <tr className="bg-green-200 text-green-900">
                  <th className="py-2 sm:py-3 px-2 sm:px-4">Equipo</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-4">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {teams
                  .filter(team => team.id !== 'admin' && team.id !== 'viewer') // Filter out admin and viewer teams
                  .map(team => {
                    const score = currentRoundScores.find(s => s.teamId === team.id);
                    return (
                      <tr key={team.id} className="text-green-900 text-base sm:text-2xl border-b border-gray-200">
                        <td className="py-1 sm:py-2 px-2 sm:px-4 text-center">{team.name} <span className="ml-1">{team.emoji}</span></td>
                        <td className="py-1 sm:py-2 px-2 sm:px-4 text-center font-bold">{score ? score.totalScore : '-'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Round History Table - Always show */}
        <div className="mb-6 sm:mb-10">
          <h3 className="text-xl sm:text-3xl text-white font-bold mb-2 sm:mb-4 drop-shadow flex items-center gap-2 animate-fade-in">
            <BookOpenIcon className="w-6 h-6 text-celestial-blue animate-bounce" />
            Historial de Rondas
          </h3>
          <div className="card bg-white rounded-xl shadow-lg p-2 sm:p-6 overflow-x-auto animate-fade-in">
            {hasRounds ? (
              <table className="w-full min-w-[300px] text-xs sm:text-lg">
                <thead>
                  <tr>
                    <th className="py-1 sm:py-2 px-2 sm:px-4 bg-light-gold text-dark-purple">Ronda</th>
                    {teams
                      .filter(team => team.id !== 'admin' && team.id !== 'viewer') // Filter out admin and viewer teams
                      .map(team => (
                        <th key={team.id} className="py-1 sm:py-2 px-2 sm:px-4 bg-light-gold text-dark-purple text-center">{team.name} <span className="ml-1">{team.emoji}</span></th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {allRoundNumbers.map(roundNum => (
                    <tr key={roundNum} className={roundNum === currentRound ? 'bg-yellow-100 font-bold' : ''}>
                      <td className="py-1 sm:py-2 px-2 sm:px-4 text-center">{roundNum}</td>
                      {teams
                        .filter(team => team.id !== 'admin' && team.id !== 'viewer') // Filter out admin and viewer teams
                        .map(team => {
                          const score = teamRoundScores.find(s => s.roundNumber === roundNum && s.teamId === team.id);
                          return (
                            <td key={team.id} className="py-1 sm:py-2 px-2 sm:px-4 text-center">
                              {score ? score.totalScore : '-'}
                            </td>
                          );
                        })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-2">📊</div>
                <div className="text-lg">El historial de rondas aparecerá aquí cuando comience el juego.</div>
              </div>
            )}
          </div>
        </div>

        {/* Overall Results - Always show */}
        <div className="mb-6 sm:mb-10">
          <h3 className="text-xl sm:text-3xl text-white font-bold mb-2 sm:mb-4 drop-shadow flex items-center gap-2 animate-fade-in">
            <SparklesIcon className="w-6 h-6 text-yellow-300 animate-glow" />
            Resultados Generales
          </h3>
          <div className="card bg-white rounded-xl shadow-lg p-2 sm:p-6 overflow-x-auto animate-fade-in">
            <table className="w-full min-w-[300px] text-base sm:text-2xl">
              <thead>
                <tr className="bg-blue-200 text-blue-900">
                  <th className="py-2 sm:py-3 px-2 sm:px-4">Equipo</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-4">Puntos Totales</th>
                </tr>
              </thead>
              <tbody>
                {teamScores.length > 0 ? (
                  teamScores.map((team, idx) => (
                    <tr key={team.id} className="text-blue-900 text-base sm:text-2xl border-b border-gray-200">
                      <td className="py-1 sm:py-2 px-2 sm:px-4 text-center">{team.name} <span className="ml-1">{team.emoji}</span></td>
                      <td className="py-1 sm:py-2 px-2 sm:px-4 text-center font-bold">{team.totalScore}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center text-gray-400 py-8">
                      <div className="text-4xl mb-2">🏆</div>
                      <div className="text-lg">Los resultados generales aparecerán aquí cuando se completen las rondas.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* End Game Confirmation Modal */}
      {showEndGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full text-center animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <div className="text-3xl">🏁</div>
              <button
                onClick={cancelEndGame}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <h2 className="text-2xl font-bold text-dark-purple mb-3">
              Terminar Juego
            </h2>
            
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que quieres terminar el juego y mostrar los resultados finales?
            </p>
            
            <p className="text-sm text-red-600 mb-6">
              ⚠️ Esta acción no se puede deshacer.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={cancelEndGame}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmEndGame}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Terminar Juego
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reconnect Modal */}
      <JoinGameModal
        isOpen={showReconnectModal}
        onClose={() => setShowReconnectModal(false)}
        onJoin={handleReconnect}
      />
    </div>
  );
};

export default Dashboard; 