import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, referralAPI } from '../services/api';
import { FONTS } from "../constants/fonts";

const ProfileCompletionScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [fullName, setFullName] = React.useState<string>('');
  const [occupation, setOccupation] = React.useState<string | null>(null);
  const [gender, setGender] = React.useState<string>('');
  const [dobDate, setDobDate] = React.useState<Date | null>(null);
  const [showDobPicker, setShowDobPicker] = React.useState<boolean>(false);
  const [referralCode, setReferralCode] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [location, setLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [referralVerificationStatus, setReferralVerificationStatus] = React.useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
  const [referralVerificationMessage, setReferralVerificationMessage] = React.useState<string>('');
  const [isReferralVerified, setIsReferralVerified] = React.useState<boolean>(false);
  const [showSnackbar, setShowSnackbar] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

  const genderItems = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
    { label: 'Prefer not to say', value: 'prefer-not-to-say' },
  ];

  // Format Date as DD/MM/YYYY 
  const formatDateDDMMYYYY = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  
  const { onProfileCompleted } = useAuth();

  const handleLocationAccess = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'To use this feature, please enable location services in your device settings.'
        );
        return;
      }
      
      // get current location
      const currentLocation = await Location.getCurrentPositionAsync({});
      const userLocation = {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude
      };
      
      setLocation(userLocation);
      Alert.alert('Permission Granted', 'Location access has been enabled.');
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get location. Please try again.');
    }
  };

  // Add referral verification function
  const verifyReferralCode = async () => {
    const trimmedCode = referralCode.trim();
    
    if (!trimmedCode) {
      setReferralVerificationStatus('invalid');
      setReferralVerificationMessage('Please enter a referral code');
      return;
    }

    // Basic format validation
    const referralCodeRegex = /^[a-zA-Z0-9]{6,12}$/;
    if (!referralCodeRegex.test(trimmedCode)) {
      setReferralVerificationStatus('invalid');
      setReferralVerificationMessage('Invalid format (6-12 alphanumeric characters)');
      return;
    }

    setReferralVerificationStatus('verifying');
    setReferralVerificationMessage('Verifying...');

    try {
      const result = await referralAPI.useReferralCode(trimmedCode);
      
      setReferralVerificationStatus('valid');
      const message = result.coinsAwarded 
        ? `Valid! You and your referrer will each earn 100 points!`
        : `Valid referral code!`;
      setReferralVerificationMessage(message);
      setIsReferralVerified(true);
      
      if (result.coinsAwarded) {
        showSnackbarMessage(`Referral Success! You and your referrer each earned 100 points!`);
      }
      
    } catch (error: any) {
      console.error('Referral verification error:', error);
      
      let errorMessage = 'Invalid referral code';
      if (error.response?.status === 400) {
        errorMessage = 'Cannot use your own referral code';
      } else if (error.response?.status === 404) {
        errorMessage = 'Referral code not found';
      } else if (error.response?.status === 409) {
        errorMessage = 'Referral already used';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setReferralVerificationStatus('invalid');
      setReferralVerificationMessage(errorMessage);
      setIsReferralVerified(false);
    }
  };

  const handleReferralCodeChange = (text: string) => {
    setReferralCode(text);
    if (referralVerificationStatus !== 'idle') {
      setReferralVerificationStatus('idle');
      setReferralVerificationMessage('');
      setIsReferralVerified(false);
    }
  };

  const showSnackbarMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
  };

  const handleNextStep = () => {
    // Validate current step before moving forward
    if (currentStep === 1) {
      if (!fullName.trim()) {
        Alert.alert('Error', 'Please enter your full name');
        return;
      }
      const nameWords = fullName.trim().split(/\s+/);
      if (nameWords.length < 2) {
        Alert.alert('Error', 'Please enter your full name (first and last name)');
        return;
      }
      if (nameWords.some(word => word.length < 2 || word.length > 50)) {
        Alert.alert('Error', 'Each name part must be 2-50 characters long');
        return;
      }
      if (!occupation) {
        Alert.alert('Error', 'Please select your occupation');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!gender) {
        Alert.alert('Error', 'Please select your gender');
        return;
      }
      if (!dobDate) {
        Alert.alert('Error', 'Please select your date of birth');
        return;
      }
      const today = new Date();
      if (dobDate > today) {
        Alert.alert('Error', 'Date of birth cannot be in the future');
        return;
      }
      const age = today.getFullYear() - dobDate.getFullYear();
      if (age < 13 || age > 120) {
        Alert.alert('Error', 'Please enter a valid date of birth (age must be between 13 and 120 years)');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    console.log('Profile completion with data:', {
      fullName,
      occupation,
      gender,
      dobDate,
      referralCode,
      location,
      isReferralVerified
    });
    
    if (referralCode.trim() && !isReferralVerified) {
      Alert.alert('Referral Code Not Verified', 'Please verify your referral code before proceeding, or leave it empty.');
      return;
    }
    
    setLoading(true);
    
    try {
      const firstName = fullName.trim().split(/\s+/)[0];
      const profileData = {
        name: fullName.trim(), 
        firstName: firstName, 
        occupation: occupation || '',
        dob: dobDate ? dobDate.toISOString().split('T')[0] : '',
        gender: gender.toLowerCase(),
        location: location || { lat: 0, lng: 0 } 
      };
      
      console.log('Sending profile data to /api/auth/submit-form:', profileData);
      const result = await authAPI.updateProfile(profileData);
      console.log('✅ Profile update result:', result);

      if (result.success && result.profileCompleted) {
        if (onProfileCompleted) {
          await onProfileCompleted();
        }
        
        showSnackbarMessage('Profile Completed! You can now access all features.');
        setTimeout(() => {
          router.replace('/(tabs)/offer');
        }, 2000);
      } else {
        showSnackbarMessage('Profile Saved.');
        setTimeout(() => {
          router.replace('/(tabs)/offer');
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('❌ Profile completion error:', error);
      
      let errorMessage = 'Failed to update profile';
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = errors.map((err: any) => err.msg).join(', ');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('timeout')) {
        errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackNavigation = async () => {
    try {
      router.replace('/Login');
    } catch (error) {
      console.error('Error during back navigation:', error);
      router.replace('/Login');
    }
  };

  const occupationItems = [
    { label: 'Student', value: 'student' },
    { label: 'Developer', value: 'developer' },
    { label: 'Teacher', value: 'teacher' },
    { label: 'Designer', value: 'designer' },
    { label: 'Other', value: 'other' },
  ];

  const pickerSelectStyles = StyleSheet.create({
    inputIOS: { 
      backgroundColor: '#FFD700',
      color: '#333',
      padding: 14,
      borderRadius: 8,
      fontSize: 15,
      fontFamily: FONTS.body.semiBold,
      marginBottom: 16,
    },
    inputAndroid: { 
      backgroundColor: '#FFD700',
      color: '#333',
      padding: 14,
      borderRadius: 8,
      fontSize: 15,
      fontFamily: FONTS.body.semiBold,
      marginBottom: 16,
    },
    placeholder: { color: '#666' },
    iconContainer: {
      top: 18,
      right: 15,
    },
  });
 
  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <>
          <Text style={styles.stepLabel}>FULL NAME</Text>
          <TextInput
            style={styles.stepInput}
            placeholder="Full Name"
            placeholderTextColor="#666"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <Text style={styles.stepLabel}>OCCUPATION</Text>
          <RNPickerSelect
            onValueChange={(value) => setOccupation(value)}
            items={occupationItems}
            style={pickerSelectStyles}
            placeholder={{ label: 'WriteHere', value: null }}
            useNativeAndroidPickerStyle={false}
            value={occupation}
            Icon={() => (
              <Ionicons name="chevron-down" size={20} color="#666" />
            )}
          />
        </>
      );
    } else if (currentStep === 2) {
      return (
        <>
          <Text style={styles.stepLabel}>GENDER</Text>
          <View style={styles.genderContainer}>
            <View style={styles.genderInputWrapper}>
              <RNPickerSelect
                onValueChange={(value) => setGender(value)}
                items={genderItems}
                style={pickerSelectStyles}
                placeholder={{ label: 'Select', value: '' }}
                useNativeAndroidPickerStyle={false}
                value={gender}
                Icon={() => (
                  <Ionicons name="chevron-down" size={20} color="#666" />
                )}
              />
            </View>
            <View style={styles.genderButtons}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'male' && styles.genderButtonSelected
                ]}
                onPress={() => setGender('male')}
              >
                <Ionicons name="male" size={20} color={gender === 'male' ? '#007AFF' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'female' && styles.genderButtonSelected
                ]}
                onPress={() => setGender('female')}
              >
                <Ionicons name="female" size={20} color={gender === 'female' ? '#007AFF' : '#666'} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.stepLabel}>DATE OF BIRTH</Text>
          <TouchableOpacity
            style={styles.stepInput}
            activeOpacity={0.8}
            onPress={() => setShowDobPicker(true)}
          >
            <Text style={{ color: dobDate ? '#333' : '#666' }}>
              {dobDate ? formatDateDDMMYYYY(dobDate) : 'DD/MM/YYYY'}
            </Text>
          </TouchableOpacity>
          {showDobPicker && (
            <DateTimePicker
              value={dobDate || new Date(new Date().getFullYear() - 20, 0, 1)}
              mode="date"
              maximumDate={new Date()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_event, selectedDate) => {
                setShowDobPicker(false);
                if (selectedDate) setDobDate(selectedDate);
              }}
            />
          )}
        </>
      );
    } else if (currentStep === 3) {
      return (
        <>
          <Text style={styles.stepLabel}>LOCATION</Text>
          <TouchableOpacity
            style={styles.stepInput}
            activeOpacity={0.8}
            onPress={handleLocationAccess}
          >
            <Text style={{ color: location ? '#333' : '#666', flex: 1 }}>
              {location ? 'Location Shared' : 'Share Your Current Location'}
            </Text>
            <Ionicons name="location" size={18} color="#666" />
          </TouchableOpacity>

          <Text style={styles.stepLabel}>REFFERAL CODE</Text>
          <View style={styles.referralContainer}>
            <TextInput
              style={[
                styles.referralInput,
                referralVerificationStatus === 'valid' && styles.inputValid,
                referralVerificationStatus === 'invalid' && styles.inputInvalid
              ]}
              placeholder="Paste Here............"
              placeholderTextColor="#666"
              value={referralCode}
              onChangeText={handleReferralCodeChange}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isReferralVerified}
            />
            <TouchableOpacity
              style={[
                styles.verifyButton,
                referralVerificationStatus === 'verifying' && styles.verifyButtonDisabled,
                referralVerificationStatus === 'valid' && styles.verifyButtonValid,
                isReferralVerified && styles.verifyButtonDisabled
              ]}
              onPress={verifyReferralCode}
              disabled={referralVerificationStatus === 'verifying' || isReferralVerified || !referralCode.trim()}
            >
              {referralVerificationStatus === 'verifying' ? (
                <ActivityIndicator size="small" color="white" />
              ) : referralVerificationStatus === 'valid' ? (
                <Ionicons name="checkmark" size={16} color="white" />
              ) : (
                <Text style={styles.verifyButtonText}>VERIFY</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Verification status message */}
          {referralVerificationMessage && (
            <View style={[
              styles.verificationMessage,
              referralVerificationStatus === 'valid' && styles.verificationMessageValid,
              referralVerificationStatus === 'invalid' && styles.verificationMessageInvalid
            ]}>
              <Ionicons 
                name={
                  referralVerificationStatus === 'valid' ? 'checkmark-circle' :
                  referralVerificationStatus === 'invalid' ? 'alert-circle' : 'information-circle'
                } 
                size={14} 
                color={
                  referralVerificationStatus === 'valid' ? '#10B981' :
                  referralVerificationStatus === 'invalid' ? '#EF4444' : '#3B82F6'
                } 
              />
              <Text style={[
                styles.verificationMessageText,
                referralVerificationStatus === 'valid' && styles.verificationMessageTextValid,
                referralVerificationStatus === 'invalid' && styles.verificationMessageTextInvalid
              ]}>
                {referralVerificationMessage}
              </Text>
            </View>
          )}
        </>
      );
    }
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#0b1220', '#07121a']}
      style={styles.container}
    >
      <SafeAreaView style={styles.flexContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flexContainer}
        >
          <View style={styles.screenContainer}>
            <View style={styles.imageSection}>
              <Image
                source={{ uri: 'https://akaiearn-app-images.s3.ap-south-1.amazonaws.com/onboarding/onboarding_page_img.png'}}
                style={styles.backgroundImage}
                resizeMode="cover"
              />
            </View>

            {/* Form Panel Section */}
            <View style={styles.formPanel}>
              <Text style={styles.questTitle}>QUEST: ABOUT YOU</Text>
              
              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                <View style={styles.progressCrystal}>
                  <Ionicons name="diamond" size={24} color="#007AFF" />
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${(currentStep / 3) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
                <Text style={styles.progressText}>PROGRESS: {currentStep}/3</Text>
              </View>

              <ScrollView 
                contentContainerStyle={styles.stepContent}
                showsVerticalScrollIndicator={false}
              >
                {renderStepContent()}
              </ScrollView>

              {/* Navigation Buttons */}
              <View style={styles.navigationContainer}>
                {currentStep > 1 && (
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={handlePreviousStep}
                  >
                    <Ionicons name="arrow-back" size={20} color="white" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[
                    styles.continueButton, 
                    loading && styles.continueButtonDisabled
                  ]} 
                  onPress={currentStep === 3 ? handleComplete : handleNextStep}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.continueButtonText}>
                      {currentStep === 3 ? 'COMPLETE QUEST' : 'CONTINUE QUEST'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {showSnackbar && (
              <View style={styles.snackbar}>
                <Text style={styles.snackbarText}>{snackbarMessage}</Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flexContainer: { flex: 1 },
  screenContainer: {
    flex: 1,
  },
  imageSection: {
    flex: 1,
    minHeight: '40%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  formPanel: {
    backgroundColor: '#1F1F1F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    minHeight: '50%',
    maxHeight: '60%',
    borderTopEndRadius: 50,
    borderTopStartRadius: 50,
  },
  questTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: FONTS.body.bold,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  progressCrystal: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    fontFamily: FONTS.body.semiBold,
    minWidth: 80,
  },
  stepContent: {
    paddingBottom: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  genderInputWrapper: {
    flex: 1,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  genderButtonSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderColor: '#007AFF',
  },

  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: FONTS.body.bold,
  },
  // New referral verification styles
  referralContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  referralInput: {
    flex: 1,
    backgroundColor: '#FFD700',
    color: '#333',
    padding: 14,
    borderRadius: 8,
    fontSize: 15,
    fontFamily: FONTS.body.semiBold,
  },
  inputValid: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  inputInvalid: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonDisabled: {
    backgroundColor: '#6B7280',
    opacity: 0.6,
  },
  verifyButtonValid: {
    backgroundColor: '#10B981',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: FONTS.body.semiBold,  
  },
  verificationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  verificationMessageValid: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  verificationMessageInvalid: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  verificationMessageText: {
    color: '#3B82F6',
    fontSize: 12,
    marginLeft: 6,
    fontFamily: FONTS.body.semiBold,
  },
  verificationMessageTextValid: {
    color: '#10B981',
  },
  verificationMessageTextInvalid: {
    color: '#EF4444',
  },
  // snackbar 
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

export default ProfileCompletionScreen;