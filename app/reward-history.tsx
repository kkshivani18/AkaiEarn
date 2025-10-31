import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { logsAPI } from '../services/api';

// Types
interface LogItem {
  _id: string;
  labelOfferType: string;
  status: 'success' | 'failure' | 'best-label' | 'verification';
  delta_iq: number;
  delta_coins: number;
  createdAt: string;
  labelOffer: {
    _id: string;
    description: string;
    type: string;
    rewards: {
      coinsOnCorrect: number;
      iqDeltaOnCorrect: number;
      iqDeltaOnIncorrect: number;
    };
    minimumIq: number;
    imageLink: string;
    creativeLink: string;
  };
}

interface RewardStats {
  totalTasks: number;
  successfulTasks: number;
  successRate: number;
  totalCoinsEarned: number;
  totalIQGained: number;
  bestLabelTasks: number;
}

// Icons
const BackIcon = () => (
  <Svg fill="none" viewBox="0 0 24 24" stroke="white" style={styles.icon}>
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </Svg>
);

const FilterIcon = () => (
  <Svg fill="none" viewBox="0 0 24 24" stroke="white" style={styles.icon}>
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </Svg>
);

const SortIcon = () => (
  <Svg fill="none" viewBox="0 0 24 24" stroke="white" style={styles.icon}>
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </Svg>
);

const SuccessIcon = () => (
  <Svg fill="none" viewBox="0 0 24 24" stroke="#10B981" style={styles.statusIcon}>
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </Svg>
);

const FailureIcon = () => (
  <Svg fill="none" viewBox="0 0 24 24" stroke="#EF4444" style={styles.statusIcon}>
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </Svg>
);

const BestLabelIcon = () => (
  <Svg fill="none" viewBox="0 0 24 24" stroke="#F59E0B" style={styles.statusIcon}>
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </Svg>
);

const PendingIcon = () => (
  <Svg fill="none" viewBox="0 0 24 24" stroke="#3B82F6" style={styles.statusIcon}>
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </Svg>
);

// Statistics Card Component
const RewardStatsCard: React.FC<{ stats: RewardStats }> = ({ stats }) => (
  <View style={styles.statsContainer}>
    <View style={styles.statsGrid}>
      <BlurView intensity={40} tint="dark" style={styles.statCard}>
        <Text style={styles.statValue}>{stats.totalTasks}</Text>
        <Text style={styles.statLabel}>Total Tasks</Text>
      </BlurView>
      
      <BlurView intensity={40} tint="dark" style={styles.statCard}>
        <Text style={styles.statValue}>{stats.successRate}%</Text>
        <Text style={styles.statLabel}>Success Rate</Text>
      </BlurView>
      
      <BlurView intensity={40} tint="dark" style={styles.statCard}>
        <Text style={styles.statValue}>{stats.totalCoinsEarned}</Text>
        <Text style={styles.statLabel}>Coins Earned</Text>
      </BlurView>
      
      <BlurView intensity={40} tint="dark" style={styles.statCard}>
        <Text style={styles.statValue}>{stats.totalIQGained > 0 ? '+' : ''}{stats.totalIQGained}</Text>
        <Text style={styles.statLabel}>IQ Gained</Text>
      </BlurView>
    </View>
  </View>
);

// Individual History Item Component
const RewardHistoryItem: React.FC<{ log: LogItem }> = ({ log }) => {
  const getStatusIcon = () => {
    switch (log.status) {
      case 'success':
        return <SuccessIcon />;
      case 'failure':
        return <FailureIcon />;
      case 'best-label':
        return <BestLabelIcon />;
      case 'verification':
        return <PendingIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = () => {
    switch (log.status) {
      case 'success':
        return '#10B981';
      case 'failure':
        return '#EF4444';
      case 'best-label':
        return '#F59E0B';
      case 'verification':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (log.status) {
      case 'success':
        return 'Success';
      case 'failure':
        return 'Failed';
      case 'best-label':
        return 'Best Label';
      case 'verification':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <BlurView intensity={40} tint="dark" style={styles.historyItem}>
      <View style={styles.historyItemHeader}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskName}>{log.labelOffer?.description || log.labelOfferType}</Text>
          <Text style={styles.taskType}>{log.labelOfferType}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          {getStatusIcon()}
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>
      
      <View style={styles.historyItemContent}>
        <View style={styles.rewardsContainer}>
          {log.delta_coins > 0 && (
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>💰</Text>
              <Text style={styles.rewardText}>+{log.delta_coins} coins</Text>
            </View>
          )}
          {log.delta_iq !== 0 && (
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>🧠</Text>
              <Text style={[styles.rewardText, { color: log.delta_iq > 0 ? '#10B981' : '#EF4444' }]}>
                {log.delta_iq > 0 ? '+' : ''}{log.delta_iq} IQ
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.dateText}>{formatDate(log.createdAt)}</Text>
      </View>
    </BlurView>
  );
};

// Main Screen Component
export default function RewardHistoryScreen() {
  const { authState } = useAuth();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RewardStats | null>(null);
  
  // Filter and sort states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('newest');

  const calculateStats = (logs: LogItem[]): RewardStats => {
    const totalTasks = logs.length;
    const successfulTasks = logs.filter(log => 
      log.status === 'success' || log.status === 'best-label'
    ).length;
    const successRate = totalTasks > 0 ? Math.round((successfulTasks / totalTasks) * 100) : 0;
    
    const totalCoinsEarned = logs.reduce((sum, log) => sum + (log.delta_coins || 0), 0);
    const totalIQGained = logs.reduce((sum, log) => sum + (log.delta_iq || 0), 0);
    const bestLabelTasks = logs.filter(log => log.status === 'best-label').length;
    
    return {
      totalTasks,
      successfulTasks,
      successRate,
      totalCoinsEarned,
      totalIQGained,
      bestLabelTasks
    };
  };

  // Filter logs based on selected filter
  const filterLogs = (logs: LogItem[], filter: string): LogItem[] => {
    switch (filter) {
      case 'success':
        return logs.filter(log => log.status === 'success' || log.status === 'best-label');
      case 'failure':
        return logs.filter(log => log.status === 'failure');
      case 'best-label':
        return logs.filter(log => log.status === 'best-label');
      case 'verification':
        return logs.filter(log => log.status === 'verification');
      default:
        return logs;
    }
  };

  // Sort logs based on selected sort option
  const sortLogs = (logs: LogItem[], sort: string): LogItem[] => {
    const sortedLogs = [...logs];
    switch (sort) {
      case 'newest':
        return sortedLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sortedLogs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'coins-high':
        return sortedLogs.sort((a, b) => (b.delta_coins || 0) - (a.delta_coins || 0));
      case 'coins-low':
        return sortedLogs.sort((a, b) => (a.delta_coins || 0) - (b.delta_coins || 0));
      case 'iq-high':
        return sortedLogs.sort((a, b) => (b.delta_iq || 0) - (a.delta_iq || 0));
      case 'iq-low':
        return sortedLogs.sort((a, b) => (a.delta_iq || 0) - (b.delta_iq || 0));
      default:
        return sortedLogs;
    }
  };

  // Apply filter and sort to logs
  const applyFilterAndSort = () => {
    let processedLogs = filterLogs(logs, selectedFilter);
    processedLogs = sortLogs(processedLogs, selectedSort);
    setFilteredLogs(processedLogs);
    
    // Update stats based on filtered logs (not all logs)
    const filteredStats = calculateStats(processedLogs);
    setStats(filteredStats);
  };

  const fetchUserLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching user logs...');
      const response = await logsAPI.getMyLogs();
      console.log('✅ Logs response:', response);
      
      if (response.success && response.data) {
        const sortedLogs = (response.data as LogItem[]).sort((a: LogItem, b: LogItem) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setLogs(sortedLogs);
        setFilteredLogs(sortedLogs);
        // Initial stats should show all logs (no filter applied initially)
        setStats(calculateStats(sortedLogs));
      } else {
        setError('Failed to load reward history');
      }
    } catch (error) {
      console.error('❌ Error fetching logs:', error);
      setError('Failed to load reward history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState?.authenticated) {
      fetchUserLogs();
    }
  }, [authState?.authenticated]);

  // Apply filter and sort when they change
  useEffect(() => {
    applyFilterAndSort();
  }, [selectedFilter, selectedSort, logs]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar hidden={true} />
        <View style={styles.container}>
          <LinearGradient colors={['#0a101bff', '#060910ff', '#071014ff']} style={StyleSheet.absoluteFill} />
          
          <BlurView intensity={80} tint="dark" style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <BackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reward History</Text>
            <View style={{width: 24}} />
          </BlurView>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#EF4444" />
            <Text style={styles.loadingText}>Loading your reward history...</Text>
          </View>
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar hidden={true} />
        <View style={styles.container}>
          <LinearGradient colors={['#2a0000', '#000000']} style={StyleSheet.absoluteFill} />
          
          <BlurView intensity={80} tint="dark" style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <BackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reward History</Text>
            <View style={{width: 24}} />
          </BlurView>
          
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchUserLogs}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden={true} />
      <View style={styles.container}>
        <LinearGradient colors={['#0a101bff', '#060910ff', '#071014ff']} style={StyleSheet.absoluteFill} />
        
        <BlurView intensity={80} tint="dark" style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reward History</Text>
          <View style={{width: 24}} />
        </BlurView>

        <ScrollView contentContainerStyle={styles.scrollContent}>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Performance</Text>
              <View style={styles.sectionButtons}>
                <TouchableOpacity 
                  style={styles.sectionButton} 
                  onPress={() => setShowFilterModal(true)}
                >
                  <FilterIcon />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.sectionButton} 
                  onPress={() => setShowSortModal(true)}
                >
                  <SortIcon />
                </TouchableOpacity>
              </View>
            </View>
            <RewardStatsCard stats={stats} />
          </View>
        )}
        
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Task History</Text>
            <View style={{width: 80}} />
          </View>
          {filteredLogs.length === 0 ? (
            <BlurView intensity={40} tint="dark" style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {logs.length === 0 ? 'No tasks completed yet' : 'No tasks match your filter'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {logs.length === 0 ? 'Complete some tasks to see your reward history here!' : 'Try adjusting your filter or sort options'}
              </Text>
            </BlurView>
          ) : (
            filteredLogs.map((log) => (
              <RewardHistoryItem key={log._id} log={log} />
            ))
          )}
        </View>
        </ScrollView>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Tasks</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'all', label: 'All Tasks' },
                { key: 'success', label: 'Successful Tasks' },
                { key: 'failure', label: 'Failed Tasks' },
                { key: 'best-label', label: 'Best Label Tasks' },
                { key: 'verification', label: 'Verification Tasks' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    selectedFilter === option.key && styles.filterOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedFilter(option.key);
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedFilter === option.key && styles.filterOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort Tasks</Text>
            <View style={styles.sortOptions}>
              {[
                { key: 'newest', label: 'Newest First' },
                { key: 'oldest', label: 'Oldest First' },
                { key: 'coins-high', label: 'Highest Coins' },
                { key: 'coins-low', label: 'Lowest Coins' },
                { key: 'iq-high', label: 'Highest IQ' },
                { key: 'iq-low', label: 'Lowest IQ' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortOption,
                    selectedSort === option.key && styles.sortOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedSort(option.key);
                    setShowSortModal(false);
                  }}
                >
                  <Text style={[
                    styles.sortOptionText,
                    selectedSort === option.key && styles.sortOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSortModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  icon: {
    width: 20,
    height: 20,
  },
  scrollContent: {
    paddingTop: 120,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  sectionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#A1A1AA',
    textAlign: 'center',
  },
  historySection: {
    width: '100%',
  },
  historyItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskInfo: {
    flex: 1,
    marginRight: 12,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  taskType: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  rewardText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  emptyState: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterOptions: {
    width: '100%',
    marginBottom: 20,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterOptionSelected: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  filterOptionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  filterOptionTextSelected: {
    color: '#EF4444',
    fontWeight: '600',
  },
  sortOptions: {
    width: '100%',
    marginBottom: 20,
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sortOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  sortOptionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  sortOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});