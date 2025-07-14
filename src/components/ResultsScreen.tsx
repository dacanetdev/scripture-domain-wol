import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Header from './Header';

const ResultsScreen: React.FC = () => {
  const { gameResults, teams, responses, scenarios, gameState } = useGame();
  const navigate = useNavigate();

  // Always redirect to the correct screen based on gameState
  React.useEffect(() => {
    if (gameState === 'lobby') {
      navigate('/lobby');
    } else if (gameState === 'playing' || gameState === 'round') {
      navigate('/game');
    } else if (gameState === 'results') {
      navigate('/results');
    }
  }, [gameState, navigate]);

  if (!gameResults) return null;

  // Calculate final rankings
  const teamRankings = teams.map(team => ({
    ...team,
    totalScore: gameResults[team.id] || 0,
    responseCount: responses.filter(r => r.teamId === team.id).length
  })).sort((a, b) => b.totalScore - a.totalScore);

  const winner = teamRankings[0];
  const isTie = teamRankings.length > 1 && teamRankings[0].totalScore === teamRankings[1].totalScore;

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

  const getPositionBadge = (index: number): string => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}.`;
    }
  };

  const handleNewGame = () => {
    window.location.reload();
  };

  const handleExportResults = () => {
    const resultsText = `Dominio de las Escrituras: Guerra de la Luz - Resultados Finales

🏆 CLASIFICACIÓN FINAL:
${teamRankings.map((team, index) => 
  `${getPositionBadge(index)} ${team.name} - ${team.totalScore} puntos`
).join('\n')}

👑 CAMPEÓN: ${winner.name}
${isTie ? '🤝 ¡EMPATE!' : ''}

📊 ESTADÍSTICAS DEL JUEGO:
- Total de Rondas: ${scenarios.length}
- Total de Respuestas: ${responses.length}
- Equipos Participantes: ${teams.length}

Generado el ${new Date().toLocaleDateString()}`;

    const blob = new Blob([resultsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resultados-dominio-escrituras.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green p-4">
      <Header />
      <div className="max-w-md mx-auto">
        {/* Victory Header */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-bounce-slow">🏆</div>
          <h1 className="text-4xl font-bold text-light-gold mb-2">
            Campeón de la Ciudad de Luz
          </h1>
          <h2 className="text-2xl text-white mb-4">
            {isTie ? '🤝 ¡Empate!' : `${winner.name}`}
          </h2>
          {!isTie && (
            <div className="text-6xl mb-4 animate-victory">
              {getTeamEmoji(winner.name)}
            </div>
          )}
        </div>

        {/* Winner Celebration */}
        {!isTie && (
          <div className="card p-6 mb-6 text-center animate-glow">
            <div className="text-4xl mb-4">👑</div>
            <h3 className="text-2xl font-bold text-dark-purple mb-2">
              {winner.name}
            </h3>
            <div className="text-3xl font-bold text-light-gold mb-2">
              {winner.totalScore} Puntos
            </div>
            <div className="text-sm text-gray-600">
              {winner.responseCount} respuestas • {winner.players.length} guerreros
            </div>
          </div>
        )}

        {/* Final Standings */}
        <div className="card p-6 mb-6">
          <h3 className="text-xl font-bold text-dark-purple mb-4">🏆 Clasificación Final</h3>
          <div className="space-y-3">
            {teamRankings.map((team, index) => (
              <div
                key={team.id}
                className={`team-card p-4 flex items-center justify-between ${
                  index === 0 ? 'border-light-gold bg-gradient-to-r from-light-gold/20 to-victory-gold/20' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {getPositionBadge(index)}
                  </div>
                  
                  <div className="text-2xl">
                    {getTeamEmoji(team.name)}
                  </div>
                  
                  <div>
                    <div className="font-bold text-gray-800">{team.name}</div>
                    <div className="text-xs text-gray-500">
                      {team.players.length} guerreros • {team.responseCount} respuestas
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">
                    {team.totalScore}
                  </div>
                  <div className="text-xs text-gray-500">puntos</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Statistics */}
        <div className="card p-6 mb-6">
          <h3 className="text-xl font-bold text-dark-purple mb-4">📊 Estadísticas de Batalla</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{scenarios.length}</div>
              <div className="text-gray-500">Rondas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{responses.length}</div>
              <div className="text-gray-500">Respuestas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{teams.length}</div>
              <div className="text-gray-500">Equipos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {Math.round(responses.length / scenarios.length)}
              </div>
              <div className="text-gray-500">Prom/ronda</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleExportResults}
            className="btn-secondary w-full"
          >
            📄 Exportar Resultados
          </button>
          
          <button
            onClick={handleNewGame}
            className="btn-primary w-full"
          >
            ⚔️ Nueva Batalla
          </button>
        </div>

        {/* Victory Message */}
        <div className="card p-6 mt-6 text-center">
          <div className="text-4xl mb-4">🌟</div>
          <h3 className="text-lg font-bold text-dark-purple mb-2">
            ¡Felicitaciones Guerreros!
          </h3>
          <p className="text-sm text-gray-600">
            ¡Han batallado a través de {scenarios.length} escenarios y han demostrado su conocimiento de las escrituras! 
            ¡Que la luz de la verdad continúe guiando su camino!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen; 