import React, { useMemo, useState } from "react";
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { PeriodSelector, type Period } from "@/components/PeriodSelector";
import { TransactionItem } from "@/components/TransactionItem";
import { useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";
import { formatDate, getMonthName } from "@/lib/format";
import type { Transaction, TransactionType } from "@/lib/types";

type Filter = "all" | TransactionType;

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, categories } = useAppData();

  const now = new Date();
  const [period, setPeriod] = useState<Period>({
    mode: "month",
    month: now.getMonth(),
    year: now.getFullYear(),
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        if (period.mode === "month") {
          if (d.getMonth() !== period.month || d.getFullYear() !== period.year) return false;
        } else {
          if (d.getFullYear() !== period.year) return false;
        }
        if (filter !== "all" && t.type !== filter) return false;
        if (categoryFilter && t.categoryId !== categoryFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, period, filter, categoryFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const key = formatDate(t.date);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [filtered]);

  const periodLabel =
    period.mode === "month" ? `${getMonthName(period.month)} ${period.year}` : `${period.year}`;

  const usedCategories = useMemo(() => {
    const ids = new Set<string>();
    for (const t of transactions) ids.add(t.categoryId);
    return categories.filter((c) => ids.has(c.id));
  }, [transactions, categories]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.foreground }]}>Histórico</Text>
          <Pressable
            onPress={() => router.push("/transaction/new")}
            style={({ pressed }) => [
              styles.headerBtn,
              { backgroundColor: colors.foreground, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="plus" size={18} color={colors.background} />
          </Pressable>
        </View>

        <View style={styles.periodWrap}>
          <PeriodSelector period={period} onChange={setPeriod} />
        </View>

        <View style={styles.filterRow}>
          {(["all", "expense", "income"] as Filter[]).map((f) => {
            const active = filter === f;
            const labels = { all: "Tudo", expense: "Gastos", income: "Entradas" };
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.foreground : colors.muted,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? colors.background : colors.foreground,
                    fontFamily: active ? "Inter_700Bold" : "Inter_500Medium",
                    fontSize: 13,
                  }}
                >
                  {labels[f]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {usedCategories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            <Pressable
              onPress={() => setCategoryFilter(null)}
              style={[
                styles.catChip,
                {
                  backgroundColor: !categoryFilter ? colors.foreground : colors.muted,
                },
              ]}
            >
              <Text
                style={{
                  color: !categoryFilter ? colors.background : colors.mutedForeground,
                  fontFamily: !categoryFilter ? "Inter_600SemiBold" : "Inter_500Medium",
                  fontSize: 12,
                }}
              >
                Todas
              </Text>
            </Pressable>
            {usedCategories.map((c) => {
              const active = categoryFilter === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategoryFilter(active ? null : c.id)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: active ? c.color + "33" : colors.muted,
                      borderColor: active ? c.color : "transparent",
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Feather name={c.icon as keyof typeof Feather.glyphMap} size={12} color={c.color} />
                  <Text
                    style={{
                      color: active ? colors.foreground : colors.mutedForeground,
                      fontFamily: active ? "Inter_600SemiBold" : "Inter_500Medium",
                      fontSize: 12,
                    }}
                  >
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      {grouped.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="inbox"
            title="Nada por aqui"
            description={`Sem transações em ${periodLabel}.`}
          />
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(g) => g.date}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 4 }}
          renderItem={({ item }) => (
            <View style={styles.group}>
              <Text style={[styles.groupDate, { color: colors.mutedForeground }]}>{item.date}</Text>
              <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {item.items.map((t, idx) => {
                  const cat = categories.find((c) => c.id === t.categoryId);
                  return (
                    <View key={t.id}>
                      <View style={{ paddingHorizontal: 12 }}>
                        <TransactionItem
                          transaction={t}
                          category={cat}
                          showDate={false}
                          onPress={() =>
                            router.push({ pathname: "/transaction/[id]", params: { id: t.id } })
                          }
                        />
                      </View>
                      {idx < item.items.length - 1 ? (
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  periodWrap: {},
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  catRow: {
    gap: 8,
    paddingRight: 20,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  group: {
    marginTop: 14,
    gap: 8,
  },
  groupDate: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
  },
});
