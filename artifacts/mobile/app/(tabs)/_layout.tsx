import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { ChatFAB } from "@/components/ChatFAB";
import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const isWeb = Platform.OS === "web";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.foreground,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarShowLabel: false,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            elevation: 0,
            ...(isWeb ? { height: 84 } : {}),
          },
          tabBarItemStyle: {
            paddingTop: 6,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Início",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="home" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "Histórico",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="list" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="recurring"
          options={{
            title: "Fixos",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="repeat" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="vehicles"
          options={{
            title: "Veículos",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="truck" color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>
      <ChatFAB />
    </View>
  );
}

function TabIcon({ name, color, focused }: { name: keyof typeof Feather.glyphMap; color: string; focused: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: colors.muted }]}>
      <Feather name={name} size={20} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
