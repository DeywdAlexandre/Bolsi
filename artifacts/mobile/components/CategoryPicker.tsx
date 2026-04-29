import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { IconCircle } from "@/components/IconCircle";
import { useColors } from "@/hooks/useColors";
import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function CategoryPicker({ categories, selectedId, onSelect }: Props) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {categories.map((cat) => {
        const selected = cat.id === selectedId;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={({ pressed }) => [
              styles.item,
              {
                opacity: pressed ? 0.7 : 1,
                backgroundColor: selected ? cat.color + "26" : "transparent",
                borderColor: selected ? cat.color : colors.border,
              },
            ]}
          >
            <IconCircle name={cat.icon} color={cat.color} size={36} />
            <Text
              style={[
                styles.label,
                {
                  color: selected ? colors.foreground : colors.mutedForeground,
                  fontFamily: selected ? "Inter_600SemiBold" : "Inter_500Medium",
                },
              ]}
              numberOfLines={1}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  item: {
    width: 96,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 12,
    textAlign: "center",
  },
});

export function CategoryPickerVertical({ categories, selectedId, onSelect }: Props) {
  const colors = useColors();
  return (
    <View style={vstyles.grid}>
      {categories.map((cat) => {
        const selected = cat.id === selectedId;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={({ pressed }) => [
              vstyles.item,
              {
                opacity: pressed ? 0.7 : 1,
                backgroundColor: selected ? cat.color + "26" : colors.card,
                borderColor: selected ? cat.color : colors.border,
              },
            ]}
          >
            <IconCircle name={cat.icon} color={cat.color} size={32} />
            <Text
              style={[
                vstyles.label,
                {
                  color: selected ? colors.foreground : colors.mutedForeground,
                  fontFamily: selected ? "Inter_600SemiBold" : "Inter_500Medium",
                },
              ]}
              numberOfLines={1}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const vstyles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  item: {
    width: "31%",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 11,
    textAlign: "center",
  },
});
