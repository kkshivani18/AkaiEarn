import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { offersAPI } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const AUTO_SCROLL_INTERVAL = 3000;

type CarouselTask = {
  id: string;
  title: string;
  image: string;
  creativeLink: string | null;
  type?: string;
  reward: number;
  iqGain: number;
  description?: string;
  minimumIq?: number;
};

interface CarouselSectionProps {
  offerType?: 'audio' | 'image' | 'video';
  onTaskPress?: (task: CarouselTask) => void;
  autoScroll?: boolean;
}

export const CarouselSection: React.FC<CarouselSectionProps> = ({ 
  offerType,
  onTaskPress,
  autoScroll = true
}) => {
  const { authState } = useAuth();
  const [tasks, setTasks] = useState<CarouselTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<any> | null>(null);
  const autoScrollTimerRef = useRef<number | null>(null);

  const onViewableItemsChangedRef = useRef(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
    if (viewableItems && viewableItems[0]) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  });

  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 50,
  });

  const cleanTaskTitle = (type: string): string => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const mapBackendTaskToCarousel = (backendTask: any): CarouselTask => {
    const creativeLink = backendTask.creativeLink;
    let actualTitle = backendTask.title;
    
    if (!actualTitle) {
      if (backendTask.description) {
        const words = backendTask.description.split(' ').slice(0, 4).join(' ');
        actualTitle = words.length > 20 ? `${words.substring(0, 20)}...` : words;
      } else if (backendTask.type) {
        actualTitle = cleanTaskTitle(backendTask.type);
      } else {
        actualTitle = 'Labeling Task';
      }
    }
    
    return {
      id: backendTask._id || `task-${Date.now()}`,
      title: actualTitle,
      image: backendTask.imageLink,
      creativeLink: creativeLink,
      type: backendTask.type,
      reward: backendTask.rewards?.coinsOnCorrect || 0,
      iqGain: backendTask.rewards?.iqDeltaOnCorrect || 0,
      description: backendTask.description || 'Complete this task to earn rewards',
      minimumIq: backendTask.minimumIq || 0,
    };
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await offersAPI.getAllOffers();
      let tasksArray: any[] = [];
      
      if (response && response.labellingTasks) {
        tasksArray = response.labellingTasks;
      } else if (response && response.data) {
        tasksArray = response.data;
      } else if (response.success && response.data) {
        tasksArray = response.data;
      } else if (Array.isArray(response)) {
        tasksArray = response;
      }
      
      let filteredTasks = tasksArray;
      if (offerType) {
        filteredTasks = tasksArray.filter(
          (task: any) => task.type && task.type.toLowerCase().includes(offerType.toLowerCase())
        );
      }
      
      const mappedTasks = filteredTasks.map(mapBackendTaskToCarousel);
      
      setTasks(mappedTasks);
    } catch (error) {
      console.error('❌ [Carousel] Failed to fetch tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState?.authenticated) {
      fetchTasks();
    }
  }, [authState?.authenticated, offerType]);

  useEffect(() => {
    if (!autoScroll || tasks.length <= 1) {
      return;
    }

    const startAutoScroll = () => {
      autoScrollTimerRef.current = setInterval(() => {
        setActiveIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % tasks.length;
          
          try {
            flatListRef.current?.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
          } catch (error) {
            console.log('⚠️ [Carousel] Scroll error (normal on some devices)');
          }
          
          return nextIndex;
        });
      }, AUTO_SCROLL_INTERVAL);
    };

    startAutoScroll();

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    };
  }, [autoScroll, tasks.length]);

  const handleTaskPress = (task: CarouselTask) => {
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
    }

    if (onTaskPress) {
      onTaskPress(task);
      return;
    }

    // navigate to offer page
    router.push('/(tabs)/offer');
  };

  const renderTaskCard = ({ item }: { item: CarouselTask }) => (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => handleTaskPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.taskImage}
        resizeMode="cover"
      />
      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.taskDescription} numberOfLines={1}>
          {item.description}
        </Text>
        <View style={styles.taskFooter}>
          {/* <Text style={styles.minIqText}>Minimum IQ: {item.minimumIq}</Text> */}
          <View style={styles.rewardContainer}>
            <Text style={styles.rewardText}>+{item.reward} Points</Text>
            <View style={styles.iqBadge}>
              <Text style={styles.iqText}>IQ: +{item.iqGain}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="albums-outline" size={48} color="#666" />
        <Text style={styles.emptyText}>
          {offerType ? `No ${offerType} tasks available` : 'No tasks available'}
        </Text>
        <Text style={styles.emptySubtext}>Check back later for new tasks</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={tasks}
        renderItem={renderTaskCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.flatListContent}
        onViewableItemsChanged={onViewableItemsChangedRef.current}
        viewabilityConfig={viewabilityConfigRef.current}
        onScrollBeginDrag={() => {
          if (autoScrollTimerRef.current) {
            clearInterval(autoScrollTimerRef.current);
          }
        }}
        onScrollEndDrag={() => {
          if (autoScroll && tasks.length > 1) {
            autoScrollTimerRef.current = setInterval(() => {
              setActiveIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % tasks.length;
                try {
                  flatListRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                  });
                } catch (error) {
                  console.log('⚠️ [Carousel] Scroll error on resume');
                }
                return nextIndex;
              });
            }, AUTO_SCROLL_INTERVAL);
          }
        }}
        onScrollToIndexFailed={(info) => {
          console.log('⚠️ [Carousel] Scroll to index failed:', info);
          const offset = info.index * (CARD_WIDTH + 16);
          flatListRef.current?.scrollToOffset({ offset, animated: true });
        }}
      />
      
      {tasks.length > 1 && (
        <View style={styles.dotsContainer}>
          {tasks.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex ? styles.dotActive : styles.dotInactive,
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
    marginBottom: 16,
  },
  loadingContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1b23',
    borderRadius: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2a2b33',
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  emptyContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1b23',
    borderRadius: 16,
    marginHorizontal: 16,
    borderWidth: 1,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  flatListContent: {
    paddingHorizontal: 16,
  },
  taskCard: {
    width: CARD_WIDTH,
    backgroundColor: '#1a1b23',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#2a2b33',
    // borderColor: '#08B636',
    // borderWidth: 1,
    // borderRadius: 12
  },
  taskImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#2a2b33',
  },
  taskInfo: {
    padding: 12,
  },
  taskTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  taskDescription: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  taskFooter: {
    marginTop: 4,
  },
  minIqText: {
    color: '#A1A1AA',
    fontSize: 12,
    marginBottom: 8,
  },
  rewardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  iqBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  iqText: {
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
    backgroundColor: '#08B636',
    width: 24,
  },
  dotInactive: {
    backgroundColor: '#025017ff',
  },
});