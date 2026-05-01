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

  const { items, total } = useMemo(() => {
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
    
    const totalSum = list.reduce((s, x) => s + x.total, 0);
    return { items: list, total: totalSum };
  }, [transactions, categories, type]);

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Sem {type === "expense" ? "gastos" : "entradas"} no período.
        </Text>
      </View>
    );
  }

  const top3 = items.slice(0, 3);
  const othersCount = items.length - 3;
  const othersTotal = items.slice(3).reduce((s, x) => s + x.total, 0);

  return (
    <View style={styles.container}>
      {/* Barra Empilhada (Stacked Bar) */}
      <View style={[styles.stackedBar, { backgroundColor: colors.muted }]}>
        {items.map((item, idx) => {
          const pct = (item.total / total) * 100;
          return (
            <View
              key={item.categoryId}
              style={{
                flex: pct,
                height: "100%",
                backgroundColor: item.cat!.color,
                // Adiciona uma pequena margem entre os segmentos se não for o último
                marginRight: idx < items.length - 1 ? 1 : 0,
              }}
            />
          );
        })}
      </View>

      <View style={styles.list}>
        {top3.map((item) => {
          const share = (item.total / total) * 100;
          return (
            <View key={item.categoryId} style={styles.row}>
              <IconCircle name={item.cat!.icon} color={item.cat!.color} size={32} />
              <View style={styles.content}>
                <View style={styles.headerRow}>
                  <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                    {item.cat!.name}
                  </Text>
                  <Text style={[styles.amt, { color: colors.foreground }]}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
                <Text style={[styles.share, { color: colors.mutedForeground }]}>
                  {share.toFixed(1).replace(".", ",")}% do total
                </Text>
              </View>
            </View>
          );
        })}

        {othersCount > 0 && (
          <View style={styles.othersRow}>
            <View style={[styles.othersDot, { backgroundColor: colors.mutedForeground }]} />
            <Text style={[styles.othersText, { color: colors.mutedForeground }]}>
              {othersCount === 1 
                ? `+ 1 outra categoria (${formatCurrency(othersTotal)})`
                : `+ ${othersCount} outras categorias (${formatCurrency(othersTotal)})`
              }
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20, // Distância entre a barra e a lista solicitada pelo usuário
  },
  stackedBar: {
    height: 12,
    borderRadius: 6,
    flexDirection: "row",
    overflow: "hidden",
  },
  list: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 2,
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
  share: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  othersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 44, // Alinha com o texto acima (32 icon + 12 gap)
  },
  othersDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  othersText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    fontStyle: "italic",
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

