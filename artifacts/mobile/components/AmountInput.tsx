import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { formatAmountInput, parseAmountInput } from "@/lib/format";

type Props = {
  value: number;
  onChange: (next: number) => void;
  type?: "income" | "expense";
};

export function AmountInput({ value, onChange, type = "expense" }: Props) {
  const colors = useColors();
  const accent = type === "income" ? colors.income : colors.expense;

  const display = useMemo(() => formatAmountInput(value), [value]);

  return (
    <View style={styles.container}>
      <Text style={[styles.currency, { color: colors.mutedForeground }]}>R$</Text>
      <Pressable style={styles.touchable}>
        <TextInput
          style={[styles.input, { color: accent }]}
          keyboardType="number-pad"
          value={display}
          onChangeText={(t) => onChange(parseAmountInput(t))}
          selectTextOnFocus
          maxLength={15}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 8,
  },
  currency: {
    fontSize: 22,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
  },
  touchable: {
    flexShrink: 1,
  },
  input: {
    fontSize: 56,
    fontFamily: "Inter_700Bold",
    textAlign: "left",
    minWidth: 100,
    padding: 0,
    letterSpacing: -1,
  },
});
