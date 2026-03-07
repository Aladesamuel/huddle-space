import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Lock, Settings, Share2, ArrowRight, CheckCircle } from 'lucide-react';

export default function Home() {
  const [name, setName]             = useState('');
  const [rules, setRules]           = useState('');
  const [password, setPassword]     = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [creating, setCreating]     = useState(false);
  const navigate = useNavigate();

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: '100%', maxWidth: 520, animation: 'fadeIn 0.5s ease' }}>

        {/* Mark */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: 'var(--blue)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 20px',
            boxShadow: '0 8px 28px var(--blue-glow)',
          }}>🎙</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5, color: 'var(--text)', marginBottom: 10 }}>
            {inviteLink ? 'Your office is live' : 'Open a Virtual Office'}
          </h1>
          <p style={{ color: 'var(--text-sub)', fontSize: 15, lineHeight: 1.6 }}>
            {inviteLink
              ? 'Share the link below — your team can join in one click.'
              : 'A persistent room where your team drops in, talks, and shares screens.'}
          </p>
        </div>

        {!inviteLink ? (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              {creating ? 'Creating…' : 'Create Office'} {!creating && <ArrowRight size={17} />}
            </button>
          </form>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '36px 32px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'var(--green-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: 'var(--green)',
            }}>
              <CheckCircle size={24} />
            </div>
            <h2 style={{ marginBottom: 8, fontWeight: 700 }}>{name}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 22, lineHeight: 1.6 }}>
              Copy this link and send it to your team.
            </p>

            <div
              onClick={() => navigator.clipboard.writeText(inviteLink)}
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1.5px dashed var(--border-hi)',
                borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--text-sub)',
                wordBreak: 'break-all', cursor: 'pointer', marginBottom: 14, lineHeight: 1.5,
              }}
              title="Click to copy"
            >{inviteLink}</div>

            <div className="alert-warning" style={{ marginBottom: 22, display: 'flex', gap: 10, textAlign: 'left' }}>
              <span>⚠️</span>
              <span><strong>No database.</strong> Bookmark this link — it's the only way back to this office.</span>
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
    </div>
  );
}
