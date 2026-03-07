import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import useStore from '../store/useStore';

const SEED_PREFIX = 'hs-seed-';
const PEER_PREFIX = 'hs-peer-';

export default function usePeer(roomId) {
  const { user, teammates, setTeammate, removeTeammate, huddle, setSharing, joinHuddle } = useStore();
  const peerRef = useRef(null);
  const connectionsRef = useRef({}); // { peerId: DataConnection }
  const callsRef = useRef({}); // { peerId: MediaConnection }
  const [isReady, setIsReady] = useState(false);

  // Broadcast data to all connected peers
  const broadcast = useCallback((data) => {
    Object.values(connectionsRef.current).forEach((conn) => {
      if (conn.open) {
        conn.send(data);
      }
    });
  }, []);

  // Handle incoming data
  const handleData = useCallback((conn, data) => {
    switch (data.type) {
      case 'PRESENCE':
        // 1. Scan for Email Duplicates & Ghosts
        // If someone joins with an email that already exists, 
        // they are likely the same person reconnecting. Remove the old one.
        Object.entries(teammates).forEach(([peerId, teammate]) => {
          if (teammate.email === data.profile.email && peerId !== conn.peer) {
            console.log('Removing ghost duplicate for email:', teammate.email);
            removeTeammate(peerId);
            // Close the old connection if it exists
            if (connectionsRef.current[peerId]) {
              connectionsRef.current[peerId].close();
              delete connectionsRef.current[peerId];
            }
          }
        });

        // 2. Set/Update teammate with new data
        setTeammate(conn.peer, { 
          ...data.profile, 
          status: data.status,
          heartbeat: Date.now() // Track for ghost cleanup
        });

        if (data.isInitial) {
           conn.send({
             type: 'PRESENCE',
             profile: user,
             status: user?.status || 'Available',
             isInitial: false
           });
        }
        break;
      case 'HEARTBEAT':
        setTeammate(conn.peer, { heartbeat: Date.now() });
        break;
      case 'PEER_LIST':
        data.peers.forEach((peerId) => {
          if (peerId !== peerRef.current.id && !connectionsRef.current[peerId]) {
            connectToPeer(peerId);
          }
        });
        break;
      case 'REQUEST_SYNC':
        conn.send({
           type: 'PEER_LIST',
           peers: [peerRef.current.id, ...Object.keys(connectionsRef.current)]
        });
        break;
      default:
        console.log('Data received:', data.type);
    }
  }, [user, teammates, setTeammate, removeTeammate]);

  // Ghost Lifecycle Cleanup (Interval)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      Object.entries(teammates).forEach(([peerId, data]) => {
        // If no heartbeat for 30 seconds, treat as a ghost
        if (data.heartbeat && now - data.heartbeat > 30000) {
          console.log('Ghost cleanup for:', peerId);
          removeTeammate(peerId);
        }
      });
      
      // Also send our own heartbeat to everyone
      broadcast({ type: 'HEARTBEAT' });
    }, 15000); // Check every 15s

    return () => clearInterval(cleanupInterval);
  }, [teammates, removeTeammate, broadcast]);

  const connectToPeer = useCallback((peerId, isInitial = true) => {
    // Already connected or trying to connect to ourselves
    if (connectionsRef.current[peerId] || peerId === peerRef.current?.id) return;

    const conn = peerRef.current.connect(peerId);
    connectionsRef.current[peerId] = conn; // Track immediately to prevent double-connect

    conn.on('open', () => {
      // Send our profile upon connection
      conn.send({
        type: 'PRESENCE',
        profile: user,
        status: user?.status || 'Available',
        isInitial: isInitial
      });
      
      // If we are joining someone, ask them for their peer list too (Mesh expansion)
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
  }, [user, handleData, removeTeammate]);

  useEffect(() => {
    if (!roomId || !user) return;

    const initPeer = async () => {
      const seedId = `${SEED_PREFIX}${roomId}`;
      const myId = `${PEER_PREFIX}${roomId}-${uuidv4().slice(0, 8)}`;
      
      // Try to connect to existing seed first
      const peer = new Peer(myId); 
      peerRef.current = peer;

      peer.on('open', (id) => {
        setIsReady(true);
        // Always try to connect to the seed to join the mesh
        connectToPeer(seedId);
      });

      peer.on('connection', (conn) => {
        conn.on('open', () => {
           connectionsRef.current[conn.peer] = conn;
        });
        conn.on('data', (data) => handleData(conn, data));
      });

      // Handle the case where WE might need to become the seed if it doesn't exist
      // In a real P2P app, the first one becomes the seed.
      // If connect to seed fails, we try to create the seed.
      const trySeed = new Peer(seedId);
      trySeed.on('open', () => {
        console.log('I am the new Seed');
        // We are the seed, handle connections
        trySeed.on('connection', (conn) => {
          conn.on('open', () => {
            connectionsRef.current[conn.peer] = conn;
            // Send current peer list to allow new joiner to mesh
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
           trySeed.destroy(); // Seed already exists, that's fine
        }
      });
    };

    initPeer();

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [roomId, user, connectToPeer, handleData]);

  // Sync status changes
  useEffect(() => {
    if (isReady && user?.status) {
      broadcast({
        type: 'PRESENCE',
        profile: user,
        status: user.status
      });
    }
  }, [user?.status, isReady, broadcast, user]);

  return { peer: peerRef.current, isReady, broadcast };
}
