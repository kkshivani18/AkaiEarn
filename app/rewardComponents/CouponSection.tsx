import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FONTS } from '../../constants/fonts';

interface ViewHistorySectionProps {
  onViewHistory?: () => void;
}

export const CouponSection: React.FC<ViewHistorySectionProps> = ({ onViewHistory }) => {
  const handleViewHistory = () => {
    console.log('View History pressed');
    router.push('/rewardComponents/couponComponents/couponPage');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#404399', '#CE5EE8', '#F08DC3', '#CE5EE8', '#404399']}
        locations={[0, 0.19, 0.52, 0.82, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientContainer}
      >
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Your Coupon{'\n'}Collection</Text>
            <Text style={styles.subtitle}>
              View all your collected{'\n'}coupons from Wheel spin
            </Text>
            
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleViewHistory}
              style={styles.buttonWrapper}
            >
              <LinearGradient
                colors={['#D9D9D9', '#ECCF90']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>View History</Text>
                  <Ionicons name="arrow-forward" size={12} color="#000" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      <View style={styles.imageContainer} pointerEvents="none">
        <Image
          source={require('../../assets/app-images/coupons_wallet.png')}
          style={styles.wheelImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: -30, 
    marginBottom: 60,
    width: 340,
    alignSelf: 'flex-start',
    position: 'relative',
  },
  gradientContainer: {
    borderRadius: 20,
    height: 150,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', 
    paddingHorizontal: 20,
    height: '100%',
  },
  textContainer: {
    width: 220,
    justifyContent: 'center',
    alignItems: 'flex-start', 
    zIndex: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginLeft: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#000000',
    marginBottom: 12,
    lineHeight: 16,
    opacity: 0.95,
    textAlign: 'left',
    marginLeft: 5,
  },
  buttonWrapper: {
    alignSelf: 'flex-start',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D1A950',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 18,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    fontSize: 12,
    fontFamily: FONTS.body.semiBold,
    color: '#000000',
  },
  imageContainer: {
    position: 'absolute',
    // right: -10,
    top: -60,
    width: 250,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    left: 115,
  },
  wheelImage: {
    width: '100%',
    height: '100%',
  },
});
