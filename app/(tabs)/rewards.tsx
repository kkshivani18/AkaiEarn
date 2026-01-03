import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useUserStore } from '../../stores/userStore';
import { RewardHeaderSection } from '../rewardComponents/rewardHeader';
import { LootboxSection } from '../rewardComponents/LootboxSection';
import { SpinWheelSection } from '../rewardComponents/SpinWheelSection';
import { ReferralSection } from '../rewardComponents/ReferralSection';
import { OfferSkeletonLoader } from '../../components/SkeletonLoader';
import { CouponSection } from '../rewardComponents/CouponSection';
import { FONTS } from '../../constants/fonts';

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
    router.replace('/rewardComponents/lootboxComponents/lootboxesPage');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <OfferSkeletonLoader />
      </SafeAreaView>
    );
  }

  function handleSpinWheel(): void {
    console.log('handleSpinWheel pressed');
  }
  
  function handleCopyReferral(): void {
    console.log('Copy referral code');
  }
  
  function handleLearnMoreReferral(): void {
    console.log('Learn more about referrals');
  }

  function handleViewHistory(): void {
    console.log('View History pressed');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <RewardHeaderSection/>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LootboxSection onClaimPress={handleClaimLootbox} />
        <SpinWheelSection onSpinPress={handleSpinWheel} />
        <ReferralSection
          referralCode="DE7P4P8E"
          totalReferrals={2}
          onCopyPress={handleCopyReferral}
          onLearnMorePress={handleLearnMoreReferral}
        />
        <CouponSection onViewHistory={handleViewHistory} />
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
  placeholder: {
    color: '#888',
    fontSize: 14,
  },
});
