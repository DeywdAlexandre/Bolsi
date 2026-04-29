import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/lib/format";

type Props = {
  income: number;
  expense: number;
  balance: number;
};

export function SummaryCards({ income, expense, balance }: Props) {
  const colors = useColors();
  const isPositive = balance >= 0;
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bigCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.bigLabel, { color: colors.mutedForeground }]}>
          Saldo
        </Text>
        <Text
          style={[
            styles.bigAmount,
            { color: isPositive ? colors.foreground : colors.expense },
          ]}
        >
          {formatCurrency(balance)}
        </Text>
      </View>

      <View style={styles.smallRow}>
        <View
          style={[
            styles.smallCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.smallHead}>
            <View style={[styles.dot, { backgroundColor: colors.income }]}>
              <Feather name="arrow-down-left" size={12} color={colors.primaryForeground} />
            </View>
            <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>
              Entradas
            </Text>
          </View>
          <Text style={[styles.smallAmount, { color: colors.income }]}>
            {formatCurrency(income)}
          </Text>
        </View>

        <View
          style={[
            styles.smallCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.smallHead}>
            <View style={[styles.dot, { backgroundColor: colors.expense }]}>
              <Feather name="arrow-up-right" size={12} color="#ffffff" />
            </View>
            <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>
              Gastos
            </Text>
          </View>
          <Text style={[styles.smallAmount, { color: colors.expense }]}>
            {formatCurrency(expense)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  bigCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  bigLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  bigAmount: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  smallRow: {
    flexDirection: "row",
    gap: 10,
  },
  smallCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  smallHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  smallLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  smallAmount: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
});
