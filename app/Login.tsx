import { AntDesign, Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from "expo-constants";
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme, ImageBackground } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { FONTS } from "../constants/fonts";

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
    
    console.log('Sign-In Result:', JSON.stringify(result, null, 2));
    
    const idToken = result.data?.idToken;
    
    console.log('ID Token:', idToken ? 'Received' : 'NOT RECEIVED');
    console.log('ID Token length:', idToken?.length);

    if (!idToken) {
      console.error('No ID token in result:', result);
      showSnackbarMessage('No ID token received from Google');
      return;
    }

    console.log('Google Sign-In successful, authenticating with backend...');

    // Send to your backend
    const authResult = await onGoogleLogin?.(idToken);

    if (authResult?.success) {
      console.log('Backend authentication successful');
      onClose();
      const needsProfile = authResult?.user?.profileCompleted === false;
      router.replace(needsProfile ? '/profile-completion' : '/(tabs)/offer');
    } else {
      console.error('Backend authentication failed:', authResult);
      showSnackbarMessage(authResult?.msg || 'Authentication failed');
    }
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    if (error.code === 'SIGN_IN_CANCELLED') {
      showSnackbarMessage('Sign-In cancelled');
    } else if (error.code === 'IN_PROGRESS') {
      showSnackbarMessage('Sign-In already in progress');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      showSnackbarMessage('Play Services not available');
    } else {
      showSnackbarMessage('Google Sign-In failed: ' + (error.message || 'Unknown error'));
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
    if (!email || !password) {
      showSnackbarMessage('Please fill in all fields');
      return;
    }

    if (!onLogin) {
         showSnackbarMessage('Login function not yet loaded. Try again in a moment.');
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
        showSnackbarMessage(result?.msg || result?.error || 'Invalid credentials');
      }
    } catch (error) {
      showSnackbarMessage((error as Error).message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
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
        showSnackbarMessage('Reset link sent! Check your email.');
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
      } else {
        showSnackbarMessage(data.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      // console.error('Forgot password error:', error);
      let errorMessage = 'Network error. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showSnackbarMessage(errorMessage);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async () => {
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
        showSnackbarMessage('Password reset successful! You can now log in.');
        setTimeout(() => {
          setShowResetPassword(false);
          setNewPassword('');
          setConfirmPassword('');
          setResetToken('');
          router.replace('/Login');
        }, 2000);
      } else {
        showSnackbarMessage(data.message || 'Failed to reset password');
      }
    } catch (error: any) {
      // console.error('Reset password error:', error);
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showSnackbarMessage(errorMessage);
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
                    <TouchableOpacity onPress={() => onSwitchToSignUp?.()}>
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



