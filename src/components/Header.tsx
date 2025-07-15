import React from 'react';
import AppLogo from './AppLogo';

const Header: React.FC = () => {
  return (
    <div className="w-full bg-white/10 backdrop-blur-sm border-b border-white/20 py-4 mb-6">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 animate-glow">
            <AppLogo />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-light-gold drop-shadow flex items-center gap-2">
              Scripture Dominion
            </h1>
            <p className="text-sm text-white/80 font-medium">
              War of Light
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 