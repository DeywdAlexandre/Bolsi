import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useChat } from "@/contexts/ChatContext";
import { useColors } from "@/hooks/useColors";

export function ChatFAB() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { open, unread } = useChat();

  const tabBarHeight = Platform.OS === "web" ? 84 : 64;
  const bottom = (Platform.OS === "web" ? 0 : insets.bottom) + tabBarHeight + 14;

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        open();
      }}
      style={({ pressed }) => [
        styles.fab,
        {
          bottom,
          backgroundColor: colors.foreground,
          transform: [{ scale: pressed ? 0.94 : 1 }],
          shadowColor: colors.foreground,
        },
      ]}
    >
      <Feather name="message-circle" size={24} color={colors.background} />
      {unread > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>
            {unread > 9 ? "9+" : unread}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
});
