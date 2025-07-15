import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
// Add confetti import
import Confetti from 'react-confetti';
import { api } from '../services/api';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResultsScreen: React.FC = () => {
  console.log('ResultsScreen mounted');
  const navigate = useNavigate();
  const query = useQuery();
  const code = query.get('code');
  const [windowSize, setWindowSize] = React.useState({ width: window.innerWidth, height: window.innerHeight });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [externalData, setExternalData] = React.useState<any>(null);

  React.useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch game by code if code param is present
  React.useEffect(() => {
    console.log('ResultsScreen useEffect: code param =', code);
    if (!code) return;
    setLoading(true);
    setError(null);
    setExternalData(null);
    console.log('Calling api.getGames()...');
    api.getGames()
      .then(res => {
        const games = res.data;
        console.log('Games fetched:', games);
        const found = games.find((g: any) => g.gameCode && g.gameCode.toLowerCase() === code.toLowerCase());
        if (!found) {
          setError('No se encontró un juego con ese código.');
          setLoading(false);
          return;
        }
        console.log('Found game:', found);
        return api.getGame(found.id).then(res2 => {
          setExternalData(res2.data);
          setLoading(false);
        });
      })
      .catch(err => {
        setError('Error al buscar el juego.');
        setLoading(false);
        console.error('Error in api.getGames:', err);
      });
  }, [code]); // <-- Only depend on code!

  // Use either context or external data
  const data = externalData;

  // Only run this effect if there is NO code param (context fallback)
  React.useEffect(() => {
    if (code) return; // skip if using code param
    if (data?.gameState === 'lobby') {
      navigate('/lobby');
    } else if (data?.gameState === 'playing' || data?.gameState === 'round') {
      navigate('/game');
    }
    // Do NOT redirect away if gameState is 'finished' or 'results'
  }, [data?.gameState, navigate, code, externalData]);

  // If loading, show loading
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl">Cargando resultados...</div></div>;
  // If error, show error
  if (error) return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl text-red-600">{error}</div></div>;
  // If code param and externalData not loaded yet, don't render
  if (code && !externalData) return null;
  // If no data, don't render
  if (!data) return null;

  console.log('externalData:', externalData);
  // Local debug mode: check for ?debug in the URL
  const isDebugMode = () => window.location.search.includes('debug');
  if (code && externalData && isDebugMode()) {
    return <pre>{JSON.stringify(externalData, null, 2)}</pre>;
  }

  // Calculate final rankings
  const teamRankings = (data?.teams || [])
    .filter((team: any) => team && team.id !== 'admin' && team.id !== 'viewer')
    .map((team: any) => ({
      ...team,
      totalScore: (data?.gameResults?.[team.id]) || 0,
      responseCount: (data?.responses || []).filter((r: any) => r && r.teamId === team.id).length
    }))
    .sort((a: any, b: any) => b.totalScore - a.totalScore);

  const winner = teamRankings[0];
  const isTie = teamRankings.length > 1 && teamRankings[0].totalScore === teamRankings[1].totalScore;

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
${teamRankings.map((team: any, index: number) => 
  `${getPositionBadge(index)} ${team.name} - ${team.totalScore} puntos`
).join('\n')}

👑 CAMPEÓN: ${winner.name}
${isTie ? '🤝 ¡EMPATE!' : ''}

📊 ESTADÍSTICAS DEL JUEGO:
- Total de Rondas: ${rounds.length}
- Total de Respuestas: ${data.responses.length}
- Equipos Participantes: ${teamRankings.length}

Generado el ${new Date().toLocaleDateString()}`;

    const blob = new Blob([resultsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resultados-dominio-escrituras.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Use rounds for all round/escenario counts and displays
  const rounds = data?.rounds || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green p-4">
      <Header />
      <div className="max-w-md mx-auto">
        {/* Confetti for the winner */}
        {!isTie && (
          <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={350} recycle={false} gravity={0.25} />
        )}
        {/* Podium for Top 3 Teams */}
        <div className="flex flex-row items-end justify-center gap-2 mb-8">
          {teamRankings[1] && (
            <div className="flex flex-col items-center w-24">
              <div className="text-4xl mb-1">🥈</div>
              <div className="bg-gradient-to-t from-gray-300 to-gray-100 rounded-t-xl rounded-b-lg px-2 py-2 w-full text-center shadow-md">
                <div className="font-bold text-gray-700 text-lg truncate">{teamRankings[1].name}</div>
                <div className="text-gray-500 text-sm">{teamRankings[1].totalScore} pts</div>
              </div>
            </div>
          )}
          {teamRankings[0] && (
            <div className="flex flex-col items-center w-28 z-10">
              <div className="text-5xl mb-1 animate-bounce">🥇</div>
              <div className="bg-gradient-to-t from-yellow-300 to-yellow-100 rounded-t-xl rounded-b-lg px-2 py-4 w-full text-center shadow-lg border-4 border-yellow-400">
                <div className="font-extrabold text-dark-purple text-xl truncate">{teamRankings[0].name}</div>
                <div className="text-yellow-700 text-lg font-bold">{teamRankings[0].totalScore} pts</div>
              </div>
            </div>
          )}
          {teamRankings[2] && (
            <div className="flex flex-col items-center w-24">
              <div className="text-4xl mb-1">🥉</div>
              <div className="bg-gradient-to-t from-yellow-900 to-yellow-400 rounded-t-xl rounded-b-lg px-2 py-1 w-full text-center shadow-md">
                <div className="font-bold text-gray-700 text-lg truncate">{teamRankings[2].name}</div>
                <div className="text-gray-500 text-sm">{teamRankings[2].totalScore} pts</div>
              </div>
            </div>
          )}
        </div>
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
              {winner.emoji}
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
            <div className="text-sm text-gray-600 mb-2">
              {winner.responseCount} respuestas • {winner.players.length} guerreros
            </div>
            <div className="text-xl font-extrabold text-green-600 animate-bounce mt-2">
              ¡Felicidades, campeones!
            </div>
          </div>
        )}

        {/* Final Standings */}
        <div className="card p-6 mb-6">
          <h3 className="text-xl font-bold text-dark-purple mb-4">🏆 Clasificación Final</h3>
          <div className="space-y-3">
            {teamRankings.map((team: any, index: number) => (
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
                    {team.emoji}
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
              <div className="text-2xl font-bold text-gray-800">{rounds.length}</div>
              <div className="text-gray-500">Rondas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{(data?.responses || []).length}</div>
              <div className="text-gray-500">Respuestas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{(teamRankings || []).length}</div>
              <div className="text-gray-500">Equipos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {Math.round((data?.responses || []).length / (data?.scenarios || []).length)}
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
            ¡Han batallado a través de {rounds.length} escenarios y han demostrado su conocimiento de las escrituras! 
            ¡Que la luz de la verdad continúe guiando su camino!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen; 