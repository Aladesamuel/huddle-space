import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Info, Share2, MessageSquare, ChevronDown } from 'lucide-react';
import useStore from '../store/useStore';
import usePeer from '../hooks/usePeer';
import HuddlePopup from '../components/HuddlePopup';

export default function Dashboard() {
  const { roomId } = useParams();
  const { user, office, teammates, joinHuddle, huddle } = useStore();
  const { isReady, broadcast, peer, connectionsRef, startAudio, stopAudio, setMicMuted, startScreenShare, stopScreenShare, remoteScreenStream } = usePeer(roomId);
  const [showRules, setShowRules] = useState(false);

  const handleTapToTalk = (peerId) => {
    const target = teammates[peerId];
    if (huddle.active) {
      alert(`You're already in an active huddle.`);
      return;
    }
    if (target?.status === 'Available') {
      const huddleId = Date.now().toString();
      const conn = connectionsRef?.current?.[peerId];
      if (conn && conn.open) {
        conn.send({ type: 'HUDDLE_INVITE', fromPeerId: peer?.id, fromName: user?.name, huddleId });
      } else {
        broadcast({ type: 'HUDDLE_INVITE', fromPeerId: peer?.id, fromName: user?.name, huddleId, targetPeerId: peerId });
      }
      joinHuddle([peerId]);
      useStore.getState().setMuted(false);
      startAudio([peerId], false);
    } else {
      alert(`${target?.name || 'Teammate'} is currently ${target?.status || 'Busy'}.`);
    }
  };

  const copyInvite = () => {
    const link = window.location.href.replace('/office/', '/room/');
    navigator.clipboard.writeText(link);
    alert('Invite link copied to clipboard!');
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '48px', padding: '24px', background: 'white', 
        borderRadius: '20px', border: '1px solid var(--border)', boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '12px', 
            background: 'linear-gradient(135deg, var(--pc), #a142f4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
          }}>
            <LayoutGridIcon size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{office?.name}</h1>
            <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
                {Object.keys(teammates).length + 1} Teammates Active
              </span>
              {office?.rules && (
                <span 
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--pc)' }}
                  onClick={() => setShowRules(!showRules)}
                >
                  <Info size={14} /> Guidelines
                </span>
              )}
            </div>
          </div>
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={copyInvite}
          style={{ height: '44px', borderRadius: '12px' }}
        >
          <Share2 size={16} /> Invite Team
        </button>
      </div>

      {showRules && (
        <div className="card" style={{ 
          marginBottom: '32px', background: 'var(--pc-light)', 
          border: '1px solid hsla(230, 85%, 60%, 0.1)', position: 'relative',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <button 
            onClick={() => setShowRules(false)}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pc)' }}
          >
            <X size={20} />
          </button>
          <h4 style={{ color: 'var(--pc)', marginBottom: '12px', fontSize: '16px', fontWeight: 700 }}>Office Guidelines</h4>
          <p style={{ whiteSpace: 'pre-line', fontSize: '14px', color: 'var(--text)', lineHeight: 1.6 }}>{office?.rules}</p>
        </div>
      )}

      <div className="teammate-grid">
        {Object.entries(teammates).map(([peerId, data]) => (
          <div 
            key={peerId} 
            className={`teammate-card ${huddle.active && huddle.members.includes(peerId) ? 'pulse' : ''}`}
            onClick={() => handleTapToTalk(peerId)}
          >
            <div className={`status-badge ${data.status?.toLowerCase().replace(' ', '-')}`}></div>
            <div className="avatar" style={{ backgroundColor: data.avatar?.bg, color: data.avatar?.color }}>
              {data.avatar?.icon}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '17px', marginBottom: '4px' }}>{data.name}</div>
              <div style={{ 
                fontSize: '11px', color: 'var(--text-secondary)', 
                textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600,
                backgroundColor: 'var(--bg)', padding: '4px 10px', borderRadius: '20px'
              }}>
                {data.status}
              </div>
            </div>

            {data.status === 'Available' && !huddle.active && (
              <div style={{ 
                marginTop: '20px', fontSize: '12px', color: 'var(--pc)', 
                fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                opacity: 0.8
              }}>
                <MessageSquare size={14} /> Tap to talk
              </div>
            )}
          </div>
        ))}

        {Object.keys(teammates).length === 0 && (
          <div style={{ 
            gridColumn: '1 / -1', padding: '80px', textAlign: 'center', 
            background: 'white', borderRadius: '24px', border: '2px dashed var(--border)',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ 
              width: '64px', height: '64px', backgroundColor: 'var(--bg)', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <Users size={32} strokeWidth={1.5} />
            </div>
            <h3 style={{ color: 'var(--text)', marginBottom: '8px' }}>Solitary Session</h3>
            <p style={{ fontSize: '15px' }}>You're the only one in the office right now.</p>
            <button 
              className="btn btn-outline" 
              onClick={copyInvite}
              style={{ marginTop: '24px', borderRadius: '12px' }}
            >
              Copy Invite Link
            </button>
          </div>
        )}
      </div>

      <HuddlePopup
        peer={peer} broadcast={broadcast} connectionsRef={connectionsRef}
        startAudio={startAudio} stopAudio={stopAudio} setMicMuted={setMicMuted}
        startScreenShare={startScreenShare} stopScreenShare={stopScreenShare}
        remoteScreenStream={remoteScreenStream}
      />
      
      {!isReady && (
        <div style={{ 
          position: 'fixed', bottom: '30px', left: '30px', 
          padding: '12px 20px', backgroundColor: 'var(--huddle-bg)', color: 'white', 
          borderRadius: '16px', fontSize: '13px', fontWeight: 500, zIndex: 1000,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          Initializing P2P Workspace...
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function LayoutGridIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function X({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
