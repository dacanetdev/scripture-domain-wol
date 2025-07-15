import React, { useEffect } from 'react';
import { useGame } from '../context/GameContextBackend';
import { Response as TeamResponse } from '../types';
import Header from './Header';
import { SparklesIcon, BookOpenIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import AppLogo from './AppLogo';
import { formatTime } from '../utils/formatTime';

const Dashboard: React.FC = () => {
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
    scenarios: scenariosRaw
  } = useGame();
  const scenarios = scenariosRaw as any[];

  // Remove splitScenario and scenarioCase

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Connect to game if we have a gameId
  useEffect(() => {
    if (gameId) {
      // The context should already be connected, but let's make sure
    }
  }, [gameId]);

  // Show loading state while initializing
  if (isInitializing) {
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
      {/* Game Code Display - Very visible if available */}
      {gameId && (
        <div className="w-full flex justify-center mb-4 sm:mb-8 z-10">
          <div className="card bg-gradient-to-r from-yellow-200 via-light-gold to-victory-gold border-4 border-victory-gold rounded-2xl shadow-2xl px-4 py-4 sm:px-8 sm:py-6 flex flex-col items-center animate-glow">
            <div className="flex items-center gap-2 text-base sm:text-lg text-dark-purple font-bold mb-1 sm:mb-2">
              <ShieldCheckIcon className="w-6 h-6 text-victory-gold animate-bounce-slow" />
              Código del Juego
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
        {/* Current Round Details - Only show when round is active */}
        {hasRounds && scenarioObj && (
          <>
            <div className="mb-4 sm:mb-8 text-center">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-light-gold mb-1 sm:mb-2 tracking-wide drop-shadow flex items-center justify-center gap-2 animate-victory">
                <SparklesIcon className="w-8 h-8 text-yellow-300 animate-glow" />
                Ronda {currentRound}
              </h1>
              <h2 className="text-lg sm:text-3xl text-white mb-2 sm:mb-4 font-bold drop-shadow animate-fade-in">
                {gameState === 'round' ? '¡Ronda en curso! ⚡' : 'Esperando que el administrador inicie la ronda...'}
              </h2>
              {gameState === 'round' && (
                <div className="text-lg sm:text-2xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl px-4 py-3 shadow-xl border-4 border-light-gold drop-shadow animate-glow mb-2 sm:mb-4 scenario-text">
                  {scenarioObj.apply}
                </div>
              )}
            </div>
            {/* Large Timer */}
            {gameState === 'round' && (
              <div className="flex flex-col items-center mb-6 sm:mb-10">
                <div className="text-4xl sm:text-7xl font-extrabold text-light-gold bg-white px-6 py-3 sm:px-16 sm:py-6 rounded-3xl shadow-xl border-4 border-light-gold tracking-widest mb-1 sm:mb-2 drop-shadow animate-glow">
                  {formatTime(roundTimer)}
                </div>
                <div className="text-lg sm:text-2xl text-white font-bold drop-shadow animate-fade-in">⏰ Tiempo restante</div>
              </div>
            )}
          </>
        )}

        {/* Current Round Answers - Always show if at least one round exists */}
        {hasRounds && (
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
                      <td colSpan={4} className="text-center text-gray-400 py-2 sm:py-4">Sin respuestas aún.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Round Points - Always show if at least one round exists */}
        {hasRounds && (
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
        )}

        {/* Round History Table - Always show if at least one round exists */}
        {hasRounds && (
          <div className="mb-6 sm:mb-10">
            <h3 className="text-xl sm:text-3xl text-white font-bold mb-2 sm:mb-4 drop-shadow flex items-center gap-2 animate-fade-in">
              <BookOpenIcon className="w-6 h-6 text-celestial-blue animate-bounce" />
              Historial de Rondas
            </h3>
            <div className="card bg-white rounded-xl shadow-lg p-2 sm:p-6 overflow-x-auto animate-fade-in">
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
            </div>
          </div>
        )}

        {/* Overall Results - Always show if at least one round exists */}
        {hasRounds && (
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
                  {teamScores.map((team, idx) => (
                    <tr key={team.id} className="text-blue-900 text-base sm:text-2xl border-b border-gray-200">
                      <td className="py-1 sm:py-2 px-2 sm:px-4 text-center">{team.name} <span className="ml-1">{team.emoji}</span></td>
                      <td className="py-1 sm:py-2 px-2 sm:px-4 text-center font-bold">{team.totalScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 