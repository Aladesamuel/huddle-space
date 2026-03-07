import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Check, User, ArrowRight, Home as HomeIcon } from 'lucide-react';
import useStore from '../store/useStore';

const AVATARS = [
  { id: '1', icon: '👤', bg: 'hsl(230, 85%, 95%)', color: 'hsl(230, 85%, 60%)' },
  { id: '2', icon: '💼', bg: 'hsl(40, 90%, 95%)', color: 'hsl(40, 90%, 55%)' },
  { id: '3', icon: '🚀', bg: 'hsl(150, 70%, 95%)', color: 'hsl(150, 70%, 40%)' },
  { id: '4', icon: '💡', bg: 'hsl(0, 80%, 95%)', color: 'hsl(0, 80%, 60%)' },
  { id: '5', icon: '🎨', bg: 'hsl(270, 70%, 95%)', color: 'hsl(270, 70%, 60%)' },
  { id: '6', icon: '🧠', bg: 'hsl(200, 80%, 95%)', color: 'hsl(200, 80%, 50%)' },
];

export default function Onboarding() {
  const { roomId } = useParams();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { setUser, setOffice } = useStore();

  const { officeData, error: parseError } = React.useMemo(() => {
    try {
      const query = new URLSearchParams(hash.replace('#', '?'));
      const dataStr = query.get('data');
      if (dataStr) {
        return { officeData: JSON.parse(atob(dataStr)), error: '' };
      }
      return { officeData: null, error: '' };
    } catch (e) {
      console.error('Failed to parse office data:', e);
      return { officeData: null, error: 'The invite link appears to be invalid.' };
    }
  }, [hash]);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState('');

  const activeError = error || parseError;

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');

    if (officeData?.p) {
      const hashedEntered = btoa(password);
      if (hashedEntered !== officeData.h) {
        setError('Incorrect office password. Please try again.');
        return;
      }
    }

    const newUser = {
      id: Math.random().toString(36).substring(2, 9),
      name: userName,
      email: userEmail,
      avatar: selectedAvatar,
      status: 'Available',
    };

    setUser(newUser);
    setOffice({ name: officeData?.n || 'Virtual Office', rules: officeData?.r, id: roomId });
    navigate(`/office/${roomId}`);
  };

  if (!officeData && !activeError) return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
      <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--pc)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: '540px', margin: '60px auto', animation: 'fadeIn 0.6s ease-out' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>
          {activeError ? 'Access Denied' : `Welcome to ${officeData?.n}`}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '16px' }}>
          {activeError ? activeError : "Complete your professional profile to enter the space."}
        </p>
      </div>

      {!activeError && (
        <form className="card" onSubmit={handleJoin} style={{ padding: '40px' }}>
          {officeData?.p && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Shield size={16} /> Secure Office Password
              </label>
              <input 
                className="form-input" 
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} /> Display Name
            </label>
            <input 
              className="form-input" 
              placeholder="e.g. Sarah Jenkins"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Work Email</label>
            <input 
              className="form-input" 
              type="email"
              placeholder="sarah@hq.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Avatar Character</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
              {AVATARS.map((av) => (
                <div 
                  key={av.id}
                  onClick={() => setSelectedAvatar(av)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '16px',
                    backgroundColor: av.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    borderColor: selectedAvatar.id === av.id ? av.color : 'transparent',
                    boxShadow: selectedAvatar.id === av.id ? `0 8px 20px -5px ${av.color}66` : 'none',
                    transform: selectedAvatar.id === av.id ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    position: 'relative',
                  }}
                >
                  <span style={{ filter: selectedAvatar.id === av.id ? 'none' : 'grayscale(0.4)' }}>
                    {av.icon}
                  </span>
                  {selectedAvatar.id === av.id && (
                    <div style={{ 
                      position: 'absolute', top: '-6px', right: '-6px', 
                      backgroundColor: av.color, color: 'white', borderRadius: '50%',
                      width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      <Check size={12} strokeWidth={4} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', height: '54px', fontSize: '16px', marginTop: '12px' }}>
            Enter Office Workspace <ArrowRight size={18} />
          </button>
        </form>
      )}

      {activeError && (
        <div style={{ textAlign: 'center' }}>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', height: '50px' }} 
            onClick={() => navigate('/')}
          >
            <HomeIcon size={18} /> Return Home
          </button>
        </div>
      )}
    </div>
  );
}
