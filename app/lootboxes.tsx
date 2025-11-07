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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOOTBOX_CARD_WIDTH = SCREEN_WIDTH * 0.7;

// Mock transaction data
const mockTransactions = [
  {
    id: 1,
    user: 'Ansome25',
    type: 'COMMON',
    reward: '$0.08',
    timeAgo: 'a minute ago',
    avatar: 'A'
  },
  {
    id: 2,
    user: 'Ethylene',
    type: 'RARE',
    reward: '$0.10',
    timeAgo: '2 minutes ago',
    avatar: 'E'
  },
  {
    id: 3,
    user: 'Ethylene',
    type: 'RARE',
    reward: '$0.60',
    timeAgo: '2 minutes ago',
    avatar: 'E'
  },
  {
    id: 4,
    user: 'BAROABBA454',
    type: 'COMMON',
    reward: '$0.02',
    timeAgo: '8 minutes ago',
    avatar: 'B'
  },
  {
    id: 5,
    user: 'SAHIKKHAN',
    type: 'COMMON',
    reward: '$0.05',
    timeAgo: '11 minutes ago',
    avatar: 'S'
  }
];

// Mock cryptocurrency data
const cryptocurrencies = [
  { id: 'all', name: 'All Coins', symbol: '🪙', color: '#FFD700' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  { id: 'bnb', name: 'BNB', symbol: 'BNB', color: '#F3BA2F' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#9945FF' },
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA', color: '#0033AD' },
];

// Enhanced lootbox data with crypto categories
const getAllLootBoxes = () => [
  // Ethereum boxes
  {
    id: 1,
    name: 'ETH Bronze',
    description: 'Common Ethereum rewards',
    cost: 100,
    rarity: 'common',
    color: '#627EEA',
    crypto: 'ethereum',
    rewards: ['0.01-0.05 ETH', 'Gas Fee Coupons', 'NFT Whitelist'],
    estimatedValue: '$15-50',
  },
  {
    id: 2,
    name: 'ETH Silver',
    description: 'Premium Ethereum rewards',
    cost: 250,
    rarity: 'rare',
    color: '#627EEA',
    crypto: 'ethereum',
    rewards: ['0.05-0.15 ETH', 'DeFi Tokens', 'Exclusive NFTs'],
    estimatedValue: '$50-150',
  },
  {
    id: 3,
    name: 'ETH Gold',
    description: 'Legendary Ethereum rewards',
    cost: 500,
    rarity: 'legendary',
    color: '#627EEA',
    crypto: 'ethereum',
    rewards: ['0.1-0.5 ETH', 'Rare NFTs', 'Staking Rewards'],
    estimatedValue: '$150-500',
  },
  
  // BNB boxes
  {
    id: 4,
    name: 'BNB Bronze',
    description: 'Common BNB rewards',
    cost: 100,
    rarity: 'common',
    color: '#F3BA2F',
    crypto: 'bnb',
    rewards: ['5-25 BNB', 'BSC Tokens', 'Pancake LP'],
    estimatedValue: '$15-50',
  },
  {
    id: 5,
    name: 'BNB Silver',
    description: 'Premium BNB rewards',
    cost: 250,
    rarity: 'rare',
    color: '#F3BA2F',
    crypto: 'bnb',
    rewards: ['25-75 BNB', 'DeFi Yields', 'Launchpad Access'],
    estimatedValue: '$50-150',
  },
  {
    id: 6,
    name: 'BNB Gold',
    description: 'Legendary BNB rewards',
    cost: 500,
    rarity: 'legendary',
    color: '#F3BA2F',
    crypto: 'bnb',
    rewards: ['50-200 BNB', 'VIP Staking', 'Exclusive Tokens'],
    estimatedValue: '$150-500',
  },

  // Solana boxes
  {
    id: 7,
    name: 'SOL Bronze',
    description: 'Common Solana rewards',
    cost: 100,
    rarity: 'common',
    color: '#9945FF',
    crypto: 'solana',
    rewards: ['2-10 SOL', 'SPL Tokens', 'Solana NFTs'],
    estimatedValue: '$15-50',
  },
  {
    id: 8,
    name: 'SOL Silver',
    description: 'Premium Solana rewards',
    cost: 250,
    rarity: 'rare',
    color: '#9945FF',
    crypto: 'solana',
    rewards: ['10-30 SOL', 'DeFi Rewards', 'Validator Stakes'],
    estimatedValue: '$50-150',
  },
  {
    id: 9,
    name: 'SOL Gold',
    description: 'Legendary Solana rewards',
    cost: 500,
    rarity: 'legendary',
    color: '#9945FF',
    crypto: 'solana',
    rewards: ['25-100 SOL', 'Rare Collections', 'Ecosystem Tokens'],
    estimatedValue: '$150-500',
  },

  // Bitcoin boxes  
  {
    id: 10,
    name: 'BTC Bronze',
    description: 'Common Bitcoin rewards',
    cost: 100,
    rarity: 'common',
    color: '#F7931A',
    crypto: 'bitcoin',
    rewards: ['0.001-0.005 BTC', 'Lightning Network', 'Ordinals'],
    estimatedValue: '$15-50',
  },
  {
    id: 11,
    name: 'BTC Silver', 
    description: 'Premium Bitcoin rewards',
    cost: 250,
    rarity: 'rare',
    color: '#F7931A',
    crypto: 'bitcoin',
    rewards: ['0.005-0.015 BTC', 'Hardware Wallet', 'Mining Pool'],
    estimatedValue: '$50-150',
  },
  {
    id: 12,
    name: 'BTC Gold',
    description: 'Legendary Bitcoin rewards',
    cost: 500,
    rarity: 'legendary', 
    color: '#F7931A',
    crypto: 'bitcoin',
    rewards: ['0.01-0.05 BTC', 'Cold Storage', 'Rare Inscriptions'],
    estimatedValue: '$150-500',
  },
];

const LootBoxesScreen: React.FC = () => {
  const { authState } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CO' | 'RT' | 'YT'>('CO');
  const [selectedCrypto, setSelectedCrypto] = useState('all');
  const [allLootBoxes] = useState(getAllLootBoxes());
  const [showCryptoDropdown, setShowCryptoDropdown] = useState(false);

  // Mock loot box data - replace with actual API calls later
  const [lootBoxes] = useState([
    {
      id: 1,
      name: 'Bronze Box',
      description: 'Common rewards with surprise bonuses',
      cost: 100,
      rarity: 'common',
      color: '#CD7F32',
      rewards: ['10-50 Coins', 'Basic Coupons', 'Small IQ Boost'],
    },
    {
      id: 2,
      name: 'Silver Box',
      description: 'Premium rewards and exclusive items',
      cost: 250,
      rarity: 'rare',
      color: '#C0C0C0',
      rewards: ['50-150 Coins', 'Premium Coupons', 'Medium IQ Boost'],
    },
    {
      id: 3,
      name: 'Gold Box',
      description: 'Legendary rewards and massive bonuses',
      cost: 500,
      rarity: 'legendary',
      color: '#FFD700',
      rewards: ['100-500 Coins', 'Exclusive Coupons', 'Large IQ Boost'],
    },
  ]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleOpenLootBox = (lootBox: any) => {
    // TODO: Implement loot box opening logic
    console.log('Opening loot box:', lootBox);
    // For now, just show an alert
    alert(`Opening ${lootBox.name}! This feature is coming soon.`);
  };

  const handleGoBack = () => {
    router.back();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'COMMON':
        return '#9CA3AF';
      case 'RARE':
        return '#8B5CF6';
      case 'LEGENDARY':
        return '#F59E0B';
      default:
        return '#9CA3AF';
    }
  };

  // Filter lootboxes by selected cryptocurrency
  const getFilteredLootBoxes = () => {
    if (selectedCrypto === 'all') {
      return allLootBoxes;
    }
    return allLootBoxes.filter(box => box.crypto === selectedCrypto);
  };

  // Cryptocurrency Dropdown Component
  const getCurrentCrypto = () => {
    return cryptocurrencies.find(crypto => crypto.id === selectedCrypto) || cryptocurrencies[0];
  };
  
  const CryptocurrencyDropdown = () => {
      return (
        <View style={styles.dropdownContainer}>
          <Text style={styles.sectionTitle}>Choose Coins</Text>
          
          {/* Dropdown Button */}
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowCryptoDropdown(true)}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownButtonContent}>
              <View style={[styles.cryptoIconContainer, { backgroundColor: getCurrentCrypto().color + '20' }]}>
                <Text style={[styles.cryptoSymbol, { color: getCurrentCrypto().color }]}>
                  {getCurrentCrypto().symbol}
                </Text>
              </View>
              <Text style={styles.dropdownButtonText}>{getCurrentCrypto().name}</Text>
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
                  <Text style={styles.dropdownTitle}>Select Coins</Text>
                  <TouchableOpacity 
                    onPress={() => setShowCryptoDropdown(false)}
                    style={styles.dropdownCloseButton}
                  >
                    <Ionicons name="close" size={20} color="#A1A1AA" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.dropdownList}>
                  {cryptocurrencies.map((crypto) => (
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

  // Tab content renderers
  const renderCombinedContent = () => (
    <View style={styles.tabContent}>
      {/* Cryptocurrency Dropdown */}
      <CryptocurrencyDropdown />

      {/* LootBoxes Horizontal Scroll */}
      <View style={styles.lootBoxSection}>
        <View style={styles.lootBoxHeader}>
          <Text style={styles.sectionTitle}>
            {getCurrentCrypto().name} LootBoxes
          </Text>
          <View style={styles.cryptoIndicator}>
            <Text style={[styles.cryptoSymbol, { color: getCurrentCrypto().color }]}>
              {getCurrentCrypto().symbol}
            </Text>
          </View>
        </View>
        
        <FlatList
          data={getFilteredLootBoxes()}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lootBoxScrollContainer}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.horizontalLootBoxCard, { borderColor: item.color + '40' }]}
              onPress={() => handleOpenLootBox(item)}
              activeOpacity={0.8}
            >
              {/* Header */}
              <View style={[styles.lootBoxCardHeader, { backgroundColor: item.color + '15' }]}>
                <View style={styles.lootBoxCardIcon}>
                  <Ionicons name="cube" size={24} color={item.color} />
                </View>
                <View style={[styles.rarityBadgeHorizontal, { backgroundColor: item.color + '25' }]}>
                  <Text style={[styles.rarityTextHorizontal, { color: item.color }]}>
                    {item.rarity.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Content */}
              <View style={styles.lootBoxCardContent}>
                <Text style={styles.lootBoxCardName}>{item.name}</Text>
                <Text style={styles.lootBoxCardDescription}>{item.description}</Text>
                <Text style={styles.estimatedValue}>{item.estimatedValue}</Text>
                
                {/* Rewards Preview */}
                <View style={styles.rewardsPreview}>
                  {item.rewards.slice(0, 2).map((reward, index) => (
                    <View key={index} style={styles.rewardPreviewItem}>
                      <Ionicons name="gift-outline" size={12} color="#A1A1AA" />
                      <Text style={styles.rewardPreviewText}>{reward}</Text>
                    </View>
                  ))}
                  {item.rewards.length > 2 && (
                    <Text style={styles.moreRewards}>+{item.rewards.length - 2} more</Text>
                  )}
                </View>
              </View>

              {/* Footer */}
              <View style={styles.lootBoxCardFooter}>
                <View style={styles.keyRequirement}>
                  <Ionicons name="key" size={14} color={item.color} />
                  <Text style={[styles.keyRequirementText, { color: item.color }]}>
                    {item.cost} keys
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.openButtonSmall, { backgroundColor: item.color }]}
                  onPress={() => handleOpenLootBox(item)}
                >
                  <Text style={styles.openButtonSmallText}>Open</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Recent Activity Preview */}
      <View style={styles.recentActivityPreview}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {mockTransactions.slice(0, 3).map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
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
                {transaction.type}
              </Text>
              <Text style={styles.transactionReward}>{transaction.reward}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRecentTransactionsContent = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <Text style={styles.sectionSubtitle}>Latest lootbox openings from all users</Text>
      
      {mockTransactions.map((transaction) => (
        <BlurView key={transaction.id} intensity={40} tint="dark" style={styles.transactionCard}>
          <View style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>{transaction.avatar}</Text>
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionUser}>{transaction.user}</Text>
                <Text style={styles.transactionDescription}>
                  opened <Text style={[styles.transactionType, { color: getTypeColor(transaction.type) }]}>
                    {transaction.type}
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
    </View>
  );

  const renderYourTransactionsContent = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Your Transactions</Text>
      <Text style={styles.sectionSubtitle}>Your lootbox opening history</Text>
      
      {/* Empty state for user transactions */}
      <BlurView intensity={40} tint="dark" style={styles.emptyState}>
        <Ionicons name="cube-outline" size={48} color="#666" />
        <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
        <Text style={styles.emptyStateText}>
          You haven't opened any lootboxes yet. Complete tasks to earn keys and start opening lootboxes!
        </Text>
        <TouchableOpacity 
          style={styles.earnKeysButton}
          onPress={() => router.push('/(tabs)/offer')}
        >
          <Text style={styles.earnKeysButtonText}>Earn Keys</Text>
        </TouchableOpacity>
      </BlurView>
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

        {/* User Stats */}
        {/* <BlurView intensity={40} tint="dark" style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>Your Keys</Text>
            <View style={styles.keyBalance}>
              <Ionicons name="key" size={20} color="#F59E0B" />
              <Text style={styles.keyBalanceText}>0</Text>
            </View>
          </View>
          <Text style={styles.statsSubtext}>
            Complete tasks to earn keys and unlock amazing rewards!
          </Text>
        </BlurView> */}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'CO' && styles.activeTab]}
            onPress={() => setActiveTab('CO')}
          >
            <Text style={[styles.tabText, activeTab === 'CO' && styles.activeTabText]}>
              CO
            </Text>
            <Text style={[styles.tabLabel, activeTab === 'CO' && styles.activeTabLabel]}>
              Combined
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'RT' && styles.activeTab]}
            onPress={() => setActiveTab('RT')}
          >
            <Text style={[styles.tabText, activeTab === 'RT' && styles.activeTabText]}>
              RT
            </Text>
            <Text style={[styles.tabLabel, activeTab === 'RT' && styles.activeTabLabel]}>
              Recent Transactions
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'YT' && styles.activeTab]}
            onPress={() => setActiveTab('YT')}
          >
            <Text style={[styles.tabText, activeTab === 'YT' && styles.activeTabText]}>
              YT
            </Text>
            <Text style={[styles.tabLabel, activeTab === 'YT' && styles.activeTabLabel]}>
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
  
  // Horizontal LootBox Card (similar to offer.tsx style)
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
  rarityBadgeHorizontal: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityTextHorizontal: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  lootBoxCardContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  lootBoxCardName: {
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
});

export default LootBoxesScreen;
