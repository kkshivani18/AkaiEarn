// index.tsx

import { useUserStore } from '@/stores/userStore';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Login } from './Login';
import { SignUp } from './SignUp';

export default function Index() {
  const authenticated = useUserStore(s => s.authenticated);
  const profileCompleted = useUserStore(s => s.profileCompleted);
  const authLoading = useUserStore(s => s.authLoading);
  const authMode = useUserStore(s => s.authMode);

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
      {authMode === 'login' && (
        <Login
          visible={true}
          onClose={() => {}} 
        />
      )}
      {authMode === 'signup' && (
        <SignUp
          visible={true}
          onClose={() => {}}
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

