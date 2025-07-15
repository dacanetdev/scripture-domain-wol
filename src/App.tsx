import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContextBackend';
import GameLobby from './components/GameLobby';
import GameBoard from './components/GameBoard';
import AdminPanel from './components/AdminPanel';
import ResultsScreen from './components/ResultsScreen';
import Dashboard from './components/Dashboard';
import DashboardAccess from './components/DashboardAccess';
import ConnectionStatusIndicator from './components/ConnectionStatus';

// Utility to check for debug flag in URL
const isDebugMode = () => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const debug = params.get('debug');
  return debug === '1' || debug === 'connection';
};

const AppContent: React.FC = () => {
  return (
    <div className="App">
      {isDebugMode() && <ConnectionStatusIndicator />}
      <Routes>
        <Route path="/" element={<GameLobby />} />
        <Route path="/lobby" element={<GameLobby />} />
        <Route path="/game" element={<GameBoard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/results" element={<ResultsScreen />} />
        <Route path="/dashboard-access" element={<DashboardAccess />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <Router>
        <AppContent />
      </Router>
    </GameProvider>
  );
};

export default App; 