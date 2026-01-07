import * as SecureStore from 'expo-secure-store';
import { StateCreator } from 'zustand';
import { authAPI } from '../../services/api';
import { mapUserFromApi } from '../user.mappers';
import { ApiUser } from '../userTypes';

export type ProfileSlice = {
  id: string | null;
  name: string | null;
  email: string | null;
  username: string | null;
  iq: number;
  coins: number;
  inrBalance: number;
  balance: number;
  dollars: number;
  walletAddress: string | null;
  streakCount: number;
  longestStreak: number;
  lastStreakAt: string | null;
  profileCompleted: boolean;
  tags: string[];
  occupation: string | null;
  gender: string | null;
  dob: string | null;
  loading: boolean;
  lastFetched: number | null;
  hasInitialFetch: boolean;

  fetchUserData: () => Promise<void>;
  setUser: (userData: Partial<ProfileSlice>) => void;
  updateCoins: (coins: number) => void;
  updateIQ: (iq: number) => void;
  updateStreak: (streakData: { streakCount?: number; longestStreak?: number; lastStreakAt?: string }) => void;
  shouldRefetch: () => boolean;
};

export const createProfileSlice: StateCreator<any, [], [], ProfileSlice> = (set, get, _store) => ({
  id: null,
  name: null,
  email: null,
  username: null,
  iq: 0,
  coins: 0,
  inrBalance: 0,
  balance: 0,
  dollars: 0,
  walletAddress: null,
  streakCount: 0,
  longestStreak: 0,
  lastStreakAt: null,
  profileCompleted: false,
  tags: [],
  occupation: null,
  gender: null,
  dob: null,
  loading: false,
  lastFetched: null,
  hasInitialFetch: false,

  fetchUserData: async () => {
    try {
      set({ loading: true });

      const response = await authAPI.getUser();
      const userData = response.user || response.data || response;

      if (userData && (userData.firstName || userData.username || userData.name || userData.email)) {
        const mappedUserData = mapUserFromApi(userData as ApiUser);
        set({
          ...mappedUserData,
          authenticated: true,
        });

        try {
          await SecureStore.setItemAsync('userData', JSON.stringify(userData));
          await SecureStore.setItemAsync('userState', JSON.stringify(mappedUserData));
        } catch (e) {
          console.warn('Could not persist user state:', e);
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch user data:', error);
    } finally {
      set({ loading: false });
    }
  },

  setUser: (userData) => {
    if (typeof userData.balance === 'number' && userData.balance < 0) {
      console.log(`[userStore] Warning: Attempted to set negative balance (${userData.balance}). Setting to 0.`);
      userData.balance = 0;
    }
    if (typeof userData.coins === 'number' && userData.coins < 0) {
      console.log(`[userStore] Warning: Attempted to set negative coins (${userData.coins}). Setting to 0.`);
      userData.coins = 0;
    }

    set((state: any) => ({
      ...state,
      ...userData,
      lastFetched: Date.now(),
    }));
  },

  updateCoins: (coins) => {
    const validCoins = Math.max(0, coins);
    if (coins < 0) {
      console.log(`[userStore] Warning: Attempted to set negative coins (${coins}). Setting to 0 instead.`);
    }
    set({ coins: validCoins, lastFetched: Date.now() });
  },

  updateIQ: (iq) => {
    set({ iq, lastFetched: Date.now() });
  },

  updateStreak: (streakData) => {
    set((state: any) => ({
      ...state,
      ...streakData,
      lastFetched: Date.now(),
    }));
  },

  shouldRefetch: () => {
    const state = get();
    if (!state.hasInitialFetch) return true;
    if (!state.lastFetched) return true;
    return false;
  },
});
