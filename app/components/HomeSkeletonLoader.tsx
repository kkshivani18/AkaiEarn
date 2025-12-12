import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

const AnimatedSkeleton: React.FC<{ style: any }> = ({ style }) => {
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
          backgroundColor: '#2a2b33',
          opacity,
        },
        style,
      ]}
    />
  );
};

export const HomeSkeletonLoader: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <AnimatedSkeleton style={styles.headerTitle} />
          <AnimatedSkeleton style={styles.headerStats} />
        </View>
        <View style={styles.headerRight}>
          <AnimatedSkeleton style={styles.iconButton} />
          <AnimatedSkeleton style={styles.iconButton} />
        </View>
      </View>

      {/* Welcome Section Skeleton */}
      <View style={styles.welcomeContainer}>
        <AnimatedSkeleton style={styles.welcomeImage} />
        <View style={styles.welcomeContent}>
          <AnimatedSkeleton style={styles.welcomeTitle} />
          <AnimatedSkeleton style={styles.welcomeSubtitle} />
          <AnimatedSkeleton style={styles.welcomeButton} />
        </View>
      </View>

      {/* Carousel Section Skeleton */}
      <View style={styles.section}>
        <AnimatedSkeleton style={styles.sectionTitle} />
        <AnimatedSkeleton style={styles.carouselCard} />
        <View style={styles.dotsContainer}>
          <AnimatedSkeleton style={styles.dot} />
          <AnimatedSkeleton style={styles.dot} />
          <AnimatedSkeleton style={styles.dot} />
        </View>
      </View>

      {/* Docs Section Skeleton */}
      <View style={styles.section}>
        <AnimatedSkeleton style={styles.sectionTitle} />
        <AnimatedSkeleton style={styles.docCard} />
      </View>

      {/* Socials Section Skeleton */}
      <View style={styles.section}>
        <AnimatedSkeleton style={styles.sectionTitle} />
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.socialCard}>
            <View style={styles.socialLeft}>
              <AnimatedSkeleton style={styles.socialIcon} />
              <View style={styles.socialInfo}>
                <AnimatedSkeleton style={styles.socialTitle} />
                <AnimatedSkeleton style={styles.socialReward} />
              </View>
            </View>
            <AnimatedSkeleton style={styles.socialButton} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b0f',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    width: 180,
    height: 28,
    borderRadius: 8,
    marginBottom: 8,
  },
  headerStats: {
    width: 140,
    height: 30,
    borderRadius: 20,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  welcomeContainer: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1b23',
    borderWidth: 1,
    borderColor: '#2a2b33',
  },
  welcomeImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  welcomeContent: {
    padding: 20,
  },
  welcomeTitle: {
    width: '70%',
    height: 28,
    borderRadius: 8,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    width: '50%',
    height: 18,
    borderRadius: 6,
    marginBottom: 16,
  },
  welcomeButton: {
    width: 130,
    height: 44,
    borderRadius: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    width: 150,
    height: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  carouselCard: {
    width: CARD_WIDTH,
    height: 250,
    borderRadius: 16,
    marginBottom: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  docCard: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  socialCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1b23',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2b33',
  },
  socialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  socialInfo: {
    flex: 1,
  },
  socialTitle: {
    width: '70%',
    height: 18,
    borderRadius: 6,
    marginBottom: 6,
  },
  socialReward: {
    width: '40%',
    height: 14,
    borderRadius: 4,
  },
  socialButton: {
    width: 80,
    height: 36,
    borderRadius: 8,
  },
});
