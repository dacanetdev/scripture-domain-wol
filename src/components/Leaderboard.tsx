import React from 'react';
import { Team, Response } from '../types';

interface LeaderboardProps {
  teams: Team[];
  responses: Response[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ teams, responses }) => {
  // Calculate scores for each team
  const teamScores = teams.map(team => {
    const teamResponses = responses.filter(r => r.teamId === team.id);
    const totalScore = teamResponses.reduce((sum, r) => sum + r.speedScore + r.qualityScore, 0);
    
    return {
      ...team,
      totalScore,
      responseCount: teamResponses.length
    };
  });

  // Sort by score (highest first)
  const sortedTeams = [...teamScores].sort((a, b) => b.totalScore - a.totalScore);

  const getPositionBadge = (index: number): string => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}.`;
    }
  };

  return (
    <div className="space-y-3">
      {sortedTeams.map((team, index) => (
        <div
          key={team.id}
          className={`team-card p-3 flex items-center justify-between ${
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
      {sortedTeams.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">⚔️</div>
          <div>Aún no se han unido equipos</div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard; 