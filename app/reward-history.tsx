import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LabelHistHeaderSection, LabelHistMetricsCard } from './label_hist_metrics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { logsAPI } from '../services/api';
import { useUserStore } from '../stores/userStore';

// Types
interface LogItem {
  _id: string;
  labelOfferType: string;
  status: 'success' | 'failure' | 'best-label' | 'verification';
  delta_iq: number;
  delta_coins: number;
  createdAt: string;
  labelOffer?: {
    _id: string;
    title: string;
    description: string;
    type: string;
    rewards?: {
      coinsOnCorrect: number;
      iqDeltaOnCorrect: number;
      iqDeltaOnIncorrect: number;
    };
    minimumIq?: number;
    imageLink?: string;
    creativeLink?: string;
  };
}

interface MetricsData {
  accuracy: number;
  tasksDone: number;
  coinsEarned: number;
  currentIQ: number;
  iqGainedThisWeek: number;
}

interface FilterState {
  dateRange: 'all' | 'today' | 'month' | 'last30days';
  statuses: string[];
}

const HistoryLogItem: React.FC<{ log: LogItem }> = ({ log }) => {
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
        return 'Approved';
      case 'failure':
        return 'Rejected';
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
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const truncateText = (text: string, maxLength: number = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const title = log.labelOffer?.title || log.labelOfferType || 'Unknown Task';
  const description = log.labelOffer?.description || '';

  return (
    <View style={styles.historyItem}>
      {/* Left Icon */}
      <Image 
        source={require('../assets/app-images/label_hist_icon.png')} 
        style={styles.historyIcon}
        resizeMode="contain"
      />

      {/* Center Content */}
      <View style={styles.historyContent}>
        <Text style={styles.historyTitle}>{truncateText(title, 20)}</Text>
        <Text style={styles.historyDescription} numberOfLines={2}>
          {truncateText(description, 40)}
        </Text>
        <Text style={styles.dateText}>{formatDate(log.createdAt)}</Text>
      </View>

      {/* Right Info */}
      <View style={styles.historyRight}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        <View style={styles.rewardsRow}>
          {/* Coins */}
          <View style={styles.rewardItem}>
            <Text style={[styles.rewardValue, { 
              color: (log.delta_coins || 0) >= 0 ? '#10B981' : '#EF4444' 
            }]}>
              {(log.delta_coins || 0) >= 0 ? '+' : ''}{log.delta_coins || 0}
            </Text>
            <Image 
              source={require('../assets/app-images/spin_coin.png')} 
              style={styles.rewardIcon}
              resizeMode="contain"
            />
          </View>
          
          {/* IQ */}
          <View style={styles.rewardItem}>
            <Text style={[styles.rewardValue, { 
              color: (log.delta_iq || 0) >= 0 ? '#10B981' : '#EF4444' 
            }]}>
              {(log.delta_iq || 0) >= 0 ? '+' : ''}{log.delta_iq || 0} IQ
            </Text>
            <Image 
              source={require('../assets/app-images/iq_brain.png')} 
              style={styles.rewardIcon}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default function LabelHistPage() {
  const { authState } = useAuth();
  const { iq } = useUserStore();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedSort, setSelectedSort] = useState<string>('newest');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    statuses: []
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [logs, filters, selectedSort]);

  const applyFiltersAndSort = () => {
    let processed = [...logs];
    
    // Apply date filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      processed = processed.filter(log => {
        const logDate = new Date(log.createdAt);
        
        switch (filters.dateRange) {
          case 'today':
            return logDate >= startOfToday;
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
    
    // Apply status filter
    if (filters.statuses.length > 0) {
      processed = processed.filter(log => filters.statuses.includes(log.status));
    }
    
    // Apply sort
    switch (selectedSort) {
      case 'newest':
        processed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        processed.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'coins-high':
        processed.sort((a, b) => (b.delta_coins || 0) - (a.delta_coins || 0));
        break;
      case 'coins-low':
        processed.sort((a, b) => (a.delta_coins || 0) - (b.delta_coins || 0));
        break;
      case 'iq-high':
        processed.sort((a, b) => (b.delta_iq || 0) - (a.delta_iq || 0));
        break;
      case 'iq-low':
        processed.sort((a, b) => (a.delta_iq || 0) - (b.delta_iq || 0));
        break;
    }
    
    setFilteredLogs(processed);
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await logsAPI.getMyLogs();
      
      if (response.success && response.data) {
        const logsData = response.data as LogItem[];
        
        // Sort by newest first
        const sortedLogs = logsData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setLogs(sortedLogs);
        
        // Calc metrics
        const totalTasks = sortedLogs.length;
        const successfulTasks = sortedLogs.filter(log => 
          log.status === 'success' || log.status === 'best-label'
        ).length;
        const accuracy = totalTasks > 0 ? Math.round((successfulTasks / totalTasks) * 100) : 0;
        const coinsEarned = sortedLogs.reduce((sum, log) => sum + (log.delta_coins || 0), 0);
        
        // IQ gained this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const iqGainedThisWeek = sortedLogs
          .filter(log => new Date(log.createdAt) >= oneWeekAgo)
          .reduce((sum, log) => sum + (log.delta_iq || 0), 0);
        
        setMetrics({
          accuracy,
          tasksDone: totalTasks,
          coinsEarned,
          currentIQ: iq,
          iqGainedThisWeek
        });
      }
    } catch (error) {
      console.error('❌ Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LabelHistHeaderSection />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFCD0A" />
            <Text style={styles.loadingText}>Loading metrics</Text>
          </View>
        ) : (
          <>
            {/* Metrics Card */}
            {metrics && (
              <LabelHistMetricsCard
                accuracy={metrics.accuracy}
                tasksDone={metrics.tasksDone}
                coinsEarned={metrics.coinsEarned}
                currentIQ={metrics.currentIQ}
                iqGainedThisWeek={metrics.iqGainedThisWeek}
              />
            )}
            
            {/* History Logs Section */}
            {logs.length > 0 ? (
              <View style={styles.historySection}>
                <View style={styles.historyHeader}>
                  <Text style={styles.sectionTitle}>Label Logs</Text>
                  <View style={styles.headerButtons}>
                    <TouchableOpacity 
                      style={styles.filterButton}
                      onPress={() => setShowFilterModal(true)}
                    >
                      <Ionicons name="filter" size={18} color="#FFCD0A" />
                      <Text style={styles.buttonText}>Filter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.sortButton}
                      onPress={() => setShowSortModal(true)}
                    >
                      <Ionicons name="swap-vertical" size={18} color="#FFCD0A" />
                      <Text style={styles.buttonText}>Sort</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <HistoryLogItem key={log._id} log={log} />
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No results found</Text>
                    <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No activity yet</Text>
                <Text style={styles.emptySubtext}>Complete tasks to see your history</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
      
      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sortModalContent}>
            <Text style={styles.modalTitle}>Sort</Text>
            <View style={styles.sortOptions}>
              {[
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
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterBody}>
              {/* Date Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Date Range</Text>
                <View style={styles.dateRangeGrid}>
                  {[
                    { key: 'all', label: 'All Time' },
                    { key: 'today', label: 'Today' },
                    { key: 'month', label: 'This Month' },
                    { key: 'last30days', label: 'Last 30 Days' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.dateRangeOption,
                        filters.dateRange === option.key && styles.dateRangeOptionSelected
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, dateRange: option.key as any }))}
                    >
                      <Text style={[
                        styles.dateRangeText,
                        filters.dateRange === option.key && styles.dateRangeTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Status */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Status</Text>
                <View style={styles.statusCheckboxes}>
                  {[
                    { key: 'success', label: 'Success' },
                    { key: 'failure', label: 'Failed' },
                    { key: 'verification', label: 'Pending' },
                    { key: 'best-label', label: 'Best Label' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={styles.checkboxRow}
                      onPress={() => {
                        setFilters(prev => ({
                          ...prev,
                          statuses: prev.statuses.includes(option.key)
                            ? prev.statuses.filter(s => s !== option.key)
                            : [...prev.statuses, option.key]
                        }));
                      }}
                    >
                      <View style={[
                        styles.checkbox,
                        filters.statuses.includes(option.key) && styles.checkboxChecked
                      ]}>
                        {filters.statuses.includes(option.key) && (
                          <Ionicons name="checkmark" size={16} color="#000" />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b0f',
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
  content: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#A1A1AA',
    fontSize: 14,
    marginTop: 12,
  },
  placeholder: {
    color: '#A1A1AA',
    fontSize: 14,
    textAlign: 'center',
    padding: 32,
  },
  // History Section
  historySection: {
    marginTop: 10,
    paddingHorizontal: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCD0A',
    backgroundColor: 'rgba(255, 205, 10, 0.1)',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCD0A',
    backgroundColor: 'rgba(255, 205, 10, 0.1)',
  },
  buttonText: {
    color: '#FFCD0A',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1b1f',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyIcon: {
    width: 58,
    height: 58,
    borderRadius: 10,
  },
  historyContent: {
    flex: 1,
    marginLeft: 5,
    marginRight: 5,
  },
  historyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyDescription: {
    color: '#A1A1AA',
    fontSize: 13,
    lineHeight: 14,
  },
  dateText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
    // marginLeft: -60
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  timeText: {
    color: '#A1A1AA',
    fontSize: 11,
    marginBottom: 8,
  },
  rewardsRow: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  rewardIcon: {
    width: 20,
    height: 20,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#1a1b1f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#A1A1AA',
    fontSize: 14,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#000',
    fontSize: 22,
    fontWeight: 'bold',
  },
  // Sort Modal
  sortModalContent: {
    backgroundColor: '#FFCD0A',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  sortOptions: {
    marginTop: 16,
    gap: 12,
  },
  sortOption: {
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sortOptionSelected: {
    borderColor: '#FFCD0A',
    backgroundColor: '#1a1a1a',
  },
  sortOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  sortOptionTextSelected: {
    color: '#FFCD0A',
  },
  // Filter Modal
  filterModalContent: {
    backgroundColor: '#FFCD0A',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  filterBody: {
    marginTop: 10,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dateRangeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateRangeOption: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000',
  },
  dateRangeOptionSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  dateRangeText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  dateRangeTextSelected: {
    color: '#FFCD0A',
  },
  statusCheckboxes: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFCD0A',
    borderColor: '#000',
  },
  checkboxLabel: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});

