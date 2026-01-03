import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/fonts';

interface LootboxSectionProps {
  onClaimPress?: () => void;
}

export const LootboxSection: React.FC<LootboxSectionProps> = ({ onClaimPress }) => {
  const handleClaimPress = () => {
    console.log('Claim lootbox pressed');
    if (onClaimPress) {
      onClaimPress();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#D068FC', '#AA4CF0', '#D1CE21']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradientContainer}
      >
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Harvest Lootboxes</Text>
            <Text style={styles.subtitle}>
              Crack open the{'\n'}chest for rare loot
            </Text>
            
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleClaimPress}
              style={styles.buttonWrapper}
            >
              <LinearGradient
                colors={['#D9D9D9', '#ECCF90']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Claim now</Text>
                  <Ionicons name="arrow-forward" size={12} color="#000" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      <View style={styles.imageContainer} pointerEvents="none">
        <Image
          source={require('../../assets/app-images/lootbox_chest.png')}
          style={styles.chestImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 25,
    marginBottom: 60,
    width: 340,
    alignSelf: 'flex-start',
    position: 'relative',
  },
  gradientContainer: {
    borderRadius: 20,
    height: 120,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: '100%',
  },
  textContainer: {
    width: 160,
    justifyContent: 'center',
    zIndex: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 16,
    opacity: 0.95,
  },
  buttonWrapper: {
    alignSelf: 'flex-start',
    borderRadius: 16,
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
    paddingVertical: 8,
    borderRadius: 14,
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
    right: -60,
    top: -100,
    width: 290,
    height: 290,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  chestImage: {
    width: '100%',
    height: '100%',
  },
});
