import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Animated, Dimensions } from "react-native";
import { BlurView } from "expo-blur";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { FONTS } from "../../../constants/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface DialogProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  width?: number;
}

export const Dialog: React.FC<DialogProps> = ({
  visible,
  onClose,
  children,
  title,
  width = SCREEN_WIDTH * 0.9,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      style={{ backgroundColor: "#313030" }}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.dialogContainer, { width }]}>
              <Animated.View
                style={{
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                }}
              >
                <BlurView
                  intensity={80}
                  tint="dark"
                  style={styles.blurContainer}
                >
                  <View style={styles.glassOverlay}>
                    {/* Header with close button */}
                    <View style={styles.header}>
                      {title && <Text style={styles.title}>{title}</Text>}
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        activeOpacity={1}
                      >
                        <AntDesign name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>{children}</View>
                  </View>
                </BlurView>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialogContainer: {
    maxWidth: 500,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  glassOverlay: {
    backgroundColor: "rgba(26, 27, 35, 0.8)",
    borderRadius: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontFamily: FONTS.body.semiBold,
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  content: {
    padding: 20,
  },
});
