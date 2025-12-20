import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LootboxHeaderSection } from './lootboxHeader';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LootboxesSection } from './lootboxes';

export default function LootboxesPage() {
  return (
    <SafeAreaView style={styles.container}>
      <LootboxHeaderSection />
      <ScrollView contentContainerStyle={styles.content}>
        <LootboxesSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b0f',
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
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  placeholder: {
    color: '#A1A1AA',
    fontSize: 14,
  },
});

