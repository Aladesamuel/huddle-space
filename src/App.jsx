import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Users, LogOut, PanelLeftClose, PanelLeftOpen, Infinity } from 'lucide-react';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import useStore from './store/useStore';
import Branding, { MiniBranding } from './components/Branding';
import './index.css';

const STATUS_COLOR = { Available: '#34a853', Busy: '#ea4335', 'On Break': '#fbbc04' };

function Sidebar({ collapsed, setCollapsed }) {
  const { user } = useStore();
  const location = useLocation();
  const inOffice  = location.pathname.startsWith('/office');

  return (
    <nav className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>

      {/* Branding */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
        <MiniBranding size={18} fontSize={16} />
      </div>

      {/* Office icon */}
      {user && inOffice && (
        <button 
          className="sidebar-btn active" 
          title="Guddl."
          style={{ 
            background: 'var(--blue)', 
            boxShadow: '0 0 20px var(--blue-glow)',
            color: '#fff',
            borderRadius: 14
          }}
        >
          <Infinity size={22} strokeWidth={2.5} />
        </button>
      )}

      <div className="sidebar-spacer" />

      {/* Status dot */}
      {user && (
        <div style={{ position: 'relative' }}>
          <select
            value={user.status}
            onChange={e => useStore.getState().updateStatus(e.target.value)}
            style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }}
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
          style={{ background: user.avatar?.bg ?? 'rgba(255,255,255,0.06)', fontSize: 18, cursor: 'default', border: '2px solid rgba(255,255,255,0.1)' }}
          title={user.name}
        >
          {user.avatar?.icon}
        </div>
      )}

      {/* Leave */}
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
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className={`app-container${collapsed || isLandingPage ? ' sidebar-is-collapsed' : ''}`}>
      {!isLandingPage && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}

      {/* Floating re-open tab — appears only when sidebar is collapsed and not on landing page */}
      {collapsed && !isLandingPage && (
        <button
          className="sidebar-toggle-floating"
          onClick={() => setCollapsed(false)}
          title="Expand sidebar"
          style={{
            position: 'fixed',
            top: 14, left: 0,
            zIndex: 400,
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-hi)',
            borderLeft: 'none',
            borderRadius: '0 10px 10px 0',
            width: 32, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-sub)',
            transition: 'color 0.2s ease, background 0.2s ease',
            boxShadow: '2px 0 12px rgba(0,0,0,0.3)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-sub)'; e.currentTarget.style.background = 'var(--bg-raised)'; }}
        >
          <PanelLeftOpen size={16} />
        </button>
      )}

      <main style={{
        marginLeft: (collapsed || isLandingPage) ? '0px' : 'var(--sidebar-w)',
        transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/room/:roomId" element={<Onboarding />} />
          <Route path="/office/:roomId" element={user ? <Dashboard /> : <Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
