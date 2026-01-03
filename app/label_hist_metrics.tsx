import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '../stores/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from "../constants/fonts";

interface HeaderSectionProps {
}

interface MetricsCardProps {
  accuracy: number;
  tasksDone: number;
  coinsEarned: number;
  currentIQ: number;
  iqGainedThisWeek: number;
}

// Image Components
const AccuracyIcon = () => (
  <Image 
    source={{ uri: 'https://akaiearn-app-images.s3.ap-south-1.amazonaws.com/profileScreen/labeling-history/lb_hist_acc.png'}} 
    style={{ width: 35, height: 35 }}
    resizeMode="contain"
  />
);

const TaskIcon = () => (
  <Image 
    source={{ uri: 'https://akaiearn-app-images.s3.ap-south-1.amazonaws.com/profileScreen/labeling-history/lb_hist_tasks.png'}} 
    style={{ width: 35, height: 35 }}
    resizeMode="contain"
  />
);

const CoinIcon = () => (
  <Image 
    source={{ uri: 'https://akaiearn-app-images.s3.ap-south-1.amazonaws.com/common/spin_coin.png' }} 
    style={{ width: 35, height: 35 }}
    resizeMode="contain"
  />
);

const BrainIcon = () => (
  <Image 
    source={require('../assets/app-images/iq_brain.png')} 
    style={{ width: 48, height: 48 }}
    resizeMode="contain"
  />
);

// Metrics Card Component
export const LabelHistMetricsCard: React.FC<MetricsCardProps> = ({
  accuracy,
  tasksDone,
  coinsEarned,
  currentIQ,
  iqGainedThisWeek
}) => {
  // Calculate progress percentage (IQ towards next level, capped at 100%)
  const progressPercentage = Math.min((currentIQ % 1000) / 10, 100);
  
  return (
    <View style={styles.metricsContainer}>
      {/* IQ Progress Section */}
      <View style={styles.iqSection}>
        <View style={styles.iqHeader}>
          <View style={styles.iqTitleContainer}>
            <Text style={styles.iqTitle}>Current IQ: </Text>
            <Text style={styles.iqValue}>{currentIQ}</Text>
            {iqGainedThisWeek > 0 && (
              <Text style={styles.iqWeekly}> (+ {iqGainedThisWeek} this week)</Text>
            )}
          </View>
          <BrainIcon />
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <LinearGradient
            colors={['#34E819', '#70C8F4', '#D63CC6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
          />
          <View style={[styles.progressBarEmpty, { width: `${100 - progressPercentage}%` }]} />
        </View>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {/* Accuracy */}
        <View style={styles.metricCard}>
          <AccuracyIcon />
          <Text style={styles.metricValue}>{accuracy}%</Text>
          <Text style={styles.metricLabel}>Accuracy</Text>
        </View>

        {/* Tasks Done */}
        <View style={styles.metricCard}>
          <TaskIcon />
          <Text style={styles.metricValue}>{tasksDone.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Task Done</Text>
        </View>

        {/* Coins Earned */}
        <View style={styles.metricCard}>
          <CoinIcon />
          <Text style={styles.metricValue}>{coinsEarned.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Earned</Text>
        </View>
      </View>
    </View>
  );
};

export const LabelHistHeaderSection: React.FC<HeaderSectionProps> = ({ 
}) => {
  const { name, iq, coins } = useUserStore();

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.greeting}>Labeling History</Text>
      </View>
      <View style={styles.backBar}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} style={styles.backButton} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontFamily: FONTS.heading.bold,
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
    fontFamily: FONTS.body.semiBold,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#0a0b0f',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Metrics Card Styles
  metricsContainer: {
    backgroundColor: '#1a1b1f',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  iqSection: {
    marginBottom: 12,
  },
  iqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iqTitleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  iqTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.body.semiBold,
  },
  iqValue: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.body.bold,
  },
  iqWeekly: {
    color: '#10B981',
    fontSize: 14,
    fontFamily: FONTS.body.semiBold,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#2a2b2f',
    marginTop: -10
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarEmpty: {
    height: '100%',
    backgroundColor: '#2a2b2f',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#0a0b0f',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricValue: {
    color: '#fff',
    fontSize: 17,
    fontFamily: FONTS.body.bold,
    marginTop: 1,
  },
  metricLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    fontFamily: FONTS.body.semiBold,
    marginTop: -4,
  },
});
