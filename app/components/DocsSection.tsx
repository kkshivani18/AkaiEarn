import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FONTS } from '../../constants/fonts';

interface DocsSectionProps {
  onLearnMorePress?: () => void;
}

export const DocsSection: React.FC<DocsSectionProps> = ({ onLearnMorePress }) => {
  const handlePress = () => {
    if (onLearnMorePress) {
      onLearnMorePress();
    } else {
      // Navigate to rewards page
      router.push('/(tabs)/rewards');
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Image
        source={{uri: 'https://akaiearn-app-images.s3.ap-south-1.amazonaws.com/homeScreen/docs.png'}}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.textOverlay}>
        <Text style={styles.title}>Learn More →</Text>
        <Text style={styles.subtitle}>Quests, Rewards, Referral and More..</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 75,
  },
  textOverlay: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontFamily: FONTS.heading.semiBold,
    marginBottom: 4,
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    fontFamily: FONTS.body.regular,
  },
});