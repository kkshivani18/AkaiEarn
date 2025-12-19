import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    AppState,
    AppStateStatus,
    Image,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { socialAPI } from '../../services/api';
import { useUserStore } from '../../stores/userStore';

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

interface SocialTasksProps {
  onTaskComplete?: () => void;
}

export const SocialTasks: React.FC<SocialTasksProps> = ({ onTaskComplete }) => {
  const { authState } = useAuth();
  const { fetchUserData } = useUserStore();
  const [socialOffers, setSocialOffers] = useState<SocialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingSocialOffer, setCompletingSocialOffer] = useState<string | null>(null);
  const [pendingSocialTask, setPendingSocialTask] = useState<string | null>(null);
  const [appStateTimestamp, setAppStateTimestamp] = useState<number>(0);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const fetchSocialOffers = async () => {
    try {
      setLoading(true);
      const response = await socialAPI.getAllSocialOffers();
      
      if (response.success && response.data) {
        setSocialOffers(response.data);
      } else if (response && response.socialOffers) {
        setSocialOffers(response.socialOffers);
      }
    } catch (error) {
      console.error('Failed to fetch social offers:', error);
      setSocialOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState?.authenticated) {
      fetchSocialOffers();
    }
  }, [authState?.authenticated]);

  // App State Listener for Social Tasks
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (pendingSocialTask) {
          const timeSpentAway = Date.now() - appStateTimestamp;
          
          if (timeSpentAway > 6000) {
            await completeSocialTask(pendingSocialTask);
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

  const completeSocialTask = async (offerId: string) => {
    if (completingSocialOffer === offerId) {
      return;
    }

    setCompletingSocialOffer(offerId);
    
    try {
      const response = await socialAPI.completeSocialOffer(offerId);
      
      if (response.success) {
        await fetchSocialOffers();
        await fetchUserData();
        
        if (onTaskComplete) {
          onTaskComplete();
        }
      }
    } catch (error: any) {
      console.error('Failed to complete social task:', error);
      
      if (error.response?.status === 409) {
        await fetchSocialOffers();
      }
    } finally {
      setCompletingSocialOffer(null);
    }
  };

  const handleCompleteSocialOffer = async (offer: SocialOffer) => {
    if (offer.completed) {
      return;
    }

    if (completingSocialOffer === offer._id) {
      return;
    }

    try {
      await socialAPI.startSocialOffer(offer._id);
      setPendingSocialTask(offer._id);
      
      const canOpen = await Linking.canOpenURL(offer.redirectLink);
      if (canOpen) {
        await Linking.openURL(offer.redirectLink);
      } else {
        console.warn('Cannot open URL:', offer.redirectLink);
        setPendingSocialTask(null);
      }
    } catch (error) {
      console.error('Error opening social link:', error);
      setPendingSocialTask(null);
    }
  };

  const getSocialOfferIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('youtube')) return 'logo-youtube';
    if (lowerType.includes('twitter') || lowerType.includes('x')) return 'logo-twitter';
    if (lowerType.includes('instagram')) return 'logo-instagram';
    if (lowerType.includes('facebook')) return 'logo-facebook';
    if (lowerType.includes('linkedin')) return 'logo-linkedin';
    if (lowerType.includes('discord')) return 'logo-discord';
    if (lowerType.includes('telegram')) return 'paper-plane';
    if (lowerType.includes('website') || lowerType.includes('visit')) return 'globe-outline';
    return 'link-outline';
  };

  const getCardBackgroundColor = (completed?: boolean): string => {
    if (completed) return '#2D5F3F';
    return '#1a1b23';
  };

  const getBorderColor = (completed?: boolean): string => {
    if (completed) return '#4CAF50';
    return '#27282fff';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (socialOffers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="share-social-outline" size={48} color="#666" />
        <Text style={styles.emptyText}>No social tasks available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {socialOffers.map((offer) => {
        const isCompleting = completingSocialOffer === offer._id;
        const isPending = pendingSocialTask === offer._id;

        return (
          <TouchableOpacity
            key={offer._id}
            style={[
              styles.socialTaskCard,
              { 
                backgroundColor: getCardBackgroundColor(offer.completed),
                borderColor: getBorderColor(offer.completed)
              }
            ]}
            onPress={() => handleCompleteSocialOffer(offer)}
            activeOpacity={offer.completed ? 1 : 0.7}
            disabled={offer.completed || isCompleting}
          >
            <View style={styles.socialTaskLeft}>
              {offer.imageLink ? (
                <Image
                  source={{ uri: offer.imageLink }}
                  style={styles.socialIconImage}
                />
              ) : (
                <View style={styles.socialIcon}>
                  <Ionicons
                    name={getSocialOfferIcon(offer.type)}
                    size={15}
                    color="#fff"
                  />
                </View>
              )}
              
              <View style={styles.socialTaskInfo}>
                <Text
                  style={[
                    styles.socialTaskTitle,
                    offer.completed && styles.socialTaskTitleCompleted
                  ]}
                  numberOfLines={1}
                >
                  {offer.description}
                </Text>
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardPrefix}>+</Text>
                  <Text style={styles.rewardAmount}>{offer.reward.coinsOnCorrect}</Text>
                  <Text style={styles.rewardLabel}> Points</Text>
                  {offer.completed && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
                      <Text style={styles.completedText}>Completed</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {isCompleting ? (
              <View style={styles.processingBadge}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : !offer.completed && (
              <Ionicons name='arrow-up-right-box-outline' size={20} color="#A1A1AA" />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1b23',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2b33',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  socialTaskCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    borderWidth: 2,
  },
  socialTaskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  socialIconImage: {
    width: 40,
    height: 40,
    borderRadius: 24,
    marginRight: 12,
  },
  socialTaskInfo: {
    flex: 1,
  },
  socialTaskTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  socialTaskTitleCompleted: {
    color: '#D1D5DB',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardPrefix: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  rewardAmount: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  rewardLabel: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    gap: 4,
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '600',
  },
  processingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});