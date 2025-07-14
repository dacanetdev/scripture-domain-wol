import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardAccess: React.FC = () => {
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');
  const [valid, setValid] = useState(false);
  const navigate = useNavigate();

  const validateGameCode = (code: string): boolean => {
    const storedState = localStorage.getItem('scriptureDominionState');
    if (storedState) {
      const parsed = JSON.parse(storedState);
      if (parsed.gameId && code.trim().toLowerCase() === parsed.gameId.slice(-6).toLowerCase()) {
        return true;
      }
    }
    return false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setGameCode(code);
    setError('');
    setValid(false);
    if (code.length === 6 && validateGameCode(code)) {
      setValid(true);
    } else if (code.length === 6) {
      setError('Código de juego no válido.');
    }
  };

  const handleViewGame = () => {
    if (validateGameCode(gameCode)) {
      navigate('/dashboard');
    } else {
      setError('Código de juego no válido.');
    }
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
          className={`btn-primary w-full text-2xl py-4 mt-2 ${!valid ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!valid}
        >
          👁️ Ver Juego
        </button>
      </div>
    </div>
  );
};

export default DashboardAccess; 