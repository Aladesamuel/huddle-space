import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import useStore from '../store/useStore';

const SEED_PREFIX = 'hs-seed-';
const PEER_PREFIX = 'hs-peer-';

// ─── Helpers to create/remove audio elements ─────────────────────────────────
function playRemoteStream(peerId, stream) {
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

function removeRemoteStream(peerId) {
  const el = document.getElementById(`hs-audio-${peerId}`);
  if (el) { el.srcObject = null; el.remove(); }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function usePeer(roomId) {
  const { user, teammates, setTeammate, removeTeammate } = useStore();
  const peerRef        = useRef(null);
  const connectionsRef = useRef({});   // { peerId: DataConnection }
  const callsRef       = useRef({});   // { peerId: MediaConnection }
  const localStreamRef = useRef(null); // Our live mic stream

  const [isReady, setIsReady]     = useState(false);
  const [activePeer, setActivePeer] = useState(null);

  // Refs to latest state (used inside stable callbacks)
  const userRef      = useRef(user);
  const teammatesRef = useRef(teammates);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { teammatesRef.current = teammates; }, [teammates]);

  // ─── Broadcast a message to all data connections ───────────────────────
  const broadcast = useCallback((data) => {
    Object.values(connectionsRef.current).forEach(conn => {
      if (conn.open) conn.send(data);
    });
  }, []);

  // ─── Answer an incoming audio call ───────────────────────────────────────
  const answerCall = useCallback(async (call) => {
    try {
      // If we already have a local stream (huddle already active), reuse it
      let stream = localStreamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
      }
      call.answer(stream);
      callsRef.current[call.peer] = call;
      call.on('stream', remoteStream => playRemoteStream(call.peer, remoteStream));
      call.on('close',  () => { delete callsRef.current[call.peer]; removeRemoteStream(call.peer); });
      call.on('error',  () => { delete callsRef.current[call.peer]; removeRemoteStream(call.peer); });
    } catch (e) {
      console.error('Failed to answer call:', e);
    }
  }, []);

  // ─── Start a MediaConnection audio call to one peer ─────────────────────
  const callPeer = useCallback((peerId) => {
    if (!peerRef.current || callsRef.current[peerId] || !localStreamRef.current) return;
    const call = peerRef.current.call(peerId, localStreamRef.current);
    if (!call) return;
    callsRef.current[peerId] = call;
    call.on('stream', remoteStream => playRemoteStream(peerId, remoteStream));
    call.on('close',  () => { delete callsRef.current[peerId]; removeRemoteStream(peerId); });
    call.on('error',  () => { delete callsRef.current[peerId]; removeRemoteStream(peerId); });
  }, []);

  // ─── Public: start mic + call all huddle members ─────────────────────────
  const startAudio = useCallback(async (memberPeerIds, startMuted = false) => {
    try {
      // Stop any previous stream first
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getAudioTracks().forEach(t => { t.enabled = !startMuted; });
      localStreamRef.current = stream;

      // Call every member peer
      memberPeerIds.forEach(peerId => callPeer(peerId));
    } catch (e) {
      console.error('Mic access denied:', e);
    }
  }, [callPeer]);

  // ─── Public: stop all audio ───────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    // Hang up all calls
    Object.values(callsRef.current).forEach(call => call.close());
    callsRef.current = {};
    // Stop local mic
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    // Remove all remote audio elements
    document.querySelectorAll('[id^="hs-audio-"]').forEach(el => { el.srcObject = null; el.remove(); });
  }, []);

  // ─── Public: toggle local mic mute ────────────────────────────────────────
  const setMicMuted = useCallback((muted) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !muted; });
    }
    useStore.getState().setMuted(muted);
  }, []);

  // ─── Forward-ref to break circular dependency handleData ↔ connectToPeer ─
  const connectToPeerRef = useRef(null);

  // ─── Handle incoming data messages ────────────────────────────────────────
  const handleData = useCallback((conn, data) => {
    const currentUser = userRef.current;
    switch (data.type) {
      case 'PRESENCE':
        // Deduplicate by email
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
          if (pid !== peerRef.current?.id && !connectionsRef.current[pid]) {
            connectToPeerRef.current?.(pid);
          }
        });
        break;

      case 'REQUEST_SYNC':
        conn.send({ type: 'PEER_LIST', peers: [peerRef.current?.id, ...Object.keys(connectionsRef.current)] });
        break;

      // ── Huddle signaling ────────────────────────────────────────────────
      case 'HUDDLE_INVITE': {
        const store = useStore.getState();
        const { fromPeerId } = data;
        if (store.huddle.active) {
          store.addHuddleMember(fromPeerId);
          // Already have mic open — call the new member
          callPeer(fromPeerId);
        } else {
          // Auto-join muted; audio call will arrive from initiator
          store.joinHuddle([fromPeerId]);
          store.setMuted(true);
        }
        conn.send({ type: 'HUDDLE_ACCEPT', fromPeerId: peerRef.current?.id });
        break;
      }
      case 'HUDDLE_ACCEPT': {
        const store = useStore.getState();
        const { fromPeerId } = data;
        if (store.huddle.active) {
          store.addHuddleMember(fromPeerId);
          callPeer(fromPeerId); // call the new joiner
        } else {
          store.joinHuddle([conn.peer]);
          callPeer(conn.peer);
        }
        broadcast({ type: 'HUDDLE_JOIN', newPeerId: fromPeerId });
        break;
      }
      case 'HUDDLE_JOIN': {
        const store = useStore.getState();
        if (store.huddle.active) store.addHuddleMember(data.newPeerId);
        break;
      }
      case 'HUDDLE_LEAVE': {
        const store = useStore.getState();
        callsRef.current[conn.peer]?.close();
        delete callsRef.current[conn.peer];
        removeRemoteStream(conn.peer);
        const remaining = store.huddle.members.filter(id => id !== conn.peer);
        if (remaining.length === 0) store.leaveHuddle();
        else store.joinHuddle(remaining);
        break;
      }
      case 'SHARING_STARTED':
        useStore.getState().setSharing(true, data.peerId);
        break;
      case 'SHARING_STOPPED':
        useStore.getState().setSharing(false, null);
        break;

      default:
        console.log('P2P msg:', data.type);
    }
  }, [setTeammate, removeTeammate, broadcast, callPeer]);

  // ─── Ghost cleanup: heartbeat every 15s ──────────────────────────────────
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

    // Handle incoming DATA connections
    peer.on('connection', conn => {
      conn.on('open', () => { connectionsRef.current[conn.peer] = conn; });
      conn.on('data', d => handleData(conn, d));
    });

    // ── Handle incoming AUDIO calls ──────────────────────────────────────
    peer.on('call', call => {
      answerCall(call);
    });

    // Try to become the Seed for this room
    const trySeed = new Peer(seedId);
    trySeed.on('open', () => {
      trySeed.on('connection', conn => {
        conn.on('open', () => {
          connectionsRef.current[conn.peer] = conn;
          conn.send({ type: 'PEER_LIST', peers: Object.keys(connectionsRef.current) });
        });
        conn.on('data', d => handleData(conn, d));
      });
      // Seed also needs to answer audio calls
      trySeed.on('call', call => answerCall(call));
    });
    trySeed.on('error', err => { if (err.type === 'unavailable-id') trySeed.destroy(); });

    return () => {
      stopAudio();
      peer.destroy();
      peerRef.current = null;
      setActivePeer(null);
      connectionsRef.current = {};
    };
  }, [roomId, user?.id]); // Stable: only restart on room or user change

  // ─── Broadcast presence when status changes ───────────────────────────────
  useEffect(() => {
    if (isReady && user?.status) {
      broadcast({ type: 'PRESENCE', profile: userRef.current, status: userRef.current.status });
    }
  }, [user?.status, isReady, broadcast]);

  return { peer: activePeer, isReady, broadcast, connectionsRef, startAudio, stopAudio, setMicMuted };
}
