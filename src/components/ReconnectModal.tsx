import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContextBackend';
import { playerStorage, gameSessionStorage } from '../utils/storage';
import { XMarkIcon, UserCircleIcon, UsersIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { getSocket } from '../services/api';

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: () => void;
}

const ICONS = ['☀️', '🌙', '⭐', '🔥', '🌈', '⚡', '🦁', '🦅', '🐢', '🐉', '🦄', '🐺'];

const JoinGameModal: React.FC<JoinGameModalProps> = ({ isOpen, onClose, onJoin }) => {
  const { teams, gameId, joinTeam, isConnected } = useGame();
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGameCode('');
      setPlayerName('');
      setSelectedTeam('');
      setSelectedIcon(ICONS[0]);
      setError('');
    }
  }, [isOpen]);

  const handleJoin = async () => {
    if (!gameCode.trim() || !playerName.trim() || !selectedTeam.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }
    setIsJoining(true);
    setError('');
    try {
      // Check if already in the game (by name/team/gameId)
      const socket = getSocket();
      let alreadyInGame = false;
      if (isConnected) {
        // Check teams from context
        alreadyInGame = teams.some(
          t => t.id === selectedTeam && t.players.includes(playerName.trim())
        );
      }
      if (alreadyInGame) {
        // Save player data and navigate
        playerStorage.set({ name: playerName.trim(), teamId: selectedTeam, gameId: gameCode, emoji: selectedIcon });
        gameSessionStorage.set(gameCode);
        onJoin();
        return;
      }
      // Not in game, emit joinGame
      socket.emit('joinGame', {
        gameId: gameCode,
        playerName: playerName.trim(),
        teamId: selectedTeam,
        emoji: selectedIcon,
        isAdmin: false
      });
      // Save player data
      playerStorage.set({ name: playerName.trim(), teamId: selectedTeam, gameId: gameCode, emoji: selectedIcon });
      gameSessionStorage.set(gameCode);
      // Wait a bit for backend to process
      await new Promise(resolve => setTimeout(resolve, 700));
      onJoin();
    } catch (err) {
      setError('No se pudo unir al juego. Intenta de nuevo.');
    } finally {
      setIsJoining(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-dark-purple flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-celestial-blue" />
            Unirse a Juego
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Código del Juego</label>
            <input
              type="text"
              value={gameCode}
              onChange={e => setGameCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-celestial-blue focus:border-transparent"
              placeholder="Ingresa el código de 6 dígitos"
              maxLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tu Nombre</label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-celestial-blue focus:border-transparent"
              placeholder="Ingresa tu nombre"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipo</label>
            <input
              type="text"
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-celestial-blue focus:border-transparent"
              placeholder="Ingresa el nombre del equipo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icono</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  className={`text-2xl p-2 rounded-lg border ${selectedIcon === icon ? 'border-celestial-blue bg-blue-50' : 'border-gray-200'}`}
                  onClick={() => setSelectedIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleJoin}
          disabled={isJoining || !gameCode.trim() || !playerName.trim() || !selectedTeam.trim()}
          className="w-full bg-celestial-blue hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isJoining ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Uniendo...
            </>
          ) : (
            <>
              <ArrowRightIcon className="w-4 h-4" />
              Unirse a juego
            </>
          )}
        </button>
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinGameModal; 