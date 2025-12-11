import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Linking from 'expo-linking';

function RootLayoutNav() {
  const { authState } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      if (event.url.startsWith('offerwall://')) {
        if (authState?.authenticated) {
          router.replace('/(tabs)/offer');
        }
      }
    };

    // handle initial deep link 
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [authState?.authenticated]);

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
    <PaperProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </PaperProvider>
  );
}
