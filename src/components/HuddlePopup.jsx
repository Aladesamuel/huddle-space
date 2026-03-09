import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Monitor, MonitorOff, PhoneOff, UserPlus, Maximize2, Minimize2 } from 'lucide-react';
import useStore from '../store/useStore';

export default function HuddleBar({
  peer, broadcast, connectionsRef,
  startAudio, stopAudio, setMicMuted,
  startScreenShare, stopScreenShare, remoteScreenStream,
}) {
  const { huddle, teammates, user, leaveHuddle } = useStore();

  const [showAddMenu,      setShowAddMenu]      = useState(false);
  const [screenFull,       setScreenFull]        = useState(false);
  const [screenPos,        setScreenPos]         = useState({ x: 0, y: 0 });
  const [isScreenDragging, setIsScreenDragging]  = useState(false);
  const screenDragStart = useRef({ x: 0, y: 0 });
  const audioStartedRef = useRef(false);

  /* ── Screen viewer drag ─────────────────────────────────────────────── */
  const handleScreenMouseDown = (e) => {
    if (e.target.closest('button')) return;
    setIsScreenDragging(true);
    screenDragStart.current = { x: e.clientX - screenPos.x, y: e.clientY - screenPos.y };
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isScreenDragging) return;
      setScreenPos({ x: e.clientX - screenDragStart.current.x, y: e.clientY - screenDragStart.current.y });
    };
    const onUp = () => setIsScreenDragging(false);
    if (isScreenDragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup',  onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',  onUp);
    };
  }, [isScreenDragging]);

  /* Reset position when a new stream arrives */
  useEffect(() => { setScreenPos({ x: 0, y: 0 }); }, [remoteScreenStream]);

  /* ── Audio lifecycle ─────────────────────────────────────────────────── */
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

  /* ── Handlers ───────────────────────────────────────────────────────── */
  const toggleMute = () => setMicMuted(!huddle.isMuted);

  const toggleScreen = async () => {
    const mine = huddle.isSharing && huddle.streamerId === peer?.id;
    if (mine)                   stopScreenShare();
    else if (!huddle.isSharing) await startScreenShare(huddle.members);
    else alert(`${teammates[huddle.streamerId]?.name ?? 'Someone'} is already sharing.`);
  };

  const handleLeave = () => {
    broadcast({ type: 'HUDDLE_LEAVE', fromPeerId: peer?.id });
    leaveHuddle();
  };

  const handleAddPerson = (email) => {
    const tm = teammates[email];
    if (tm?.peerId) {
      const conn = connectionsRef?.current?.[tm.peerId];
      if (conn?.open) {
        conn.send({ type: 'HUDDLE_INVITE', fromEmail: user?.email, fromName: user?.name, huddleId: Date.now().toString() });
      }
    }
    setShowAddMenu(false);
  };

  const availableToAdd = Object.entries(teammates).filter(
    ([email, d]) => email !== user?.email && !huddle.members.includes(email) && d.status === 'Available'
  );

  if (!huddle.active) return null;

  const isMeSharing = huddle.isSharing && huddle.streamerId === peer?.id;
  const sharerName  = huddle.streamerId === peer?.id ? 'You' : (Object.values(teammates).find(t => t.peerId === huddle.streamerId)?.name ?? 'Someone');

  return (
    <>

      {/* ── Screen share viewer ─────────────────────────────────────────── */}
      {remoteScreenStream && (
        <div
          className={`screen-viewer${screenFull ? ' full' : ''}`}
          style={{
            transform: screenFull ? 'none' : `translate(${screenPos.x}px, ${screenPos.y}px)`,
            transition: isScreenDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
            userSelect: isScreenDragging ? 'none' : 'auto',
          }}
        >
          <video
            ref={el => { if (el && el.srcObject !== remoteScreenStream) el.srcObject = remoteScreenStream; }}
            autoPlay playsInline muted
          />
          {/* Drag handle + controls */}
          <div
            className="screen-viewer-bar"
            onMouseDown={screenFull ? undefined : handleScreenMouseDown}
            style={{ cursor: screenFull ? 'default' : (isScreenDragging ? 'grabbing' : 'grab') }}
          >
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, pointerEvents: 'none' }}>
              <Monitor size={14} /> {sharerName} is sharing · drag to move
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setScreenFull(f => !f); setScreenPos({ x: 0, y: 0 }); }}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {screenFull ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                {screenFull ? 'Shrink' : 'Expand'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── "You are sharing" badge ─────────────────────────────────────── */}
      {isMeSharing && (
        <div className="share-badge">
          <span className="live-dot" />
          SCREEN SHARING
          <button
            onClick={stopScreenShare}
            style={{ background: '#fff', border: 'none', color: 'var(--red)', borderRadius: 20, padding: '3px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 800 }}
          >
            STOP
          </button>
        </div>
      )}

      {/* ── Huddle bottom control bar ───────────────────────────────────── */}
      <div className="huddle-bar">

        {/* Left — member bubbles */}
        <div className="huddle-members">
          {/* Me */}
          <div
            className="huddle-member-bubble"
            title={`${user?.name} (you)`}
            style={{ background: user?.avatar?.bg ?? 'var(--blue)', zIndex: huddle.members.length + 1 }}
          >
            {user?.avatar?.icon ?? user?.name?.[0]}
          </div>
          {/* Others */}
          {huddle.members.map((email, i) => {
            const tm = teammates[email];
            return (
              <div
                key={email}
                className="huddle-member-bubble"
                title={tm?.name ?? email}
                style={{ background: tm?.avatar?.bg ?? 'rgba(255,255,255,0.1)', zIndex: huddle.members.length - i }}
              >
                {tm?.avatar?.icon ?? tm?.name?.[0] ?? '?'}
              </div>
            );
          })}
          {/* Member count label */}
          <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-sub)' }}>
            {huddle.members.length + 1} in huddle
          </span>
        </div>

        {/* Centre — control buttons */}
        <div className="ctrl-group">

          {/* Mic */}
          <button
            className={`ctrl-btn${huddle.isMuted ? ' muted' : ''}`}
            onClick={toggleMute}
            title={huddle.isMuted ? 'Unmute' : 'Mute'}
          >
            <div className="ctrl-icon">
              {huddle.isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </div>
            <span className="ctrl-label">{huddle.isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Screen share */}
          <button
            className={`ctrl-btn${isMeSharing ? ' sharing' : ''}`}
            onClick={toggleScreen}
            title={isMeSharing ? 'Stop sharing' : 'Share screen'}
          >
            <div className="ctrl-icon">
              {isMeSharing ? <MonitorOff size={22} /> : <Monitor size={22} />}
            </div>
            <span className="ctrl-label">{isMeSharing ? 'Stop share' : 'Share'}</span>
          </button>

          {/* Add person */}
          <div style={{ position: 'relative' }}>
            <button className="ctrl-btn" onClick={() => setShowAddMenu(v => !v)} title="Add someone">
              <div className="ctrl-icon"><UserPlus size={22} /></div>
              <span className="ctrl-label">Add</span>
            </button>

            {showAddMenu && (
              <div className="add-menu">
                <div className="add-menu-heading">Available Teammates</div>
                {availableToAdd.length === 0
                  ? <div style={{ fontSize: 13, color: 'var(--text-ghost)', padding: '4px 10px' }}>No one available</div>
                  : availableToAdd.map(([email, d]) => (
                    <button key={email} className="add-menu-item" onClick={() => handleAddPerson(email)}>
                      <span style={{ fontSize: 20 }}>{d.avatar?.icon ?? '👤'}</span>
                      <span style={{ fontWeight: 600 }}>{d.name}</span>
                    </button>
                  ))
                }
              </div>
            )}
          </div>

          {/* Leave */}
          <button className="ctrl-btn leave" onClick={handleLeave} title="Leave huddle">
            <div className="ctrl-icon"><PhoneOff size={22} /></div>
            <span className="ctrl-label">Leave</span>
          </button>
        </div>

        {/* Right — mic status */}
        <div className="huddle-status">
          {huddle.isMuted
            ? <><MicOff size={14} color="var(--red)" /><span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>Muted</span></>
            : <><Mic size={14} color="var(--green)" /><span style={{ color: 'var(--green)', fontSize: 12, fontWeight: 600 }}>Live</span></>
          }
        </div>

      </div>
    </>
  );
}
