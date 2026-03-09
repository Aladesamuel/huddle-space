import { useEffect, useRef, useState, useCallback } from 'react';
import { Peer } from 'peerjs';
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
  if (el) {
    el.srcObject = null;
    el.remove();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function usePeer(roomId) {
  const { user, teammates, setTeammate, removeTeammate } = useStore();

  const peerRef = useRef(null);
  const connectionsRef = useRef({});   // { peerId: DataConnection }
  const audioCallsRef = useRef({});    // { peerId: MediaConnection (audio) }
  const screenCallsRef = useRef({});   // { peerId: MediaConnection (screen) }
  const localStreamRef = useRef(null); // local mic stream
  const localScreenRef = useRef(null); // local screen stream

  const [isReady, setIsReady] = useState(false);
  const [activePeer, setActivePeer] = useState(null);
  const [remoteScreenStream, setRemoteScreenStream] = useState(null);

  const userRef = useRef(user);
  const teammatesRef = useRef(teammates);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { teammatesRef.current = teammates; }, [teammates]);

  // ─── Forward-ref (handleData → connectToPeer circular dep) ───────────────
  const connectToPeerRef = useRef(null);

  // ─── Broadcast ──────────────────────────────────────────────────────────
  const broadcast = useCallback((data) => {
    Object.values(connectionsRef.current).forEach(conn => {
      if (conn.open) conn.send(data);
    });
  }, []);

  // ─── Helper: stop audio ──────────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    Object.values(audioCallsRef.current).forEach(c => c.close());
    audioCallsRef.current = {};
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    document.querySelectorAll('[id^="hs-audio-"]').forEach(el => {
      el.srcObject = null;
      el.remove();
    });
  }, []);

  // ─── Helper: stop screen share ──────────────────────────────────────────
  const stopScreenShare = useCallback(() => {
    localScreenRef.current?.getTracks().forEach(t => t.stop());
    localScreenRef.current = null;
    Object.values(screenCallsRef.current).forEach(c => c.close());
    screenCallsRef.current = {};
    setRemoteScreenStream(null);
    useStore.getState().setSharing(false, null);
    if (peerRef.current) {
      broadcast({ type: 'SHARING_STOPPED', peerId: peerRef.current.id });
    }
  }, [broadcast]);

  // ─── Answer AUDIO call ───────────────────────────────────────────────────
  const answerAudioCall = useCallback(async (call) => {
    try {
      const isMuted = useStore.getState().huddle.isMuted;
      let stream = localStreamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
      }
      // Ensure the answered stream respects our current mute state
      stream.getAudioTracks().forEach(t => { t.enabled = !isMuted; });
      
      call.answer(stream);
      audioCallsRef.current[call.peer] = call;
      call.on('stream', remote => playRemoteAudio(call.peer, remote));
      const cleanup = () => { delete audioCallsRef.current[call.peer]; removeRemoteAudio(call.peer); };
      call.on('close', cleanup);
      call.on('error', cleanup);
    } catch (e) {
      console.error('Failed to answer audio call:', e);
    }
  }, []);

  // ─── Sync local tracks with mute state ───────────────────────────────────
  const huddleMuted = useStore(s => s.huddle.isMuted);
  const huddleActive = useStore(s => s.huddle.active);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !huddleMuted;
      });
    }
  }, [huddleMuted]);

  useEffect(() => {
    if (!huddleActive && localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
  }, [huddleActive]);

  // ─── Answer SCREEN SHARE call ───────────────────────────────────────────
  const answerScreenCall = useCallback((call) => {
    call.answer(localStreamRef.current || undefined);
    screenCallsRef.current[call.peer] = call;
    call.on('stream', remote => {
      setRemoteScreenStream(remote);
      useStore.getState().setSharing(true, call.peer);
    });
    const cleanup = () => {
      delete screenCallsRef.current[call.peer];
      setRemoteScreenStream(null);
      useStore.getState().setSharing(false, null);
    };
    call.on('close', cleanup);
    call.on('error', cleanup);
  }, []);

  // ─── Call a peer with audio ──────────────────────────────────────────────
  const callAudioPeer = useCallback((peerId) => {
    if (!peerRef.current || audioCallsRef.current[peerId] || !localStreamRef.current) return;
    const call = peerRef.current.call(peerId, localStreamRef.current, { metadata: { type: 'audio' } });
    if (!call) return;
    audioCallsRef.current[peerId] = call;
    call.on('stream', remote => playRemoteAudio(peerId, remote));
    const cleanup = () => { delete audioCallsRef.current[peerId]; removeRemoteAudio(peerId); };
    call.on('close', cleanup);
    call.on('error', cleanup);
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

  // ─── Handle incoming data messages ────────────────────────────────────────
  const handleData = useCallback((conn, data) => {
    const currentUser = userRef.current;
    switch (data.type) {
      case 'PRESENCE':
        // Don't add yourself to your own list
        if (data.profile.email === currentUser?.email) return;
        
        // Update local teammate state keyed by EMAIL
        setTeammate(data.profile.email, { 
          ...data.profile, 
          status: data.status, 
          peerId: conn.peer 
        });
        // If it's an initial presence, send ours back immediately
        if (data.isInitial) {
          conn.send({ type: 'PRESENCE', profile: currentUser, status: currentUser?.status || 'Available', isInitial: false });
        }
        break;
      case 'PULSE': {
        const email = Object.keys(teammatesRef.current).find(e => teammatesRef.current[e].peerId === conn.peer);
        if (email) {
          setTeammate(email, { status: data.status, peerId: conn.peer });
        } else {
          // If we see a pulse from someone we don't know, ask for sync
          conn.send({ type: 'REQUEST_SYNC' });
        }
        break;
      }
      case 'PEER_LIST':
        // Gossip protocol: ensure we are connected to every real participant in the room
        data.peers.forEach(pid => {
          if (pid && pid !== peerRef.current?.id && !connectionsRef.current[pid] && pid.startsWith(PEER_PREFIX)) {
            console.log('Discovered participant via sync:', pid);
            connectToPeerRef.current?.(pid);
          }
        });
        break;
      case 'REQUEST_SYNC':
        // Share only "Real" peer IDs (those with PEER_PREFIX) to keep the mesh clean
        const realPeers = Object.keys(connectionsRef.current).filter(pid => pid.startsWith(PEER_PREFIX));
        conn.send({ type: 'PEER_LIST', peers: [peerRef.current?.id, ...realPeers] });
        break;
      case 'HUDDLE_INVITE': {
        const store = useStore.getState();
        const fromEmail = data.fromEmail;
        if (!fromEmail) break;

        if (store.huddle.active) {
          // If already in a huddle, just add this person and call them
          store.addHuddleMember(fromEmail);
          callAudioPeer(conn.peer);
        } else {
          // Receiver joins: must include the person who invited them so the UI shows 'Huddle · 2 people'
          store.joinHuddle([fromEmail]);
          store.setMuted(true);
        }
        conn.send({ type: 'HUDDLE_ACCEPT', fromEmail: currentUser?.email, fromPeerId: peerRef.current?.id });
        break;
      }
      case 'HUDDLE_ACCEPT': {
        const store = useStore.getState();
        // The initiator's huddle already has the target from handleTapToTalk, 
        // but let's ensure they are added if not already.
        if (data.fromEmail) store.addHuddleMember(data.fromEmail);
        callAudioPeer(data.fromPeerId || conn.peer);
        
        // Broadcast to everyone else in the office that a huddle has been formed/joined
        broadcast({ type: 'HUDDLE_JOIN', email: currentUser?.email, peerId: peerRef.current?.id });
        break;
      }
      case 'HUDDLE_JOIN':
        if (data.email) useStore.getState().addHuddleMember(data.email);
        break;
      case 'HUDDLE_LEAVE': {
        const store = useStore.getState();
        audioCallsRef.current[conn.peer]?.close();
        delete audioCallsRef.current[conn.peer];
        removeRemoteAudio(conn.peer);
        
        const leavingEmail = Object.keys(teammatesRef.current).find(e => teammatesRef.current[e].peerId === conn.peer);
        if (leavingEmail) {
          const remaining = store.huddle.members.filter(id => id !== leavingEmail);
          if (remaining.length === 0) store.leaveHuddle();
          else store.joinHuddle(remaining);
        }
        break;
      }
      case 'SHARING_STARTED':
        useStore.getState().setSharing(true, data.peerId);
        break;
      case 'SHARING_STOPPED':
        useStore.getState().setSharing(false, null);
        setRemoteScreenStream(null);
        break;
      default:
        console.log('P2P msg:', data.type);
    }
  }, [setTeammate, removeTeammate, broadcast, callAudioPeer, callScreenPeer]);

  // ─── Connect to a data peer ──────────────────────────────────────────────
  const connectToPeer = useCallback((peerId, isInitial = true) => {
    if (!peerRef.current || connectionsRef.current[peerId] || peerId === peerRef.current.id) return;
    
    // Explicitly check if we already have an open connection
    if (connectionsRef.current[peerId]?.open) return;

    const conn = peerRef.current.connect(peerId);
    if (!conn) return;

    connectionsRef.current[peerId] = conn;

    conn.on('open', () => {
      conn.send({ type: 'PRESENCE', profile: userRef.current, status: userRef.current?.status || 'Available', isInitial });
      conn.send({ type: 'REQUEST_SYNC' });
    });

    conn.on('data', d => handleData(conn, d));

    const cleanup = () => {
      if (connectionsRef.current[peerId] === conn) {
        delete connectionsRef.current[peerId];
        // Short delay before removing teammate to handle transient drops/reconnects
        setTimeout(() => {
          if (!connectionsRef.current[peerId]) {
            useStore.getState().removeTeammateByPeerId(peerId);
          }
        }, 500);
      }
    };

    conn.on('close', cleanup);
    conn.on('error', cleanup);
  }, [handleData, removeTeammate]);

  useEffect(() => { connectToPeerRef.current = connectToPeer; }, [connectToPeer]);

  // ─── Public: Start mic + audio-call all huddle members ──────────────────
  const startAudio = useCallback(async (memberPeerIds, startMuted = false) => {
    try {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getAudioTracks().forEach(t => { t.enabled = !startMuted; });
      localStreamRef.current = stream;
      memberPeerIds.forEach(pid => callAudioPeer(pid));
    } catch (e) {
      console.error('Mic access denied:', e);
    }
  }, [callAudioPeer]);

  // ─── Public: Toggle mic mute ─────────────────────────────────────────────
  const setMicMuted = useCallback((muted) => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !muted; });
    useStore.getState().setMuted(muted);
  }, []);

  // ─── Public: Start screen share ───────────────────────────────────────────
  const startScreenShare = useCallback(async (memberPeerIds) => {
    if (!peerRef.current) return false;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      localScreenRef.current = stream;
      memberPeerIds.forEach(pid => callScreenPeer(pid));

      const myId = peerRef.current.id;
      useStore.getState().setSharing(true, myId);
      broadcast({ type: 'SHARING_STARTED', peerId: myId, name: userRef.current?.name });

      stream.getVideoTracks()[0].onended = () => stopScreenShare();
      return true;
    } catch (e) {
      console.error('Screen share cancelled or denied:', e);
      return false;
    }
  }, [callScreenPeer, broadcast, stopScreenShare]);

  // ─── Pruning & Pulse (Heartbeat) ──────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const currentTeammates = useStore.getState().teammates;
      
      // 1. Prune dead profiles by email
      Object.entries(currentTeammates).forEach(([email, data]) => {
        if (data.lastSeen && now - data.lastSeen > 12000) {
          console.log('Teammate timed out:', email);
          removeTeammate(email);
          const pid = data.peerId;
          if (pid && connectionsRef.current[pid]) {
            connectionsRef.current[pid].close();
            delete connectionsRef.current[pid];
          }
        }
      });
      
      // 2. Local heartbeat update
      broadcast({ type: 'PULSE', status: userRef.current?.status || 'Available' });
      
      // 3. Occasionally request sync to ensure mesh is complete
      if (Math.random() > 0.7) {
        broadcast({ type: 'REQUEST_SYNC' });
      }
    }, 3000); // 3-second pulse for professional responsiveness
    return () => clearInterval(id);
  }, [removeTeammate, broadcast]);

  // ─── PeerJS Initialization ────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !user?.id) return;

    const seedId = `${SEED_PREFIX}${roomId}`;
    const myId = `${PEER_PREFIX}${roomId}-${uuidv4().slice(0, 8)}`;
    
    let peer;
    try {
      peer = new Peer(myId, {
        debug: 1 // Only errors
      });
    } catch (e) {
      console.error('Peer creation failed:', e);
      return;
    }
    
    peerRef.current = peer;

    peer.on('error', err => {
      console.error('Main Peer error:', err.type, err);
      if (err.type === 'network' || err.type === 'server-error') {
        // Try to reconnect to signaling server if disconnected
        setTimeout(() => {
          if (!peer.destroyed && !peer.disconnected) peer.reconnect();
        }, 3000);
      }
    });

    peer.on('disconnected', () => {
      console.warn('Peer disconnected from signaling server, attempting reconnect...');
      peer.reconnect();
    });

    peer.on('open', (id) => {
      setIsReady(true);
      setActivePeer(peer);
      // Aggressive discovery: first connect to seed, then broadcast arrival
      setTimeout(() => {
        connectToPeer(seedId);
      }, 800);
    });

    peer.on('connection', conn => {
      conn.on('open', () => {
        // Only accept data connections from other participants (Real IDs)
        if (conn.peer.startsWith(PEER_PREFIX)) {
          connectionsRef.current[conn.peer] = conn;
          // Sync presence and trigger a mesh-wide peer sync
          conn.send({ type: 'PRESENCE', profile: userRef.current, status: userRef.current?.status || 'Available', isInitial: false });
          conn.send({ type: 'REQUEST_SYNC' }); 
        }
        
        conn.on('data', d => handleData(conn, d));
      });
      conn.on('close', () => {
        if (connectionsRef.current[conn.peer] === conn) {
          delete connectionsRef.current[conn.peer];
          setTimeout(() => {
            if (!connectionsRef.current[conn.peer]) {
              // Only remove from store if this was the last active session for that person
              useStore.getState().removeTeammateByPeerId(conn.peer);
            }
          }, 500);
        }
      });
      conn.on('error', () => {
        delete connectionsRef.current[conn.peer];
      });
    });

    peer.on('call', call => {
      if (call.metadata?.type === 'screen') answerScreenCall(call);
      else answerAudioCall(call);
    });

    // ─── Seed Peer (Discovery Switchboard) ──────────────────────────────
    let seedPeer;
    try {
      seedPeer = new Peer(seedId, { debug: 1 });
      seedPeer.on('open', () => {
        console.log('Bootstrapped as Room Seed.');
        seedPeer.on('connection', conn => {
          conn.on('open', () => {
            // Seed's only job: give the new person the REAL ID of the host
            // They will then find everyone else via REQUEST_SYNC gossip
            conn.send({ type: 'PEER_LIST', peers: [myId] });
            // Close seed connection shortly after to keep things clean
            setTimeout(() => conn.close(), 2000);
          });
        });
      });
      seedPeer.on('error', err => {
        if (err.type === 'unavailable-id') seedPeer.destroy();
      });
    } catch (e) {
      console.log('Seed already active');
    }

    return () => {
      stopAudio();
      stopScreenShare();
      if (peer && !peer.destroyed) peer.destroy();
      if (seedPeer && !seedPeer.destroyed) seedPeer.destroy();
      peerRef.current = null;
      setActivePeer(null);
      connectionsRef.current = {};
    };
  }, [roomId, user?.id, handleData, connectToPeer, stopAudio, answerAudioCall, answerScreenCall, removeTeammate]);

  // ─── Sync profile & status ──────────────────────────────────────────────
  useEffect(() => {
    if (isReady && user) {
      console.log('Broadcasting updated profile/status');
      broadcast({ type: 'PRESENCE', profile: user, status: user.status || 'Available' });
    }
  }, [user?.name, user?.status, user?.avatar?.bg, isReady, broadcast]);

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
