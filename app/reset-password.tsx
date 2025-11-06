import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../services/api';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const token = params.token as string;
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      Alert.alert(
        'Invalid Link',
        'This password reset link is invalid or expired.',
        [{ text: 'OK', onPress: () => router.replace('/Login') }]
      );
    }
  }, [token]);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      const data = await authAPI.resetPassword(token, newPassword);

      if (data.success) {
        Alert.alert(
          'Password Reset Successful! ✅',
          'Your password has been reset successfully. You can now log in with your new password.',
          [
            {
              text: 'Login Now',
              onPress: () => router.replace('/Login')
            }
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.response?.status === 400) {
        errorMessage = 'Invalid or expired reset token. Please request a new password reset.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/Login');
  };

  if (!token) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Text style={styles.errorTitle}>Invalid Reset Link</Text>
            <Text style={styles.errorMessage}>
              This password reset link is invalid or expired. Please request a new password reset.
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleBackToLogin}>
              <Text style={styles.buttonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Reset Password</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={styles.title}>Set New Password</Text>
              <Text style={styles.subtitle}>
                Enter your new password below. Make sure it's at least 6 characters long.
              </Text>

              {/* New Password */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="New password"
                  placeholderTextColor="#888"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoFocus
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons 
                    name={showNewPassword ? 'eye-outline' : 'eye-off-outline'} 
                    size={22} 
                    color="#888" 
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#888"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} 
                    size={22} 
                    color="#888" 
                  />
                </TouchableOpacity>
              </View>

              {/* Reset Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity style={styles.linkButton} onPress={handleBackToLogin}>
                <Text style={styles.linkText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: 'white',
  },
  eyeIcon: {
    padding: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#60a5fa',
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
});
