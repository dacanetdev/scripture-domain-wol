import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../services/api';

const DashboardAccess: React.FC = () => {
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');
  const [valid, setValid] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();

  const validateGameCode = (code: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const socket = getSocket();
      let timeout: NodeJS.Timeout;
      // Listen for a one-time gameState response
      const onGameState = (game: any) => {
        clearTimeout(timeout);
        socket.off('gameState', onGameState);
        if (game && game.gameCode && game.gameCode === code) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      socket.once('gameState', onGameState);
      // Emit request
      socket.emit('requestGameState', { gameId: code });
      // Timeout after 2.5 seconds
      timeout = setTimeout(() => {
        socket.off('gameState', onGameState);
        resolve(false);
      }, 2500);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setGameCode(code);
    setError('');
    setValid(false);
    
    if (code.length === 6) {
      setIsValidating(true);
      validateGameCode(code).then(isValid => {
        setValid(isValid);
        if (!isValid) {
          setError('Código de juego no válido.');
        }
        setIsValidating(false);
      });
    }
  };

  const handleViewGame = async () => {
    if (gameCode.length !== 6) {
      setError('Por favor ingresa un código de 6 dígitos.');
      return;
    }

    setIsValidating(true);
    const isValid = await validateGameCode(gameCode);
    
    if (isValid) {
      // Listen for the first gameState to get the full gameId
      const socket = getSocket();
      const onGameState = (game: any) => {
        if (game && game.id) {
          localStorage.setItem('dashboardGameId', game.id);
        }
        socket.off('gameState', onGameState);
        navigate('/dashboard');
      };
      socket.once('gameState', onGameState);
      // Request the game state (again) to trigger the response
      socket.emit('requestGameState', { gameId: gameCode });
    } else {
      setError('Código de juego no válido.');
    }
    setIsValidating(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center border-4 border-yellow-400">
        <h1 className="text-3xl font-extrabold text-dark-purple mb-6 text-center">Ver Juego en Pantalla</h1>
        <label className="block text-lg font-bold text-gray-700 mb-2 text-center">Ingresa el código del juego</label>
        <input
          type="text"
          value={gameCode}
          onChange={handleChange}
          placeholder="Código del Juego"
          className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg text-2xl text-center font-mono tracking-widest mb-4"
          maxLength={6}
        />
        {error && <div className="text-red-600 mb-2 text-center">{error}</div>}
        <button
          onClick={handleViewGame}
          className={`btn-primary w-full text-2xl py-4 mt-2 ${(!valid && !isValidating) ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!valid && !isValidating}
        >
          {isValidating ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white inline-block mr-2"></div>
              Validando...
            </>
          ) : (
            '👁️ Ver Juego'
          )}
        </button>
      </div>
    </div>
  );
};

export default DashboardAccess; 