import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import IQMeter from '../../components/IQMeter'
import { calculateStreakStatus } from '../../components/Streak';
import { useAuth } from '../../contexts/AuthContext';
import { useBalance } from '../../contexts/BalanceContext';
import { authAPI, configAPI } from '../../services/api';

const { width, height } = Dimensions.get('window');

// Entrance Animation 
const AnimatedSection = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            delay,
            useNativeDriver: true,
        }).start();
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            delay,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim, slideAnim]);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {children}
        </Animated.View>
    );
};

// --- Icon Components ---
const BackIcon = () => <Svg fill="none" viewBox="0 0 24 24" stroke="white" style={styles.icon}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></Svg>;
const ChevronRightIcon = () => <Svg fill="none" viewBox="0 0 24 24" stroke="#A1A1AA" style={styles.icon}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></Svg>;
const LogoutIcon = () => <Svg fill="none" viewBox="0 0 24 24" stroke="#EF4444" style={styles.icon}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></Svg>;
const EditProfileIcon = () => <Svg fill="none" viewBox="0 0 24 24" stroke="#A1A1AA" style={styles.icon}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></Svg>;
const HistoryIcon = () => <Svg fill="none" viewBox="0 0 24 24" stroke="#A1A1AA" style={styles.icon}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></Svg>;
const PenIcon = () => <Svg fill="none" viewBox="0 0 24 24" stroke="white" style={styles.penIcon}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></Svg>;

// UI Section
const ProfileHeader = ({ userProfile }: { userProfile: any }) => (
    <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
            <View style={styles.avatarGlow}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                </View>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile')}>
                <PenIcon />
            </TouchableOpacity>
        </View>
        <Text style={styles.profileName}>{userProfile?.name || 'Loading...'}</Text>
        <Text style={styles.profileEmail}>{userProfile?.email || 'Loading...'}</Text>
    </View>
);

const StatsGrid = ({ userProfile, balance }: { userProfile: any, balance: number }) => {
  // Safe referral count resolver (same as rewards screen)
  const resolveReferralCount = (user: any) => {
    if (!user) return 0;
    
    // Prefer authoritative counter if backend provides it
    if (typeof user.referredCount === 'number') return user.referredCount;

    const arr: string[] = Array.isArray(user.referredUsers) ? user.referredUsers : [];
    
    // If user has referredUsers array, that means they have referred people
    if (arr.length > 0) {
      // If the array contains only the user's own ID (self-reference), treat as 0
      if (arr.length === 1 && arr[0] === user._id) {
        return 0;
      }
      
      // Filter out any self-references but keep the rest
      const validReferrals = arr.filter(referredUserId => referredUserId !== user._id);
      return validReferrals.length;
    }

    return 0;
  };

  return (
    <View style={styles.statsGrid}>
      {/* Token Card */}
      <View style={styles.statCard}>
        <View style={styles.statCardLeft}>
          <View style={styles.statIcon}>
            <Text style={styles.statIconText}>🪙</Text>
          </View>
        </View>
        <View style={styles.statCardRight}>
          <Text style={styles.statSubValue}>{balance.toLocaleString()}</Text>
          <Text style={styles.statSubLabel}>Token Balance</Text>
        </View>
      </View>

      {/* INR Balance */}
      <View style={styles.statCard}>
        <View style={styles.statCardLeft}>
          <View style={styles.statIcon}>
            <Text style={styles.statIconText}>💰</Text>
          </View>
        </View>
        <View style={styles.statCardRight}>
          <Text style={styles.statSubValue}>₹ {(balance * 0.1).toFixed(2)}</Text>
          <Text style={styles.statSubLabel}>INR Balance</Text>
        </View>
      </View>
    </View>
  );
};

const AccountMenu = ({ onLogout }: { onLogout: () => void }) => (
    <View style={styles.accountSectionContainer}>
        <Text style={styles.sectionTitle}>Account</Text>
        <BlurView intensity={40} tint="dark" style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/edit-profile')}>
                <View style={styles.menuItemContent}>
                    <View style={styles.iconContainer}><EditProfileIcon /></View>
                    <Text style={styles.menuItemText}>Edit Profile</Text>
                </View>
                <ChevronRightIcon />
            </TouchableOpacity>
            
            <View style={styles.divider} />

            <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/reward-history')}
            >
                <View style={styles.menuItemContent}>
                    <View style={styles.iconContainer}><HistoryIcon /></View>
                    <Text style={styles.menuItemText}>Reward History</Text>
                </View>
                <ChevronRightIcon />
            </TouchableOpacity>
            
            <View style={styles.divider} />

            <TouchableOpacity onPress={onLogout} style={styles.menuItem}>
                <View style={styles.menuItemContent}>
                    <View style={styles.iconContainer}><LogoutIcon /></View>
                    <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Logout</Text>
                </View>
            </TouchableOpacity>
        </BlurView>
    </View>
);

export default function ProfileScreen() {
  const { authState, onLogout } = useAuth();
  const { balance, userData, refreshBalance } = useBalance();
  
  // Additional profile data not in balance context
  const [userProfile, setUserProfile] = useState<{
    name: string, 
    email: string, 
    _id: string, 
    coins?: number, 
    inrBalance?: number, 
    iq?: number,
    streakCount?: number,
    longestStreak?: number,
    lastStreakAt?: string,
    username?: string,
    tags?: string[],
    occupation?: string,
    gender?: string,
    dob?: string
  } | null>(null);
  const [userIQ, setUserIQ] = useState(0);
  const [loading, setLoading] = useState(true);
  const [iqRanges, setIqRanges] = useState<any[]>([]);
  
  // Mock streak data - will be replaced with real data from backend
  const [streakData, setStreakData] = useState({
    currentStreak: 3,
    longestStreak: 15,
    lastStreakAt: new Date().toISOString(),
    isActive: true,
  });

  // Logout handler
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout', style: 'destructive',
          onPress: async () => {
            try {
              await onLogout?.();
              router.replace('/Login');
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };
  

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getUser();
        console.log('🔍 Profile - Raw API response:', response);
        
        // response structures - backend returns user data 
        const userData = response.user || response.data || response;
        console.log('🔍 Profile - Extracted user data:', userData);
        
        if (userData && (userData.firstName || userData.username || userData.name || userData.email)) {
          // Map backend fields to frontend fields
          const mappedUserData = {
            name: userData.firstName || userData.username || userData.name || 'User',
            email: userData.email,
            _id: userData._id,
            iq: userData.iq,
            coins: userData.coins || 0,
            inrBalance: userData.inrBalance || 0,
            streakCount: userData.streakCount,
            longestStreak: userData.longestStreak,
            lastStreakAt: userData.lastStreakAt
          };
          
          console.log('✅ Profile - User data loaded:', {
            name: mappedUserData.name,
            email: mappedUserData.email,
            iq: mappedUserData.iq,
            coins: mappedUserData.coins,
            inrBalance: mappedUserData.inrBalance
          });
          setUserProfile(mappedUserData);
          setUserIQ(mappedUserData.iq || 0);
          
          // Load streak data from user profile
          if (mappedUserData.streakCount !== undefined) {
            const isActive = calculateStreakStatus(mappedUserData.lastStreakAt || new Date().toISOString());
            setStreakData({
              currentStreak: mappedUserData.streakCount || 3,
              longestStreak: mappedUserData.longestStreak || 15,
              lastStreakAt: mappedUserData.lastStreakAt || new Date().toISOString(),
              isActive: isActive,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Set fallback data so user doesn't see "Loading..." forever
        setUserProfile({
          name: 'User',
          email: 'user@example.com',
          _id: '',
          iq: 0,
          coins: 0,
          inrBalance: 0
        });
      } finally {
        setLoading(false);
      }
    };
  
    if (authState?.authenticated) {
      fetchUserProfile();
    }
  }, [authState?.authenticated]);

  // Add this useEffect to load IQ ranges
  useEffect(() => {
    const loadIqRanges = async () => {
      try {
        const response = await configAPI.getIqRanges();
        console.log('✅ IQ ranges loaded:', response);
        
        // Handle different response structures
        if (response && response.data) {
          setIqRanges(response.data || []);
        } else if (response && Array.isArray(response)) {
          setIqRanges(response);
        } else {
          console.log('⚠️ No IQ ranges data found, using empty array');
          setIqRanges([]);
        }
      } catch (error) {
        console.error('Failed to load IQ ranges:', error);
        setIqRanges([]); 
      }
    };

    loadIqRanges();
  }, []);


  return (
    <View style={styles.container}>
      {/* <LinearGradient colors={['#1e3a8a', '#1e40af', '#1d4ed8']} style={StyleSheet.absoluteFill} /> */}
      <LinearGradient
            colors={['#0a101bff', '#060910ff', '#071014ff']}
            style={StyleSheet.absoluteFill}
          ></LinearGradient>
      <BlurView intensity={80} tint="dark" style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><BackIcon/></TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{width: 24}} /> 
      </BlurView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* keeps the top content centered */}
        <View style={styles.centeredContent}>
          <AnimatedSection delay={100}>
            <ProfileHeader userProfile={userProfile} />
          </AnimatedSection>

          <AnimatedSection delay={200}>
              <StatsGrid userProfile={userProfile} balance={balance} />
          </AnimatedSection>
        </View>

        {/* Full width sections */}
        <AnimatedSection delay={300}>
          <View style={styles.iqSectionContainer}>
            <Text style={styles.sectionTitle}>IQ Level</Text>
            <BlurView intensity={40} tint="dark" style={styles.iqContainer}>
              <IQMeter iqValue={userIQ} />
            </BlurView>
          </View>
        </AnimatedSection>

        {/* Streak Card - Full width individual card */}
        <AnimatedSection delay={350}>
          <View style={styles.iqSectionContainer}>
            <Text style={styles.sectionTitle}>Streak</Text>
            <View style={styles.statCard}>
              <View style={styles.statCardLeft}>
                <View style={styles.statIcon}>
                  <Text style={styles.statIconStreakText}>🔥</Text>
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statLabel}>Streak</Text>
                  <Text style={styles.statValue}>{userProfile?.streakCount || 0} Days</Text>
                </View>
              </View>
              <View style={styles.statCardRight}>
                <Text style={styles.statSubValue}>Longest </Text>
                <Text style={styles.statSubLabel}>{userProfile?.longestStreak || 0} Days</Text>
              </View>
            </View>
          </View>
        </AnimatedSection>

        <AnimatedSection delay={400}>
          <AccountMenu onLogout={handleLogout} />
        </AnimatedSection>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    // paddingTop: 15,
    paddingTop: 40, 
    paddingBottom: 15, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  scrollContent: { paddingTop: 95, paddingHorizontal: 20, paddingBottom: 120 },
  centeredContent: {
    alignItems: 'center',
    width: '100%',
  },
  // Profile Header
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGlow: {
    shadowColor: '#829acaff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 15,
    borderRadius: 999, // For shadow to be round
  },
  avatar: {
    width: 105,
    height: 105,
    borderRadius: 60,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    // borderWidth: 4,
    // borderColor: '#1F2937',
  },
  avatarText: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  editButton: {
    position: 'absolute',
    top: 80, // Position at the bottom right of the avatar
    right: 0, // Align to the right edge
    backgroundColor: '#EF4444',
    width: 30,
    height: 30,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'white',
  },
  penIcon: {
    width: 15,
    height: 15,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  profileEmail: {
    fontSize: 15,
    color: '#A1A1AA',
    marginTop: 4,
  },
  // tokens and INR balance
  socialTaskCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1b23',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2b33',
  },
  // IQ Section
  iqSectionContainer: {
    width: '100%', 
    alignItems: 'flex-start', 
    marginBottom: 15,
  },
  iqContainer: {
    width: '100%',
    borderRadius: 12,
    // padding: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  // Stats Grid
  statsGrid: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 20,
    gap: 13, 
  },
  statCard: {
    // flex: 1, 
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    // alignItems: 'center',
    // backgroundColor: 'rgba(255, 255, 255, 0.05)',
    // borderRadius: 13,
    // // padding: 10,
    // borderWidth: 1,
    // borderColor: 'rgba(255, 255, 255, 0.1)',

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    // marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginLeft: 45
  },
  statCardRight: {
    alignItems: 'stretch'
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -50,
  },
  statIconStreak: {
    width: 38,
    height: 38,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    // marginLeft: -50,
  },
  statIconText: {
    fontSize: 25,
  },
  statIconStreakText: {
    fontSize: 25,
  },
  statInfo: {
    flex: 1,
  },
  // statLabel: {
  //   fontSize: 14,
  //   color: '#A1A1AA',
  //   marginBottom: 4,
  //   marginLeft: 10
  // },
  // statValue: {
  //   fontSize: 18,
  //   // fontWeight: 'bold',
  //   color: 'white',
  //   marginLeft: 10
  // },
  statLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10
  },
  statValue: {
    fontSize: 15,
    color: '#A1A1AA',
    marginBottom: 4,
    marginLeft: 10
  },
  statSubValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    alignItems: 'center'
  },
  statSubLabel: {
    fontSize: 14,
    color: '#71717A',
  },

  // Account Menu
  accountSectionContainer: {
    width: '100%', 
    alignItems: 'flex-start', 
    paddingTop: 15, 
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  menuContainer: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
  },
  icon: {
    width: 24,
    height: 24,
  },
});