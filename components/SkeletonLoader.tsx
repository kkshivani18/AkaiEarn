import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, ViewStyle, Animated } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

interface SkeletonItem {
  key: string;
  width: string | number;
  height: number;
  borderRadius: number;
  marginBottom: number;
  marginTop?: number;
  alignSelf?: 'center' | 'flex-start' | 'flex-end';
}

interface SkeletonLoaderProps {
  type: 'rewards' | 'offer' | 'history' | 'profile' | 'coupons' | 'referredUsers' | 'social';
  count?: number;
  style?: any;
}

const AnimatedSkeleton: React.FC<{ style: ViewStyle }> = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    animation.start();
    
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          opacity,
        },
        style,
      ]}
    />
  );
};

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, count = 1, style }) => {
  const getSkeletonLayout = (): SkeletonItem[] => {
    switch (type) {
      case 'rewards':
        return [
          // profile skeleton
          { key: 'header', width: '100%', height: 60, borderRadius: 12, marginBottom: 20 },
          
          // lootBox section
          { key: 'lootbox', width: '100%', height: 120, borderRadius: 12, marginBottom: 20 },
          
          // spin wheel section
          { key: 'spinwheel', width: '100%', height: 140, borderRadius: 12, marginBottom: 20 },
          
          // referrals section
          { key: 'referrals', width: '100%', height: 180, borderRadius: 12, marginBottom: 20 },
          
          // coupons section
          { key: 'coupons', width: '100%', height: 200, borderRadius: 12, marginBottom: 20 },
        ];

      case 'offer':
        return [
          // Profile header skeleton
          { key: 'profile', width: '100%', height: 60, borderRadius: 12, marginBottom: 20 },
          
          // Section title skeleton
          { key: 'title1', width: 150, height: 24, borderRadius: 6, marginBottom: 16 },
          
          // Tab navigation skeleton
          { key: 'tabs', width: '100%', height: 44, borderRadius: 12, marginBottom: 16 },
          
          // Task cards skeleton
          { key: 'task1', width: CARD_WIDTH, height: 200, borderRadius: 16, marginBottom: 16 },
          
          // Social section title 
          { key: 'title2', width: 120, height: 24, borderRadius: 6, marginBottom: 16, marginTop: 20 },
          
          // Social tasks 
          { key: 'social1', width: '100%', height: 60, borderRadius: 12, marginBottom: 12 },
          { key: 'social2', width: '100%', height: 60, borderRadius: 12, marginBottom: 12 },
          { key: 'social3', width: '100%', height: 60, borderRadius: 12, marginBottom: 12 },
        ];

      case 'history':
        return Array.from({ length: count }, (_, i) => ({
          key: `history-${i}`,
          width: '100%',
          height: 120,
          borderRadius: 12,
          marginBottom: 16,
        }));

      case 'profile':
        return [
          { key: 'profileImage', width: 80, height: 80, borderRadius: 40, marginBottom: 16, alignSelf: 'center' },
          { key: 'name', width: 150, height: 24, borderRadius: 6, marginBottom: 8, alignSelf: 'center' },
          { key: 'email', width: 200, height: 16, borderRadius: 4, marginBottom: 20, alignSelf: 'center' },
          
          { key: 'stats1', width: '100%', height: 60, borderRadius: 12, marginBottom: 12 },
          { key: 'stats2', width: '100%', height: 60, borderRadius: 12, marginBottom: 12 },
          { key: 'stats3', width: '100%', height: 60, borderRadius: 12, marginBottom: 12 },
        ];

      case 'coupons':
        return Array.from({ length: count }, (_, i) => ({
          key: `coupon-${i}`,
          width: '100%',
          height: 120,
          borderRadius: 12,
          marginBottom: 16,
        }));

      case 'referredUsers':
        return Array.from({ length: count }, (_, i) => ({
          key: `user-${i}`,
          width: '100%',
          height: 56,
          borderRadius: 12,
          marginBottom: 8,
        }));

      case 'social':
        return Array.from({ length: count }, (_, i) => ({
          key: `social-${i}`,
          width: '100%',
          height: 60,
          borderRadius: 12,
          marginBottom: 12,
        }));

      default:
        return [
          { key: 'default', width: '100%', height: 60, borderRadius: 12, marginBottom: 12 }
        ];
    }
  };

  const skeletonLayout = getSkeletonLayout();

  return (
    <View style={[styles.container, style]}>
      {skeletonLayout.map((item) => {
        const itemStyle: ViewStyle = {
          width: item.width as ViewStyle['width'],
          height: item.height,
          borderRadius: item.borderRadius,
          marginBottom: item.marginBottom,
          ...(item.marginTop && { marginTop: item.marginTop }),
          ...(item.alignSelf && { alignSelf: item.alignSelf }),
        };
        
        return (
          <AnimatedSkeleton
            key={item.key}
            style={itemStyle}
          />
        );
      })}
    </View>
  );
};

export const RewardsSkeletonLoader = () => <SkeletonLoader type="rewards" />;
export const OfferSkeletonLoader = () => <SkeletonLoader type="offer" />;
export const HistorySkeletonLoader = ({ count = 5 }) => <SkeletonLoader type="history" count={count} />;
export const ProfileSkeletonLoader = () => <SkeletonLoader type="profile" />;
export const CouponsSkeletonLoader = ({ count = 3 }) => <SkeletonLoader type="coupons" count={count} />;
export const ReferredUsersSkeletonLoader = ({ count = 3 }) => <SkeletonLoader type="referredUsers" count={count} />;
export const SocialSkeletonLoader = ({ count = 3 }) => <SkeletonLoader type="social" count={count} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
});

export default SkeletonLoader;
