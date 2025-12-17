import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUserStore } from '../../stores/userStore';

interface HeaderSectionProps {
  onNotificationPress?: () => void;
  onMenuPress?: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({ 
  onNotificationPress, 
  onMenuPress 
}) => {
  const { name, iq, coins } = useUserStore();

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.greeting}>Hello, {name || 'User'}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBadge}>
            <Text style={styles.statText}>IQ: {iq || 0}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBadge}>
            <Text style={styles.statText}>Points: {coins || 0}</Text>
          </View>
        </View>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0a0b0f',
  },
  leftSection: {
    flex: 1,
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
});
