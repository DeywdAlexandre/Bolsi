import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { IconCircle } from "@/components/IconCircle";
import { useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/lib/format";

export default function RecurringScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { recurring, categories, updateRecurring } = useAppData();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const sorted = [...recurring].sort((a, b) => a.dayOfMonth - b.dayOfMonth);
  const incomes = sorted.filter((r) => r.type === "income");
  const expenses = sorted.filter((r) => r.type === "expense");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBackground, { backgroundColor: colors.primary, height: topPad + 110 }]} />
      
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View>
          <Text style={[styles.title, { color: colors.primaryForeground }]}>Fixos</Text>
          <Text style={[styles.subtitle, { color: colors.primaryForeground + "cc" }]}>
            Lançamentos mensais automáticos
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/recurring/new")}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.primaryForeground + "22", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="plus" size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {sorted.length === 0 ? (
          <View style={{ paddingTop: 40 }}>
            <EmptyState
              icon="repeat"
              title="Sem recorrências"
              description="Cadastre aluguel, assinaturas, salário e outras transações que se repetem todo mês."
            />
          </View>
        ) : (
          <>
            {expenses.length > 0 ? (
              <Section title="Gastos fixos">
                {expenses.map((r) => (
                  <RecurringRow
                    key={r.id}
                    recurring={r}
                    category={categories.find((c) => c.id === r.categoryId)}
                    onToggle={(active) => void updateRecurring(r.id, { active })}
                    onPress={() =>
                      router.push({ pathname: "/recurring/[id]", params: { id: r.id } })
                    }
                  />
                ))}
              </Section>
            ) : null}
            {incomes.length > 0 ? (
              <Section title="Entradas fixas">
                {incomes.map((r) => (
                  <RecurringRow
                    key={r.id}
                    recurring={r}
                    category={categories.find((c) => c.id === r.categoryId)}
                    onToggle={(active) => void updateRecurring(r.id, { active })}
                    onPress={() =>
                      router.push({ pathname: "/recurring/[id]", params: { id: r.id } })
                    }
                  />
                ))}
              </Section>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function RecurringRow({
  recurring,
  category,
  onToggle,
  onPress,
}: {
  recurring: import("@/lib/types").Recurring;
  category: import("@/lib/types").Category | undefined;
  onToggle: (active: boolean) => void;
  onPress: () => void;
}) {
  const colors = useColors();
  const isIncome = recurring.type === "income";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <IconCircle
        name={category?.icon ?? "repeat"}
        color={category?.color ?? colors.mutedForeground}
        size={42}
      />
      <View style={styles.rowMiddle}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={1}>
          {recurring.description || category?.name || "Recorrente"}
        </Text>
        <Text style={[styles.rowSub, { color: colors.mutedForeground }]} numberOfLines={1}>
          Todo dia {recurring.dayOfMonth} · {category?.name ?? "—"}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text
          style={[
            styles.rowAmount,
            { color: isIncome ? colors.income : colors.foreground },
          ]}
        >
          {isIncome ? "+" : "-"} {formatCurrency(recurring.amount)}
        </Text>
        <Switch
          value={recurring.active}
          onValueChange={onToggle}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={Platform.OS === "android" ? colors.background : undefined}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowMiddle: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  rowSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  rowAmount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
