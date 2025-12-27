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
import { HistorySkeletonLoader } from '../components/SkeletonLoader';

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
    title: string; 
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

// Enhanced filter state interface
interface FilterState {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'last30days';
  taskTypes: string[];
  statuses: string[];
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
          <Text style={styles.taskName}>
            {log.labelOffer?.title || log.labelOffer?.description || log.labelOfferType || 'Unknown Task'}
          </Text>
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
          {/* Points Earned */}
          <View style={styles.rewardItem}>
            <Text style={[styles.rewardText, { 
              color: (log.delta_coins || 0) > 0 ? '#10B981' : 
                     (log.delta_coins || 0) < 0 ? '#EF4444' : '#A1A1AA' 
            }]}> Points: {(log.delta_coins || 0) > 0 ? '+' : ''}{log.delta_coins || 0} 
            </Text>
          </View>
          
          {/* IQ Earned */}
          <View style={styles.rewardItem}>
            <Text style={[styles.rewardText, { 
              color: (log.delta_iq || 0) > 0 ? '#10B981' : 
                     (log.delta_iq || 0) < 0 ? '#EF4444' : '#A1A1AA' 
            }]}> IQ : {(log.delta_iq || 0) > 0 ? '+' : ''}{log.delta_iq || 0} 
            </Text>
          </View>
        </View>
        <Text style={styles.dateText}>{formatDate(log.createdAt)}</Text>
      </View>
    </BlurView>
  );
};

// Enhanced Filter Modal Component
const ComprehensiveFilterModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  logs: LogItem[];
}> = ({ visible, onClose, filters, onApplyFilters, logs }) => {
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);
  
  // Get unique task types from logs
  const taskTypes = Array.from(new Set(logs.map(log => log.labelOfferType))).filter(Boolean);
  
  const dateRangeOptions = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'last30days', label: 'Last 30 Days' }
  ];
  
  const statusOptions = [
    { key: 'success', label: 'Success', color: '#3B82F6' },
    { key: 'failure', label: 'Failed', color: '#3B82F6' },
    { key: 'best-label', label: 'Best Label', color: '#3B82F6' },
    { key: 'verification', label: 'Pending', color: '#3B82F6' }
  ];

  const handleTaskTypeToggle = (taskType: string) => {
    setTempFilters(prev => ({
      ...prev,
      taskTypes: prev.taskTypes.includes(taskType)
        ? prev.taskTypes.filter(t => t !== taskType)
        : [...prev.taskTypes, taskType]
    }));
  };

  const handleStatusToggle = (status: string) => {
    setTempFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }));
  };

  const clearAllFilters = () => {
    setTempFilters({
      dateRange: 'all',
      taskTypes: [],
      statuses: []
    });
  };

  const applyFilters = () => {
    onApplyFilters(tempFilters);
    onClose();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (tempFilters.dateRange !== 'all') count++;
    count += tempFilters.taskTypes.length;
    count += tempFilters.statuses.length;
    return count;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.filterModalOverlay}>
        <BlurView intensity={90} tint="dark" style={styles.filterModalContent}>
          {/* Header */}
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.filterCloseButton}>
              <Svg fill="none" viewBox="0 0 24 24" stroke="white" style={styles.filterCloseIcon}>
                <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </Svg>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterModalBody} showsVerticalScrollIndicator={false}>
            {/* Date Range Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Date Range</Text>
              <View style={styles.filterOptionsGrid}>
                {dateRangeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.dateRangeOption,
                      tempFilters.dateRange === option.key && styles.dateRangeOptionSelected
                    ]}
                    onPress={() => setTempFilters(prev => ({ ...prev, dateRange: option.key as any }))
                    }
                  >
                    <Text style={[
                      styles.dateRangeOptionText,
                      tempFilters.dateRange === option.key && styles.dateRangeOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Task Type Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                Task Type ({tempFilters.taskTypes.length} selected)
              </Text>
              <View style={styles.filterCheckboxContainer}>
                {taskTypes.map((taskType) => (
                  <TouchableOpacity
                    key={taskType}
                    style={styles.filterCheckboxItem}
                    onPress={() => handleTaskTypeToggle(taskType)}
                  >
                    <View style={[
                      styles.checkbox,
                      tempFilters.taskTypes.includes(taskType) && styles.checkboxSelected
                    ]}>
                      {tempFilters.taskTypes.includes(taskType) && (
                        <Svg viewBox="0 0 24 24" fill="white" style={styles.checkIcon}>
                          <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </Svg>
                      )}
                    </View>
                    <Text style={styles.filterCheckboxText}>{taskType}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                Status ({tempFilters.statuses.length} selected)
              </Text>
              <View style={styles.filterCheckboxContainer}>
                {statusOptions.map((status) => (
                  <TouchableOpacity
                    key={status.key}
                    style={styles.filterCheckboxItem}
                    onPress={() => handleStatusToggle(status.key)}
                  >
                    <View style={[
                      styles.checkbox,
                      tempFilters.statuses.includes(status.key) && styles.checkboxSelected,
                      tempFilters.statuses.includes(status.key) && { backgroundColor: status.color }
                    ]}>
                      {tempFilters.statuses.includes(status.key) && (
                        <Svg viewBox="0 0 24 24" fill="white" style={styles.checkIcon}>
                          <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </Svg>
                      )}
                    </View>
                    <Text style={styles.filterCheckboxText}>{status.label}</Text>
                    {/* <View style={[styles.statusColorIndicator, { backgroundColor: status.color }]} /> */}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.filterModalFooter}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearAllFilters}
            >
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={applyFilters}
            >
              <Text style={styles.applyFiltersText}>
                Apply Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </Modal>
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

  // Enhanced filter state
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    taskTypes: [],
    statuses: []
  });

  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbarMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 2000);
  };

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
      
      const response = await logsAPI.getMyLogs();
      
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
      showSnackbarMessage('Failed to load reward history'); 
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

  // Apply comprehensive filters
  const applyComprehensiveFilters = () => {
    let processedLogs = filterLogsByComprehensiveFilters(logs, filters);
    processedLogs = sortLogs(processedLogs, selectedSort);
    setFilteredLogs(processedLogs);
    
    const filteredStats = calculateStats(processedLogs);
    setStats(filteredStats);
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // Filter logs by comprehensive filters
  const filterLogsByComprehensiveFilters = (logs: LogItem[], filters: FilterState): LogItem[] => {
    let filtered = [...logs];
    
    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(log => {
        const logDate = new Date(log.createdAt);
        
        switch (filters.dateRange) {
          case 'today':
            return logDate >= startOfToday;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return logDate >= weekAgo;
          case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return logDate >= monthStart;
          case 'last30days':
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return logDate >= thirtyDaysAgo;
          default:
            return true;
        }
      });
    }
    
    // Task type filter
    if (filters.taskTypes.length > 0) {
      filtered = filtered.filter(log => filters.taskTypes.includes(log.labelOfferType));
    }
    
    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(log => filters.statuses.includes(log.status));
    }
    
    return filtered;
  };

  // Loading and error states
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
            <Text style={styles.headerTitle}>Labelling History</Text>
            <View style={{width: 24}} />
          </BlurView>
          
          <View style={styles.loadingContainer}>
            <HistorySkeletonLoader count={5} />
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
            <Text style={styles.headerTitle}>Labelling History</Text>
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
          <Text style={styles.headerTitle}>Labelling History</Text>
          <View style={{width: 24}} />
        </BlurView>

        <ScrollView contentContainerStyle={styles.scrollContent}>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Performance</Text>
              <View style={styles.sectionButtons}>
                <TouchableOpacity 
                  style={[
                    styles.sectionButton,
                    (filters.dateRange !== 'all' || filters.taskTypes.length > 0 || filters.statuses.length > 0) && styles.sectionButtonActive
                  ]} 
                  onPress={() => setShowFilterModal(true)}
                >
                  <FilterIcon />
                  {(filters.dateRange !== 'all' || filters.taskTypes.length > 0 || filters.statuses.length > 0) && (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>
                        {(filters.dateRange !== 'all' ? 1 : 0) + filters.taskTypes.length + filters.statuses.length}
                      </Text>
                    </View>
                  )}
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

      {/* Comprehensive Filter Modal */}
      <ComprehensiveFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        logs={logs}
      />

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

      {/* Snackbar */}
      {showSnackbar && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </View>
      )}
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
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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
  sectionButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
    gap: 12, // Reduced gap for better spacing
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rewardIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '600',
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
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  filterModalContent: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  filterCloseButton: {
    padding: 4,
  },
  filterCloseIcon: {
    width: 20,
    height: 20,
  },
  filterModalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  
  // Date range styles
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateRangeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateRangeOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  dateRangeOptionText: {
    color: 'white',
    fontSize: 14,
  },
  dateRangeOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  
  // Checkbox styles
  filterCheckboxContainer: {
    gap: 12,
  },
  filterCheckboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkIcon: {
    width: 12,
    height: 12,
  },
  filterCheckboxText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
  },
  statusColorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  
  // Footer styles
  filterModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  clearFiltersText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  applyFiltersButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  applyFiltersText: {
    color: 'white',
    fontSize: 16,
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
});