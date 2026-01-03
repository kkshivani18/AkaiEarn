import React from 'react';
import { Animated, StyleSheet, Text, View, Image } from 'react-native';
import { FONTS } from '../constants/fonts';

export const SplashScreen: React.FC = () => {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.8));

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* AE Icon */}
        <Image
          source={{uri:'https://akaiearn-app-images.s3.ap-south-1.amazonaws.com/splashscreen-images/AE_splash_icon.png'}}
          style={styles.icon}
          resizeMode="contain"
        />
        
        {/* App Name */}
        <Text style={styles.appName}>AkaiEarn</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  appName: {
    fontSize: 42,
    fontFamily: FONTS.heading.bold,
    color: '#E5383B',
    letterSpacing: -1,
  },
});