import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, ViewToken, Dimensions, Linking, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, offersAPI } from '../../services/api';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

// Define types at module level
type OfferTask = {
  id: string;
  title: string;
  description: string;
  reward: number;
  iqGain: number;
  image: string;
  difficulty: string;
  minimumIq: number;
  creativeLink: string | null;
  penaltyTime: number;
  type?: string;
};

const OfferScreen: React.FC = () => {
  // ALL HOOKS MUST BE AT THE TOP LEVEL - ALWAYS CALLED IN SAME ORDER
  const { authState } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [allTasks, setAllTasks] = useState<OfferTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    iq?: number;
    coins?: number;
    inrBalance?: number;
  } | null>(null);

  // ALWAYS call these refs - no conditional logic
  const flatListRef = useRef<FlatList<any> | null>(null);
  const onViewableItemsChangedRef = useRef(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
    if (viewableItems && viewableItems[0]) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  });

  // Helper functions
  const getDifficultyFromIQ = (minimumIq: number): string => {
    if (minimumIq <= 20) return 'Beginner';
    if (minimumIq <= 40) return 'Easy';
    if (minimumIq <= 60) return 'Medium';
    if (minimumIq <= 80) return 'Hard';
    return 'Expert';
  };

  const cleanTaskTitle = (type: string): string => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const mapBackendTaskToFrontend = (backendTask: any): OfferTask => ({
    id: backendTask._id || `task-${Date.now()}`,
    title: cleanTaskTitle(backendTask.type || 'Labelling Task'),
    description: backendTask.description || 'Complete this task to earn rewards',
    reward: backendTask.rewards?.coinsOnCorrect || 0,
    iqGain: backendTask.rewards?.iqDeltaOnCorrect || 0,
    image: backendTask.imageLink || 'https://via.placeholder.com/300x140/2a2b33/fff?text=Task',
    difficulty: getDifficultyFromIQ(backendTask.minimumIq || 0),
    minimumIq: backendTask.minimumIq || 0,
    // Always use S3 creative link instead of backend's example.com
    creativeLink: 'https://label-offers-creatives.s3.us-east-1.amazonaws.com/index.html',
    penaltyTime: backendTask.penaltyTime || 1,
    type: backendTask.type
  });

  // Handle task selection
  const handleTaskSelect = (task: OfferTask) => {
    console.log('🎯 Task selected:', task);
    
    // Navigate to creative screen with task data
    router.push({
      pathname: '/creative-task',
      params: {
        labelOfferId: task.id, // Changed from taskId to labelOfferId
        creativeLink: task.creativeLink || 'https://label-offers-creatives.s3.us-east-1.amazonaws.com/index.html',
        taskTitle: task.title,
        reward: task.reward.toString(),
        iqGain: task.iqGain.toString(),
        taskType: task.type || 'labelling-task'
      }
    });
  };

  // Fetch tasks from backend
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📡 Fetching tasks from backend...');
        const response = await offersAPI.getAllOffers();
        console.log('✅ Backend response:', response);
        
        if (response.success && response.data) {
          const mappedTasks = response.data.map(mapBackendTaskToFrontend);
          console.log('🔄 Mapped tasks:', mappedTasks);
          setAllTasks(mappedTasks);
        } else {
          throw new Error('Invalid response format from backend');
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch tasks:', error);
        setError(error.message || 'Failed to load tasks');
        
        setAllTasks([{
          id: 'fallback-1',
          title: 'Label Recognition Task',
          description: 'Label images to earn rewards',
          reward: 100,
          iqGain: 10,
          image: 'https://via.placeholder.com/300x140/2a2b33/fff?text=Offline',
          difficulty: 'Beginner',
          minimumIq: 0,
          creativeLink: 'https://label-offers-creatives.s3.us-east-1.amazonaws.com/index.html',
          penaltyTime: 1,
          type: 'labelling-task',
        }]);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if user is authenticated
    if (authState?.authenticated) {
      fetchTasks();
    }
  }, [authState?.authenticated]);

  // Fetch user profile data
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await authAPI.getUser();
        const userData = response.user || response.data || response;
        
        if (userData && (userData.firstName || userData.username || userData.name || userData.email)) {
          setUserProfile({
            name: userData.firstName || userData.username || userData.name || 'User',
            email: userData.email,
            iq: userData.iq || 0,
            coins: userData.coins || 0,
            inrBalance: userData.inrBalance || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // fallback data
        setUserProfile({
          name: 'User',
          email: 'user@example.com',
          iq: 0,
          coins: 0,
          inrBalance: 0,
        });
      }
    };

    if (authState?.authenticated) {
      fetchUserProfile();
    }
  }, [authState?.authenticated]);

  // Social media handlers
  const handleFollowTwitter = async () => {
    try {
      // Try to open Twitter app first, fallback to web
      const twitterUrl = 'twitter://user?screen_name=akaispacexyz'; 
      const webUrl = 'https://twitter.com/akaispacexyz'; 
      
      const canOpen = await Linking.canOpenURL(twitterUrl);
      if (canOpen) {
        await Linking.openURL(twitterUrl);
      } else {
        await Linking.openURL(webUrl);
      }
      
      // You could also call an API to mark this task as completed and award tokens
      // await socialAPI.completeSocialOffer('twitter-follow');
      
    } catch (error) {
      console.error('Failed to open Twitter:', error);
      Alert.alert('Error', 'Failed to open Twitter. Please try again.');
    }
  };

  const handleReferFriend = async () => {
    try {
      // Get user's referral code (add this to your user profile)
      // const userReferralCode = userProfile?.referralCode || 'USER123';
      const userReferralCode = 'USER123';
      
      const shareMessage = `🎯 Join me on OfferWall and earn tokens by completing tasks! Use my referral code: ${userReferralCode}\n\nDownload the app: https://play.google.com/store/apps/details?id=com.offerwall.app`;
      
      const result = await Share.share({
        message: shareMessage,
        title: 'Join OfferWall - Earn Tokens!',
        url: 'https://play.google.com/store/apps/details?id=com.offerwall.app', 
      });

      if (result.action === Share.sharedAction) {
        // User shared successfully - you could award tokens here
        console.log('Referral shared successfully');
        // await socialAPI.completeSocialOffer('refer-friend');
      }
    } catch (error) {
      console.error('Failed to share referral:', error);
      Alert.alert('Error', 'Failed to share referral. Please try again.');
    }
  };

  const handleShareProgress = async () => {
    try {
      const progressMessage = `I just completed another task on OfferWall! 🔥
Current IQ: ${userProfile?.iq || 0}
Tokens earned: ${userProfile?.coins || 0}

Join me and start earning!`;

      await Share.share({
        message: progressMessage,
        title: 'My OfferWall Progress!',
      });
    } catch (error) {
      console.error('Failed to share progress:', error);
      Alert.alert('Error', 'Failed to share progress. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            {/* Avatar with first letter */}
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userProfile?.name || 'Loading...'}</Text>
              <Text style={styles.userIQ}>IQ: {userProfile?.iq || 0}</Text>
            </View>
          </View>
          
          {/* translucent balance card */}
          <View style={styles.balanceCard}>
            <View style={{flexDirection: 'row'}}>
              <Text style={styles.balanceTokens}>{userProfile?.coins?.toLocaleString() || 0}</Text>
              <Text style={styles.balanceLabel}> Tokens</Text>
            </View>
            <View style={styles.balanceDivider} />
            <Text style={styles.balanceInr}>₹{((userProfile?.inrBalance || 0)).toFixed(2)}</Text>
          </View>
        </View>

        {/* Tasks for You Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks for you</Text>
            {error && (
              <TouchableOpacity onPress={() => window.location.reload()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {error && (
            <Text style={styles.errorText}>⚠️ {error}</Text>
          )}
          
          {/* Horizontal Carousel of All Tasks */}
          <FlatList
            ref={flatListRef}
            data={allTasks}
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id)}
            snapToAlignment="start"
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + 16} // card width + margin
            contentContainerStyle={{ paddingRight: 0 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.taskCard}
                onPress={() => handleTaskSelect(item)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.image }} style={styles.taskCardImage} />
                <View style={styles.taskCardInfo}>
                  <Text style={styles.taskCardTitle}>{item.title}</Text>
                  <Text style={styles.taskCardDescription}>{item.description}</Text>
                  <View style={styles.taskCardReward}>
                    <Text style={styles.taskCardTokens}>Reward: {item.reward} Tokens</Text>
                    <View style={styles.iqBadge}>
                      <Ionicons name='apps-outline' size={12} color="#fff" />
                      <Text style={styles.taskCardIQ}>IQ + {item.iqGain}</Text>
                    </View>
                  </View>
                  <View style={[styles.difficultyBadge, getDifficultyColor(item.difficulty)]}>
                    <Text style={styles.difficultyText}>{item.difficulty}</Text>
                  </View>
                  <View style={styles.taskAction}>
                    <Text style={styles.taskActionText}>Tap to Start →</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            onViewableItemsChanged={onViewableItemsChangedRef.current}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          />

          {/* Dots indicator */}
          <View style={styles.dotsContainer}>
            {allTasks.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Social Tasks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Tasks</Text>
          
          {/* Follow Us on X */}
          <TouchableOpacity style={styles.socialTaskCard}>
            <View style={styles.socialTaskLeft}>
              <View style={styles.socialIcon}>
                <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
              </View>
              <View style={styles.socialTaskInfo}>
                <Text style={styles.socialTaskTitle}>Follow Us on X</Text>
                <Text style={styles.socialTaskReward}>+50 Tokens</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.followButton} onPress={handleFollowTwitter}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Refer a Friend */}
          <TouchableOpacity style={styles.socialTaskCard}>
            <View style={styles.socialTaskLeft}>
              <View style={styles.socialIcon}>
                <Ionicons name="person-add-outline" size={20} color="white" />
              </View>
              <View style={styles.socialTaskInfo}>
                <Text style={styles.socialTaskTitle}>Refer a Friend</Text>
                <Text style={styles.socialTaskReward}>+200 Tokens</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.referButton} onPress={handleReferFriend}>
              <Text style={styles.referButtonText}>Refer</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Share your progress */}
          <TouchableOpacity style={styles.socialTaskCard} onPress={handleShareProgress}>
            <View style={styles.socialTaskLeft}>
              <View style={styles.socialIcon}>
                <Ionicons name="share-outline" size={20} color="white" />
              </View>
              <View style={styles.socialTaskInfo}>
                <Text style={styles.socialTaskTitle}>Share your progress</Text>
                <Text style={styles.socialTaskReward}>+25 Tokens</Text>
              </View>
            </View>
            <View style={styles.completedBadge}>
              <Ionicons name="share-social" size={12} color="#4CAF50" />
              <Text style={styles.completedText}>Share</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function for difficulty colors
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy': return { backgroundColor: '#4CAF50' };
    case 'Medium': return { backgroundColor: '#FF9800' };
    case 'Hard': return { backgroundColor: '#f44336' };
    case 'Expert': return { backgroundColor: '#9C27B0' };
    default: return { backgroundColor: '#666' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b0f',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
     width: 50,
     height: 50,
     borderRadius: 25,
     backgroundColor: '#FDE68A',
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: '#EF4444',
     marginRight: 12,
   },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
   userInfo: {
     justifyContent: 'center',
     flex: 1,
   },
   userName: {
     color: '#fff',
     fontSize: 16,
     fontWeight: 'bold',
     marginBottom: 2,
   },
   userIQ: {
     color: '#888',
     fontSize: 13,
   },
  
  // Translucent balance card (right side)
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 35,
    paddingVertical: 7,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    minWidth: 90,
  },
  balanceTokens: {
     color: '#fff',
     fontSize: 15,
     fontWeight: '600',
     marginBottom: 2,
   },
   balanceLabel: {
     color: '#888',
     fontSize: 15,
     marginBottom: 2,
   },
   balanceDivider: {
     width: '100%',
     height: 1,
     backgroundColor: 'rgba(255,255,255,0.1)',
     marginBottom: 2,
   },
   balanceInr: {
     color: '#4CAF50',
     fontSize: 14,
     fontWeight: '600',
   },

  // Section
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  // carousel with full width
  taskCard: {
    backgroundColor: '#1a1b23',
    borderRadius: 16,
    marginRight: 16,
    width: CARD_WIDTH,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2b33',
  },
  taskCardImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
    backgroundColor: '#2a2b33',
  },
  taskCardInfo: {
    padding: 12,
  },
  taskCardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  taskCardDescription: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  taskCardReward: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskCardTokens: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  iqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  taskCardIQ: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#0ea5ff',
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  // Social Task Cards
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
  socialTaskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2b33',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  socialTaskInfo: {
    flex: 1,
  },
  socialTaskTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  socialTaskReward: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 2,
  },
  
  // Action Buttons
  followButton: {
    // backgroundColor: '#1DA1F2',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  referButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  referButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2e1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  retryText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  taskAction: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderRadius: 6,
    alignSelf: 'center',
  },
  taskActionText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default OfferScreen;