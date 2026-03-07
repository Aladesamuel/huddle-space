import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Lock, Settings, Share2, ArrowRight } from 'lucide-react';

export default function Home() {
  const [name, setName] = useState('');
  const [rules, setRules] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const navigate = useNavigate();

  const handleCreate = (e) => {
    e.preventDefault();
    setIsCreating(true);

    const roomId = Math.random().toString(36).substring(2, 10);
    const data = { n: name, r: rules, p: !!password, h: password ? btoa(password) : null };
    const encoded = btoa(JSON.stringify(data));
    const link = `${window.location.origin}/room/${roomId}#data=${encoded}`;
    
    setInviteLink(link);
    setIsCreating(false);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '60px auto', animation: 'fadeIn 0.6s ease-out' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 700, letterSpacing: '-1px', marginBottom: '12px', color: 'var(--text)' }}>
          Launch your <span style={{ color: 'var(--pc)' }}>Virtual Office</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '500px', margin: '0 auto' }}>
          Create a private, low-friction space for teammates to jump into voice huddles and share screens instantly.
        </p>
      </div>

      {!inviteLink ? (
        <form className="card" onSubmit={handleCreate} style={{ padding: '40px' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LayoutGrid size={16} /> Office Name
            </label>
            <input 
              className="form-input" 
              placeholder="e.g. Acme Studio HQ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={16} /> Office Guidelines (Optional)
            </label>
            <textarea 
              className="form-input" 
              placeholder="e.g. Focus hours: 10am - 2pm"
              style={{ minHeight: '100px', resize: 'vertical' }}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={16} /> Privacy Password
            </label>
            <input 
              className="form-input" 
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <small style={{ display: 'block', marginTop: '8px', color: 'var(--text-secondary)' }}>
              If set, teammates must enter this password to join your room.
            </small>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', height: '54px', fontSize: '16px' }} disabled={isCreating}>
            {isCreating ? 'Provisioning...' : 'Create Office & Get Link'}
            {!isCreating && <ArrowRight size={18} />}
          </button>
        </form>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '8px',
            background: 'linear-gradient(90deg, #1a73e8, #a142f4)' 
          }} />

          <div style={{ 
            width: '64px', height: '64px', backgroundColor: 'var(--pc-light)', 
            color: 'var(--pc)', borderRadius: '20px', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
          }}>
            <Share2 size={28} />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
            Office {name} is Ready!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>
            Share this link with your team. They can join your huddles in one click.
          </p>
          
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <input 
              className="form-input" 
              readOnly 
              value={inviteLink} 
              onClick={(e) => e.target.select()}
              style={{ 
                textAlign: 'center', background: 'var(--bg)', 
                fontWeight: 500, fontSize: '14px', borderStyle: 'dashed',
                cursor: 'pointer'
              }}
            />
          </div>

          <div style={{ 
            backgroundColor: 'hsla(0, 80%, 60%, 0.05)', padding: '16px', 
            borderRadius: '12px', border: '1px solid hsla(0, 80%, 60%, 0.1)',
            marginBottom: '32px', display: 'flex', gap: '12px'
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <p style={{ fontSize: '13px', color: 'var(--danger)', textAlign: 'left', lineHeight: 1.5 }}>
              <strong>Important:</strong> No database is used. Bookmark this link! It is the <strong>only way</strong> for your team to access this specific office.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              className="btn btn-outline" 
              style={{ flex: 1, height: '48px' }}
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                alert('Invite link copied to clipboard!');
              }}
            >
              <Share2 size={16} /> Copy Link
            </button>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, height: '48px' }}
              onClick={() => {
                const roomPart = inviteLink.split('/room/')[1];
                navigate(`/room/${roomPart}`);
              }}
            >
              Enter HQ <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
