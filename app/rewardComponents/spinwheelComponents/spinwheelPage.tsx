import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, ClipPath, Defs, G, Path, Pattern, Image as SvgImage, Text as SvgText } from 'react-native-svg';
import { SpinWheelHeaderSection } from './spinwheelHeader';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { couponsAPI, authAPI } from '../../../services/api';
import SpinCouponModal from './spinCoupon';
import { router } from 'expo-router';
import { useUserStore } from '../../../stores/userStore';
import { ErrorPopup } from '../../../components/popups/ErrorPopup';

interface Coupon {
  _id: string;
  company: string;
  description: string;
  expiryDate: string;
  imageLink: string;
  couponCode: string;
}


export default function SpinWheelPage() {
  const { updateCoins } = useUserStore();
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorPopupMessage, setErrorPopupMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const spinRotation = useSharedValue(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState('');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wonCoupon, setWonCoupon] = useState<Coupon | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [canSpin, setCanSpin] = useState(true);
  const [spinTimeLeft, setSpinTimeLeft] = useState(0);
  const [userCoins, setUserCoins] = useState<number>(0);
  const [isPaidSpin, setIsPaidSpin] = useState(false);

  useEffect(() => {
    fetchCoupons();
    fetchSpinStatus();
    fetchUserCoins();
  }, []);

  // timer countdown 
  useEffect(() => {
    if (spinTimeLeft > 0) {
      const timer = setInterval(() => {
        setSpinTimeLeft(prev => {
          if (prev <= 1) {
            setCanSpin(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [spinTimeLeft]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await couponsAPI.getSpinWheelCoupons();
      if (response.success && response.data && response.data.length > 0) {
        // duplicate coupons to fill if fewer
        const fetchedCoupons = response.data;
        let wheelCoupons: Coupon[] = [];
        
        if (fetchedCoupons.length >= 8) {
          wheelCoupons = fetchedCoupons.slice(0, 8);
        } else {
          while (wheelCoupons.length < 8) {
            wheelCoupons = [...wheelCoupons, ...fetchedCoupons];
          }
          wheelCoupons = wheelCoupons.slice(0, 8);
        }
        
        setCoupons(wheelCoupons);
      } else {
        setError('No coupons available');
      }
    } catch (err: any) {
      console.error('Error fetching coupons:', err);
      setError('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpinStatus = async () => {
    try {
      const response = await couponsAPI.getSpinWheelStatus();
      
      if (response.success) {
        setCanSpin(response.canSpin);
        setSpinTimeLeft(response.secondsLeft || 0);
      } else {
        setCanSpin(true);
        setSpinTimeLeft(0);
      }
    } catch (error) {
      console.error('Failed to fetch spin status:', error);
      setCanSpin(true);
      setSpinTimeLeft(0);
    }
  };

  const formatSpinTimer = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchUserCoins = async () => {
    try {
      const response = await authAPI.getUser();
      if (response) {
        const userData = response.user || response;
        const coins = userData.coins || 0;
        setUserCoins(coins);
        updateCoins(coins); 
      }
    } catch (error) {
      console.error('Failed to fetch user coins:', error);
    }
  };

  const handlePurchaseSpin = async () => {
    if (userCoins < 25) {
      setErrorPopupMessage('Insufficient coins. You need 25 coins to spin.');
      setShowErrorPopup(true);
      return;
    }

    try {
      const response = await couponsAPI.purchaseSpinWithCoins();
      if (response.success) {
        const newCoins = response.coins;
        setUserCoins(newCoins);
        updateCoins(newCoins); 
        setCanSpin(true);
        setIsPaidSpin(true);
        showSnackbarMessage('Spin purchased! You can spin now.');
      }
    } catch (error: any) {
      if (error?.response?.data?.message) {
        showSnackbarMessage(error.response.data.message);
      } else {
        showSnackbarMessage('Failed to purchase spin. Please try again.');
      }
    }
  };

  const showSnackbarMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
    setTimeout(() => {
      setShowSnackbar(false);
    }, 2000);
  };

  const finishSpin = async (winningIndex: number) => {
    setIsSpinning(false);
    if (coupons.length > 0 && winningIndex < coupons.length) {
      const won = coupons[winningIndex];
      setWonCoupon(won);
      setResult(`You won ${won.company} - ${won.description}!`);
      
      // add coupon to user's account
      try {
        if (isPaidSpin) {
          await couponsAPI.selectPaidSpinCoupon(won._id);
          setIsPaidSpin(false); 
        } else {
          await couponsAPI.selectSpinWheelCoupon(won._id);
        }
        setShowWinModal(true);
        await fetchSpinStatus();
        await fetchUserCoins(); 
      } catch (error: any) {
        console.error('Error adding coupon:', error);
        if (error?.response?.status === 409) {
          showSnackbarMessage('You have already spun today. Come back tomorrow!');
          await fetchSpinStatus();
        } else {
          showSnackbarMessage('Failed to claim coupon. Please try again.');
        }
      }
    }
  };

  const handleSpin = () => {
      if (isSpinning || coupons.length === 0 || !canSpin) return;
    
      setIsSpinning(true);
      setWonCoupon(null);
      setCanSpin(false); 
      const winningIndex = Math.floor(Math.random() * segmentsCount);
      const turns = 5 + Math.floor(Math.random() * 2);
      const randomOffset = (Math.random() - 0.5) * (anglePerSegment * 0.8);
      const targetRotation = 360 * turns + (360 - winningIndex * anglePerSegment - anglePerSegment / 2 + randomOffset);
    
      const duration = 7000 + Math.floor(Math.random() * 1000);
      spinRotation.value = withTiming(
        targetRotation,
        {
          duration,
          easing: Easing.bezier(0.15, 0.8, 0.3, 1),
        },
        (isFinished) => {
          if (isFinished) {
            runOnJS(finishSpin)(winningIndex);
          }
        }
      );
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${spinRotation.value}deg` }],
    }));

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    showSnackbarMessage('Coupon code copied');
  };
  const extractCouponCode = (c: Coupon | null) => {
    if (!c) return '';
    if (c.couponCode && c.couponCode.trim().length > 0) return c.couponCode;
    return c.company.replace(/\s+/g, '').toUpperCase();
  };

  const wheelSize = 380;
  const center = wheelSize / 2;
  const radius = center - 20; 
  const segmentsCount = 8;
  const anglePerSegment = 360 / segmentsCount;
  const segmentGapDeg = 10; 
  const logoRadius = 30; 

  // show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <SpinWheelHeaderSection />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
          <ActivityIndicator size="large" color="#A78BFA" />
          <Text style={[styles.noteText, { marginTop: 16 }]}>Loading coupons...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error || coupons.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <SpinWheelHeaderSection />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
          <Text style={styles.pageTitle}>No Coupons Available</Text>
          <Text style={styles.noteText}>{error || 'Please check back later'}</Text>
          <TouchableOpacity onPress={fetchCoupons} style={styles.spinAgainButton}>
            <Text style={styles.spinAgainText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SpinWheelHeaderSection />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Free Spin Everyday</Text>
        <View style={{ width: wheelSize, height: wheelSize }}>
        <Animated.View style={animatedStyle}>
          <Svg width={wheelSize} height={wheelSize} viewBox={`0 0 ${wheelSize} ${wheelSize}`}>
            <Defs>
              {coupons.map((coupon, index) => {
                const midAngle = (index * anglePerSegment + anglePerSegment / 2 - 90) * (Math.PI / 180);
                const logoDistance = radius * 0.65;
                const logoX = center + logoDistance * Math.cos(midAngle);
                const logoY = center + logoDistance * Math.sin(midAngle);
                
                return (
                  <ClipPath key={`clip-${index}`} id={`circleClip${index}`}>
                    <Circle cx={logoX} cy={logoY} r={logoRadius} />
                  </ClipPath>
                );
              })}
            </Defs>
            <G>
              {coupons.map((coupon, index) => {
                // Calculate angles with gap
                const startAngle = (index * anglePerSegment - 90) + (segmentGapDeg / 2);
                const endAngle = ((index + 1) * anglePerSegment - 90) - (segmentGapDeg / 2);
                
                // Convert to radians
                const startRad = startAngle * (Math.PI / 180);
                const endRad = endAngle * (Math.PI / 180);
                
                // Calculate points
                const x1 = center + radius * Math.cos(startRad);
                const y1 = center + radius * Math.sin(startRad);
                const x2 = center + radius * Math.cos(endRad);
                const y2 = center + radius * Math.sin(endRad);
                
                // Pie slice path
                const path = `M${center},${center} L${x1},${y1} A${radius},${radius} 0 0 1 ${x2},${y2} Z`;
                
                const midAngle = (index * anglePerSegment + anglePerSegment / 2 - 90) * (Math.PI / 180);
                const logoDistance = radius * 0.65;
                const logoX = center + logoDistance * Math.cos(midAngle);
                const logoY = center + logoDistance * Math.sin(midAngle);
                const angleDeg = midAngle * (180 / Math.PI) + 90;
                
                return (
                  <G key={`seg-${coupon._id}-${index}`}>
                    {/* Background Border Layer */}
                    <Path 
                      d={path} 
                      stroke="rgba(255,255,255,0.1)" 
                      strokeWidth="16" 
                      strokeLinejoin="round" 
                      fill="none" 
                    />
                    {/* Main Sector Body */}
                    <Path 
                      d={path} 
                      fill="#2A2A2A" 
                      stroke="#2A2A2A" 
                      strokeWidth="10" 
                      strokeLinejoin="round" 
                    />
                    
                    {/* Circular Image */}
                    <G transform={`rotate(${-angleDeg}, ${logoX}, ${logoY})`}>
                      <SvgImage
                        href={{ uri: coupon.imageLink }}
                        x={logoX - logoRadius}
                        y={logoY - logoRadius}
                        width={logoRadius * 2}
                        height={logoRadius * 2}
                        preserveAspectRatio="xMidYMid meet"
                        clipPath={`url(#circleClip${index})`}
                      />
                      <Circle
                        cx={logoX}
                        cy={logoY}
                        r={logoRadius}
                        fill="none"
                        stroke="#FBBF24"
                        strokeWidth="2"
                      />
                    </G>
                    
                    <SvgText
                      x={logoX}
                      y={logoY - (logoRadius + 12)}
                      fontSize="14"
                      fontWeight="800"
                      fill="#FFFFFF"
                      textAnchor="middle"
                      transform={`rotate(${angleDeg}, ${logoX}, ${logoY})`}
                    >
                      {coupon.company}
                    </SvgText>
                  </G>
                );
              })}
            </G>
          </Svg>
          </Animated.View>
          <View style={styles.topPointerWrapper}>
             <Svg width="32" height="32" viewBox="0 0 32 32">
                <Path
                  d="M6 6 L26 6 L16 26 Z"
                  fill="none"
                  stroke="#A78BFA"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
             </Svg>
          </View>
          <View style={styles.centerButtonWrapper}>
            <LinearGradient
              colors={canSpin ? ['#FFB917', '#FFEBA3', '#EFD69D'] : ['#4A4A4A', '#6A6A6A', '#5A5A5A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.centerButton, !canSpin && styles.centerButtonDisabled]}
            >
            <TouchableOpacity onPress={handleSpin} disabled={!canSpin}>
                {canSpin ? (
                  <>
                    <Text style={styles.centerButtonTextS}>START</Text>
                    <Text style={styles.centerButtonTextN}>NOW</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.centerButtonTextDisabled}>NEXT SPIN</Text>
                    <Text style={styles.centerButtonTimerText}>{formatSpinTimer(spinTimeLeft)}</Text>
                  </>
                )}
            </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
        <Text style={styles.noteText}>
          {canSpin 
            ? 'You have one free spin' 
            : 'There are no free spins left for today'}
        </Text>
        <TouchableOpacity 
          activeOpacity={0.85} 
          style={styles.spinAgainButton}
          onPress={handlePurchaseSpin}
        >
          <Text style={styles.spinAgainText}>Spin again for 25 coins</Text>
          <Image
            source={require('../../../assets/app-images/spin_coin.png')}
            style={{ width: 25, height: 25, left:-5 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.coinBalanceText}>Your balance: {userCoins} coins</Text>
      </ScrollView>

      {showSnackbar && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </View>
      )}
      <SpinCouponModal
        visible={showWinModal && !!wonCoupon}
        companyName={wonCoupon?.company || ''}
        logoUri={wonCoupon?.imageLink || ''}
        description={wonCoupon?.description || ''}
        couponCode={extractCouponCode(wonCoupon)}
        onCopyCode={(code) => handleCopyCode(code)}
        onRedeem={() => {
          setShowWinModal(false);
          router.push('/rewardComponents/couponComponents/couponPage');
        }}
        onClose={() => setShowWinModal(false)}
      />
      <ErrorPopup
        visible={showErrorPopup}
        message={errorPopupMessage}
        onClose={() => setShowErrorPopup(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b0f',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 30,
  },
  centerButtonWrapper: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -58 }, { translateY: -60 }],
    width: 120,
    height: 120,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  centerButton: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFB917',
  },
  centerButtonDisabled: {
    borderColor: '#666',
    opacity: 0.7,
  },
  centerButtonTextS: {
    color: '#1F2937',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerButtonTextN: {
    color: '#1F2937',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.5,
    left: 8
  },
  centerButtonTextDisabled: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  centerButtonTimerText: {
    color: '#A1A1AA',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  topPointerWrapper: {
    position: 'absolute',
    left: '50%',
    top: -12,
    transform: [{ translateX: -16 }],
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  textContainer: {
    marginBottom: 10,
  },
  upToText: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  discountText: {
    color: '#1F2937',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  couponText: {
    color: '#1F2937',
    fontSize: 10,
    fontWeight: '500',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FFB917',
    gap: 6,
    alignSelf: 'flex-start', 
    marginTop: 5,
  },
  copyButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bannerImage: {
    width: 118,
    height: 118,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  noteText: {
    color: '#A1A1AA',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  spinAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#673AB7',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  spinAgainButtonDisabled: {
    backgroundColor: '#4A4A4A',
    opacity: 0.6,
  },
  spinAgainText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  coinBalanceText: {
    color: '#A1A1AA',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  snackbar: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  },
  snackbarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
