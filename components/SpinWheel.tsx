import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
  Text as SvgText,
} from 'react-native-svg';
import { couponsAPI } from '../services/api';

interface Segment {
  color: string;
  text: string;
  reward: string;
  type?: 'tokens' | 'coupon';
  value?: number; 
  couponData?: any; 
  coupon?: any;
  brandLogo?: string;
}

interface SpinWheelProps {
  segments: Segment[];
  onSpinComplete: (segment: Segment) => void;
  isSpinning: boolean;
  isUnlocked?: boolean; 
  spinValue: Animated.Value;
  onSpinPress?: () => void;
  wheelSize?: number;
  cooldownTime?: number;
  visible?: boolean; // Add visible prop to refresh when modal opens
}

// --- Constants ---
const DEFAULT_WHEEL_SIZE = 280;
const STROKE_WIDTH = 4;
const COOLDOWN_TIME = 24 * 60 * 60; 
const SPIN_DURATION = 5000;
const FULL_SPINS = 5;
const MAX_SEGMENTS = 6; 
const PALETTE = [
  '#76B7EC',
  '#60A5FA',
  '#3B82F6',
  '#2563EB', 
  '#1D4ED8', 
  '#0EA5E9', 
];

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
  <Text style={[style, { color: '#1DA1F2' }]}>{children}</Text>
);

// Remove WheelPointer component (do not render top pointer)

const SpinButton: React.FC<{
  onPress: () => void;
  disabled: boolean;
  isSpinning: boolean;
  pulseScale?: Animated.Value;
}> = React.memo(({ onPress, disabled, isSpinning, pulseScale }) => (
  <Animated.View style={[styles.spinButtonWrapper, pulseScale ? { transform: [{ scale: pulseScale }] } : null]}>
    <View style={styles.centerButtonPointerContainer}>
      <View style={styles.centerButtonPointer} />
    </View>

    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.spinButton, disabled && styles.disabledButton]}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#1DA1F2', '#007AFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.spinButtonGradient}
      >
        <Text style={styles.spinButtonText}>{isSpinning ? '...' : 'SPIN'}</Text>
      </LinearGradient>
    </TouchableOpacity>
  </Animated.View>
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

    let logoUrl = segment.brandLogo || segment.coupon?.imageLink;
    
    if (segment.type === 'coupon' && segment.couponData?.imageLink) {
      logoUrl = segment.couponData.imageLink;
    } else if (segment.type === 'tokens') {
      logoUrl = undefined as any;
    }

    const label =
      segment.type === 'tokens'
        ? `${segment.value ?? ''} Tokens`.trim()
        : segment.couponData?.company || segment.text || 'Reward';

    return (
      <G key={`segment-${index}`}>
        {/* Main segment */}
        <Path 
          d={segmentPath} 
          fill={segment.color || "rgba(255,255,255,0.05)"} 
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="1"
        />
        <Path
          d={segmentPath}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        {logoUrl ? (
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
        ) : (
          <SvgText
            x={logoX}
            y={logoY + 4}
            fontSize="12"
            fontWeight="700"
            fill="#ffffff"
            textAnchor="middle"
          >
            {label.length > 10 ? `${label.slice(0, 9)}…` : label}
          </SvgText>
        )}
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
          stroke="#FFFFFF" 
          strokeWidth="2"
          strokeOpacity={0.07}
          strokeLinecap="round"
          filter="url(#laserGlow)" 
        />
      );
    });
  }, [segments, anglePerSegment, outerRadius, innerRadius]);

  const renderTickDots = useCallback(() => {
    const r = innerRadius; 
    return segments.map((_, index) => {
      const a = (index * anglePerSegment - 90) * (Math.PI / 180);
      const cx = outerRadius + r * Math.cos(a);
      const cy = outerRadius + r * Math.sin(a);
      return <Circle key={`dot-${index}`} cx={cx} cy={cy} r="2.2" fill="#FFFFFF" opacity={0.15} />;
    });
  }, [segments, anglePerSegment, outerRadius, innerRadius]);

  return (
    <Svg width={wheelSize} height={wheelSize} viewBox={`0 0 ${wheelSize} ${wheelSize}`}>
      <Defs>
        <RadialGradient id="orangeGlow">
          <Stop offset="0%" stopColor="#1DA1F2" stopOpacity="0.6" />
          <Stop offset="100%" stopColor="#1DA1F2" stopOpacity="0" />
        </RadialGradient>
        <Filter id="laserGlow">
          <FeDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#007AFF" />
        </Filter>
        <ClipPath id="logoClipPath">
          <Circle cx="0" cy="0" r={logoRadius} />
        </ClipPath>
      </Defs>

      <G>
        {/* Background glow */}
        <Circle cx={outerRadius} cy={outerRadius} r={innerRadius} fill="url(#orangeGlow)" />
        
        {segments.map(renderSegment)}
        
        {renderSeparatorLines()}
        
        {renderTickDots()}

        {/* Outer rings */}
        <Circle 
          cx={outerRadius} 
          cy={outerRadius} 
          r={innerRadius} 
          fill="transparent" 
          stroke="rgba(255,255,255,0.06)" 
          strokeWidth="1" 
        />
        {/* remove orange center ring; keep minimal subtle ring if needed */}
        <Circle 
          cx={outerRadius} 
          cy={outerRadius} 
          r="45" 
          fill="transparent" 
          stroke="rgba(255,255,255,0.04)" 
          strokeWidth="1" 
        />
      </G>
    </Svg>
  );
});

const segmentsAreEqual = (a: Segment[] = [], b: Segment[] = []) => {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		const sa = a[i];
		const sb = b[i];
		const idA = sa.couponData?._id ?? sa.coupon?._id ?? `${sa.text}|${sa.reward}|${sa.color}`;
		const idB = sb.couponData?._id ?? sb.coupon?._id ?? `${sb.text}|${sb.reward}|${sb.color}`;
		if (idA !== idB) return false;
	}
	return true;
};

const arePropsEqual = (prevProps: SpinWheelProps, nextProps: SpinWheelProps) => {
	if (prevProps.wheelSize !== nextProps.wheelSize) return false;
	if ((prevProps.visible ?? true) !== (nextProps.visible ?? true)) return false;

	if (!segmentsAreEqual(prevProps.segments, nextProps.segments)) return false;

	if (prevProps.onSpinComplete !== nextProps.onSpinComplete) return false;

	return true;
};

// --- Main Component ---
const SpinWheel: React.FC<SpinWheelProps> = ({ 
  segments, 
  onSpinComplete, 
  isSpinning, 
  isUnlocked, 
  spinValue,
  onSpinPress,
  wheelSize = DEFAULT_WHEEL_SIZE,
  cooldownTime = COOLDOWN_TIME,
  visible = true
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState('');
  const [isUnlockedState, setIsUnlockedState] = useState<boolean>(true);
  const currentRotationRef = useRef(0);
  const glowOpacity = useRef(new Animated.Value(0.7)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseScale = useRef(new Animated.Value(1)).current;
  const isSpinningRef = useRef(isSpinning);
  const hasCompletedRef = useRef(false);
  const isProcessingSpinRef = useRef(false); 

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

  useEffect(() => {
    isSpinningRef.current = isSpinning;
  }, [isSpinning]);

  const fetchSpinStatus = useCallback(async () => {
    if (isSpinningRef.current || isProcessingSpinRef.current) return;
    
    try {
      const status = await couponsAPI.getSpinWheelStatus();
      if (status?.success !== false) {
        const canSpin = Boolean(status?.canSpin);
        const secondsLeft = Number(status?.secondsLeft || 0);
        setIsUnlockedState(canSpin);
        setTimeLeft(secondsLeft);
      } else {
        setIsUnlockedState(Boolean(isUnlocked ?? true));
        setTimeLeft(0);
      }
    } catch (error) {
      console.error('Failed to fetch spin wheel status:', error);
      setIsUnlockedState(Boolean(isUnlocked ?? true));
      setTimeLeft(0);
    }
  }, [isUnlocked]);

  useEffect(() => {
    if (visible && !isSpinningRef.current && !isProcessingSpinRef.current) {
      fetchSpinStatus();
    }
  }, [visible, fetchSpinStatus]); 

  const canSpin = (isUnlocked ?? isUnlockedState) && timeLeft === 0;

  // coupons
  const normalizedSegments = useMemo(() => {
    const input = Array.isArray(segments) ? segments.filter(Boolean) : [];
    const couponsOnly = input.filter(s => s && s.type !== 'tokens');
    const colored = couponsOnly.map((s, i) => ({
      ...s,
      color: PALETTE[i % PALETTE.length], 
    }));
    let result = colored.slice(0, MAX_SEGMENTS);
    while (result.length > 0 && result.length < MAX_SEGMENTS) {
      result.push(result[result.length % colored.length]);
    }
    return result;
  }, [segments]);

  // Callbacks
  const startSpinning = useCallback(() => {
    if (isSpinning || !canSpin) return;
    if (!normalizedSegments.length) return;
    
    hasCompletedRef.current = false;
    isProcessingSpinRef.current = false;
    onSpinPress?.();

    const anglePerSegment = 360 / normalizedSegments.length;
    const winningSegmentIndex = Math.floor(Math.random() * normalizedSegments.length);
    const randomOffset = (Math.random() - 0.5) * anglePerSegment * 0.8;
    const targetRotation =
      360 - winningSegmentIndex * anglePerSegment - anglePerSegment / 2 + randomOffset;

    const newRotation =
      currentRotationRef.current +
      360 * FULL_SPINS +
      targetRotation -
      (currentRotationRef.current % 360);
    currentRotationRef.current = newRotation;

    spinValue.setValue(currentRotationRef.current - 360 * FULL_SPINS);

    Animated.timing(spinValue, {
      toValue: newRotation,
      duration: SPIN_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start(() => {
      if (hasCompletedRef.current) {
        console.warn('⚠️ Spin completion callback already called, skipping duplicate call');
        return;
      }
      hasCompletedRef.current = true;
      isProcessingSpinRef.current = true; 
      
      const winningSegment = normalizedSegments[winningSegmentIndex];
      
      let newResult = `You won: ${winningSegment.reward}!`;
      if (winningSegment.type === 'coupon' && winningSegment.couponData) {
        newResult = `You won a ${winningSegment.couponData.company} coupon!`;
      } else if (winningSegment.type === 'tokens') {
        newResult = `You won ${winningSegment.value} tokens!`;
      }
      
      if (result !== newResult) setResult(newResult);
      
      onSpinComplete(winningSegment);
      
      setTimeout(() => {
        setIsUnlockedState(false);
        isProcessingSpinRef.current = false;
        
        if (!isSpinningRef.current) {
          setTimeout(() => {
            fetchSpinStatus();
          }, 500);
        }
      }, 2000); 
    });
  }, [isSpinning, canSpin, onSpinPress, normalizedSegments, spinValue, onSpinComplete, fetchSpinStatus]);

  useEffect(() => {
    if (isSpinningRef.current || isProcessingSpinRef.current) return;
    
    if (timeLeft <= 0) {
      if (visible && !isSpinningRef.current && !isProcessingSpinRef.current) {
        fetchSpinStatus();
      }
      setIsUnlockedState(true);
      return;
    }
    
    // Start countdown timer
    const id = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(id);
          setIsUnlockedState(true);
          if (visible && !isSpinningRef.current && !isProcessingSpinRef.current) {
            fetchSpinStatus();
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    
    return () => clearInterval(id);
  }, [timeLeft, visible, fetchSpinStatus]); 

  // animation effect
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
    if (canSpin && !isSpinning) {
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
  }, [canSpin, isSpinning, pulseScale]);

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
              segments={normalizedSegments}
              wheelSize={wheelSize}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              logoRadius={logoRadius}
            />
          </Animated.View>
          
          <SpinButton
            onPress={startSpinning}
            disabled={isSpinning || !canSpin}
            isSpinning={isSpinning}
            pulseScale={pulseScale}
          />
        </View>
        
        <View style={styles.resultContainer}>
          {result ? (
            <GradientText style={styles.resultText}>{result}</GradientText>
          ) : null}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContentWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
    height: '70%',
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
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    color: '#007AFF', 
    textShadowColor: '#007AFF',
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
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinButtonWrapper: {
    position: 'absolute',
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonPointerContainer: {
    position: 'absolute',
    top: -14, 
    zIndex: 22,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 16,
  },
  centerButtonPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1DA1F2',
    // borderBottomColor: 'white',  
    // shadowColor: '#000',
    // shadowOpacity: 0.15,
    // shadowRadius: 4,
    // elevation: 4,
  },
  centerButtonPointerBase: {
    marginTop: -2,
    width: 18,
    height: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    zIndex: 23,
  },

  spinButton: {
    width: 64,
    height: 64,
    borderRadius: 34,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1DA1F2',
    shadowColor: '#1DA1F2',
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
    fontSize: 13,
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
    fontSize: 16,
    color: '#9ca3af',
  },
  timerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1DA1F2',
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

export default React.memo(SpinWheel, arePropsEqual);