import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import useStore from './store/useStore';
import './index.css';

export default function App() {
  const { user } = useStore();

  return (
    <div className="app-container">
      <main style={{ marginLeft: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/room/:roomId" element={<Onboarding />} />
          <Route path="/office/:roomId" element={user ? <Dashboard /> : <Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
