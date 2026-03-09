import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Infinity, Share2, Info, Users, Zap, Search, Calendar, Layout, UserCircle, LogOut, Mic, X } from 'lucide-react';
import useStore from '../store/useStore';
import usePeer from '../hooks/usePeer';
import HuddleBar from '../components/HuddlePopup';
import Branding, { MiniBranding } from '../components/Branding';

const STATUS_COLOR = { Available: '#34a853', Busy: '#ea4335', 'On Break': '#fbbc04' };

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
    // Look up the identity by peerId to find the email
    const email = Object.keys(teammates).find(e => teammates[e].peerId === peerId);
    const target = teammates[email];
    if (huddle.active) { alert("You're already in an active huddle."); return; }
    
    if (target?.status === 'Available') {
      const huddleId = Date.now().toString();
      const conn     = connectionsRef?.current?.[peerId];
      if (conn?.open) {
        conn.send({ type: 'HUDDLE_INVITE', fromEmail: user?.email, fromName: user?.name, huddleId });
      } else {
        broadcast({ type: 'HUDDLE_INVITE', fromEmail: user?.email, fromName: user?.name, huddleId, targetPeerId: peerId });
      }
      joinHuddle([email]);
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
      <div className="page-header" style={{ 
        height: 'var(--header-h)', 
        borderBottom: '1px solid var(--border)', 
        padding: '0 32px',
        background: 'var(--bg-raised)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <MiniBranding size={22} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-ash)', fontWeight: 600 }}>
              <div style={{ 
                width: 8, height: 8, borderRadius: '50%', 
                background: 'var(--green)',
                boxShadow: '0 0 10px var(--green-glow)'
              }} />
              {count + 1} present
            </div>
            
            {office?.rules && (
              <button
                onClick={() => setShowRules(s => !s)}
                style={{ 
                  background: 'none', border: 'none', cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', gap: 6, 
                  fontSize: 12, color: 'var(--text-ghost)', padding: '4px 8px',
                  borderRadius: 6, transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-ash)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-ghost)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <Info size={14} /> Guidelines
              </button>
            )}
          </div>
        </div>

        {/* User & Presence Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            className="btn-text" 
            onClick={copyInvite}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, 
              color: 'var(--text-ash)', fontSize: 13, fontWeight: 700,
              padding: '8px 16px', borderRadius: 10, 
              background: 'var(--bg-hover)',
              border: 'none', cursor: 'pointer'
            }}
          >
            <Share2 size={15} /> Invite
          </button>

          <div style={{ height: 24, width: 1, background: 'var(--border)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Status Select Wrapped User Info */}
            <div style={{ position: 'relative' }}>
              <select
                value={user?.status}
                onChange={e => useStore.getState().updateStatus(e.target.value)}
                style={{ 
                  opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', 
                  cursor: 'pointer', zIndex: 10 
                }}
              >
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
                <option value="On Break">On Break</option>
              </select>
              
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 12, 
                padding: '4px 8px', borderRadius: 12, 
                background: 'var(--bg-hover)', 
                transition: 'background 0.2s',
                position: 'relative', zIndex: 1
              }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-ash)' }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-ghost)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {user?.status}
                  </div>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: user?.avatar?.bg || 'var(--bg-ctrl)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, border: '1.5px solid var(--border-hi)',
                    overflow: 'hidden'
                  }}>
                    {user?.avatar?.icon}
                  </div>
                  {/* Status Indicator */}
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 12, height: 12, borderRadius: '50%',
                    background: STATUS_COLOR[user?.status] ?? '#9aa0a6',
                    border: '2px solid var(--bg-raised)',
                    boxShadow: `0 0 10px ${STATUS_COLOR[user?.status] ?? '#9aa0a6'}44`,
                  }} />
                </div>
              </div>
            </div>

            <button
              onClick={() => { useStore.getState().setUser(null); window.location.href = '/'; }}
              style={{
                width: 36, height: 36, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(217, 48, 37, 0.08)',
                border: 'none', cursor: 'pointer',
                color: 'var(--red)', transition: 'all 0.2s'
              }}
              title="Leave office"
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217, 48, 37, 0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217, 48, 37, 0.08)'; }}
            >
              <LogOut size={18} />
            </button>
          </div>
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
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <Users size={14} color="var(--text-ghost)" />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Teammates · {Object.values(teammates).filter(d => d.email !== user?.email).length}
              </span>
            </div>
            <div className="presence-grid">
              {Object.entries(teammates)
                .filter(([email]) => email !== user?.email)
                .map(([email, data]) => {
                const inHuddle  = huddle.active && huddle.members.includes(email);
                const available = data.status === 'Available';
                return (
                  <div
                    key={email}
                    className={`presence-tile ${inHuddle ? 'in-huddle' : ''}`}
                    onClick={() => handleTapToTalk(data.peerId)}
                    style={{ '--avatar-color': data.avatar?.color }}
                  >
                    {data.role && (
                      <div className="tile-role">
                        <span className="tile-role-dot" />
                        {data.role}
                      </div>
                    )}
                    <div className="tile-bg" />
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
                    <div className="tile-name">{data.name}</div>
                    <div className="tile-status-row">
                      <div className={`tile-status-dot ${inHuddle ? 'in-huddle-status' : (data.status ?? 'available').toLowerCase().replace(' ', '-')}`} />
                      <span className="tile-status-label">{inHuddle ? 'In Huddle' : data.status}</span>
                      {inHuddle && (
                        <div className="tile-wave" style={{ marginLeft: 4 }}>
                          <span /><span /><span />
                        </div>
                      )}
                    </div>
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
            </div>
          </>
        )}

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
