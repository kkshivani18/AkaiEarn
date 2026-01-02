// index.tsx

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Login } from './Login';
import { SignUp } from './SignUp';
import { useAuth } from '../contexts/AuthContext'
import { router } from 'expo-router';

export default function Index() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const { authState } = useAuth(); 

  useEffect(() => {
    console.log('Auth state:', authState);
    
    if (authState?.authenticated === null) {
      console.log('Still loading auth state...');
      return; 
    }

    console.log('Auth state determined:', {
      authenticated: authState?.authenticated,
      profileCompleted: authState?.profileCompleted
    });

    if (authState?.authenticated) {
      if (!authState?.profileCompleted) {
        console.log('Navigating to profile completion');
        router.replace('/profile-completion');
      }
    } else {
      console.log('Navigating to login/signup');
      setShowSignIn(true);
    }
  }, [authState?.authenticated, authState?.profileCompleted]); 

  const { onLogin, onRegister } = useAuth();

  if (authState?.authenticated === null || authState?.authenticated === true) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E5383B" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {showSignIn && (
        <Login
          visible={true}
          onClose={() => {}} 
          onLogin={onLogin ? onLogin : () => Promise.resolve({ error: true, msg: "Login context not fully initialized." })} 
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
          onSignUp={onRegister ? onRegister : () => Promise.resolve({ error: true, msg: "Register context not fully initialized." })}
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

