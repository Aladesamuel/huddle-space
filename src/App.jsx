import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import useStore from './store/useStore';
import './index.css';

function App() {
  const { user } = useStore();

  return (
    <Router>
      <div className="app-container">
        <header>
          <div className="logo">
            <span>Huddle</span>Space
          </div>
          {user && (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <select 
                value={user.status} 
                onChange={(e) => useStore.getState().updateStatus(e.target.value)}
                style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '13px', backgroundColor: '#f8f9fa' }}
              >
                <option value="Available">🟢 Available</option>
                <option value="Busy">🔴 Busy</option>
                <option value="On Break">🟡 On Break</option>
              </select>
              <div style={{ fontWeight: 500, fontSize: '14px', color: '#3c4043' }}>{user.name}</div>
              <button 
                onClick={() => {
                  useStore.getState().setUser(null);
                  window.location.href = '/';
                }}
                className="btn btn-outline"
                style={{ padding: '4px 12px', fontSize: '12px' }}
              >
                Exit Office
              </button>
            </div>
          )}
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomId" element={<Onboarding />} />
            <Route path="/office/:roomId" element={
              user ? <Dashboard /> : <Navigate to="/" replace />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
