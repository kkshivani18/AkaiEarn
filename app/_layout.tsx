import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function RootLayoutNav() {
  const { authState } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // auth state to be determined
    if (authState?.authenticated === null) {
      return;
    }

    const inAuthGroup = segments[0] === '(tabs)';
    const isOnIndex = !segments.length || pathname === '/' || pathname === '';

    if (!authState?.authenticated) {
      // user is not authenticated
      if (inAuthGroup) {
        router.replace('/');
      }
    } else {
      // user is authenticated
      if (isOnIndex) {
        if (authState?.profileCompleted) {
          router.replace('/(tabs)/offer');
        } else {
          router.replace('/profile-completion');
        }
      }
    }
  }, [authState?.authenticated, authState?.profileCompleted, segments, pathname]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
