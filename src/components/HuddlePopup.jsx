import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Monitor, MonitorOff, PhoneOff, UserPlus, X, Maximize2, Minimize2 } from 'lucide-react';
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
          top: screenFull ? 0 : '100px',
          left: screenFull ? 0 : '50%',
          transform: screenFull ? 'none' : 'translateX(-50%)',
          width:  screenFull ? '100vw' : 'min(1000px, 94vw)',
          height: screenFull ? '100vh' : 'auto',
          aspectRatio: screenFull ? 'auto' : '16/9',
          maxHeight: screenFull ? '100vh' : '75vh',
          zIndex: 900,
          background: 'rgba(0,0,0,0.9)',
          borderRadius: screenFull ? 0 : '24px',
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          border: screenFull ? 'none' : '1px solid rgba(255,255,255,0.1)',
          animation: 'fadeIn 0.4s ease-out'
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
            padding: '20px 24px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Monitor size={16} /> {sharerName} is sharing their screen
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setScreenFull(f => !f)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(10px)' }}
              >
                {screenFull ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {screenFull ? 'Contract' : 'Expand'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Me Sharing — live preview badge ── */}
      {isMeSharing && (
        <div style={{
          position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255, 77, 77, 0.95)', color: '#fff', borderRadius: '40px',
          padding: '10px 24px', fontSize: '14px', fontWeight: 700, zIndex: 1001,
          display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 10px 40px rgba(255, 77, 77, 0.4)',
          animation: 'slideInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <span className="live-pulse" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
          YOU ARE SHARING SCREEN
          <button
            onClick={stopScreenShare}
            style={{ background: '#fff', border: 'none', color: '#ff4d4d', borderRadius: '20px', padding: '4px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 800 }}
          >
            STOP
          </button>
        </div>
      )}

      {/* ── Huddle Overlay ── */}
      <div className="huddle-overlay">
        <div className="huddle-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--success)', display: 'flex' }}><Mic size={14} /></span>
            <span>HUDDLE · {huddle.members.length + 1} PEOPLE</span>
          </div>
        </div>

        <div className="huddle-content">
          {/* Member avatars */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            {/* Self */}
            <div title={`${user?.name} (you)`} style={{
              width: '44px', height: '44px', borderRadius: '16px',
              backgroundColor: user?.avatar?.bg || 'var(--pc)',
              color: user?.avatar?.color || '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', flexShrink: 0, position: 'relative',
              boxShadow: huddle.isMuted ? 'none' : `0 0 0 3px hsla(150, 70%, 40%, 0.4)`,
              transition: 'all 0.3s ease',
            }}>
              {user?.avatar?.icon || user?.name?.[0] || '👤'}
              {huddle.isMuted && (
                <div style={{
                  position: 'absolute', bottom: '-4px', right: '-4px',
                  background: 'var(--danger)', borderRadius: '50%',
                  width: '18px', height: '18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                  border: '2px solid var(--huddle-bg)',
                }}><MicOff size={10} strokeWidth={3} /></div>
              )}
            </div>

            {/* Others */}
            {huddle.members.map(mid => {
              const tm = teammates[mid];
              return (
                <div key={mid} title={tm?.name || mid} style={{
                  width: '44px', height: '44px', borderRadius: '16px',
                  backgroundColor: tm?.avatar?.bg || 'rgba(255,255,255,0.05)',
                  color: tm?.avatar?.color || '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', flexShrink: 0,
                  boxShadow: `0 0 0 3px hsla(150, 70%, 40%, 0.4)`,
                }}>
                  {tm?.avatar?.icon || tm?.name?.[0] || '👤'}
                </div>
              );
            })}

            {/* Add person */}
            <div style={{ position: 'relative' }}>
              <button 
                className="huddle-btn" 
                style={{ width: '44px', height: '44px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)' }}
                onClick={() => setShowAddMenu(v => !v)} 
                title="Add someone"
              >
                <UserPlus size={18} />
              </button>
              {showAddMenu && (
                <div style={{
                  position: 'absolute', bottom: '56px', left: 0,
                  background: '#fff', borderRadius: '16px', padding: '12px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)', minWidth: '200px', zIndex: 1010,
                  border: '1px solid rgba(0,0,0,0.1)',
                  animation: 'slideInUp 0.3s ease-out'
                }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, marginBottom: '8px', padding: '0 8px', letterSpacing: '0.5px' }}>AVAILABLE TEAMMATES</div>
                  {availableToAdd.length === 0
                    ? <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '8px' }}>No one nearby</div>
                    : availableToAdd.map(([pid, data]) => (
                      <button key={pid} onClick={() => handleAddTeammate(pid)} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                        background: 'none', border: 'none', padding: '10px', cursor: 'pointer',
                        borderRadius: '10px', fontSize: '14px', color: 'var(--text)', transition: 'background 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseOut={e  => e.currentTarget.style.background = 'none'}
                      >
                        <span style={{ fontSize: '18px' }}>{data.avatar?.icon || '👤'}</span>
                        <span style={{ fontWeight: 600 }}>{data.name}</span>
                      </button>
                    ))
                  }
                </div>
              )}
            </div>
          </div>

          {/* Muted hint */}
          {huddle.isMuted ? (
            <div style={{
              fontSize: '13px', color: '#ff4d4d', textAlign: 'center',
              padding: '10px', background: 'rgba(255, 77, 77, 0.1)', borderRadius: '12px',
              fontWeight: 600, border: '1px solid rgba(255, 77, 77, 0.1)'
            }}>
              Your microphone is muted
            </div>
          ) : (
             <div style={{
              fontSize: '13px', color: 'var(--success)', textAlign: 'center',
              padding: '10px', background: 'rgba(30, 215, 96, 0.05)', borderRadius: '12px',
              fontWeight: 600
            }}>
              People can hear you
            </div>
          )}

          {huddle.isSharing && !isMeSharing && (
            <div style={{
              marginTop: '12px', fontSize: '13px', color: 'var(--pc)',
              background: 'var(--pc-light)', borderRadius: '12px', padding: '10px 14px',
              fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
              color: '#8ab4f8'
            }}>
              <Monitor size={14} /> Screen View Active • {sharerName}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="huddle-controls">
          <button className={`huddle-btn ${huddle.isMuted ? 'active' : ''}`}
            onClick={handleMuteToggle}
            style={{ 
              backgroundColor: huddle.isMuted ? 'rgba(255, 77, 77, 0.2)' : '',
              color: huddle.isMuted ? '#ff4d4d' : '' 
            }}
          >
            {huddle.isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          <button
            className={`huddle-btn${isMeSharing ? ' active' : ''}`}
            onClick={handleScreenToggle}
          >
            {isMeSharing ? <MonitorOff size={22} /> : <Monitor size={22} />}
          </button>

          <button className="huddle-btn leave" onClick={handleLeave}>
            <PhoneOff size={22} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .live-pulse {
          animation: live-pulse-anim 1.5s infinite;
        }
        @keyframes live-pulse-anim {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
