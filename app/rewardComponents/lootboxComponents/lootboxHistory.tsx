import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { lootBoxAPI } from '../../../services/api';
import { Ionicons } from '@expo/vector-icons';

interface LootboxHistoryItem {
  pointsSpent: number;
  reward: number;
  time: string;
}

const LootboxHistory: React.FC = () => {
  const [history, setHistory] = useState<LootboxHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'wallet' | 'rpc' | 'auth' | 'general' | null>(null);

  const fetchHistory = async () => {
    try {
      setError(null);
      setErrorType(null);
      const response = await lootBoxAPI.getLootboxHistory();
      
      if (response.success && response.data) {
        setHistory(response.data);
      } else {
        setHistory([]);
      }
    } catch (err: any) {
      console.error('Error fetching lootbox history:', err);
      
      // Determine error type and set appropriate message
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load history';
      
      if (errorMessage.includes('wallet') || errorMessage.includes('on-chain')) {
        setErrorType('wallet');
        setError('Wallet not connected. Please connect your wallet first to view history.');
      } else if (errorMessage.includes('RPC') || errorMessage.includes('backend is currently healthy') || err.response?.status === 503) {
        setErrorType('rpc');
        setError('Blockchain network is temporarily unavailable. Please try again in a few moments.');
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('token')) {
        setErrorType('auth');
        setError('Session expired. Please login again.');
      } else {
        setErrorType('general');
        setError(errorMessage);
      }
      
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const time = date.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    return `${month} ${day}, ${time}`;
  };

  const getBoxType = (points: number): { name: string; color: string; image: any } => {
    if (points >= 500) {
      return {
        name: 'GOLDEN BOX',
        color: '#FFB917',
        image: require('../../../assets/app-images/golden_box.png'),
      };
    } else if (points >= 200) {
      return {
        name: 'SILVER BOX',
        color: '#49ACCE',
        image: require('../../../assets/app-images/silver_box.png'),
      };
    } else {
      return {
        name: 'BRONZE BOX',
        color: '#84DE49',
        image: require('../../../assets/app-images/bronze_box.png'),
      };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB917" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loot History</Text>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFB917"
            colors={['#FFB917']}
          />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons 
              name={errorType === 'wallet' ? 'wallet-outline' : errorType === 'rpc' ? 'cloud-offline-outline' : 'alert-circle'} 
              size={48} 
              color={errorType === 'wallet' ? '#F59E0B' : '#EF4444'} 
            />
            <Text style={[styles.errorText, errorType === 'wallet' && { color: '#F59E0B' }]}>
              {error}
            </Text>
            {errorType === 'wallet' ? (
              <Text style={styles.errorSubtext}>Connect your wallet in Profile to view history</Text>
            ) : errorType === 'rpc' ? (
              <Text style={styles.errorSubtext}>The blockchain RPC is experiencing issues. Pull to retry.</Text>
            ) : (
              <Text style={styles.errorSubtext}>Pull to refresh</Text>
            )}
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#71717A" />
            <Text style={styles.emptyText}>No lootbox history yet</Text>
            <Text style={styles.emptySubtext}>Open your first lootbox to see it here!</Text>
          </View>
        ) : (
          history.map((item, index) => {
            const boxInfo = getBoxType(item.pointsSpent);
            return (
              <View key={index} style={[styles.historyCard, { borderColor: boxInfo.color }]}>
                <View style={styles.cardContent}>
                  <Image
                    source={boxInfo.image}
                    style={styles.boxImage}
                    resizeMode="contain"
                  />
                  <View style={styles.textSection}>
                    <Text style={styles.boxTitle}>{boxInfo.name} OPENED</Text>
                    <Text style={styles.dateText}>{formatDate(item.time)}</Text>
                  </View>
                  <View style={styles.rewardSection}>
                    <Text style={styles.winText}>+${(item.reward / 100).toFixed(2)} Win</Text>
                    <Text style={styles.pointsText}>-{item.pointsSpent}pts</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181B',
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#18181B',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#A1A1AA',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#71717A',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 12,
  },
  emptyText: {
    color: '#A1A1AA',
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#71717A',
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boxImage: {
    width: 60,
    height: 60,
  },
  textSection: {
    flex: 1,
    gap: 4,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 13,
    color: '#A1A1AA',
  },
  rewardSection: {
    alignItems: 'flex-end',
    gap: 2,
  },
  winText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
});

export default LootboxHistory;