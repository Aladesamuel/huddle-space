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
      teammates: {}, // { peerId: { name, avatar, status, lastSeen } }
      setTeammate: (peerId, data) => set((state) => ({
        teammates: { ...state.teammates, [peerId]: { ...state.teammates[peerId], ...data, lastSeen: Date.now() } }
      })),
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
