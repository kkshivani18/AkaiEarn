import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStreakAt: string;
  isActive: boolean;
}

interface StreakProps {
  streakData: StreakData;
  size?: 'small' | 'medium' | 'large';
}

// Helper function to calculate if streak is active
const calculateStreakStatus = (lastStreakAt: string): boolean => {
  const lastLogin = new Date(lastStreakAt);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset time to start of day for comparison
  lastLogin.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  
  // Streak is active if last login was today or yesterday
  return lastLogin.getTime() === today.getTime() || lastLogin.getTime() === yesterday.getTime();
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
};

const Streak: React.FC<StreakProps> = ({ 
  streakData, 
  size = 'medium' 
}) => {
  const { currentStreak, longestStreak, lastStreakAt, isActive } = streakData;
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
        };
      case 'large':
        return {
          container: styles.largeContainer,
        };
      default: // medium
        return {
          container: styles.mediumContainer,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <LinearGradient
      colors={isActive ? ['#FF6B35', '#F7931E'] : ['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, sizeStyles.container]}
    >
      <View style={styles.glassEffect}>
        {/* Empty container */}
      </View>
    </LinearGradient>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glassEffect: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderRadius: 20,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Size variants
  smallContainer: {
    padding: 12,
    minHeight: 70,
  },
  smallFireIcon: {
    fontSize: 20,
  },
  smallNumber: {
    fontSize: 18,
  },
  smallLabel: {
    fontSize: 8,
  },
  smallDetail: {
    fontSize: 7,
  },
  
  mediumContainer: {
    padding: 16,
    minHeight: 85,
  },
  mediumFireIcon: {
    fontSize: 28,
  },
  mediumNumber: {
    fontSize: 24,
  },
  mediumLabel: {
    fontSize: 9,
  },
  mediumDetail: {
    fontSize: 8,
  },
  
  largeContainer: {
    padding: 20,
    minHeight: 100,
  },
  largeFireIcon: {
    fontSize: 36,
  },
  largeNumber: {
    fontSize: 32,
  },
  largeLabel: {
    fontSize: 10,
  },
  largeDetail: {
    fontSize: 9,
  },
});

export { calculateStreakStatus, formatDate };
export default Streak;