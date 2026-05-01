import React from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface ContactAvatarProps {
  photo?: string;
  name: string;
  size?: number;
}

export function ContactAvatar({ photo, name, size = 50 }: ContactAvatarProps) {
  const colors = useColors();
  const initial = name.trim().charAt(0).toUpperCase();

  if (photo) {
    return (
      <Image
        source={{ uri: photo }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.muted,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.initial, { color: colors.foreground, fontSize: size * 0.4 }]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  initial: {
    fontFamily: "Inter_700Bold",
  },
});
