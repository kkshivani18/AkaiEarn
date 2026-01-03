import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useUserStore } from '../../stores/userStore';
import { CarouselSection } from '../components/CarouselSection';
import { DocsSection } from '../components/DocsSection';
import { HeaderSection } from '../components/HeaderSection';
import { HomeSkeletonLoader } from '../components/HomeSkeletonLoader';
import { SocialTasks } from '../components/SocialTasks';
import { WelcomeSection } from '../components/WelcomeSection';
import { FONTS } from '../../constants/fonts';

export default function HomeScreen() {
  const { authState } = useAuth();
  const { fetchUserData, shouldRefetch } = useUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (authState?.authenticated) {
        if (shouldRefetch()) {
          await fetchUserData();
        } else {
          console.log('using cached data');
        }
        
        const timer = setTimeout(() => {
          setLoading(false);
        }, 1500);
        
        return () => clearTimeout(timer);
      } else {
        setLoading(false);
      }
    };

    loadData();
  }, [authState?.authenticated]);

  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  const handleMenuPress = () => {
    console.log('Menu pressed');
  };

  const handleEarnMorePress = () => {
    console.log('Earn More pressed');
    router.push('../../(tabs)/offer');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <HomeSkeletonLoader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <HeaderSection 
        onNotificationPress={handleNotificationPress}
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <WelcomeSection onEarnMorePress={handleEarnMorePress} />

        <View style={styles.section}>
          <CarouselSection autoScroll={true}/>
        </View>

        <View style={styles.section}>
          <DocsSection />
        </View>

        <View style={styles.section}>
          <Text style={styles.socialSectionTitle}> Connect to Socials </Text>
          <SocialTasks />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b0f',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    // marginBottom: 2,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: FONTS.heading.bold,
    marginBottom: 12,
  },
  socialSectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.heading.semiBold,
    marginBottom: 12,
  },
  placeholder: {
    color: '#888',
    fontSize: 14,
    fontFamily: FONTS.body.regular,
  },
});
