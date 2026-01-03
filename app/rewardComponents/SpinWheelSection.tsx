import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FONTS } from '../../constants/fonts';


interface SpinWheelSectionProps {
  onSpinPress?: () => void;
}

export const SpinWheelSection: React.FC<SpinWheelSectionProps> = ({ onSpinPress }) => {
  const handleSpinPress = () => {
    console.log('Spin wheel pressed');
    router.push('/rewardComponents/spinwheelComponents/spinwheelPage');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#404399', '#CE5EE8', '#F08DC3', '#CE5EE8', '#404399']}
        locations={[0, 0.19, 0.52, 0.82, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientContainer}
      >
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>The wheel of joy awaits</Text>
            <Text style={styles.subtitle}>
              Give the Wheel Whirl{'\n'}Every 24hrs
            </Text>
            
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleSpinPress}
              style={styles.buttonWrapper}
            >
              <LinearGradient
                colors={['#D9D9D9', '#ECCF90']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Spin now</Text>
                  <Ionicons name="arrow-forward" size={12} color="#000" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      <View style={styles.imageContainer} pointerEvents="none">
        <Image
          source={require('../../assets/app-images/spinwheel.png')}
          style={styles.wheelImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: -30, 
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
    justifyContent: 'flex-end', 
    paddingHorizontal: 20,
    height: '100%',
  },
  textContainer: {
    width: 200,
    justifyContent: 'center',
    alignItems: 'center', 
    zIndex: 3,
    paddingLeft: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  buttonWrapper: {
    alignSelf: 'center',
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
    left: -10,
    top: -30,
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  wheelImage: {
    width: '100%',
    height: '100%',
  },
});
