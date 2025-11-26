import React, { useState, useEffect } from 'react';
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
import { Ionicons, AntDesign, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser'; 
import * as Google from 'expo-auth-session/providers/google';

interface SignUpModalProps {
  visible: boolean;
  onClose: () => void;
  onSwitchToSignIn: () => void; 
}

export const SignUp: React.FC<SignUpModalProps> = ({
  visible,
  onClose,
  onSwitchToSignIn,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { onRegister, onGoogleLogin } = useAuth();
  const router = useRouter();

  // auth session for web
  // WebBrowser.maybeCompleteAuthSession();

  // const ANDROID_ID = process.env.androidClientID;
  // const WEB_ID = process.env.webClientID
  // const EXPO_ID = process.env.expoClientID || '';
  
    // Google OAuth request
    // const [request, response, promptAsync] = Google.useAuthRequest({
    //   androidClientId: ANDROID_ID,
    //   webClientId: WEB_ID,
    //   scopes: ['openid', 'profile', 'email'],
    // });

  // snackbar state
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbarMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 2000);
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      showSnackbarMessage('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showSnackbarMessage('Passwords do not match');
      return;
    }
    
    if (!onRegister) {
      showSnackbarMessage('Registration function not yet loaded. Try again in a moment.');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await onRegister(email, password); 
      console.log('SignUp result:', result);
      if (result?.success) { 
        onClose();
        router.replace('/profile-completion');
      } else {
        showSnackbarMessage(result?.error || result?.msg || 'Failed to create account');
      }
    } catch (error) {
      showSnackbarMessage((error as Error).message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => { 
  //   const handleGoogleResponse = async () => {
  //     if (response?.type !== 'success') return;
      
  //     const idToken = response.authentication?.idToken;
  //     if (!idToken) {
  //       Alert.alert('Google Sign-In', 'No idToken returned. Check configuration (add openid scope).');
  //       return;
  //     }
  //     try {
  //       // Use the onGoogleLogin function from AuthContext
  //       const result = await onGoogleLogin?.(idToken);
  //       if (result?.success) {
  //         onClose();
  //         // Navigate based on profile completion flag from the backend
  //         const needsProfile = result?.user?.profileCompleted === false || result?.profileCompleted === false;
  //         if (needsProfile) {
  //           router.replace('/profile-completion');
  //         } else {
  //           router.replace('/');
  //         }
  //       } else {
  //         Alert.alert('Google Sign-In Failed', result?.msg || result?.error || 'Could not sign up/in with Google');
  //       }
  //     } catch (e: any) {
  //       Alert.alert('Google Sign-In Failed', e?.message || 'Unexpected error during Google Sign-In');
  //     }
  //   };
  //   handleGoogleResponse();
  // }, [response])

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
              <Text style={styles.welcomeText}>Join us today!</Text>
            </View>
            
            <Text style={styles.title}>Create Account</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#888"
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
                  color="#888" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
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

            <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
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
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={onSwitchToSignIn}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
        {showSnackbar && (
          <View style={styles.snackbar}>
            <Text style={styles.snackbarText}>{snackbarMessage}</Text>
          </View>
        )}
    </LinearGradient>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    marginTop: 25,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: -14,
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
    marginBottom: 20,
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
    fontWeight: '500',
  },
});
