import { AntDesign, Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { FONTS } from "../constants/fonts";
import { authAPI } from '../services/api';
import { useUserStore } from '../stores/userStore';

interface SignInModalProps {
  visible: boolean;
  onClose: () => void;
}

export const Login: React.FC<SignInModalProps> = ({
  visible,
  onClose,
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
  const fallbackLogin = useUserStore(s => s.login);
  const fallbackGoogleLogin = useUserStore(s => s.loginWithGoogle);
  const setAuthMode = useUserStore(s => s.setAuthMode);
  const params = useLocalSearchParams();

  useEffect(() => {
    const configureGoogleSignIn = async () => {
      try {
        await GoogleSignin.configure({
          webClientId: '767073531304-4ippqgs57d13jac4u9e1fms99ao155ve.apps.googleusercontent.com',
          offlineAccess: true,
          scopes: ['profile', 'email'],
        });
        console.log('Google Sign-In configured successfully');
      } catch (error) {
        console.error('Failed to configure Google Sign-In:', error);
      }
    };

    configureGoogleSignIn();
  }, []);

  // check for reset token on component mount
  useEffect(() => {
    const token = params.token as string;
    if (token && visible) {
      setResetToken(token);
      setShowResetPassword(true);
      setShowForgotPassword(false);
    }
  }, [params.token, visible]);
  
  // auth session for web
  WebBrowser.maybeCompleteAuthSession();

  const handleGoogleSignIn = async () => {
    try {
      console.log('Checking Play Services...');
      await GoogleSignin.hasPlayServices();
      
      console.log('Starting Google Sign-In...');
      const result = await GoogleSignin.signIn();
      
      const idToken = result.data?.idToken;

      if (!idToken) {
        console.error('No ID token in result:', result);
        Alert.alert('Sign In Failed', 'No ID token received from Google. Please try again.');
        return;
      }

      console.log('Google Sign-In successful, authenticating with backend...');
      const authResult = await fallbackGoogleLogin(idToken);

      if (authResult?.success) {
        console.log('Backend authentication successful');
        onClose();
      } else {
        // Critical auth error - use Alert
        Alert.alert(
          'Sign In Failed',
          authResult?.msg || 'Authentication failed. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      
      // Handle Google-specific errors
      if (error.code === 'SIGN_IN_CANCELLED') {
        // User cancelled - don't show error, just return silently
        return;
      } else if (error.code === 'IN_PROGRESS') {
        // Already in progress - don't show error
        return;
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        Alert.alert(
          'Google Play Services Required',
          'Google Play Services is not available. Please update or install it to continue.',
          [{ text: 'OK' }]
        );
      } else {
        // Other errors - show Alert
        Alert.alert(
          'Sign In Failed',
          error.message || 'Google sign-in failed. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // snackbar state
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbarMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
  };

  const handleLogin = async (): Promise<void> => {
    // Client-side validation (snackbar for quick feedback)
    if (!email || !password) {
      showSnackbarMessage('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await fallbackLogin(email, password); 
      if (result?.success) {
        onClose();
        // Routing handled by _layout.tsx based on auth state
      } else {
        // Critical auth error - use Alert
        Alert.alert(
          'Sign In Failed',
          result?.msg || 'Unable to sign in. Please check your credentials and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Unexpected error - use Alert
      Alert.alert(
        'Error',
        (error as Error).message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // Client-side validation (snackbar)
    if (!forgotPasswordEmail) {
      showSnackbarMessage('Please enter your email address');
      return;
    }

    if (!forgotPasswordEmail.includes('@')) {
      showSnackbarMessage('Please enter a valid email address');
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const data = await authAPI.forgotPassword(forgotPasswordEmail);

      if (data.success) {
        // Success - use snackbar
        showSnackbarMessage('Reset link sent! Check your email.');
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
      } else {
        // API error - use Alert
        Alert.alert(
          'Error',
          data.message || 'Failed to send reset email. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      // Network/API error - use Alert
      let errorMessage = 'Network error. Please check your connection and try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async () => {
    // Client-side validation (snackbar)
    if (!newPassword || !confirmPassword) {
      showSnackbarMessage('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      showSnackbarMessage('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      showSnackbarMessage('Passwords do not match');
      return;
    }

    setResetPasswordLoading(true);

    try {
      const data = await authAPI.resetPassword(resetToken, newPassword);

      if (data.success) {
        // Success - use snackbar
        showSnackbarMessage('Password reset successful! You can now log in.');
        setTimeout(() => {
          setShowResetPassword(false);
          setNewPassword('');
          setConfirmPassword('');
          setResetToken('');
          router.replace('/Login');
        }, 2000);
      } else {
        // API error - use Alert
        Alert.alert(
          'Error',
          data.message || 'Failed to reset password. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      // Network/API error - use Alert
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const styles = createStyles(isDark);

  if (!visible) return null;

  return (
    <>
      <LinearGradient
        colors={['#0f172a', '#0b1220', '#07121a']}
        style={styles.container}
      >
        <View style={styles.flexContainer}>
          <View style={styles.screenContainer}>
            <View style={styles.imageSection}>
              <ImageBackground
                source={{uri: 'https://akaiearn-app-images.s3.ap-south-1.amazonaws.com/onboarding/onboarding_page_img.png'}}
                style={styles.backgroundImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.formPanel}>
              <Text style={styles.questTitle}>SIGN IN</Text>
              
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
              >
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.stepLabel}>Enter Your Email Address</Text>
                  <TextInput
                    style={styles.stepInput}
                    placeholder="xyz@gmail.com"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Text style={styles.stepLabel}>Enter Your Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="xxxxxxxxxxxx"
                      placeholderTextColor="#666"
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
                        color="#333" 
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={styles.forgotPassword}
                    onPress={() => setShowForgotPassword(true)}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? 'SIGNING IN' : 'SIGN IN'}</Text>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>Or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleSignIn}
                  >
                    <AntDesign 
                      name="google" 
                      size={20} 
                      color="#333" 
                      style={styles.googleIcon} 
                    /><Text style={styles.googleButtonText}>Continue with Google</Text>
                  </TouchableOpacity>

                  <View style={styles.footer}>
                    <Text style={styles.footerText}>New To AkaiEarn ? </Text>
                    <TouchableOpacity onPress={() => setAuthMode('signup')}>
                      <Text style={styles.linkText}>Register Now</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* forgot password */}
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
      {showSnackbar && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </View>
      )}
    </>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  flexContainer: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  imageSection: {
    flex: 1,
    minHeight: '30%',
    maxHeight: '35%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  formPanel: {
    backgroundColor: '#1F1F1F',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    minHeight: '65%',
    maxHeight: '70%',
  },
  questTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: FONTS.body.bold,
    textAlign: 'center',
    marginBottom: 20,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  stepLabel: {
    color: 'white',
    fontSize: 12,
    fontFamily: FONTS.body.semiBold,
    marginBottom: 8,
    marginTop: 4,
  },
  stepInput: {
    backgroundColor: '#FFD700',
    color: '#333',
    padding: 14,
    borderRadius: 8,
    fontSize: 15,
    fontFamily: FONTS.body.semiBold,
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 8,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    fontFamily: FONTS.body.semiBold,
    color: '#333',
  },
  eyeIcon: {
    padding: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 15,
    marginTop: -6
  },
  forgotPasswordText: {
    color: '#FFD700',
    fontSize: 12,
    fontFamily: FONTS.body.semiBold,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.body.bold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    marginHorizontal: 12,
    color: 'white',
    fontSize: 12,
    fontFamily: FONTS.body.semiBold,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  googleIcon: {
    marginRight: 8,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 14,
    fontFamily: FONTS.body.semiBold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    color: '#888',
    fontSize: 15,
    fontFamily: FONTS.body.semiBold,
  },
  linkText: {
    color: '#FFD700',
    fontSize: 15,
    fontFamily: FONTS.body.semiBold,
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
    fontFamily: FONTS.body.bold,
    color: isDark ? 'white' : '#1f2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: isDark ? '#9ca3af' : '#6b7280',
    fontFamily: FONTS.body.semiBold,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f9fafb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: FONTS.body.semiBold,
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
    fontFamily: FONTS.body.semiBold,
  },
  // snackbar styles
  snackbar: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  snackbarText: {
    color: 'white',
    fontSize: 14,
    fontFamily: FONTS.body.semiBold,
  },
});



