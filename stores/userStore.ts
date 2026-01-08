import { create } from 'zustand';
import { AuthSlice, createAuthSlice } from './slices/authSlice';
import { createProfileSlice, ProfileSlice } from './slices/profileSlice';
import { createWalletSlice, WalletSlice } from './slices/walletSlice';

export type UserStore = AuthSlice & ProfileSlice & WalletSlice;

export const useUserStore = create<UserStore>()((set, get, store) => ({
  ...createAuthSlice(set, get, store),
  ...createProfileSlice(set, get, store),
  ...createWalletSlice(set, get, store),
}));
