import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FONTS } from '../../constants/fonts';

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        // Get icon name based on route
        let iconName: keyof typeof Ionicons.glyphMap = "home";
        if (route.name === "home") iconName = "home";
        else if (route.name === "offer") iconName = "list-sharp";
        else if (route.name === "rewards") iconName = "gift-outline";
        else if (route.name === "wallet") iconName = "wallet-outline";
        else if (route.name === "profile") iconName = "person-outline";

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={route.name}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            {isFocused ? (
              <View
                style={[
                  styles.activeTab,
                  { minWidth: 90, maxWidth: 160, alignSelf: "center" },
                ]}
              >
                <Ionicons name={iconName} size={20} color="#000" />
                <Text
                  style={styles.activeLabel}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {label as string}
                </Text>
              </View>
            ) : (
              <Ionicons name={iconName} size={22} color="#666" />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="home"
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="offer"
        options={{
          title: "Offers",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: "Rewards",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#1a1b23",
    borderTopColor: "#2a2b33",
    borderTopWidth: 1,
    height: 105,
    paddingBottom: 40,
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 30,
    gap: 8,
    flexShrink: 0,
    marginLeft: 55,
    marginRight: 55,
    marginBottom: 10,
  },
  activeLabel: {
    color: "#000",
    fontSize: 12,
    fontFamily: FONTS.heading.bold,
  },
});
