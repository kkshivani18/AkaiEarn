import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, Animated, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "../../stores/userStore";
import { useAuth } from "../../contexts/AuthContext";
import { router } from "expo-router";
import IQMeter from "../../components/IQMeter";
import { configAPI, contractAPI, logsAPI } from "../../services/api";
import { useCurrentUser, useCreateEvmSmartAccount, useIsSignedIn, useSendUserOperation } from "@coinbase/cdp-hooks";
import { encodeFunctionData } from "viem";
import { abi } from "../../config/abi";
import { InfoPopup } from "../../components/popups/InfoPopup";
import { ErrorPopup } from "../../components/popups/ErrorPopup";
import { SuccessPopup } from "../../components/popups/SuccessPopup";
import { contractAddress } from "@/constants/theme";

export default function ProfileScreen() {
  const { name, iq, coins, balance, dollars, fetchUserData } = useUserStore();
  const { onLogout } = useAuth();
  const { currentUser } = useCurrentUser();
  const { createEvmSmartAccount } = useCreateEvmSmartAccount();
  const { isSignedIn } = useIsSignedIn();
  const { sendUserOperation, status } = useSendUserOperation();
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [longestStreak, setLongestStreak] = useState<number>(0);
  const [loadingStreak, setLoadingStreak] = useState<boolean>(true);
  const [labelHistoryCount, setLabelHistoryCount] = useState<number>(0);
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [callsId, setCallsId] = useState<string>();
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  // Popup states
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorPopupMessage, setErrorPopupMessage] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successPopupMessage, setSuccessPopupMessage] = useState("");
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [infoPopupData, setInfoPopupData] = useState({
    title: "",
    message: "",
  });
  const [showAuthIssuePopup, setShowAuthIssuePopup] = useState(false);

  const smartAccount = currentUser?.evmSmartAccountObjects?.[0]?.address;

  const [errorMessage, setErrorMessage] = useState("");

  const displayName = name || "User";
  const displayIq = typeof iq === "number" ? iq : 200;
  const points = typeof coins === "number" && coins > 0 ? coins : 0;

  const appRewardsUsd = typeof balance === "number" ? balance / 1_00 : 0;
  const walletBalanceUsd = typeof dollars === "number" ? dollars : 0;

  const walletUnlockTarget = 200;
  const progress = Math.max(0, Math.min(1, points / walletUnlockTarget));
  const hasUnlockedWallet = points >= walletUnlockTarget;
  const canWithdraw = balance >= 1_00;

  useEffect(() => {
    // check if user already has a wallet
    const existingWallet = currentUser?.evmSmartAccountObjects?.[0]?.address;
    if (existingWallet) {
      setWalletAddress(existingWallet);
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        setLoadingStreak(true);
        const response = await configAPI.checkDailyStreak();
        if (response) {
          setCurrentStreak(response.streakCount || 0);
          setLongestStreak(response.longestStreak || 0);
        }
      } catch (error) {
        console.error("Error fetching streak data:", error);
        setCurrentStreak(0);
        setLongestStreak(0);
      } finally {
        setLoadingStreak(false);
      }
    };

    fetchStreak();

    const fetchLabelHistoryCount = async () => {
      try {
        const response = await logsAPI.getMyLogs();
        if (response && response.success && response.data) {
          setLabelHistoryCount(response.data.length);
        } else if (response && Array.isArray(response)) {
          setLabelHistoryCount(response.length);
        } else {
          setLabelHistoryCount(0);
        }
      } catch (error) {
        console.error("Error fetching label history:", error);
        setLabelHistoryCount(0);
      }
    };

    fetchLabelHistoryCount();
  }, []);

  const handleCreateWallet = async () => {
    if (!hasUnlockedWallet) {
      setInfoPopupData({
        title: "INSUFFICIENT POINTS",
        message: `You need at least ${walletUnlockTarget} points to create a wallet. Current points: ${points}`,
      });
      setShowInfoPopup(true);
      return;
    }

    if (!isSignedIn) {
      setInfoPopupData({
        title: "AUTHENTICATION REQUIRED",
        message:
          "Not authenticated with CDP. Please logout and login again to authenticate.",
      });
      setShowInfoPopup(true);
      return;
    }

    setCreatingWallet(true);
    try {
      // Create CDP smart wallet
      const result = await createEvmSmartAccount({
        enableSpendPermissions: true,
      });

      if (result) {
        console.log("✅ Wallet created:", result);
        setWalletAddress(result);

        // Register user on-chain via backend
        try {
          const response = await contractAPI.createUser(result);
          if (response.success) {
            setSuccessPopupMessage(
              `You are registered.\n\nYour walletAddress is: ${result.slice(
                0,
                6
              )}...${result.slice(-4)}`
            );
            setShowSuccessPopup(true);
          }
        } catch (backendError: any) {
          console.error("❌ Backend registration error:", backendError);
          setInfoPopupData({
            title: "WALLET CREATED",
            message: `Wallet created but backend registration failed: ${
              backendError.response?.data?.message || backendError.message
            }`,
          });
          setShowInfoPopup(true);
        }
      } else {
        throw new Error("Wallet creation failed - no address returned");
      }
    } catch (error: any) {
      console.error("❌ Wallet creation error:", error);

      // Check for temporary secret error
      if (
        error.message?.includes("Temporary secret not found") ||
        error.message?.includes("APIError")
      ) {
        setShowAuthIssuePopup(true);
      } else {
        setErrorPopupMessage(error.message || "Failed to create smart wallet");
        setShowErrorPopup(true);
      }
    } finally {
      setCreatingWallet(false);
    }
  };

  const handleWithdrawUSDC = async () => {
    if (!smartAccount) {
      setErrorPopupMessage("No Smart Account available.");
      setShowErrorPopup(true);
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
        setSuccessPopupMessage("USDC withdrawal initiated!");
        setShowSuccessPopup(true);

        setTimeout(async () => {
          await fetchUserData();
        }, 2000);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send user operation";
      setErrorMessage(message);
      setErrorPopupMessage(message + (message.endsWith(".") ? "" : "."));
      setShowErrorPopup(true);
    }
  };

  const handleLogout = () => {
    setShowLogoutPopup(true);
  };

  const performLogout = async () => {
    try {
      // clear auth tokens
      await onLogout?.();
      console.log("✅ Logout completed, tokens cleared");
      router.replace("/");
    } catch (error) {
      console.error("❌ Logout failed:", error);
      setErrorPopupMessage("Failed to logout. Please try again.");
      setShowErrorPopup(true);
    }
  };

  const AnimatedSection = ({
    children,
    delay = 0,
  }: {
    children: React.ReactNode;
    delay?: number;
  }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }).start();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }).start();
    }, [fadeAnim, slideAnim]);

    return (
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {children}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <ScrollView>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.avatar}>
                <Ionicons name="person-circle" size={52} color="#8AB6FF" />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.helloText}>Hello, {displayName}</Text>
                <View style={styles.iqBadge}>
                  <Text style={styles.iqBadgeText}>{displayIq} IQ</Text>
                </View>
              </View>
            </View>

            <LinearGradient
              colors={["#FFB917", "#FFEBA3", "#EFD69D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.statsBar}
            >
              <View style={styles.statItem}>
                <Image
                  source={require("../../assets/app-images/points_crystal.png")}
                  style={styles.statIcon}
                  resizeMode="contain"
                />
                <View style={styles.statTextContainer}>
                  <Text style={styles.statLabel}>Points</Text>
                  <Text style={styles.statValue}>{points}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Image
                  source={require("../../assets/app-images/app_rewards_cash.png")}
                  style={styles.statIcon}
                  resizeMode="contain"
                />
                <View style={styles.statTextContainer}>
                  <Text style={styles.statLabel}>App Rewards</Text>
                  <Text style={styles.statValue}>
                    ${appRewardsUsd.toFixed(2)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
          {walletAddress ? (
            // Wallet already created - show balance transfer UI
            <View style={styles.walletBalanceCard}>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceTitle}>App Rewards</Text>
                  <View style={styles.balanceValueRow}>
                    <Image
                      source={require("../../assets/app-images/app_rewards_cash.png")}
                      style={styles.balanceIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.balanceValue}>
                      ${appRewardsUsd.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <Image
                  source={require("../../assets/app-images/convert_arrows.png")}
                  style={styles.arrowIcon}
                  resizeMode="contain"
                />
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceTitle}>Wallet Balance</Text>
                  <View style={styles.balanceValueRow}>
                    <Image
                      source={require("../../assets/app-images/profile_wallet.png")}
                      style={styles.balanceIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.balanceValue}>
                      ${walletBalanceUsd.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.convertButton,
                  (!canWithdraw || withdrawing) && { opacity: 0.6 },
                ]}
                activeOpacity={0.85}
                disabled={!canWithdraw || withdrawing}
                onPress={handleWithdrawUSDC}
              >
                {canWithdraw ? (
                  <>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#1F2937"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.convertButtonText}>
                      {withdrawing ? "Transferring..." : "Transfer to Wallet"}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="lock-closed"
                      size={20}
                      color="#1F2937"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.convertButtonText}>
                      Convert to Wallet
                    </Text>
                    <Text style={styles.convertSubtext}>
                      Reach min $1 to Transfer
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.safetyText}>
                Your wallet balance is safe!!
              </Text>
            </View>
          ) : (
            // Wallet not created yet - show create wallet UI
            <View style={styles.walletCard}>
              {hasUnlockedWallet ? (
                <>
                  <Text style={styles.walletTitle}>Create Your Wallet</Text>
                  <TouchableOpacity
                    style={[
                      styles.createWalletButton,
                      creatingWallet && styles.buttonDisabled,
                    ]}
                    onPress={handleCreateWallet}
                    disabled={creatingWallet}
                    activeOpacity={0.85}
                  >
                    {creatingWallet ? (
                      <ActivityIndicator color="#1F2937" />
                    ) : (
                      <Text style={styles.createWalletText}>
                        Create Smart Wallet
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.walletTitle}>Unlock Your Wallet</Text>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progress * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {points}/{walletUnlockTarget}
                    </Text>
                    <View style={styles.walletIcon}>
                      <Image
                        source={require("../../assets/app-images/profile_wallet.png")}
                        style={styles.walletImage}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                </>
              )}
            </View>
          )}

          <View style={styles.featuresRow}>
            <LinearGradient
              colors={["#994071", "#E85EAA", "#F08DC3", "#E85EAA", "#994071"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.streaksCard}
            >
              <Text style={styles.streaksTitle}>Streaks</Text>
              <View style={styles.streaksStats}>
                <View style={styles.glassmorphism}>
                  <Text style={styles.streakLabel}>Current</Text>
                  <Text style={styles.streakValue}>
                    {loadingStreak ? "-" : currentStreak}
                  </Text>
                </View>
                <View style={styles.glassmorphism}>
                  <Text style={styles.streakLabel}>Highest</Text>
                  <Text style={styles.streakValue}>
                    {loadingStreak ? "-" : longestStreak}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <TouchableOpacity style={styles.bigWinCard} activeOpacity={0.85}>
              <Image
                source={require("../../assets/app-images/big_win.png")}
                style={styles.bigWinText}
                resizeMode="contain"
              />
              <Text style={styles.startEarningText}>START EARNING</Text>
              <Image
                source={require("../../assets/app-images/big_win_chest.png")}
                style={styles.chestImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.iqLevelCard}>
            <Text style={styles.iqLevelTitle}>IQ Level</Text>
            <AnimatedSection delay={300}>
              <View style={styles.iqSectionContainer}>
                <IQMeter iqValue={iq || 0} />
              </View>
            </AnimatedSection>
          </View>

          <TouchableOpacity
            style={styles.labelHistoryCard}
            activeOpacity={0.85}
            onPress={() => router.push("/reward-history")}
          >
            <View style={styles.labelHistoryLeft}>
              <View style={styles.labelHistoryCircle}>
                <View style={styles.circularProgress}>
                  <Text style={styles.labelHistoryCount}>{labelHistoryCount}</Text>
                </View>
              </View>
              <View style={styles.labelHistoryTextContainer}>
                <Text style={styles.labelHistoryTitle}>Labelling History</Text>
                <Text style={styles.labelHistorySubtitle}>
                  View you previous labellings
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#71717A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Logout Popup */}
      <InfoPopup
        visible={showLogoutPopup}
        title="LOGOUT"
        message="Are you sure you want to logout?"
        buttons={[
          {
            text: "CANCEL",
            onPress: () => setShowLogoutPopup(false),
            variant: "primary",
          },
          {
            text: "LOGOUT",
            onPress: () => {
              setShowLogoutPopup(false);
              performLogout();
            },
            variant: "secondary",
          },
        ]}
        onClose={() => setShowLogoutPopup(false)}
      />

      {/* Error Popup */}
      <ErrorPopup
        visible={showErrorPopup}
        message={errorPopupMessage}
        onClose={() => setShowErrorPopup(false)}
      />

      {/* Success Popup */}
      <SuccessPopup
        visible={showSuccessPopup}
        message={successPopupMessage}
        onContinue={() => setShowSuccessPopup(false)}
      />

      {/* Info Popup */}
      <InfoPopup
        visible={showInfoPopup}
        title={infoPopupData.title}
        message={infoPopupData.message}
        buttons={[
          {
            text: "OK",
            onPress: () => setShowInfoPopup(false),
            variant: "primary",
          },
        ]}
        onClose={() => setShowInfoPopup(false)}
      />

      {/* Authentication Issue Popup */}
      <InfoPopup
        visible={showAuthIssuePopup}
        title="AUTHENTICATION ISSUE"
        message="CDP authentication expired. Please logout and login again to refresh your session."
        buttons={[
          {
            text: "CANCEL",
            onPress: () => setShowAuthIssuePopup(false),
            variant: "primary",
          },
          {
            text: "LOGOUT NOW",
            onPress: () => {
              setShowAuthIssuePopup(false);
              handleLogout();
            },
            variant: "secondary",
          },
        ]}
        onClose={() => setShowAuthIssuePopup(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0b0f",
  },
  content: {
    paddingHorizontal: 13,
    paddingVertical: 13,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#1a1b20",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2a2b31",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  helloText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  iqBadge: {
    backgroundColor: "#FF6EC7",
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  iqBadgeText: {
    color: "#1F2937",
    fontSize: 12,
    fontWeight: "800",
  },
  statsBar: {
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 310,
    marginLeft: -7,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statIcon: {
    width: 60,
    height: 60,
    left: -5,
  },
  statTextContainer: {
    flexDirection: "column",
    gap: 2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: "#1F2937",
    opacity: 0.3,
    marginHorizontal: 10,
    left: -10,
  },
  statLabel: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "600",
    left: -10,
  },
  statValue: {
    color: "#1F2937",
    fontSize: 20,
    fontWeight: "800",
    left: -10,
  },
  walletCard: {
    backgroundColor: "#2a2b31",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    overflow: "visible",
    zIndex: 1,
    minHeight: 120,
    justifyContent: "center",
  },
  walletTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 2,
  },
  createWalletButton: {
    backgroundColor: "#FFB917",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  createWalletText: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  walletBalanceCard: {
    backgroundColor: "#10B981",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  balanceItem: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  balanceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  balanceValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginLeft: -5,
  },
  balanceIcon: {
    width: 32,
    height: 32,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
  },
  arrowIcon: {
    width: 40,
    height: 40,
    marginHorizontal: 8,
  },
  convertButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    position: "relative",
  },
  convertButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginRight: 4,
  },
  convertSubtext: {
    fontSize: 11,
    color: "#1F2937",
    position: "absolute",
    bottom: -16,
  },
  safetyText: {
    fontSize: 14,
    color: "#1F2937",
    textAlign: "center",
    fontWeight: "600",
    marginTop: 8,
  },
  progressBarContainer: {
    height: 50,
    position: "relative",
    justifyContent: "center",
    marginTop: 4,
  },
  progressTrack: {
    height: "100%",
    width: "100%",
    backgroundColor: "#4a4b51",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#FFFFFF3B",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFB917",
  },
  progressText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    color: "#FFA400",
    fontSize: 22,
    fontWeight: "800",
    zIndex: 2,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 2,
  },
  walletIcon: {
    position: "absolute",
    right: -10,
    top: -10,
    zIndex: 3,
  },
  walletImage: {
    width: 70,
    height: 70,
  },
  walletButton: {
    marginTop: 12,
    backgroundColor: "#AA4CF0",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  walletButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  featuresRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  iqLevelCard: {
    backgroundColor: "#27282E",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  iqLevelTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },

  iqSectionContainer: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: -30,
  },
  iqContainer: {
    width: "100%",
    borderRadius: 12,
    // padding: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    overflow: "hidden",
  },

  iqMeterContainer: {
    alignItems: "center",
    position: "relative",
  },
  iqArcContainer: {
    width: 200,
    height: 120,
    position: "relative",
    marginBottom: 20,
  },
  iqArc: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 12,
    borderColor: "transparent",
    borderTopColor: "#A855F7",
    borderRightColor: "#3B82F6",
    borderBottomColor: "transparent",
    borderLeftColor: "#10B981",
    transform: [{ rotate: "-135deg" }],
    top: 10,
    left: 10,
  },
  iqArcBackground: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 12,
    borderColor: "#3A3B41",
    borderTopColor: "transparent",
    borderLeftColor: "transparent",
    transform: [{ rotate: "45deg" }],
    top: 10,
    left: 10,
  },
  iqValueContainer: {
    alignItems: "center",
    marginTop: -80,
  },
  iqLevelLabel: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  iqLevelValue: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "800",
  },
  labelHistoryCard: {
    backgroundColor: "#27282E",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  labelHistoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  labelHistoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  circularProgress: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: "#0EA5E9",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-45deg" }],
  },
  labelHistoryCount: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    transform: [{ rotate: "45deg" }],
  },
  labelHistoryTextContainer: {
    flex: 1,
  },
  labelHistoryTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  labelHistorySubtitle: {
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "500",
  },
  streaksCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
    height: 105,
    overflow: "hidden",
  },
  glassmorphism: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    padding: 6,
    justifyContent: "space-between",
    marginTop: -10,
    marginLeft: -10,
    marginRight: 6,
  },
  streaksTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 15,
    marginTop: -7,
  },
  streaksStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginLeft: 4,
  },
  streakItem: {
    flex: 1,
  },
  streakLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    opacity: 0.9,
    marginTop: -5,
  },
  streakValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  bigWinCard: {
    flex: 1,
    backgroundColor: "#5B21B6",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    height: 105,
    position: "relative",
  },
  bigWinText: {
    width: 120,
    height: 55,
    marginBottom: 8,
    right: 40,
  },
  startEarningText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 3,
    bottom: -4,
  },
  chestImage: {
    width: 110,
    height: 110,
    position: "absolute",
    right: -15,
    top: -35,
  },
  logoutButton: {
    marginTop: 4,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
  },
});
