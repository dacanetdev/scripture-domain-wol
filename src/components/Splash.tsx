import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLogo from './AppLogo';
import { SparklesIcon, BookOpenIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const Splash: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dark-purple via-celestial-blue to-terrestrial-green p-4 relative overflow-x-hidden">
      {/* Decorative background logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0 animate-pulse-slow">
        <AppLogo />
      </div>
      <div className="z-10 flex flex-col items-center">
        <div className="mb-6 animate-spin-slow drop-shadow-xl">
          <AppLogo />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-light-gold mb-4 drop-shadow flex items-center gap-2 animate-fade-in">
          <SparklesIcon className="w-8 h-8 text-yellow-300 animate-glow" />
          <span className="animate-bounce">Scripture Dominion</span>
          <span className="hidden sm:inline">:</span>
          <span className="text-white animate-slide-in">War of Light</span>
        </h1>
        <h2 className="text-xl sm:text-2xl text-white font-bold mb-6 text-center animate-fade-in flex items-center gap-2">
          <BookOpenIcon className="w-7 h-7 text-celestial-blue animate-bounce" />
          ¡Compite, aprende y domina las Escrituras en equipo!
        </h2>
        <p className="text-lg text-white mb-8 text-center max-w-md animate-fade-in">
          Forma equipos, responde a escenarios reales usando las Escrituras, gana puntos y demuestra tu conocimiento. ¡Ideal para Seminario, Mutual y actividades de jóvenes!
        </p>
        <button
          onClick={() => navigate('/lobby')}
          className="btn-primary text-2xl px-8 py-4 rounded-full shadow-xl bg-yellow-400 text-dark-purple font-bold flex items-center gap-2 hover:bg-yellow-500 animate-bounce-slow animate-glow"
        >
          <UserGroupIcon className="w-7 h-7 text-celestial-blue animate-glow" />
          ¡Comenzar!
        </button>
      </div>
      {/* Custom keyframes for extra animation */}
      <style>{`
        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        @keyframes slide-in { 0% { opacity: 0; transform: translateY(40px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-slide-in { animation: slide-in 1.2s cubic-bezier(0.4,0,0.2,1) both; }
      `}</style>
    </div>
  );
};

export default Splash; 