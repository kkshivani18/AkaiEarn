import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface SuccessPopupProps {
  visible: boolean;
  title?: string;
  message: string;
  onContinue: () => void;
}

export const SuccessPopup: React.FC<SuccessPopupProps> = ({
  visible,
  title = 'SUCCESS',
  message,
  onContinue,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinue}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <ImageBackground 
              source={require('../../assets/app-images/yellow_header.png')} 
              style={styles.headerImage} 
              resizeMode="stretch"
            >
              <Text style={styles.headerText}>{title}</Text>
            </ImageBackground>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.checkmarkCircle}>
                <Ionicons name="checkmark" size={48} color="#fff" />
              </View>
            </View>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <ImageBackground 
              source={require('../../assets/app-images/success_bt_effect.png')} 
              style={styles.buttonImage}
              resizeMode="contain"
            >
              <Text style={styles.buttonText}>CONTINUE</Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: '#3A3A3C',
    borderRadius: 24,
    borderWidth: 5,
    borderColor: '#FFB917',
    shadowColor: '#FFB917',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
    marginTop: 20,
  },
  headerContainer: {
    borderBottomWidth: 0,
    zIndex: 1,
  },
  headerImage: {
    width: '103%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: -10,
    marginLeft: -5,
    marginBottom: -10,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 3,
    shadowRadius: 4,
    elevation: 5,
  },
  headerText: {
    fontSize: 25,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
    marginBottom: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 5,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(58, 58, 80, 0.8)',
  },
  iconContainer: {
    marginBottom: 20,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: 15,
    paddingTop: 5,
    backgroundColor: 'rgba(58, 58, 80, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingBottom: 5,
  },
  buttonImage: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    marginBottom: 15,
  },
});
