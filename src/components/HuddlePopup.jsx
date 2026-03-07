import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Monitor, MonitorOff, PhoneOff, UserPlus } from 'lucide-react';
import useStore from '../store/useStore';

export default function HuddlePopup({ peer, broadcast, connectionsRef }) {
  const {
    huddle, teammates, user,
    setMuted, setSharing,
    leaveHuddle, joinHuddle
  } = useStore();

  const [localStream, setLocalStream] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const screenStreamRef = useRef(null);

  // ─── Microphone: open as soon as huddle becomes active ───────────────────
  useEffect(() => {
    if (huddle.active) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          setLocalStream(stream);
          // Respect initial mute state (receivers start muted)
          stream.getAudioTracks().forEach(t => { t.enabled = !huddle.isMuted; });
        })
        .catch(err => console.error('Mic access denied:', err));
    } else {
      // Cleanup mic on huddle end
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        setLocalStream(null);
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
    }
  }, [huddle.active]); // eslint-disable-line

  // ─── Sync mute toggle to audio track ─────────────────────────────────────
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = !huddle.isMuted; });
    }
  }, [huddle.isMuted, localStream]);

  // ─── Screen share ─────────────────────────────────────────────────────────
  const toggleScreenShare = async () => {
    if (huddle.isSharing && huddle.streamerId === user?.id) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setSharing(false, null);
      broadcast({ type: 'SHARING_STOPPED', peerId: peer?.id });
    } else if (!huddle.isSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setSharing(true, user?.id);
        broadcast({ type: 'SHARING_STARTED', peerId: peer?.id, name: user?.name });
        stream.getVideoTracks()[0].onended = () => {
          setSharing(false, null);
          broadcast({ type: 'SHARING_STOPPED', peerId: peer?.id });
          screenStreamRef.current = null;
        };
      } catch (e) { /* user cancelled */ }
    } else {
      alert(`${teammates[huddle.streamerId]?.name || 'Someone'} is already sharing.`);
    }
  };

  // ─── Leave huddle ─────────────────────────────────────────────────────────
  const handleLeave = () => {
    broadcast({ type: 'HUDDLE_LEAVE', fromPeerId: peer?.id });
    leaveHuddle();
  };

  // ─── Add another person ──────────────────────────────────────────────────
  const handleAddTeammate = (peerId) => {
    const conn = connectionsRef?.current?.[peerId];
    if (conn?.open) {
      conn.send({
        type: 'HUDDLE_INVITE',
        fromPeerId: peer?.id,
        fromName: user?.name,
        huddleId: Date.now().toString()
      });
    }
    setShowAddMenu(false);
  };

  const availableToAdd = Object.entries(teammates).filter(
    ([peerId, data]) => !huddle.members.includes(peerId) && data.status === 'Available'
  );

  if (!huddle.active) return null;

  const isMeSharing = huddle.isSharing && huddle.streamerId === user?.id;
  const sharerName = huddle.streamerId
    ? (huddle.streamerId === user?.id ? 'You' : teammates[huddle.streamerId]?.name || 'Someone')
    : null;

  return (
    <div className="huddle-overlay">
      {/* Header */}
      <div className="huddle-header">
        <span style={{ fontWeight: 600, fontSize: '13px' }}>
          🎙 Huddle &nbsp;·&nbsp; {huddle.members.length + 1} people
        </span>
      </div>

      {/* Member Bubbles */}
      <div className="huddle-content">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
          {/* Self */}
          <div
            title={`${user?.name} (you)${huddle.isMuted ? ' — muted' : ' — speaking'}`}
            style={{
              width: '38px', height: '38px', borderRadius: '50%',
              backgroundColor: user?.avatar?.bg || '#1a73e8',
              color: user?.avatar?.color || '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', border: `2px solid ${huddle.isMuted ? '#5f6368' : '#34a853'}`,
              position: 'relative', cursor: 'default', flexShrink: 0
            }}
          >
            {user?.avatar?.icon || user?.name?.[0] || '👤'}
            {huddle.isMuted && (
              <span style={{
                position: 'absolute', bottom: '-3px', right: '-3px',
                background: '#d93025', borderRadius: '50%', width: '14px', height: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px'
              }}>🔇</span>
            )}
          </div>

          {/* Other members */}
          {huddle.members.map(mid => {
            const tm = teammates[mid];
            return (
              <div key={mid} title={tm?.name || mid} style={{
                width: '38px', height: '38px', borderRadius: '50%',
                backgroundColor: tm?.avatar?.bg || '#5f6368',
                color: tm?.avatar?.color || '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', border: '2px solid #34a853', flexShrink: 0
              }}>
                {tm?.avatar?.icon || tm?.name?.[0] || '👤'}
              </div>
            );
          })}

          {/* Add person */}
          <div style={{ position: 'relative' }}>
            <button
              className="huddle-btn"
              style={{ width: '38px', height: '38px' }}
              onClick={() => setShowAddMenu(v => !v)}
              title="Add someone"
            >
              <UserPlus size={15} />
            </button>
            {showAddMenu && (
              <div style={{
                position: 'absolute', bottom: '46px', left: 0,
                background: '#fff', borderRadius: '10px', padding: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.18)', minWidth: '170px', zIndex: 20
              }}>
                {availableToAdd.length === 0
                  ? <div style={{ fontSize: '12px', color: '#70757a', padding: '6px 8px' }}>No one available</div>
                  : availableToAdd.map(([peerId, data]) => (
                    <button key={peerId} onClick={() => handleAddTeammate(peerId)} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                      background: 'none', border: 'none', padding: '7px 10px', cursor: 'pointer',
                      borderRadius: '6px', fontSize: '13px', color: '#202124', textAlign: 'left'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#f1f3f4'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                    >
                      <span>{data.avatar?.icon || '👤'}</span>
                      <span>{data.name}</span>
                    </button>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* Receiver prompt: you're muted — tap mic to respond */}
        {huddle.isMuted && (
          <div style={{
            fontSize: '12px', color: '#9aa0a6', textAlign: 'center',
            padding: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px'
          }}>
            You're muted — tap the mic to respond
          </div>
        )}

        {/* Screen share status */}
        {huddle.isSharing && (
          <div style={{
            marginTop: '8px', fontSize: '12px', color: '#8ab4f8',
            background: 'rgba(26,115,232,0.15)', borderRadius: '6px', padding: '6px 10px'
          }}>
            🖥 {sharerName} {isMeSharing ? 'are' : 'is'} sharing their screen
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="huddle-controls">
        <button
          className="huddle-btn"
          onClick={() => setMuted(!huddle.isMuted)}
          style={{ backgroundColor: huddle.isMuted ? 'rgba(217,48,37,0.5)' : '' }}
          title={huddle.isMuted ? 'Unmute (click to respond)' : 'Mute'}
        >
          {huddle.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <button
          className={`huddle-btn${isMeSharing ? ' active' : ''}`}
          onClick={toggleScreenShare}
          title={isMeSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isMeSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
        </button>

        <button className="huddle-btn leave" onClick={handleLeave} title="Leave huddle">
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  );
}
