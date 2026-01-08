import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorPopup } from '../../components/popups/ErrorPopup';
import { OfferSkeletonLoader } from '../../components/SkeletonLoader';
import { FONTS } from '../../constants/fonts';
import { logsAPI, offersAPI } from '../../services/api';
import { useUserStore } from '../../stores/userStore';
import { HeaderSection } from '../offerComponents/offerHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH * 0.87;
const SPACING = (SCREEN_WIDTH - ITEM_WIDTH) / 4;

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

// Progress Card 
const ProgressCard = ({ currentIQ, iqGainedThisWeek }: { currentIQ: number, iqGainedThisWeek: number }) => {
  const progressPercentage = Math.min((currentIQ % 1000) / 10, 100);
  
  return (
    <View style={styles.progressCardContainer}>
      <Text style={styles.progressLabel}>Progress Level</Text>
      
      <View style={styles.progressHeaderRow}>
        <View style={styles.iqTitleContainer}>
          <Text style={styles.iqTitle}>Current IQ: {currentIQ}</Text>
          {iqGainedThisWeek > 0 && (
            <Text style={styles.iqWeekly}> (+ {iqGainedThisWeek} this week)</Text>
          )}
        </View>
        <Image source={{ uri: 'https://akaiearn-app-images.s3.ap-south-1.amazonaws.com/common/iq_brain.png' }} style={styles.progressBrainIcon} resizeMode="contain" />
      </View>
      
      <View style={styles.progressBarContainer}>
        <LinearGradient
          colors={['#34E819', '#70C8F4', '#D63CC6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
        />
        <View style={[styles.progressBarEmpty, { width: `${100 - progressPercentage}%` }]} />
      </View>
    </View>
  );
};

// Task Card 
const TaskCard = ({ task, onPress, locked, scale, opacity }: { task: OfferTask, onPress: () => void, locked: boolean, scale?: any, opacity?: any }) => {
  return (
    <Animated.View style={{ transform: [{ scale: scale || 1 }], opacity: opacity || 1 }}>
      <TouchableOpacity 
        style={[styles.taskCard, locked && styles.taskCardLocked]} 
        onPress={onPress}
        activeOpacity={locked ? 1 : 0.9}
      >
        <View style={styles.taskCardContent}>
          <View style={styles.taskImageContainer}>
            <Image source={{ uri: task.image }} style={styles.taskCardImage} />
            {locked && (
              <View style={styles.lockOverlay}>
                <Ionicons name="lock-closed" size={32} color="#fff" />
              </View>
            )}
          </View>
          
          <View style={styles.taskDetailsContainer}>
            <View style={[styles.taskRow, styles.taskRowFirst]}>
              <Text style={[styles.taskCardTitle, locked && styles.lockedText]} numberOfLines={1}>
                {task.title}
              </Text>
                <View style={styles.signContainer}>
                  <Text style={styles.plusSign}>+</Text>
                  <Text style={styles.minusSign}>-</Text>
                </View>
                <Text style={styles.rewardValue}>{task.iqGain}</Text>
                <Image source={{ uri: 'https://akaiearn-app-images.s3.ap-south-1.amazonaws.com/common/iq_brain.png' }} style={styles.pillIcon} resizeMode="contain" />
            </View>

            <View style={styles.taskRow}>
              <Text style={[styles.taskCardDescription, styles.taskDescriptionWithSpacing, locked && styles.lockedText]} numberOfLines={2}>
                {task.description}
              </Text>
                <View style={styles.signContainer}>
                  <Text style={styles.plusSignPoints}>+</Text>
                </View>
                <Text style={styles.rewardValue}>{task.reward}</Text>
                <Image source={require('../../assets/app-images/points_crystal.png')} style={styles.pillIcon} resizeMode="contain" />
            </View>
            
            {locked ? (
              <Text style={styles.lockMessage}>Requires {task.minimumIq} IQ</Text>
            ) : (
              <Text style={styles.taskCardMinIQ}>Min IQ: {task.minimumIq}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const OfferScreen: React.FC = () => {
  const authenticated = useUserStore(s => s.authenticated);
  const iq = useUserStore(s => s.iq);
  const coins = useUserStore(s => s.coins);
  const fetchUserData = useUserStore(s => s.fetchUserData);
  const shouldRefetch = useUserStore(s => s.shouldRefetch);
  
  // for user data
  
  const [allTasks, setAllTasks] = useState<OfferTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchingTasks, setFetchingTasks] = useState(false);
  const [iqGainedThisWeek, setIqGainedThisWeek] = useState(0);

  // snackbar 
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
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

  const mapBackendTaskToFrontend = (backendTask: any): OfferTask => {
    const creativeLink = backendTask.creativeLink;
    let actualTitle = backendTask.title;
    
    if (!actualTitle) {
      if (backendTask.description) {
        const words = backendTask.description.split(' ').slice(0, 4).join(' ');
        actualTitle = words.length > 20 ? `${words.substring(0, 20)}...` : words;
      } else if (backendTask.type) {
        actualTitle = backendTask.type.charAt(0).toUpperCase() + backendTask.type.slice(1) + ' Task';
      } else {
        actualTitle = 'Labeling Task';
      }
    }
    
    return {
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
  };

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

  // tasks by type
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: OfferTask[] } = {};
    allTasks.forEach(task => {
      const formattedType = task.type 
        ? task.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') 
        : 'Other Tasks';
        
      if (!groups[formattedType]) {
        groups[formattedType] = [];
      }
      groups[formattedType].push(task);
    });
    return groups;
  }, [allTasks]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setFetchingTasks(true);
        setError(null);

        const tasksResponse = await offersAPI.getAllOffers();
        if (tasksResponse.success && tasksResponse.data) {
          const mappedTasks = tasksResponse.data.map(mapBackendTaskToFrontend);
          setAllTasks(mappedTasks);
        }

        const logsResponse = await logsAPI.getMyLogs();
        if (logsResponse.success && logsResponse.data) {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const weeklyGain = logsResponse.data
            .filter((log: any) => new Date(log.createdAt) >= oneWeekAgo)
            .reduce((sum: number, log: any) => sum + (log.delta_iq || 0), 0);
          setIqGainedThisWeek(weeklyGain);
        }

      } catch (error: any) {
        console.error('❌ Failed to fetch data:', error);
        setError(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
        setFetchingTasks(false);
      }
    };

    if (authenticated) {
      fetchData();
      fetchUserData(); 
    }
  }, [authenticated]);

  useFocusEffect(
    React.useCallback(() => {
      if (authenticated && shouldRefetch()) {
        fetchUserData();
      }
    }, [authenticated, shouldRefetch, fetchUserData])
  );

  if (loading && allTasks.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <OfferSkeletonLoader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <HeaderSection/>
      <ProgressCard currentIQ={iq || 0} iqGainedThisWeek={iqGainedThisWeek} />
      <View style={styles.scrollWrapper}>
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
          {/* Task Section */}
          {Object.keys(groupedTasks).length > 0 ? (
            Object.entries(groupedTasks).map(([type, tasks]) => (
              <TaskCarouselSection 
                key={type} 
                type={type} 
                tasks={tasks} 
                onSelect={handleTaskSelect} 
                isLocked={isTaskLocked} 
              />
            )) 
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tasks available at the moment.</Text>
            </View>
          )}
          <View style={{ height: 40 }} /> 
        </ScrollView>
      </View>

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

const TaskCarouselSection = ({ type, tasks, onSelect, isLocked }: { type: string, tasks: OfferTask[], onSelect: (t: OfferTask) => void, isLocked: (t: OfferTask) => boolean }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{type} Task</Text>
      </View>
      
      <Animated.FlatList
        data={tasks}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: SPACING,
        }}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH);
          setActiveIndex(index);
        }}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 1) * ITEM_WIDTH,
            index * ITEM_WIDTH,
            (index + 1) * ITEM_WIDTH,
          ];
          
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.9, 1, 0.9],
            extrapolate: 'clamp',
          });
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.6, 1, 0.6],
            extrapolate: 'clamp',
          });

          return (
            <View style={{ width: ITEM_WIDTH }}>
              <TaskCard 
                task={item} 
                onPress={() => onSelect(item)}
                locked={isLocked(item)}
                scale={scale}
                opacity={opacity}
              />
            </View>
          );
        }}
      />
      
      {/* Pagination */}
      {tasks.length > 1 && (
        <View style={styles.paginationContainer}>
          {tasks.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === activeIndex ? styles.paginationDotActive : styles.paginationDotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b0f', 
  },
  scrollView: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#2C2B30',
  },
  scrollWrapper: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden', 
  },
  scrollContent: {
    paddingVertical: 16,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: FONTS.heading.bold,
    left: 12,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    fontFamily: FONTS.body.regular,
  },
  
  // Progress Card 
  progressCardContainer: {
    backgroundColor: '#0F291E', 
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#22C55E', 
  },
  progressLabel: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.heading.bold,
    marginBottom: -4,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iqTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  iqTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.heading.bold,
  },
  iqWeekly: {
    color: '#22C55E',
    fontSize: 14,
    fontFamily: FONTS.body.semiBold,
    marginLeft: 4,
  },
  progressBrainIcon: {
    width: 38,
    height: 38,
  },
  progressBarContainer: {
    height: 10,
    flexDirection: 'row',
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressBarEmpty: {
    height: '100%',
  },

  // Task Card 
  taskCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    marginHorizontal: 4, 
    borderWidth: 2,
    borderColor: '#333',
    overflow: 'hidden',
    marginBottom: 10,
  },
  taskCardLocked: {
    opacity: 0.8,
    borderColor: '#444',
  },
  taskCardContent: {
    flexDirection: 'column', 
  },
  taskImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#2a2b33',
    position: 'relative',
  },
  taskCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskDetailsContainer: {
    padding: 12,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  taskRowFirst: {
    marginBottom: -6,
  },
  taskDescriptionWithSpacing: {
    marginTop: 4,
  },
  taskCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.heading.bold,
    flex: 1,
    marginRight: 8,
  },
  taskCardDescription: {
    color: '#AAA',
    fontSize: 12,
    fontFamily: FONTS.body.regular,
    flex: 1,
    marginRight: 8,
    lineHeight: 16,
  },
  taskCardMinIQ: {
    color: '#888',
    fontSize: 12,
    fontFamily: FONTS.body.regular,
    marginTop: 4,
  },
  lockMessage: {
    color: '#ff6b6b',
    fontSize: 12,
    fontFamily: FONTS.body.semiBold,
    marginTop: 4,
  },
  lockedText: {
    color: '#888',
  },
  
  // Rewards (Pills)
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFCD0A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    minWidth: 64,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  sign: {
    fontSize: 13,
    fontFamily: FONTS.heading.bold,
    marginRight: 2,
  },
  rewardValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FONTS.body.bold,
    marginRight: 4,
    borderColor: '#000000'
  },
  pillIcon: {
    width: 20,
    height: 20,
  },
  signContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 2,
    marginTop: 2,
  },
  plusSign: {
    color: '#38E990',
    fontSize: 15,
    lineHeight: 8,
    fontFamily: FONTS.body.bold,
    height: 8,
  },
  minusSign: {
    color: '#E5383B',
    fontSize: 15,
    lineHeight: 8,
    fontFamily: FONTS.body.bold,
    height: 8,
  },
  plusSignPoints: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 8,
    fontFamily: FONTS.body.bold,
    height: 8,
  },
  // Snackbar
  snackbar: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  snackbarText: {
    color: 'white',
    fontSize: 14,
    fontFamily: FONTS.body.medium,
  },
  // Pagination Dots
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 32,
  },
  paginationDotInactive: {
    width: 16,
  },
});

export default OfferScreen;