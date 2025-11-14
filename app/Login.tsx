import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { authAPI } from '../services/api';

interface SignInModalProps {
  visible: boolean;
  onClose: () => void;
  onSwitchToSignUp?: () => void;
}

export const Login: React.FC<SignInModalProps> = ({
  visible,
  onClose,
  onSwitchToSignUp,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  const { onLogin, onGoogleLogin } = useAuth();
  const params = useLocalSearchParams();

  // check for reset token on component mount
  React.useEffect(() => {
    const token = params.token as string;
    if (token && visible) {
      setResetToken(token);
      setShowResetPassword(true);
      setShowForgotPassword(false);
    }
  }, [params.token, visible]);

  // auth session for web
  // WebBrowser.maybeCompleteAuthSession();

  // const ANDROID_ID = process.env.androidClientID || '';
  // const WEB_ID = process.env.webClientID || '';
  // const EXPO_ID = process.env.expoClientID || '';

  // // Google OAuth request (avoid undefined by using non-empty strings)
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   androidClientId: ANDROID_ID || 'MISSING_ANDROID_CLIENT_ID',
  //   webClientId: WEB_ID || 'MISSING_WEB_CLIENT_ID',
  //   clientId: EXPO_ID || 'MISSING_EXPO_CLIENT_ID',
  //   scopes: ['openid', 'profile', 'email'],
  // });

  // useEffect(() => {
  //   const handleGoogleResponse = async () => {
  //     if (response?.type !== 'success') return;
  //     // Prefer idToken for backend verification if available
  //     const idToken = response.authentication?.idToken;
  //     if (!idToken) {
  //       Alert.alert('Google Sign-In', 'No idToken returned. Check your Google OAuth configuration (add openid scope).');
  //       return;
  //     }
  //     try {
  //       const result = await onGoogleLogin?.(idToken);
  //       if (result?.success) {
  //         onClose();
  //         // Navigate based on profile completion if backend returns it
  //         const needsProfile = result?.user?.profileCompleted === false || result?.profileCompleted === false;
  //         if (needsProfile) {
  //           router.replace('/profile-completion');
  //         } else {
  //           router.replace('/');
  //         }
  //       } else {
  //         Alert.alert('Google Sign-In Failed', result?.msg || result?.error || 'Could not sign in with Google');
  //       }
  //     } catch (e: any) {
  //       Alert.alert('Google Sign-In Failed', e?.message || 'Unexpected error during Google Sign-In');
  //     }
  //   };
  //   handleGoogleResponse();
  // }, [response]);

  const handleLogin = async (): Promise<void> => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!onLogin) {
         Alert.alert('Login Failed', 'Login function not yet loaded. Try again in a moment.');
         return;
    }
    
    setLoading(true);
    
    try {
      const result = await onLogin(email, password); 
      if (result?.success) {
        onClose();
        // check if profile is completed
        const profileCompleted = result?.user?.profileCompleted || result?.profileCompleted;
        
        if (!profileCompleted) {
          // profile not completed, redirect to profile completion
          router.replace('/profile-completion');
        } else {
          // profile completed, redirect to main app
          router.replace('/(tabs)/offer');
        }
      } else {
        Alert.alert('Login Failed', result?.msg || result?.error || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Login Failed', (error as Error).message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!forgotPasswordEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const data = await authAPI.forgotPassword(forgotPasswordEmail);

      if (data.success) {
        Alert.alert(
          'Reset Link Sent! 📧',
          'If an account with that email exists, a password reset link has been sent. Please check your email and click the link to reset your password.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowForgotPassword(false);
                setForgotPasswordEmail('');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      let errorMessage = 'Network error. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

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

    setResetPasswordLoading(true);

    try {
      const data = await authAPI.resetPassword(resetToken, newPassword);

      if (data.success) {
        Alert.alert(
          'Password Reset Successful! ✅',
          'Your password has been reset successfully. You can now log in with your new password.',
          [
            {
              text: 'Login Now',
              onPress: () => {
                setShowResetPassword(false);
                setNewPassword('');
                setConfirmPassword('');
                setResetToken('');
                router.replace('/Login');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const styles = createStyles(isDark);

  if (!visible) return null;

  return (
    <>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={styles.container}
      >
        <View style={styles.mainContent}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.content}
          >
            <View style={styles.header}>
              <Text style={styles.appName}>Offer-Wall</Text>
              <Text style={styles.welcomeText}>Welcome back!</Text>
            </View>
            
            <Text style={styles.title}>Sign In</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={isDark ? '#888' : '#999'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={22} 
                  color={isDark ? '#888' : '#999'} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.forgotPassword} 
              onPress={() => setShowForgotPassword(true)}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                // onPress={() => {
                //   if (Platform.OS === 'android' && !ANDROID_ID && !EXPO_ID) {
                //     Alert.alert('Google Sign-In not configured', 'Set androidClientID (and optionally expoClientID) in .env');
                //     return;
                //   }
                //   if (Platform.OS === 'web' && !WEB_ID) {
                //     Alert.alert('Google Sign-In not configured', 'Set webClientID in .env');
                //     return;
                //   }
                //   promptAsync();
                // }}
                // disabled={!request || (Platform.OS === 'android' && !ANDROID_ID && !EXPO_ID) || (Platform.OS === 'web' && !WEB_ID)}
              >
                <AntDesign 
                  name="google" 
                  size={20} 
                  color={isDark ? "#fff" : "#DB4437"} 
                  style={styles.socialIcon} 
                />
                <Text style={styles.socialButtonText}>
                  Google
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => onSwitchToSignUp?.()}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </LinearGradient>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword && !showResetPassword}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.forgotPasswordModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity
                onPress={() => setShowForgotPassword(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={forgotPasswordEmail}
              onChangeText={setForgotPasswordEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />

            <TouchableOpacity
              style={[styles.modalButton, forgotPasswordLoading && styles.modalButtonDisabled]}
              onPress={handleForgotPassword}
              disabled={forgotPasswordLoading}
            >
              {forgotPasswordLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.modalButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        visible={showResetPassword}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResetPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.forgotPasswordModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set New Password</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowResetPassword(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  router.replace('/Login');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter your new password below. Make sure it's at least 6 characters long.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="New password"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoFocus
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Confirm new password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.modalButton, resetPasswordLoading && styles.modalButtonDisabled]}
              onPress={handleResetPassword}
              disabled={resetPasswordLoading}
            >
              {resetPasswordLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.modalButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  mainContent: {
    marginTop: 45,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 40,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 15,
    color: '#fff',
  },
  eyeIcon: {
    padding: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#60a5fa',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 18,
    width: "90%", 
    marginLeft: 17
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: isDark ? '#444' : '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: isDark ? '#888' : '#999',
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 18, 
  },
  socialButton: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#2c2c2e' : '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#3a3a3c' : '#e0e0e0',
    width: '100%', 
    alignSelf: 'stretch', 
  },
  socialIcon: {
    marginRight: 18,
  },
  socialButtonText: {
    color: isDark ? '#fff' : '#000',
    fontSize: 15,
    fontWeight: '500',
    marginHorizontal: 6
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerText: {
    color: isDark ? '#888' : '#666',
    fontSize: 14,
  },
  linkText: {
    color: isDark ? '#0a84ff' : '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  forgotPasswordModal: {
    backgroundColor: isDark ? '#1f2937' : 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDark ? 'white' : '#1f2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: isDark ? '#9ca3af' : '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f9fafb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb',
    color: isDark ? 'white' : '#1f2937',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});



