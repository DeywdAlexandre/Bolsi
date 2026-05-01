import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { EmptyState } from "@/components/EmptyState";
import { PeriodSelector, type Period } from "@/components/PeriodSelector";
import { SummaryCards } from "@/components/SummaryCards";
import { TransactionItem } from "@/components/TransactionItem";
import { useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
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
      return d.getFullYear() === period.year;
    });
  }, [transactions, period]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }

    let globalIncome = 0;
    let globalExpense = 0;
    for (const t of transactions) {
      if (t.type === "income") globalIncome += t.amount;
      else globalExpense += t.amount;
    }

    return { 
      income, 
      expense, 
      balance: income - expense,
      globalBalance: globalIncome - globalExpense 
    };
  }, [filtered, transactions]);

  const recent = useMemo(() => {
    return [...filtered]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [filtered]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBackground, { backgroundColor: colors.primary, height: topPad + 220 }]} />
      
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 10, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.primaryForeground + "cc" }]}>Olá,</Text>
            <Text style={[styles.brand, { color: colors.primaryForeground }]}>Deywd</Text>
          </View>
          <Pressable
            onPress={() => router.push("/settings")}
            hitSlop={10}
            style={({ pressed }) => [
              styles.headerBtn,
              { backgroundColor: colors.primaryForeground + "22", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="settings" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>

        <View style={styles.periodContainer}>
          <PeriodSelector period={period} onChange={setPeriod} isDarkBackground={true} />
        </View>

        <View style={styles.summaryContainer}>
          <SummaryCards 
            income={totals.income} 
            expense={totals.expense} 
            balance={totals.balance} 
            globalBalance={totals.globalBalance}
          />
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => router.push({ pathname: "/transaction/new", params: { type: "income" } })}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: colors.income + "1f",
                borderColor: colors.income + "44",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="arrow-down-left" size={18} color={colors.income} />
            <Text style={[styles.actionText, { color: colors.income }]}>Entrada</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: "/transaction/new", params: { type: "expense" } })}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: colors.expense + "1f",
                borderColor: colors.expense + "44",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="arrow-up-right" size={18} color={colors.expense} />
            <Text style={[styles.actionText, { color: colors.expense }]}>Gasto</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Por categoria</Text>
          </View>
          <View style={[styles.cardWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <CategoryBreakdown
              transactions={filtered}
              categories={categories}
              type="expense"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Últimas transações</Text>
            <Pressable
              onPress={() => router.push("/history")}
              hitSlop={8}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>Ver tudo</Text>
            </Pressable>
          </View>
          {!ready ? (
            <View style={styles.skeletonList}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[styles.skeleton, { backgroundColor: colors.muted }]}
                />
              ))}
            </View>
          ) : recent.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="Nenhuma transação ainda"
              description="Use os botões acima para adicionar uma entrada ou gasto."
            />
          ) : (
            <View style={[styles.cardWrap, { backgroundColor: colors.card, borderColor: colors.border, paddingVertical: 4 }]}>
              {recent.map((t, idx) => {
                const cat = categories.find((c) => c.id === t.categoryId);
                return (
                  <View key={`rec-${t.id}`}>
                    <View style={{ paddingHorizontal: 12 }}>
                      <TransactionItem
                        transaction={t}
                        category={cat}
                        onPress={() =>
                          router.push({ pathname: "/transaction/[id]", params: { id: t.id } })
                        }
                      />
                    </View>
                    {idx < recent.length - 1 ? (
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  brand: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginTop: -2,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  periodContainer: {
    marginBottom: 16,
  },
  summaryContainer: {
    marginTop: 10,
    marginBottom: 16,
    zIndex: 1,
    // Sombra sutil para o efeito de flutuação
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  section: {
    marginTop: 10,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  linkText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  cardWrap: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  skeletonList: { gap: 8 },
  skeleton: {
    height: 60,
    borderRadius: 14,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
});
