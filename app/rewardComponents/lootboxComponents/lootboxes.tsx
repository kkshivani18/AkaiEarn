import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { lootBoxAPI } from '../../../services/api';
import { useBalance } from '../../../contexts/BalanceContext';
import { useUserStore } from '../../../stores/userStore';
import { Ionicons } from '@expo/vector-icons';

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
          <Text style={styles.cardSubtitle}>{prizeRange}</Text>
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
  const { name, iq, coins } = useUserStore();
  const [liveExpanded, setLiveExpanded] = useState(true);
  const liveItems = [
    { id: 'gold-1', borderColor: '#FFB917', chest: require('../../../assets/app-images/golden_box.png'), reward: '+ 50 Rewards' },
    { id: 'br-1', borderColor: '#84DE49', chest: require('../../../assets/app-images/bronze_box.png'), reward: '+ 50 Rewards' },
    { id: 'sil-1', borderColor: '#49ACCE', chest: require('../../../assets/app-images/silver_box.png'), reward: '+ 50 Rewards' },
    { id: 'gold-2', borderColor: '#FFB917', chest: require('../../../assets/app-images/golden_box.png'), reward: '+ 50 Rewards' },
  ];

  const handleOpenLootbox = async (boxType: string, points: number, boxId: string) => {
    const userPoints = coins;
    
    if (points > userPoints) {
      Alert.alert(
        'Insufficient Points',
        `You need ${points} points. \nYour points: ${userPoints}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setOpeningBox(boxType);

    try {
      const response = await lootBoxAPI.openLootBox(boxId, points);

      if (response.success) {
        const reward = response.reward;

        Alert.alert(
          'Lootbox Unlocked!',
          `You received:\n\n💰 ${reward.cryptoAmount} ${reward.cryptoSymbol}\n\nRemaining Points: ${response.userStats.remainingPoints}`,
          [{ text: 'Awesome!' }]
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
      setOpeningBox(null);
    }
  };

  return (
    <View style={styles.container}>
      <LootboxCard
        title="BRONZE BOX"
        prizeRange="Win $0.15 - $0.2"
        pointsText="Open for 100 Pts"
        imageSource={require('../../../assets/app-images/bronze_box.png')}
        borderColor="#84DE49"
        tintColor="rgba(132, 222, 73, 0.20)"
        buttonColors={['#6DBF32', '#94EE56', '#6DBF32']}
        imageGradientColors={['#6DBF32', '#94EE56', '#6DBF32']}
        buttonBorderColor="#B9F091"
        buttonShadowColor="#5DA926"
        onPress={() => handleOpenLootbox('bronze', 100, 'bronze-box-id')}
        disabled={openingBox === 'bronze'}
      />
      <LootboxCard
        title="SILVER BOX"
        prizeRange="Win $0.37 - $0.5"
        pointsText="Open for 200 Pts"
        imageSource={require('../../../assets/app-images/silver_box.png')}
        borderColor="#49ACCE"
        tintColor="rgba(73, 172, 206, 0.20)"
        buttonColors={['#49ACCE', '#6BD6F7']}
        buttonBorderColor="#AEE6FA"
        buttonShadowColor="#2A93B8"
        onPress={() => handleOpenLootbox('silver', 200, 'silver-box-id')}
        disabled={openingBox === 'silver'}
      />
      <LootboxCard
        title="GOLDEN BOX"
        prizeRange="Win $1.12 - $1.5"
        pointsText="Open for 500 Pts"
        imageSource={require('../../../assets/app-images/golden_box.png')}
        borderColor="#FFB917"
        tintColor="rgba(255, 185, 23, 0.20)"
        buttonColors={['#FFCD0A', '#FFB917']}
        buttonBorderColor="#FFE083"
        buttonShadowColor="#D78F00"
        onPress={() => handleOpenLootbox('golden', 500, 'golden-box-id')}
        disabled={openingBox === 'golden'}
      />

      <Text style={{color: "#FFFFFF", alignSelf: 'center', marginTop: 12, fontSize: 16}}>Provably Fair & Odds</Text>
      
      <TouchableOpacity activeOpacity={0.85} style={styles.historyButton}>
        <Image
          source={require('../../../assets/app-images/loot_hist_button.png')}
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
                  <Text style={styles.liveRewardText}>{item.reward}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
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
    width: 340,
    height: 150,
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
    width: 270,
    height: 270,
  },
  cardTextArea: {
    flex: 1,
    marginHorizontal: -50
  },
  cardTitle: {
    fontSize: 21,
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
    width: 151,
  },
  buttonShadow: {
    position: 'absolute',
    width: 151,
    height: 40,
    borderRadius: 10,
    top: 5,
    left: 0,
    zIndex: 1,
  },
  openButton: {
    width: 151,
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
    marginTop: 10,
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
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveList: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 12,
  },
  liveCard: {
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  liveCardInner: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
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
  },
  liveRewardText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

