import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, lootBoxAPI } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOOTBOX_CARD_WIDTH = SCREEN_WIDTH * 0.7;

const LootBoxesScreen: React.FC = () => {
  const { authState } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CO' | 'RT' | 'YT'>('CO');
  const [selectedCrypto, setSelectedCrypto] = useState('all');
  const [showCryptoDropdown, setShowCryptoDropdown] = useState(false);
  const [openingLootBox, setOpeningLootBox] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  
  // Updated state for real data
  const [lootBoxes, setLootBoxes] = useState<any[]>([]);
  const [availableCryptos, setAvailableCryptos] = useState<any[]>([]);
  const [loadingLootBoxes, setLoadingLootBoxes] = useState(false);
  
  // Add real transaction states
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Fetch available cryptocurrencies
  const fetchAvailableCryptos = async () => {
    try {
      const response = await lootBoxAPI.getAvailableCryptos();
      if (response.success) {
        const allOption = { id: 'all', name: 'All Crypto', symbol: '🪙', color: '#FFD700' };
        setAvailableCryptos([allOption, ...response.data]);
      }
    } catch (error) {
      console.error('Failed to fetch cryptocurrencies:', error);
      // Fallback to static data
      setAvailableCryptos([
        { id: 'all', name: 'All Crypto', symbol: '🪙', color: '#FFD700' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
        { id: 'bnb', name: 'BNB', symbol: 'BNB', color: '#F3BA2F' },
        { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#9945FF' },
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
      ]);
    }
  };

  // Fetch lootboxes by selected crypto
  const fetchLootBoxes = async (crypto: string = 'all') => {
    setLoadingLootBoxes(true);
    try {
      console.log('🔄 Fetching lootboxes for crypto:', crypto);
      
      // 'all' case, otherwise pass the crypto value
      const cryptoParam = crypto === 'all' ? undefined : crypto;
      
      const response = await lootBoxAPI.getLootBoxes(
        cryptoParam,
        20 // limit
      );

      console.log('📦 API Response:', response);

      if (response.success) {
        console.log('✅ Fetched lootboxes:', response.data.length);
        setLootBoxes(response.data);
      } else {
        console.error('❌ Failed to fetch lootboxes:', response);
        setLootBoxes([]);
      }
    } catch (error) {
      console.error('❌ Error fetching lootboxes:', error);
      setLootBoxes([]);
    } finally {
      setLoadingLootBoxes(false);
    }
  };

  // Fetch user points
  const fetchUserPoints = async () => {
    try {
      const response = await authAPI.getUser();
      const userData = response.user || response.data || response;
      setUserPoints(userData.coins || 0);
    } catch (error) {
      console.error('Failed to fetch user points:', error);
    }
  };

  // Fetch recent transactions (public)
  const fetchRecentTransactions = async () => {
    try {
      console.log('🔄 Fetching recent transactions...');
      const response = await lootBoxAPI.getRecentTransactions(15);
      console.log('📦 Recent transactions response:', response);
      
      if (response.success) {
        console.log('✅ Fetched recent transactions:', response.data.length);
        setRecentTransactions(response.data);
      } else {
        console.error('❌ Failed to fetch recent transactions:', response);
        setRecentTransactions([]);
      }
    } catch (error) {
      console.error('❌ Error fetching recent transactions:', error);
      setRecentTransactions([]);
    }
  };

  // Fetch user transactions (protected)
  const fetchUserTransactions = async () => {
    setLoadingTransactions(true);
    try {
      console.log('🔄 Fetching user transactions...');
      const response = await lootBoxAPI.getUserTransactions(20);
      console.log('📦 User transactions response:', response);
      
      if (response.success) {
        console.log('✅ Fetched user transactions:', response.data.length);
        setUserTransactions(response.data);
      } else {
        console.error('❌ Failed to fetch user transactions:', response);
        setUserTransactions([]);
      }
    } catch (error) {
      console.error('❌ Error fetching user transactions:', error);
      setUserTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAvailableCryptos(),
        fetchLootBoxes(selectedCrypto),
        fetchUserPoints(),
        fetchRecentTransactions()
      ]);
      setLoading(false);
    };

    initializeData();
  }, []);

  // Fetch user transactions when YT tab is selected
  useEffect(() => {
    if (activeTab === 'YT' && userTransactions.length === 0) {
      fetchUserTransactions();
    }
  }, [activeTab]);

  // Fetch lootboxes when crypto selection changes
  useEffect(() => {
    if (availableCryptos.length > 0) {
      fetchLootBoxes(selectedCrypto);
    }
  }, [selectedCrypto]);

  // Enhanced lootbox opening handler
  const handleOpenLootBox = async (lootBox: any) => {
    // Show points selection modal
    Alert.alert(
      `Open ${lootBox.name}`,
      `Exchange Rate: ${lootBox.exchangeRate?.pointsRequired || 100} points = ${lootBox.exchangeRate?.cryptoAmount || 0.001} ${lootBox.exchangeRate?.cryptoSymbol || 'CRYPTO'}\n\nYour Points: ${userPoints}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open with 100 pts', 
          onPress: () => openLootBox(lootBox, 100)
        },
        { 
          text: 'Open with 250 pts', 
          onPress: () => openLootBox(lootBox, 250)
        },
        { 
          text: 'Open with 500 pts', 
          onPress: () => openLootBox(lootBox, 500)
        }
      ]
    );
  };

  const openLootBox = async (lootBox: any, pointsToSpend: number) => {
    if (pointsToSpend > userPoints) {
      Alert.alert('Insufficient Points', `You need ${pointsToSpend} points but only have ${userPoints}.`);
      return;
    }

    setOpeningLootBox(lootBox._id);
    
    try {
      console.log('🎲 Opening lootbox:', { lootBoxId: lootBox._id, pointsToSpend });
      
      const response = await lootBoxAPI.openLootBox(lootBox._id, pointsToSpend);
      
      if (response.success) {
        const reward = response.reward;
        
        // Update user points
        setUserPoints(response.userStats.remainingPoints);
        
        // Refresh transactions to show the new one
        await fetchRecentTransactions();
        if (activeTab === 'YT') {
          await fetchUserTransactions();
        }
        
        // Show success message
        Alert.alert(
          'Lootbox Opened! 🎉',
          `Congratulations! You received:\n\n💰 ${reward.cryptoAmount} ${reward.cryptoSymbol}\n📊 Worth ~$${lootBox.estimatedValue}\n\n${reward.isBonus ? `🎯 Bonus: ${reward.bonusMultiplier}!` : ''}\n\nRemaining Points: ${response.userStats.remainingPoints}`,
          [{ text: 'Awesome!', style: 'default' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Failed to open lootbox:', error);
      
      let errorMessage = 'Failed to open lootbox. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setOpeningLootBox(null);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ethereum':
        return '#627EEA';
      case 'bnb':
        return '#F3BA2F';
      case 'solana':
        return '#9945FF';
      case 'bitcoin':
        return '#F7931A';
      default:
        return '#9CA3AF';
    }
  };

  const getTypeSymbol = (type: string) => {
    switch (type) {
      case 'ethereum':
        return 'ETH';
      case 'bnb':
        return 'BNB';
      case 'solana':
        return 'SOL';
      case 'bitcoin':
        return 'BTC';
      default:
        return type.toUpperCase();
    }
  };

  // Get current crypto info from real data
  const getCurrentCrypto = () => {
    return availableCryptos.find(crypto => crypto.id === selectedCrypto) || availableCryptos[0];
  };

  // Filter lootboxes
  const getFilteredLootBoxes = () => {
    return lootBoxes;
  };

  // cryptocurrency dropdown component
  const CryptocurrencyDropdown = () => {
    return (
      <View style={styles.dropdownContainer}>
        <Text style={styles.sectionTitle}>Choose Crypto</Text>
        
        {/* Dropdown Button */}
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowCryptoDropdown(true)}
          activeOpacity={0.8}
        >
          <View style={styles.dropdownButtonContent}>
            <View style={[styles.cryptoIconContainer, { backgroundColor: getCurrentCrypto()?.color + '20' }]}>
              <Text style={[styles.cryptoSymbol, { color: getCurrentCrypto()?.color }]}>
                {getCurrentCrypto()?.symbol}
              </Text>
            </View>
            <Text style={styles.dropdownButtonText}>{getCurrentCrypto()?.name}</Text>
            <Ionicons 
              name="chevron-down" 
              size={20} 
              color="#A1A1AA" 
              style={[styles.dropdownIcon, showCryptoDropdown && styles.dropdownIconOpen]} 
            />
          </View>
        </TouchableOpacity>

        {/* Dropdown Modal */}
        <Modal
          visible={showCryptoDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCryptoDropdown(false)}
        >
          <TouchableOpacity 
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setShowCryptoDropdown(false)}
          >
            <View style={styles.dropdownModal}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Select Crypto</Text>
                <TouchableOpacity 
                  onPress={() => setShowCryptoDropdown(false)}
                  style={styles.dropdownCloseButton}
                >
                  <Ionicons name="close" size={20} color="#A1A1AA" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.dropdownList}>
                {availableCryptos.map((crypto) => (
                  <TouchableOpacity
                    key={crypto.id}
                    style={[
                      styles.dropdownItem,
                      selectedCrypto === crypto.id && styles.dropdownItemSelected
                    ]}
                    onPress={() => {
                      setSelectedCrypto(crypto.id);
                      setShowCryptoDropdown(false);
                    }}
                  >
                    <View style={[styles.cryptoIconContainer, { backgroundColor: crypto.color + '20' }]}>
                      <Text style={[styles.cryptoSymbol, { color: crypto.color }]}>
                        {crypto.symbol}
                      </Text>
                    </View>
                    <Text style={[
                      styles.dropdownItemText,
                      selectedCrypto === crypto.id && styles.dropdownItemTextSelected
                    ]}>
                      {crypto.name}
                    </Text>
                    {selectedCrypto === crypto.id && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  // combined content renderer
  const renderCombinedContent = () => (
    <View style={styles.tabContent}>
      {/* User Points Display */}
      <View style={styles.userPointsCard}>
        <View style={styles.pointsHeader}>
          <Text style={styles.pointsTitle}>Points: {userPoints.toLocaleString()}</Text>
          <TouchableOpacity onPress={fetchUserPoints}>
            <Ionicons name="refresh" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Cryptocurrency Dropdown */}
      <CryptocurrencyDropdown />

      {/* LootBoxes Horizontal Scroll */}
      <View style={styles.lootBoxSection}>
        <View style={styles.lootBoxHeader}>
          <Text style={styles.sectionTitle}>
            {getCurrentCrypto()?.name} LootBoxes 
          </Text>
          <View style={styles.cryptoIndicator}>
            <Text style={[styles.cryptoSymbol, { color: getCurrentCrypto()?.color }]}> {getCurrentCrypto()?.symbol}</Text>
          </View>
        </View>

        {loadingLootBoxes ? (
          <View style={styles.loadingLootBoxes}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Loading lootboxes...</Text>
          </View>
        ) : (
          <FlatList
            data={getFilteredLootBoxes()}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item._id)}
            contentContainerStyle={styles.lootBoxScrollContainer}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.horizontalLootBoxCard, 
                  { borderColor: item.color + '40' },
                  openingLootBox === item._id && styles.lootBoxOpening
                ]}
                onPress={() => handleOpenLootBox(item)}
                activeOpacity={0.8}
                disabled={openingLootBox === item._id}
              >
                {/* Header */}
                <View style={[styles.lootBoxCardHeader, { backgroundColor: item.color + '15' }]}>
                  <View style={styles.lootBoxCardIcon}>
                    <Ionicons name="cube" size={24} color={item.color} />
                  </View>
                  <View style={styles.cryptoBadge}>
                    <Text style={[styles.cryptoBadgeText, { color: item.crypto?.toUpperCase() === 'ETH' ? '#627EEA' : item.color }]}>
                      {item.crypto?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Content */}
                <View style={styles.lootBoxCardContent}>
                  <Text style={styles.lootBoxCardName}>{item.name}</Text>
                  {/* <Text style={styles.lootBoxCardDescription}>{item.description}</Text> */}
                  <Text style={styles.estimatedValue}>${item.estimatedValue}</Text>
                  
                  {/* Rewards Preview */}
                  {/* <View style={styles.rewardsPreview}>
                    {item.rewards.slice(0, 2).map((reward: string, index: number) => (
                      <View key={index} style={styles.rewardPreviewItem}>
                        <Ionicons name="gift-outline" size={12} color="#A1A1AA" />
                        <Text style={styles.rewardPreviewText}>{reward}</Text>
                      </View>
                    ))}
                    {item.rewards.length > 2 && (
                      <Text style={styles.moreRewards}>+{item.rewards.length - 2} more</Text>
                    )}
                  </View> */}
                </View>

                {/* Footer with enhanced exchange rate display */}
                <View style={styles.lootBoxCardFooter}>
                  <View style={styles.exchangeRateInfo}>
                    <Text style={styles.exchangeRateText}>
                      {item.exchangeRate?.pointsRequired || 100} points
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[
                      styles.openButtonSmall, 
                      { backgroundColor: item.color },
                      openingLootBox === item._id && styles.openButtonDisabled
                    ]}
                    onPress={() => handleOpenLootBox(item)}
                    disabled={openingLootBox === item._id}
                  >
                    {openingLootBox === item._id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.openButtonSmallText}>Open</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyLootBoxes}>
                <Ionicons name="cube-outline" size={48} color="#666" />
                <Text style={styles.emptyLootBoxesText}>
                  No lootboxes available for {getCurrentCrypto()?.name}
                </Text>
                <Text style={styles.emptyLootBoxesSubtext}>
                  {selectedCrypto === 'all' 
                    ? 'Try running the seed script or check if lootboxes are marked as active'
                    : 'Try selecting a different cryptocurrency'
                  }
                </Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => fetchLootBoxes(selectedCrypto)}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {/* Recent Activity */}
      {/* <View style={styles.recentActivityPreview}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentTransactions.slice(0, 3).map((transaction, index) => (
          <View key={transaction._id || index} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>{transaction.avatar}</Text>
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionUser}>{transaction.user}</Text>
                <Text style={styles.transactionTime}>{transaction.timeAgo}</Text>
              </View>
            </View>
            <View style={styles.transactionRight}>
              <Text style={[styles.transactionType, { color: getTypeColor(transaction.type) }]}>
                {getTypeSymbol(transaction.type)}
              </Text>
              <Text style={styles.transactionReward}>{transaction.reward}</Text>
            </View>
          </View>
        ))}
      </View> */}
    </View>
  );

  const renderRecentTransactionsContent = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <Text style={styles.sectionSubtitle}>Latest lootbox openings from all users</Text>
      
      {recentTransactions.map((transaction, index) => (
        <BlurView key={transaction._id || index} intensity={40} tint="dark" style={styles.transactionCard}>
          <View style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>{transaction.avatar}</Text>
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionUser}>{transaction.user}</Text>
                <Text style={styles.transactionDescription}>
                  opened <Text style={[styles.transactionType, { color: getTypeColor(transaction.type) }]}>
                    {getTypeSymbol(transaction.type)}
                  </Text> lootbox and received
                </Text>
                <Text style={styles.transactionTime}>{transaction.timeAgo}</Text>
              </View>
            </View>
            <View style={styles.transactionRight}>
              <Text style={styles.transactionReward}>{transaction.reward}</Text>
            </View>
          </View>
        </BlurView>
      ))}
      
      {recentTransactions.length === 0 && (
        <BlurView intensity={40} tint="dark" style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color="#666" />
          <Text style={styles.emptyStateTitle}>No Recent Activity</Text>
          <Text style={styles.emptyStateText}>
            No transactions yet. Be the first to open a lootbox!
          </Text>
        </BlurView>
      )}
    </View>
  );

  const renderYourTransactionsContent = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Your Transactions</Text>
      
      {loadingTransactions ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your transactions...</Text>
        </View>
      ) : userTransactions.length > 0 ? (
        <>
          {userTransactions.map((transaction, index) => (
            <BlurView key={transaction._id || index} intensity={40} tint="dark" style={styles.transactionCard}>
              <View style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={styles.lootBoxIconContainer}>
                    <Ionicons name="cube" size={20} color={getTypeColor(transaction.type)} />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionUser}>
                      {transaction.lootBoxId?.name || 'Lootbox'}
                    </Text>
                    <Text style={styles.transactionDescription}>
                      You earned {transaction.cryptoAmount} {transaction.cryptoSymbol}
                    </Text>
                    <Text style={styles.transactionTime}>{transaction.timeAgo}</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[styles.transactionType, { color: getTypeColor(transaction.type) }]}>
                    -{transaction.pointsSpent} pts
                  </Text>
                  <Text style={styles.transactionReward}>{transaction.reward}</Text>
                </View>
              </View>
            </BlurView>
          ))}
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchUserTransactions}
          >
            <Ionicons name="refresh" size={16} color="#007AFF" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </>
      ) : (
        <BlurView intensity={40} tint="dark" style={styles.emptyState}>
          <Ionicons name="cube-outline" size={48} color="#666" />
          <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
          <Text style={styles.emptyStateText}>
            You haven't opened any lootboxes yet. Complete tasks to earn points and start opening lootboxes!
          </Text>
          <TouchableOpacity 
            style={styles.earnKeysButton}
            onPress={() => router.push('/(tabs)/offer')}
          >
            <Text style={styles.earnKeysButtonText}>Earn Points</Text>
          </TouchableOpacity>
        </BlurView>
      )}
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#0a101bff', '#060910ff', '#071014ff']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading LootBoxes...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0a101bff', '#060910ff', '#071014ff']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LootBoxes</Text>
          <View style={styles.headerRight}>
            <Ionicons name="cube" size={24} color="#007AFF" />
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'CO' && styles.activeTab]}
            onPress={() => setActiveTab('CO')}
          >
            <Text style={[styles.tabText, activeTab === 'CO' && styles.activeTabText]}>
              Combined
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'RT' && styles.activeTab]}
            onPress={() => setActiveTab('RT')}
          >
            <Text style={[styles.tabText, activeTab === 'RT' && styles.activeTabText]}>
              Recent Transactions
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'YT' && styles.activeTab]}
            onPress={() => setActiveTab('YT')}
          >
            <Text style={[styles.tabText, activeTab === 'YT' && styles.activeTabText]}>
              Your Transactions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {activeTab === 'CO' && renderCombinedContent()}
          {activeTab === 'RT' && renderRecentTransactionsContent()}
          {activeTab === 'YT' && renderYourTransactionsContent()}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  
  // Stats Card
  statsCard: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  keyBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  keyBalanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginLeft: 6,
  },
  statsSubtext: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  
  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#A1A1AA',
    textAlign: 'center',
    marginBottom: 2,
  },
  activeTabText: {
    color: '#007AFF',
  },
  tabLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  activeTabLabel: {
    color: '#007AFF',
  },
  
  // Content
  scrollView: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 16,
  },
  
  // LootBox Cards (existing styles)
  lootBoxGrid: {
    marginBottom: 20,
  },
  lootBoxCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  lootBoxHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lootBoxIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lootBoxInfo: {
    flex: 1,
  },
  lootBoxName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  lootBoxDescription: {
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 8,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  rewardsSection: {
    marginBottom: 16,
  },
  rewardsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 12,
    color: '#A1A1AA',
    marginLeft: 6,
  },
  openButton: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  openButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  openButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  // Transaction Items
  recentActivityPreview: {
    marginTop: 20,
  },
  transactionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionUser: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: '#A1A1AA',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 11,
    color: '#666',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionType: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionReward: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  
  // Empty State
  emptyState: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  earnKeysButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  earnKeysButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Cryptocurrency Dropdown Styles
  dropdownContainer: {
    marginBottom: 24,
  },
  dropdownButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
    marginLeft: 12,
  },
  dropdownIcon: {
    transform: [{ rotate: '0deg' }],
  },
  dropdownIconOpen: {
    transform: [{ rotate: '180deg' }],
  },
  
  // Modal Styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dropdownModal: {
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  dropdownCloseButton: {
    padding: 4,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
  },
  dropdownItemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },

  // Update existing crypto styles
  cryptoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cryptoSymbol: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cryptoName: {
    fontSize: 12,
    color: '#A1A1AA',
    textAlign: 'center',
  },
  cryptoNameSelected: {
    color: 'white',
    fontWeight: '600',
  },

  // LootBox Section
  lootBoxSection: {
    marginBottom: 24,
  },
//   lootBoxHeaderLS: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
  cryptoIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lootBoxScrollContainer: {
    paddingRight: 20,
  },
  
  // LootBox Card
  horizontalLootBoxCard: {
    width: LOOTBOX_CARD_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginRight: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  lootBoxCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  lootBoxCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cryptoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cryptoBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  lootBoxCardContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  lootBoxCardName: {
    marginTop: 5,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  lootBoxCardDescription: {
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 6,
  },
  estimatedValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 12,
  },
  rewardsPreview: {
    marginBottom: 8,
  },
  rewardPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rewardPreviewText: {
    fontSize: 12,
    color: '#A1A1AA',
    marginLeft: 6,
  },
  moreRewards: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  lootBoxCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  keyRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  keyRequirementText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  openButtonSmall: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  openButtonSmallText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // New styles
  loadingLootBoxes: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 40,
  },
  emptyLootBoxes: {
    alignItems: 'center' as const,
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyLootBoxesText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  emptyLootBoxesSubtext: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center' as const,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // User Points Card
  userPointsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pointsHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 5,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
  pointsValue: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#4CAF50',
    marginBottom: 4,
  },
  pointsSubtext: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  lootBoxOpening: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  exchangeRateInfo: {
    flex: 1,
    marginRight: 12,
  },
  exchangeRateText: {
    fontSize: 14,
    color: '#A1A1AA',
    fontWeight: '500' as const,
  },
  openButtonDisabled: {
    opacity: 0.6,
  },

  // Add new styles for transaction features
  lootBoxIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
  },
  refreshButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default LootBoxesScreen;