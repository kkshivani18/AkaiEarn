import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../../stores/userStore';
import { ActivityIndicator } from 'react-native';
import { couponsAPI } from '../../../services/api';

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
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Array<{
    _id: string;
    company: string;
    description: string;
    couponCode: string;
    expiryDate: string;
    imageLink: string;
  }>>([]);

  const formatExpiryDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      return `Till ${day} ${month}`;
    } catch (error) {
      return dateString;
    }
  };

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

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          const response = await couponsAPI.getUserCoupons();
          if (response.success) {
            setCoupons(response.data || []);
          }
        } catch (e) {
          console.error('Error loading coupons:', e);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <CouponHeaderSection />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#A78BFA" />
        ) : coupons.length === 0 ? (
          <Text style={{ color: '#A1A1AA', fontSize: 14 }}>No coupons yet</Text>
        ) : (
          coupons.map((c) => (
            <LinearGradient
              key={c._id}
              colors={['#FFB917', '#FFEBA3', '#EFD69D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bannerContainer}
            >
              <View style={styles.leftContent}>
                <View style={styles.textContainer}>
                  <Text style={styles.companyText}>{c.company}</Text>
                  <Text style={styles.discountText}>{c.description}</Text>
                </View>
                
                <TouchableOpacity 
                  onPress={() => handleCopyCode(c.couponCode)} 
                  style={styles.copyButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name="copy-outline" size={18} color="#EF4444" />
                  <Text style={styles.copyButtonText}>{c.couponCode}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.rightSection}>
                <View style={styles.expiryBadge}>
                  <Text style={styles.expiryText}>{formatExpiryDate(c.expiryDate)}</Text>
                </View>
                <Image
                  source={c.imageLink ? { uri: c.imageLink } : require('../../../assets/app-images/nike_coupon.png')}
                  style={styles.bannerImage}
                  resizeMode="contain"
                />
              </View>
            </LinearGradient>
          ))
        )}
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
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    width: 322,
    height: 120,
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
  companyText: {
    color: '#1F2937',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  discountText: {
    color: '#1F2937',
    fontSize: 16,
    // fontWeight: 'bold',
    marginBottom: 4,
  },
  couponText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  expiryBadge: {
    backgroundColor: '#FFCD0A',
    borderRadius: 6,
    paddingVertical: 4,
    marginTop: 30,
    top: -15,
    right: -30,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  expiryText: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '700',
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
    width: 90,
    height: 80,
    borderRadius: 16,
    marginBottom: 10,
    top: -5,
    right: -10
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
