import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  FeDropShadow,
  Filter,
  G,
  Path,
  RadialGradient,
  Stop,
  Image as SvgImage,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// --- Types ---
interface Segment {
  color: string;
  text: string;
  reward: string;
  type?: 'tokens' | 'coupon';
  value?: number; // For tokens
  couponData?: any; // For coupon information
  coupon?: any;
  brandLogo?: string;
}

interface SpinWheelProps {
  segments: Segment[];
  onSpinComplete: (segment: Segment) => void;
  isSpinning: boolean;
  isUnlocked: boolean;
  spinValue: Animated.Value;
  onSpinPress?: () => void;
  wheelSize?: number;
  cooldownTime?: number;
}

// --- Constants ---
const DEFAULT_WHEEL_SIZE = 280;
const STROKE_WIDTH = 4;
const COOLDOWN_TIME = 24 * 60 * 60; 
const SPIN_DURATION = 5000;
const FULL_SPINS = 5;

// --- Utility Functions ---
const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const calculateWheelDimensions = (wheelSize: number) => {
  const outerRadius = wheelSize / 2;
  const innerRadius = outerRadius - STROKE_WIDTH;
  const logoRadius = 28.566;
  return { outerRadius, innerRadius, logoRadius };
};

// --- Sub-components ---
const GradientText: React.FC<{ children: React.ReactNode; style: any }> = ({ children, style }) => (
  <Text style={[style, { color: '#f97316' }]}>{children}</Text>
);

const WheelPointer: React.FC<{ wheelSize: number }> = React.memo(({ wheelSize }) => (
  <View style={[styles.pointerContainer, { left: wheelSize / 2 - 10 }]}>
    {/* base dot for pointer */}
    <View style={styles.pointerBase} />
    <View style={styles.pointer} />
  </View>
));

const SpinButton: React.FC<{
  onPress: () => void;
  disabled: boolean;
  isSpinning: boolean;
  pulseScale?: Animated.Value;
}> = React.memo(({ onPress, disabled, isSpinning, pulseScale }) => (
  <Animated.View style={[styles.spinButtonWrapper, pulseScale ? { transform: [{ scale: pulseScale }] } : null]}>
    {/* glossy ring behind the button */}
    <View style={styles.centerDecor}>
      <View style={styles.centerRingLarge} />
      <View style={styles.centerRingSmall} />
    </View>
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.spinButton, disabled && styles.disabledButton]}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#f97316', '#fb923c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.spinButtonGradient}
      >
        <Text style={styles.spinButtonText}>{isSpinning ? '...' : 'SPIN'}</Text>
      </LinearGradient>
    </TouchableOpacity>
  </Animated.View>
));

const StatusDisplay: React.FC<{
  isUnlocked: boolean;
  timeLeft: number;
}> = React.memo(({ isUnlocked, timeLeft }) => (
  <View style={styles.statusDisplay}>
    {!isUnlocked ? (
      <>
        <Text style={styles.statusLabel}>Next spin in:</Text>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
      </>
    ) : (
      <>
        <Text style={styles.readyText}>Ready to Spin!</Text>
        <Text style={styles.statusLabel}>Tap the wheel to win rewards</Text>
      </>
    )}
  </View>
));

const WheelSVG: React.FC<{
  segments: Segment[];
  wheelSize: number;
  outerRadius: number;
  innerRadius: number;
  logoRadius: number;
}> = React.memo(({ segments, wheelSize, outerRadius, innerRadius, logoRadius }) => {
  const anglePerSegment = 360 / segments.length;
  
  const renderSegment = useCallback((segment: Segment, index: number) => {
    const startAngleRad = (index * anglePerSegment - 90) * (Math.PI / 180);
    const endAngleRad = ((index + 1) * anglePerSegment - 90) * (Math.PI / 180);
    
    const x1 = outerRadius + innerRadius * Math.cos(startAngleRad);
    const y1 = outerRadius + innerRadius * Math.sin(startAngleRad);
    const x2 = outerRadius + innerRadius * Math.cos(endAngleRad);
    const y2 = outerRadius + innerRadius * Math.sin(endAngleRad);
    
    const segmentPath = `M${outerRadius},${outerRadius} L${x1},${y1} A${innerRadius},${innerRadius} 0 0 1 ${x2},${y2} Z`;
    
    const itemAngleRad = (index * anglePerSegment + anglePerSegment / 2 - 90) * (Math.PI / 180);
    const logoRadiusFromCenter = (45 + innerRadius) / 2;
    const logoX = outerRadius + logoRadiusFromCenter * Math.cos(itemAngleRad);
    const logoY = outerRadius + logoRadiusFromCenter * Math.sin(itemAngleRad);

    // Determine logo URL based on segment type
    let logoUrl = segment.brandLogo || segment.coupon?.imageLink;
    
    if (segment.type === 'coupon' && segment.couponData?.imageLink) {
      logoUrl = segment.couponData.imageLink;
    } else if (segment.type === 'tokens') {
      logoUrl = 'https://placehold.co/40x40/FFD700/333333?text=💰';
    }
    
    if (!logoUrl) {
      logoUrl = 'https://placehold.co/40x40/8B5CF6/FFFFFF?text=?';
    }

    return (
      <G key={`segment-${index}`}>
        <Path 
          d={segmentPath} 
          fill={segment.color || "rgba(255,255,255,0.05)"} 
          stroke="rgba(249, 115, 22, 0.3)"
          strokeWidth="0.5"
        />
        <G x={logoX} y={logoY} filter="url(#laserGlow)">
          <SvgImage
            href={{ uri: logoUrl }}
            x={-logoRadius}
            y={-logoRadius}
            width={logoRadius * 2}
            height={logoRadius * 2}
            clipPath="url(#logoClipPath)"
          />
        </G>
      </G>
    );
  }, [anglePerSegment, outerRadius, innerRadius, logoRadius]);

  const renderSeparatorLines = useCallback(() => {
    return segments.map((_, index) => {
      const lineAngleRad = (index * anglePerSegment - 90) * (Math.PI / 180);
      const x2 = outerRadius + innerRadius * Math.cos(lineAngleRad);
      const y2 = outerRadius + innerRadius * Math.sin(lineAngleRad);
      
      return (
        <Path 
          key={`line-${index}`} 
          d={`M${outerRadius},${outerRadius} L${x2},${y2}`} 
          stroke="#f97316" 
          strokeWidth="1.5" 
          filter="url(#laserGlow)" 
        />
      );
    });
  }, [segments, anglePerSegment, outerRadius, innerRadius]);

  const renderTickDots = useCallback(() => {
    const r = innerRadius; // along the ring edge
    return segments.map((_, index) => {
      const a = (index * anglePerSegment - 90) * (Math.PI / 180);
      const cx = outerRadius + r * Math.cos(a);
      const cy = outerRadius + r * Math.sin(a);
      return <Circle key={`dot-${index}`} cx={cx} cy={cy} r="2" fill="#f97316" opacity={0.65} />;
    });
  }, [segments, anglePerSegment, outerRadius, innerRadius]);

  return (
    <Svg width={wheelSize} height={wheelSize} viewBox={`0 0 ${wheelSize} ${wheelSize}`}>
      <Defs>
        <RadialGradient id="orangeGlow">
          <Stop offset="0%" stopColor="#f97316" stopOpacity="0.6" />
          <Stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </RadialGradient>
        <Filter id="laserGlow">
          <FeDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#ef4444" />
        </Filter>
        <ClipPath id="logoClipPath">
          <Circle cx="0" cy="0" r={logoRadius} />
        </ClipPath>
      </Defs>

      <G>
        {/* Background glow */}
        <Circle cx={outerRadius} cy={outerRadius} r={innerRadius} fill="url(#orangeGlow)" />
        
        {/* Segments */}
        {segments.map(renderSegment)}
        
        {/* Separator lines */}
        {renderSeparatorLines()}
        
        {/* Tick dots for detail */}
        {renderTickDots()}
        
        {/* Outer rings */}
        <Circle 
          cx={outerRadius} 
          cy={outerRadius} 
          r={innerRadius} 
          fill="transparent" 
          stroke="rgba(249, 115, 22, 0.5)" 
          strokeWidth="1" 
        />
        <Circle 
          cx={outerRadius} 
          cy={outerRadius} 
          r="45" 
          fill="rgba(249, 115, 22, 0.1)" 
          stroke="rgba(249, 115, 22, 0.5)" 
          strokeWidth="1" 
        />
      </G>
    </Svg>
  );
});

// --- Main Component ---
const SpinWheel: React.FC<SpinWheelProps> = ({ 
  segments, 
  onSpinComplete, 
  isSpinning, 
  isUnlocked, 
  spinValue,
  onSpinPress,
  wheelSize = DEFAULT_WHEEL_SIZE,
  cooldownTime = COOLDOWN_TIME
}) => {
  // State
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState('');
  
  // Refs
  const currentRotationRef = useRef(0);
  const glowOpacity = useRef(new Animated.Value(0.7)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseScale = useRef(new Animated.Value(1)).current;

  // Memoized calculations
  const { outerRadius, innerRadius, logoRadius } = useMemo(
    () => calculateWheelDimensions(wheelSize), 
    [wheelSize]
  );

  const spinRotation = useMemo(() => 
    spinValue.interpolate({
      inputRange: [0, 360],
      outputRange: ['0deg', '360deg'],
    }),
    [spinValue]
  );

  // Callbacks
  const startSpinning = useCallback(() => {
    if (isSpinning || !isUnlocked) return;
    
    onSpinPress?.();

    const anglePerSegment = 360 / segments.length;
    const winningSegmentIndex = Math.floor(Math.random() * segments.length);
    const randomOffset = (Math.random() - 0.5) * anglePerSegment * 0.8;
    const targetRotation = (360 - (winningSegmentIndex * anglePerSegment)) - anglePerSegment / 2 + randomOffset;
    
    const newRotation = currentRotationRef.current + (360 * FULL_SPINS) + targetRotation - (currentRotationRef.current % 360);
    currentRotationRef.current = newRotation;

    spinValue.setValue(currentRotationRef.current - (360 * FULL_SPINS));

    Animated.timing(spinValue, {
      toValue: newRotation,
      duration: SPIN_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start(() => {
      const winningSegment = segments[winningSegmentIndex];
      
      // Enhanced result message based on reward type
      let resultMessage = `You won: ${winningSegment.reward}!`;
      if (winningSegment.type === 'coupon' && winningSegment.couponData) {
        resultMessage = `You won a ${winningSegment.couponData.company} coupon!`;
      } else if (winningSegment.type === 'tokens') {
        resultMessage = `You won ${winningSegment.value} tokens!`;
      }
      
      setResult(resultMessage);
      setTimeLeft(cooldownTime);
      onSpinComplete(winningSegment);
    });
  }, [isSpinning, isUnlocked, onSpinPress, segments, spinValue, cooldownTime, onSpinComplete]);

  // Effects
  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { 
          toValue: 1, 
          duration: 2000, 
          useNativeDriver: true 
        }),
        Animated.timing(glowOpacity, { 
          toValue: 0.7, 
          duration: 2000, 
          useNativeDriver: true 
        }),
      ])
    );
    
    glowAnimation.start();
    
    return () => {
      glowAnimation.stop();
    };
  }, [glowOpacity]);

  useEffect(() => {
    if (!isUnlocked && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isUnlocked, timeLeft]);

  // Pulse the center button when ready
  useEffect(() => {
    if (isUnlocked && !isSpinning) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1.0, duration: 900, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseScale.setValue(1);
    }
  }, [isUnlocked, isSpinning, pulseScale]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <View style={styles.modalContentWrapper}>
      <BlurView intensity={80} tint="dark" style={styles.modalContent}>
        <GradientText style={styles.title}>Spin to Win!</GradientText>
        <Text style={styles.subtitle}>Get your daily reward</Text>

        <View style={[styles.wheelWrapper, { width: wheelSize, height: wheelSize }]}>
          <WheelPointer wheelSize={wheelSize} />
          
          <Animated.View 
            style={[
              styles.wheelContainer, 
              { 
                width: wheelSize, 
                height: wheelSize,
                transform: [{ rotate: spinRotation }], 
                opacity: glowOpacity 
              }
            ]}
          >
            <WheelSVG
              segments={segments}
              wheelSize={wheelSize}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              logoRadius={logoRadius}
            />
          </Animated.View>
          
          <SpinButton
            onPress={startSpinning}
            disabled={isSpinning || !isUnlocked}
            isSpinning={isSpinning}
            pulseScale={pulseScale}
          />
        </View>
        
        <View style={styles.resultContainer}>
          {result ? (
            <GradientText style={styles.resultText}>{result}</GradientText>
          ) : null}
        </View>

        <StatusDisplay isUnlocked={isUnlocked} timeLeft={timeLeft} />
      </BlurView>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  modalContentWrapper: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '90%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.37,
    shadowRadius: 32,
    elevation: 16,
  },
  modalContent: {
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    color: 'white', 
    textShadowColor: 'rgba(249, 115, 22, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa',
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: 'rgba(161, 161, 170, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  wheelWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  // Container for the wheel SVG/animated view
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointerContainer: {
    position: 'absolute',
    top: 6,
    zIndex: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 10,
  },
  pointerBase: {
    alignSelf: 'center',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fef3c7',
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginTop: -27
  },
  pointer: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#f97316',
  },

  // Center button and decor
  spinButtonWrapper: {
    position: 'absolute',
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerDecor: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRingLarge: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.35)',
    backgroundColor: 'rgba(249, 115, 22, 0.06)',
  },
  centerRingSmall: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  spinButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  spinButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  spinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  resultContainer: {
    marginTop: 20,
    height: 30,
    justifyContent: 'center',
  },
  resultText: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    color: 'white',
  },
  statusDisplay: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '90%',
    maxWidth: 280,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  timerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
    textShadowColor: 'rgba(239, 68, 68, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  readyText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: -50,
    // textShadowColor: 'white',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    marginBottom: 2,
  },
});

export default SpinWheel;