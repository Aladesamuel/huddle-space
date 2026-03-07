import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Info, Share2 } from 'lucide-react';
import useStore from '../store/useStore';
import usePeer from '../hooks/usePeer';
import HuddlePopup from '../components/HuddlePopup';

export default function Dashboard() {
  const { roomId } = useParams();
  const { user, office, teammates, joinHuddle, huddle } = useStore();
  const { isReady, broadcast, peer, connectionsRef, startAudio, stopAudio, setMicMuted } = usePeer(roomId);
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
      // Initiator joins UNMUTED — mic opens immediately
      joinHuddle([peerId]);
      useStore.getState().setMuted(false);
      startAudio([peerId], false); // false = not muted (initiator speaks right away)
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 500, color: '#202124' }}>{office?.name}</h1>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', color: '#70757a', fontSize: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
               <Users size={14} /> {Object.keys(teammates).length + 1} online
            </span>
            {office?.rules && (
              <span 
                style={{ cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => setShowRules(!showRules)}
              >
                <Info size={14} /> View Rules
              </span>
            )}
          </div>
        </div>
        
        <button className="btn btn-outline" onClick={copyInvite}>
          <Share2 size={16} /> Invite Teammates
        </button>
      </div>

      {showRules && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: '#e8f0fe', border: 'none' }}>
          <h4 style={{ color: '#1a73e8', marginBottom: '8px' }}>Office Rules</h4>
          <p style={{ whiteSpace: 'pre-line', fontSize: '14px' }}>{office?.rules}</p>
        </div>
      )}

      <div className="teammate-grid">
        {/* Self Card (optional, or just status indicator in header) */}
        
        {/* Real-time Teammates */}
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
              <div style={{ fontWeight: 500, color: '#3c4043' }}>{data.name}</div>
              <div style={{ fontSize: '12px', color: '#70757a', marginTop: '4px' }}>
                {data.status}
              </div>
            </div>
          </div>
        ))}

        {/* Placeholder if empty */}
        {Object.keys(teammates).length === 0 && (
          <div style={{ 
            gridColumn: '1 / -1', padding: '60px', textAlign: 'center', 
            border: '2px dashed #dadce0', borderRadius: '12px', color: '#70757a'
          }}>
            <p>You are the first one in the office.</p>
            <p style={{ marginTop: '8px', fontSize: '14px' }}>Share the link to bring in the team!</p>
          </div>
        )}
      </div>

      <HuddlePopup peer={peer} broadcast={broadcast} connectionsRef={connectionsRef} startAudio={startAudio} stopAudio={stopAudio} setMicMuted={setMicMuted} />
      
      {!isReady && (
        <div style={{ 
          position: 'fixed', bottom: '24px', left: '24px', 
          padding: '8px 16px', backgroundColor: '#202124', color: 'white', 
          borderRadius: '4px', fontSize: '12px', zIndex: 1000 
        }}>
          Connecting to P2P network...
        </div>
      )}
    </div>
  );
}
