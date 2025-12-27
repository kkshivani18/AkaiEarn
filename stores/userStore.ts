import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { authAPI } from '../services/api';

interface UserState {
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
  
  authenticated: boolean;
  token: string | null;
  
  loading: boolean;
  lastFetched: number | null;
  hasInitialFetch: boolean;
  
  // Actions
  setUser: (userData: Partial<UserState>) => void;
  updateCoins: (coins: number) => void;
  updateIQ: (iq: number) => void;
  updateStreak: (streakData: { streakCount?: number; longestStreak?: number; lastStreakAt?: string }) => void;
  fetchUserData: () => Promise<void>;
  logout: () => void;
  reset: () => void;
  
  shouldRefetch: () => boolean;
}

const initialState = {
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
  authenticated: false,
  token: null,
  loading: false,
  lastFetched: null,
  hasInitialFetch: false,
};

export const useUserStore = create<UserState>((set, get) => ({
  ...initialState,

  setUser: (userData) => {
    set((state) => ({
      ...state,
      ...userData,
      lastFetched: Date.now(),
    }));
  },

  updateCoins: (coins) => {
    // coins should never be -ve
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
    set((state) => ({
      ...state,
      ...streakData,
      lastFetched: Date.now(),
    }));
  },

  // fetch user data from API
  fetchUserData: async () => {
    try {
      set({ loading: true });
      
      const response = await authAPI.getUser();
      const userData = response.user || response.data || response;

      if (userData && (userData.firstName || userData.username || userData.name || userData.email)) {
        const mappedUserData = {
          id: userData._id || userData.id,
          name: userData.firstName || userData.username || userData.name || 'User',
          email: userData.email,
          username: userData.username || userData.firstName || userData.name,
          iq: userData.iq || 0,
          coins: userData.coins || 0,
          inrBalance: userData.inrBalance || 0,
          balance: userData.balance || 0,
          dollars: userData.dollars || 0,
          walletAddress: userData.walletAddress || null,
          streakCount: userData.streakCount || 0,
          longestStreak: userData.longestStreak || 0,
          lastStreakAt: userData.lastStreakAt || null,
          profileCompleted: userData.profileCompleted || false,
          tags: userData.tags || [],
          occupation: userData.occupation || null,
          gender: userData.gender || null,
          dob: userData.dob || null,
          authenticated: true,
          lastFetched: Date.now(),
          hasInitialFetch: true,
        };

        set(mappedUserData);
        console.log('✅ User data fetched and stored:', {
          name: mappedUserData.name,
          coins: mappedUserData.coins,
          iq: mappedUserData.iq,
        });

        try {
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

  shouldRefetch: () => {
    const state = get();
    if (!state.hasInitialFetch) {
      return true;
    }
    if (!state.lastFetched) return true;
    return false;
  },

  logout: () => {
    set(initialState);
    
    SecureStore.deleteItemAsync('userState').catch(e => 
      console.warn('Could not clear persisted user state:', e)
    );
  },

  reset: () => {
    console.log('🔄 Resetting user store...');
    set(initialState);
  },
}));

export const restoreUserState = async () => {
  try {
    const storedState = await SecureStore.getItemAsync('userState');
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      useUserStore.setState(parsedState);
    }
  } catch (e) {
    console.warn('Could not restore user state:', e);
  }
};
