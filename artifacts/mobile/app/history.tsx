import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, Stack } from "expo-router";

import { EmptyState } from "@/components/EmptyState";
import { PeriodSelector, type Period } from "@/components/PeriodSelector";
import { TransactionItem } from "@/components/TransactionItem";
import { useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";

export default function HistoryScreen() {
  const colors = useColors();
  const { transactions, categories, ready } = useAppData();

  const now = new Date();
  const [period, setPeriod] = useState<Period>({
    mode: "month",
    month: now.getMonth(),
    year: now.getFullYear(),
  });

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      if (period.mode === "month") {
        return d.getMonth() === period.month && d.getFullYear() === period.year;
      }
      if (period.mode === "year") {
        return d.getFullYear() === period.year;
      }
      if (period.mode === "range" && period.startDate && period.endDate) {
        const tDate = t.date.split("T")[0];
        return tDate >= period.startDate && tDate <= period.endDate;
      }
      return true;
    });
  }, [transactions, period]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filtered]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Extrato Completo" }} />
      
      <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <PeriodSelector period={period} onChange={setPeriod} enableRange />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {!ready ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.skeleton, { backgroundColor: colors.muted }]} />
            ))}
          </View>
        ) : sorted.length === 0 ? (
          <View style={{ marginTop: 60 }}>
            <EmptyState
              icon="inbox"
              title="Nada por aqui"
              description="Nenhuma transação encontrada para este período."
            />
          </View>
        ) : (
          <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {sorted.map((t, idx) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              return (
                <React.Fragment key={t.id}>
                  <TransactionItem
                    transaction={t}
                    category={cat}
                    onPress={() =>
                      router.push({ pathname: "/transaction/[id]", params: { id: t.id } })
                    }
                  />
                  {idx < sorted.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  scroll: {
    padding: 20,
  },
  listCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  skeletonList: { gap: 12 },
  skeleton: {
    height: 70,
    borderRadius: 16,
  },
  divider: {
    height: 1,
  },
});
