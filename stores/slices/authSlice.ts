import * as SecureStore from 'expo-secure-store';
import { StateCreator } from 'zustand';
import { authAPI } from '../../services/api';
import { TOKEN_KEY, USER_KEY } from '../storageKeys';
import { mapUserFromApi } from '../user.mappers';
import { ApiUser, AuthResult } from '../userTypes';

export type AuthSlice = {
  authenticated: boolean;
  token: string | null;
  authLoading: boolean;
  authError: string | null;
  profileCompleted: boolean;

  hydrateAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: (idToken: string) => Promise<AuthResult>;
  onProfileCompleted: () => Promise<void>;
  logout: () => void;
};

export const createAuthSlice: StateCreator<any, [], [], AuthSlice> = (set, get, _store) => ({
  authenticated: false,
  token: null,
  authLoading: false,
  authError: null,
  profileCompleted: false,

  hydrateAuth: async () => {
    set({ authLoading: true, authError: null });
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        set({ authenticated: false, token: null, authLoading: false });
        return;
      }

      try {
        const userDataPromise = authAPI.getUser();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Token validation timeout')), 5000)
        );
        await Promise.race([userDataPromise, timeoutPromise]);

        set({
          authenticated: true,
          token,
          authLoading: false,
          authError: null,
        });

        // Preload full user data so screens have it on first render
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
        set({
          authenticated: false,
          token: null,
          authLoading: false,
          authError: 'Session expired',
        });
      }
    } catch (e: any) {
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      set({
        authenticated: false,
        token: null,
        authLoading: false,
        authError: e?.message || 'Failed to restore session',
      });
    }
  },

  login: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const result = await authAPI.login(email, password);
      if (!result?.success) throw new Error(result?.msg || 'Login failed');

      await SecureStore.setItemAsync(TOKEN_KEY, result.authToken);

      const minimalUser = result.user || result;
      set({
        authenticated: true,
        token: result.authToken,
        email: minimalUser.email || email,
        profileCompleted: result.profileCompleted ?? minimalUser.profileCompleted ?? false,
        authLoading: false,
        authError: null,
      });

      // Auto-fetch full user data after login

      return result as AuthResult;
    } catch (e: any) {
      set({
        authLoading: false,
        authError: e?.response?.data?.message || e?.message || 'Login failed',
      });
      return { success: false, error: true, msg: e?.response?.data?.message || e?.message || 'Login failed' };
    }
  },

  register: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const result = await authAPI.register(email, password);
      if (!result?.success) throw new Error(result?.msg || 'Registration failed');

      await SecureStore.setItemAsync(TOKEN_KEY, result.authToken);

      set({
        authenticated: true,
        token: result.authToken,
        email,
        profileCompleted: false,
        authLoading: false,
        authError: null,
      });


      return result as AuthResult;
    } catch (e: any) {
      set({
        authLoading: false,
        authError: e?.response?.data?.message || e?.message || 'Registration failed',
      });
      return { success: false, error: true, msg: e?.response?.data?.message || e?.message || 'Registration failed' };
    }
  },

  loginWithGoogle: async (idToken: string) => {
    set({ authLoading: true, authError: null });
    try {
      const result = await authAPI.loginWithGoogle(idToken);
      if (!result?.success || !result?.authToken) throw new Error(result?.msg || 'Google login failed');

      await SecureStore.setItemAsync(TOKEN_KEY, result.authToken);

      const minimalUser = result.user || result;
      set({
        authenticated: true,
        token: result.authToken,
        email: minimalUser.email || null,
        profileCompleted: result.profileCompleted ?? minimalUser.profileCompleted ?? false,
        authLoading: false,
        authError: null,
      });


      return { success: true, authToken: result.authToken, user: minimalUser as ApiUser };
    } catch (e: any) {
      set({
        authLoading: false,
        authError: e?.response?.data?.message || e?.message || 'Google login failed',
      });
      return { success: false, error: true, msg: e?.response?.data?.message || e?.message || 'Google login failed' };
    }
  },

  onProfileCompleted: async () => {
    try {
      const userData = await authAPI.getUser();
      const mapped = mapUserFromApi(userData as ApiUser);
      set({
        ...mapped,
        profileCompleted: (userData as any).profileCompleted ?? mapped.profileCompleted ?? true,
        walletCreated: (userData as any).walletAddress !== null && (userData as any).walletAddress !== undefined,
      });
    } catch (e) {
      set((state: any) => ({ ...state, profileCompleted: true }));
    }
  },

  logout: () => {
    set((state: any) => ({
      ...state,
      authenticated: false,
      token: null,
      authLoading: false,
      authError: null,
    }));
    SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
  },
});
