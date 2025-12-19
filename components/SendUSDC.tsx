import { useCurrentUser, useSendUserOperation } from "@coinbase/cdp-hooks";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createPublicClient, encodeFunctionData, http, parseUnits } from "viem";
import { base } from "viem/chains";

interface SendUSDCProps {
  style?: any;
}

export const SendUSDC: React.FC<SendUSDCProps> = ({ style }) => {
  const { currentUser } = useCurrentUser();
  const { sendUserOperation, status } = useSendUserOperation();
  const smartAccount = currentUser?.evmSmartAccountObjects?.[0]?.address;

  const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base mainnet

  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState("0");
  const [loadingBalance, setLoadingBalance] = useState(false);

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
  ];

  // fetch USDC balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!smartAccount) return;

      setLoadingBalance(true);
      try {
        const publicClient = createPublicClient({
          chain: base,
          transport: http("https://mainnet.base.org"),
        });

        const balance = (await publicClient.readContract({
          address: USDC_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [smartAccount],
        })) as bigint;

        // Convert from 6 decimals to human readable
        const balanceInUsdc = Number(balance) / 1000000;
        setUsdcBalance(balanceInUsdc.toFixed(2));
      } catch (error) {
        console.error("Failed to fetch USDC balance:", error);
        setUsdcBalance("0");
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [smartAccount]);

  const validateAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleSendUSDC = async () => {
    if (!smartAccount) {
      Alert.alert("Error", "No Smart Account available.");
      return;
    }

    // Validation
    if (!recipientAddress.trim()) {
      Alert.alert("Validation Error", "Please enter recipient address");
      return;
    }

    if (!validateAddress(recipientAddress)) {
      Alert.alert("Invalid Address", "Please enter a valid Ethereum address (0x...)");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0");
      return;
    }

    const amountFloat = parseFloat(amount);
    const balanceFloat = parseFloat(usdcBalance);

    if (amountFloat > balanceFloat) {
      Alert.alert(
        "Insufficient Balance",
        `You only have ${usdcBalance} USDC. Cannot send ${amount} USDC.`
      );
      return;
    }

    // Confirm before sending
    Alert.alert(
      "Confirm Transfer",
      `Send ${amount} USDC to:\n${recipientAddress}`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Send",
          style: "default",
          onPress: () => executeSend(),
        },
      ]
    );
  };

  const executeSend = async () => {
    setSending(true);
    try {
      const amountInUnits = parseUnits(amount, 6); // USDC has 6 decimals

      const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [recipientAddress as `0x${string}`, amountInUnits],
      });

      const result = await sendUserOperation({
        evmSmartAccount: smartAccount as `0x${string}`,
        network: "base",
        calls: [
          {
            to: USDC_ADDRESS as `0x${string}`,
            data: transferData,
            value: 0n,
          },
        ],
        // useCdpPaymaster: true,
      });

      if (result?.userOperationHash) {
        Alert.alert(
          "Transaction Success",
          `Sent ${amount} USDC successfully!\n\nTransaction Hash:\n${result.userOperationHash.slice(0, 10)}...${result.userOperationHash.slice(-8)}`
        );

        setRecipientAddress("");
        setAmount("");

        // Refresh balance
        setTimeout(() => {
          const fetchBalance = async () => {
            if (!smartAccount) return;
            try {
              const publicClient = createPublicClient({
                chain: base,
                transport: http("https://mainnet.base.org"),
              });

              const balance = (await publicClient.readContract({
                address: USDC_ADDRESS as `0x${string}`,
                abi: ERC20_ABI,
                functionName: "balanceOf",
                args: [smartAccount],
              })) as bigint;

              const balanceInUsdc = Number(balance) / 1000000;
              setUsdcBalance(balanceInUsdc.toFixed(2));
            } catch (error) {
              console.error("Failed to refresh balance:", error);
            }
          };
          fetchBalance();
        }, 3000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transfer failed";
      Alert.alert("Transaction Failed", message);
    } finally {
      setSending(false);
    }
  };

  if (!smartAccount) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.noWalletText}>
          Please create a CDP Smart Wallet first to send USDC
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Send USDC</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Your Balance:</Text>
          {loadingBalance ? (
            <ActivityIndicator size="small" color="#0052FF" />
          ) : (
            <Text style={styles.balanceValue}>{usdcBalance} USDC</Text>
          )}
        </View>
        {/* <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Your wallet needs ~0.001 ETH on Base network to pay for gas fees
          </Text>
        </View> */}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Recipient Address</Text>
        <TextInput
          style={styles.input}
          placeholder="0x..."
          value={recipientAddress}
          onChangeText={setRecipientAddress}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Amount (USDC)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={styles.maxButton}
          onPress={() => setAmount(usdcBalance)}
        >
          <Text style={styles.maxButtonText}>MAX</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.sendButton,
          (sending || status === "pending") && styles.sendButtonDisabled,
        ]}
        onPress={handleSendUSDC}
        disabled={sending || status === "pending"}
      >
        {sending || status === "pending" ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.sendButtonText}>Send USDC</Text>
        )}
      </TouchableOpacity>

      {status === "success" && (
        <View style={styles.statusContainer}>
          <Text style={styles.successText}>✓ Transaction Successful</Text>
        </View>
      )}

      {status === "error" && (
        <View style={styles.statusContainer}>
          <Text style={styles.errorText}>✗ Transaction Failed</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 12,
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6c757d",
    marginRight: 8,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0052FF",
  },
  warningContainer: {
    backgroundColor: "#fff3cd",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  warningText: {
    fontSize: 12,
    color: "#856404",
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
    position: "relative",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#212529",
    backgroundColor: "#ffffff",
  },
  maxButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    backgroundColor: "#e9ecef",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  maxButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#495057",
  },
  sendButton: {
    backgroundColor: "#0052FF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  statusContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  successText: {
    color: "#28a745",
    fontSize: 14,
    fontWeight: "500",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 14,
    fontWeight: "500",
  },
  noWalletText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    padding: 20,
  },
});
