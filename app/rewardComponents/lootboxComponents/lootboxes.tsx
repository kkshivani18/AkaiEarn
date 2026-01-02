import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../../stores/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCurrentUser, useSendUserOperation } from '@coinbase/cdp-hooks';
import { encodeFunctionData, parseUnits } from 'viem';
import { abi } from '../../../config/abi';
import { ErrorPopup } from '../../../components/popups/ErrorPopup';
import { InfoPopup } from '../../../components/popups/InfoPopup';
import { SuccessPopup } from '../../../components/popups/SuccessPopup';

interface LootboxCardProps {
  title: string;
  prizeRange: string;
  pointsText: string;
  imageSource: any;
  borderColor: string;
  tintColor: string;
  buttonColors: readonly [string, string, ...string[]];
  imageGradientColors?: readonly [string, string, ...string[]];
  buttonBorderColor?: string;
  buttonShadowColor?: string;
  prizeColor?: string;
  onPress?: () => void;
  disabled?: boolean;
}

const LootboxCard: React.FC<LootboxCardProps> = ({
  title,
  prizeRange,
  pointsText,
  imageSource,
  borderColor,
  tintColor,
  buttonColors,
  imageGradientColors,
  buttonBorderColor,
  buttonShadowColor,
  prizeColor = '#FFFFFF',
  onPress,
  disabled = false,
}) => {
  return (
    <View style={[styles.card, { borderColor, backgroundColor: tintColor }]}>
      <View style={styles.cardContent}>
          <Image
            source={imageSource}
            style={styles.cardImage}
            resizeMode="contain"
          />
        <View style={styles.cardTextArea}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={[styles.cardSubtitle, { color: prizeColor }]}> Win {prizeRange}</Text>
          <View style={styles.buttonContainer}>
            {buttonShadowColor && (
              <View style={[styles.buttonShadow, { backgroundColor: buttonShadowColor }]} />
            )}
            <TouchableOpacity 
              activeOpacity={0.85} 
              onPress={onPress}
              disabled={disabled}
              style={[
                styles.openButton,
                buttonBorderColor && { borderColor: buttonBorderColor },
                disabled && { opacity: 0.5 },
              ]}
            >
              <LinearGradient
                colors={buttonColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.openButtonGradient}
              >
                <Text style={styles.openButtonText}>{pointsText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export const LootboxesSection: React.FC = () => {
  const [openingBox, setOpeningBox] = useState<string | null>(null);
  const { coins, fetchUserData, updateCoins } = useUserStore();
  const { currentUser } = useCurrentUser();
  const { sendUserOperation } = useSendUserOperation();
  const [liveExpanded, setLiveExpanded] = useState(true);
  
  // Popup states
  const [showWalletRequiredPopup, setShowWalletRequiredPopup] = useState(false);
  const [showInsufficientPointsPopup, setShowInsufficientPointsPopup] = useState(false);
  const [insufficientPointsData, setInsufficientPointsData] = useState({ needed: 0, current: 0 });
  const [showLootboxOpenedPopup, setShowLootboxOpenedPopup] = useState(false);
  const [lootboxOpenedData, setLootboxOpenedData] = useState({ points: 0, remaining: 0, hash: '' });
  const [showTransactionFailedPopup, setShowTransactionFailedPopup] = useState(false);
  const [transactionFailedMessage, setTransactionFailedMessage] = useState('');
  
  const smartAccount = currentUser?.evmSmartAccountObjects?.[0]?.address;
  const contractAddress = '0x9f1e7032cef3dc4dda0ed96bd75e44f0655a3239';
  
  const liveItems = [
    { id: 'gold-1', borderColor: '#FFB917', chest: require('../../../assets/app-images/golden_box.png'), reward: '+ 50 Rewards' },
    { id: 'br-1', borderColor: '#84DE49', chest: require('../../../assets/app-images/bronze_box.png'), reward: '+ 50 Rewards' },
    { id: 'sil-1', borderColor: '#49ACCE', chest: require('../../../assets/app-images/silver_box.png'), reward: '+ 50 Rewards' },
    { id: 'gold-2', borderColor: '#FFB917', chest: require('../../../assets/app-images/golden_box.png'), reward: '+ 50 Rewards' },
  ];

  const handleOpenLootbox = async (boxType: string, points: number) => {
    // Check if wallet exists
    if (!smartAccount) {
      setShowWalletRequiredPopup(true);
      return;
    }

    // Check if user has enough points
    if (points > coins) {
      setInsufficientPointsData({ needed: points, current: coins });
      setShowInsufficientPointsPopup(true);
      return;
    }

    setOpeningBox(boxType);

    try {
      const pointsToSpend = parseUnits(points.toString(), 0);

      const transferData = encodeFunctionData({
        abi: abi,
        functionName: 'openLootcase',
        args: [pointsToSpend],
      });

      const result = await sendUserOperation({
        evmSmartAccount: smartAccount as `0x${string}`,
        network: 'base',
        calls: [
          {
            to: contractAddress,
            data: transferData,
            value: 0n,
          },
        ],
        useCdpPaymaster: true,
      });

      if (result?.userOperationHash) {
        const newCoins = coins - points;
        updateCoins(newCoins);
        console.log(`✅ Points updated: ${coins} -> ${newCoins}, hash: ${result.userOperationHash}`);

        setLootboxOpenedData({ points, remaining: newCoins, hash: result.userOperationHash });
        setShowLootboxOpenedPopup(true);
      }
    } catch (error: any) {
      console.error('❌ Failed to open lootbox:', error);
      
      let errorMessage = 'Failed to open lootbox. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      }

      setTransactionFailedMessage(errorMessage);
      setShowTransactionFailedPopup(true);
    } finally {
      setOpeningBox(null);
    }
  };

  return (
    <View style={styles.container}>
      <LootboxCard
        title="BRONZE BOX"
        prizeRange="$0.15 - $0.2"
        pointsText="Open for 100 Pts"
        imageSource={require('../../../assets/app-images/bronze_box.png')}
        borderColor="#84DE49"
        tintColor="rgba(132, 222, 73, 0.20)"
        buttonColors={['#6DBF32', '#94EE56', '#6DBF32']}
        imageGradientColors={['#6DBF32', '#94EE56', '#6DBF32']}
        buttonBorderColor="#B9F091"
        buttonShadowColor="#5DA926"
        prizeColor="#84DE49"
        onPress={() => handleOpenLootbox('bronze', 100)}
        disabled={openingBox === 'bronze'}
      />
      <LootboxCard
        title="SILVER BOX"
        prizeRange="$0.37 - $0.5"
        pointsText="Open for 200 Pts"
        imageSource={require('../../../assets/app-images/silver_box.png')}
        borderColor="#49ACCE"
        tintColor="rgba(73, 172, 206, 0.20)"
        buttonColors={['#49ACCE', '#6BD6F7']}
        buttonBorderColor="#AEE6FA"
        buttonShadowColor="#2A93B8"
        prizeColor="#49ACCE"
        onPress={() => handleOpenLootbox('silver', 200)}
        disabled={openingBox === 'silver'}
      />
      <LootboxCard
        title="GOLDEN BOX"
        prizeRange="$1.12 - $1.5"
        pointsText="Open for 500 Pts"
        imageSource={require('../../../assets/app-images/golden_box.png')}
        borderColor="#FFB917"
        tintColor="rgba(255, 185, 23, 0.20)"
        buttonColors={['#FFCD0A', '#FFB917']}
        buttonBorderColor="#FFE083"
        buttonShadowColor="#D78F00"
        prizeColor="#FFCD0A"
        onPress={() => handleOpenLootbox('golden', 500)}
        disabled={openingBox === 'golden'}
      />

      <Text style={{color: "#FFFFFF", alignSelf: 'center', marginTop: 4, fontSize: 16}}>Provably Fair & Odds</Text>
      
      <TouchableOpacity 
        activeOpacity={0.85} 
        style={styles.historyButton}
        onPress={() => router.push('/rewardComponents/lootboxComponents/lootboxHistory')}
      >
        <Image
          source={require('../../../assets/app-images/lootbox_hist.png')}
          style={styles.historyButtonImage}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <View style={styles.liveSection}>
        <View style={styles.liveHeader}>
          <Text style={styles.liveTitle}>Live LootBoxes Opening</Text>
          <TouchableOpacity onPress={() => setLiveExpanded(v => !v)} style={styles.liveToggle} activeOpacity={0.8}>
            <Ionicons name={liveExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#A1A1AA" />
          </TouchableOpacity>
        </View>
        {liveExpanded && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveList}>
            {liveItems.map(item => (
              <View key={item.id} style={[styles.liveCard, { borderColor: item.borderColor }]}>
                <View style={styles.liveCardInner}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={20} color="#000" />
                  </View>
                  <Image source={item.chest} style={styles.liveChest} resizeMode="contain" />
                  <View style={{alignItems: 'center'}}>
                    <Text style={[styles.liveRewardText, {lineHeight: 18}]}>+ 50</Text>
                    <Text style={[styles.liveRewardText, {fontSize: 12}]}>Rewards</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Popups */}
      <InfoPopup
        visible={showWalletRequiredPopup}
        title="WALLET REQUIRED"
        message="Please create your wallet in Profile first to open lootboxes."
        buttons={[
          {
            text: "OK",
            onPress: () => setShowWalletRequiredPopup(false),
            variant: 'primary'
          }
        ]}
        onClose={() => setShowWalletRequiredPopup(false)}
      />

      <InfoPopup
        visible={showInsufficientPointsPopup}
        title="INSUFFICIENT POINTS"
        message={`You need ${insufficientPointsData.needed} points to open this lootbox.\n\nYour points: ${insufficientPointsData.current}`}
        buttons={[
          {
            text: "OK",
            onPress: () => setShowInsufficientPointsPopup(false),
            variant: 'primary'
          }
        ]}
        onClose={() => setShowInsufficientPointsPopup(false)}
      />

      <SuccessPopup
        visible={showLootboxOpenedPopup}
        title="LOOTBOX OPENED!"
        message={`Transaction submitted successfully!\n\nPoints spent: ${lootboxOpenedData.points}\nRemaining points: ${lootboxOpenedData.remaining}\n\nHash: ${lootboxOpenedData.hash}`}
        onContinue={() => {
          setShowLootboxOpenedPopup(false);
        }}
      />

      <ErrorPopup
        visible={showTransactionFailedPopup}
        title="TRANSACTION FAILED"
        message={transactionFailedMessage}
        onClose={() => setShowTransactionFailedPopup(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    width: 310,
    height: 110,
    borderRadius: 10,
    borderWidth: 2,
    alignSelf: 'center',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingLeft: 12,
    // gap: 5,
    marginHorizontal: -60
  },
  cardImage: {
    width: 200,
    height: 200,
    left: 10
  },
  cardTextArea: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 16
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
    marginTop: -30,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  buttonContainer: {
    position: 'relative',
    width: 140,
  },
  buttonShadow: {
    position: 'absolute',
    width: 140,
    height: 40,
    borderRadius: 10,
    top: 5,
    left: 0,
    zIndex: 1,
  },
  openButton: {
    width: 140,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 2,
    position: 'relative',
  },
  openButtonGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  historyButton: {
    alignSelf: 'center',
    marginTop: 2,
  },
  historyButtonImage: {
    width: 231,
    height: 60,
  },
  liveSection: {
    marginTop: 10,
    // paddingHorizontal: -1,
    marginLeft: -20,
    marginRight: -20,
  },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  liveTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  liveToggle: {
    width: 28,
    height: 28,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveList: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 6,
  },
  liveCard: {
    height: 64,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  liveCardInner: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: -25
    // gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFCD0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveChest: {
    width: 100,
    height: 100,
    left: -10
  },
  liveRewardText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    left: -30,
  },
});

