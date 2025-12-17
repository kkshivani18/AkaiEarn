import { abi } from "@/config/abi";
import { useUserStore } from "@/stores/userStore";
import { useCurrentUser, useSendUserOperation } from "@coinbase/cdp-hooks";
import { useState } from "react";
import { Alert, Button, Text, View } from "react-native";
import { Snackbar } from "react-native-paper";
import { encodeFunctionData, parseUnits } from "viem";

interface Props {}

function UserOps(props: Props) {
  const { currentUser } = useCurrentUser();
  const { sendUserOperation, data, error, status } = useSendUserOperation();
  const { fetchUserData, updateCoins, coins } = useUserStore();
  const smartAccount = currentUser?.evmSmartAccountObjects?.[0]?.address;
  const contractAddress = "0x9f1e7032cef3dc4dda0ed96bd75e44f0655a3239";
  const [errorMessage, setErrorMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleOpenLootcase = async () => {
    if (!smartAccount) {
      Alert.alert("Error", "No Smart Account available.");
      return;
    }

    const requiredCoins = 200;
    if (coins < requiredCoins) {
      const message = `Insufficient coins. You need ${requiredCoins} coins to open lootcase.`;
      console.log("UserOps Lootcase Error:", message);
      setSnackbarMessage(message);
      setSnackbarVisible(true);
      return;
    }

    setErrorMessage("");

    try {
      const pointsToSpend = parseUnits("200", 0);

      const transferData = encodeFunctionData({
        abi: abi,
        functionName: "openLootcase",
        args: [pointsToSpend],
      });

      const result = await sendUserOperation({
        evmSmartAccount: smartAccount as `0x${string}`,
        network: "base",
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
        Alert.alert("Transaction Success", "User operation sent successfully");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send user operation";
      setErrorMessage(message);
      Alert.alert(
        "Transaction Failed",
        message + (message.endsWith(".") ? "" : ".")
      );
    }
  };

  const handleWithdrawUSDC = async () => {
    if (!smartAccount) {
      Alert.alert("Error", "No Smart Account available.");
      return;
    }
    try {
      const transferData = encodeFunctionData({
        abi: abi,
        functionName: "withdrawUSDC",
        args: [],
      });

      const result = await sendUserOperation({
        evmSmartAccount: smartAccount as `0x${string}`,
        network: "base",
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
        Alert.alert("Transaction Success", "USDC withdrawal initiated!");
        
        setTimeout(async () => {
          await fetchUserData();
        }, 2000);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send user operation";
      setErrorMessage(message);
      Alert.alert(
        "Transaction Failed",
        message + (message.endsWith(".") ? "" : ".")
      );
    }
  };

  return (
    <View>
      <Button title="Open Lootcase" onPress={handleOpenLootcase} />
      <Button title="Withdraw USDC" onPress={handleWithdrawUSDC} />
      {errorMessage && <Text>{errorMessage}</Text>}
      {status === "success" && <Text>Transaction Success</Text>}
      {status === "error" && <Text>Transaction Failed</Text>}
      {status === "pending" && <Text>Transaction Pending</Text>}
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: "OK",
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

export default UserOps;
