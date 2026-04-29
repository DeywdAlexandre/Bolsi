import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { IconCircle } from "@/components/IconCircle";
import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";

type Props = {
  transactions: Transaction[];
  categories: Category[];
  type: "expense" | "income";
};

export function CategoryBreakdown({ transactions, categories, type }: Props) {
  const colors = useColors();

  const items = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== type) continue;
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    }
    const list = Array.from(map.entries())
      .map(([categoryId, total]) => {
        const cat = categories.find((c) => c.id === categoryId);
        return { categoryId, total, cat };
      })
      .filter((x) => x.cat)
      .sort((a, b) => b.total - a.total);
    return list;
  }, [transactions, categories, type]);

  const max = items[0]?.total ?? 0;
  const total = items.reduce((s, x) => s + x.total, 0);

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Sem {type === "expense" ? "gastos" : "entradas"} no período.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {items.map((item) => {
        const pct = max > 0 ? item.total / max : 0;
        const share = total > 0 ? (item.total / total) * 100 : 0;
        return (
          <View key={item.categoryId} style={styles.row}>
            <IconCircle name={item.cat!.icon} color={item.cat!.color} size={36} />
            <View style={styles.middle}>
              <View style={styles.headerRow}>
                <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                  {item.cat!.name}
                </Text>
                <Text style={[styles.amt, { color: colors.foreground }]}>
                  {formatCurrency(item.total)}
                </Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.max(4, pct * 100)}%`, backgroundColor: item.cat!.color },
                  ]}
                />
              </View>
              <Text style={[styles.share, { color: colors.mutedForeground }]}>
                {share.toFixed(1).replace(".", ",")}% do total
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  middle: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  amt: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  share: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  empty: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
