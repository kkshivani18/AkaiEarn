import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from "../constants/fonts";

const { width, height } = Dimensions.get('window');

export const OnboardingSplash: React.FC<{ onContinue: () => void }> = ({
  onContinue,
}) => {
  const coinsFadeAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.timing(coinsFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 1000);

    setTimeout(() => {
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 2000);

    // Step 4: Fade in button
    setTimeout(() => {
      Animated.timing(buttonFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 2500);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/app-images/pixelated_effect.png')}
          style={styles.backgroundImage1}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(10, 11, 15, 0.7)', '#171717']}
          style={styles.gradientOverlay}
          locations={[0, 0.5, 1]}
        />
      </View>

      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: coinsFadeAnim,
          },
        ]}
      >
        <Image
          source={require('../assets/app-images/coins_fall_effect.png')}
          style={styles.backgroundImage2}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Text Content */}
      <Animated.View
        style={[styles.contentContainer, { opacity: textFadeAnim }]}
      >
        <Text style={styles.mainHeading}>
          Complete Quest, Earn Values
        </Text>
        <Text style={styles.mainHeading}>and Own Your Rewards</Text>
        <Text style={styles.subtitle}>
          Turn Meaningful assets to digital ownership
        </Text>
      </Animated.View>

      {/* Continue Button */}
      <Animated.View
        style={[styles.buttonContainer, { opacity: buttonFadeAnim }]}
      >
        <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
          <Text style={styles.continueButtonText}>CONTINUE</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b0f',
  },
  imageContainer: {
    marginTop: 40,
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundImage1: {
    width: '100%',
    height: '50%',
  },
  backgroundImage2: {
    width: '100%',
    height: '55%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%', 
  },
  contentContainer: {
    position: 'absolute',
    bottom: 200,
    width: '100%',
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  mainHeading: {
    marginTop: -5,
    fontSize: 20,
    fontFamily: FONTS.heading.bold,
    color: '#FFD700',
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.heading.semiBold,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 130,
    width: '100%',
    paddingHorizontal: 40,
  },
  continueButton: {
    backgroundColor: '#E5383B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000'
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.heading.bold,
    letterSpacing: 1.5,
  },
});