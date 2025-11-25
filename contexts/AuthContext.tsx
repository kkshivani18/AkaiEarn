import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from '../services/api'

interface AuthProps{
  authState?: { token: string | null, authenticated: boolean | null, user?: {email: string, coins?: number}, profileCompleted?: boolean };
  onRegister?: (email: string, password: string) => Promise<any>;
  onLogin?: (email: string, password: string) => Promise<any>;
  onLogout?: () => Promise<any>;
  onProfileCompleted?: () => void;
  onGoogleLogin?: (idToken: string) => Promise<any>;
}

interface AuthContextType {
  authState?: { token: string | null, authenticated: boolean | null, user?: {email: string, coins?: number}, profileCompleted?: boolean };
  onRegister?: (email: string, password: string) => Promise<any>;
  onLogin?: (email: string, password: string) => Promise<any>;
  onLogout?: () => Promise<any>;
  onProfileCompleted?: () => void;
  onGoogleLogin?: (idToken: string) => Promise<any>;
  updateTokenBalance: (tokens: number) => void;
}

const TOKEN_KEY = 'authToken';
const AuthContext = createContext<AuthProps | undefined>(undefined);

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
  }>({
    token: null,
    authenticated: null,
    user: undefined,
    profileCompleted: false
  });

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
            // persist user data for quick access
            try { await SecureStore.setItemAsync('userData', JSON.stringify(userData)); } catch(e){console.warn('Could not persist userData', e)}
            setAuthState({
              token: token, 
              authenticated: true,
              user: userData.user || userData,
              profileCompleted: userData.profileCompleted ?? userData.user?.profileCompleted ?? false
            });
            console.log('✅ Token valid, user authenticated');
          } catch (error) {
            console.log('❌ Token validation failed:', error);
            console.log('❌ Clearing invalid token...');
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            setAuthState({
              token: null, 
              authenticated: false,
              user: undefined,
              profileCompleted: false
            });
          }
        } else {
          setAuthState({
            token: null, 
            authenticated: false,
            user: undefined,
            profileCompleted: false
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
        try { await SecureStore.setItemAsync('userData', JSON.stringify(userData)); } catch(e){console.warn('Could not persist userData', e)}
        setAuthState({ 
          token: result.authToken,
          authenticated: true,
          user: userData.user || userData,
          profileCompleted: userData.profileCompleted ?? userData.user?.profileCompleted ?? false
        });
        console.log('✅ Token stored and user loaded');
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
        try { await SecureStore.setItemAsync('userData', JSON.stringify(userData)); } catch(e){console.warn('Could not persist userData', e)}
        setAuthState({ 
          token: result.authToken,
          authenticated: true,
          user: userData.user || userData || result.user || { name: 'User', email },
          profileCompleted: userData.profileCompleted ?? userData.user?.profileCompleted ?? false
        });

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
      await SecureStore.deleteItemAsync('userData');
      console.log('✅ AuthContext: Tokens cleared from storage');

      // Reset auth state
      setAuthState({
        token: null, 
        authenticated: false,
        user: undefined,
        profileCompleted: false
      });
    } catch (error) {
      console.error('❌ AuthContext logout error:', error);
      
      // Even if there's an error, reset the state
      setAuthState({
        token: null, 
        authenticated: false,
        user: undefined,
        profileCompleted: false
      });
    }
  };

  // profile completed and refresh user from backend
  const onProfileCompleted = async () => {
    try {
      const userData = await authAPI.getUser();
      try { await SecureStore.setItemAsync('userData', JSON.stringify(userData)); } catch(e){console.warn('Could not persist userData', e)}
      setAuthState(prev => ({
        ...prev,
        user: userData.user || userData,
        profileCompleted: userData.profileCompleted ?? userData.user?.profileCompleted ?? true
      }));
    } catch (e) {
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
      try { 
        await SecureStore.setItemAsync('userData', JSON.stringify(userData)); 
      } catch(e) {
        console.warn('Could not persist userData', e);
      }
      
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
        try { await SecureStore.setItemAsync('userData', JSON.stringify(userData)); } catch(e){/* ignore */ }
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

  const value: AuthContextType = {
    onRegister: register,
    onLogin: login,
    onLogout: logout,
    onProfileCompleted: onProfileCompleted,
    onGoogleLogin: loginWithGoogle,
    authState: authState,
    updateTokenBalance,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};