import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { FONTS } from "../constants/fonts";
import { useUserStore } from '../stores/userStore';

export default function SignUpScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fallbackRegister = useUserStore(s => s.register);

  // snackbar state
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbarMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 2000);
  };

  const handleSignUp = async () => {
    // Client-side validation (snackbar for quick feedback)
    if (!email || !password || !confirmPassword) {
      showSnackbarMessage('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showSnackbarMessage('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await fallbackRegister(email, password); 
      if (result?.success) { 
        // Routing handled by _layout.tsx based on auth state
      } else {
        // Critical auth error - use Alert
        Alert.alert(
          'Registration Failed',
          result?.msg || 'We couldn\'t create your account. Please try again.',
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

  const styles = createStyles(isDark);

  return (
    <LinearGradient
      colors={['#0f172a', '#0b1220', '#07121a']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.screenContainer}>
          <View style={styles.imageSection}>
            <ImageBackground
              source={{ uri: 'https://akaiearn-app-images.s3.ap-south-1.amazonaws.com/onboarding/onboarding_page_img.png'}}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.formPanel}>
            <Text style={styles.questTitle}>SIGN UP</Text>
            
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
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

              <Text style={styles.stepLabel}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="xxxxxxxxxxxx"
                  placeholderTextColor="#666"
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
                    color="#333" 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'CREATING ACCOUNT' : 'CONTINUE TO QUEST'}</Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have a account ? </Text>
                <TouchableOpacity onPress={() => router.replace('/login' as any)}>
                  <Text style={styles.linkText}>Login Now</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
      {showSnackbar && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  flexContainer: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  imageSection: {
    height: '35%',
    minHeight: 200,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  formPanel: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 20,
  },
  questTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: FONTS.body.bold,
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
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
    marginBottom: 16,
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
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.body.bold,
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
    fontFamily: FONTS.body.semiBold,
    fontSize: 15,
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
