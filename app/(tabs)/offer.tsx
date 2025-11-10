import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, ViewToken, Dimensions, Linking, Share, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, offersAPI, socialAPI } from '../../services/api';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

// types at module level
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

// Add types for social offers
type SocialOffer = {
  _id: string;
  imageLink: string;
  type: string;
  description: string;
  redirectLink: string;
  reward: {
    coinsOnCorrect: number;
    iqDeltaOnCorrect: number;
    iqDeltaOnIncorrect: number;
  };
  completed?: boolean;
};

const OfferScreen: React.FC = () => {
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
  } | null>(null);
  
  // tab state for task types
  const [activeTaskTab, setActiveTaskTab] = useState<'audio' | 'image' | 'video'>('video');

  const flatListRef = useRef<FlatList<any> | null>(null);
  const onViewableItemsChangedRef = useRef(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
    if (viewableItems && viewableItems[0]) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  });

  // social offers
  const [socialOffers, setSocialOffers] = useState<SocialOffer[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [completingSocialOffer, setCompletingSocialOffer] = useState<string | null>(null);

  // helper functions
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

  const mapBackendTaskToFrontend = (backendTask: any): OfferTask => {
    // determine creative link based on task type
    let creativeLink = 'https://label-offers-creatives.s3.us-east-1.amazonaws.com/full-video.html';
    let taskType = backendTask.type || 'video-labelling';
    
    // map diff task types to their creative links
    if (backendTask.type?.includes('audio')) {
      creativeLink = 'https://label-offers-creatives.s3.us-east-1.amazonaws.com/audio-task.html';
      taskType = 'audio-labelling';
    } else if (backendTask.type?.includes('image')) {
      creativeLink = 'https://label-offers-creatives.s3.us-east-1.amazonaws.com/image-task.html';
      taskType = 'image-labelling';
    }
    
    return {
      id: backendTask._id || `task-${Date.now()}`,
      title: cleanTaskTitle(taskType),
      description: backendTask.description || 'Complete this task to earn rewards',
      reward: backendTask.rewards?.coinsOnCorrect || 0,
      iqGain: backendTask.rewards?.iqDeltaOnCorrect || 0,
      image: backendTask.imageLink || 'https://via.placeholder.com/300x140/2a2b33/fff?text=Task',
      difficulty: getDifficultyFromIQ(backendTask.minimumIq || 0),
      minimumIq: backendTask.minimumIq || 0,
      creativeLink: creativeLink,
      penaltyTime: backendTask.penaltyTime || 1,
      type: taskType
    };
  };

  // check if task is locked based on user IQ
  const isTaskLocked = (task: OfferTask): boolean => {
    const userIQ = userProfile?.iq || 0;
    return userIQ < task.minimumIq;
  };

  // Handle task selection with IQ check
  const handleTaskSelect = (task: OfferTask) => {
    console.log('🎯 Task selected:', task);
    
    // Check if task is locked due to insufficient IQ
    if (isTaskLocked(task)) {
      Alert.alert(
        '🔒 Task Locked',
        `You need at least ${task.minimumIq} IQ to unlock this task. Current IQ: ${userProfile?.iq || 0}.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // navigate to creative screen with task data
    router.push({
      pathname: '/creative-task',
      params: {
        labelOfferId: task.id,
        creativeLink: task.creativeLink || 'https://label-offers-creatives.s3.us-east-1.amazonaws.com/full-video.html',
        taskTitle: task.title,
        reward: task.reward.toString(),
        iqGain: task.iqGain.toString(),
        taskType: task.type || 'labelling-task'
      }
    });
  };

  // fetch tasks from backend
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
          creativeLink: 'https://label-offers-creatives.s3.us-east-1.amazonaws.com/full-video.html',
          penaltyTime: 1,
          type: 'labelling-task',
        }]);
      } finally {
        setLoading(false);
      }
    };

    // fetch if user is authenticated
    if (authState?.authenticated) {
      fetchTasks();
    }
  }, [authState?.authenticated]);

  // fetch user profile data
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
          });
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setUserProfile({
          name: 'User',
          email: 'user@example.com',
          iq: 0,
          coins: 0,
        });
      }
    };

    if (authState?.authenticated) {
      fetchUserProfile();
    }
  }, [authState?.authenticated]);

  // fetch social offers from backend
  const fetchSocialOffers = async () => {
    setLoadingSocial(true);
    try {
      console.log('📡 Fetching social offers from backend...');
      const response = await socialAPI.getAllSocialOffers();
      console.log('✅ Social offers response:', response);
      
      if (response.success && response.data) {
        setSocialOffers(response.data);
      }
    } catch (error) {
      console.error('❌ Failed to fetch social offers:', error);
      // Set empty array on error
      setSocialOffers([]);
    } finally {
      setLoadingSocial(false);
    }
  };

  // fetch social offers when component mounts
  useEffect(() => {
    if (authState?.authenticated) {
      fetchSocialOffers();
    }
  }, [authState?.authenticated]);

  // handle completing a social offer
  const handleCompleteSocialOffer = async (offer: SocialOffer) => {
    // First, try to open the redirect link
    try {
      const canOpen = await Linking.canOpenURL(offer.redirectLink);
      if (canOpen) {
        await Linking.openURL(offer.redirectLink);
      }
    } catch (error) {
      console.error('Failed to open link:', error);
      Alert.alert('Error', 'Failed to open link. Please try again.');
      return;
    }

    // Then mark as completed in backend
    setCompletingSocialOffer(offer._id);
    
    try {
      console.log('🎯 Completing social offer:', offer._id);
      const response = await socialAPI.completeSocialOffer(offer._id);
      
      if (response.success) {
        // Update local state
        setSocialOffers(prev => 
          prev.map(o => o._id === offer._id ? { ...o, completed: true } : o)
        );
        
        // update user points
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            coins: response.coins || ((userProfile.coins || 0) + offer.reward.coinsOnCorrect)
          });
        }
        
        // Show success message
        Alert.alert(
          'Task Completed! 🎉',
          `You earned ${offer.reward.coinsOnCorrect} points!`,
          [{ text: 'Great!', style: 'default' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Failed to complete social offer:', error);
      
      let errorMessage = 'Failed to complete task. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      if (error.response?.status !== 409) {
        Alert.alert('Error', errorMessage);
      } else {
        // task completed, update local state
        setSocialOffers(prev => 
          prev.map(o => o._id === offer._id ? { ...o, completed: true } : o)
        );
      }
    } finally {
      setCompletingSocialOffer(null);
    }
  };

  // get social offer icon based on type
  const getSocialOfferIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('twitter') || lowerType.includes('x')) return 'logo-twitter';
    if (lowerType.includes('refer') || lowerType.includes('friend')) return 'person-add-outline';
    if (lowerType.includes('share')) return 'share-outline';
    if (lowerType.includes('follow')) return 'person-add';
    if (lowerType.includes('like')) return 'heart-outline';
    if (lowerType.includes('discord')) return 'logo-discord';
    if (lowerType.includes('telegram')) return 'send';
    return 'gift-outline';
  };

  // Get social offer color based on type
  const getSocialOfferColor = (type: string): string => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('twitter') || lowerType.includes('x')) return '#1DA1F2';
    if (lowerType.includes('discord')) return '#5865F2';
    if (lowerType.includes('telegram')) return '#0088cc';
    return '#ffffff';
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

  // Filter tasks based on active tab
  const getFilteredTasks = (): OfferTask[] => {
    return allTasks.filter(task => {
      if (activeTaskTab === 'audio') {
        return task.type?.includes('audio');
      } else if (activeTaskTab === 'image') {
        return task.type?.includes('image');
      } else {
        return task.type?.includes('video') || !task.type?.includes('audio') && !task.type?.includes('image');
      }
    });
  };

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
          
          {/* Updated balance card - removed INR */}
          <View style={styles.balanceCard}>
            <View style={{flexDirection: 'row'}}>
              <Text style={styles.balanceTokens}>{userProfile?.coins?.toLocaleString() || 0}</Text>
              <Text style={styles.balanceLabel}> Points</Text>
            </View>
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

          {/* Tab Navigation for Task Types */}
          <View style={styles.taskTabContainer}>
            <TouchableOpacity
              style={[
                styles.taskTab,
                activeTaskTab === 'audio' && styles.taskTabActive
              ]}
              onPress={() => {
                setActiveTaskTab('audio');
                setActiveIndex(0);
              }}
            >
              <Ionicons 
                name="musical-notes" 
                size={16} 
                color={activeTaskTab === 'audio' ? '#007AFF' : '#A1A1AA'} 
              />
              <Text style={[
                styles.taskTabText,
                activeTaskTab === 'audio' && styles.taskTabTextActive
              ]}>
                Audio Task
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.taskTab,
                activeTaskTab === 'image' && styles.taskTabActive
              ]}
              onPress={() => {
                setActiveTaskTab('image');
                setActiveIndex(0);
              }}
            >
              <Ionicons 
                name="image" 
                size={16} 
                color={activeTaskTab === 'image' ? '#007AFF' : '#A1A1AA'} 
              />
              <Text style={[
                styles.taskTabText,
                activeTaskTab === 'image' && styles.taskTabTextActive
              ]}>
                Image Task
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.taskTab,
                activeTaskTab === 'video' && styles.taskTabActive
              ]}
              onPress={() => {
                setActiveTaskTab('video');
                setActiveIndex(0);
              }}
            >
              <Ionicons 
                name="videocam" 
                size={16} 
                color={activeTaskTab === 'video' ? '#007AFF' : '#A1A1AA'} 
              />
              <Text style={[
                styles.taskTabText,
                activeTaskTab === 'video' && styles.taskTabTextActive
              ]}>
                Video Task
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Task Cards with taskType */}
          <FlatList
            ref={flatListRef}
            data={getFilteredTasks()}
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id)}
            snapToAlignment="start"
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + 16}
            contentContainerStyle={{ paddingRight: 0 }}
            renderItem={({ item }) => {
              const locked = isTaskLocked(item);
              
              return (
                <TouchableOpacity 
                  style={[
                    styles.taskCard,
                    locked && styles.taskCardLocked
                  ]}
                  onPress={() => handleTaskSelect(item)}
                  activeOpacity={locked ? 1 : 0.8}
                >
                  <View style={styles.taskImageContainer}>
                    <Image source={{ uri: item.image }} style={styles.taskCardImage} />
                    {locked && (
                      <View style={styles.lockOverlay}>
                        <View style={styles.lockIconContainer}>
                          <Ionicons name="lock-closed" size={24} color="#fff" />
                        </View>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.taskCardInfo}>
                    <Text style={[styles.taskCardTitle, locked && styles.lockedText]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.taskCardDescription, locked && styles.lockedText]}>
                      {item.description}
                    </Text>
                    
                    {locked ? (
                      <Text style={styles.lockMessage}>
                        Requires {item.minimumIq} IQ
                      </Text>
                    ) : (
                      <Text style={styles.taskCardMinIQ}>Minimum IQ: {item.minimumIq}</Text>
                    )}
                    
                    <View style={styles.taskCardReward}>
                      <Text style={[styles.taskCardTokens, locked && styles.lockedText]}>
                        +{item.reward} Points
                      </Text>
                      <View style={[styles.iqBadge, locked && styles.iqBadgeLocked]}>
                        <Text style={[styles.taskCardIQ, locked && styles.lockedText]}>
                          IQ: +{item.iqGain}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            onViewableItemsChanged={onViewableItemsChangedRef.current}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            ListEmptyComponent={() => (
              <View style={styles.emptyTasksContainer}>
                <Ionicons name="folder-open-outline" size={48} color="#666" />
                <Text style={styles.emptyTasksText}>
                  No {activeTaskTab} tasks available
                </Text>
                <Text style={styles.emptyTasksSubtext}>
                  Check back later or try another task type
                </Text>
              </View>
            )}
          />

          {/* dots indicator - show when there are tasks */}
          {getFilteredTasks().length > 0 && (
            <View style={styles.dotsContainer}>
              {getFilteredTasks().map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === activeIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Social Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Social Tasks</Text>
            {loadingSocial && (
              <ActivityIndicator size="small" color="#007AFF" />
            )}
          </View>
          
          {loadingSocial ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading social tasks...</Text>
            </View>
          ) : socialOffers.length > 0 ? (
            socialOffers.map((offer) => (
              <TouchableOpacity 
                key={offer._id}
                style={[
                  styles.socialTaskCard,
                  offer.completed && styles.socialTaskCardCompleted
                ]}
                onPress={() => !offer.completed && handleCompleteSocialOffer(offer)}
                disabled={offer.completed || completingSocialOffer === offer._id}
              >
                <View style={styles.socialTaskLeft}>
                  <View style={[
                    styles.socialIcon,
                    offer.completed && styles.socialIconCompleted
                  ]}>
                    <Ionicons 
                      name={getSocialOfferIcon(offer.type)} 
                      size={20} 
                      color={offer.completed ? '#4CAF50' : getSocialOfferColor(offer.type)} 
                    />
                  </View>
                  <View style={styles.socialTaskInfo}>
                    <Text style={[
                      styles.socialTaskTitle,
                      offer.completed && styles.socialTaskTitleCompleted
                    ]}>
                      {offer.description}
                    </Text>
                    <Text style={[
                      styles.socialTaskReward,
                      offer.completed && styles.socialTaskRewardCompleted
                    ]}>
                      +{offer.reward.coinsOnCorrect} Points
                    </Text>
                  </View>
                </View>
                
                {offer.completed ? (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                ) : completingSocialOffer === offer._id ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleCompleteSocialOffer(offer)}
                  >
                    <Text style={styles.actionButtonText}>
                      {offer.type.toLowerCase().includes('follow') ? 'Follow' :
                       offer.type.toLowerCase().includes('refer') ? 'Refer' :
                       offer.type.toLowerCase().includes('share') ? 'Share' : 'Complete'}
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyTasksContainer}>
              <Ionicons name="gift-outline" size={48} color="#666" />
              <Text style={styles.emptyTasksText}>No social tasks available</Text>
              <Text style={styles.emptyTasksSubtext}>Check back later for new tasks</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
     fontSize: 18,
     fontWeight: 'bold',
     marginBottom: 2,
   },
   userIQ: {
     color: '#888',
     fontSize: 15,
   },
  
  // Updated balance card styles
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
  taskCardLocked: {
    opacity: 0.6,
    borderColor: '#444',
  },
  taskImageContainer: {
    position: 'relative',
  },
  taskCardImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
    backgroundColor: '#2a2b33',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  taskCardMinIQ: {
    color: '#A1A1AA',
    fontSize: 12,
    marginBottom: 8,
  },
  lockMessage: {
    color: '#ff6b6b',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  lockedText: {
    color: '#666',
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
  iqBadgeLocked: {
    backgroundColor: '#2a2a2a',
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

  // Social Task Cards - Updated
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
  socialTaskCardCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
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
  socialIconCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  socialTaskInfo: {
    flex: 1,
  },
  socialTaskTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  socialTaskTitleCompleted: {
    color: '#A1A1AA',
  },
  socialTaskReward: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 2,
  },
  socialTaskRewardCompleted: {
    color: '#666',
  },
  
  // Action Buttons - Updated
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 13,
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

  // Task Tab Navigation Styles
  taskTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  taskTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  taskTabActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  taskTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  taskTabTextActive: {
    color: '#007AFF',
  },

  // Empty state for filtered tasks
  emptyTasksContainer: {
    width: CARD_WIDTH,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1b23',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2b33',
    marginRight: 16,
  },
  emptyTasksText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyTasksSubtext: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default OfferScreen;