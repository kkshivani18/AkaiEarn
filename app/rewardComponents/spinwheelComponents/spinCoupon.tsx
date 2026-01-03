import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from "../../../constants/fonts";

type SpinCouponModalProps = {
  visible: boolean;
  companyName: string;
  logoUri: string;
  description?: string;
  couponCode?: string;
  onCopyCode: (code: string) => void;
  onRedeem: () => void;
  onClose: () => void;
};

const SpinCouponModal: React.FC<SpinCouponModalProps> = ({
  visible,
  companyName,
  logoUri,
  description,
  couponCode,
  onCopyCode,
  onRedeem,
  onClose,
}) => {
  const codeText = (() => {
    if (couponCode && couponCode.trim().length > 0) return couponCode.trim();
    if (description) {
      const m = description.match(/[A-Z0-9]{4,}/i);
      if (m && m[0]) return m[0].toUpperCase();
    }
    return companyName.replace(/\s+/g, '').toUpperCase();
  })();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#FFB917', '#FFD25D', '#FFEBA3', '#FFEBA3', '#FFD25D', '#FFB917']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.card}
        >
          <View style={styles.header}>
            <Text style={styles.headerText}>CONGRATULATIONS</Text>
          </View>

          <View style={styles.logoRow}>
            <Image
              source={{ uri: logoUri }}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.titleText}>{companyName}</Text>
            {!!description && <Text style={styles.subtitleText}>{description}</Text>}
          </View>

          <View style={styles.codeRow}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{codeText}</Text>
            </View>
            <TouchableOpacity style={styles.copyButton} onPress={() => onCopyCode(codeText)} activeOpacity={0.85}>
              <Text style={styles.copyButtonText}>COPY</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.redeemButton} onPress={onRedeem} activeOpacity={0.9}>
            <Text style={styles.redeemButtonText}>View My Coupons</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.9}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: 276.88,
    height: 375,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#AA4CF0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: FONTS.body.bold,
    letterSpacing: 1,
  },
  logoRow: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  logo: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  titleRow: {
    alignItems: 'center',
  },
  titleText: {
    color: '#1F2937',
    fontSize: 22,
    fontFamily: FONTS.body.bold,
  },
  subtitleText: {
    color: '#1F2937',
    fontSize: 14,
    fontFamily: FONTS.body.semiBold,
    marginTop: 6,
    textAlign: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  codeBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FFB917',
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    color: '#EF4444',
    fontSize: 16,
    fontFamily: FONTS.body.bold,
  },
  copyButton: {
    backgroundColor: '#673AB7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.body.bold,
  },
  redeemButton: {
    backgroundColor: '#AA4CF0',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 12,
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.body.bold,
    letterSpacing: 0.5,
  },
  closeButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    color: '#1F2937',
    fontSize: 14,
    fontFamily: FONTS.body.semiBold,
  },
});

export default SpinCouponModal;
