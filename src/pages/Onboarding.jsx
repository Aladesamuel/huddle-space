import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Check, User, ArrowRight, Mail, Infinity } from 'lucide-react';
import useStore from '../store/useStore';
import Branding, { MiniBranding } from '../components/Branding';

/* Dark-tinted avatar backgrounds so they look great on the dark theme */
const AVATARS = [
  { id: '1', icon: '👤', bg: '#e8f0fe', color: '#1a73e8' },
  { id: '2', icon: '💼', bg: '#fef7e0', color: '#f9ab00' },
  { id: '3', icon: '🚀', bg: '#e6f4ea', color: '#188038' },
  { id: '4', icon: '💡', bg: '#fce8e6', color: '#d93025' },
  { id: '5', icon: '🎨', bg: '#f3e8fd', color: '#9333ea' },
  { id: '6', icon: '🧠', bg: '#e2f5f9', color: '#007b83' },
];

export default function Onboarding() {
  const { roomId }   = useParams();
  const { hash }     = useLocation();
  const navigate     = useNavigate();
  const { setUser, setOffice } = useStore();

  const { officeData, parseErr } = React.useMemo(() => {
    try {
      const q = new URLSearchParams(hash.replace('#', '?'));
      const s = q.get('data');
      return s ? { officeData: JSON.parse(atob(s)), parseErr: '' } : { officeData: null, parseErr: '' };
    } catch {
      return { officeData: null, parseErr: 'Invite link is invalid.' };
    }
  }, [hash]);

  const [userName,   setUserName]   = useState('');
  const [userEmail,  setUserEmail]  = useState('');
  const [role,       setRole]       = useState('');
  const [password,   setPassword]   = useState('');
  const [avatar,     setAvatar]     = useState(AVATARS[0]);
  const [error,      setError]      = useState('');

  const activeErr = error || parseErr;

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');
    if (officeData?.p && btoa(password) !== officeData.h) {
      setError('Incorrect password.'); return;
    }
    setUser({ id: Math.random().toString(36).slice(2, 9), name: userName, email: userEmail, role: role.trim(), avatar, status: 'Available' });
    setOffice({ name: officeData?.n ?? 'Guddl.', rules: officeData?.r, id: roomId, p: officeData?.p, h: officeData?.h });
    navigate(`/office/${roomId}`);
  };

  /* Loading */
  if (!officeData && !activeErr) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ width: '100%', maxWidth: 500 }}>

        {/* Branding Branding */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
          <MiniBranding size={24} fontSize={22} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-ash)', marginBottom: 12, letterSpacing: '-1.5px' }}>
            {activeErr ? 'Access Check' : 'Welcome to the team'}
          </h2>
          <p style={{ color: 'var(--text-ghost)', fontSize: 17, fontWeight: 500 }}>
            {activeErr || 'Setting up your profile for Guddl.'}
          </p>
        </div>

        {activeErr ? (
          <button className="btn btn-outline" style={{ width: '100%', height: 48, borderRadius: 12 }} onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        ) : (
          <form className="card" onSubmit={handleJoin} style={{ padding: 28 }}>

            {officeData?.p && (
              <div className="form-group">
                <label><Shield size={12} /> Office Password</label>
                <input className="form-input" type="password" placeholder="Enter password…" value={password} onChange={e => setPassword(e.target.value)} required />
                {error && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 6 }}>{error}</p>}
              </div>
            )}

            <div className="form-group">
              <label><User size={12} /> Display Name</label>
              <input className="form-input" placeholder="e.g. Sarah Jenkins" value={userName} onChange={e => setUserName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label><Mail size={12} /> Work Email</label>
              <input className="form-input" type="email" placeholder="sarah@company.com" value={userEmail} onChange={e => setUserEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                Role &amp; Seniority
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-ghost)', fontSize: 12, marginLeft: 4 }}>optional</span>
              </label>
              <input
                className="form-input"
                placeholder="e.g. Senior Developer, Junior Designer, Manager…"
                value={role}
                onChange={e => setRole(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Avatar</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                {AVATARS.map(av => (
                  <div
                    key={av.id}
                    onClick={() => setAvatar(av)}
                    style={{
                      aspectRatio: '1', borderRadius: 12,
                      background: av.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, cursor: 'pointer', position: 'relative',
                      border: `2px solid ${avatar.id === av.id ? av.color : 'transparent'}`,
                      boxShadow: avatar.id === av.id ? `0 0 0 3px ${av.color}30` : 'none',
                      transform: avatar.id === av.id ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.2s cubic-bezier(0.175,0.885,0.32,1.275)',
                    }}
                  >
                    {av.icon}
                    {avatar.id === av.id && (
                      <div style={{
                        position: 'absolute', top: -6, right: -6,
                        background: av.color, borderRadius: '50%',
                        width: 18, height: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={10} color="#fff" strokeWidth={4} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', height: 50, fontSize: 15, borderRadius: 12 }}>
              Enter Guddl. <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
