import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SpinWheel from '../../components/SpinWheel';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, couponsAPI, referralAPI } from '../../services/api';
import { Coupon } from '../../types/Offer';

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
  const [refreshingCoupons, setRefreshingCoupons] = useState(false);
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

  // fetchCoupons to refresh after spin
  const fetchCoupons = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setRefreshingCoupons(true);
      
      const response = await couponsAPI.getUserCoupons();
      if (response.success) {
        setCoupons(response.data || []);
        console.log('✅ Coupons refreshed:', response.data?.length || 0);
      }
    } catch (error) {
      // console.error('Failed to fetch coupons:', error);
    } finally {
      if (showLoading) setRefreshingCoupons(false);
    }
  }, []);

  // load available coupons for spin wheel 
  const loadSpinWheelCoupons = async () => {
    try {
      const response = await couponsAPI.getSpinWheelCoupons();
      if (response.success && response.data && response.data.length > 0) {
        setAvailableSpinCoupons(response.data);
        
        // 4 segments from available coupons
        const availableCoupons = response.data;
        const segmentColors = ['#76b7ecff', '#93C5FD', '#60A5FA', '#3B82F6'];

        const couponSegments = Array.from({ length: 4 }, (_, index) => {
          const couponIndex = index % availableCoupons.length;
          const coupon = availableCoupons[couponIndex];
          
          return {
            color: segmentColors[index],
            text: `${coupon.company}`,
            reward: `${coupon.company} Coupon`,
            type: 'coupon' as const,
            couponData: {
              _id: coupon._id,
              company: coupon.company,
              description: coupon.description,
              couponCode: 'WINNER',
              expiryDate: coupon.expiryDate,
              imageLink: coupon.imageLink,
            },
            coupon: {
              company: coupon.company,
              imageLink: coupon.imageLink
            }
          };
        });

        setWheelSegments(couponSegments);
        console.log('✅ Spin wheel segments loaded:', couponSegments.length);
        console.log('📋 Segments:', couponSegments.map(s => s.text));
      } else {
        console.warn('⚠️ No coupons available for spin wheel');
        // Create fallback segments with sample data
        createFallbackSegments();
      }
    } catch (error) {
      // console.error('Failed to load spin wheel coupons:', error);
      createFallbackSegments();
    }
  };

  // Helper function to create fallback segments
  const createFallbackSegments = () => {
    const fallbackCoupons = [
      { company: 'Amazon', description: '20% off electronics' },
      { company: 'Netflix', description: '15% off subscription' },
      { company: 'Starbucks', description: '10% off beverages' },
      { company: 'Nike', description: '25% off footwear' }
    ];
    
    const segmentColors = ['#76b7ecff', '#93C5FD', '#76b7ecff', '#76b7ecff'];
    
    const fallbackSegments = fallbackCoupons.map((coupon, index) => ({
      color: segmentColors[index],
      text: coupon.company,
      reward: `${coupon.company} Coupon`,
      type: 'coupon' as const,
      couponData: {
        _id: `fallback-${index}`,
        company: coupon.company,
        description: coupon.description,
        couponCode: 'SAMPLE20',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        imageLink: `https://placehold.co/40x40/${segmentColors[index].replace('#', '')}/FFFFFF?text=${coupon.company.charAt(0)}`
      },
      coupon: {
        company: coupon.company,
        imageLink: `https://placehold.co/40x40/${segmentColors[index].replace('#', '')}/FFFFFF?text=${coupon.company.charAt(0)}`
      }
    }));
    
    setWheelSegments(fallbackSegments);
    console.log('✅ Fallback segments created');
  };

  const handleSpinWheel = () => {
    if (wheelSegments.length === 0) {
      Alert.alert('Loading', 'Spin wheel is still loading. Please try again.');
      return;
    }
    
    setShowSpinWheel(true);
  };

  const handleSpinComplete = useCallback(async (segment: Segment) => {
    console.log('🎉 Spin completed! Won:', segment);
    setHasSpun(true);
    
    const showSuccessAlert = (message: string) => {
      Alert.alert(
        'Congratulations! 🎉',
        message,
        [
          {
            text: 'View Coupons',
            onPress: () => {
              setShowSpinWheel(false);
              setTimeout(() => fetchCoupons(true), 300);
            }
          },
          {
            text: 'OK',
            onPress: () => {
              setShowSpinWheel(false);
              setTimeout(() => fetchCoupons(true), 300);
            }
          }
        ]
      );
    };

    const showErrorAlert = (message: string, closeModal: boolean = true) => {
      Alert.alert(
        'Oops!',
        message,
        [{ 
          text: 'OK', 
          onPress: () => {
            if (closeModal) {
              setShowSpinWheel(false);
            }
          }
        }]
      );
    };

    try {
      if (segment.type === 'coupon' && segment.couponData) {
        const successMessage = `You won a ${segment.couponData.company} coupon: ${segment.couponData.description}!`;
        
        try {
          const response = await couponsAPI.selectSpinWheelCoupon(segment.couponData._id);
          console.log('✅ Coupon selected successfully:', response);
          showSuccessAlert(successMessage);
          
        } catch (couponError: any) {
          console.error('❌ Failed to select coupon:', couponError);
          
          let errorMessage = 'Failed to add coupon to your account.';
          let shouldCloseModal = true;
          
          if (couponError.response?.status === 409) {
            errorMessage = 'You can only spin the wheel once a day!';
            shouldCloseModal = false; 
          } else if (couponError.response?.status === 404) {
            errorMessage = 'Coupon not available. Please try again.';
          }
          
          showErrorAlert(errorMessage, shouldCloseModal);
        }
      } else {
        console.warn('⚠️ Unexpected segment type:', segment.type);
        showErrorAlert('Something went wrong with your spin. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error processing spin reward:', error);
      showErrorAlert('There was an error processing your reward. Please try again.');
    }
  }, []); 

  const handleSpinPress = () => {
    setIsSpinning(true);
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
    
    if (arr.length > 0) {
      // user's own ID (self-reference), treat as 0
      if (arr.length === 1 && arr[0] === user._id) {
        return 0;
      }
      
      // filter out self-references 
      const validReferrals = arr.filter(referredUserId => referredUserId !== user._id);
      return validReferrals.length;
    }

    return 0;
  };

  // enhanced coupon descriptions based on company
  const getImprovedCouponDescription = (coupon: any): string => {
    const company = coupon.company?.toLowerCase() || '';
    const description = coupon.description || '';
    
    // Extract discount percentage
    const discountMatch = description.match(/(\d+)%/);
    const discount = discountMatch ? discountMatch[1] : '20';
    
    const companyDescriptions: { [key: string]: string } = {
      'amazon': `${discount}% off on electronics, books & more`,
      'netflix': `Get ${discount}% off your next subscription`,
      'spotify': `Save ${discount}% on Premium membership`,
      'uber': `${discount}% discount on your next 3 rides`,
      'airbnb': `${discount}% off accommodation bookings`,
      'dominos': `${discount}% off on pizza orders above $15`,
      'starbucks': `${discount}% off beverages and snacks`,
      'nike': `${discount}% off athletic wear and footwear`,
      'mcdonalds': `${discount}% off meals and combos`,
      'target': `${discount}% off home essentials & groceries`,
    };
    
    return companyDescriptions[company] || `${discount}% discount on your purchase`;
  };

  const handleCopyCouponCode = async (coupon: any) => {
    try {
      const code = coupon.couponCode || `SAVE${extractDiscountFromDescription(coupon.description)}`;
      await Clipboard.setStringAsync(code);
      
      Alert.alert(
        'Code Copied! 📋',
        `Coupon code "${code}" has been copied to your clipboard.`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('Failed to copy coupon code:', error);
      Alert.alert('Error', 'Failed to copy coupon code. Please try again.');
    }
  };

  // Fetch details of referred users
  const fetchReferredUsersDetails = async () => {
    if (!userProfile?.referredUsers || userProfile.referredUsers.length === 0) {
      return;
    }

    setLoadingReferredUsers(true);
    try {
      // endpoint to get actual user names
      const response = await referralAPI.getReferredUsers();
      
      if (response.success && response.data) {
        const referredUsers = response.data.map((user: any, index: number) => {
          const userId = userProfile.referredUsers[index] || `temp-${index}`;
          const timestamp = typeof userId === 'string' && userId.length >= 8 
            ? parseInt(userId.substring(0, 8), 16) * 1000 
            : Date.now();
          const joinDate = new Date(timestamp);
          const firstName = user.firstName || '';
          const lastName = user.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim() || `User ${index + 1}`;
          
          return {
            _id: userId,
            name: fullName,
            email: user.email || `user${index + 1}@example.com`,
            joinedDate: joinDate.toLocaleDateString(),
            shortId: typeof userId === 'string' ? userId.substring(0, 8) : 'temp',
          };
        });
        
        setReferredUsersDetails(referredUsers);
      } else {
        const validUserIds = userProfile.referredUsers.filter((userId: string) => userId !== userProfile._id);
        
        const referredUsers = validUserIds.map((userId: string, index: number) => {
          const timestamp = parseInt(userId.substring(0, 8), 16) * 1000;
          const joinDate = new Date(timestamp);
          
          return {
            _id: userId,
            name: `Referred User ${index + 1}`,
            email: `user-${userId.substring(0, 6)}@app.com`,
            joinedDate: joinDate.toLocaleDateString(),
            shortId: userId.substring(0, 8),
          };
        });
        
        setReferredUsersDetails(referredUsers);
      }
    } catch (error) {
      console.error('Failed to fetch referred users details:', error);
      
      // use ObjectId extraction method
      const validUserIds = userProfile.referredUsers.filter((userId: string) => userId !== userProfile._id);
      
      const referredUsers = validUserIds.map((userId: string, index: number) => {
        const timestamp = parseInt(userId.substring(0, 8), 16) * 1000;
        const joinDate = new Date(timestamp);
        
        return {
          _id: userId,
          name: `Referred User ${index + 1}`,
          email: `user-${userId.substring(0, 6)}@app.com`,
          joinedDate: joinDate.toLocaleDateString(),
          shortId: userId.substring(0, 8),
        };
      });
      
      setReferredUsersDetails(referredUsers);
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
          visible={showSpinWheel}
        />
      </View>
    </Modal>
  );

  const handleNavigateToLootBoxes = () => {
    router.push('/lootboxes');
  };

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

          {/* LootBox Section */}
          <BlurView intensity={40} tint="dark" style={[styles.sectionCard, styles.lootboxCard]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="cube-outline" size={28} color="#007AFF" />
              </View>
              <View style={styles.sectionInfo}>
                <Text style={styles.sectionTitle}>LootBoxes</Text>
                <Text style={styles.sectionSubtitle}>
                  Open loot boxes containing rare rewards, bonus points and surprise items!
                </Text>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={styles.lootboxCta}
              onPress={handleNavigateToLootBoxes}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#0EA5E9', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.lootboxCtaGradient}
              >
                <Ionicons name="cube" size={18} color="#ffffff" />
                <Text style={styles.lootboxCtaText}>Open LootBoxes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>

          {/* Spin the Wheel Daily Section */}
          <BlurView intensity={40} tint="dark" style={[styles.sectionCard, styles.wheelCard]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="disc-outline" size={28} color="#007AFF" />

              </View>
              <View style={styles.sectionInfo}>
                <Text style={styles.sectionTitle}>Spin the Wheel Daily!</Text>
                <Text style={styles.sectionSubtitle}>
                  Spin the wheel. Try your luck to win amazing rewards!
                </Text>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[
                styles.spinCta,
                (wheelSegments.length === 0) && styles.spinCtaDisabled
              ]}
              onPress={handleSpinWheel}
              disabled={wheelSegments.length === 0}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#0EA5E9', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.spinCtaGradient}
              >
                <Ionicons name="game-controller-outline" size={18} color="#ffffff" />
                <Text style={styles.spinCtaText}>
                  {wheelSegments.length === 0 ? 'Loading...' : 'Spin now'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Meta row */}
            <View style={styles.cardMetaRow}>
              <Ionicons name="time-outline" size={15} color="#A1A1AA" />
              <Text style={styles.metaText}>One spin every 24 hours</Text>
            </View>
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
                    Earn 100 points for each of your first 5 referrals 
                  </Text>
                </View>
              </View>
              <View style={styles.dropdownIcon}>
                <Ionicons 
                  name={showReferredUsers ? "chevron-up" : "chevron-down"} 
                  size={22} 
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
                        </View>
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

          {/* Your Coupons Section - Updated without modal opening */}
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
                <View 
                  key={coupon._id} 
                  style={styles.modernCouponCard}
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
                      <Text style={styles.couponDescription}>
                        {getImprovedCouponDescription(coupon)}
                      </Text>
                      
                      {/* Copy Code Button */}
                      <TouchableOpacity
                        style={styles.copyCodeButton}
                        onPress={() => handleCopyCouponCode(coupon)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="copy-outline" size={16} color="#007AFF" />
                        <Text style={styles.copyCodeText}>Copy Code</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.couponBottomSection}>
                    <View style={styles.couponBottomLeft}>
                      <Text style={styles.couponBottomCompany}>{coupon.company}</Text>
                    </View>
                    <View style={styles.couponBottomRight}>
                      <Text style={styles.couponSaveTag}>
                        SAVE{extractDiscountFromDescription(coupon.description)}%
                      </Text>
                      <Text style={styles.couponExpiry}>
                        Valid until {new Date(coupon.expiryDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
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
    </View>
  );
};

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
  wheelCard: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  lootboxCard: {
    paddingTop: 16,
    paddingBottom: 16,
    borderColor: 'rgba(255, 255, 255, 0.1)', 
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
    marginBottom: 4,
    marginRight: 8
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
    padding: 8,
    marginHorizontal: -18
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
    height: 140, 
  },
  couponPattern: {
    width: 140,
    backgroundColor: '#E8F5E8', 
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
    lineHeight: 18,
  },
  couponCode: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  
  copyCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    // marginTop: 40
  },
  copyCodeText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
    fontSize: 17  ,
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
  refreshButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  spinCta: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 6,
  },
  spinCtaGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  spinCtaText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  spinCtaDisabled: { opacity: 0.6 },

  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaText: { color: '#A1A1AA', fontSize: 13 },

  // LootBox  
  lootboxCta: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 6,
  },
  lootboxCtaGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  lootboxCtaText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default RewardsScreen;
