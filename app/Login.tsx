import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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

  const { onLogin, onGoogleLogin } = useAuth();

  // auth session for web
  WebBrowser.maybeCompleteAuthSession();

  // Google OAuth request
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.androidClientID,
    webClientId: process.env.webClientID,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type !== 'success') return;
      // Prefer idToken for backend verification if available
      const idToken = response.authentication?.idToken;
      if (!idToken) {
        Alert.alert('Google Sign-In', 'No idToken returned. Check your Google OAuth configuration (add openid scope).');
        return;
      }
      try {
        const result = await onGoogleLogin?.(idToken);
        if (result?.success) {
          onClose();
          // Navigate based on profile completion if backend returns it
          const needsProfile = result?.user?.profileCompleted === false || result?.profileCompleted === false;
          if (needsProfile) {
            router.replace('/profile-completion');
          } else {
            router.replace('/');
          }
        } else {
          Alert.alert('Google Sign-In Failed', result?.msg || result?.error || 'Could not sign in with Google');
        }
      } catch (e: any) {
        Alert.alert('Google Sign-In Failed', e?.message || 'Unexpected error during Google Sign-In');
      }
    };
    handleGoogleResponse();
  }, [response]);

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
        // If backend returns user/profileCompleted info, route accordingly.
        const needsProfile = result?.user?.profileCompleted === false || result?.profileCompleted === false;
        if (needsProfile) {
          router.replace('/profile-completion');
        } else {
          // adjust target route as appropriate for your app
          router.replace('/');
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

  const styles = createStyles(isDark);

  if (!visible) return null;

  return (
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

            <TouchableOpacity style={styles.forgotPassword}>
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
                onPress={() => promptAsync()}
                disabled={!request}
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
});



