import { abi } from "@/config/abi";
import { useCurrentUser, useSendUserOperation } from "@coinbase/cdp-hooks";
import { useState } from "react";
import { View, Text, Alert, Button } from "react-native";
import { encodeFunctionData, parseUnits } from "viem";

interface Props {}

function UserOps(props: Props) {
  const { currentUser } = useCurrentUser();
  const { sendUserOperation, data, error, status } = useSendUserOperation();
  const smartAccount = currentUser?.evmSmartAccountObjects?.[0]?.address;
  const contractAddress = "0x9f1e7032cef3dc4dda0ed96bd75e44f0655a3239";
  const [errorMessage, setErrorMessage] = useState("");

  const handleOpenLootcase = async () => {
    if (!smartAccount) {
      Alert.alert("Error", "No Smart Account available.");
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

  return (
    <View>
      <Button title="Open Lootcase" onPress={handleOpenLootcase} />
      <Button title="Withdraw USDC" onPress={handleWithdrawUSDC} />
      {errorMessage && <Text>{errorMessage}</Text>}
      {status === "success" && <Text>Transaction Success</Text>}
      {status === "error" && <Text>Transaction Failed</Text>}
      {status === "pending" && <Text>Transaction Pending</Text>}
    </View>
  );
}

export default UserOps;
