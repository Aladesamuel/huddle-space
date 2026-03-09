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
      teammates: {}, // { email: { name, avatar, status, lastSeen, peerId } }
      setTeammate: (email, data) => set((state) => {
        if (!email) return state;
        const newTeammates = { ...state.teammates };
        
        newTeammates[email] = { 
          ...newTeammates[email], 
          ...data, 
          lastSeen: Date.now() 
        };
        
        return { teammates: newTeammates };
      }),
      removeTeammate: (email) => set((state) => {
        const newTeammates = { ...state.teammates };
        delete newTeammates[email];
        return { teammates: newTeammates };
      }),
      // Helper to clear teammate by peerId if email is unknown (fallback)
      removeTeammateByPeerId: (peerId) => set((state) => {
        const newTeammates = { ...state.teammates };
        const email = Object.keys(newTeammates).find(e => newTeammates[e].peerId === peerId);
        if (email) delete newTeammates[email];
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
