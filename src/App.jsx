import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Users, LogOut } from 'lucide-react';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import useStore from './store/useStore';
import './index.css';

const STATUS_COLOR = { Available: '#34a853', Busy: '#ea4335', 'On Break': '#fbbc04' };

function Sidebar() {
  const { user } = useStore();
  const location = useLocation();
  const inOffice  = location.pathname.startsWith('/office');

  return (
    <nav className="sidebar">
      {/* Logo mark */}
      <div className="sidebar-logo">🎙</div>

      {/* Only show the Office icon when inside an office */}
      {user && inOffice && (
        <button className="sidebar-btn active" title="Office">
          <Users size={20} />
        </button>
      )}

      <div className="sidebar-spacer" />

      {/* Status indicator dot */}
      {user && (
        <div style={{ position: 'relative' }}>
          <select
            value={user.status}
            onChange={e => useStore.getState().updateStatus(e.target.value)}
            style={{
              opacity: 0, position: 'absolute', inset: 0,
              width: '100%', height: '100%', cursor: 'pointer', zIndex: 2,
            }}
          >
            <option value="Available">Available</option>
            <option value="Busy">Busy</option>
            <option value="On Break">On Break</option>
          </select>
          <div className="sidebar-btn" style={{ position: 'relative', zIndex: 1 }} title={`Status: ${user.status}`}>
            <span style={{
              width: 12, height: 12, borderRadius: '50%',
              background: STATUS_COLOR[user.status] ?? '#9aa0a6',
              display: 'block',
              boxShadow: `0 0 0 3px rgba(0,0,0,0.5), 0 0 10px ${STATUS_COLOR[user.status] ?? '#9aa0a6'}88`,
            }} />
          </div>
        </div>
      )}

      {/* Avatar */}
      {user && (
        <div
          className="sidebar-btn"
          style={{
            background: user.avatar?.bg ?? 'rgba(255,255,255,0.06)',
            fontSize: 18, cursor: 'default',
            border: '2px solid rgba(255,255,255,0.1)',
          }}
          title={user.name}
        >
          {user.avatar?.icon}
        </div>
      )}

      {/* Sign out */}
      {user && (
        <button
          className="sidebar-btn"
          style={{ color: '#ea4335', marginTop: 4 }}
          title="Leave office"
          onClick={() => { useStore.getState().setUser(null); window.location.href = '/'; }}
        >
          <LogOut size={18} />
        </button>
      )}
    </nav>
  );
}

export default function App() {
  const { user } = useStore();
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main>
          <Routes>
            <Route path="/"             element={<Home />} />
            <Route path="/room/:roomId" element={<Onboarding />} />
            <Route path="/office/:roomId" element={user ? <Dashboard /> : <Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
