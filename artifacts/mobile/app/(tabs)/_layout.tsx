import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { GestureResponderEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ChatFAB } from "@/components/ChatFAB";
import { useColors } from "@/hooks/useColors";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const TABS: Array<{
  name: "index" | "history" | "recurring" | "vehicles";
  title: string;
  icon: IoniconsName;
  iconActive: IoniconsName;
}> = [
  { name: "index", title: "Início", icon: "home-outline", iconActive: "home" },
  { name: "history", title: "Histórico", icon: "receipt-outline", iconActive: "receipt" },
  { name: "recurring", title: "Fixos", icon: "repeat-outline", iconActive: "repeat" },
  { name: "vehicles", title: "Veículos", icon: "car-sport-outline", iconActive: "car-sport" },
];

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const bottomInset = isWeb ? 12 : Math.max(insets.bottom, 10);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
            elevation: 0,
            shadowOpacity: 0,
            height: 60 + bottomInset,
            paddingTop: 0,
            paddingBottom: bottomInset,
          },
          tabBarItemStyle: { paddingVertical: 0 },
        }}
      >
        {TABS.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarButton: (props) => (
                <TabButton
                  {...props}
                  label={tab.title}
                  icon={tab.icon}
                  iconActive={tab.iconActive}
                />
              ),
            }}
          />
        ))}
      </Tabs>
      <ChatFAB />
    </View>
  );
}

type TabButtonProps = {
  onPress?: (e: GestureResponderEvent) => void;
  accessibilityState?: { selected?: boolean };
  label: string;
  icon: IoniconsName;
  iconActive: IoniconsName;
};

function TabButton({
  onPress,
  accessibilityState,
  label,
  icon,
  iconActive,
}: TabButtonProps) {
  const colors = useColors();
  const focused = !!accessibilityState?.selected;
  const tint = focused ? colors.primary : colors.mutedForeground;

  const handlePress = (e: GestureResponderEvent) => {
    if (Platform.OS !== "web" && !focused) {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress?.(e);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      onPress={handlePress}
      style={styles.button}
      android_ripple={{ color: "transparent", borderless: true }}
    >
      <View
        style={[
          styles.indicator,
          {
            backgroundColor: focused ? colors.primary : "transparent",
          },
        ]}
      />
      <View
        style={[
          styles.iconWrap,
          focused && { backgroundColor: colors.primary + "1f" },
        ]}
      >
        <Ionicons name={focused ? iconActive : icon} size={20} color={tint} />
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: tint,
            fontFamily: focused ? "Inter_600SemiBold" : "Inter_500Medium",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 6,
    gap: 2,
  },
  indicator: {
    width: 22,
    height: 3,
    borderRadius: 2,
    marginBottom: 4,
  },
  iconWrap: {
    width: 44,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
});
