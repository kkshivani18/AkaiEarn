import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, referralAPI } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const ProfileCompletionScreen: React.FC = () => {
  const [fullName, setFullName] = React.useState<string>('');
  const [occupation, setOccupation] = React.useState<string | null>(null);
  const [gender, setGender] = React.useState<string>('');
  const [dobDate, setDobDate] = React.useState<Date | null>(null);
  const [showDobPicker, setShowDobPicker] = React.useState<boolean>(false);
  
  const genderItems = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
    { label: 'Prefer not to say', value: 'prefer-not-to-say' },
  ];

  // Format Date as MM/DD/YYYY 
  const formatDateMMDDYYYY = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };
  
  const [referralCode, setReferralCode] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [location, setLocation] = React.useState<{ lat: number; lng: number } | null>(null);

  // new: interests state
  // const [interests, setInterests] = React.useState<string[]>([]);
  // const interestOptions = ['Technology','Science','Arts','Music','Sports','Travel','Food','Fashion'];

  const { onProfileCompleted } = useAuth();

  // const toggleInterest = (tag: string) => {
  //   setInterests(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  // };

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
      
      // Get current location
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

  const handleNext = async () => {
    console.log('Profile completion with data:', {
      fullName,
      occupation,
      gender,
      dobDate,
      referralCode,
      location
    });
    
    if (!fullName || !occupation || !dobDate || !gender) {
      Alert.alert('Incomplete Form', 'Please fill out all required fields.');
      return;
    }
    
    // Validate full name (at least 2 words, 2-50 characters each)
    const nameWords = fullName.trim().split(/\s+/);
    if (nameWords.length < 2) {
      Alert.alert('Error', 'Please enter your full name (first and last name)');
      return;
    }
    
    if (nameWords.some(word => word.length < 2 || word.length > 50)) {
      Alert.alert('Error', 'Each name part must be 2-50 characters long');
      return;
    }
    
    // Validate gender values
    const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
    if (!validGenders.includes(gender.toLowerCase())) {
      Alert.alert('Error', 'Please enter a valid gender: male, female, other, or prefer-not-to-say');
      return;
    }
    
    // Validate date is not in the future
    const inputDate = dobDate!;
    const today = new Date();
    if (inputDate > today) {
      Alert.alert('Error', 'Date of birth cannot be in the future');
      return;
    }
    
    // Validate age is reasonable (between 13 and 120 years)
    const age = today.getFullYear() - inputDate.getFullYear();
    if (age < 13 || age > 120) {
      Alert.alert('Error', 'Please enter a valid date of birth (age must be between 13 and 120 years)');
      return;
    }
    
    setLoading(true);
    
    try {
      // Handle referral code if provided
      if (referralCode.trim()) {
        // Basic referral code validation (alphanumeric, 6-12 characters)
        const referralCodeRegex = /^[a-zA-Z0-9]{6,12}$/;
        if (!referralCodeRegex.test(referralCode.trim())) {
          Alert.alert('Invalid Referral Code', 'Referral code must be 6-12 alphanumeric characters');
          setLoading(false);
          return;
        }
        
        try {
          await referralAPI.useReferralCode(referralCode.trim());
          console.log('✅ Referral code applied successfully');
        } catch (referralError: any) {
          console.warn('⚠️ Referral code error:', referralError);
          // Don't block profile completion for referral code errors
          Alert.alert(
            'Referral Code Warning', 
            'Profile will be completed, but referral code could not be applied. You can try again later.'
          );
        }
      }
      
      // Format the data to match what the backend expects
      const profileData = {
        occupation: occupation || '',
        dob: dobDate ? dobDate.toISOString().split('T')[0] : '',
        gender: gender.toLowerCase(),
        // tags: interests, 
        location: location || { lat: 0, lng: 0 } 
      };
      
      console.log('Sending profile data:', profileData);
      console.log('API endpoint: /auth/submit-form');
      
      const result = await authAPI.updateProfile(profileData);
      console.log('✅ Profile update result:', result);
      
      // Mark profile as completed
      if (onProfileCompleted) {
        onProfileCompleted();
      }
      
      Alert.alert(
        'Profile Submitted',
        'Thank you for completing your profile!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/offer')
          }
        ]
      );
      
    } catch (error: any) {
      console.error('❌ Profile completion error:', error);
      
      let errorMessage = 'Failed to update profile';
      if (error.response?.data?.errors) {
        // Handle validation errors from backend
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
      // Optional: Clear auth state
      // if (onLogout) {
      //   await onLogout();
      // }
      // Navigate to Login
      router.replace('/Login');
    } catch (error) {
      console.error('Error during back navigation:', error);
      // Fallback: just navigate
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
    inputIOS: { ...styles.input },
    inputAndroid: { ...styles.input },
    placeholder: { color: '#a1a1aa' },
    iconContainer: {
      top: 18,
      right: 15,
    },
  });
 
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
          <BlurView intensity={60} tint="dark" style={styles.mobileScreen}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={handleBackNavigation}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>About You</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.formContainer}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#a1a1aa"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoCorrect={false}
              />

              <Text style={styles.label}>Occupation</Text>
              <RNPickerSelect
                onValueChange={(value) => setOccupation(value)}
                items={occupationItems}
                style={pickerSelectStyles}
                placeholder={{ label: 'Select occupation', value: null }}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                )}
              />

              <Text style={styles.label}>Gender</Text>
              <RNPickerSelect
                onValueChange={(value) => setGender(value)}
                items={genderItems}
                style={pickerSelectStyles}
                placeholder={{ label: 'Select gender', value: '' }}
                useNativeAndroidPickerStyle={false}
                value={gender}
                Icon={() => (
                  <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                )}
              />

              <Text style={styles.label}>Date of birth</Text>
              <TouchableOpacity
                style={styles.input}
                activeOpacity={0.8}
                onPress={() => setShowDobPicker(true)}
              >
                <Text style={{ color: dobDate ? '#fff' : '#a1a1aa' }}>
                  {dobDate ? formatDateMMDDYYYY(dobDate) : 'MM/DD/YYYY'}
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

              {/* <Text style={[styles.label, { marginTop: 6 }]}>Interests</Text>
              <View style={styles.chipsContainer}>
                {interestOptions.map((tag) => {
                  const selected = interests.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleInterest(tag)}
                      style={[
                        styles.chip,
                        selected ? styles.chipSelected : styles.chipUnselected
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={selected ? styles.chipTextSelected : styles.chipTextUnselected}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View> */}

              <Text style={styles.label}>Referral Code (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter code"
                placeholderTextColor="#a1a1aa"
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.locationCard}>
                <Text style={styles.locationTitle}>Location</Text>
                <Text style={styles.locationSubtitle}>
                  To provide you with tasks relevant to your location, we need your permission to access your location.
                </Text>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={handleLocationAccess}
                >
                  <Ionicons name="location-sharp" size={20} color="white" />
                  <Text style={styles.locationButtonText}>
                    Allow location access
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity 
                style={[styles.nextButton, loading && styles.nextButtonDisabled]} 
                onPress={handleNext}
                disabled={loading}
              >
                <Text style={styles.nextButtonText}>
                  {loading ? 'Saving...' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flexContainer: { flex: 1 },
  mobileScreen: {
    flex: 1,
    margin: 14,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    backgroundColor: 'rgba(10,10,12,0.6)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: Platform.OS === 'android' ? 18 : 18,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { flex: 1, textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '700' },
  formContainer: { paddingHorizontal: 18, paddingBottom: 20 },
  label: { color: '#d4d4d8', fontSize: 13, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    color: 'white',
    padding: 12,
    borderRadius: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, // supported on newer RN; if not supported, margins on chips handle spacing
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: '#0ea5ff', // light blue when selected
    borderColor: '#0ea5ff',
  },
  chipUnselected: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipTextSelected: { color: '#001018', fontSize: 14, fontWeight: '600' },
  chipTextUnselected: { color: '#d4d4d8', fontSize: 14 },

  locationCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    marginTop: 6,
    marginBottom: 12,
  },
  locationTitle: { color: 'white', fontSize: 15, fontWeight: '600' },
  locationSubtitle: { color: '#a1a1aa', fontSize: 12, marginTop: 8, marginBottom: 12 },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 10,
    borderRadius: 10,
  },
  locationButtonText: { color: 'white', fontSize: 14, marginLeft: 8 },

  footer: {
    padding: 18,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  nextButton: {
    backgroundColor: '#007AFF', // blue primary button
    paddingVertical: 12,
    marginHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: { opacity: 0.6 },
  nextButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});

export default ProfileCompletionScreen;