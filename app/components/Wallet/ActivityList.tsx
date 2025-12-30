import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from "react-native";
import { formatUnits } from "viem";

interface Transaction {
  txHash: string;
  blockNumber: bigint;
  from: string;
  to: string;
  amount: bigint;
  type: "sent" | "received";
}

interface ActivityListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  transactions,
  isLoading,
}) => {
  const handleTransactionPress = async (tx: Transaction) => {
    const url = `https://basescan.org/tx/${tx.txHash}`;
    Alert.alert(
      "Transaction Details",
      `Hash: ${tx.txHash.slice(0, 10)}...${tx.txHash.slice(
        -8
      )}\n\nTap "Copy Link" to copy the block explorer link.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Copy Link",
          onPress: async () => {
            await Clipboard.setStringAsync(url);
            Alert.alert("Copied!", "Block explorer link copied.");
          },
        },
      ]
    );
  };

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

  if (isLoading) {
    return (
      <View style={styles.activityContainer}>
        <View style={styles.transactionsList}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <PulseBox style={{ width: 44, height: 44, borderRadius: 22 }} />
                <View style={styles.transactionInfo}>
                  <PulseBox
                    style={{ width: 80, height: 16, marginBottom: 8 }}
                  />
                  <PulseBox style={{ width: 120, height: 12 }} />
                </View>
              </View>
              <View style={styles.transactionRight}>
                <PulseBox style={{ width: 90, height: 16, marginBottom: 6 }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.activityContainer}>
        <Text style={styles.emptyText}>No recent transactions</Text>
      </View>
    );
  }

  return (
    <View style={styles.activityContainer}>
      <View style={styles.transactionsList}>
        {transactions.map((tx, index) => (
          <TouchableOpacity
            key={`${tx.txHash}-${index}`}
            style={styles.transactionItem}
            activeOpacity={0.7}
            onPress={() => handleTransactionPress(tx)}
          >
            <View style={styles.transactionLeft}>
              <View
                style={[
                  styles.transactionIcon,
                  tx.type === "sent"
                    ? styles.transactionIconSent
                    : styles.transactionIconReceived,
                ]}
              >
                <Ionicons
                  name={tx.type === "sent" ? "arrow-up" : "arrow-down"}
                  size={20}
                  color="#fff"
                />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionType}>
                  {tx.type === "sent" ? "Sent" : "Received"}
                </Text>
                <Text style={styles.transactionAddress}>
                  {tx.type === "sent"
                    ? `To: ${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`
                    : `From: ${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`}
                </Text>
              </View>
            </View>
            <View style={styles.transactionRight}>
              <Text
                style={[
                  styles.transactionAmount,
                  tx.type === "sent"
                    ? styles.transactionAmountSent
                    : styles.transactionAmountReceived,
                ]}
              >
                {tx.type === "sent" ? "-" : "+"}
                {formatUnits(tx.amount, 6)} USDC
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  activityContainer: {
    flex: 1,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 40,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1b23",
    borderRadius: 16,
    padding: 16,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionIconSent: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  transactionIconReceived: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
  },
  transactionInfo: {
    gap: 4,
    flex: 1,
  },
  transactionType: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  transactionAddress: {
    color: "#888",
    fontSize: 12,
  },
  transactionRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  transactionAmountSent: {
    color: "#ef4444",
  },
  transactionAmountReceived: {
    color: "#22c55b",
  },
  transactionBlock: {
    color: "#666",
    fontSize: 11,
  },
});
