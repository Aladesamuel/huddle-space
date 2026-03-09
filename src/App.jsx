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

// Sidebar removed. Functions moved to Dashboard header.

export default function App() {
  const { user } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="app-container">
      <main style={{ marginLeft: 0 }}>
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/room/:roomId" element={<Onboarding />} />
          <Route path="/office/:roomId" element={user ? <Dashboard /> : <Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
