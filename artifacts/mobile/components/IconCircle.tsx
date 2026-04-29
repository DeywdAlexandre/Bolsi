import React from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

type Props = {
  name: keyof typeof Feather.glyphMap | string;
  color: string;
  size?: number;
  iconSize?: number;
};

export function IconCircle({ name, color, size = 44, iconSize }: Props) {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + "26",
        },
      ]}
    >
      <Feather
        name={name as keyof typeof Feather.glyphMap}
        size={iconSize ?? Math.round(size * 0.5)}
        color={color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
});
