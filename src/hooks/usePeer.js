import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import useStore from '../store/useStore';

const SEED_PREFIX = 'hs-seed-';
const PEER_PREFIX = 'hs-peer-';

export default function usePeer(roomId) {
  const { user, teammates, setTeammate, removeTeammate } = useStore();
  const peerRef = useRef(null);
  const connectionsRef = useRef({}); // { peerId: DataConnection }
  const [isReady, setIsReady] = useState(false);
  const [activePeer, setActivePeer] = useState(null);

  // Use refs to access latest state in callbacks without triggering re-renders
  const userRef = useRef(user);
  const teammatesRef = useRef(teammates);

  useEffect(() => {
    userRef.current = user;
    teammatesRef.current = teammates;
  }, [user, teammates]);

  // Broadcast data to all connected peers
  const broadcast = useCallback((data) => {
    Object.values(connectionsRef.current).forEach((conn) => {
      if (conn.open) {
        conn.send(data);
      }
    });
  }, []);

  // Forward-ref so handleData can call connectToPeer before it is declared
  const connectToPeerRef = useRef(null);

  // Handle incoming data
  const handleData = useCallback((conn, data) => {
    const currentUser = userRef.current;
    switch (data.type) {
      case 'PRESENCE':
        // Deduplicate: If same email, remove old peer
        Object.entries(teammatesRef.current).forEach(([peerId, teammate]) => {
          if (teammate.email === data.profile.email && peerId !== conn.peer) {
            removeTeammate(peerId);
            if (connectionsRef.current[peerId]) {
              connectionsRef.current[peerId].close();
              delete connectionsRef.current[peerId];
            }
          }
        });

        setTeammate(conn.peer, { ...data.profile, status: data.status, heartbeat: Date.now() });

        if (data.isInitial) {
           conn.send({
             type: 'PRESENCE',
             profile: currentUser,
             status: currentUser?.status || 'Available',
             isInitial: false
           });
        }
        break;
      case 'HEARTBEAT':
        setTeammate(conn.peer, { heartbeat: Date.now() });
        break;
      case 'PEER_LIST':
        data.peers.forEach((peerId) => {
          if (peerId !== peerRef.current?.id && !connectionsRef.current[peerId]) {
            // Use the ref to avoid circular dependency
            connectToPeerRef.current?.(peerId);
          }
        });
        break;
      case 'REQUEST_SYNC':
        conn.send({
           type: 'PEER_LIST',
           peers: [peerRef.current?.id, ...Object.keys(connectionsRef.current)]
        });
        break;

      // ──── HUDDLE SIGNALING (all via store.getState() — no deps needed) ────
      case 'HUDDLE_INVITE': {
        // Someone tapped us — auto-join muted, no confirmation needed
        const store = useStore.getState();
        const { fromPeerId, fromName, huddleId } = data;
        if (store.huddle.active) {
          store.addHuddleMember(fromPeerId);
        } else {
          // Auto-join muted so the person tapping can start talking right away
          store.joinHuddle([fromPeerId]);
          store.setMuted(true);  // receiver starts muted, unmutes when ready
        }
        // Confirm back so the initiator's huddle popup also shows this member
        conn.send({ type: 'HUDDLE_ACCEPT', fromPeerId: peerRef.current?.id, huddleId });
        break;
      }
      case 'HUDDLE_ACCEPT': {
        const store = useStore.getState();
        const { fromPeerId } = data;
        if (store.huddle.active) {
          store.addHuddleMember(fromPeerId);
        } else {
          store.joinHuddle([conn.peer]);
        }
        // Propagate the new member to everyone else in the huddle
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
        const remaining = store.huddle.members.filter(id => id !== conn.peer);
        if (remaining.length === 0) store.leaveHuddle();
        else store.joinHuddle(remaining);
        break;
      }
      case 'SHARING_STARTED': {
        const store = useStore.getState();
        store.setSharing(true, data.peerId);
        break;
      }
      case 'SHARING_STOPPED': {
        const store = useStore.getState();
        store.setSharing(false, null);
        break;
      }
      default:
        console.log('Update:', data.type);
    }
  }, [setTeammate, removeTeammate, broadcast]);

  // Ghost Lifecycle Cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      Object.entries(teammatesRef.current).forEach(([peerId, data]) => {
        if (data.heartbeat && now - data.heartbeat > 30000) {
          removeTeammate(peerId);
        }
      });
      broadcast({ type: 'HEARTBEAT' });
    }, 15000);

    return () => clearInterval(cleanupInterval);
  }, [removeTeammate, broadcast]);

  const connectToPeer = useCallback((peerId, isInitial = true) => {
    if (!peerRef.current || connectionsRef.current[peerId] || peerId === peerRef.current.id) return;

    const conn = peerRef.current.connect(peerId);
    if (!conn) return;

    connectionsRef.current[peerId] = conn;

    conn.on('open', () => {
      conn.send({
        type: 'PRESENCE',
        profile: userRef.current,
        status: userRef.current?.status || 'Available',
        isInitial: isInitial
      });
      conn.send({ type: 'REQUEST_SYNC' });
    });

    conn.on('data', (data) => handleData(conn, data));
    conn.on('close', () => {
      delete connectionsRef.current[peerId];
      removeTeammate(peerId);
    });
    conn.on('error', () => {
      delete connectionsRef.current[peerId];
      removeTeammate(peerId);
    });
  }, [handleData, removeTeammate]);

  // Keep the ref in sync with the latest memoized callback
  useEffect(() => {
    connectToPeerRef.current = connectToPeer;
  }, [connectToPeer]);

  useEffect(() => {
    if (!roomId || !user?.id) return;

    const seedId = `${SEED_PREFIX}${roomId}`;
    const myId = `${PEER_PREFIX}${roomId}-${uuidv4().slice(0, 8)}`;

    const peer = new Peer(myId);
    peerRef.current = peer;

    peer.on('open', () => {
      setIsReady(true);
      setActivePeer(peer);
      connectToPeer(seedId);
    });

    peer.on('connection', (conn) => {
      conn.on('open', () => {
         connectionsRef.current[conn.peer] = conn;
      });
      conn.on('data', (data) => handleData(conn, data));
    });

    const trySeed = new Peer(seedId);
    trySeed.on('open', () => {
      trySeed.on('connection', (conn) => {
        conn.on('open', () => {
          connectionsRef.current[conn.peer] = conn;
          conn.send({
            type: 'PEER_LIST',
            peers: Object.keys(connectionsRef.current)
          });
        });
        conn.on('data', (d) => handleData(conn, d));
      });
    });
    trySeed.on('error', (err) => {
      if (err.type === 'unavailable-id') {
         trySeed.destroy();
      }
    });

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
        setActivePeer(null);
        connectionsRef.current = {};
      }
    };
  }, [roomId, user?.id, connectToPeer, handleData]); // Proper deps

  // Sync status changes
  useEffect(() => {
    if (isReady && user?.status) {
      broadcast({
        type: 'PRESENCE',
        profile: userRef.current,
        status: userRef.current.status
      });
    }
  }, [user?.status, isReady, broadcast]);

  return { peer: activePeer, isReady, broadcast, connectionsRef };
}
