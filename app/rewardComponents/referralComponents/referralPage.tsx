import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderSection } from './inviteHeader';
import { ReferralSection } from '../ReferralSection';
import { router } from 'expo-router';
import { authAPI, referralAPI } from '../../../services/api';
import * as Clipboard from 'expo-clipboard';

export default function InviteRewardsScreen() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [referredUsersDetails, setReferredUsersDetails] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingReferredUsers, setLoadingReferredUsers] = useState(false);

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

  const calculateEarnedPoints = (user: any) => {
    const count = referralCount(user);
    return count * 100;
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

  const handleCopyReferral = async () => {
    try {
      const referralCode = userProfile?.referralCode || '';
      if (referralCode) {
        await Clipboard.setStringAsync(referralCode);
        console.log('Referral code copied');
      }
    } catch (error) {
      console.error('Failed to copy referral code:', error);
    }
  };

  const handleLearnMoreReferral = () => {
    console.log('Learn more about referrals');
  };

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderSection />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderSection />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.referralWrapper}>
            <ReferralSection
              referralCode={userProfile?.referralCode || 'LOADING...'}
              totalReferrals={referralCount(userProfile)}
              onCopyPress={handleCopyReferral}
            />
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Invited: {referralCount(userProfile)}</Text>           
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Earned: {calculateEarnedPoints(userProfile)}pt</Text>
            </View>
          </View>

          <View style={styles.recentRecruitsSection}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Recent Recruits</Text>
              <View style={styles.titleUnderline} />
            </View>
            
            {loadingReferredUsers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4A90E2" />
                <Text style={styles.loadingText}>Loading recruits...</Text>
              </View>
            ) : referredUsersDetails.length > 0 ? (
              <View style={styles.recruitsList}>
                {referredUsersDetails.map((user) => (
                  <View key={user._id} style={styles.recruitCard}>
                    <View style={styles.avatarContainer}>
                      <Text style={styles.userAvatarText}>
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                    <View style={styles.recruitInfo}>
                      <Text style={styles.recruitName}>{user.name}</Text>
                      <Text style={styles.recruitStatus}>Joined {user.timeAgo}</Text>
                    </View>
                    <View style={styles.recruitReward}>
                      <Text style={styles.pointsText}>+100 Pts</Text>
                      <Ionicons name="logo-bitcoin" size={16} color="#FFD700" />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noRecruitsContainer}>
                <Ionicons name="people-outline" size={48} color="#666" />
                <Text style={styles.noRecruitsText}>No referrals yet</Text>
                <Text style={styles.noRecruitsSubtext}>
                  Share your referral code to start earning rewards!
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b0f',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  referralWrapper: {
    paddingTop: 50,
    paddingHorizontal: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
    marginTop: -40,
    gap: 6,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#D9D9D900',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#ffffff',
    alignItems: 'center',
  },
  statLabel: {
    color: '#A1A1AA',
    fontSize: 14,
    marginVertical: 4,
    fontWeight: '500',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  greeting: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  recentRecruitsSection: {
    marginTop: 30,
    paddingHorizontal: 16,
  },
  sectionTitleContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  titleUnderline: {
    height: 2,
    backgroundColor: '#FFCD0A',
    width: 120,
    marginTop: 2,
  },
  recruitsList: {
    gap: 12,
  },
  recruitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1b23',
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recruitInfo: {
    flex: 1,
  },
  recruitName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  recruitStatus: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  pendingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A1A1AA',
  },
  recruitReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  waitingText: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  backBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#0a0b0f',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  noRecruitsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noRecruitsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A1A1AA',
    marginTop: 12,
    marginBottom: 6,
  },
  noRecruitsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});



