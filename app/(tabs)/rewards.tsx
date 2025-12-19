import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useUserStore } from '../../stores/userStore';
import { RewardHeaderSection } from '../rewardComponents/rewardHeader';
import { LootboxSection } from '../rewardComponents/LootboxSection';
import { SpinWheelSection } from '../rewardComponents/SpinWheelSection';
import { OfferSkeletonLoader } from '../../components/SkeletonLoader';

export default function RewardScreen() {
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

  const handleClaimLootbox = () => {
    console.log('Claim lootbox pressed');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <OfferSkeletonLoader />
      </SafeAreaView>
    );
  }

  function handleSpinWheel(): void {
    console.log('handleSpinWheel pressed');
  }

  return (
    <SafeAreaView style={styles.container}>
      <RewardHeaderSection/>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LootboxSection onClaimPress={handleClaimLootbox} />
        <SpinWheelSection onSpinPress={handleSpinWheel} />
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
