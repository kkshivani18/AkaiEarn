// index.tsx

import { useUserStore } from '@/stores/userStore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Login } from './Login';
import { SignUp } from './SignUp';

export default function Index() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const authenticated = useUserStore(s => s.authenticated);
  const profileCompleted = useUserStore(s => s.profileCompleted);
  const authLoading = useUserStore(s => s.authLoading);
  const login = useUserStore(s => s.login);
  const register = useUserStore(s => s.register);

  useEffect(() => {
    console.log('Auth state:', {authenticated, profileCompleted, authLoading});
    
    if (authLoading) {
      console.log('Still loading auth state...');
      return; 
    }

    console.log('Auth state determined:', {
      authenticated,
      profileCompleted,
    });

    if (!authenticated) {
      console.log('Navigating to login/signup');
      setShowSignIn(true);
    }
  }, [authenticated, profileCompleted, authLoading]); 


  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E5383B" />
      </View>
    );
  }

  // If authenticated, RootLayoutNav will redirect; render nothing here
  if (authenticated) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      {showSignIn && (
        <Login
          visible={true}
          onClose={() => {}} 
          onLogin={login} 
          onSwitchToSignUp={() => {
            setShowSignIn(false);
            setShowSignUp(true);
          }}
        />
      )}
      {showSignUp && (
        <SignUp
          visible={true}
          onClose={() => {}}
          onSignUp={register}
          onSwitchToSignIn={() => {
            setShowSignUp(false);
            setShowSignIn(true);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0b0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

