import { ApiUser } from './userTypes';

export const mapUserFromApi = (userData: ApiUser) => ({
  id: userData._id || userData.id || null,
  name: userData.firstName || 'User',
  email: userData.email ?? null,
  iq: userData.iq ?? 0,
  coins: userData.coins ?? 0,
  inrBalance: userData.inrBalance ?? 0,
  balance: userData.balance ?? 0,
  dollars: userData.dollars ?? 0,
  walletAddress: userData.walletAddress ?? null,
  streakCount: userData.streakCount ?? 0,
  longestStreak: userData.longestStreak ?? 0,
  lastStreakAt: userData.lastStreakAt ?? null,
  profileCompleted: userData.profileCompleted ?? false,
  tags: userData.tags ?? [],
  occupation: userData.occupation ?? null,
  gender: userData.gender ?? null,
  dob: userData.dob instanceof Date ? userData.dob.toISOString() : userData.dob ?? null,
  authenticated: true,
  lastFetched: Date.now(),
  hasInitialFetch: true,
});
