import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LogOut, ChevronDown } from 'lucide-react';
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
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            <span>Huddle</span>Space
          </div>
          {user && (
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select 
                  value={user.status} 
                  onChange={(e) => useStore.getState().updateStatus(e.target.value)}
                  style={{ 
                    padding: '8px 16px', borderRadius: '12px', 
                    border: '1px solid var(--border)', fontSize: '13px', 
                    backgroundColor: 'var(--bg)', fontWeight: 600,
                    appearance: 'none', cursor: 'pointer', paddingRight: '36px',
                    color: 'var(--text)'
                  }}
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="On Break">On Break</option>
                </select>
                <div style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: 'var(--text-secondary)' }}>
                  <ChevronDown size={14} />
                </div>
              </div>

              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', 
                padding: '6px 6px 6px 14px', background: 'var(--pc-light)', 
                borderRadius: '16px', border: '1px solid hsla(230, 85%, 60%, 0.1)'
              }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--pc)' }}>{user.name}</div>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '12px', 
                  background: 'white', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', fontSize: '16px', boxShadow: 'var(--shadow-sm)'
                }}>
                  {user.avatar?.icon}
                </div>
              </div>

              <button 
                onClick={() => {
                  useStore.getState().setUser(null);
                  window.location.href = '/';
                }}
                className="btn btn-outline"
                style={{ height: '40px', padding: '0 12px', borderRadius: '12px', border: 'none', color: 'var(--danger)', background: 'hsla(0, 80%, 60%, 0.05)' }}
                title="Exit Office"
              >
                <LogOut size={18} />
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
