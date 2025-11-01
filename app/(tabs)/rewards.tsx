import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Alert,
  Share,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, couponsAPI } from '../../services/api';
import CouponModal from '../../components/CouponModal';
import SpinWheel from '../../components/SpinWheel';
import { Coupon } from '../../types/Offer';

// Define Segment type locally to avoid import issues
interface Segment {
  color: string;
  text: string;
  reward: string;
  type?: 'tokens' | 'coupon';
  value?: number;
  couponData?: {
    _id: string;
    company: string;
    description: string;
    couponCode: string;
    expiryDate: string;
    imageLink: string;
  };
  coupon?: any;
  brandLogo?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RewardsScreen: React.FC = () => {
  const { authState } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinValue] = useState(new Animated.Value(0));
  const [coupons, setCoupons] = useState<any[]>([]);
  const [hasSpun, setHasSpun] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  
  // Add refresh state for coupons
  const [refreshingCoupons, setRefreshingCoupons] = useState(false);
  // Updated wheel segments to include real coupon data
  const [availableSpinCoupons, setAvailableSpinCoupons] = useState<any[]>([]);
  const [wheelSegments, setWheelSegments] = useState<Segment[]>([]);
  const [lastSpinDate, setLastSpinDate] = useState<string | null>(null);
  const [showReferredUsers, setShowReferredUsers] = useState(false);
  const [referredUsersDetails, setReferredUsersDetails] = useState<any[]>([]);
  const [loadingReferredUsers, setLoadingReferredUsers] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchCoupons();
    loadSpinWheelCoupons();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getUser();
      const userData = response.user || response.data || response;
      setUserProfile(userData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  // Enhanced fetchCoupons to refresh after spin
  const fetchCoupons = async (showLoading = false) => {
    try {
      if (showLoading) setRefreshingCoupons(true);
      
      const response = await couponsAPI.getUserCoupons();
      if (response.success) {
        setCoupons(response.data || []);
        console.log('✅ Coupons refreshed:', response.data?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
      // Keep existing coupons if refresh fails
    } finally {
      if (showLoading) setRefreshingCoupons(false);
    }
  };

  // Load available coupons for spin wheel from backend
  const loadSpinWheelCoupons = async () => {
    try {
      const response = await couponsAPI.getSpinWheelCoupons();
      if (response.success && response.data) {
        setAvailableSpinCoupons(response.data);
        
        // Create wheel segments from backend coupons + some token rewards
        const couponSegments = response.data.map((coupon: any, index: number) => ({
          color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][index % 6],
          text: `${coupon.company} Coupon`,
          reward: `${coupon.company} Coupon`,
          type: 'coupon' as const,
          couponData: {
            _id: coupon._id,
            company: coupon.company,
            description: coupon.description,
            couponCode: 'WINNER', // Will be revealed after selection
            expiryDate: coupon.expiryDate,
            imageLink: coupon.imageLink,
          },
          coupon: { 
            company: coupon.company, 
            imageLink: coupon.imageLink 
          }
        }));

        // Add some token segments to balance the wheel
        const tokenSegments = [
          {
            color: '#FFD700',
            text: '50 Tokens',
            reward: '50 Tokens',
            type: 'tokens' as const,
            value: 50,
            coupon: { company: 'Tokens', imageLink: 'https://placehold.co/40x40/FFD700/333333?text=💰' }
          },
          {
            color: '#32CD32',
            text: '100 Tokens',
            reward: '100 Tokens',
            type: 'tokens' as const,
            value: 100,
            coupon: { company: 'Tokens', imageLink: 'https://placehold.co/40x40/32CD32/FFFFFF?text=💰' }
          }
        ];

        // Combine and shuffle segments
        const allSegments = [...couponSegments, ...tokenSegments];
        setWheelSegments(allSegments);
        
        console.log('✅ Spin wheel segments loaded:', allSegments.length);
      }
    } catch (error) {
      console.error('Failed to load spin wheel coupons:', error);
      // Use fallback segments
      setWheelSegments([
        {
          color: '#FF6B6B',
          text: '50 Tokens',
          reward: '50 Tokens',
          type: 'tokens',
          value: 50,
          coupon: { company: 'Tokens', imageLink: 'https://placehold.co/40x40/FF6B6B/FFFFFF?text=💰' }
        }
      ]);
    }
  };

  const handleSpinWheel = () => {
    // COMMENTED OUT: 24-hour restriction for testing
    // if (hasSpun) {
    //   Alert.alert('Already Spun', 'You can only spin once per day!');
    //   return;
    // }
    
    if (wheelSegments.length === 0) {
      Alert.alert('Loading', 'Spin wheel is still loading. Please try again.');
      return;
    }
    
    setShowSpinWheel(true);
  };

  // Enhanced spin completion handler using backend endpoint
  const handleSpinComplete = async (segment: Segment) => {
    console.log('🎉 Spin completed! Won:', segment);
    setHasSpun(true);
    
    try {
      if (segment.type === 'coupon' && segment.couponData) {
        // Use the backend spin wheel selection endpoint
        console.log('🎟️ Selecting coupon via backend:', segment.couponData._id);
        
        try {
          const response = await couponsAPI.selectSpinWheelCoupon(segment.couponData._id);
          console.log('✅ Coupon selected successfully:', response);
          
          // Refresh coupons list to show new coupon with full details
          await fetchCoupons(true);
          
          Alert.alert(
            'Congratulations! 🎉',
            `You won a ${segment.couponData.company} coupon: ${segment.couponData.description}!`,
            [
              {
                text: 'View Coupons',
                onPress: () => {
                  setShowSpinWheel(false);
                }
              },
              {
                text: 'OK',
                onPress: () => {
                  setShowSpinWheel(false);
                  // 24-hour spin-wheel reset
                  setTimeout(() => setHasSpun(false), 24 * 60 * 60 * 1000);
                  
                  // For testing: Reset immediately
                  // setTimeout(() => setHasSpun(false), 2000);
                }
              }
            ]
          );
        } catch (couponError: any) {
          console.error('❌ Failed to select coupon:', couponError);
          
          let errorMessage = 'Failed to add coupon to your account.';
          if (couponError.response?.status === 409) {
            errorMessage = 'You can only spin the wheel once a day!';
          } else if (couponError.response?.status === 404) {
            errorMessage = 'Coupon not available. Please try again.';
          }
          
          Alert.alert(
            'Oops!',
            errorMessage,
            [{ text: 'OK', onPress: () => setShowSpinWheel(false) }]
          );
        }
      } else if (segment.type === 'tokens') {
        // Award tokens - you can implement token API call here
        console.log('🪙 Awarding tokens:', segment.value);
        
        Alert.alert(
          'Congratulations! 🎉',
          `You won ${segment.value} tokens!`,
          [
            {
              text: 'Claim',
              onPress: () => {
                setShowSpinWheel(false);
                // For testing: Reset immediately
                // setTimeout(() => setHasSpun(false), 2000);
                setTimeout(() => setHasSpun(false), 24 * 60 * 60 * 1000);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error processing spin reward:', error);
      Alert.alert(
        'Error',
        'There was an error processing your reward. Please try again.',
        [{ text: 'OK', onPress: () => setShowSpinWheel(false) }]
      );
    }
  };

  const handleSpinPress = () => {
    setIsSpinning(true);
    // SpinWheel component will handle the actual spinning
    // Reset spinning state after animation completes
    setTimeout(() => {
      setIsSpinning(false);
    }, 5000);
  };

  const handleReferFriend = async () => {
    try {
      const referralCode = userProfile?.referralCode || 'USER123';
      const shareMessage = `🎯 Join me on OfferWall and earn tokens! Use my referral code: ${referralCode}\n\nDownload: https://play.google.com/store/apps/details?id=com.offerwall.app`;
      
      await Share.share({
        message: shareMessage,
        title: 'Join OfferWall - Earn Tokens!',
      });
    } catch (error) {
      console.error('Failed to share referral:', error);
    }
  };

  // referral count 
  const referralCount = (user: any) => {
    if (!user) return 0;
    if (typeof user.referredCount === 'number') return user.referredCount;

    const arr: string[] = Array.isArray(user.referredUsers) ? user.referredUsers : [];
    
    // If user has referredUsers array, that means they have referred people
    // The length of this array is the actual referral count
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

  const handleCouponPress = (coupon: any) => {
    // Convert the coupon data to match CouponModal expected format
    const modalCoupon: Coupon = {
      _id: coupon._id,
      company: coupon.company,
      description: coupon.description,
      expiryDate: coupon.expiryDate,
      imageLink: coupon.imageLink || `https://logo.clearbit.com/${coupon.company.toLowerCase()}.com`,
      couponCode: coupon.couponCode || coupon.discount ? `SAVE${coupon.discount}` : 'GET50',
    };
    
    setSelectedCoupon(modalCoupon);
    setShowCouponModal(true);
  };

  const handleCloseCouponModal = () => {
    setShowCouponModal(false);
    setSelectedCoupon(null);
  };

  // Fetch details of referred users
  const fetchReferredUsersDetails = async () => {
    if (!userProfile?.referredUsers || userProfile.referredUsers.length === 0) {
      return;
    }

    setLoadingReferredUsers(true);
    try {
      // Since we can't modify backend, we'll show user IDs and basic info
      // In a real implementation, you'd have an endpoint to get user details by IDs
      const referredUsers = userProfile.referredUsers.map((userId: string, index: number) => ({
        _id: userId,
        name: `User ${index + 1}`, // Fallback name
        email: `user${index + 1}@example.com`, // Fallback email
        joinedDate: new Date().toLocaleDateString(), // Fallback date
      }));
      
      setReferredUsersDetails(referredUsers);
    } catch (error) {
      console.error('Failed to fetch referred users details:', error);
    } finally {
      setLoadingReferredUsers(false);
    }
  };

  // Toggle referred users dropdown
  const handleToggleReferredUsers = () => {
    if (!showReferredUsers && referredUsersDetails.length === 0) {
      fetchReferredUsersDetails();
    }
    setShowReferredUsers(!showReferredUsers);
  };

  const SpinWheelModal = () => (
    <Modal
      visible={showSpinWheel}
      transparent
      animationType="fade"
      onRequestClose={() => !isSpinning && setShowSpinWheel(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => !isSpinning && setShowSpinWheel(false)}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        
        <SpinWheel
          segments={wheelSegments}
          onSpinComplete={handleSpinComplete}
          isSpinning={isSpinning}
          isUnlocked={!hasSpun}
          spinValue={spinValue}
          onSpinPress={handleSpinPress}
        />
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a101bff', '#060910ff', '#071014ff']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Rewards</Text>
            <View style={styles.headerIcon}>
              <Ionicons name="gift-outline" size={24} color="#007AFF" />
            </View>
          </View>

          {/* Spin the Daily Wheel Section */}
          <BlurView intensity={40} tint="dark" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="disc-outline" size={28} color="#007AFF" />
              </View>
              <View style={styles.sectionInfo}>
                <Text style={styles.sectionTitle}>Spin the Wheel Daily!</Text>
                <Text style={styles.sectionSubtitle}>
                  {wheelSegments.length > 0 
                    ? `${availableSpinCoupons.length} coupons available! Try your luck to win amazing rewards!`
                    : 'Loading available rewards...'
                  }
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.actionButton, wheelSegments.length === 0 && styles.actionButtonDisabled]} 
              onPress={handleSpinWheel}
              disabled={wheelSegments.length === 0}
            >
              <Text style={styles.actionButtonText}>
                {wheelSegments.length === 0 ? 'Loading...' : 'Spin the wheel'}
              </Text>
            </TouchableOpacity>
          </BlurView>

          {/* Referrals Section */}
          <BlurView intensity={40} tint="dark" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="people-outline" size={28} color="#007AFF" />
              </View>
              <View style={styles.sectionInfo}>
                <Text style={styles.sectionTitle}>Referrals</Text>
                <Text style={styles.sectionSubtitle}>Share the wealth, earn together! Invite friends and unlock exclusive rewards.</Text>
              </View>
            </View>
            
            <View style={styles.referralCodeContainer}>
              <Text style={styles.referralLabel}>Your referral code</Text>
              <View style={styles.referralCodeBox}>
                <Text style={styles.referralCode}>{userProfile?.referralCode || 'LOADING...'}</Text>
                {/* Use safe resolver instead of raw referredUsers length */}
                <Text style={styles.referralStats}>Total referrals: {referralCount(userProfile)}</Text>
              </View>
              <TouchableOpacity style={styles.copyButton}>
                <Ionicons name="copy-outline" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.inviteButton} onPress={handleReferFriend}>
              <Ionicons name="share-social-outline" size={20} color="white" />
              <Text style={styles.inviteButtonText}>Invite Friends</Text>
            </TouchableOpacity>
          </BlurView>

          {/* Referred Users Card */}
          <BlurView intensity={40} tint="dark" style={styles.sectionCard}>
            <TouchableOpacity 
              style={styles.referredUsersHeader} 
              onPress={handleToggleReferredUsers}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="people" size={28} color="#007AFF" />
                </View>
                <View style={styles.sectionInfo}>
                  <Text style={styles.sectionTitle}>Referred Users</Text>
                  <Text style={styles.sectionSubtitle}>
                    {referralCount(userProfile)} user{referralCount(userProfile) !== 1 ? 's' : ''} joined using your code
                  </Text>
                </View>
              </View>
              <View style={styles.dropdownIcon}>
                <Ionicons 
                  name={showReferredUsers ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color="#A1A1AA" 
                />
              </View>
            </TouchableOpacity>

            {/* Dropdown Content */}
            {showReferredUsers && (
              <View style={styles.referredUsersDropdown}>
                {loadingReferredUsers ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading referred users...</Text>
                  </View>
                ) : referredUsersDetails.length > 0 ? (
                  <>
                    <View style={styles.dividerLine} />
                    {referredUsersDetails.map((user, index) => (
                      <View key={user._id} style={styles.referredUserItem}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.userAvatarText}>
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </Text>
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>{user.name}</Text>
                          <Text style={styles.userDetails}> Joined: {user.joinedDate} </Text>
                          <Text style={styles.userDetails}> ID: {user._id.substring(0, 24)}</Text>
                        </View>
                        {/* <View style={styles.userBadge}>
                          <Text style={styles.userBadgeText}>#{index + 1}</Text>
                        </View> */}
                      </View>
                    ))}
                  </>
                ) : (
                  <View style={styles.noReferredUsersContainer}>
                    <Ionicons name="people-outline" size={48} color="#666" />
                    <Text style={styles.noReferredUsersText}>No referrals yet</Text>
                    <Text style={styles.noReferredUsersSubtext}>
                      Share your referral code to start earning rewards!
                    </Text>
                  </View>
                )}
              </View>
            )}
          </BlurView>

          {/* Your Coupons Section - Show actual user coupons */}
          <BlurView intensity={40} tint="dark" style={styles.sectionCard}>
            <View style={styles.sectionHeaderWithTitle}>
              <Text style={styles.largeSectionTitle}>Your Coupons</Text>
              {refreshingCoupons && (
                <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 10 }} />
              )}
              <TouchableOpacity 
                onPress={() => fetchCoupons(true)}
                style={styles.refreshButton}
              >
                <Ionicons name="refresh" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            {coupons.length > 0 ? (
              coupons.map((coupon) => (
                <TouchableOpacity 
                  key={coupon._id} 
                  style={styles.modernCouponCard}
                  onPress={() => handleCouponPress(coupon)}
                  activeOpacity={0.8}
                >
                  <View style={styles.couponImageSection}>
                    <View style={styles.couponPattern}>
                      <View style={styles.patternDots} />
                      <Text style={styles.couponBigText}>
                        {extractDiscountFromDescription(coupon.description)}%
                      </Text>
                      <Text style={styles.couponSmallText}>OFF</Text>
                    </View>
                    
                    <View style={styles.perforatedLine}>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <View key={i} style={styles.perforationDot} />
                      ))}
                    </View>
                    
                    <View style={styles.couponInfoSection}>
                      <Text style={styles.couponCompanyName}>{coupon.company}</Text>
                      <Text style={styles.couponDescription}>{coupon.description}</Text>
                      <Text style={styles.couponCode}>
                        Code: {coupon.couponCode}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.couponBottomSection}>
                    <View style={styles.couponBottomLeft}>
                      <Text style={styles.couponBottomLabel}>{coupon.description}</Text>
                      <Text style={styles.couponBottomCompany}>{coupon.company}</Text>
                    </View>
                    <View style={styles.couponBottomRight}>
                      <Text style={styles.couponSaveTag}>
                        SAVE{extractDiscountFromDescription(coupon.description)}
                      </Text>
                      <Text style={styles.couponExpiry}>
                        Valid until {new Date(coupon.expiryDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noCouponsContainer}>
                <Ionicons name="ticket-outline" size={48} color="#666" />
                <Text style={styles.noCouponsText}>No coupons yet</Text>
                <Text style={styles.noCouponsSubtext}>Spin the wheel to earn your first coupon!</Text>
              </View>
            )}
          </BlurView>
        </ScrollView>
      </SafeAreaView>
      
      <SpinWheelModal />
      
      <CouponModal
        visible={showCouponModal}
        onClose={handleCloseCouponModal}
        coupon={selectedCoupon}
      />
    </View>
  );
};

// Helper function to extract discount percentage from description
const extractDiscountFromDescription = (description: string): string => {
  const match = description.match(/(\d+)%/);
  return match ? match[1] : '20';
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1, paddingHorizontal: 15 },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: 'white',
  },
  headerIcon: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section Cards
  sectionCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 35,
    height: 35,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    lineHeight: 20,
    marginBottom: 6
  },
  
  // Action Buttons
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#666',
  },

  // Referral Section
  referralCodeContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  referralLabel: {
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 8,
  },
  referralCodeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  referralCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
  },
  referralStats: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 4,
  },
  copyButton: {
    position: 'absolute',
    top: 36,
    right: 16,
    padding: 8,
  },
  inviteButton: {
    flexDirection: 'row',
    backgroundColor: '#071014ff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 600,
  },

  // Referred Users Section
  referredUsersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownIcon: {
    padding: 1,
    marginRight: 15
  },
  referredUsersDropdown: {
    marginTop: 10,
  },
  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  referredUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  userDetails: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  // userBadge: {
  //   backgroundColor: 'rgba(0, 122, 255, 0.2)',
  //   paddingHorizontal: 8,
  //   paddingVertical: 4,
  //   borderRadius: 12,
  // },
  // userBadgeText: {
  //   fontSize: 12,
  //   color: '#007AFF',
  //   fontWeight: '600',
  // },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#A1A1AA',
    marginLeft: 8,
    fontSize: 14,
  },
  noReferredUsersContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noReferredUsersText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A1A1AA',
    marginTop: 12,
    marginBottom: 6,
  },
  noReferredUsersSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Coupons Section
  sectionHeaderWithTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  largeSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modernCouponCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F3F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  couponImageSection: {
    flexDirection: 'row',
    height: 120,
  },
  couponPattern: {
    width: 140,
    backgroundColor: '#E8F5E8', // Light green background
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  patternDots: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 20,
  },
  couponBigText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E7D32',
    lineHeight: 40,
  },
  couponSmallText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: -5,
  },
  perforatedLine: {
    width: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 10,
  },
  perforationDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
  },
  couponInfoSection: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  couponCompanyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  couponDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  couponCode: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
  },
  couponBottomSection: {
    flexDirection: 'row',
    backgroundColor: '#2D2D2D',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponBottomLeft: {
    flex: 1,
  },
  couponBottomLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  couponBottomCompany: {
    fontSize: 12,
    color: '#AAA',
  },
  couponBottomRight: {
    alignItems: 'flex-end',
  },
  couponSaveTag: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  couponExpiry: {
    fontSize: 11,
    color: '#AAA',
  },
  
  // No Coupons State
  noCouponsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCouponsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A1A1AA',
    marginTop: 16,
    marginBottom: 8,
  },
  noCouponsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Spin Wheel Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 30,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    zIndex: 1000,
  },

  // Add refresh button styles
  refreshButton: {
    marginLeft: 'auto',
    padding: 8,
  },
});

export default RewardsScreen;
