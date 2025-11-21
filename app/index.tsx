// index.tsx

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Login } from './Login';
import { SignUp } from './SignUp';
import { SplashScreen } from './SplashScreen';
import { useAuth } from '../contexts/AuthContext'
import { router } from 'expo-router';

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const { authState } = useAuth(); 

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      console.log('Splash screen timed out, waiting for Auth state...');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

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

    setShowSplash(false);
    setShowSignIn(false);
    setShowSignUp(false);

    if (authState?.authenticated) {
      if (authState?.profileCompleted) {
        console.log('Navigating to tabs');
        router.replace('/(tabs)/offer');
      } else {
        console.log('Navigating to profile completion');
        router.replace('/profile-completion');
      }
    } else {
      console.log('Navigating to login/signup');
      if (!showSplash) {
        setShowSignIn(true);
      }
    }
  }, [authState?.authenticated, authState?.profileCompleted, showSplash]); 

  const { onLogin, onRegister } = useAuth();

  if (showSplash) {
    return <SplashScreen />;
  }

  if (showSplash || authState?.authenticated === null) {
    return <SplashScreen />;
}

  return (
    <View style={{ flex: 1 }}>
      {showSignIn && (
        <Login
          visible={true}
          onClose={() => setShowSignIn(false)} 
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
          onClose={() => setShowSignUp(false)}
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

