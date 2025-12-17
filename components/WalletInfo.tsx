import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useEvmAddress, useCurrentUser, useCreateEvmSmartAccount,useIsSignedIn } from "@coinbase/cdp-hooks";
import { useAuth } from '@/contexts/AuthContext';

interface WalletInfoProps {
  style?: any;
  points?: number;
}

export const WalletInfo: React.FC<WalletInfoProps> = ({ style, points = 0 }) => {
  const { evmAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  const { isSignedIn } = useIsSignedIn();
  const { createEvmSmartAccount } = useCreateEvmSmartAccount();
  const [creatingWallet, setCreatingWallet] = useState(false);
  const {onWalletCreated}=useAuth()

  const MIN_POINTS_REQ = 500;
  const hasEnoughPoints = points >= MIN_POINTS_REQ;

  // Use EVM address if available, otherwise fall back to smart account
  const walletAddress = evmAddress || currentUser?.evmSmartAccountObjects?.[0]?.address;
console.log(currentUser);

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyWalletAddress = async () => {
    if (!walletAddress) return;

    try {
      await Clipboard.setStringAsync(walletAddress);
      Alert.alert("Copied!", "Wallet address copied to clipboard.");
    } catch (error) {
      Alert.alert("Error", "Failed to copy wallet address.");
    }
  };


  const createWallet = async () => {
    if (!hasEnoughPoints) {
      Alert.alert(
        "Insufficient Points",
        `You need at least ${MIN_POINTS_REQ} points to create a wallet.`
      );
      return;
    }

    setCreatingWallet(true);
    try {
      console.log(isSignedIn);
      
      if (!isSignedIn) {
        Alert.alert("Error", "Not Logged In CDP yet");
        return;
      }
      // Use CDP hook to create EVM smart account
      const result = await createEvmSmartAccount({
        enableSpendPermissions:true
      });

      if (result) {
        Alert.alert("Success", `Smart wallet created!\nAddress: ${result}...`);
        console.log("Wallet created:", result);

        // Call callback to refresh wallet data
        onWalletCreated();
      } else {
        throw new Error("Wallet creation failed - no address returned");
      }
    } catch (error: any) {
      console.error("Wallet creation error:", error);
      Alert.alert("Error", error.message || "Failed to create smart wallet");
    } finally {
      setCreatingWallet(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>CDP Smart Wallet</Text>

      {walletAddress ? (
        // Show wallet address if it exists
        <TouchableOpacity onPress={copyWalletAddress} style={styles.addressContainer}>
          <Text style={styles.address}>{formatAddress(walletAddress)}</Text>
        </TouchableOpacity>
      ): (
        // Show create wallet button if signed into CDP but no wallet exists
        <>
          <TouchableOpacity
            onPress={createWallet}
            style={[
              styles.createButton,
              (creatingWallet || !hasEnoughPoints) && styles.buttonDisabled
            ]}
            disabled={creatingWallet || !hasEnoughPoints}
          >
            {creatingWallet ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.createButtonText}>Create Smart Wallet</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  addressContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  address: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    fontFamily: 'monospace',
  },
  createButton: {
    backgroundColor: '#0052FF', // CDP blue
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  pointsRequirement: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});