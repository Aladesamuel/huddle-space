import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import useStore from '../store/useStore';

const SEED_PREFIX = 'hs-seed-';
const PEER_PREFIX = 'hs-peer-';

// ─── DOM Audio helpers ────────────────────────────────────────────────────────
function playRemoteAudio(peerId, stream) {
  let el = document.getElementById(`hs-audio-${peerId}`);
  if (!el) {
    el = document.createElement('audio');
    el.id = `hs-audio-${peerId}`;
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
  }
  el.srcObject = stream;
}
function removeRemoteAudio(peerId) {
  const el = document.getElementById(`hs-audio-${peerId}`);
  if (el) { el.srcObject = null; el.remove(); }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function usePeer(roomId) {
  const { user, teammates, setTeammate, removeTeammate } = useStore();

  const peerRef             = useRef(null);
  const connectionsRef      = useRef({});   // { peerId: DataConnection }
  const audioCallsRef       = useRef({});   // { peerId: MediaConnection (audio) }
  const screenCallsRef      = useRef({});   // { peerId: MediaConnection (screen) }
  const localStreamRef      = useRef(null); // local mic stream
  const localScreenRef      = useRef(null); // local screen stream

  const [isReady,    setIsReady]    = useState(false);
  const [activePeer, setActivePeer] = useState(null);
  // Remote screen stream (shown in all viewers)
  const [remoteScreenStream, setRemoteScreenStream] = useState(null);

  const userRef      = useRef(user);
  const teammatesRef = useRef(teammates);
  useEffect(() => { userRef.current = user; },      [user]);
  useEffect(() => { teammatesRef.current = teammates; }, [teammates]);

  // ─── Broadcast ──────────────────────────────────────────────────────────
  const broadcast = useCallback((data) => {
    Object.values(connectionsRef.current).forEach(conn => {
      if (conn.open) conn.send(data);
    });
  }, []);

  // ─── Answer AUDIO call ───────────────────────────────────────────────────
  const answerAudioCall = useCallback(async (call) => {
    try {
      let stream = localStreamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
      }
      call.answer(stream);
      audioCallsRef.current[call.peer] = call;
      call.on('stream', remote => playRemoteAudio(call.peer, remote));
      call.on('close',  () => { delete audioCallsRef.current[call.peer]; removeRemoteAudio(call.peer); });
      call.on('error',  () => { delete audioCallsRef.current[call.peer]; removeRemoteAudio(call.peer); });
    } catch (e) { console.error('Failed to answer audio call:', e); }
  }, []);

  // ─── Answer SCREEN SHARE call ───────────────────────────────────────────
  const answerScreenCall = useCallback((call) => {
    // Some strict browsers require a stream to establish the RTCPeerConnection 
    // even if it's 1-way. We can just send our audio stream back safely.
    call.answer(localStreamRef.current || undefined);
    screenCallsRef.current[call.peer] = call;
    call.on('stream', remote => {
      setRemoteScreenStream(remote);
      useStore.getState().setSharing(true, call.peer);
    });
    call.on('close', () => {
      delete screenCallsRef.current[call.peer];
      setRemoteScreenStream(null);
      useStore.getState().setSharing(false, null);
    });
    call.on('error', () => {
      delete screenCallsRef.current[call.peer];
      setRemoteScreenStream(null);
      useStore.getState().setSharing(false, null);
    });
  }, []);

  // ─── Call a peer with audio ──────────────────────────────────────────────
  const callAudioPeer = useCallback((peerId) => {
    if (!peerRef.current || audioCallsRef.current[peerId] || !localStreamRef.current) return;
    const call = peerRef.current.call(peerId, localStreamRef.current, { metadata: { type: 'audio' } });
    if (!call) return;
    audioCallsRef.current[peerId] = call;
    call.on('stream', remote => playRemoteAudio(peerId, remote));
    call.on('close',  () => { delete audioCallsRef.current[peerId]; removeRemoteAudio(peerId); });
    call.on('error',  () => { delete audioCallsRef.current[peerId]; removeRemoteAudio(peerId); });
  }, []);

  // ─── Call a peer with screen ─────────────────────────────────────────────
  const callScreenPeer = useCallback((peerId) => {
    if (!peerRef.current || screenCallsRef.current[peerId] || !localScreenRef.current) return;
    const call = peerRef.current.call(peerId, localScreenRef.current, { metadata: { type: 'screen' } });
    if (!call) return;
    screenCallsRef.current[peerId] = call;
    call.on('close', () => delete screenCallsRef.current[peerId]);
    call.on('error', () => delete screenCallsRef.current[peerId]);
  }, []);

  // ─── Public: Start mic + audio-call all huddle members ──────────────────
  const startAudio = useCallback(async (memberPeerIds, startMuted = false) => {
    try {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getAudioTracks().forEach(t => { t.enabled = !startMuted; });
      localStreamRef.current = stream;
      memberPeerIds.forEach(pid => callAudioPeer(pid));
    } catch (e) { console.error('Mic access denied:', e); }
  }, [callAudioPeer]);

  // ─── Public: Stop all audio ──────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    Object.values(audioCallsRef.current).forEach(c => c.close());
    audioCallsRef.current = {};
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    document.querySelectorAll('[id^="hs-audio-"]').forEach(el => { el.srcObject = null; el.remove(); });
  }, []);

  // ─── Public: Toggle mic mute ─────────────────────────────────────────────
  const setMicMuted = useCallback((muted) => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !muted; });
    useStore.getState().setMuted(muted);
  }, []);

  // ─── Public: Start screen share → call all huddle members ────────────────
  const startScreenShare = useCallback(async (memberPeerIds) => {
    if (!peerRef.current) return false;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      localScreenRef.current = stream;

      // Call every huddle member with our screen
      memberPeerIds.forEach(pid => callScreenPeer(pid));

      // Update store + broadcast signal so non-huddle viewers also know
      const myId = peerRef.current.id;
      useStore.getState().setSharing(true, myId);
      broadcast({ type: 'SHARING_STARTED', peerId: myId, name: userRef.current?.name });

      // Browser's native "Stop sharing" button
      stream.getVideoTracks()[0].onended = () => stopScreenShare();

      return true;
    } catch (e) {
      console.error('Screen share cancelled or denied:', e);
      return false;
    }
  }, [callScreenPeer, broadcast, stopScreenShare]);

  // ─── Public: Stop screen share ────────────────────────────────────────────
  const stopScreenShare = useCallback(() => {
    localScreenRef.current?.getTracks().forEach(t => t.stop());
    localScreenRef.current = null;
    Object.values(screenCallsRef.current).forEach(c => c.close());
    screenCallsRef.current = {};
    setRemoteScreenStream(null);
    useStore.getState().setSharing(false, null);
    broadcast({ type: 'SHARING_STOPPED', peerId: peerRef.current?.id });
  }, [broadcast]);

  // ─── Forward-ref (handleData → connectToPeer circular dep) ───────────────
  const connectToPeerRef = useRef(null);

  // ─── Handle incoming data messages ────────────────────────────────────────
  const handleData = useCallback((conn, data) => {
    const currentUser = userRef.current;
    switch (data.type) {
      case 'PRESENCE':
        Object.entries(teammatesRef.current).forEach(([pid, tm]) => {
          if (tm.email === data.profile.email && pid !== conn.peer) {
            removeTeammate(pid);
            connectionsRef.current[pid]?.close();
            delete connectionsRef.current[pid];
          }
        });
        setTeammate(conn.peer, { ...data.profile, status: data.status, heartbeat: Date.now() });
        if (data.isInitial) {
          conn.send({ type: 'PRESENCE', profile: currentUser, status: currentUser?.status || 'Available', isInitial: false });
        }
        break;
      case 'HEARTBEAT':
        setTeammate(conn.peer, { heartbeat: Date.now() });
        break;
      case 'PEER_LIST':
        data.peers.forEach(pid => {
          if (pid !== peerRef.current?.id && !connectionsRef.current[pid]) connectToPeerRef.current?.(pid);
        });
        break;
      case 'REQUEST_SYNC':
        conn.send({ type: 'PEER_LIST', peers: [peerRef.current?.id, ...Object.keys(connectionsRef.current)] });
        break;

      // ── Huddle signaling ─────────────────────────────────────────────────
      case 'HUDDLE_INVITE': {
        const store = useStore.getState();
        if (store.huddle.active) {
          store.addHuddleMember(data.fromPeerId);
          callAudioPeer(data.fromPeerId);
        } else {
          store.joinHuddle([data.fromPeerId]);
          store.setMuted(true); // receiver starts muted
        }
        conn.send({ type: 'HUDDLE_ACCEPT', fromPeerId: peerRef.current?.id });
        break;
      }
      case 'HUDDLE_ACCEPT': {
        const store = useStore.getState();
        if (store.huddle.active) {
          store.addHuddleMember(data.fromPeerId);
          callAudioPeer(data.fromPeerId);
        } else {
          store.joinHuddle([conn.peer]);
          // Audio call is already triggered by startAudio in handleTapToTalk
        }
        broadcast({ type: 'HUDDLE_JOIN', newPeerId: data.fromPeerId });
        break;
      }
      case 'HUDDLE_JOIN': {
        const store = useStore.getState();
        if (store.huddle.active) {
          store.addHuddleMember(data.newPeerId);
          // If I am currently sharing my screen, call the new person so they see it!
          if (store.huddle.isSharing && store.huddle.streamerId === peerRef.current?.id) {
            callScreenPeer(data.newPeerId);
          }
        }
        break;
      }
      case 'HUDDLE_LEAVE': {
        const store = useStore.getState();
        audioCallsRef.current[conn.peer]?.close();
        delete audioCallsRef.current[conn.peer];
        removeRemoteAudio(conn.peer);
        const remaining = store.huddle.members.filter(id => id !== conn.peer);
        if (remaining.length === 0) store.leaveHuddle();
        else store.joinHuddle(remaining);
        break;
      }
      case 'SHARING_STARTED':
        // Signal only — actual video stream arrives via peer.on('call') with metadata.type='screen'
        useStore.getState().setSharing(true, data.peerId);
        break;
      case 'SHARING_STOPPED':
        useStore.getState().setSharing(false, null);
        setRemoteScreenStream(null);
        break;
      default:
        console.log('P2P msg:', data.type);
    }
  }, [setTeammate, removeTeammate, broadcast, callAudioPeer]);

  // ─── Ghost cleanup ────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      Object.entries(teammatesRef.current).forEach(([pid, d]) => {
        if (d.heartbeat && now - d.heartbeat > 30000) removeTeammate(pid);
      });
      broadcast({ type: 'HEARTBEAT' });
    }, 15000);
    return () => clearInterval(id);
  }, [removeTeammate, broadcast]);

  // ─── Connect to a data peer ──────────────────────────────────────────────
  const connectToPeer = useCallback((peerId, isInitial = true) => {
    if (!peerRef.current || connectionsRef.current[peerId] || peerId === peerRef.current.id) return;
    const conn = peerRef.current.connect(peerId);
    if (!conn) return;
    connectionsRef.current[peerId] = conn;
    conn.on('open', () => {
      conn.send({ type: 'PRESENCE', profile: userRef.current, status: userRef.current?.status || 'Available', isInitial });
      conn.send({ type: 'REQUEST_SYNC' });
    });
    conn.on('data',  d  => handleData(conn, d));
    conn.on('close', () => { delete connectionsRef.current[peerId]; removeTeammate(peerId); });
    conn.on('error', () => { delete connectionsRef.current[peerId]; removeTeammate(peerId); });
  }, [handleData, removeTeammate]);

  useEffect(() => { connectToPeerRef.current = connectToPeer; }, [connectToPeer]);

  // ─── PeerJS Initialization ────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !user?.id) return;

    const seedId = `${SEED_PREFIX}${roomId}`;
    const myId   = `${PEER_PREFIX}${roomId}-${uuidv4().slice(0, 8)}`;
    const peer   = new Peer(myId);
    peerRef.current = peer;

    peer.on('open', () => {
      setIsReady(true);
      setActivePeer(peer);
      connectToPeer(seedId);
    });

    peer.on('connection', conn => {
      conn.on('open', () => { connectionsRef.current[conn.peer] = conn; });
      conn.on('data', d => handleData(conn, d));
    });

    // ── Route incoming calls by metadata type ────────────────────────────
    peer.on('call', call => {
      if (call.metadata?.type === 'screen') {
        answerScreenCall(call);
      } else {
        answerAudioCall(call);
      }
    });

    // Try to become the Seed
    const trySeed = new Peer(seedId);
    trySeed.on('open', () => {
      trySeed.on('connection', conn => {
        conn.on('open', () => {
          connectionsRef.current[conn.peer] = conn;
          conn.send({ type: 'PEER_LIST', peers: Object.keys(connectionsRef.current) });
        });
        conn.on('data', d => handleData(conn, d));
      });
      trySeed.on('call', call => {
        if (call.metadata?.type === 'screen') answerScreenCall(call);
        else answerAudioCall(call);
      });
    });
    trySeed.on('error', err => { if (err.type === 'unavailable-id') trySeed.destroy(); });

    return () => {
      stopAudio();
      peer.destroy();
      peerRef.current = null;
      setActivePeer(null);
      connectionsRef.current = {};
    };
  }, [roomId, user?.id]); // eslint-disable-line

  // ─── Sync status ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isReady && user?.status) {
      broadcast({ type: 'PRESENCE', profile: userRef.current, status: userRef.current.status });
    }
  }, [user?.status, isReady, broadcast]);

  return {
    peer: activePeer,
    isReady,
    broadcast,
    connectionsRef,
    startAudio,
    stopAudio,
    setMicMuted,
    startScreenShare,
    stopScreenShare,
    remoteScreenStream,
  };
}
