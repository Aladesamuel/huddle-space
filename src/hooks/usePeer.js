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
        break;
      case 'PEER_LIST':
        // Seed sending us a list of other peers to connect to
        data.peers.forEach((peerId) => {
          if (peerId !== peerRef.current.id && !connectionsRef.current[peerId]) {
            connectToPeer(peerId);
          }
        });
        break;
      case 'HUDDLE_INVITE':
        // Someone invited us to a huddle
        // (UI will handle the prompt)
        break;
      default:
        console.log('Unknown data type:', data.type);
    }
  }, [setTeammate]);

  const connectToPeer = useCallback((peerId) => {
    if (connectionsRef.current[peerId]) return;

    const conn = peerRef.current.connect(peerId);
    conn.on('open', () => {
      connectionsRef.current[peerId] = conn;
      // Send our profile upon connection
      conn.send({
        type: 'PRESENCE',
        profile: user,
        status: user?.status || 'Available'
      });
    });

    conn.on('data', (data) => handleData(conn, data));
    conn.on('close', () => {
      delete connectionsRef.current[peerId];
      removeTeammate(peerId);
    });
  }, [user, handleData, removeTeammate]);

  useEffect(() => {
    if (!roomId || !user) return;

    const initPeer = async () => {
      // 1. Try to be the Seed
      const seedId = `${SEED_PREFIX}${roomId}`;
      const myId = `${PEER_PREFIX}${roomId}-${uuidv4().slice(0, 8)}`;
      
      const peer = new Peer(seedId); // Try seed first

      peer.on('open', (id) => {
        console.log('Joined as Seed:', id);
        peerRef.current = peer;
        setIsReady(true);
      });

      peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          // 2. Be a regular peer and connect to the seed
          console.log('Seed already exists, joining as peer...');
          const secondaryPeer = new Peer(myId);
          secondaryPeer.on('open', (id) => {
            peerRef.current = secondaryPeer;
            setIsReady(true);
            connectToPeer(seedId);
          });
          
          secondaryPeer.on('connection', (conn) => {
            conn.on('data', (data) => handleData(conn, data));
            connectionsRef.current[conn.peer] = conn;
          });

          secondaryPeer.on('call', (call) => {
            // Handle incoming audio call
            // (Simplified: auto-answer if in huddle)
          });
        }
      });

      peer.on('connection', (conn) => {
        // As a seed, we also track connections
        conn.on('open', () => {
          connectionsRef.current[conn.peer] = conn;
          // If we are seed, send the list of all other peers to the new joiner
          if (peer.id.startsWith(SEED_PREFIX)) {
            conn.send({
              type: 'PEER_LIST',
              peers: Object.keys(connectionsRef.current)
            });
          }
        });
        conn.on('data', (data) => handleData(conn, data));
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
