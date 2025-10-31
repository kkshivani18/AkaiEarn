import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

// --- Configuration ---
const METER_SIZE = screenWidth * 0.8; // Increased from 0.6 to 0.8 for wider container
const METER_WIDTH = METER_SIZE / 2;
const STROKE_WIDTH = 20;
const MAX_IQ = 100;

// --- IQ Ranges Configuration ---
const DEFAULT_IQ_RANGES = [
  { min: 1,  max: 10, colorHex: "#FF3B30" },   // Red (Lowest)
  { min: 10, max: 40, colorHex: "#FF9500" },  // Orange
  { min: 40, max: 70, colorHex: "#FFCC00" },  // Yellow
  { min: 70, max: 85, colorHex: "#34C759" },  // Green
  { min: 85, max: 100, colorHex: "#30B158" }, // Dark Green (Highest)
];

// --- Helper Functions ---

/**
 * Converts polar coordinates to Cartesian for SVG arc drawing.
 */
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

/**
 * Describes a semi-circular arc for the SVG path component.
 */
const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 0 ${end.x} ${end.y}`;
};

/**
 * Determines the descriptive label based on the IQ score.
 */
const getIqLabel = (iq: number) => {
  if (iq < 10) return "Just Starting";
  if (iq < 40) return "Beginner";
  if (iq < 70) return "Average";
  if (iq < 85) return "Above Average";
  return "Expert";
};

interface IQMeterProps {
  iqValue?: number;
}

// --- The Main Component ---
const IQMeter: React.FC<IQMeterProps> = ({ iqValue = 90 }) => {
  const [rotation, setRotation] = useState(-90); // Initial rotation for IQ 0

  // Animate the needle whenever the iqValue prop changes
  useEffect(() => {
    // Map IQ value (0-100) to a rotation angle (-90 to 90 degrees)
    const targetRotation = (iqValue / MAX_IQ) * 180 - 90;
    setRotation(targetRotation);
  }, [iqValue]);
  
  const radius = (METER_SIZE - STROKE_WIDTH) / 2;
  const arcPath = describeArc(METER_SIZE / 2, METER_SIZE / 2, radius, 0, 180);

  return (
    <View style={styles.container}>
      <View style={styles.meterContainer}>
        <Svg width={METER_SIZE} height={METER_WIDTH} style={styles.svg}>
          <Defs>
            <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              {/* Map over the IQ ranges to create the gradient stops */}
              {DEFAULT_IQ_RANGES.map((range) => (
                <Stop key={range.min} offset={`${range.max}%`} stopColor={range.colorHex} />
              ))}
            </LinearGradient>
          </Defs>
          <Path
            d={arcPath}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={STROKE_WIDTH + 2}
            fill="none"
          />
          <Path
            d={arcPath}
            stroke="url(#grad)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
        
        <View style={[styles.needleContainer, { transform: [{ rotate: `${rotation}deg` }] }]}>
          <View style={styles.needle} />
        </View>

        {/* <View style={styles.pivot} /> */}
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.iqValue}>{Math.round(iqValue)}</Text>
        <Text style={styles.iqLabel}>{getIqLabel(iqValue)}</Text>
      </View>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
  },
  meterContainer: {
    width: METER_SIZE,
    height: METER_WIDTH,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
    top: 0,
  },
  needleContainer: {
    position: 'absolute',
    width: METER_SIZE,
    height: METER_WIDTH,
    bottom: 0,
    left: 0,
    transformOrigin: 'center bottom',
  },
  needle: {
    position: 'absolute',
    width: 4,
    height: METER_WIDTH * 0.9, // Make it almost as tall as the radius
    backgroundColor: 'white',
    borderRadius: 2,
    bottom: 0, // Anchor it to the bottom of its container
    left: '50%', // Center it horizontally
    transform: [{ translateX: -2 }], // Fine-tune centering
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  // pivot: {
  //   position: 'absolute',
  //   width: 20,
  //   height: 20,
  //   borderRadius: 12,
  //   backgroundColor: 'white',
  //   borderWidth: 3,
  //   borderColor: 'rgba(255, 255, 255, 0.2)',
  //   bottom: -12, // Position it at the bottom, overlapping the card bg
  //   left: '50%',
  //   transform: [{ translateX: -12 }], // Center it horizontally
  //   zIndex: 1, // Ensure pivot is on top of needle
  //   shadowColor: 'white',
  //   shadowOffset: { width: 0, height: 0 },
  //   shadowOpacity: 0.6,
  //   shadowRadius: 8,
  //   elevation: 8,
  // },
  textContainer: {
    alignItems: 'center',
    marginTop: 24, // Pushed down to be below the pivot
  },
  iqValue: {
    fontSize: 23,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  iqLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: '#A1A1AA',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default IQMeter;