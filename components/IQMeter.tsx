import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { FONTS } from "../constants/fonts";

const { width: screenWidth } = Dimensions.get('window');

// --- Configuration ---
// size of the meter 
const METER_SIZE = screenWidth * 0.7;
const METER_WIDTH = METER_SIZE / 2;
const STROKE_WIDTH = 18;
// Slight outer border around the IQ arc
const BORDER_STROKE_WIDTH = STROKE_WIDTH + 8;
const MAX_IQ = 100;

// --- IQ Ranges Configuration ---
const DEFAULT_IQ_RANGES = [
  { min: 1,  max: 35, colorHex: "#D63CC6" }, 
  { min: 35, max: 75, colorHex: "#70C8F4" },  
  { min: 75, max: 100, colorHex: "#34E819" }, 
];

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
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

/**
 * Determines the descriptive label based on the IQ score.
 */

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
  
  const CAP_PADDING = 3; 
  const radius = (METER_SIZE - BORDER_STROKE_WIDTH) / 2;
  // Full arc path (background - unfilled portion)
  const fullArcPath = describeArc(METER_SIZE / 2, METER_SIZE / 2, radius, 0  - CAP_PADDING, 180 + CAP_PADDING);
  
  // Calculate the filled arc based on IQ value (0-100 maps to 0-180 degrees)
  const filledAngle = Math.min(Math.max(iqValue, 0), MAX_IQ) / MAX_IQ * 180;
  const filledArcPath = describeArc(METER_SIZE / 2, METER_SIZE / 2, radius, 0  - CAP_PADDING, filledAngle);
  
  // Determine which color to use based on the current IQ value
  const getCurrentColor = () => {
    for (const range of DEFAULT_IQ_RANGES) {
      if (iqValue >= range.min && iqValue <= range.max) {
        return range.colorHex;
      }
    }
    return DEFAULT_IQ_RANGES[DEFAULT_IQ_RANGES.length - 1].colorHex; 
  };

  return (
    <View style={styles.container}>
      <View style={styles.meterContainer}>
        <Svg width={METER_SIZE} height={METER_WIDTH + 40} style={styles.svg}>
          <Defs>
            <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              {/* Map over the IQ ranges to create the gradient stops */}
              {DEFAULT_IQ_RANGES.map((range) => (
                <Stop key={range.min} offset={`${range.max}%`} stopColor={range.colorHex} />
              ))}
            </LinearGradient>
          </Defs>
          {/* Outer border that subtly encases the meter - NOW WITH ROUNDED ENDS */}
          <Path
            d={fullArcPath}
            stroke="#3C3C3C"
            strokeWidth={BORDER_STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Background arc - NOW WITH ROUNDED ENDS */}
          <Path
            d={fullArcPath}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Filled arc based on IQ value - ALREADY HAS ROUNDED ENDS */}
          <Path
            d={filledArcPath}
            stroke="url(#grad)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
        
        <View style={styles.textContainer}>
          <Text style={styles.iqLabel}>Current Level</Text>
          <Text style={styles.iqValue}>{Math.round(iqValue)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    padding: 12,
  },
  meterContainer: {
    width: METER_SIZE,
    height: METER_WIDTH,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    top: -35,
  },
  svg: {
    position: 'absolute',
    top: 0,
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    bottom: 20,
    top: 50
  },
  iqValue: {
    fontSize: 38,
    fontFamily: FONTS.body.bold,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  iqLabel: {
    fontSize: 15,
    fontFamily: FONTS.body.bold,
    color: '#A1A1AA',
    marginBottom: 4,
    textAlign: 'center',
  },
});

export default IQMeter;