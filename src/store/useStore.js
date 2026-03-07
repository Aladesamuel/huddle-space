import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      // User Profile
      user: null, // { name, email, avatar, status, id }
      setUser: (user) => set({ user }),
      updateStatus: (status) => set((state) => ({ 
        user: state.user ? { ...state.user, status } : null 
      })),

      // Office State
      office: null, // { name, rules, id }
      setOffice: (office) => set({ office }),

      // Teammates in the room
      teammates: {}, // { peerId: { name, email, avatar, status, lastSeen } }
      setTeammate: (peerId, data) => set((state) => {
        const newTeammates = { ...state.teammates };
        
        // ANTI-GHOSTING: If this update has an email, ensure no other peerId uses it
        const incomingEmail = data.email || newTeammates[peerId]?.email;
        if (incomingEmail) {
          Object.keys(newTeammates).forEach(pid => {
            // Only prune if it's the EXACT same person (email) but a different connection,
            // AND the old connection hasn't been seen in a while (prevents killing active multi-device tests)
            if (pid !== peerId && newTeammates[pid]?.email === incomingEmail) {
              const lastSeen = newTeammates[pid].lastSeen || 0;
              if (Date.now() - lastSeen > 15000) {
                delete newTeammates[pid];
              }
            }
          });
        }

        newTeammates[peerId] = { 
          ...newTeammates[peerId], 
          ...data, 
          lastSeen: Date.now() 
        };
        
        return { teammates: newTeammates };
      }),
      removeTeammate: (peerId) => set((state) => {
        const newTeammates = { ...state.teammates };
        delete newTeammates[peerId];
        return { teammates: newTeammates };
      }),

      // Huddle State
      huddle: {
        active: false,
        members: [], // List of peerIds in the huddle
        isMuted: false,
        isSharing: false,
        streamerId: null,
      },
      // Pending invite from another peer
      huddleInvite: null, // { fromPeerId, fromName, huddleId }
      setHuddleInvite: (invite) => set({ huddleInvite: invite }),
      joinHuddle: (peerIds) => set((state) => ({
        huddle: { ...state.huddle, active: true, members: Array.from(new Set(peerIds)) },
        huddleInvite: null,
      })),
      addHuddleMember: (peerId) => set((state) => ({
        huddle: { ...state.huddle, members: Array.from(new Set([...state.huddle.members, peerId])) }
      })),
      leaveHuddle: () => set((state) => ({
        huddle: { ...state.huddle, active: false, members: [], isSharing: false, streamerId: null }
      })),
      setMuted: (isMuted) => set((state) => ({
        huddle: { ...state.huddle, isMuted }
      })),
      setSharing: (isSharing, streamerId = null) => set((state) => ({
        huddle: { ...state.huddle, isSharing, streamerId }
      })),
    }),
    {
      name: 'huddle-space-storage',
      partialize: (state) => ({ user: state.user }), // Only persist user profile
    }
  )
);

export default useStore;
