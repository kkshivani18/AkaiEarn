import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text,ScrollView,StyleSheet,TouchableOpacity, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeaderSection } from "../components/HeaderSection";
import { useCurrentUser } from "@coinbase/cdp-hooks";
import { createPublicClient, formatUnits, http, parseAbiItem } from "viem";
import { base } from "viem/chains";
import { USDC_ADDRESS } from "@/constants/theme";
import { PortfolioCard } from "../components/Wallet/PortfolioCard";
import { CoinsList } from "../components/Wallet/CoinsList";
import { ActivityList } from "../components/Wallet/ActivityList";
import { FONTS } from '../../constants/fonts';

// ERC20 ABI for balance and transfer
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

type TabType = "coins" | "activity";

interface CoinData {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  usdValue: string;
  icon: any;
}

type CurrencyType = "USD" | "INR";

interface Transaction {
  txHash: string;
  blockNumber: bigint;
  from: string;
  to: string;
  amount: bigint;
  type: "sent" | "received";
  timestamp?: number;
}

export default function WalletScreen() {
  const { currentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabType>("coins");
  const [ethBalance, setEthBalance] = useState<bigint | undefined>(undefined);
  const [usdcBalance, setUsdcBalance] = useState<bigint | undefined>(undefined);
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [usdcPrice, setUsdcPrice] = useState<number>(1);
  const [currency, setCurrency] = useState<CurrencyType>("USD");
  const [isLoadingPrices, setIsLoadingPrices] = useState<boolean>(true);
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  const smartAccount = currentUser?.evmSmartAccountObjects?.[0]?.address;

  const client = createPublicClient({
    chain: base,
    transport: http(),
  });

  // Fetch token prices from Coinbase API
  const fetchPrices = useCallback(async () => {
    setIsLoadingPrices(true);
    try {
      // Fetch both prices in parallel
      const [ethResponse, usdcResponse] = await Promise.all([
        fetch(`https://api.coinbase.com/v2/prices/ETH-${currency}/spot`),
        fetch(`https://api.coinbase.com/v2/prices/USDC-${currency}/spot`),
      ]);

      const ethData = await ethResponse.json();
      const usdcData = await usdcResponse.json();

      if (ethData?.data?.amount) {
        setEthPrice(parseFloat(ethData.data.amount));
      }

      if (usdcData?.data?.amount) {
        setUsdcPrice(parseFloat(usdcData.data.amount));
      }
    } catch (error) {
      console.error("Error fetching prices:", error);
    } finally {
      setIsLoadingPrices(false);
    }
  }, [currency]);

  const getBalance = useCallback(async () => {
    if (!smartAccount) return;

    // Only show loading on first fetch, not on subsequent polls
    if (ethBalance === undefined || usdcBalance === undefined) {
      setIsLoadingBalances(true);
    }

    try {
      // Get ETH balance
      const newEthBalance = await client.getBalance({
        address: smartAccount as `0x${string}`,
      });

      // Get USDC balance
      const newUsdcBalance = await client.readContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [smartAccount as `0x${string}`],
      });

      // Only update state if values actually changed
      if (newEthBalance !== ethBalance) {
        setEthBalance(newEthBalance);
      }

      if (newUsdcBalance !== usdcBalance) {
        setUsdcBalance(newUsdcBalance as bigint);
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [smartAccount, ethBalance, usdcBalance]);

  // Fetch transaction history
  const fetchTransactionHistory = useCallback(async () => {
    if (!smartAccount) return;

    setIsLoadingTransactions(true);
    try {
      // Get recent blocks (last ~10000 blocks = ~5 hours on Base)
      const toBlock = await client.getBlockNumber();
      const fromBlock = toBlock - 10000n;

      // Fetch Transfer events where user is sender or receiver
      const [sentLogs, receivedLogs] = await Promise.all([
        // Sent transactions (user is 'from')
        client.getLogs({
          address: USDC_ADDRESS as `0x${string}`,
          event: parseAbiItem(
            "event Transfer(address indexed from, address indexed to, uint256 value)"
          ),
          args: {
            from: smartAccount as `0x${string}`,
          },
          fromBlock,
          toBlock,
        }),
        // Received transactions (user is 'to')
        client.getLogs({
          address: USDC_ADDRESS as `0x${string}`,
          event: parseAbiItem(
            "event Transfer(address indexed from, address indexed to, uint256 value)"
          ),
          args: {
            to: smartAccount as `0x${string}`,
          },
          fromBlock,
          toBlock,
        }),
      ]);

      // Combine and format
      const allTransactions: Transaction[] = [...sentLogs, ...receivedLogs].map(
        (log) => ({
          txHash: log.transactionHash || "",
          blockNumber: log.blockNumber || 0n,
          from: log.args.from || "",
          to: log.args.to || "",
          amount: log.args.value || 0n,
          type:
            log.args.from?.toLowerCase() === smartAccount.toLowerCase()
              ? "sent"
              : "received",
        })
      );

      // Sort by block number (newest first)
      const sortedTransactions = allTransactions.sort(
        (a, b) => Number(b.blockNumber) - Number(a.blockNumber)
      );

      setTransactions(sortedTransactions);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [smartAccount]);

  useEffect(() => {
    // Fetch prices immediately and then every 30 seconds
    fetchPrices();
    const priceInterval = setInterval(fetchPrices, 30000);

    // Fetch balances immediately and then every 5 seconds
    getBalance();
    const balanceInterval = setInterval(getBalance, 5000);

    // Fetch transaction history immediately
    fetchTransactionHistory();

    return () => {
      clearInterval(priceInterval);
      clearInterval(balanceInterval);
    };
  }, [getBalance, fetchPrices, fetchTransactionHistory]);

  // Refetch transactions when switching to activity tab
  useEffect(() => {
    if (activeTab === "activity" && transactions.length === 0) {
      fetchTransactionHistory();
    }
  }, [activeTab, fetchTransactionHistory, transactions.length]);

  const handleNotificationPress = () => {
    console.log("Notification pressed");
  };

  const handleMenuPress = () => {
    console.log("Menu pressed");
  };

  // Calculate USD values - memoized to prevent unnecessary recalculations
  const ethAmount = useMemo(
    () => (ethBalance ? parseFloat(formatUnits(ethBalance, 18)) : 0),
    [ethBalance]
  );

  const usdcAmount = useMemo(
    () => (usdcBalance ? parseFloat(formatUnits(usdcBalance, 6)) : 0),
    [usdcBalance]
  );

  const ethUsdValue = useMemo(
    () => ethAmount * ethPrice,
    [ethAmount, ethPrice]
  );
  const usdcUsdValue = useMemo(
    () => usdcAmount * usdcPrice,
    [usdcAmount, usdcPrice]
  );
  const totalBalance = useMemo(
    () => ethUsdValue + usdcUsdValue,
    [ethUsdValue, usdcUsdValue]
  );

  // Format number to display with 2 decimals for currency values
  const formatCurrency = useCallback(
    (value: number) => {
      return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-IN", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    },
    [currency]
  );

  // Toggle currency
  const toggleCurrency = () => {
    setCurrency((prev) => (prev === "USD" ? "INR" : "USD"));
  };

  // Handle transfer complete - refresh balances and transactions
  const handleTransferComplete = async () => {
    await getBalance();
    // Refresh transaction history after successful transfer
    setTimeout(() => fetchTransactionHistory(), 2000);
  };

  // Format token amounts (show more decimals for small amounts)
  const formatTokenAmount = useCallback(
    (amount: number, decimals: number = 4) => {
      if (amount === 0) return "0";
      if (amount < 0.0001) return amount.toFixed(8);
      if (amount < 1) return amount.toFixed(6);
      return amount.toFixed(decimals);
    },
    []
  );

  // Coins data with real-time prices - memoized to prevent re-renders
  const coinsData: CoinData[] = useMemo(
    () => [
      {
        id: "eth",
        name: "Ethereum",
        symbol: "ETH",
        amount: formatTokenAmount(ethAmount),
        usdValue: formatCurrency(ethUsdValue),
        icon: require("../../assets/app-images/eth.png"),
      },
      {
        id: "usdc",
        name: "USD Coin",
        symbol: "USDC",
        amount: formatTokenAmount(usdcAmount, 2),
        usdValue: formatCurrency(usdcUsdValue),
        icon: require("../../assets/app-images/usdc.png"),
      },
    ],
    [
      ethAmount,
      usdcAmount,
      ethUsdValue,
      usdcUsdValue,
      formatCurrency,
      formatTokenAmount,
    ]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <HeaderSection
        onNotificationPress={handleNotificationPress}
        onMenuPress={handleMenuPress}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Portfolio Card */}
          <PortfolioCard
            totalBalance={totalBalance}
            currency={currency}
            onCurrencyToggle={toggleCurrency}
            formatCurrency={formatCurrency}
            isLoadingPrices={isLoadingPrices}
            usdcBalance={usdcBalance}
            onTransferComplete={handleTransferComplete}
          />

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "coins" && styles.activeTab]}
              onPress={() => setActiveTab("coins")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "coins" && styles.activeTabText,
                ]}
              >
                Coins
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "activity" && styles.activeTab]}
              onPress={() => setActiveTab("activity")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "activity" && styles.activeTabText,
                ]}
              >
                Activity
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content based on active tab */}
          {activeTab === "coins" ? (
            <CoinsList coins={coinsData} isLoadingPrices={isLoadingPrices} />
          ) : (
            <ActivityList
              transactions={transactions}
              isLoading={isLoadingTransactions}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0b0f",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#fff",
  },
  tabText: {
    color: "#666",
    fontSize: 16,
    fontFamily: FONTS.body.semiBold,
  },
  activeTabText: {
    color: "#fff",
  },
});
