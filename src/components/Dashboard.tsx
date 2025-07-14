import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContextBackend';
import { Response as TeamResponse } from '../types';
import Header from './Header';

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const Dashboard: React.FC = () => {
  const {
    gameState,
    currentRound,
    currentScenario,
    roundTimer,
    lastTimerUpdate,
    teams,
    responses,
    teamRoundScores,
    gameId
  } = useGame();

  // Local timer state for smooth updates
  const [localTimer, setLocalTimer] = useState(roundTimer);

  // Calculate the expected timer value based on lastTimerUpdate
  useEffect(() => {
    if (gameState === 'round') {
      const calcTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastTimerUpdate) / 1000);
        const expected = Math.max(0, roundTimer - elapsed);
        setLocalTimer(expected);
      };
      calcTimer();
      const interval = setInterval(calcTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setLocalTimer(roundTimer);
    }
  }, [gameState, roundTimer, lastTimerUpdate]);

  // Local timer countdown for smooth display
  // (Removed: now handled by the effect above)

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
  const teamScores = teams.map(team => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green flex flex-col items-center justify-start p-8">
      <Header />
      {/* Game Code Display - Very visible if available */}
      {gameId && (
        <div className="w-full flex justify-center mb-8">
          <div className="card bg-light-gold border-4 border-victory-gold rounded-2xl shadow-xl px-8 py-6 flex flex-col items-center">
            <div className="text-lg text-dark-purple font-bold mb-2">Código del Juego</div>
            <div className="text-4xl font-mono font-extrabold text-dark-purple tracking-widest drop-shadow">
              {gameId.slice(-6).toUpperCase()}
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-5xl mx-auto">
        {/* Current Round Details - Only show when round is active */}
        {hasRounds && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-5xl font-extrabold text-light-gold mb-2 tracking-wide drop-shadow">Ronda {currentRound}</h1>
              <h2 className="text-3xl text-white mb-4 font-bold drop-shadow">{gameState === 'round' ? '¡Ronda en curso!' : 'Esperando que el administrador inicie la ronda...'}</h2>
              {gameState === 'round' && (
                <div className="text-2xl text-light-gold font-bold mb-2 drop-shadow">{currentScenario}</div>
              )}
            </div>
            {/* Large Timer */}
            {gameState === 'round' && (
              <div className="flex flex-col items-center mb-10">
                <div className="text-7xl font-extrabold text-light-gold bg-white px-16 py-6 rounded-3xl shadow-xl border-4 border-light-gold tracking-widest mb-2 drop-shadow">
                  {Math.floor(localTimer/60)}:{(localTimer%60).toString().padStart(2,'0')}
                </div>
                <div className="text-2xl text-white font-bold drop-shadow">Tiempo restante</div>
              </div>
            )}
          </>
        )}

        {/* Current Round Answers - Always show if at least one round exists */}
        {hasRounds && (
          <div className="mb-10">
            <h3 className="text-3xl text-white font-bold mb-4 drop-shadow">Respuestas de la Ronda</h3>
            <div className="card bg-white rounded-xl shadow-lg p-6">
              <table className="w-full text-2xl">
                <thead>
                  <tr className="bg-light-gold text-dark-purple">
                    <th className="py-3 px-4">Orden</th>
                    <th className="py-3 px-4">Equipo</th>
                    <th className="py-3 px-4">Respuesta</th>
                    <th className="py-3 px-4">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRoundResponses.length > 0 ? (
                    currentRoundResponses.map((r, idx) => {
                      const team = teams.find(t => t.id === r.teamId);
                      return (
                        <tr key={r.teamId} className="text-dark-purple text-2xl border-b border-gray-200">
                          <td className="py-2 px-4 text-center font-bold">{idx + 1}</td>
                          <td className="py-2 px-4 text-center">{team ? team.name : r.teamId}</td>
                          <td className="py-2 px-4">{r.response}</td>
                          <td className="py-2 px-4 text-center font-mono">{formatTime(new Date(r.timestamp))}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center text-gray-400 py-4">Sin respuestas aún.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Round Points - Always show if at least one round exists */}
        {hasRounds && (
          <div className="mb-10">
            <h3 className="text-3xl text-white font-bold mb-4 drop-shadow">Puntos de la Ronda</h3>
            <div className="card bg-white rounded-xl shadow-lg p-6">
              <table className="w-full text-2xl">
                <thead>
                  <tr className="bg-green-200 text-green-900">
                    <th className="py-3 px-4">Equipo</th>
                    <th className="py-3 px-4">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map(team => {
                    const score = currentRoundScores.find(s => s.teamId === team.id);
                    return (
                      <tr key={team.id} className="text-green-900 text-2xl border-b border-gray-200">
                        <td className="py-2 px-4 text-center">{team.name}</td>
                        <td className="py-2 px-4 text-center font-bold">{score ? score.totalScore : '-'}</td>
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
          <div className="mb-10">
            <h3 className="text-3xl text-white font-bold mb-4 drop-shadow">Historial de Rondas</h3>
            <div className="card bg-white rounded-xl shadow-lg p-6 overflow-x-auto">
              <table className="w-full text-lg">
                <thead>
                  <tr>
                    <th className="py-2 px-4 bg-light-gold text-dark-purple">Ronda</th>
                    {teams.map(team => (
                      <th key={team.id} className="py-2 px-4 bg-light-gold text-dark-purple text-center">{team.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allRoundNumbers.map(roundNum => (
                    <tr key={roundNum} className={roundNum === currentRound ? 'bg-yellow-100 font-bold' : ''}>
                      <td className="py-2 px-4 text-center">{roundNum}</td>
                      {teams.map(team => {
                        const score = teamRoundScores.find(s => s.roundNumber === roundNum && s.teamId === team.id);
                        return (
                          <td key={team.id} className="py-2 px-4 text-center">
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
          <div className="mb-10">
            <h3 className="text-3xl text-white font-bold mb-4 drop-shadow">Resultados Generales</h3>
            <div className="card bg-white rounded-xl shadow-lg p-6">
              <table className="w-full text-2xl">
                <thead>
                  <tr className="bg-blue-200 text-blue-900">
                    <th className="py-3 px-4">Equipo</th>
                    <th className="py-3 px-4">Puntos Totales</th>
                  </tr>
                </thead>
                <tbody>
                  {teamScores.map((team, idx) => (
                    <tr key={team.id} className="text-blue-900 text-2xl border-b border-gray-200">
                      <td className="py-2 px-4 text-center">{team.name}</td>
                      <td className="py-2 px-4 text-center font-bold">{team.totalScore}</td>
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