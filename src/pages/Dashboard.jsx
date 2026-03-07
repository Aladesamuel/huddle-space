import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Info, Share2, X, Volume2, Mic } from 'lucide-react';
import useStore from '../store/useStore';
import usePeer from '../hooks/usePeer';
import HuddlePopup from '../components/HuddlePopup';

export default function Dashboard() {
  const { roomId } = useParams();
  const { user, office, teammates, joinHuddle, huddle } = useStore();
  const {
    isReady, broadcast, peer, connectionsRef,
    startAudio, stopAudio, setMicMuted,
    startScreenShare, stopScreenShare, remoteScreenStream,
  } = usePeer(roomId);

  const [showRules, setShowRules] = useState(false);

  /* ── Tap‑to‑talk ─────────────────────────────────────────────────────── */
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
    alert('Invite link copied!');
  };

  const allPresent = Object.keys(teammates).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', animation: 'fadeIn 0.5s ease-out' }}>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        {/* Back arrow area / office name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'var(--pc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px var(--pc-glow)', flexShrink: 0,
          }}>
            <Volume2 size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
              {office?.name || 'Virtual Office'}
            </h1>
            <div style={{ display: 'flex', align: 'center', gap: '12px', marginTop: '2px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                {allPresent + 1} {allPresent + 1 === 1 ? 'person' : 'people'} online
              </span>
              {office?.rules && (
                <span
                  onClick={() => setShowRules(!showRules)}
                  style={{ fontSize: '13px', color: 'var(--pc)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Info size={13} /> Guidelines
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* My own status chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 14px 8px 10px',
            background: 'var(--bg-card)', borderRadius: '30px',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '10px',
              background: user?.avatar?.bg || 'var(--bg-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              {user?.avatar?.icon}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{user?.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>{user?.status}</div>
            </div>
          </div>

          <button className="btn btn-outline" onClick={copyInvite} style={{ height: 40, borderRadius: '12px', gap: '8px' }}>
            <Share2 size={15} /> Invite
          </button>
        </div>
      </div>

      {/* ── Guidelines Banner ───────────────────────────────────────────── */}
      {showRules && (
        <div style={{
          margin: '0 40px',
          marginTop: '20px',
          background: 'var(--pc-light)',
          border: '1px solid rgba(66,133,244,0.15)',
          borderRadius: 16,
          padding: '20px 24px',
          position: 'relative',
          animation: 'fadeIn 0.3s ease',
        }}>
          <button
            onClick={() => setShowRules(false)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
          <h4 style={{ color: 'var(--pc)', marginBottom: 10, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Office Guidelines</h4>
          <p style={{ whiteSpace: 'pre-line', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>{office?.rules}</p>
        </div>
      )}

      {/* ── Presence Grid ────────────────────────────────────────────────── */}
      <div className="page-content" style={{ paddingTop: '28px' }}>

        {/* Section label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Users size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Teammates · {allPresent}
          </span>
        </div>

        <div className="teammate-grid">
          {Object.entries(teammates).map(([peerId, data]) => {
            const inHuddle = huddle.active && huddle.members.includes(peerId);
            return (
              <div
                key={peerId}
                className={`teammate-card ${inHuddle ? 'pulse in-huddle' : ''}`}
                onClick={() => handleTapToTalk(peerId)}
              >
                {/* Status badge top-right */}
                <div style={{ position: 'absolute', top: 16, right: 16 }}>
                  <div className={`status-badge ${data.status?.toLowerCase().replace(' ', '-')}`} />
                </div>

                {/* Avatar */}
                <div className="avatar" style={{ backgroundColor: data.avatar?.bg, color: data.avatar?.color }}>
                  {data.avatar?.icon}
                </div>

                {/* Name + status */}
                <div className="teammate-name-label">
                  <div className="name">{data.name}</div>
                  <div className="status-chip">{data.status}</div>
                </div>

                {/* Talk hint */}
                {data.status === 'Available' && !huddle.active && (
                  <div className="talk-hint">
                    <Mic size={11} style={{ display: 'inline', marginRight: 4 }} />
                    Talk
                  </div>
                )}

                {/* In huddle waveform badge */}
                {inHuddle && (
                  <div style={{
                    position: 'absolute', bottom: 14, right: 14,
                    background: 'var(--success)', borderRadius: '20px',
                    padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Volume2 size={11} /> Live
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty state */}
          {allPresent === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              background: 'var(--bg-card)',
              border: '2px dashed var(--border)',
              borderRadius: 24,
              padding: '80px 40px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}>
              <div style={{
                width: 64, height: 64, background: 'var(--bg-elevated)',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <Users size={30} strokeWidth={1.5} color="var(--text-muted)" />
              </div>
              <h3 style={{ color: 'var(--text)', marginBottom: 10 }}>You're the only one here</h3>
              <p style={{ fontSize: 14, marginBottom: 28 }}>Share the invite link to get your team in.</p>
              <button className="btn btn-outline" onClick={copyInvite} style={{ borderRadius: 12 }}>
                <Share2 size={15} /> Copy Invite Link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Huddle Popup ────────────────────────────────────────────────── */}
      <HuddlePopup
        peer={peer} broadcast={broadcast} connectionsRef={connectionsRef}
        startAudio={startAudio} stopAudio={stopAudio} setMicMuted={setMicMuted}
        startScreenShare={startScreenShare} stopScreenShare={stopScreenShare}
        remoteScreenStream={remoteScreenStream}
      />

      {/* Connecting indicator */}
      {!isReady && (
        <div style={{
          position: 'fixed', bottom: 32, left: 100,
          padding: '10px 18px',
          background: 'var(--bg-elevated)',
          color: 'var(--text-secondary)',
          borderRadius: 16, fontSize: 13, fontWeight: 500, zIndex: 900,
          boxShadow: 'var(--shadow-md)',
          display: 'flex', alignItems: 'center', gap: 10,
          border: '1px solid var(--border)',
        }}>
          <div style={{
            width: 14, height: 14,
            border: '2px solid var(--border)', borderTopColor: 'var(--pc)',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
          Connecting to workspace...
        </div>
      )}
    </div>
  );
}
