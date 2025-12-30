import { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from "react-native";

interface CoinData {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  usdValue: string;
  icon: any;
}

interface CoinsListProps {
  coins: CoinData[];
  isLoadingPrices: boolean;
}

export const CoinsList: React.FC<CoinsListProps> = ({
  coins,
  isLoadingPrices,
}) => {
  // Pulse animation for loading skeleton
  const PulseBox = ({ style }: { style?: any }) => {
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }, [pulseAnim]);

    return (
      <Animated.View
        style={[
          {
            backgroundColor: "rgba(255, 255, 255, 0.4)",
            borderRadius: 8,
            opacity: pulseAnim,
          },
          style,
        ]}
      />
    );
  };

  return (
    <View style={styles.coinsList}>
      {coins.map((coin) => (
        <TouchableOpacity
          key={coin.id}
          style={styles.coinItem}
          activeOpacity={0.7}
        >
          <View style={styles.coinLeft}>
            <Image source={coin.icon} style={styles.coinIcon} />
            <View style={styles.coinInfo}>
              <Text style={styles.coinName}>{coin.name}</Text>
              <Text style={styles.coinAmount}>
                {coin.amount} {coin.symbol}
              </Text>
            </View>
          </View>
          <Text style={styles.coinValue}>
            {isLoadingPrices ? (
              <PulseBox style={{ width: 80, height: 18 }} />
            ) : (
              coin.usdValue
            )}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  coinsList: {
    gap: 12,
  },
  coinItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1b23",
    borderRadius: 16,
    padding: 16,
  },
  coinLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coinIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  coinInfo: {
    gap: 4,
  },
  coinName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  coinAmount: {
    color: "#888",
    fontSize: 14,
  },
  coinValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

