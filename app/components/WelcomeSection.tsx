import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WelcomeSectionProps {
  onEarnMorePress?: () => void;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ onEarnMorePress }) => {
  return (
    <View>
        <View style={styles.container}>
            <View style={styles.imageContainer}>
                <Image
                source={require('../../assets/app-images/welcome.png')} 
                style={styles.welcomeImage}
                resizeMode="cover"
                />
            </View>
        </View>

        <View style={styles.contentContainer}>
        <Text style={styles.welcomeTitle}>Welcome To AkaiEarn</Text>
        <Text style={styles.welcomeSubtitle}>Let's have the task for today</Text>
        
        <TouchableOpacity 
          style={styles.earnMoreButton}
          onPress={onEarnMorePress}
          activeOpacity={0.8}
        >
          <Text style={styles.earnMoreText}>Earn More</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0a0b0f',
    borderWidth: 1,
    borderColor: '#2a2b33',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#1a1b23',
  },
  welcomeImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#0a0b0f',
    marginTop: -16
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: '#A1A1AA',
    fontSize: 14,
    marginBottom: 16,
  },
  earnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderColor: '#FFFFFF',
    // borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 6,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  earnMoreText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
