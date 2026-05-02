import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/lib/format";
import type { GoalType } from "@/lib/types";

const EMOJIS = ["💰", "🚗", "🏠", "✈️", "💍", "🎓", "🎮", "🎸", "📱", "🏖️", "👶", "🚲"];
const COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#64748B"];

const RATES = {
  none: 0,
  poupanca: 0.005, 
  cdi_100: 0.009, 
};

export default function NewGoalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addGoal } = useAppData();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [type, setType] = useState<GoalType>("target_value");
  
  const [targetAmount, setTargetAmount] = useState("");
  const [months, setMonths] = useState("12");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  
  const [rateKey, setRateKey] = useState<keyof typeof RATES | "custom_cdi">("cdi_100");
  const [cdiPercentage, setCdiPercentage] = useState("100");

  const i = useMemo(() => {
    if (rateKey === "custom_cdi") {
      const pct = parseFloat(cdiPercentage) || 0;
      return (pct / 100) * RATES.cdi_100;
    }
    if (rateKey === "none") return 0;
    if (rateKey === "poupanca") return RATES.poupanca;
    return RATES.cdi_100;
  }, [rateKey, cdiPercentage]);

  const fv = parseFloat(targetAmount) || 0;
  const pmt = parseFloat(monthlyAmount) || 0;
  const n = parseInt(months) || 1;

  const simulation = useMemo(() => {
    if (type === "target_value") {
      const simple = fv / n;
      const compound = i > 0 ? (fv * i) / (Math.pow(1 + i, n) - 1) : simple;
      const saved = (simple - compound) * n;
      return { simple, compound, saved };
    } else {
      const simple = pmt * n;
      const compound = i > 0 ? (pmt * (Math.pow(1 + i, n) - 1)) / i : simple;
      const profit = compound - simple;
      return { simple, compound, profit };
    }
  }, [type, fv, n, pmt, i]);

  const handleSave = async () => {
    // VALIDAÇÃO RIGOROSA
    if (!name.trim()) {
      return Alert.alert("Campo Obrigatório", "Por favor, dê um nome para o seu sonho.");
    }
    
    if (type === "target_value") {
      if (fv <= 0) return Alert.alert("Valor Inválido", "Quanto você deseja atingir com essa meta?");
      if (n <= 0) return Alert.alert("Prazo Inválido", "Em quantos meses você pretende chegar lá?");
    } else {
      if (pmt <= 0) return Alert.alert("Valor Inválido", "Quanto você pretende guardar todos os meses?");
      if (n <= 0) return Alert.alert("Prazo Inválido", "Defina um tempo para a simulação de futuro.");
    }

    if (rateKey === "custom_cdi" && (parseFloat(cdiPercentage) || 0) <= 0) {
      return Alert.alert("Rendimento", "Informe a porcentagem do CDI ou escolha outra opção.");
    }

    await addGoal({
      name: name.trim(),
      type,
      targetAmount: type === "target_value" ? fv : undefined,
      monthlyAmount: type === "monthly_habit" ? pmt : undefined,
      targetDate: new Date(new Date().setMonth(new Date().getMonth() + n)).toISOString(),
      icon,
      color,
      isYielding: rateKey !== "none",
      estimatedYield: i * 100,
    });

    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Nova Meta", headerTransparent: true, headerTintColor: colors.foreground }} />
      
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: 60, paddingHorizontal: 20 }}>
        
        <View style={styles.section}>
          <View style={[styles.mainIcon, { backgroundColor: color + "15", borderColor: color }]}>
            <Text style={{ fontSize: 40 }}>{icon}</Text>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex: Viagem, Carro novo..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.nameInput, { color: colors.foreground, borderBottomColor: colors.border }]}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiList}>
          {EMOJIS.map(e => (
            <Pressable key={e} onPress={() => setIcon(e)} style={[styles.emojiBtn, icon === e && { backgroundColor: colors.muted }]}>
              <Text style={{ fontSize: 24 }}>{e}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.colorList}>
          {COLORS.map(c => (
            <Pressable key={c} onPress={() => setColor(c)} style={[styles.colorBtn, { backgroundColor: c }, color === c && { borderWidth: 3, borderColor: colors.foreground }]} />
          ))}
        </View>

        <View style={[styles.typeToggle, { backgroundColor: colors.muted }]}>
          <Pressable onPress={() => setType("target_value")} style={[styles.typeBtn, type === "target_value" && { backgroundColor: colors.card }]}>
            <Text style={[styles.typeText, { color: type === "target_value" ? colors.foreground : colors.mutedForeground }]}>Valor Alvo</Text>
          </Pressable>
          <Pressable onPress={() => setType("monthly_habit")} style={[styles.typeBtn, type === "monthly_habit" && { backgroundColor: colors.card }]}>
            <Text style={[styles.typeText, { color: type === "monthly_habit" ? colors.foreground : colors.mutedForeground }]}>Hábito Mensal</Text>
          </Pressable>
        </View>

        <View style={styles.inputSection}>
          {type === "target_value" ? (
            <>
              <Field label="Quanto você quer atingir?">
                <TextInput value={targetAmount} onChangeText={setTargetAmount} placeholder="R$ 0,00" keyboardType="numeric" style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]} />
              </Field>
              <Field label="Em quantos meses?">
                <View style={styles.monthsRow}>
                  <TextInput value={months} onChangeText={setMonths} keyboardType="numeric" style={[styles.input, { flex: 1, backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]} />
                  <Text style={{ color: colors.mutedForeground, marginLeft: 10 }}>meses</Text>
                </View>
              </Field>
            </>
          ) : (
            <>
              <Field label="Quanto vai guardar por mês?">
                <TextInput value={monthlyAmount} onChangeText={setMonthlyAmount} placeholder="R$ 0,00" keyboardType="numeric" style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]} />
              </Field>
              <Field label="Simular por quanto tempo?">
                <View style={styles.monthsRow}>
                  <TextInput value={months} onChangeText={setMonths} keyboardType="numeric" style={[styles.input, { flex: 1, backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]} />
                  <Text style={{ color: colors.mutedForeground, marginLeft: 10 }}>meses</Text>
                </View>
              </Field>
            </>
          )}
        </View>

        <Field label="Onde esse dinheiro vai ficar?">
          <View style={styles.ratesGrid}>
            {[
              { id: "none", label: "Colchão", sub: "0%" },
              { id: "poupanca", label: "Poupança", sub: "0.5% am" },
              { id: "cdi_100", label: "100% CDI", sub: "0.9% am" },
              { id: "custom_cdi", label: "Custom CDI", sub: cdiPercentage + "%" },
            ].map(r => (
              <Pressable 
                key={r.id} 
                onPress={() => setRateKey(r.id as any)}
                style={[
                  styles.rateBtn, 
                  { backgroundColor: colors.card, borderColor: rateKey === r.id ? colors.primary : colors.border }
                ]}
              >
                <Text style={[styles.rateLabel, { color: rateKey === r.id ? colors.primary : colors.foreground }]}>{r.label}</Text>
                <Text style={styles.rateSub}>{r.sub}</Text>
              </Pressable>
            ))}
          </View>
          
          {rateKey === "custom_cdi" && (
            <View style={[styles.customRateInput, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <Text style={[styles.customRateLabel, { color: colors.foreground }]}>Porcentagem do CDI:</Text>
              <View style={styles.customRateRow}>
                <TextInput
                  value={cdiPercentage}
                  onChangeText={setCdiPercentage}
                  keyboardType="numeric"
                  style={[styles.input, { flex: 1, borderColor: colors.border }]}
                />
                <Text style={[styles.customRateUnit, { color: colors.foreground }]}>%</Text>
              </View>
            </View>
          )}
        </Field>

        {(fv > 0 || pmt > 0) && (
          <View style={[styles.simBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <View style={styles.simHeader}>
              <Feather name="zap" size={16} color={colors.primary} />
              <Text style={[styles.simTitle, { color: colors.primary }]}>Simulação Inteligente</Text>
            </View>
            {type === "target_value" ? (
              <>
                <Text style={[styles.simMain, { color: colors.foreground }]}>Depósito: <Text style={{ fontFamily: "Inter_700Bold" }}>{formatCurrency(simulation.compound)}/mês</Text></Text>
                <Text style={[styles.simDetail, { color: colors.mutedForeground }]}>Sem rendimento: {formatCurrency(simulation.simple)}/mês</Text>
                {simulation.saved > 0 && (
                  <View style={styles.profitBadge}><Text style={styles.profitText}>Juros pagam {formatCurrency(simulation.saved)} para você</Text></View>
                )}
              </>
            ) : (
              <>
                <Text style={[styles.simMain, { color: colors.foreground }]}>Total em {n} meses: <Text style={{ fontFamily: "Inter_700Bold" }}>{formatCurrency(simulation.compound)}</Text></Text>
                <Text style={[styles.simDetail, { color: colors.mutedForeground }]}>Seu esforço: {formatCurrency(simulation.simple)} · Juros ganhos: {formatCurrency(simulation.profit)}</Text>
              </>
            )}
          </View>
        )}

        <Pressable onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Confirmar e Criar</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { alignItems: "center", marginBottom: 20 },
  mainIcon: { width: 100, height: 100, borderRadius: 30, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 15 },
  nameInput: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center", width: "100%", borderBottomWidth: 1, paddingBottom: 5 },
  emojiList: { marginBottom: 15 },
  emojiBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginHorizontal: 4 },
  colorList: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 25 },
  colorBtn: { width: 30, height: 30, borderRadius: 15 },
  typeToggle: { flexDirection: "row", padding: 4, borderRadius: 12, marginBottom: 20 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  typeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inputSection: { gap: 16, marginBottom: 20 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase" },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  monthsRow: { flexDirection: "row", alignItems: "center" },
  ratesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  rateBtn: { flex: 1, minWidth: "45%", borderWidth: 1, borderRadius: 12, padding: 12 },
  rateLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  rateSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  customRateInput: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 12, marginBottom: 20 },
  customRateLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  customRateRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  customRateUnit: { fontSize: 20, fontFamily: "Inter_700Bold" },
  simBox: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 25 },
  simHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  simTitle: { fontSize: 13, fontFamily: "Inter_700Bold", textTransform: "uppercase" },
  simMain: { fontSize: 16, marginBottom: 4 },
  simDetail: { fontSize: 12 },
  profitBadge: { backgroundColor: "#22C55E20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start", marginTop: 10 },
  profitText: { color: "#16A34A", fontSize: 11, fontFamily: "Inter_700Bold" },
  saveBtn: { paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
