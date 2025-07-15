import React from 'react';

const AppLogo: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Shield background */}
    <path d="M32 4 L56 16 V36 C56 48 44 58 32 60 C20 58 8 48 8 36 V16 Z" fill="#4A148C" stroke="#FFD700" strokeWidth="2"/>
    {/* Open book (scripture) */}
    <rect x="18" y="22" width="28" height="18" rx="3" fill="#fff" stroke="#1E3A8A" strokeWidth="2"/>
    <line x1="32" y1="22" x2="32" y2="40" stroke="#1E3A8A" strokeWidth="2"/>
    {/* Rays of light */}
    <line x1="32" y1="10" x2="32" y2="18" stroke="#FFD700" strokeWidth="2"/>
    <line x1="24" y1="14" x2="28" y2="20" stroke="#FFD700" strokeWidth="2"/>
    <line x1="40" y1="14" x2="36" y2="20" stroke="#FFD700" strokeWidth="2"/>
  </svg>
);

export default AppLogo; 