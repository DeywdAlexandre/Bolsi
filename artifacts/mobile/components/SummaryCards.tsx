import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/lib/format";

type Props = {
  income: number;
  expense: number;
  balance: number;
  globalBalance: number;
  savedAmount?: number;
};

export function SummaryCards({ 
  income, 
  expense, 
  balance, 
  globalBalance,
  savedAmount = 0 
}: Props) {
  const colors = useColors();
  const isGlobalPositive = globalBalance >= 0;
  const isPeriodPositive = balance >= 0;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bigCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.bigLabel, { color: colors.mutedForeground }]}>
          Saldo Total
        </Text>
        <Text
          style={[
            styles.bigAmount,
            { color: isGlobalPositive ? colors.foreground : colors.expense },
          ]}
        >
          {formatCurrency(globalBalance)}
        </Text>
        
        <View style={styles.periodRow}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[styles.periodLabel, { color: colors.mutedForeground }]}>
              Neste período:{" "}
              <Text style={{ color: isPeriodPositive ? colors.income : colors.expense, fontFamily: "Inter_600SemiBold" }}>
                {isPeriodPositive ? "+" : ""}{formatCurrency(balance)}
              </Text>
            </Text>
            
            {savedAmount > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Feather name="shield" size={10} color={colors.primary} />
                <Text style={[styles.periodLabel, { color: colors.mutedForeground }]}>
                  Guardado: <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>{formatCurrency(savedAmount)}</Text>
                </Text>
              </View>
            )}
          </View>
        </View>
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
  periodRow: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.03)",
    paddingTop: 8,
  },
  periodLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
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
