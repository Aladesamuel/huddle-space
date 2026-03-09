import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Play, Info, Users, Monitor, Waves } from 'lucide-react';
import { MiniBranding } from '../components/Branding';

export default function Demo() {
  const navigate = useNavigate();
  
  // Demo configuration
  const demoData = {
    n: "Public Demo HQ",
    r: "Welcome! Feel free to explore. This is a public demo room.",
    p: false,
    h: null
  };
  
  const demoRoomId = "guddl-public-demo";
  const demoLink = `/room/${demoRoomId}#data=${btoa(JSON.stringify(demoData))}`;

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav style={{
        height: 80,
        display: 'flex',
        alignItems: 'center',
        padding: '0 5vw',
        borderBottom: '1px solid var(--border)'
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', marginRight: 60 }}>
          <MiniBranding />
        </div>
      </nav>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
        <div style={{ maxWidth: 800, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8, 
              background: 'var(--blue-dim)', 
              color: 'var(--blue)', 
              padding: '6px 16px', 
              borderRadius: 30, 
              fontSize: 13, 
              fontWeight: 800,
              marginBottom: 24
            }}>
              <Play size={12} fill="currentColor" /> LIVE PREVIEW
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, letterSpacing: -1.5, marginBottom: 20 }}>
              Step into the <span style={{ color: 'var(--blue)' }}>Guddl.</span> experience.
            </h1>
            <p style={{ fontSize: 18, color: 'var(--text-sub)', lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
              Experience how high-fidelity audio and persistent presence change the way your team works. No account, no install.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: 24, 
            marginBottom: 60 
          }}>
            {[
              { 
                icon: <Waves size={24} />, 
                title: 'High-Fi Audio', 
                desc: 'Crystal clear spatial-like communication.' 
              },
              { 
                icon: <Monitor size={24} />, 
                title: 'Instant Sharing', 
                desc: 'Share your work with one click.' 
              },
              { 
                icon: <Users size={24} />, 
                title: 'Real Presence', 
                desc: 'Know who is around without asking.' 
              }
            ].map((item, i) => (
              <div key={i} style={{ 
                background: 'var(--bg-raised)', 
                padding: 32, 
                borderRadius: 24, 
                border: '1px solid var(--border)',
                textAlign: 'center'
              }}>
                <div style={{ color: 'var(--blue)', marginBottom: 16, display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>{item.title}</h3>
                <p style={{ color: 'var(--text-ghost)', fontSize: 14 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate(demoLink)}
              style={{ 
                height: 72, 
                padding: '0 48px', 
                fontSize: 20, 
                borderRadius: 20, 
                backgroundColor: 'var(--blue)', 
                fontWeight: 900,
                boxShadow: '0 20px 40px var(--blue-dim)'
              }}
            >
              Enter Demo Office <ArrowRight size={22} />
            </button>
            
            <div style={{ 
              marginTop: 32, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 8, 
              color: 'var(--text-ghost)',
              fontSize: 14
            }}>
              <Info size={16} />
              <span>Demos are reset periodically. No private data is saved.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
