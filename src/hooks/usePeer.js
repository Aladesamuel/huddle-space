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
        setTeammate(conn.peer, { ...data.profile, status: data.status });
        // If they sent presence, and it's a new connection, reply with OUR presence
        // to ensure they see us if we were already here.
        if (data.isInitial) {
           conn.send({
             type: 'PRESENCE',
             profile: user,
             status: user?.status || 'Available',
             isInitial: false
           });
        }
        break;
      case 'PEER_LIST':
        // Seed or Peer sending us a list of other peers to connect to
        data.peers.forEach((peerId) => {
          if (peerId !== peerRef.current.id && !connectionsRef.current[peerId]) {
            connectToPeer(peerId);
          }
        });
        break;
      case 'REQUEST_SYNC':
        // Someone is asking for everyone we know
        conn.send({
           type: 'PEER_LIST',
           peers: [peerRef.current.id, ...Object.keys(connectionsRef.current)]
        });
        break;
      default:
        console.log('Data received:', data.type);
    }
  }, [user, setTeammate]);

  const connectToPeer = useCallback((peerId, isInitial = true) => {
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
