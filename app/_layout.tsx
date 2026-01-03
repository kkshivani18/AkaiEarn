import { CDPHooksProvider, Config } from "@coinbase/cdp-hooks";
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { SplashScreen } from './SplashScreen';
import { OnboardingSplash } from './SplashScreen2';
import { useFonts } from 'expo-font';
import { FONT_ASSETS } from '../constants/fonts';
import "../globals";

const cdpConfig: Config = {
  projectId: process.env.EXPO_PUBLIC_CDP_PROJECT_ID!,
  basePath: process.env.EXPO_PUBLIC_CDP_BASE_PATH,
  useMock: process.env.EXPO_PUBLIC_USE_MOCK === "true",
  customAuth: {
    getJwt: async () => {
      try {
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
  
  const [showFirstSplash, setShowFirstSplash] = useState(true);
  const [showSecondSplash, setShowSecondSplash] = useState(false);

  // first splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFirstSplash(false);
      setShowSecondSplash(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // second splash completion
  const handleSecondSplashComplete = () => {
    setShowSecondSplash(false);
  };

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      if (event.url.startsWith('offerwall://')) {
        if (authState?.authenticated) {
          router.replace('/(tabs)/home');
        }
      }
    };

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
    // no routing while showing splash screens
    if (showFirstSplash || showSecondSplash) {
      return;
    }

    // Auth state determined
    if (authState?.authenticated === null) {
      return;
    }

    const inAuthGroup = segments[0] === '(tabs)';
    const isOnIndex = !segments.length || pathname === '/' || pathname === '';

    if (!authState?.authenticated) {
      // User is not authenticated
      if (inAuthGroup) {
        router.replace('/');
      }
    } else {
      // User is authenticated
      if (isOnIndex) {
        if (authState?.profileCompleted) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/profile-completion');
        }
      }
    }
  }, [
    authState?.authenticated,
    authState?.profileCompleted,
    segments,
    pathname,
    showFirstSplash,
    showSecondSplash,
  ]);

  // Show splash screens
  if (showFirstSplash) {
    return <SplashScreen />;
  }

  if (showSecondSplash) {
    return <OnboardingSplash onContinue={handleSecondSplashComplete} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(FONT_ASSETS);

  if (!fontsLoaded) {
    return null; 
  }

  return (
    <CDPHooksProvider config={cdpConfig}>
      <PaperProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </PaperProvider>
    </CDPHooksProvider>
  );
}