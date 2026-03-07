import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Monitor, MonitorOff, PhoneOff, UserPlus, Maximize2, Minimize2 } from 'lucide-react';
import useStore from '../store/useStore';

export default function HuddlePopup({
  peer, broadcast, connectionsRef,
  startAudio, stopAudio, setMicMuted,
  startScreenShare, stopScreenShare, remoteScreenStream,
}) {
  const { huddle, teammates, user, leaveHuddle } = useStore();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [screenFull,  setScreenFull]  = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position,    setPosition]    = useState({ x: 0, y: 0 });
  const [isDragging,  setIsDragging]  = useState(false);
  const dragStartRef  = useRef({ x: 0, y: 0 });
  const audioStartedRef = useRef(false);

  /* ── Drag ──────────────────────────────────────────────────────────────── */
  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    const move = (e) => {
      if (!isDragging) return;
      setPosition({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
    };
    const up = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    }
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [isDragging]);

  /* ── Audio lifecycle ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (huddle.active && !audioStartedRef.current) {
      audioStartedRef.current = true;
      startAudio(huddle.members, huddle.isMuted);
    }
    if (!huddle.active) { audioStartedRef.current = false; stopAudio(); }
  }, [huddle.active]); // eslint-disable-line

  /* ── Handlers ───────────────────────────────────────────────────────── */
  const handleMuteToggle = () => setMicMuted(!huddle.isMuted);

  const handleScreenToggle = async () => {
    const isMeSharing = huddle.isSharing && huddle.streamerId === peer?.id;
    if (isMeSharing)          stopScreenShare();
    else if (!huddle.isSharing) await startScreenShare(huddle.members);
    else alert(`${teammates[huddle.streamerId]?.name || 'Someone'} is already sharing.`);
  };

  const handleLeave = () => {
    broadcast({ type: 'HUDDLE_LEAVE', fromPeerId: peer?.id });
    leaveHuddle();
  };

  const handleAddTeammate = (peerId) => {
    const conn = connectionsRef?.current?.[peerId];
    if (conn?.open) conn.send({ type: 'HUDDLE_INVITE', fromPeerId: peer?.id, fromName: user?.name, huddleId: Date.now().toString() });
    setShowAddMenu(false);
  };

  const availableToAdd = Object.entries(teammates).filter(
    ([pid, data]) => !huddle.members.includes(pid) && data.status === 'Available'
  );

  if (!huddle.active) return null;

  const isMeSharing = huddle.isSharing && huddle.streamerId === peer?.id;
  const sharerName  = huddle.streamerId === peer?.id ? 'You' : (teammates[huddle.streamerId]?.name || 'Someone');
  const memberCount = huddle.members.length + 1;

  return (
    <>
      {/* ── Screen Share Viewer ─────────────────────────────────────────── */}
      {remoteScreenStream && (
        <div style={{
          position: 'fixed',
          top:    screenFull ? 0 : 88,
          left:   screenFull ? 0 : '50%',
          transform: screenFull ? 'none' : 'translateX(-50%)',
          width:  screenFull ? '100vw' : 'min(960px, 92vw)',
          height: screenFull ? '100vh' : 'auto',
          aspectRatio: screenFull ? 'auto' : '16/9',
          maxHeight: screenFull ? '100vh' : '72vh',
          zIndex: 900,
          background: '#000',
          borderRadius: screenFull ? 0 : 20,
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
          border: screenFull ? 'none' : '1px solid rgba(255,255,255,0.08)',
          animation: 'fadeIn 0.4s ease-out',
        }}>
          <video
            ref={el => { if (el && el.srcObject !== remoteScreenStream) el.srcObject = remoteScreenStream; }}
            autoPlay playsInline muted
            style={{ width: '100%', flex: 1, objectFit: 'contain', display: 'block', background: '#000' }}
          />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: '20px 24px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Monitor size={15} /> {sharerName} is sharing their screen
            </span>
            <button
              onClick={() => setScreenFull(f => !f)}
              style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)' }}
            >
              {screenFull ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              {screenFull ? 'Shrink' : 'Expand'}
            </button>
          </div>
        </div>
      )}

      {/* ── Sharing indicator badge ──────────────────────────────────────── */}
      {isMeSharing && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--danger)', color: '#fff', borderRadius: 40,
          padding: '9px 22px', fontSize: 13, fontWeight: 700, zIndex: 1001,
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 32px rgba(234,67,53,0.5)',
          animation: 'slideInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <span className="live-dot" />
          SCREEN SHARING LIVE
          <button onClick={stopScreenShare} style={{ background: '#fff', border: 'none', color: 'var(--danger)', borderRadius: 20, padding: '3px 14px', cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>
            STOP
          </button>
        </div>
      )}

      {/* ── Huddle Panel ────────────────────────────────────────────────── */}
      <div
        className="huddle-overlay"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
          userSelect: isDragging ? 'none' : 'auto',
        }}
      >
        {/* Header — drag handle */}
        <div
          className="huddle-header"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
            {/* Live mic pulse */}
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: huddle.isMuted ? 'var(--text-muted)' : 'var(--success)',
              display: 'inline-block',
              boxShadow: huddle.isMuted ? 'none' : '0 0 0 3px rgba(52,168,83,0.25)',
              animation: huddle.isMuted ? 'none' : 'live-glow 1.8s ease-in-out infinite',
            }} />
            <span>HUDDLE</span>
            <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '1px 8px', fontSize: 11 }}>
              {memberCount}
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
          </button>
        </div>

        {/* Body — collapses when minimized */}
        {!isMinimized && (
          <div className="huddle-content" style={{ animation: 'fadeInFast 0.25s ease' }}>

            {/* Member bubbles */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18, alignItems: 'center' }}>
              {/* Me */}
              <div title={`${user?.name} (you)`} style={{ position: 'relative' }}>
                <div style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: user?.avatar?.bg || 'var(--pc)',
                  color: user?.avatar?.color || '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 21,
                  boxShadow: huddle.isMuted ? '0 0 0 2px var(--text-muted)' : '0 0 0 2.5px var(--success)',
                  transition: 'box-shadow 0.3s ease',
                }}>
                  {user?.avatar?.icon || user?.name?.[0] || '?'}
                </div>
                {huddle.isMuted && (
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--huddle-bg)',
                  }}>
                    <MicOff size={9} color="#fff" strokeWidth={3} />
                  </div>
                )}
                <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>
                  You
                </div>
              </div>

              {/* Others */}
              {huddle.members.map(mid => {
                const tm = teammates[mid];
                return (
                  <div key={mid} title={tm?.name} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%',
                      background: tm?.avatar?.bg || 'var(--bg-card)',
                      color: tm?.avatar?.color || '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 21,
                      boxShadow: '0 0 0 2.5px var(--success)',
                    }}>
                      {tm?.avatar?.icon || tm?.name?.[0] || '?'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600, maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tm?.name?.split(' ')[0]}
                    </div>
                  </div>
                );
              })}

              {/* Add person */}
              <div style={{ position: 'relative', textAlign: 'center' }}>
                <button
                  className="huddle-btn"
                  style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}
                  onClick={() => setShowAddMenu(v => !v)}
                  title="Add someone"
                >
                  <UserPlus size={17} />
                </button>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>Add</div>

                {showAddMenu && (
                  <div style={{
                    position: 'absolute', bottom: 64, left: 0,
                    background: 'var(--bg-elevated)', borderRadius: 16, padding: 12,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.7)', minWidth: 200, zIndex: 1010,
                    border: '1px solid var(--border)',
                    animation: 'slideInUp 0.25s ease-out',
                    textAlign: 'left',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', padding: '0 8px 8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Available
                    </div>
                    {availableToAdd.length === 0
                      ? <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: 8 }}>No one available</div>
                      : availableToAdd.map(([pid, data]) => (
                        <button key={pid} onClick={() => handleAddTeammate(pid)} style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          background: 'none', border: 'none', padding: '9px 10px', cursor: 'pointer',
                          borderRadius: 10, fontSize: 14, color: 'var(--text)', transition: 'background 0.15s',
                        }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseOut={e => e.currentTarget.style.background = 'none'}
                        >
                          <span style={{ fontSize: 18 }}>{data.avatar?.icon || '👤'}</span>
                          <span style={{ fontWeight: 600 }}>{data.name}</span>
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Mic status line */}
            <div style={{
              padding: '9px 14px', borderRadius: 10,
              background: huddle.isMuted ? 'var(--danger-light)' : 'rgba(52,168,83,0.1)',
              border: `1px solid ${huddle.isMuted ? 'rgba(234,67,53,0.2)' : 'rgba(52,168,83,0.15)'}`,
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600,
              color: huddle.isMuted ? '#f48771' : 'var(--success)',
            }}>
              {huddle.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
              {huddle.isMuted ? 'You are muted' : 'People can hear you'}
            </div>

            {/* Screen share banner */}
            {huddle.isSharing && !isMeSharing && (
              <div style={{
                marginTop: 10, padding: '9px 14px', borderRadius: 10,
                background: 'var(--pc-light)', border: '1px solid rgba(66,133,244,0.15)',
                fontSize: 13, fontWeight: 600, color: '#8ab4f8',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Monitor size={13} /> {sharerName} is sharing — scroll up
              </div>
            )}
          </div>
        )}

        {/* Controls — circular icon buttons, like the reference image */}
        <div className="huddle-controls">
          {/* Mic */}
          <div style={{ textAlign: 'center' }}>
            <button
              className={`huddle-btn${huddle.isMuted ? '' : ''}`}
              onClick={handleMuteToggle}
              style={{
                background: huddle.isMuted ? 'var(--danger)' : 'rgba(255,255,255,0.12)',
                boxShadow: huddle.isMuted ? '0 4px 16px rgba(234,67,53,0.4)' : 'none',
              }}
              title={huddle.isMuted ? 'Unmute' : 'Mute'}
            >
              {huddle.isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, fontWeight: 600, letterSpacing: '0.3px' }}>
              {huddle.isMuted ? 'Unmute' : 'Mute'}
            </div>
          </div>

          {/* Screen share */}
          <div style={{ textAlign: 'center' }}>
            <button
              className={`huddle-btn${isMeSharing ? ' active' : ''}`}
              onClick={handleScreenToggle}
              style={{ background: isMeSharing ? 'var(--pc)' : 'rgba(255,255,255,0.12)', boxShadow: isMeSharing ? '0 4px 16px var(--pc-glow)' : 'none' }}
              title={isMeSharing ? 'Stop sharing' : 'Share screen'}
            >
              {isMeSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
            </button>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, fontWeight: 600, letterSpacing: '0.3px' }}>
              {isMeSharing ? 'Stop' : 'Share'}
            </div>
          </div>

          {/* Leave — red, like the reference */}
          <div style={{ textAlign: 'center' }}>
            <button className="huddle-btn leave" onClick={handleLeave} title="Leave huddle">
              <PhoneOff size={20} />
            </button>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, fontWeight: 600, letterSpacing: '0.3px' }}>
              Leave
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInUp   { from { transform:translateY(10px);opacity:0 } to { transform:translateY(0);opacity:1 } }
        @keyframes slideInDown { from { transform:translateX(-50%) translateY(-20px);opacity:0 } to { transform:translateX(-50%) translateY(0);opacity:1 } }
        @keyframes live-glow   { 0%,100% { box-shadow:0 0 0 3px rgba(52,168,83,0.25) } 50% { box-shadow:0 0 0 6px rgba(52,168,83,0) } }
        .live-dot {
          width:8px;height:8px;border-radius:50%;background:white;display:inline-block;
          animation:live-dot-pulse 1.4s ease-in-out infinite;
        }
        @keyframes live-dot-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
      `}</style>
    </>
  );
}
