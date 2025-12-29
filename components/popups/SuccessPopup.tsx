import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
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
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.headerText}>{title}</Text>
          </LinearGradient>

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
            <LinearGradient
              colors={['#4ADE80', '#22C55E']}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>CONTINUE</Text>
              <View style={styles.sparkles}>
                <Text style={styles.sparkle}>✦</Text>
                <Text style={[styles.sparkle, styles.sparkle2]}>✦</Text>
              </View>
            </LinearGradient>
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
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#FFA500',
    overflow: 'hidden',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#8B4513',
  },
  headerText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  content: {
    padding: 30,
    alignItems: 'center',
    minHeight: 150,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
  },
  buttonContainer: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#166534',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sparkles: {
    position: 'absolute',
    right: 15,
    flexDirection: 'row',
  },
  sparkle: {
    fontSize: 20,
    color: '#fff',
    marginLeft: 4,
  },
  sparkle2: {
    marginTop: -8,
  },
});
