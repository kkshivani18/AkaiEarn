import { AuthProvider } from "@/contexts/AuthContext";
import { useUserStore } from "@/stores/userStore";
import { CDPHooksProvider, Config } from "@coinbase/cdp-hooks";
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { FONT_ASSETS } from '../constants/fonts';
import NotificationService from '../services/NotificationService';
import "../globals";
import { SplashScreen } from './SplashScreen';
import { OnboardingSplash } from './SplashScreen2';

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
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();

  const authenticated = useUserStore(s => s.authenticated);
  const profileCompleted = useUserStore(s => s.profileCompleted);
  const authLoading = useUserStore(s => s.authLoading);
  const hydrateAuth = useUserStore(s => s.hydrateAuth);
  
  const [showFirstSplash, setShowFirstSplash] = useState(true);
  const [showSecondSplash, setShowSecondSplash] = useState(false);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

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

  // Initialize push notifications
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await NotificationService.requestUserPermission();
        await NotificationService.createChannels();
        NotificationService.initialize();
        NotificationService.handleNotificationPress();
        console.log('✅ Push notifications initialized');
      } catch (error) {
        console.error('❌ Failed to initialize notifications:', error);
      }
    };

    initNotifications();
  }, []);

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      if (event.url.startsWith('offerwall://') && authenticated) {
          router.replace('/(tabs)/home');
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
  }, [authenticated, router]);

  useEffect(() => {
    // no routing while showing splash screens
    if (showFirstSplash || showSecondSplash || authLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(tabs)';
    const isOnIndex = !segments.length || pathname === '/' || pathname === '';

    if (!authenticated) {
      // User is not authenticated
      if (inAuthGroup) {
        router.replace('/');
      }
    } else {
      // User is authenticated
      if (isOnIndex) {
        if (profileCompleted) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/profile-completion');
        }
      }
    }
  }, [
    authenticated,
    profileCompleted,
    authLoading,
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

  if (authLoading) return <SplashScreen />;

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