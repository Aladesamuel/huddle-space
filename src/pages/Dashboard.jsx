import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Share2, Users, Info, Volume2, X, Mic } from 'lucide-react';
import useStore from '../store/useStore';
import usePeer from '../hooks/usePeer';
import HuddleBar from '../components/HuddlePopup';

export default function Dashboard() {
  const { roomId } = useParams();
  const { user, office, teammates, joinHuddle, huddle } = useStore();
  const {
    isReady, broadcast, peer, connectionsRef,
    startAudio, stopAudio, setMicMuted,
    startScreenShare, stopScreenShare, remoteScreenStream,
  } = usePeer(roomId);

  const [showRules, setShowRules] = useState(false);
  const count = Object.keys(teammates).length;

  const handleTapToTalk = (peerId) => {
    const target = teammates[peerId];
    if (huddle.active) { alert("You're already in an active huddle."); return; }
    if (target?.status === 'Available') {
      const huddleId = Date.now().toString();
      const conn     = connectionsRef?.current?.[peerId];
      if (conn?.open) {
        conn.send({ type: 'HUDDLE_INVITE', fromPeerId: peer?.id, fromName: user?.name, huddleId });
      } else {
        broadcast({ type: 'HUDDLE_INVITE', fromPeerId: peer?.id, fromName: user?.name, huddleId, targetPeerId: peerId });
      }
      joinHuddle([peerId]);
      useStore.getState().setMuted(false);
      startAudio([peerId], false);
    } else {
      alert(`${target?.name || 'Teammate'} is ${target?.status || 'unavailable'}.`);
    }
  };

  const copyInvite = () => {
    // Reconstruct the full invite link from stored office data (preserves name, rules, password)
    const data    = { n: office?.name, r: office?.rules, p: !!office?.p, h: office?.h ?? null };
    const encoded = btoa(JSON.stringify(data));
    const link    = `${window.location.origin}/room/${office?.id}#data=${encoded}`;
    navigator.clipboard.writeText(link);
    alert('Invite link copied!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', animation: 'fadeIn 0.4s ease' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        {/* Left: office name + count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--blue)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px var(--blue-glow)', flexShrink: 0,
          }}>
            <Volume2 size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', lineHeight: 1.2 }}>
              {office?.name || 'Virtual Office'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-sub)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 6px rgba(52,168,83,0.6)' }} />
                {count + 1} online
              </span>
              {office?.rules && (
                <button
                  onClick={() => setShowRules(s => !s)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--blue)', padding: 0 }}
                >
                  <Info size={13} /> Guidelines
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: my chip + invite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-hi)',
            borderRadius: 10, padding: '7px 14px 7px 10px',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: user?.avatar?.bg ?? 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>
              {user?.avatar?.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 1 }}>{user?.status}</div>
            </div>
          </div>
          <button className="btn btn-outline" onClick={copyInvite} style={{ height: 40, padding: '0 16px', borderRadius: 10 }}>
            <Share2 size={14} /> Invite
          </button>
        </div>
      </div>

      {/* ── Guidelines dropdown ──────────────────────────────────────────── */}
      {showRules && (
        <div style={{
          margin: '0 32px', marginTop: 16,
          background: 'rgba(26,115,232,0.08)',
          border: '1px solid rgba(26,115,232,0.18)',
          borderRadius: 14, padding: '18px 22px',
          position: 'relative', animation: 'fadeIn 0.25s ease',
        }}>
          <button
            onClick={() => setShowRules(false)}
            style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)' }}
          ><X size={16} /></button>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Office Guidelines</p>
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{office?.rules}</p>
        </div>
      )}

      {/* ── Presence Grid ────────────────────────────────────────────────── */}
      <div className="page-content">
        {count > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                {Object.entries(teammates).map(([peerId, data]) => {
            const inHuddle  = huddle.active && huddle.members.includes(peerId);
            const available = data.status === 'Available';

            return (
              <div
                key={peerId}
                className={`presence-tile ${inHuddle ? 'in-huddle' : ''}`}
                onClick={() => handleTapToTalk(peerId)}
                style={{ '--avatar-color': data.avatar?.color }}
              >
                {/* Role Badge (Floating top-left) */}
                {data.role && (
                  <div className="tile-role">
                    <span className="tile-role-dot" />
                    {data.role}
                  </div>
                )}

                {/* Colour wash background */}
                <div className="tile-bg" />

                {/* Avatar with vivid ring */}
                <div
                  className="tile-avatar"
                  style={{
                    background: data.avatar?.bg ?? 'rgba(255,255,255,0.06)',
                    border: `3px solid ${data.avatar?.color ?? 'rgba(255,255,255,0.2)'}`,
                    boxShadow: `0 0 0 2px rgba(0,0,0,0.6), 0 0 20px ${data.avatar?.color ?? 'transparent'}55`,
                  }}
                >
                  {data.avatar?.icon ?? data.name?.[0]}
                </div>

                {/* Name */}
                <div className="tile-name">{data.name}</div>

                {/* Status Row */}
                <div className="tile-status-row">
                  <div className={`tile-status-dot ${(data.status ?? 'available').toLowerCase().replace(' ', '-')}`} />
                  <span className="tile-status-label">{data.status}</span>
                  {inHuddle && (
                    <div className="tile-wave" style={{ marginLeft: 4 }}>
                      <span /><span /><span />
                    </div>
                  )}
                </div>

                {/* Tap to talk overlay */}
                {available && !huddle.active && (
                  <div className="tile-cta">
                    <div className="tile-cta-pill">
                      <Mic size={13} /> Talk
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty state */}
          {count === 0 && (
            <div className="empty-grid">
              <div style={{
                width: 56, height: 56, background: 'rgba(255,255,255,0.04)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users size={26} strokeWidth={1.5} color="var(--text-ghost)" />
              </div>
              <h3>Just you for now</h3>
              <p>Share the invite link to get your team in.</p>
              <button className="btn btn-outline" onClick={copyInvite} style={{ marginTop: 8 }}>
                <Share2 size={14} /> Copy Invite Link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Huddle bottom bar ────────────────────────────────────────────── */}
      <HuddleBar
        peer={peer} broadcast={broadcast} connectionsRef={connectionsRef}
        startAudio={startAudio} stopAudio={stopAudio} setMicMuted={setMicMuted}
        startScreenShare={startScreenShare} stopScreenShare={stopScreenShare}
        remoteScreenStream={remoteScreenStream}
      />

      {/* Connecting toast */}
      {!isReady && (
        <div className="connecting-toast">
          <div className="spin-ring" />
          Connecting to workspace…
        </div>
      )}
    </div>
  );
}
