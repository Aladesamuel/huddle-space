import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, ScreenShare, X, Plus, PhoneOff } from 'lucide-react';
import useStore from '../store/useStore';

export default function HuddlePopup({ peer, broadcast }) {
  const { huddle, teammates, setMuted, setSharing, leaveHuddle, user } = useStore();
  const [localStream, setLocalStream] = useState(null);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    if (huddle.active) {
      // Initialize audio stream
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          setLocalStream(stream);
          // Simplified: In a real app, we'd attach this to Peer calls
          console.log('Audio stream active');
        })
        .catch(err => console.error('Failed to get audio:', err));
    } else {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
    }
  }, [huddle.active]);

  if (!huddle.active) return null;

  return (
    <div className="huddle-overlay">
      <div className="huddle-header">
        <span>Active Huddle ({huddle.members.length + 1})</span>
        <button className="huddle-btn" onClick={leaveHuddle} style={{ background: 'none' }}>
           <X size={16} />
        </button>
      </div>

      <div className="huddle-content">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {/* List of members icons */}
          <div style={{ 
            width: '32px', height: '32px', borderRadius: '50%', backgroundColor: user?.avatar?.bg || '#eee',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', border: '2px solid white'
          }}>
            {user?.avatar?.icon}
          </div>
          {huddle.members.map(mid => (
            <div key={mid} style={{ 
              width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#555',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', border: '2px solid white'
            }}>
              {teammates[mid]?.avatar?.icon || '👤'}
            </div>
          ))}
          <button className="huddle-btn" style={{ width: '32px', height: '32px' }}>
            <Plus size={14} />
          </button>
        </div>

        {huddle.isSharing && (
          <div style={{ 
            padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', 
            fontSize: '12px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.2)' 
          }}>
            {huddle.streamerId === user?.id ? 'You are sharing your screen' : 'Screen share in progress'}
          </div>
        )}
      </div>

      <div className="huddle-controls">
        <button 
          className="huddle-btn" 
          onClick={() => setMuted(!huddle.isMuted)}
          style={{ backgroundColor: huddle.isMuted ? 'rgba(217, 48, 37, 0.4)' : '' }}
        >
          {huddle.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        
        <button 
          className={`huddle-btn ${huddle.isSharing ? 'active' : ''}`}
          onClick={() => {
            if (huddle.isSharing) {
                setSharing(false);
            } else {
                setSharing(true, user?.id);
            }
          }}
        >
          <ScreenShare size={18} />
        </button>

        <button className="huddle-btn leave" onClick={leaveHuddle}>
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  );
}
