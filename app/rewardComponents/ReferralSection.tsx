import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authAPI, referralAPI } from '../../services/api';
import { FONTS } from '../../constants/fonts';

interface ReferralSectionProps {
  referralCode?: string;
  totalReferrals?: number;
  onCopyPress?: () => void;
  onLearnMorePress?: () => void;
}

export const ReferralSection: React.FC<ReferralSectionProps> = ({
  referralCode = 'DE7P4P8E',
  totalReferrals = 2,
  onCopyPress,
  onLearnMorePress,
}) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [referredUsersDetails, setReferredUsersDetails] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingReferredUsers, setLoadingReferredUsers] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
      fetchUserProfile();
    }, []);
  
    useEffect(() => {
      if (userProfile) {
        fetchReferredUsersDetails();
      }
    }, [userProfile]);
  
    const fetchUserProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await authAPI.getUser();
        const userData = response.user || response.data || response;
        setUserProfile(userData);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };
  
    const referralCount = (user: any) => {
      if (!user) return 0;
      if (typeof user.referredCount === 'number') return user.referredCount;
  
      const arr: string[] = Array.isArray(user.referredUsers) ? user.referredUsers : [];
      
      if (arr.length > 0) {
        if (arr.length === 1 && arr[0] === user._id) {
          return 0;
        }
        const validReferrals = arr.filter((referredUserId: string) => referredUserId !== user._id);
        return validReferrals.length;
      }
      return 0;
    };
  
  const fetchReferredUsersDetails = async () => {
    if (!userProfile?.referredUsers || userProfile.referredUsers.length === 0) {
      setReferredUsersDetails([]);
      return;
    }

    setLoadingReferredUsers(true);
    try {
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
            timeAgo: getTimeAgo(timestamp),
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
            timeAgo: getTimeAgo(timestamp),
            shortId: userId.substring(0, 8),
          };
        });
        
        setReferredUsersDetails(referredUsers);
      }
    } catch (error) {
      console.error('Failed to fetch referred users details:', error);
      const validUserIds = userProfile.referredUsers.filter((userId: string) => userId !== userProfile._id);
      
      const referredUsers = validUserIds.map((userId: string, index: number) => {
        const timestamp = parseInt(userId.substring(0, 8), 16) * 1000;
        const joinDate = new Date(timestamp);
        
        return {
          _id: userId,
          name: `Referred User ${index + 1}`,
          email: `user-${userId.substring(0, 6)}@app.com`,
          joinedDate: joinDate.toLocaleDateString(),
          timeAgo: getTimeAgo(timestamp),
          shortId: userId.substring(0, 8),
        };
      });
      
      setReferredUsersDetails(referredUsers);
    } finally {
      setLoadingReferredUsers(false);
    }
  };
  
  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };
  
  const showSnackbarMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
    
    setTimeout(() => {
      setShowSnackbar(false);
    }, 2000);
  };
  
  const handleCopy = () => {
    Clipboard.setStringAsync(displayReferralCode);
    showSnackbarMessage('Referral code copied');
    if (onCopyPress) onCopyPress();
  };

  const handleLearnMore = () => {
    if (onLearnMorePress) {
      router.replace('/rewardComponents/referralComponents/referralPage');
    }
  };

  const displayReferralCode = userProfile?.referralCode || referralCode;
  const displayTotalReferrals = userProfile ? referralCount(userProfile) : totalReferrals;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFEE58', '#FFEBA3', '#FFB917']}
        locations={[0, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradientContainer}
      >
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Invite & Earn</Text>
            <Text style={styles.subtitle}>Give points, get points. Win–win!</Text>

            <View style={styles.codeCard}>
              <LinearGradient
                colors={['#D9D9D9', '#EADE58']}
                locations={[0, 0.4]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.codeCardGradient}
              >
                <Text style={styles.codeHeaderText}>Your Secret Route</Text>
                <View style={styles.codeRow}>
                  <Text style={styles.codeText}>{displayReferralCode}</Text>
                  <TouchableOpacity onPress={handleCopy} style={styles.copyButton} activeOpacity={0.8}>
                    <Ionicons name="copy-outline" size={14} color="#2D2D2D" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.codeSubtext}>Total referrals: {displayTotalReferrals}</Text>
              </LinearGradient>
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={handleLearnMore} style={styles.learnButtonWrapper}>
              <LinearGradient
                colors={['#D9D9D9', '#ECCF90']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.learnButtonGradient}
              >
                <View style={styles.learnButtonContent}>
                  <Text style={styles.learnButtonText}>Learn More</Text>
                  <Ionicons name="arrow-forward" size={12} color="#000" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.imageContainer} pointerEvents="none">
        <Image
          source={require('../../assets/app-images/referral_pandas.png')}
          style={styles.pandasImage}
          resizeMode="contain"
        />
      </View>

      {showSnackbar && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: -30,
    marginBottom: 60,
    width: 340,
    alignSelf: 'flex-start',
    position: 'relative'
  },
  gradientContainer: {
    borderRadius: 20,
    height: 160,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: '100%',
  },
  textContainer: {
    width: 190,
    justifyContent: 'center',
    zIndex: 3,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.heading.bold,
    color: '#2D2D2D',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#3A3A3A',
    marginBottom: 10,
    fontFamily: FONTS.body.regular,
  },
  codeCard: {
    width: 130,
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6D08A',
    overflow: 'hidden',
    marginBottom: 6,
  },
  codeCardGradient: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  codeHeaderText: {
    fontSize: 9,
    color: '#5A5A5A',
    fontWeight: '600',
    marginBottom: 2,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D2D2D',
    letterSpacing: 0.6,
  },
  copyButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E6D08A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F1DE',
  },
  codeSubtext: {
    fontSize: 10,
    color: '#5A5A5A',
    marginTop: 2,
  },
  learnButtonWrapper: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1A950',
    overflow: 'hidden',
  },
  learnButtonGradient: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  learnButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  learnButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  imageContainer: {
    position: 'absolute',
    right: -30,
    top: -41,
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  pandasImage: {
    width: '100%',
    height: '100%'
  },
  snackbar: {
    position: 'absolute',
    bottom: -220,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  },
  snackbarText: {
    color: 'white',
    fontSize: 14,
    fontFamily: FONTS.body.medium,
  },
});
