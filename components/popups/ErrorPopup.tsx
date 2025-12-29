import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface ErrorPopupProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export const ErrorPopup: React.FC<ErrorPopupProps> = ({
  visible,
  title = 'Alert',
  message,
  onClose,
}) => {
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
            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={40} color="#EF4444" />
            </View>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#DC2626', '#B91C1C']}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>CLOSE</Text>
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
    minHeight: 140,
  },
  warningContainer: {
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
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
    borderColor: '#7F1D1D',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
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
});
