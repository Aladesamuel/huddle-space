import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Lock, Settings, Share2, ArrowRight, CheckCircle, Infinity, Zap, Users, Shield, Target } from 'lucide-react';
import Branding, { MiniBranding } from '../components/Branding';

export default function Home() {
  const [name, setName]             = useState('');
  const [rules, setRules]           = useState('');
  const [password, setPassword]     = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [creating, setCreating]     = useState(false);
  const navigate = useNavigate();
  const formRef = useRef(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    setCreating(true);
    const roomId  = Math.random().toString(36).substring(2, 10);
    const data    = { n: name, r: rules, p: !!password, h: password ? btoa(password) : null };
    const link    = `${window.location.origin}/room/${roomId}#data=${btoa(JSON.stringify(data))}`;
    setInviteLink(link);
    setCreating(false);
  };

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', overflowX: 'hidden' }}>
      
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav style={{
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 5vw',
        position: 'sticky',
        top: 0,
        background: 'rgba(11, 12, 13, 0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        borderBottom: '1px solid var(--border)'
      }}>
        <MiniBranding />
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <a href="#features" style={{ color: 'var(--text-sub)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Features</a>
          <a href="https://Newstartlist.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-sub)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Company</a>
          <button className="btn btn-primary" onClick={scrollToForm} style={{ height: 44 }}>
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
            No meetings, no calendars, just your team working together with high-fidelity audio and presence.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
            <button className="btn btn-primary" style={{ height: 62, padding: '0 42px', fontSize: 18, borderRadius: 16, backgroundColor: 'var(--blue)', fontWeight: 800 }} onClick={scrollToForm}>
              Launch Guddl. <ArrowRight size={20} />
            </button>
          </div>

          <div style={{ marginTop: 40, fontSize: 14, color: 'var(--text-ghost)', fontWeight: 600, letterSpacing: 0.5 }}>
            PROUDLY PART OF <a href="https://Newstartlist.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-sub)', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>NEWSTARTLIST.COM</a>
          </div>
        </div>
      </section>

      {/* ── Features Section ────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '120px 5vw', background: 'var(--bg-raised)' }}>
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

      {/* ── Start Section ───────────────────────────────────────────────── */}
      <section ref={formRef} style={{ padding: '120px 5vw', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          <div style={{ textAlign: 'center', marginBottom: 42 }}>
            <h2 style={{ fontSize: 42, fontWeight: 900, marginBottom: 14 }}>
              Ready to Guddl.?
            </h2>
            <p style={{ color: 'var(--text-sub)', fontSize: 17, lineHeight: 1.6, fontWeight: 500 }}>
              {inviteLink
                ? 'Your workspace is live. Share the link with your team.'
                : 'Create your digital office in seconds. No account required.'}
            </p>
          </div>

          {!inviteLink ? (
            <form onSubmit={handleCreate} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 16,
              background: 'var(--bg-raised)',
              padding: 32,
              borderRadius: 24,
              border: '1px solid var(--border)'
            }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label><LayoutGrid size={12} /> Office Name</label>
                <input className="form-input" placeholder="e.g. Acme Studio HQ" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>
                  <Settings size={12} /> Guidelines
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-ghost)', fontSize: 12, marginLeft: 4 }}>optional</span>
                </label>
                <textarea className="form-input" placeholder="Focus hours, norms, etc." style={{ minHeight: 80 }} value={rules} onChange={e => setRules(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>
                  <Lock size={12} /> Password
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-ghost)', fontSize: 12, marginLeft: 4 }}>optional</span>
                </label>
                <input className="form-input" type="password" placeholder="Leave blank for open access" value={password} onChange={e => setPassword(e.target.value)} />
              </div>

              <button className="btn btn-primary" style={{ height: 52, fontSize: 15, borderRadius: 12, marginTop: 4 }} disabled={creating}>
                {creating ? 'Spinning up... ' : 'Start Guddl.'} {!creating && <ArrowRight size={17} />}
              </button>
            </form>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '36px 32px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'var(--green-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: 'var(--green)',
              }}>
                <CheckCircle size={28} />
              </div>
              <h2 style={{ marginBottom: 8, fontWeight: 700 }}>{name}</h2>
              <p style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 22, lineHeight: 1.6 }}>
                Copy this link and send it to your team.
              </p>

              <div
                onClick={() => { navigator.clipboard.writeText(inviteLink); }}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1.5px dashed var(--border-hi)',
                  borderRadius: 14, padding: '16px', fontSize: 13, color: 'var(--text-sub)',
                  wordBreak: 'break-all', cursor: 'pointer', marginBottom: 14, lineHeight: 1.5,
                }}
                title="Click to copy"
              >{inviteLink}</div>

              <div className="alert-warning" style={{ marginBottom: 22, display: 'flex', gap: 10, textAlign: 'left' }}>
                <span>⚠️</span>
                <span><strong>Bookmark this.</strong> We don't use a database. This link is the only way back.</span>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline" style={{ flex: 1, height: 46 }} onClick={() => { navigator.clipboard.writeText(inviteLink); alert('Copied!'); }}>
                  <Share2 size={14} /> Copy Link
                </button>
                <button className="btn btn-primary" style={{ flex: 1, height: 46 }} onClick={() => navigate(`/room/${inviteLink.split('/room/')[1]}`)}>
                  Enter Office <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
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

          <div style={{ color: 'var(--text-ghost)', fontSize: 13, fontWeight: 500 }}>
            © {new Date().getFullYear()} Guddl. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
