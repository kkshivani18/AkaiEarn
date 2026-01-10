import { useAuthenticateWithJWT } from "@coinbase/cdp-hooks";
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from '../services/api';
import { useUserStore } from '../stores/userStore';

interface AuthProps{
  authState?: { token: string | null, authenticated: boolean | null, user?: {email: string, coins?: number}, profileCompleted?: boolean };
  onRegister?: (email: string, password: string) => Promise<any>;
  onLogin?: (email: string, password: string) => Promise<any>;
  onLogout?: () => Promise<any>;
  onProfileCompleted?: () => void;
  onGoogleLogin?: (idToken: string) => Promise<any>;
  onWalletCreated: () => void;
}

interface AuthContextType {
  authState?: { token: string | null, authenticated: boolean | null, user?: {email: string, coins?: number}, profileCompleted?: boolean };
  onRegister?: (email: string, password: string) => Promise<any>;
  onLogin?: (email: string, password: string) => Promise<any>;
  onLogout?: () => Promise<any>;
  onProfileCompleted?: () => void;
  onGoogleLogin?: (idToken: string) => Promise<any>;
  updateTokenBalance: (tokens: number) => void;
  onWalletCreated: () => void;
}

const TOKEN_KEY = 'authToken';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Fail fast with a clear message to help debugging
    throw new Error('AuthContext not loaded — make sure <AuthProvider> wraps your app (app/_layout.tsx)');
  }
  return ctx;
};

export const AuthProvider = ({children}: any) => {
  const [authState, setAuthState] = useState<{
    token: string | null;
    authenticated: boolean | null;
    user?: {email: string, coins?: number};
    profileCompleted?: boolean;
    walletCreated?: boolean;
  }>({
    token: null,
    authenticated: null,
    user: undefined,
    profileCompleted: false,
    walletCreated: false
  });

  const { authenticateWithJWT } = useAuthenticateWithJWT();


  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);

        if(token) {
          try {
            // timeout to prevent hanging
            const userDataPromise = authAPI.getUser();
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Token validation timeout')), 5000)
            );
            
            const userData = await Promise.race([userDataPromise, timeoutPromise]);
            setAuthState({
              token: token,
              authenticated: true,
              user: userData.user || userData,
              profileCompleted: userData.profileCompleted ?? userData.user?.profileCompleted ?? false,
              walletCreated: userData.walletAddress === null ? false : true
            });
            
            // initialize zustand store with user data
            const user = userData.user || userData;
            useUserStore.getState().setUser({
              id: user._id || user.id,
              name: user.firstName || 'User',
              email: user.email,
              iq: user.iq || 0,
              coins: user.coins || 0,
              inrBalance: user.inrBalance || 0,
              walletAddress: userData.walletAddress || null,
              streakCount: user.streakCount || 0,
              longestStreak: user.longestStreak || 0,
              lastStreakAt: user.lastStreakAt || null,
              profileCompleted: userData.profileCompleted ?? user.profileCompleted ?? false,
            });
            
            try {
              await authenticateWithJWT();
              console.log('✅ CDP authentication restored on app start');
            } catch (cdpError) {
              console.error('❌ CDP re-authentication failed:', cdpError);
            }
          } catch (error) {
            console.log('❌ Token validation failed:', error);
            console.log('❌ Clearing invalid token...');
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            setAuthState({
              token: null,
              authenticated: false,
              user: undefined,
              profileCompleted: false,
              walletCreated: false
            });
            useUserStore.getState().logout();
          }
        } else {
          setAuthState({
            token: null,
            authenticated: false,
            user: undefined,
            profileCompleted: false,
            walletCreated: false
          });
        }
      } catch (error) {
        console.error('❌ Error loading token:', error);
        // If there's any error, default to not authenticated
        setAuthState({
          token: null, 
          authenticated: false,
          user: undefined,
          profileCompleted: false
        });
      }
    };
    loadToken();
  }, []);

  const register = async (email: string, password: string) => {
    try{
      const result = await authAPI.register(email, password);
      
      console.log('✅ Registration response:', result);
      
      if (result.success) {
        // store token
        await SecureStore.setItemAsync(TOKEN_KEY, result.authToken);
        // refresh user from backend and update auth state
        const userData = await authAPI.getUser();
        setAuthState({
          token: result.authToken,
          authenticated: true,
          user: userData.user || userData,
          profileCompleted: userData.profileCompleted ?? userData.user?.profileCompleted ?? false
        });
        
        // initialize zustand store
        await useUserStore.getState().fetchUserData();

        // Authenticate with CDP using the JWT
        try {
          const {user, isNewUser} = await authenticateWithJWT();
          console.log('✅ Successfully authenticated new user with CDP');
          console.log('CDP User:', user, 'Is New:', isNewUser);
        } catch (cdpError) {
          console.error('❌ CDP authentication failed during registration:', cdpError);
        }
      }
      
      return result;
    } catch(e: any){
      console.error('❌ Registration error:', e);
      console.error('❌ Registration error type:', typeof e);
      console.error('❌ Registration error response:', e.response);
      console.error('❌ Registration error data:', e.response?.data);
      console.error('❌ Registration error message:', e.message);
      
      let errorMessage = 'Registration failed';
      
      // Handle different error structures
      if (e.response?.data?.error) {
        errorMessage = e.response.data.error;
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e.message) {
        errorMessage = e.message;
      } else if (e.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout. Please check your internet connection.';
      } else if (e.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Please try again later.';
      }
      
      return {error: true, msg: errorMessage };
    }
  };

  const login = async (email: string, password: string) => {
    try{
      const result = await authAPI.login(email, password);

      if (result.success) {
        // store token
        await SecureStore.setItemAsync(TOKEN_KEY, result.authToken);
        // fetch current user to get authoritative profileCompleted flag
        const userData = await authAPI.getUser();
        setAuthState({
          token: result.authToken,
          authenticated: true,
          user: userData.user || userData || result.user || { email },
          profileCompleted: userData.profileCompleted ?? userData.user?.profileCompleted ?? false,
          walletCreated: userData.walletAddress === null ? false : true
        });

        await useUserStore.getState().fetchUserData();

        // Authenticate with CDP using the JWT
        try {
          const {user, isNewUser}=await authenticateWithJWT();
          console.log('✅ Successfully authenticated with CDP');
          console.log(user, isNewUser);
        } catch (cdpError) {
          console.error('❌ CDP authentication failed:', cdpError);
        }

      }
      
      return result;
    
    } catch(e: any){
      console.error('❌ Login error:', e);
      console.error('❌ Login error type:', typeof e);
      console.error('❌ Login error response:', e.response);
      console.error('❌ Login error data:', e.response?.data);
      console.error('❌ Login error message:', e.message);
      
      let errorMessage = 'Login failed';
      
      // Handle different error structures
      if (e.response?.data?.error) {
        errorMessage = e.response.data.error;
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e.message) {
        errorMessage = e.message;
      } else if (e.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout. Please check your internet connection.';
      } else if (e.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Please try again later.';
      }
      
      return {error: true, msg: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Delete token from storage
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      console.log('AuthContext: Token cleared from storage');

      // Reset auth state
      setAuthState({
        token: null,
        authenticated: false,
        user: undefined,
        profileCompleted: false
      });
      
      // Clear Zustand store
      useUserStore.getState().logout();
    } catch (error) {
      console.error('❌ AuthContext logout error:', error);
      
      // Even if there's an error, reset the state
      setAuthState({
        token: null,
        authenticated: false,
        user: undefined,
        profileCompleted: false
      });
      useUserStore.getState().logout();
    }
  };

  // profile completed and refresh user from backend
  const onProfileCompleted = async () => {
    try {
      const userData = await authAPI.getUser();
      
      const user = userData.user || userData;
      
      setAuthState(prev => ({
        ...prev,
        user: user,
        profileCompleted: userData.profileCompleted ?? user?.profileCompleted ?? true
      }));
      
      useUserStore.getState().setUser({
        id: user._id || user.id,
        name: user.firstName || 'User',
        email: user.email,
        iq: user.iq || 0,
        coins: user.coins || 0,
        inrBalance: user.inrBalance || 0,
        walletAddress: userData.walletAddress || null,
        streakCount: user.streakCount || 0,
        longestStreak: user.longestStreak || 0,
        lastStreakAt: user.lastStreakAt || null,
        profileCompleted: userData.profileCompleted ?? user.profileCompleted ?? true,
        occupation: user.occupation || null,
        gender: user.gender || null,
        dob: user.dob || null,
      });
      
      console.log('✅ Profile completed - User data refreshed:', {
        name: user.firstName || 'User',
        profileCompleted: true
      });
    } catch (e) {
      console.error('❌ Error refreshing user data on profile completion:', e);
      // fallback: mark locally true
      setAuthState(prev => ({ ...prev, profileCompleted: true }));
    }
  };

  const updateTokenBalance = (tokens: number) => {
    if (authState?.user) {
      setAuthState(prev => ({
        ...prev!,
        user: {
          ...prev!.user!,
          coins: (prev!.user!.coins || 0) + tokens
        }
      }));
    }
  };

  // Add a method to refresh user data after referral
  const refreshUserData = async () => {
    try {
      const userData = await authAPI.getUser();
      
      setAuthState(prev => ({
        ...prev!,
        user: userData.user || userData,
        profileCompleted: userData.profileCompleted ?? userData.user?.profileCompleted ?? prev?.profileCompleted
      }));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      const result = await authAPI.loginWithGoogle(idToken);
      if (result?.success && result?.authToken) {
        await SecureStore.setItemAsync(TOKEN_KEY, result.authToken);
        const userData = await authAPI.getUser();
        setAuthState({
          token: result.authToken,
          authenticated: true,
          user: (userData as any).user || userData,
          profileCompleted: (userData as any).profileCompleted ?? (userData as any).user?.profileCompleted ?? false
        });
      }
      return result;
    } catch (e: any) {
      return { error: true, msg: e.response?.data?.message || e.message || 'Google login failed' };
    }
  };

  const walletCreated=()=>{
    setAuthState(prev=>({
      ...prev,
      walletCreated:true
    }))
  }

  const value: AuthContextType = {
    onRegister: register,
    onLogin: login,
    onLogout: logout,
    onProfileCompleted: onProfileCompleted,
    onGoogleLogin: loginWithGoogle,
    onWalletCreated: walletCreated,
    authState: authState,
    updateTokenBalance,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};