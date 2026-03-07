import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Users, Settings, LogOut, ChevronDown } from 'lucide-react';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import useStore from './store/useStore';
import './index.css';

/* ── Sidebar status dot colours ── */
const STATUS_DOT = {
  'Available': '#34a853',
  'Busy':      '#ea4335',
  'On Break':  '#fbbc04',
};

function Sidebar() {
  const { user } = useStore();
  const location = useLocation();
  const isOffice = location.pathname.startsWith('/office');

  return (
    <nav className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" title="HuddleSpace">
        🎙
      </div>

      {/* Nav icons */}
      <button className={`sidebar-nav-item ${!isOffice ? 'active' : ''}`} title="Home">
        <HomeIcon size={22} />
      </button>
      {user && (
        <button className={`sidebar-nav-item ${isOffice ? 'active' : ''}`} title="Office">
          <Users size={22} />
        </button>
      )}

      <div className="sidebar-spacer" />

      {/* Status selector (only when logged in) */}
      {user && (
        <div style={{ position: 'relative' }}>
          <select
            value={user.status}
            onChange={(e) => useStore.getState().updateStatus(e.target.value)}
            title="Change status"
            style={{
              opacity: 0,
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              zIndex: 2,
            }}
          >
            <option value="Available">Available</option>
            <option value="Busy">Busy</option>
            <option value="On Break">On Break</option>
          </select>
          <div
            className="sidebar-nav-item"
            title={`Status: ${user.status}`}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <span style={{
              width: 14, height: 14, borderRadius: '50%',
              background: STATUS_DOT[user.status] || '#9aa0a6',
              display: 'block',
              boxShadow: `0 0 0 3px rgba(0,0,0,0.4), 0 0 8px ${STATUS_DOT[user.status] || '#9aa0a6'}66`,
            }} />
          </div>
        </div>
      )}

      {/* User avatar bubble */}
      {user && (
        <div
          className="sidebar-nav-item"
          title={user.name}
          style={{
            width: 48, height: 48, borderRadius: '16px',
            background: user.avatar?.bg || 'var(--bg-card)',
            fontSize: 20, border: '2px solid var(--border-strong)',
            cursor: 'default',
          }}
        >
          {user.avatar?.icon}
        </div>
      )}

      {/* Exit office */}
      {user && (
        <button
          className="sidebar-nav-item"
          title="Exit Office"
          onClick={() => {
            useStore.getState().setUser(null);
            window.location.href = '/';
          }}
          style={{ color: 'var(--danger)', marginTop: 4 }}
        >
          <LogOut size={20} />
        </button>
      )}
    </nav>
  );
}

function App() {
  const { user } = useStore();

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main>
          <Routes>
            <Route path="/"             element={<Home />} />
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
