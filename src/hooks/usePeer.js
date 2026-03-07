import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import useStore from '../store/useStore';

const SEED_PREFIX = 'hs-seed-';
const PEER_PREFIX = 'hs-peer-';

export default function usePeer(roomId) {
  const { user, teammates, setTeammate, removeTeammate, huddle, setSharing, joinHuddle } = useStore();
  // Use refs to access latest state in callbacks without triggering re-renders/re-initialization
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

  // Handle incoming data
  const handleData = useCallback((conn, data) => {
    const currentUser = userRef.current;
    const currentTeammates = teammatesRef.current;

    switch (data.type) {
      case 'PRESENCE':
        // 1. Scan for Email Duplicates & Ghosts
        Object.entries(currentTeammates).forEach(([peerId, teammate]) => {
          if (teammate.email === data.profile.email && peerId !== conn.peer) {
            removeTeammate(peerId);
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
          heartbeat: Date.now()
        });

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
            connectToPeer(peerId);
          }
        });
        break;
      case 'REQUEST_SYNC':
        conn.send({
           type: 'PEER_LIST',
           peers: [peerRef.current?.id, ...Object.keys(connectionsRef.current)]
        });
        break;
      default:
        console.log('Data received:', data.type);
    }
  }, [setTeammate, removeTeammate]); // Stable dependencies

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
  }, [handleData, removeTeammate]); // Stable dependencies

  useEffect(() => {
    if (!roomId) return;

    const seedId = `${SEED_PREFIX}${roomId}`;
    const myId = `${PEER_PREFIX}${roomId}-${uuidv4().slice(0, 8)}`;
    
    const peer = new Peer(myId); 
    peerRef.current = peer;

    peer.on('open', () => {
      setIsReady(true);
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
      }
    };
  }, [roomId]); // ONLY restart when the ROOM changes

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
