import { StateCreator } from 'zustand';

export type WalletSlice = {
  walletCreated: boolean;
  walletChainId: string | null;
  walletCreatedAction: () => void;
  setWalletChainId: (chainId: string | null) => void;
  updateTokenBalance: (tokens: number) => void;
};

export const createWalletSlice: StateCreator<any, [], [], WalletSlice> = (set, get, _store) => ({
  walletCreated: false,
  walletChainId: null,

  walletCreatedAction: () => set({ walletCreated: true }),

  setWalletChainId: (chainId) => set({ walletChainId: chainId }),

  updateTokenBalance: (tokens: number) => {
    const prevCoins = get().coins || 0;
    set({
      coins: Math.max(0, prevCoins + tokens),
    });
  },
});
