import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutGrid, Lock, Settings, Share2, ArrowRight, CheckCircle } from 'lucide-react';
import Branding, { MiniBranding } from '../components/Branding';

export default function Home() {
  const [name, setName]             = useState('');
  const [rules, setRules]           = useState('');
  const [password, setPassword]     = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [creating, setCreating]     = useState(false);
  const navigate = useNavigate();

  // Check if we are in Brand Site mode
  const isBrandSite = import.meta.env.VITE_BRAND_SITE === 'true';

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
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── Navbar (Minimal) ────────────────────────────────────────────── */}
      <nav style={{
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 5vw',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        borderBottom: '1px solid var(--border)'
      }}>
        <MiniBranding />
        {isBrandSite && (
          <Link to="/" style={{ color: 'var(--text-sub)', textDecoration: 'none', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            Back to Landing
          </Link>
        )}
      </nav>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          <div style={{ textAlign: 'center', marginBottom: 42 }}>
             {/* Center branding only if not inviting */}
             {!inviteLink && <div style={{ marginBottom: 32 }}><Branding size={40} spacing={20} fontSize={32} /></div>}
            
            <h2 style={{ fontSize: 42, fontWeight: 900, marginBottom: 14 }}>
              {inviteLink ? 'Office Ready.' : 'Create your Office'}
            </h2>
            <p style={{ color: 'var(--text-sub)', fontSize: 17, lineHeight: 1.6, fontWeight: 500 }}>
              {inviteLink
                ? 'Your workspace is live. Share the link with your team.'
                : 'Start your persistent digital office instantly. No account required.'}
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
              border: '1px solid var(--border)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.05)'
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

              <button className="btn btn-primary" style={{ height: 52, fontSize: 15, borderRadius: 12, marginTop: 4, backgroundColor: 'var(--blue)' }} disabled={creating}>
                {creating ? 'Spinning up... ' : 'Initialise Guddl.'} {!creating && <ArrowRight size={17} />}
              </button>
            </form>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '36px 32px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', background: 'var(--bg-raised)' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'var(--green-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px', color: 'var(--green)',
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
                  background: 'rgba(0,0,0,0.03)', border: '1.5px dashed var(--border-hi)',
                  borderRadius: 14, padding: '16px', fontSize: 13, color: 'var(--text-sub)',
                  wordBreak: 'break-all', cursor: 'pointer', marginBottom: 14, lineHeight: 1.5,
                }}
                title="Click to copy"
              >{inviteLink}</div>

              <div className="alert-warning" style={{ marginBottom: 22, display: 'flex', gap: 10, textAlign: 'left', borderRadius: 12 }}>
                <span>⚠️</span>
                <span><strong>Bookmark this.</strong> No database. This link is the only way back.</span>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline" style={{ flex: 1, height: 46 }} onClick={() => { navigator.clipboard.writeText(inviteLink); alert('Copied!'); }}>
                  <Share2 size={14} /> Copy Link
                </button>
                <button className="btn btn-primary" style={{ flex: 1, height: 46, backgroundColor: 'var(--blue)' }} onClick={() => navigate(`/room/${inviteLink.split('/room/')[1]}`)}>
                  Enter Office <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer style={{ padding: '40px 5vw', display: 'flex', justifyContent: 'center', color: 'var(--text-ghost)', fontSize: 12 }}>
         © {new Date().getFullYear()} Guddl. — Persistent Presence
      </footer>
    </div>
  );
}
