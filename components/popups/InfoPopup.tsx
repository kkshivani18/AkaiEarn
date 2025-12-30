import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, ImageSourcePropType, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface InfoPopupButton {
  text: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  backgroundImage?: ImageSourcePropType;
}

interface InfoPopupProps {
  visible: boolean;
  title?: string;
  message: string;
  buttons: InfoPopupButton[];
  onClose?: () => void;
  headerImage?: ImageSourcePropType;
}

export const InfoPopup: React.FC<InfoPopupProps> = ({
  visible,
  title = 'QUEST LOG',
  message,
  buttons,
  onClose,
  headerImage = require('../../assets/app-images/yellow_header.png'),
}) => {
  // Add default background images to buttons based on variant
  const buttonsWithDefaults = buttons.map(button => ({
    ...button,
    backgroundImage: button.backgroundImage || 
      (button.variant === 'secondary' 
        ? require('../../assets/app-images/error_bt_effect.png')
        : require('../../assets/app-images/success_bt_effect.png'))
  }));
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerContainer}>
            {headerImage ? (
              <ImageBackground source={headerImage} style={styles.headerImage} resizeMode="stretch">
                 <Text style={styles.headerText}>{title}</Text>
              </ImageBackground>
            ) : (
              <LinearGradient
                colors={['#F3A459', '#F5BE6E']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.headerText}>{title}</Text>
              </LinearGradient>
            )}
          </View>

          {/* Content with Glassmorphism */}
          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {buttonsWithDefaults.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={styles.buttonWrapper}
                onPress={button.onPress}
                activeOpacity={0.8}
              >
                <ImageBackground 
                  source={button.backgroundImage} 
                  style={styles.buttonImage}
                  resizeMode="contain"
                >
                  <Text style={[styles.buttonText, styles.buttonTextWithImage]}>{button.text}</Text>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
    // Neobrutalism shadow effect
    shadowColor: '#FFB917',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
    marginTop: 20, 
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
    // Add shadow to header image
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonImage: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonTextWithImage: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  headerContainer: {
    borderBottomWidth: 0,
    zIndex: 1,
  },
  header: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 25,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    // Text stroke effect
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
    // Glassmorphism effect
    backgroundColor: 'rgba(58, 58, 80, 0.8)',
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 5,
    gap: 10,
    backgroundColor: 'rgba(58, 58, 80, 0.8)',
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderRadius: 20,
    paddingBottom: -15
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonShadow: {
    // Neobrutalism shadow
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 3,
    shadowRadius: 0,
    elevation: 0,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#000',
    position: 'relative',
    minHeight: 58,
    // Neobrutalism offset
    transform: [{ translateX: -2 }, { translateY: -2 }],
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