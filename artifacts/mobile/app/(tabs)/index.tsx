import { Feather, Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryIcon } from "@/components/CategoryIcon";
import { TransactionItem } from "@/components/TransactionItem";
import { useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/lib/format";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, categories, recurring, goals, ready } = useAppData();
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const stats = useMemo(() => {
    const balance = transactions.reduce(
      (acc, t) => acc + (t.type === "income" ? t.amount : -t.amount),
      0
    );
    const saved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);

    return { balance, saved, income, expenses };
  }, [transactions, goals]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const topPadding = Platform.OS === "web" ? 20 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPadding + 10, backgroundColor: colors.primary },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text
              style={[styles.greeting, { color: colors.primaryForeground }]}
            >
              Olá, Deywd
            </Text>
            <Text style={[styles.date, { color: colors.primaryForeground }]}>
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/settings")}
            style={[
              styles.settingsBtn,
              { backgroundColor: "rgba(255,255,255,0.2)" },
            ]}
          >
            <Feather name="settings" size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.balanceContainer}>
          <View>
            <View style={styles.balanceHeader}>
              <Text style={[styles.balanceLabel, { color: "#fff" }]}>
                Saldo Disponível
              </Text>
              <Pressable onPress={() => setShowBalance(!showBalance)}>
                <Feather
                  name={showBalance ? "eye" : "eye-off"}
                  size={16}
                  color="#fff"
                />
              </Pressable>
            </View>
            <Text style={[styles.balanceValue, { color: "#fff" }]}>
              {showBalance ? formatCurrency(stats.balance) : "••••••"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Widget de Patrimônio Guardado (Metas) */}
        <View style={styles.quickAccess}>
          <Pressable 
            onPress={() => router.push("/(tabs)/goals")}
            style={[styles.savedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.savedIcon, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="flag" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.savedLabel, { color: colors.mutedForeground }]}>Total Guardado</Text>
              <Text style={[styles.savedValue, { color: colors.foreground }]}>
                {showBalance ? formatCurrency(stats.saved) : "••••••"}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={styles.shortcuts}>
          <Shortcut
            icon="plus-circle"
            label="Gasto"
            onPress={() => router.push("/transactions/new?type=expense")}
          />
          <Shortcut
            icon="arrow-up-circle"
            label="Ganho"
            onPress={() => router.push("/transactions/new?type=income")}
          />
          <Shortcut
            icon="repeat"
            label="Fixos"
            onPress={() => router.push("/recurring")}
          />
          <Shortcut
            icon="briefcase"
            label="Emprést."
            onPress={() => router.push("/(tabs)/loans")}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Atividade Recente
            </Text>
            <Pressable onPress={() => router.push("/history")}>
              <Text style={[styles.seeMore, { color: colors.primary }]}>
                Ver tudo
              </Text>
            </Pressable>
          </View>

          <View style={styles.transactionsList}>
            {recentTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
            {recentTransactions.length === 0 && (
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                Nenhuma transação este mês.
              </Text>
            )}
          </View>
        </View>

        {/* Preview de Metas em Destaque */}
        {goals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12, paddingHorizontal: 20 }]}>
              Meus Sonhos
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {goals.slice(0, 3).map(goal => (
                <Pressable 
                  key={goal.id}
                  onPress={() => router.push({ pathname: "/goals/[id]", params: { id: goal.id } })}
                  style={[styles.goalPreview, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Text style={{ fontSize: 24, marginBottom: 8 }}>{goal.icon}</Text>
                  <Text style={[styles.goalPreviewName, { color: colors.foreground }]} numberOfLines={1}>{goal.name}</Text>
                  <Text style={[styles.goalPreviewAmount, { color: colors.primary }]}>{formatCurrency(goal.currentAmount)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push("/transactions/new")}
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <Feather name="plus" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}

function Shortcut({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={styles.shortcut}>
      <View style={[styles.shortcutIcon, { backgroundColor: colors.card }]}>
        <Feather name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={[styles.shortcutLabel, { color: colors.foreground }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  greeting: { fontSize: 14, fontFamily: "Inter_500Medium", opacity: 0.8 },
  date: { fontSize: 18, fontFamily: "Inter_700Bold" },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceContainer: { marginTop: 10 },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
  },
  balanceLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", opacity: 0.9 },
  balanceValue: { fontSize: 32, fontFamily: "Inter_700Bold" },
  quickAccess: {
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
  },
  savedCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  savedIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  savedLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  savedValue: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 2 },
  shortcuts: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  shortcut: { alignItems: "center", gap: 8 },
  shortcutIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  shortcutLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  section: { marginBottom: 30 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seeMore: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  transactionsList: { paddingHorizontal: 20, gap: 12 },
  emptyText: { textAlign: "center", marginTop: 20, fontSize: 14 },
  goalPreview: {
    width: 130,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  goalPreviewName: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  goalPreviewAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
});
