import { Ionicons } from "@expo/vector-icons";
import {  useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert, Animated, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useCurrentUser, useSendUserOperation } from "@coinbase/cdp-hooks";
import {
  createPublicClient,
  encodeFunctionData,
  formatUnits,
  http,
  parseUnits,
} from "viem";
import { base } from "viem/chains";
import { USDC_ADDRESS } from "@/constants/theme";
import { Dialog } from "./Dialog";

// ERC20 ABI for transfer
const ERC20_ABI = [
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

type CurrencyType = "USD" | "INR";

interface PortfolioCardProps {
  totalBalance: number;
  currency: CurrencyType;
  onCurrencyToggle: () => void;
  formatCurrency: (value: number) => string;
  isLoadingPrices: boolean;
  usdcBalance: bigint | undefined;
  onTransferComplete: () => void;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  totalBalance,
  currency,
  onCurrencyToggle,
  formatCurrency,
  isLoadingPrices,
  usdcBalance,
  onTransferComplete,
}) => {
  const { currentUser } = useCurrentUser();
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [amountError, setAmountError] = useState("");
  const { sendUserOperation } = useSendUserOperation();

  // Swap modal states
  const [isSwapDialogVisible, setIsSwapDialogVisible] = useState(false);
  const [fromCurrency, setFromCurrency] = useState<string>("ETH");
  const [toCurrency, setToCurrency] = useState<string>("USD");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  const smartAccount = currentUser?.evmSmartAccountObjects?.[0]?.address;

  const client = createPublicClient({
    chain: base,
    transport: http(),
  });

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

  // Validate EVM address
  const validateAddress = (address: string): boolean => {
    setAddressError("");
    if (!address) {
      setAddressError("Recipient address is required");
      return false;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setAddressError("Invalid EVM address format");
      return false;
    }
    return true;
  };

  // Validate amount
  const validateAmount = (amount: string): boolean => {
    setAmountError("");
    if (!amount) {
      setAmountError("Amount is required");
      return false;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError("Amount must be greater than 0");
      return false;
    }
    const maxAmount = usdcBalance ? parseFloat(formatUnits(usdcBalance, 6)) : 0;
    if (numAmount > maxAmount) {
      setAmountError(`Insufficient balance. Max: ${maxAmount.toFixed(2)} USDC`);
      return false;
    }
    return true;
  };

  const handleDialogClose = () => {
    setIsDialogVisible(false);
    setRecipientAddress("");
    setTransferAmount("");
    setAddressError("");
    setAmountError("");
  };

  const handleSwapDialogClose = () => {
    setIsSwapDialogVisible(false);
    setFromAmount("");
    setToAmount("");
    setShowFromDropdown(false);
    setShowToDropdown(false);
  };

  const handleSwapCurrencies = () => {
    const tempCurrency = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleSwapCrypto = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount to swap");
      return;
    }
    
    setIsSwapping(true);
    try {
      // Simulate swap operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert("Success", `Swapped ${fromAmount} ${fromCurrency} to ${toCurrency}`);
      handleSwapDialogClose();
    } catch (error) {
      Alert.alert("Error", "Swap failed. Please try again.");
    } finally {
      setIsSwapping(false);
    }
  };

  const handleSendUserUSDC = async () => {
    if (!smartAccount) {
      Alert.alert("Error", "No Smart Account available.");
      return;
    }
    const isAddressValid = validateAddress(recipientAddress);
    const isAmountValid = validateAmount(transferAmount);

    if (!isAddressValid || !isAmountValid) {
      return;
    }

    setIsTransferring(true);
    try {
      const usdcAmount = parseUnits(transferAmount, 6);

      const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [recipientAddress as `0x${string}`, usdcAmount],
      });

      const result = await sendUserOperation({
        evmSmartAccount: smartAccount as `0x${string}`,
        network: "base",
        calls: [
          {
            to: USDC_ADDRESS,
            data: transferData,
            value: 0n,
          },
        ],
      });

      if (result?.userOperationHash) {
        setIsDialogVisible(false);
        onTransferComplete();
        setRecipientAddress("");
        setTransferAmount("");
        setAddressError("");
        setAmountError("");
        Alert.alert("Transaction Success", "USDC sent successfully!");
      }
    } catch (err) {
      console.error("Transfer error:", err);
      setAmountError("Transfer failed. Please try again.");
      const message =
        err instanceof Error ? err.message : "Failed to send user operation";
      Alert.alert(
        "Transaction Failed",
        message + (message.endsWith(".") ? "" : ".")
      );
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <>
      <LinearGradient
        colors={["#186211", "#4BCF7B", "#4BCF7B", "#186211"]}
        locations={[0, 0.2, 0.5, 1]}
        style={styles.balanceCard}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
      >
        {/* Currency Toggle Button */}
        <TouchableOpacity
          style={styles.currencyToggle}
          onPress={onCurrencyToggle}
          activeOpacity={0.7}
        >
          <Text style={styles.currencySymbol}>
            {currency === "USD" ? "$" : "₹"}
          </Text>
        </TouchableOpacity>

        {isLoadingPrices ? (
          <PulseBox style={{ width: 200, height: 56, marginBottom: 12 }} />
        ) : (
          <Text style={styles.balanceAmount}>
            {totalBalance > 0
              ? formatCurrency(totalBalance)
              : currency === "USD"
              ? "$0.00"
              : "₹0.00"}
          </Text>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => setIsDialogVisible(true)}
          >
            <Ionicons
              name="arrow-up"
              style={{ transform: [{ rotate: "45deg" }] }}
              size={24}
              color="#fff"
            />
            <Text style={styles.actionText}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons name="qr-code" size={24} color="#fff" />
            <Text style={styles.actionText}>Receive</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.7}
            onPress={() => setIsSwapDialogVisible(true)}
          >
            <Ionicons name="swap-horizontal" size={24} color="#fff" />
            <Text style={styles.actionText}>Swap</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Dialog
        visible={isDialogVisible}
        onClose={handleDialogClose}
        title="Send USDC"
      >
        <View style={styles.dialogContent}>
          {/* Recipient Address Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient Address</Text>
            <TextInput
              style={[styles.input, addressError ? styles.inputError : null]}
              placeholder="0x..."
              placeholderTextColor="#666"
              value={recipientAddress}
              onChangeText={(text) => {
                setRecipientAddress(text);
                if (addressError) setAddressError("");
              }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isTransferring}
            />
            {addressError ? (
              <Text style={styles.errorText}>{addressError}</Text>
            ) : null}
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (USDC)</Text>
            <TextInput
              style={[styles.input, amountError ? styles.inputError : null]}
              placeholder="0.00"
              placeholderTextColor="#666"
              value={transferAmount}
              onChangeText={(text) => {
                const filtered = text.replace(/[^0-9.]/g, "");
                const parts = filtered.split(".");
                const formatted =
                  parts.length > 2
                    ? parts[0] + "." + parts.slice(1).join("")
                    : filtered;
                setTransferAmount(formatted);
                if (amountError) setAmountError("");
              }}
              keyboardType="decimal-pad"
              editable={!isTransferring}
            />
            {amountError ? (
              <Text style={styles.errorText}>{amountError}</Text>
            ) : null}
            {usdcBalance && !amountError ? (
              <Text style={styles.balanceHint}>
                Available: {formatUnits(usdcBalance, 6)} USDC
              </Text>
            ) : null}
          </View>

          {/* Transfer Button */}
          <TouchableOpacity
            style={[
              styles.transferButton,
              isTransferring && styles.transferButtonDisabled,
            ]}
            onPress={handleSendUserUSDC}
            disabled={isTransferring}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#FFD25D", "#FFEBA3", "#FFEBA3", "#FFD25D"]}
              style={styles.transferButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isTransferring ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.transferButtonText}>Transfer</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Dialog>

      {/* Swap Dialog */}
      <Dialog
        visible={isSwapDialogVisible}
        onClose={handleSwapDialogClose}
        title=""
      >
        <LinearGradient
          colors={["#F4C95D", "#F9D98E", "#F4C95D"]}
          style={styles.swapDialogGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <Text style={styles.swapDialogTitle}>Instant Exchange</Text>
          <View style={styles.swapDialogContent}>
          {/* From Section */}
          <View style={styles.swapSection}>
            <View style={styles.swapSectionHeader}>
              <Text style={styles.swapLabel}>From</Text>
              <Text style={styles.availableText}>Available 0.001 BTC</Text>
            </View>
            
            <View style={styles.swapInputContainer}>
              <TouchableOpacity 
                style={styles.currencySelector}
                onPress={() => {
                  setShowFromDropdown(!showFromDropdown);
                  setShowToDropdown(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.currencyIcon} />
                <Text style={styles.currencyText}>{fromCurrency}</Text>
                <Ionicons name="chevron-down" size={16} color="#fff" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.swapAmountInput}
                placeholder="0.058"
                placeholderTextColor="#666"
                value={fromAmount}
                onChangeText={(text) => {
                  const filtered = text.replace(/[^0-9.]/g, "");
                  setFromAmount(filtered);
                }}
                keyboardType="decimal-pad"
                editable={!isSwapping}
              />
            </View>

            {/* From Currency Dropdown */}
            {showFromDropdown && (
              <View style={styles.dropdown}>
                {["ETH", "USD", "INR"].map((curr) => (
                  <TouchableOpacity
                    key={curr}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setFromCurrency(curr);
                      setShowFromDropdown(false);
                    }}
                  >
                    <View style={styles.currencyIcon} />
                    <Text style={styles.dropdownItemText}>{curr}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Swap Icon */}
          <TouchableOpacity 
            style={styles.swapIconButton}
            onPress={handleSwapCurrencies}
            activeOpacity={0.7}
          >
            <Image 
              source={require('../../../assets/app-images/exchange_icon.png')}
              style={styles.swapIconImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* To Section */}
          <View style={styles.swapSection}>
            <Text style={styles.swapLabel}>To</Text>
            
            <View style={styles.swapInputContainer}>
              <TouchableOpacity 
                style={styles.currencySelector}
                onPress={() => {
                  setShowToDropdown(!showToDropdown);
                  setShowFromDropdown(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.currencyIcon} />
                <Text style={styles.currencyText}>{toCurrency}</Text>
                <Ionicons name="chevron-down" size={16} color="#fff" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.swapAmountInput}
                placeholder="0.025"
                placeholderTextColor="#666"
                value={toAmount}
                onChangeText={(text) => {
                  const filtered = text.replace(/[^0-9.]/g, "");
                  setToAmount(filtered);
                }}
                keyboardType="decimal-pad"
                editable={!isSwapping}
              />
            </View>

            {/* To Currency Dropdown */}
            {showToDropdown && (
              <View style={styles.dropdown}>
                {["ETH", "USD", "INR"].map((curr) => (
                  <TouchableOpacity
                    key={curr}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setToCurrency(curr);
                      setShowToDropdown(false);
                    }}
                  >
                    <View style={styles.currencyIcon} />
                    <Text style={styles.dropdownItemText}>{curr}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          </View>
        </LinearGradient>

          {/* Swap Button */}
          <TouchableOpacity
            style={[styles.swapButton, isSwapping && styles.swapButtonDisabled]}
            onPress={handleSwapCrypto}
            disabled={isSwapping}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#FFD25D", "#FFEBA3", "#FFEBA3", "#FFD25D"]}
              style={styles.swapButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSwapping ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.swapButtonText}>Swap Crypto</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
      </Dialog>
    </>
  );
};

const styles = StyleSheet.create({
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
    position: "relative",
  },
  currencyToggle: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  currencySymbol: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#313131",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Dialog styles
  dialogContent: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
  },
  inputError: {
    borderColor: "#ff4444",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 4,
  },
  balanceHint: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },
  transferButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  transferButtonDisabled: {
    opacity: 0.6,
  },
  transferButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  transferButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  // Swap dialog styles
  swapDialogGradient: {
    borderRadius: 12,
    padding: 24,
    paddingBottom: 24,
  },
  swapDialogTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  swapDialogContent: {
    gap: 12,
  },
  swapSection: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 18,
    paddingBottom: 20,
    position: "relative",
  },
  swapSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  swapLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  availableText: {
    color: "#888",
    fontSize: 12,
  },
  swapInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currencySelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  currencyIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFD700",
  },
  currencyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  swapAmountInput: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    paddingLeft: 16,
  },
  swapIconButton: {
    alignSelf: "center",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: -15,
    zIndex: 10,
    overflow: "hidden",
  },
  swapIconImage: {
    width: 38,
    height: 38,
  },
  dropdown: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  dropdownItemText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  swapButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 16,
    marginHorizontal: 2,
    marginBottom: 24,
    width: 280
  },
  swapButtonDisabled: {
    opacity: 0.6,
  },
  swapButtonGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  swapButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
  },
});
