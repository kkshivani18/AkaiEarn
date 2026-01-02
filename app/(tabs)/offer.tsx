import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, AppStateStatus, Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OfferSkeletonLoader, SocialSkeletonLoader } from '../../components/SkeletonLoader';
import { useAuth } from '../../contexts/AuthContext';
import { offersAPI, socialAPI } from '../../services/api';
import { HeaderSection } from '../offerComponents/offerHeader';
import { useUserStore } from '../../stores/userStore';
import { ErrorPopup } from '../../components/popups/ErrorPopup';

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

// social offers
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
  
  // Use Zustand store for user data
  const { name, email, iq, coins, fetchUserData, shouldRefetch } = useUserStore();
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [allTasks, setAllTasks] = useState<OfferTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTaskTab, setActiveTaskTab] = useState<'audio' | 'image' | 'video'>('video');
  const [fetchingTasks, setFetchingTasks] = useState(false);
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

  // snackbar 
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [pendingSocialTask, setPendingSocialTask] = useState<string | null>(null);
  const [appStateTimestamp, setAppStateTimestamp] = useState<number>(0);
  
  // error popup
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorPopupMessage, setErrorPopupMessage] = useState('');

  const showSnackbarMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 2000);
  };

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
    const creativeLink = backendTask.creativeLink;
    let actualTitle = backendTask.title;
    
    if (!actualTitle) {
      console.warn('⚠️ No title in backend, generating from description/type');
      if (backendTask.description) {
        const words = backendTask.description.split(' ').slice(0, 4).join(' ');
        actualTitle = words.length > 20 ? `${words.substring(0, 20)}...` : words;
      } else if (backendTask.type) {
        actualTitle = backendTask.type.charAt(0).toUpperCase() + backendTask.type.slice(1) + ' Task';
      } else {
        actualTitle = 'Labeling Task';
      }
    }
    
    const mappedTask = {
      id: backendTask._id || `task-${Date.now()}`,
      title: actualTitle,
      description: backendTask.description || 'Complete this task to earn rewards',
      reward: backendTask.rewards?.coinsOnCorrect || 0,
      iqGain: backendTask.rewards?.iqDeltaOnCorrect || 0,
      image: backendTask.imageLink || 'https://via.placeholder.com/300x140/2a2b33/fff?text=Task',
      difficulty: getDifficultyFromIQ(backendTask.minimumIq || 0),
      minimumIq: backendTask.minimumIq || 0,
      creativeLink: creativeLink,
      penaltyTime: backendTask.penaltyTime || 1,
      type: backendTask.type
    };
    
    return mappedTask;
  };

  // check if task is locked based on user IQ
  const isTaskLocked = (task: OfferTask): boolean => {
    const userIQ = iq || 0;
    return userIQ < task.minimumIq;
  };

  const handleTaskSelect = (task: OfferTask) => {
    if (isTaskLocked(task)) {
      
      showSnackbarMessage(`You need at least ${task.minimumIq} IQ to unlock this task. Current IQ: ${iq || 0}.`);
      return;
    }
    if (!task.creativeLink) {
      console.error('❌ No creative link found for task:', task);
      setErrorPopupMessage('This task is not properly configured. Please try another task.');
      setShowErrorPopup(true);
      return;
    }
    
    router.push({
      pathname: '/creative-task',
      params: {
        labelOfferId: task.id,
        creativeLink: task.creativeLink, 
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
        setFetchingTasks(true);
        setError(null);
        const response = await offersAPI.getAllOffers();
        
        if (response.success && response.data) {
          
          const mappedTasks = response.data.map(mapBackendTaskToFrontend);
          
          setAllTasks(mappedTasks);
          
        } else {
          throw new Error('Invalid response format from backend');
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch tasks:', error);
        setError(error.message || 'Failed to load tasks');
        setAllTasks([]);
      } finally {
        setLoading(false);
        setFetchingTasks(false); 
      }
    };

    if (authState?.authenticated) {
      fetchTasks();
    }
  }, [authState?.authenticated]);

  // Load user data from store (with smart caching)
  React.useEffect(() => {
    if (authState?.authenticated) {
      // Check if we should refetch from API
      if (shouldRefetch()) {
        console.log('🔄 Refetching user data from API in offer screen...');
        fetchUserData();
      } else {
        console.log('✅ Using cached user data from store in offer screen');
      }
    }
  }, [authState?.authenticated]);

  useFocusEffect(
    React.useCallback(() => {
      if (authState?.authenticated) {
        // Only refetch if data is stale
        if (shouldRefetch()) {
          console.log('🔄 Screen focused, refetching user data...');
          fetchUserData();
        }
      }
    }, [authState?.authenticated, allTasks.length, activeTaskTab])
  );

  useEffect(() => {
    const loadPersistedTab = async () => {
      try {
        const savedTab = await AsyncStorage.getItem('activeTaskTab');
        if (savedTab && ['audio', 'image', 'video'].includes(savedTab)) {
          setActiveTaskTab(savedTab as 'audio' | 'image' | 'video');
        }
      } catch (error) {
        console.error('Failed to load persisted tab:', error);
      }
    };
    
    loadPersistedTab();
  }, []);

  const handleTabChange = async (tab: 'audio' | 'image' | 'video') => {
    try {
      setActiveTaskTab(tab);
      setActiveIndex(0);
      await AsyncStorage.setItem('activeTaskTab', tab);
    } catch (error) {
      console.error('Failed to save tab to storage:', error);
    }
  };

  // social offers from backend
  const fetchSocialOffers = async () => {
    setLoadingSocial(true);
    try {
      const response = await socialAPI.getAllSocialOffers();
      
      if (response.success && response.data) {
        response.data.forEach((offer: any) => {
          console.log(`  - ${offer.description}: completed=${offer.completed}, id=${offer._id}`);
        });
        setSocialOffers(response.data);
      }
    } catch (error) {
      console.error('❌ Failed to fetch social offers:', error);
      setSocialOffers([]);
    } finally {
      setLoadingSocial(false);
    }
  };

  useEffect(() => {
    if (authState?.authenticated) {
      fetchSocialOffers();
    }
  }, [authState?.authenticated]);

  const appState = useRef<AppStateStatus>(AppState.currentState);

  // App State Listener for Social Tasks
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        
        if (pendingSocialTask) {
          const timeSpentAway = Date.now() - appStateTimestamp;
          
          if (timeSpentAway > 3000) {
            await completeSocialTask(pendingSocialTask);
          } else {
            console.log('⚠️ Not enough time away, not completing');
          }
          
          setPendingSocialTask(null);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        setAppStateTimestamp(Date.now());
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription?.remove();
  }, [pendingSocialTask, appStateTimestamp]);

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      
      if (event.url.startsWith('offerwall://')) {
        // navigate to offer screen
        if (router.canGoBack()) {
          router.replace('/(tabs)/offer');
        }
        
        fetchUserData();
        showSnackbarMessage('Task completed!');
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  // complete social task function
  const completeSocialTask = async (offerId: string) => {
    if (completingSocialOffer === offerId) {
      return;
    }

    setCompletingSocialOffer(offerId);
    
    try {
      const response = await socialAPI.completeSocialOffer(offerId);
      if (response.success) {
        await fetchSocialOffers();
        fetchUserData();
        
        const offer = socialOffers.find(o => o._id === offerId);
        showSnackbarMessage(`Task completed. You earned ${offer?.reward.coinsOnCorrect || 0} points!`);
      }
    } catch (error: any) {
      console.error('❌ Failed to complete social offer:', error);
      
      if (error.response?.status === 409) {
        await fetchSocialOffers(); 
        showSnackbarMessage('Task was already completed');
      } else {
        console.error('Completion failed:', error.response?.data?.message);
      }
    } finally {
      setCompletingSocialOffer(null);
    }
  };

  // social offer handler - just open link and track
  const handleCompleteSocialOffer = async (offer: SocialOffer) => {
    if (offer.completed) {
      showSnackbarMessage(`You've already completed this task and earned ${offer.reward.coinsOnCorrect} points!`);
      return; 
    }

    if (completingSocialOffer === offer._id) {
      return;
    }

    try {
      // Set pending task before opening external link
      setPendingSocialTask(offer._id);
      
      const canOpen = await Linking.canOpenURL(offer.redirectLink);
      if (canOpen) {
        await Linking.openURL(offer.redirectLink);
      } else {
        console.warn('⚠️ Cannot open URL:', offer.redirectLink);
        setPendingSocialTask(null);
        setErrorPopupMessage('Cannot open this link. Please check your internet connection.');
        setShowErrorPopup(true);
      }
    } catch (error) {
      console.error('Failed to open link:', error);
      setPendingSocialTask(null);
      setErrorPopupMessage('Failed to open link. Please try again.');
      setShowErrorPopup(true);
    }
  };

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

  const getSocialOfferColor = (type: string): string => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('twitter') || lowerType.includes('x')) return '#1DA1F2';
    if (lowerType.includes('discord')) return '#5865F2';
    if (lowerType.includes('telegram')) return '#0088cc';
    return '#ffffff';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <OfferSkeletonLoader />
      </SafeAreaView>
    );
  }

  const getFilteredTasks = (): OfferTask[] => {
    if (fetchingTasks || (allTasks.length === 0 && loading)) {
      return [];
    }
    
    if (allTasks.length === 0) {
      console.warn('⚠️ No tasks available to filter');
      return [];
    }
    
    const filtered = allTasks.filter(task => {
      const taskType = (task.type || '').toLowerCase();
      const taskTitle = (task.title || '').toLowerCase();
      
      if (activeTaskTab === 'audio') {
        const isAudio = taskType.includes('audio') || 
                       taskTitle.includes('audio') || 
                       taskType === 'audio';
        
        return isAudio;
      } else if (activeTaskTab === 'image') {
        const isImage = taskType.includes('image') || 
                       taskTitle.includes('image') || 
                       taskTitle.includes('photo') || 
                       taskTitle.includes('picture') ||
                       taskTitle.includes('visual') ||
                       taskType === 'image';
        return isImage;
      } else { 
        const isVideo = taskType.includes('video') || 
                       taskTitle.includes('video') ||
                       taskType === 'video' ||
                       (!taskType.includes('audio') && 
                        !taskType.includes('image') && 
                        !taskTitle.includes('audio') && 
                        !taskTitle.includes('image'));
        
        return isVideo;
      }
    });
    
    return filtered;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <HeaderSection/>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Tasks for You Section */}
        <View style={styles.section}>
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
              onPress={() => handleTabChange('audio')}
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
              onPress={() => handleTabChange('image')}
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
              onPress={() => handleTabChange('video')}
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
                      {item.title || 'NO TITLE RECEIVED'}
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
            ListEmptyComponent={() => {
              if (fetchingTasks || loading) {
                return (
                  <View style={styles.emptyTasksContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.emptyTasksText}>Loading tasks...</Text>
                    <Text style={styles.emptyTasksSubtext}>Please wait</Text>
                  </View>
                );
              }
              
              return (
                <View style={styles.emptyTasksContainer}>
                  <Ionicons name="folder-open-outline" size={48} color="#666" />
                  <Text style={styles.emptyTasksText}>
                    No {activeTaskTab} tasks available
                  </Text>
                  <Text style={styles.emptyTasksSubtext}>
                    Check back later or try another task type
                  </Text>
                </View>
              );
            }}
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
      </ScrollView>

      {showSnackbar && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </View>
      )}
      
      <ErrorPopup
        visible={showErrorPopup}
        message={errorPopupMessage}
        onClose={() => setShowErrorPopup(false)}
      />
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
  socialIconImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontWeight: '500',
  },
  socialTaskRewardCompleted: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  
  // Action Buttons
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
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '700',
  },
  processingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
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
    textAlign: 'center',
    paddingHorizontal: 3,
  },
  taskTabTextActive: {
    color: '#007AFF',
  },
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
  // Snackbar styles
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
    fontWeight: '500',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  pendingText: {
    color: '#FF9500',
    fontSize: 12,
    fontWeight: '600',
  },
  tapToOpenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  tapToOpenText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OfferScreen;