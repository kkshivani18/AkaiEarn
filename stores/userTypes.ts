export type ApiUser = {
  _id?: string;
  id?: string;
  email?: string | null;
  firstName?: string;
  lastName?: string;
  profileCompleted?: boolean;
  walletAddress?: string | null;
  walletChainId?: string | null;
  googleId?: string | null;
  profileImg?: string | null;
  referralCode?: string | null;
  occupation?: string | null;
  dob?: string | Date | null;
  gender?: string | null;
  timezone?: string | null;
  location?: { lat?: number; lng?: number } | null;
  iq?: number;
  coins?: number;
  inrBalance?: number;
  balance?: number;
  dollars?: number;
  streakCount?: number;
  longestStreak?: number;
  lastStreakAt?: string | null;
  tags?: string[];
};

export type AuthSuccess = {
  success: true;
  authToken: string;
  user?: ApiUser;
  profileCompleted?: boolean;
};

export type AuthFailure = {
  success: false;
  error?: boolean;
  msg?: string;
};

export type AuthResult = AuthSuccess | AuthFailure;
