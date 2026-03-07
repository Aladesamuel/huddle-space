import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Monitor, MonitorOff, PhoneOff, UserPlus, X } from 'lucide-react';
import useStore from '../store/useStore';

export default function HuddlePopup({
  peer, broadcast, connectionsRef,
  startAudio, stopAudio, setMicMuted,
  startScreenShare, stopScreenShare, remoteScreenStream,
}) {
  const {
    huddle, teammates, user,
    setMuted, leaveHuddle,
  } = useStore();

  const [showAddMenu, setShowAddMenu]   = useState(false);
  const [screenFull,  setScreenFull]    = useState(false);
  const audioStartedRef = useRef(false);

  // ─── Start audio when huddle activates ────────────────────────────────────
  useEffect(() => {
    if (huddle.active && !audioStartedRef.current) {
      audioStartedRef.current = true;
      startAudio(huddle.members, huddle.isMuted);
    }
    if (!huddle.active) {
      audioStartedRef.current = false;
      stopAudio();
    }
  }, [huddle.active]); // eslint-disable-line

  // ─── Mute toggle ──────────────────────────────────────────────────────────
  const handleMuteToggle = () => setMicMuted(!huddle.isMuted);

  // ─── Screen share toggle ──────────────────────────────────────────────────
  const handleScreenToggle = async () => {
    const isMeSharing = huddle.isSharing && huddle.streamerId === peer?.id;
    if (isMeSharing) {
      stopScreenShare();
    } else if (!huddle.isSharing) {
      await startScreenShare(huddle.members);
    } else {
      alert(`${teammates[huddle.streamerId]?.name || 'Someone'} is already sharing.`);
    }
  };

  // ─── Leave huddle ─────────────────────────────────────────────────────────
  const handleLeave = () => {
    broadcast({ type: 'HUDDLE_LEAVE', fromPeerId: peer?.id });
    leaveHuddle();
  };

  // ─── Add teammate ─────────────────────────────────────────────────────────
  const handleAddTeammate = (peerId) => {
    const conn = connectionsRef?.current?.[peerId];
    if (conn?.open) {
      conn.send({ type: 'HUDDLE_INVITE', fromPeerId: peer?.id, fromName: user?.name, huddleId: Date.now().toString() });
    }
    setShowAddMenu(false);
  };

  const availableToAdd = Object.entries(teammates).filter(
    ([pid, data]) => !huddle.members.includes(pid) && data.status === 'Available'
  );

  if (!huddle.active) return null;

  const isMeSharing  = huddle.isSharing && huddle.streamerId === peer?.id;
  const sharerName   = huddle.streamerId === peer?.id
    ? 'You'
    : (teammates[huddle.streamerId]?.name || 'Someone');

  return (
    <>
      {/* ── Screen Share Viewer ── */}
      {remoteScreenStream && (
        <div style={{
          position: 'fixed',
          top: screenFull ? 0 : '70px',
          left: screenFull ? 0 : '50%',
          transform: screenFull ? 'none' : 'translateX(-50%)',
          width:  screenFull ? '100vw' : 'min(900px, 90vw)',
          height: screenFull ? '100vh' : 'auto',
          aspectRatio: screenFull ? 'auto' : '16/9',
          maxHeight: screenFull ? '100vh' : '70vh',
          zIndex: 900,
          background: '#000',
          borderRadius: screenFull ? 0 : '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <video
            ref={el => {
              if (el && el.srcObject !== remoteScreenStream) {
                el.srcObject = remoteScreenStream;
              }
            }}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', flex: 1, backgroundColor: '#000', objectFit: 'contain', display: 'block' }}
          />
          {/* Header bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: '8px 16px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>
              🖥 {sharerName} is sharing their screen
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setScreenFull(f => !f)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}
              >
                {screenFull ? 'Restore' : 'Fullscreen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Me Sharing — live preview badge ── */}
      {isMeSharing && (
        <div style={{
          position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(26,115,232,0.95)', color: '#fff', borderRadius: '20px',
          padding: '6px 16px', fontSize: '13px', fontWeight: 500, zIndex: 901,
          display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f28b82', display: 'inline-block' }} />
          You are sharing your screen
          <button
            onClick={stopScreenShare}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '6px', padding: '2px 10px', cursor: 'pointer', fontSize: '12px' }}
          >
            Stop
          </button>
        </div>
      )}

      {/* ── Huddle Overlay ── */}
      <div className="huddle-overlay">
        <div className="huddle-header">
          <span style={{ fontWeight: 600, fontSize: '13px' }}>
            🎙 Huddle · {huddle.members.length + 1} people
          </span>
        </div>

        <div className="huddle-content">
          {/* Member avatars */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
            {/* Self */}
            <div title={`${user?.name} (you)`} style={{
              width: '38px', height: '38px', borderRadius: '50%',
              backgroundColor: user?.avatar?.bg || '#1a73e8',
              color: user?.avatar?.color || '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', flexShrink: 0, position: 'relative',
              border: `2px solid ${huddle.isMuted ? '#5f6368' : '#34a853'}`,
            }}>
              {user?.avatar?.icon || user?.name?.[0] || '👤'}
              {huddle.isMuted && (
                <span style={{
                  position: 'absolute', bottom: '-3px', right: '-3px',
                  background: '#d93025', borderRadius: '50%',
                  width: '14px', height: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px'
                }}>🔇</span>
              )}
            </div>

            {/* Others */}
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
              <button className="huddle-btn" style={{ width: '38px', height: '38px' }}
                onClick={() => setShowAddMenu(v => !v)} title="Add someone">
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
                    : availableToAdd.map(([pid, data]) => (
                      <button key={pid} onClick={() => handleAddTeammate(pid)} style={{
                        display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                        background: 'none', border: 'none', padding: '7px 10px', cursor: 'pointer',
                        borderRadius: '6px', fontSize: '13px', color: '#202124'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#f1f3f4'}
                      onMouseOut={e  => e.currentTarget.style.background = 'none'}
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

          {/* Muted hint */}
          {huddle.isMuted && (
            <div style={{
              fontSize: '12px', color: '#9aa0a6', textAlign: 'center',
              padding: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px'
            }}>
              You're muted — tap the mic to respond
            </div>
          )}

          {/* Sharing status (when someone else is sharing) */}
          {huddle.isSharing && !isMeSharing && (
            <div style={{
              marginTop: '8px', fontSize: '12px', color: '#8ab4f8',
              background: 'rgba(26,115,232,0.15)', borderRadius: '6px', padding: '6px 10px'
            }}>
              🖥 {sharerName} is sharing — scroll up to view
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="huddle-controls">
          <button className="huddle-btn"
            onClick={handleMuteToggle}
            style={{ backgroundColor: huddle.isMuted ? 'rgba(217,48,37,0.5)' : '' }}
            title={huddle.isMuted ? 'Unmute' : 'Mute'}
          >
            {huddle.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            className={`huddle-btn${isMeSharing ? ' active' : ''}`}
            onClick={handleScreenToggle}
            title={isMeSharing ? 'Stop sharing' : 'Share screen'}
          >
            {isMeSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
          </button>

          <button className="huddle-btn leave" onClick={handleLeave} title="Leave huddle">
            <PhoneOff size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
