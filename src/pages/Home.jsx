import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


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
    <div style={{ maxWidth: '600px', margin: '40px auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '8px', color: '#1a73e8' }}>Create your Virtual Office</h1>
      <p style={{ color: '#70757a', marginBottom: '32px' }}>High-performance virtual space for spontaneous startup huddles.</p>

      {!inviteLink ? (
        <form className="card" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Startup / Company Name</label>
            <input 
              className="form-input" 
              placeholder="e.g. Acme Studio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Office Rules (Optional)</label>
            <textarea 
              className="form-input" 
              placeholder="e.g. No meetings after 4pm"
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Office Password (Leave blank for public)</label>
            <input 
              className="form-input" 
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} disabled={isCreating}>
            {isCreating ? 'Creating Space...' : 'Generate Invite Link'}
          </button>
        </form>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#e8f0fe', borderRadius: '4px', border: '1px solid #1a73e8' }}>
            <h3 style={{ color: '#1a73e8', marginBottom: '8px' }}>Office Created!</h3>
            <p style={{ fontSize: '14px' }}>Share this link with your teammates to invite them to <strong>{name}</strong>.</p>
          </div>
          
          <div className="form-group">
            <input className="form-input" readOnly value={inviteLink} onClick={(e) => e.target.select()} />
          </div>

          <p style={{ fontSize: '12px', color: '#d93025', marginBottom: '24px' }}>
            ⚠️ Save this link! Without a database, this is the only way to access your office.
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-outline" 
              style={{ flex: 1 }}
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                alert('Copied to clipboard!');
              }}
            >
              Copy Link
            </button>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1 }}
              onClick={() => {
                navigate(`/room/${inviteLink.split('/room/')[1]}`);
              }}
            >
              Enter Office
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
