import React, { useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutGrid, ArrowRight, Zap, Users, Shield, Target, Infinity, BookOpen, Play } from 'lucide-react';
import Branding, { MiniBranding } from '../components/Branding';

export default function Landing() {
  const navigate = useNavigate();
  const featuresRef = useRef(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', overflowX: 'hidden', minHeight: '100vh' }}>
      
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav style={{
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 5vw',
        position: 'sticky',
        top: 0,
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        borderBottom: '1px solid var(--border)'
      }}>
        <MiniBranding />
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <a href="#features" onClick={(e) => { e.preventDefault(); scrollToFeatures(); }} style={{ color: 'var(--text-sub)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Features</a>
          <Link to="/docs" style={{ color: 'var(--text-sub)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Docs</Link>
          <a href="https://Newstartlist.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-sub)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Company</a>
          <button className="btn btn-primary" onClick={() => navigate('/create')} style={{ height: 44 }}>
            Start Guddl. <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, var(--blue-dim) 0%, transparent 60%)',
          zIndex: 0,
          opacity: 0.5
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Branding size={80} spacing={40} fontSize={72} />
          
          <h2 style={{ 
            fontSize: 'clamp(32px, 6vw, 64px)', 
            fontWeight: 900, 
            letterSpacing: -2, 
            marginTop: 24, 
            maxWidth: 880,
            lineHeight: 1.1,
            color: 'var(--text-ash)'
          }}>
            The persistent digital office for <span style={{ color: 'var(--blue)' }}>remote-first</span> teams.
          </h2>

          <p style={{ 
            color: 'var(--text-ghost)', 
            fontSize: 'clamp(18px, 1.2vw, 20px)', 
            lineHeight: 1.6, 
            maxWidth: 600, 
            margin: '32px auto 48px',
            fontWeight: 500
          }}>
            Guddl. brings back the spontaneous collaboration of a physical office. 
            No meetings, no calendars, just your team working together.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
            <button className="btn btn-primary" style={{ height: 62, padding: '0 42px', fontSize: 18, borderRadius: 16, backgroundColor: 'var(--blue)', fontWeight: 800 }} onClick={() => navigate('/create')}>
              Create Your Office <ArrowRight size={20} />
            </button>
            <button className="btn btn-outline" style={{ height: 62, padding: '0 32px', fontSize: 18, borderRadius: 16, border: '2px solid var(--border-hi)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => navigate('/demo')}>
              Try Demo <Play size={20} fill="currentColor" />
            </button>
          </div>

          <div style={{ marginTop: 40, fontSize: 14, color: 'var(--text-ghost)', fontWeight: 600, letterSpacing: 0.5 }}>
            PROUDLY PART OF <a href="https://Newstartlist.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-sub)', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>NEWSTARTLIST.COM</a>
          </div>
        </div>
      </section>

      {/* ── Features Section ────────────────────────────────────────────── */}
      <section id="features" ref={featuresRef} style={{ padding: '120px 5vw', background: 'var(--bg-raised)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <span style={{ 
              color: 'var(--blue)', 
              fontWeight: 800, 
              letterSpacing: 2, 
              textTransform: 'uppercase', 
              fontSize: 14 
            }}>Built for collaboration</span>
            <h2 style={{ fontSize: 48, fontWeight: 900, marginTop: 12 }}>Work like you're in the same room.</h2>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: 32 
          }}>
            {[
              {
                icon: <Zap size={32} />,
                title: 'Spontaneous Huddles',
                desc: 'Jump into audio and screen shares instantly. No links, no scheduling, just talk.'
              },
              {
                icon: <Users size={32} />,
                title: 'Visual Presence',
                desc: "See who's at their desk, who's busy, and who's on break. Reclaiming the office vibe."
              },
              {
                icon: <Shield size={32} />,
                title: 'Privacy by Design',
                desc: 'No database, no tracking. Your office lives only in your browser and on your team’s screens.'
              },
              {
                icon: <Target size={32} />,
                title: 'Focus Focused',
                desc: 'Persistent but non-intrusive. Stay connected without the noise of typical apps.'
              },
              {
                icon: <Infinity size={32} />,
                title: 'Infinite Continuity',
                desc: 'The office is always there. Bookmark it and return anytime to see your team.'
              },
              {
                icon: <LayoutGrid size={32} />,
                title: 'Company Culture',
                desc: 'Add custom office rules and norms to define how your remote team works together.'
              }
            ].map((f, i) => (
              <div key={i} className="card" style={{ 
                padding: 40, 
                backgroundColor: 'var(--bg-tile)',
                transition: 'transform 0.2s',
                cursor: 'default'
              }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                <div style={{ color: 'var(--blue)', marginBottom: 24 }}>{f.icon}</div>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-sub)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 5vw', textAlign: 'center' }}>
        <div style={{ 
          maxWidth: 900, 
          margin: '0 auto', 
          background: 'var(--blue)', 
          borderRadius: 40, 
          padding: '80px 40px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
           <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 42, fontWeight: 900, marginBottom: 24 }}>Ready to bring your team closer?</h2>
            <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
              Launch your own Guddl. office in seconds, or read the docs to host it on your own server.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn" style={{ background: 'white', color: 'var(--blue)', fontWeight: 800, padding: '16px 32px', borderRadius: 12 }} onClick={() => navigate('/create')}>
                Get Started for Free
              </button>
              <Link to="/docs" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 800, padding: '16px 32px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                <BookOpen size={18} /> Read Documentation
              </Link>
            </div>
           </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ 
        padding: '80px 5vw 40px', 
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)'
      }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 40
        }}>
          <MiniBranding />
          
          <div style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: 15, maxWidth: 600, lineHeight: 1.6 }}>
            <p>
              Guddl. is a product of <strong><a href="https://Newstartlist.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text)', textDecoration: 'none' }}>Newstartlist.com</a></strong>. 
              We build tools for the modern internet.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 32 }}>
             <Link to="/docs" style={{ color: 'var(--text-ghost)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Self-Hosting</Link>
             <Link to="/demo" style={{ color: 'var(--text-ghost)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Live Demo</Link>
          </div>

          <div style={{ color: 'var(--text-ghost)', fontSize: 13, fontWeight: 500 }}>
            © {new Date().getFullYear()} Guddl. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
