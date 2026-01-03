import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '../../../stores/userStore';
import { FONTS } from "../../../constants/fonts";

interface HeaderSectionProps {
}

export const LootboxHeaderSection: React.FC<HeaderSectionProps> = ({ 
}) => {
  const { name, iq, coins } = useUserStore();

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.greeting}>Lootboxes</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBadge}>
            <Text style={styles.statText}>IQ: {iq || 0}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBadge}>
            <Text style={[styles.statText, {fontFamily: FONTS.body.semiBold}]}>Points: {coins || 0}</Text>
          </View>
        </View>
      </View>
      <View style={styles.backBar}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/rewards')} style={styles.backButton} activeOpacity={0.8}>
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
    fontFamily: FONTS.body.bold,
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
  }
});
