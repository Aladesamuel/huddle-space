import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Check, User, ArrowRight, Home as HomeIcon, Mail } from 'lucide-react';
import useStore from '../store/useStore';

const AVATARS = [
  { id: '1', icon: '👤', bg: 'hsl(230,85%,20%)',  color: 'hsl(230,85%,70%)' },
  { id: '2', icon: '💼', bg: 'hsl(40,80%,18%)',   color: 'hsl(40,90%,60%)'  },
  { id: '3', icon: '🚀', bg: 'hsl(150,60%,15%)',  color: 'hsl(150,70%,50%)' },
  { id: '4', icon: '💡', bg: 'hsl(0,70%,18%)',    color: 'hsl(0,80%,65%)'   },
  { id: '5', icon: '🎨', bg: 'hsl(270,60%,20%)',  color: 'hsl(270,70%,70%)' },
  { id: '6', icon: '🧠', bg: 'hsl(200,70%,15%)',  color: 'hsl(200,80%,60%)' },
];

export default function Onboarding() {
  const { roomId }   = useParams();
  const { hash }     = useLocation();
  const navigate     = useNavigate();
  const { setUser, setOffice } = useStore();

  const { officeData, error: parseError } = React.useMemo(() => {
    try {
      const query   = new URLSearchParams(hash.replace('#', '?'));
      const dataStr = query.get('data');
      if (dataStr) return { officeData: JSON.parse(atob(dataStr)), error: '' };
      return { officeData: null, error: '' };
    } catch (e) {
      return { officeData: null, error: 'The invite link appears to be invalid.' };
    }
  }, [hash]);

  const [userName,       setUserName]       = useState('');
  const [userEmail,      setUserEmail]      = useState('');
  const [password,       setPassword]       = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [error,          setError]          = useState('');

  const activeError = error || parseError;

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');
    if (officeData?.p) {
      if (btoa(password) !== officeData.h) {
        setError('Incorrect password. Please try again.');
        return;
      }
    }
    const newUser = {
      id:     Math.random().toString(36).substring(2, 9),
      name:   userName,
      email:  userEmail,
      avatar: selectedAvatar,
      status: 'Available',
    };
    setUser(newUser);
    setOffice({ name: officeData?.n || 'Virtual Office', rules: officeData?.r, id: roomId });
    navigate(`/office/${roomId}`);
  };

  /* Loading state */
  if (!officeData && !activeError) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid var(--border)', borderTopColor: 'var(--pc)',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Office badge */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 40, padding: '8px 20px 8px 12px', marginBottom: 24,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '10px',
              background: 'var(--pc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>🎙</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
              {activeError ? 'Access Denied' : officeData?.n || 'Virtual Office'}
            </span>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            {activeError ? 'Invalid Link' : 'Set up your profile'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            {activeError || 'Choose how your teammates will see you.'}
          </p>
        </div>

        {/* Error fallback */}
        {activeError ? (
          <button className="btn btn-outline" style={{ width: '100%', height: 50, borderRadius: 14 }} onClick={() => navigate('/')}>
            <HomeIcon size={17} /> Return Home
          </button>
        ) : (
          <form className="card" onSubmit={handleJoin} style={{ padding: '32px' }}>

            {/* Password gate */}
            {officeData?.p && (
              <div className="form-group">
                <label><Shield size={13} /> Office Password</label>
                <input
                  className="form-input" type="password" placeholder="Enter password…"
                  value={password} onChange={e => setPassword(e.target.value)} required
                />
                {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{error}</p>}
              </div>
            )}

            {/* Display name */}
            <div className="form-group">
              <label><User size={13} /> Display Name</label>
              <input
                className="form-input" placeholder="e.g. Sarah Jenkins"
                value={userName} onChange={e => setUserName(e.target.value)} required
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label><Mail size={13} /> Work Email</label>
              <input
                className="form-input" type="email" placeholder="sarah@company.com"
                value={userEmail} onChange={e => setUserEmail(e.target.value)} required
              />
            </div>

            {/* Avatar picker */}
            <div className="form-group" style={{ marginBottom: 28 }}>
              <label>Avatar</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                {AVATARS.map(av => (
                  <div
                    key={av.id}
                    onClick={() => setSelectedAvatar(av)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 14,
                      background: av.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 26, cursor: 'pointer', position: 'relative',
                      border: `2px solid ${selectedAvatar.id === av.id ? av.color : 'transparent'}`,
                      boxShadow: selectedAvatar.id === av.id ? `0 0 0 3px ${av.color}33` : 'none',
                      transform: selectedAvatar.id === av.id ? 'scale(1.08)' : 'scale(1)',
                      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    }}
                  >
                    {av.icon}
                    {selectedAvatar.id === av.id && (
                      <div style={{
                        position: 'absolute', top: -6, right: -6,
                        background: av.color, color: '#fff', borderRadius: '50%',
                        width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                      }}>
                        <Check size={11} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', height: 52, fontSize: 15, borderRadius: 14 }}>
              Enter Office <ArrowRight size={17} />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
