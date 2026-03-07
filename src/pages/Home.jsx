import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Lock, Settings, Share2, ArrowRight, CheckCircle } from 'lucide-react';

export default function Home() {
  const [name, setName]             = useState('');
  const [rules, setRules]           = useState('');
  const [password, setPassword]     = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const navigate = useNavigate();

  const handleCreate = (e) => {
    e.preventDefault();
    setIsCreating(true);
    const roomId  = Math.random().toString(36).substring(2, 10);
    const data    = { n: name, r: rules, p: !!password, h: password ? btoa(password) : null };
    const encoded = btoa(JSON.stringify(data));
    const link    = `${window.location.origin}/room/${roomId}#data=${encoded}`;
    setInviteLink(link);
    setIsCreating(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '100%', maxWidth: 560, animation: 'fadeIn 0.6s ease-out' }}>

        {/* Hero text */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--pc), #8ab4f8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 24px',
            boxShadow: '0 8px 32px var(--pc-glow)',
          }}>🎙</div>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-1px', color: 'var(--text)', marginBottom: 12 }}>
            {inviteLink ? 'Office Ready' : 'Open your Virtual Office'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
            {inviteLink
              ? 'Share the link below with your team and start huddling.'
              : 'Create a persistent audio space where your team can drop in and start voice huddles instantly.'}
          </p>
        </div>

        {!inviteLink ? (
          /* ── Create Form ── */
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label><LayoutGrid size={14} /> Office Name</label>
              <input
                className="form-input"
                placeholder="e.g. Acme Studio HQ"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label><Settings size={14} /> Guidelines <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)' }}>(optional)</span></label>
              <textarea
                className="form-input"
                placeholder="e.g. Focus hours 10am – 2pm. No meetings before standup."
                style={{ minHeight: 90 }}
                value={rules}
                onChange={e => setRules(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label><Lock size={14} /> Password <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)' }}>(optional)</span></label>
              <input
                className="form-input"
                type="password"
                placeholder="Leave blank for open access"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary"
              style={{ height: 54, fontSize: 16, borderRadius: 14, marginTop: 4 }}
              disabled={isCreating}
            >
              {isCreating ? 'Creating…' : 'Create Office'}
              {!isCreating && <ArrowRight size={18} />}
            </button>
          </form>
        ) : (
          /* ── Invite Link Card ── */
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, background: 'var(--success-light)',
              borderRadius: '16px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px', color: 'var(--success)',
            }}>
              <CheckCircle size={26} />
            </div>

            <h2 style={{ color: 'var(--text)', marginBottom: 8 }}>{name} is live</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Share this link with your teammates. Anyone with the link can join.
            </p>

            {/* Link box */}
            <div
              onClick={e => { e.target.select?.(); navigator.clipboard.writeText(inviteLink); }}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px dashed var(--border-strong)',
                borderRadius: 12, padding: '14px 16px',
                fontSize: 13, color: 'var(--text-secondary)',
                wordBreak: 'break-all', cursor: 'pointer',
                marginBottom: 16, lineHeight: 1.5,
                transition: 'border-color 0.2s',
              }}
              title="Click to copy"
            >
              {inviteLink}
            </div>

            {/* Warning */}
            <div className="alert-warning" style={{ marginBottom: 28, textAlign: 'left', display: 'flex', gap: 10 }}>
              <span>⚠️</span>
              <span><strong>No database used.</strong> Bookmark this link — it's the only way back to this office.</span>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1, height: 48, borderRadius: 12 }}
                onClick={() => { navigator.clipboard.writeText(inviteLink); alert('Copied!'); }}
              >
                <Share2 size={15} /> Copy Link
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, height: 48, borderRadius: 12 }}
                onClick={() => {
                  const roomPart = inviteLink.split('/room/')[1];
                  navigate(`/room/${roomPart}`);
                }}
              >
                Enter Office <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
