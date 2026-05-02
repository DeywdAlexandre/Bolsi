import React, { useMemo, useState } from "react";
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View, Modal, StatusBar } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/lib/format";

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, goalDeposits, addGoalDeposit, removeGoal } = useAppData();

  const [isDepositModalVisible, setDepositModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [createTx, setCreateTx] = useState(true);

  const goal = useMemo(() => goals.find((g) => g.id === id), [goals, id]);
  const deposits = useMemo(() => goalDeposits.filter((d) => d.goalId === id).sort((a, b) => b.date.localeCompare(a.date)), [goalDeposits, id]);

  if (!goal) return null;

  const isHabit = goal.type === "monthly_habit";

  const stats = useMemo(() => {
    const i = (goal.estimatedYield || 0) / 100;
    const pv = goal.currentAmount || 0;
    const pmt = goal.monthlyAmount || 0;

    const totalOutFromPocket = deposits.filter(d => d.type === "deposit").reduce((acc, d) => acc + d.amount, 0);
    const totalYieldEarned = deposits.filter(d => d.type === "yield").reduce((acc, d) => acc + d.amount, 0);
    const monthsActive = deposits.length > 0 ? Math.ceil((new Date().getTime() - new Date(deposits[deposits.length-1].date).getTime()) / (1000 * 60 * 60 * 24 * 30.44)) : 0;

    const calcFV = (n: number) => {
      if (i <= 0) return pv + (pmt * n);
      return pv * Math.pow(1 + i, n) + pmt * (Math.pow(1 + i, n) - 1) / i;
    };

    if (goal.type === "target_value") {
      const now = new Date();
      const targetDate = new Date(goal.targetDate || "");
      const diffTime = targetDate.getTime() - now.getTime();
      const remainingMonths = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)));
      const fv = goal.targetAmount || 0;
      
      let suggestedDeposit = 0;
      if (i > 0) {
        const pvFuture = pv * Math.pow(1 + i, remainingMonths);
        suggestedDeposit = Math.max(0, (fv - pvFuture) * i / (Math.pow(1 + i, remainingMonths) - 1));
      } else {
        suggestedDeposit = Math.max(0, fv - pv) / remainingMonths;
      }

      return { totalOutFromPocket, totalYieldEarned, monthsActive, suggestedDeposit, remainingMonths, progress: pv / (fv || 1) };
    } else {
      return {
        totalOutFromPocket,
        totalYieldEarned,
        monthsActive,
        projection1y: calcFV(12),
        projection2y: calcFV(24),
        projection5y: calcFV(60),
        projection10y: calcFV(120),
      };
    }
  }, [goal, deposits]);

  const handleAddDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return Alert.alert("Ops!", "Valor inválido.");
    await addGoalDeposit({ goalId: goal.id, amount, date: new Date().toISOString(), type: "deposit", createTransaction: createTx });
    setDepositModalVisible(false);
    setDepositAmount("");
  };

  const handleDelete = () => {
    Alert.alert("Excluir Meta", "Deseja realmente apagar esta meta?", [{ text: "Não" }, { text: "Sim, excluir", style: "destructive", onPress: () => { removeGoal(goal.id); router.back(); } }]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Header Customizado Imersivo */}
      <View style={[styles.topCard, { backgroundColor: goal.color, paddingTop: insets.top }]}>
        
        {/* Barra de Ações Superior */}
        <View style={styles.actionHeader}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.iconBtn}>
            <Feather name="trash-2" size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <Text style={styles.headerIcon}>{goal.icon}</Text>
          </View>
          <Text style={styles.headerTitle}>{goal.name}</Text>
          <View style={styles.yieldBadge}>
            <Feather name="trending-up" size={10} color="#fff" />
            <Text style={styles.yieldBadgeText}>{goal.estimatedYield.toFixed(2)}% am</Text>
          </View>
        </View>

        {!isHabit && (
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <View style={[styles.progressFill, { backgroundColor: "#fff", width: `${Math.min(1, (stats as any).progress) * 100}%` }]} />
            </View>
            <Text style={styles.progressPct}>{Math.round(Math.min(1, (stats as any).progress) * 100)}% concluído</Text>
          </View>
        )}

        <View style={styles.mainBalance}>
          <Text style={styles.balanceLabel}>SALDO ESPERADO NA CONTA</Text>
          <Text style={styles.balanceValue}>{formatCurrency(goal.currentAmount)}</Text>
        </View>
      </View>

      <FlatList
        data={deposits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.intelligenceSection}>
            
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.summaryIndicator, { backgroundColor: colors.primary }]} />
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Meus Aportes</Text>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatCurrency(stats.totalOutFromPocket)}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.summaryIndicator, { backgroundColor: colors.income }]} />
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Rendimentos</Text>
                <Text style={[styles.summaryValue, { color: colors.income }]}>+ {formatCurrency(stats.totalYieldEarned)}</Text>
              </View>
            </View>

            {isHabit ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Feather name="bar-chart-2" size={16} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.primary }]}>Projeção com Rendimentos</Text>
                </View>
                <View style={styles.projectionGrid}>
                  <ProjectionItem label="Daqui a 1 ano" value={(stats as any).projection1y} color={colors.foreground} />
                  <ProjectionItem label="Daqui a 2 anos" value={(stats as any).projection2y} color={colors.foreground} isBold />
                  <ProjectionItem label="Daqui a 5 anos" value={(stats as any).projection5y} color={colors.primary} />
                  <ProjectionItem label="Daqui a 10 anos" value={(stats as any).projection10y} color={colors.income} isLarge />
                </View>
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Feather name="zap" size={16} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.primary }]}>Ajuste Automático</Text>
                </View>
                <Text style={[styles.cardDesc, { color: colors.foreground }]}>Para o objetivo de {formatCurrency(goal.targetAmount || 0)}:</Text>
                <Text style={[styles.suggestedAmount, { color: colors.primary }]}>{formatCurrency((stats as any).suggestedDeposit)}/mês</Text>
                <Text style={[styles.remainingText, { color: colors.mutedForeground }]}>Prazo restante: {(stats as any).remainingMonths} meses</Text>
              </View>
            )}

            <Text style={[styles.historyTitle, { color: colors.foreground }]}>Atividade da Meta</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.depositRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.depositIcon, { backgroundColor: item.type === "yield" ? colors.income + "15" : colors.primary + "15" }]}>
              <Feather name={item.type === "yield" ? "trending-up" : "arrow-down"} size={14} color={item.type === "yield" ? colors.income : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.depositDate, { color: colors.mutedForeground }]}>{new Date(item.date).toLocaleDateString("pt-BR")}</Text>
              <Text style={[styles.depositNote, { color: colors.foreground }]}>{item.type === "yield" ? "Rendimento do Banco" : "Depósito Realizado"}</Text>
            </View>
            <Text style={[styles.depositAmount, { color: item.type === "yield" ? colors.income : colors.foreground }]}>
              {item.type === "yield" ? "+" : ""} {formatCurrency(item.amount)}
            </Text>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable onPress={() => setDepositModalVisible(true)} style={[styles.depositBtn, { backgroundColor: colors.primary }]}>
          <Feather name="plus" size={20} color={colors.primaryForeground} />
          <Text style={[styles.depositBtnText, { color: colors.primaryForeground }]}>Novo Aporte</Text>
        </Pressable>
      </View>

      <Modal visible={isDepositModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Quanto vai guardar?</Text>
              <Pressable onPress={() => setDepositModalVisible(false)}><Feather name="x" size={24} color={colors.mutedForeground} /></Pressable>
            </View>
            <TextInput autoFocus value={depositAmount} onChangeText={setDepositAmount} placeholder="R$ 0,00" keyboardType="numeric" style={[styles.modalInput, { color: colors.foreground, borderBottomColor: colors.primary }]} />
            <Pressable onPress={() => setCreateTx(!createTx)} style={styles.txToggle}>
              <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: createTx ? colors.primary : "transparent" }]}>
                {createTx && <Feather name="check" size={12} color="#fff" />}
              </View>
              <Text style={[styles.txLabel, { color: colors.foreground }]}>Debitar do meu extrato principal</Text>
            </Pressable>
            <Pressable onPress={handleAddDeposit} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.modalBtnText, { color: colors.primaryForeground }]}>Confirmar Aporte</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ProjectionItem({ label, value, color, isBold, isLarge }: any) {
  return (
    <View style={styles.projectionItem}>
      <Text style={[styles.projLabel, { color: "#64748B" }]}>{label}</Text>
      <Text style={[styles.projValue, { color, fontFamily: isBold || isLarge ? "Inter_700Bold" : "Inter_600SemiBold", fontSize: isLarge ? 17 : 14 }]}>
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topCard: { paddingHorizontal: 20, paddingBottom: 40, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  actionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", height: 50, marginBottom: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.1)" },
  headerContent: { alignItems: "center", marginBottom: 20 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  headerIcon: { fontSize: 36 },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center" },
  yieldBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.2)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 10 },
  yieldBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  progressSection: { width: "100%", alignItems: "center", marginBottom: 25 },
  progressBar: { width: "80%", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", borderRadius: 3 },
  progressPct: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff", opacity: 0.9 },
  mainBalance: { alignItems: "center" },
  balanceLabel: { fontSize: 10, fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.8)", letterSpacing: 1.5 },
  balanceValue: { fontSize: 38, fontFamily: "Inter_700Bold", color: "#fff", marginTop: 4 },
  intelligenceSection: { marginTop: -25, marginBottom: 20, gap: 16 },
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 24, borderWidth: 1, position: "relative", overflow: "hidden" },
  summaryLabel: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase", marginBottom: 6 },
  summaryValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  summaryIndicator: { position: "absolute", top: 0, left: 0, width: 4, height: "100%" },
  card: { padding: 20, borderRadius: 24, borderWidth: 1 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 15 },
  cardTitle: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  cardDesc: { fontSize: 13, marginBottom: 10 },
  projectionGrid: { gap: 12 },
  projectionItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  projLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  projValue: { fontSize: 14 },
  suggestedAmount: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 6 },
  remainingText: { fontSize: 12, opacity: 0.7 },
  historyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 20, marginBottom: 10 },
  depositRow: { flexDirection: "row", alignItems: "center", gap: 15, paddingVertical: 16, borderBottomWidth: 1 },
  depositIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  depositDate: { fontSize: 11, fontFamily: "Inter_500Medium" },
  depositNote: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  depositAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20 },
  depositBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  depositBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalInput: { fontSize: 36, fontFamily: "Inter_700Bold", textAlign: "center", paddingVertical: 15, borderBottomWidth: 2, marginBottom: 25 },
  txToggle: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 30 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  txLabel: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  modalBtn: { paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  modalBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
