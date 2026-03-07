import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Monitor, MonitorOff, PhoneOff, UserPlus } from 'lucide-react';
import useStore from '../store/useStore';

export default function HuddlePopup({ peer, broadcast, connectionsRef }) {
  const { 
    huddle, huddleInvite, 
    teammates, user, 
    setMuted, setSharing, 
    leaveHuddle, joinHuddle, 
    setHuddleInvite 
  } = useStore();

  const [localStream, setLocalStream] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const screenStreamRef = useRef(null);

  // ─── Manage microphone stream ───────────────────────────────────────────────
  useEffect(() => {
    if (huddle.active) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          setLocalStream(stream);
          // Mute/unmute toggle handled via track enabled
        })
        .catch(err => console.error('Mic access denied:', err));
    } else {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        setLocalStream(null);
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
    }
  }, [huddle.active]);

  // ─── Sync mute state to audio track ─────────────────────────────────────
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = !huddle.isMuted; });
    }
  }, [huddle.isMuted, localStream]);

  // ─── Handle screen share ─────────────────────────────────────────────────
  const toggleScreenShare = async () => {
    if (huddle.isSharing && huddle.streamerId === user?.id) {
      // Stop sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
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
      } catch (e) {
        console.error('Screen share failed:', e);
      }
    } else {
      alert(`${teammates[huddle.streamerId]?.name || 'Someone'} is already sharing their screen.`);
    }
  };

  // ─── Handle leave ────────────────────────────────────────────────────────
  const handleLeave = () => {
    broadcast({ type: 'HUDDLE_LEAVE', fromPeerId: peer?.id });
    leaveHuddle();
  };

  // ─── Handle adding a teammate ────────────────────────────────────────────
  const handleAddTeammate = (peerId) => {
    const conn = connectionsRef?.current?.[peerId];
    const huddleId = Date.now().toString();
    if (conn && conn.open) {
      conn.send({ type: 'HUDDLE_INVITE', fromPeerId: peer?.id, fromName: user?.name, huddleId });
    }
    setShowAddMenu(false);
  };

  // ─── Accept incoming invite ──────────────────────────────────────────────
  const handleAcceptInvite = () => {
    if (!huddleInvite) return;
    const { fromPeerId, conn } = huddleInvite;
    // Join the huddle locally
    joinHuddle([fromPeerId]);
    // Tell originator we accepted
    if (conn && conn.open) {
      conn.send({ type: 'HUDDLE_ACCEPT', fromPeerId: peer?.id });
    }
  };

  const handleDeclineInvite = () => {
    setHuddleInvite(null);
  };

  // Peers not in huddle (for Add button)
  const availableToAdd = Object.entries(teammates).filter(
    ([peerId, data]) => !huddle.members.includes(peerId) && data.status === 'Available'
  );

  return (
    <>
      {/* ─── Incoming Invite Banner ─── */}
      {huddleInvite && !huddle.active && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#202124', color: '#fff', borderRadius: '12px',
          padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 1000, minWidth: '320px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>📞 Incoming Huddle</div>
            <div style={{ fontSize: '13px', color: '#9aa0a6', marginTop: '2px' }}>
              {huddleInvite.fromName} wants to talk
            </div>
          </div>
          <button
            onClick={handleAcceptInvite}
            style={{
              background: '#1a73e8', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '8px 18px', cursor: 'pointer',
              fontWeight: 600, fontSize: '13px'
            }}
          >
            Join
          </button>
          <button
            onClick={handleDeclineInvite}
            style={{
              background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '8px 18px', cursor: 'pointer',
              fontWeight: 600, fontSize: '13px'
            }}
          >
            Decline
          </button>
        </div>
      )}

      {/* ─── Active Huddle Popup ─── */}
      {huddle.active && (
        <div className="huddle-overlay">
          <div className="huddle-header">
            <span style={{ fontWeight: 600 }}>
              🎙 Huddle · {huddle.members.length + 1} people
            </span>
          </div>

          <div className="huddle-content">
            {/* Member avatars */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
              {/* Self */}
              <div title={user?.name} style={{ 
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: user?.avatar?.bg || '#1a73e8', color: user?.avatar?.color || '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                border: '2px solid #fff', position: 'relative'
              }}>
                {user?.avatar?.icon || user?.name?.[0]}
                {huddle.isMuted && (
                  <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', fontSize: '10px' }}>🔇</span>
                )}
              </div>

              {/* Other members */}
              {huddle.members.map(mid => {
                const tm = teammates[mid];
                return (
                  <div key={mid} title={tm?.name} style={{ 
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: tm?.avatar?.bg || '#555', color: tm?.avatar?.color || '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                    border: '2px solid #fff'
                  }}>
                    {tm?.avatar?.icon || tm?.name?.[0] || '👤'}
                  </div>
                );
              })}

              {/* Add person button */}
              <div style={{ position: 'relative' }}>
                <button 
                  className="huddle-btn" 
                  style={{ width: '36px', height: '36px' }}
                  onClick={() => setShowAddMenu(v => !v)}
                >
                  <UserPlus size={16} />
                </button>
                {showAddMenu && (
                  <div style={{
                    position: 'absolute', bottom: '44px', left: 0,
                    background: '#fff', borderRadius: '8px', padding: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)', minWidth: '160px', zIndex: 10
                  }}>
                    {availableToAdd.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#70757a', padding: '4px 8px' }}>No one available</div>
                    ) : availableToAdd.map(([peerId, data]) => (
                      <button
                        key={peerId}
                        onClick={() => handleAddTeammate(peerId)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          width: '100%', background: 'none', border: 'none',
                          padding: '6px 8px', cursor: 'pointer', borderRadius: '6px',
                          fontSize: '13px', color: '#202124'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#f1f3f4'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                      >
                        <span>{data.avatar?.icon || '👤'}</span>
                        <span>{data.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Screen share status */}
            {huddle.isSharing && (
              <div style={{ 
                padding: '8px 12px', background: 'rgba(26,115,232,0.2)', borderRadius: '8px',
                fontSize: '12px', color: '#8ab4f8', marginBottom: '8px'
              }}>
                {huddle.streamerId === user?.id 
                  ? '🖥 You are sharing your screen' 
                  : `🖥 ${teammates[huddle.streamerId]?.name || 'Someone'} is sharing`}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="huddle-controls">
            <button 
              className="huddle-btn" 
              onClick={() => setMuted(!huddle.isMuted)}
              style={{ backgroundColor: huddle.isMuted ? 'rgba(217,48,37,0.5)' : '' }}
              title={huddle.isMuted ? 'Unmute' : 'Mute'}
            >
              {huddle.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button 
              className={`huddle-btn ${huddle.isSharing && huddle.streamerId === user?.id ? 'active' : ''}`}
              onClick={toggleScreenShare}
              title={huddle.isSharing && huddle.streamerId === user?.id ? 'Stop sharing' : 'Share screen'}
            >
              {huddle.isSharing && huddle.streamerId === user?.id
                ? <MonitorOff size={18} />
                : <Monitor size={18} />
              }
            </button>

            <button className="huddle-btn leave" onClick={handleLeave} title="Leave huddle">
              <PhoneOff size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
