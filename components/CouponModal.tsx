import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Alert, Animated, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Coupon } from '../types/Offer'
import { FONTS } from "../constants/fonts";

const CopyIcon = () => (
  <Svg style={styles.icon} fill="none" viewBox="0 0 24 24" stroke="white">
    <Path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
    />
  </Svg>
);

// --- Helper Component: 3D Button ---
const Button3D = ({ onPress, children }: { onPress: () => void; children: React.ReactNode }) => {
  const anim = useRef(new Animated.Value(0)).current;
  
  const onPressIn = () => 
    Animated.timing(anim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  
  const onPressOut = () => 
    Animated.timing(anim, { toValue: 0, duration: 100, useNativeDriver: true }).start();

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 3] });
  const shadowOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] });

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.buttonShadow, { shadowOpacity }]} />
      <Animated.View style={[styles.buttonBody, { transform: [{ translateY }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// --- Types ---
interface CouponModalProps {
  visible: boolean;
  onClose: () => void;
  coupon: Coupon | null;
}

// --- Main Coupon Modal Component ---
const CouponModal = ({ visible, onClose, coupon }: CouponModalProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible]);

  const handleCopyCode = () => {
    if (coupon?.couponCode) {
      // In a real app, you'd use Clipboard.setString(coupon.couponCode)
      Alert.alert("Code Copied!", `Coupon code "${coupon.couponCode}" has been copied to clipboard.`);
    }
  };

  if (!visible || !coupon) {
    return null;
  }

  return (
    <Modal visible={visible} transparent={true} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <Animated.View style={[styles.glassCard, { transform: [{ scale: fadeAnim }] }]}>
          <View style={styles.auroraBg} />

          <View style={styles.contentContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            
            {/* Top Section */}
            <View style={styles.topSection}>
              <View style={styles.logoContainer}>
                {coupon.imageLink ? (
                  <Image source={{ uri: coupon.imageLink }} style={styles.logoImage} />
                ) : (
                  <Text style={styles.logoPlaceholder}>{coupon.company.charAt(0)}</Text>
                )}
              </View>
              <Text style={styles.companyName}>{coupon.company}</Text>
              <Text style={styles.offerType}>Exclusive Offer for You</Text>
            </View>

            {/* Separator */}
            <View style={styles.separator}>
              <View style={styles.cutoutLeft} />
              <View style={styles.dashedLine} />
              <View style={styles.cutoutRight} />
            </View>
            
            {/* Bottom Section */}
            <View style={styles.bottomSection}>
              <Text style={styles.codeLabel}>Your Coupon Code</Text>
              <Text style={styles.couponCode}>{coupon.couponCode || 'GET50'}</Text>
              
              <Button3D onPress={handleCopyCode}>
                <LinearGradient colors={['#EF4444', '#A01D5F']} style={styles.copyButtonGradient}>
                  <CopyIcon />
                  <Text style={styles.copyButtonText}>Copy Code</Text>
                </LinearGradient>
              </Button3D>
              
              <Text style={styles.expiryDate}>
                Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default CouponModal;

// --- Stylesheet ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  glassCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  auroraBg: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    backgroundColor: '#1E1B26', // Fallback
    // This is a simplified aurora. A real implementation might use Skia or a more complex gradient.
  },
  contentContainer: {
    zIndex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontFamily: FONTS.body.bold,
  },
  topSection: {
    alignItems: 'center',
    padding: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  logoPlaceholder: {
    fontSize: 40,
    fontFamily: FONTS.body.bold,
    color: 'white',
  },
  companyName: {
    fontSize: 28,
    fontFamily: FONTS.body.bold,
    color: 'white',
  },
  offerType: {
    fontSize: 16,
    fontFamily: FONTS.body.bold,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  separator: {
    height: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cutoutLeft: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0a0a10',
    marginLeft: -20,
  },
  cutoutRight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0a0a10',
    marginRight: -20,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderBottomWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  bottomSection: {
    alignItems: 'center',
    padding: 32,
  },
  codeLabel: {
    fontSize: 16,
    fontFamily: FONTS.body.bold,
    color: 'rgba(255,255,255,0.7)', 
    marginBottom: 8,
  },
  couponCode: {
    fontSize: 48,
    fontFamily: FONTS.body.bold,
    color: 'white',
    letterSpacing: 2,
    marginBottom: 24,
  },
  copyButtonGradient: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyButtonText: {
    color: 'white',
    fontSize: 20,
    fontFamily: FONTS.body.bold,
    marginLeft: 12,
  },
  buttonShadow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#4a044e',
    shadowColor: '#be185d',
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 5 },
  },
  buttonBody: {
    width: '100%',
    borderRadius: 16,
  },
  expiryDate: {
    fontSize: 14,
    fontFamily: FONTS.body.bold,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 24,
  },
  icon: {
    width: 24,
    height: 24,
  },
});