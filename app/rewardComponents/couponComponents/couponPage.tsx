import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../../stores/userStore';

const CouponHeaderSection = () => {
  const { iq, coins } = useUserStore();

  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.leftSection}>
        <Text style={headerStyles.greeting}>Your Coupons</Text>
        <View style={headerStyles.statsContainer}>
          <View style={headerStyles.statBadge}>
            <Text style={headerStyles.statText}>IQ: {iq || 0}</Text>
          </View>
          <View style={headerStyles.statDivider} />
          <View style={headerStyles.statBadge}>
            <Text style={headerStyles.statText}>Points: {coins || 0}</Text>
          </View>
        </View>
      </View>
      <View style={headerStyles.backBar}>
        <TouchableOpacity onPress={() => router.back()} style={headerStyles.backButton} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function CouponPage() {
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbarMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
    
    setTimeout(() => {
      setShowSnackbar(false);
    }, 2000);
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    showSnackbarMessage('Coupon code copied');
  };

  return (
    <SafeAreaView style={styles.container}>
      <CouponHeaderSection />
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={['#FFB917', '#FFEBA3', '#EFD69D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bannerContainer}
        >
          <View style={styles.leftContent}>
            <View style={styles.textContainer}>
              <Text style={styles.upToText}>Up to</Text>
              <Text style={styles.discountText}>20% OFF</Text>
              <Text style={styles.couponText}>Nike Discount Coupon</Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => handleCopyCode('NIKE20')} 
              style={styles.copyButton}
              activeOpacity={0.8}
            >
              <Ionicons name="copy-outline" size={18} color="#EF4444" />
              <Text style={styles.copyButtonText}>NIKE20</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.rightSection}>
            <Image
              source={require('../../../assets/app-images/nike_coupon.png')}
              style={styles.bannerImage}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>
        <LinearGradient
          colors={['#FFB917', '#FFEBA3', '#EFD69D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bannerContainer}
        >
          <View style={styles.leftContent}>
            <View style={styles.textContainer}>
              <Text style={styles.upToText}>Up to</Text>
              <Text style={styles.discountText}>50% OFF</Text>
              <Text style={styles.couponText}>Nike Discount Coupon</Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => handleCopyCode('NIKE50')} 
              style={styles.copyButton}
              activeOpacity={0.8}
            >
              <Ionicons name="copy-outline" size={18} color="#EF4444" />
              <Text style={styles.copyButtonText}>NIKE50</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.rightSection}>
            <Image
              source={require('../../../assets/app-images/nike_coupon.png')}
              style={styles.bannerImage}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>
      </ScrollView>

      {showSnackbar && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b0f',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bannerContainer: {
    marginTop: 20,
    marginBottom: 20,
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    width: 322,
    height: 126.44,
  },
  leftContent: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 20,
    paddingVertical: 10,
  },
  rightSection: {
    width: 118,
    height: 118,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4, // Adjust for spacing if needed
    alignSelf: 'center',
  },
  textContainer: {
    marginBottom: 10,
  },
  upToText: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  discountText: {
    color: '#1F2937',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  couponText: {
    color: '#1F2937',
    fontSize: 10,
    fontWeight: '500',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FFB917',
    gap: 6,
    alignSelf: 'flex-start', 
    marginTop: 5,
  },
  copyButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bannerImage: {
    width: 118,
    height: 118,
    borderRadius: 10,
  },
  snackbar: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  },
  snackbarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0a0b0f',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFCD0A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: '#FFCD0A',
    shadowOpacity: 0.5, 
    shadowRadius: 8,
    elevation: 8
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#1F2937',
    marginHorizontal: 8,
  },
  statText: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '600',
  },
  backBar: {
    // paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
