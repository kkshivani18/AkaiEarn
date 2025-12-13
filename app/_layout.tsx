import { CDPHooksProvider, Config } from "@coinbase/cdp-hooks";
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import "../globals";

const cdpConfig: Config = {
  projectId: process.env.EXPO_PUBLIC_CDP_PROJECT_ID!,
  basePath: process.env.EXPO_PUBLIC_CDP_BASE_PATH,
  useMock: process.env.EXPO_PUBLIC_USE_MOCK === "true",
  customAuth: {
    getJwt: async () => {
      try {
        // Get JWT from secure storage
        const token = await SecureStore.getItemAsync('authToken');
        console.log(token);
        
        return token || undefined;
      } catch (error) {
        console.error('Failed to get JWT:', error);
        return undefined;
      }
    }
  }
};

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
    <CDPHooksProvider config={cdpConfig} >
    <PaperProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </PaperProvider>
    </CDPHooksProvider>
  );
}
