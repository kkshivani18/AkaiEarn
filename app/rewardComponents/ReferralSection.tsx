import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

interface ReferralSectionProps {
  referralCode?: string;
  totalReferrals?: number;
  onCopyPress?: () => void;
  onLearnMorePress?: () => void;
}

export const ReferralSection: React.FC<ReferralSectionProps> = ({
  referralCode = 'DE7P4P8E',
  totalReferrals = 2,
  onCopyPress,
  onLearnMorePress,
}) => {
  const handleCopy = () => {
    Clipboard.setStringAsync(referralCode);
    if (onCopyPress) onCopyPress();
  };

  const handleLearnMore = () => {
    if (onLearnMorePress) onLearnMorePress();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFEE58', '#FFEBA3', '#FFB917']}
        locations={[0, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradientContainer}
      >
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Invite & Earn</Text>
            <Text style={styles.subtitle}>Give points, get points. Win–win!</Text>

            <View style={styles.codeCard}>
              <LinearGradient
                colors={['#D9D9D9', '#EADE58']}
                locations={[0, 0.4]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.codeCardGradient}
              >
                <Text style={styles.codeHeaderText}>Your Secret Route</Text>
                <View style={styles.codeRow}>
                  <Text style={styles.codeText}>{referralCode}</Text>
                  <TouchableOpacity onPress={handleCopy} style={styles.copyButton} activeOpacity={0.8}>
                    <Ionicons name="copy-outline" size={14} color="#2D2D2D" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.codeSubtext}>Total referrals: {totalReferrals}</Text>
              </LinearGradient>
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={handleLearnMore} style={styles.learnButtonWrapper}>
              <LinearGradient
                colors={['#D9D9D9', '#ECCF90']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.learnButtonGradient}
              >
                <View style={styles.learnButtonContent}>
                  <Text style={styles.learnButtonText}>Learn More</Text>
                  <Ionicons name="arrow-forward" size={12} color="#000" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.imageContainer} pointerEvents="none">
        <Image
          source={require('../../assets/app-images/referral_pandas.png')}
          style={styles.pandasImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: -30,
    marginBottom: 60,
    width: 340,
    alignSelf: 'flex-start',
    position: 'relative'
  },
  gradientContainer: {
    borderRadius: 20,
    height: 160,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: '100%',
  },
  textContainer: {
    width: 190,
    justifyContent: 'center',
    zIndex: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#3A3A3A',
    marginBottom: 10,
  },
  codeCard: {
    width: 130,
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6D08A',
    overflow: 'hidden',
    marginBottom: 6,
  },
  codeCardGradient: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  codeHeaderText: {
    fontSize: 9,
    color: '#5A5A5A',
    fontWeight: '600',
    marginBottom: 2,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D2D2D',
    letterSpacing: 0.6,
  },
  copyButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E6D08A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F1DE',
  },
  codeSubtext: {
    fontSize: 10,
    color: '#5A5A5A',
    marginTop: 2,
  },
  learnButtonWrapper: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1A950',
    overflow: 'hidden',
  },
  learnButtonGradient: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  learnButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  learnButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  imageContainer: {
    position: 'absolute',
    right: -30,
    top: -41,
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  pandasImage: {
    width: '100%',
    height: '100%'
  },
});
