import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { CarouselSection } from '../components/CarouselSection';
import { DocsSection } from '../components/DocsSection';
import { HeaderSection } from '../components/HeaderSection';
import { HomeSkeletonLoader } from '../components/HomeSkeletonLoader';
import { SocialTasks } from '../components/SocialTasks';
import { WelcomeSection } from '../components/WelcomeSection';

export default function HomeScreen() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authState?.authenticated) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [authState?.authenticated]);

  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // navigate to notif screen
  };

  const handleMenuPress = () => {
    console.log('Menu pressed');
    // open dashboard page
  };

  const handleEarnMorePress = () => {
    console.log('Earn More pressed');
    // Navigate to offers tab
    router.push('/(tabs)/offer');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <HomeSkeletonLoader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
    fontWeight: 'bold',
    marginBottom: 12,
  },
  socialSectionTitle: {
    color: '#fff',
    fontSize: 18,
    // fontWeight: 'bold',
    marginBottom: 12,
  },
  placeholder: {
    color: '#888',
    fontSize: 14,
  },
});
