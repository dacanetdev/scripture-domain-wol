import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  gameCode: string | null;
  gameId: string | null;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ gameCode, gameId }) => {
  if (!gameCode || !gameId) {
    return null;
  }

  // Generate the game URL
  const gameUrl = `${window.location.origin}/lobby?code=${encodeURIComponent(gameCode)}`;
  
  return (
    <div className="card bg-white border-2 border-gray-300 rounded-xl shadow-xl p-4 sm:p-6 text-center animate-fade-in">
      <div className="flex items-center justify-center gap-2 text-lg sm:text-xl text-dark-purple font-bold mb-3 sm:mb-4">
        <svg className="w-6 h-6 text-celestial-blue" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Código QR del Juego
      </div>
      
      <div className="flex justify-center mb-3 sm:mb-4">
        <div className="bg-white p-2 sm:p-3 rounded-lg border-2 border-gray-200 shadow-lg">
          <QRCodeSVG
            value={gameUrl}
            size={120}
            level="M"
            includeMargin={true}
            className="w-24 h-24 sm:w-32 sm:h-32"
          />
        </div>
      </div>
      
      <div className="text-sm sm:text-base text-gray-700 mb-2">
        Escanea este código QR para unirte al juego
      </div>
      
      <div className="text-xs sm:text-sm text-gray-500 mb-3">
        O comparte el código: <span className="font-mono font-bold text-dark-purple">{gameCode.toUpperCase()}</span>
      </div>
      
      <div className="text-xs text-gray-400">
        URL: <span className="font-mono break-all">{gameUrl}</span>
      </div>
    </div>
  );
};

export default QRCodeDisplay; 