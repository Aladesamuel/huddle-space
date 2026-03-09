import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Demo from './pages/Demo';
import Docs from './pages/Docs';
import useStore from './store/useStore';
import './index.css';

export default function App() {
  const { user } = useStore();
  
  // VITE_BRAND_SITE=true means this is the main product site with landing, docs, etc.
  // VITE_BRAND_SITE=false (default for startups) means this is a focused office portal.
  const isBrandSite = import.meta.env.VITE_BRAND_SITE === 'true';

  return (
    <div className="app-container">
      <main style={{ marginLeft: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          {/* Main Entry Points */}
          <Route 
            path="/" 
            element={isBrandSite ? <Landing /> : <Home />} 
          />
          
          {/* Brand Site Specific Routes */}
          {isBrandSite && (
            <>
              <Route path="/create" element={<Home />} />
              <Route path="/demo"   element={<Demo />} />
              <Route path="/docs"   element={<Docs />} />
            </>
          )}

          {/* Unified Office Flow */}
          <Route path="/room/:roomId" element={<Onboarding />} />
          <Route path="/office/:roomId" element={user ? <Dashboard /> : <Navigate to="/" replace />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
