import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { User, Shield, Check } from 'lucide-react';
import useStore from '../store/useStore';

const AVATARS = [
  { id: '1', icon: '👤', bg: '#e8f0fe', color: '#1a73e8' },
  { id: '2', icon: '💼', bg: '#fef7e0', color: '#f9ab00' },
  { id: '3', icon: '🚀', bg: '#e6f4ea', color: '#1e8e3e' },
  { id: '4', icon: '💡', bg: '#fce8e6', color: '#d93025' },
  { id: '5', icon: '🎨', bg: '#f3e8fd', color: '#a142f4' },
  { id: '6', icon: '🧠', bg: '#e1f5fe', color: '#039be5' },
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
      return { officeData: null, error: 'Invalid invite link.' };
    }
  }, [hash]);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState('');

  // Combine manual errors with parse errors
  const activeError = error || parseError;

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');

    if (officeData?.p) {
      const hashedEntered = btoa(password);
      if (hashedEntered !== officeData.h) {
        setError('Incorrect office password.');
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

  if (!officeData && !error) return <div style={{ textAlign: 'center', marginTop: '60px' }}>Loading office details...</div>;

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, color: '#3c4043' }}>
          {error ? 'Oops!' : `Join ${officeData?.n}`}
        </h2>
        <p style={{ color: '#70757a', marginTop: '8px' }}>
          {error ? error : "Set up your professional profile to enter the office."}
        </p>
      </div>

      {!error && (
        <form className="card" onSubmit={handleJoin}>
          {officeData?.p && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Shield size={16} /> Office Password
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
            <label>Full Name</label>
            <input 
              className="form-input" 
              placeholder="e.g. Sam Wilson"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input 
              className="form-input" 
              type="email"
              placeholder="sam@startup.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Select Your Avatar</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
              {AVATARS.map((av) => (
                <div 
                  key={av.id}
                  onClick={() => setSelectedAvatar(av)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    backgroundColor: av.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    cursor: 'pointer',
                    border: selectedAvatar.id === av.id ? `2px solid ${av.color}` : '2px solid transparent',
                    position: 'relative',
                  }}
                >
                  {av.icon}
                  {selectedAvatar.id === av.id && (
                    <div style={{ 
                      position: 'absolute', top: '-6px', right: '-6px', 
                      backgroundColor: av.color, color: 'white', borderRadius: '50%',
                      width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Check size={12} strokeWidth={4} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
            Enter Office
          </button>
        </form>
      )}

      {error && (
        <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => navigate('/')}>
          Return Home
        </button>
      )}
    </div>
  );
}
