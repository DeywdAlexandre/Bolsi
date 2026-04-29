import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";

import { useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";
import { formatDate, todayIso } from "@/lib/format";

const OIL_EXPENSE_CATEGORY = "cat_transport";
const DEFAULT_INTERVAL_KM = 5000;

function parseDecimal(s: string): number {
  if (!s) return 0;
  const cleaned = s
    .replace(/\s/g, "")
    .replace(/[^\d,.\-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : 0;
}

function formatDecimal(n: number): string {
  if (!isFinite(n) || n === 0) return "";
  return n.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
}

export default function OilChangeFormScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ id: string; vehicleId?: string }>();
  const isNew = params.id === "new";

  const {
    vehicles,
    oilChanges,
    addOilChange,
    updateOilChange,
    removeOilChange,
    addTransaction,
    updateTransaction,
    removeTransaction,
    transactions,
    categories,
  } = useAppData();

  const editing = useMemo(
    () => (!isNew ? oilChanges.find((o) => o.id === params.id) : null),
    [oilChanges, params.id, isNew],
  );

  const initialVehicleId =
    editing?.vehicleId ?? params.vehicleId ?? vehicles[0]?.id ?? "";

  const [vehicleId, setVehicleId] = useState<string>(initialVehicleId);
  const [date, setDate] = useState<string>(editing?.date ?? todayIso());
  const [odoStr, setOdoStr] = useState<string>(
    editing ? String(editing.odometer) : "",
  );
  const [intervalStr, setIntervalStr] = useState<string>(
    editing
      ? String(Math.max(editing.nextChangeKm - editing.odometer, 0))
      : String(DEFAULT_INTERVAL_KM),
  );
  const [costStr, setCostStr] = useState<string>(
    editing?.cost ? formatDecimal(editing.cost) : "",
  );
  const [notes, setNotes] = useState<string>(editing?.notes ?? "");
  const [createExpense, setCreateExpense] = useState<boolean>(
    editing ? !!editing.expenseTransactionId : false,
  );

  const shiftDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString());
  };

  const handleSubmit = async () => {
    if (!vehicleId) {
      Alert.alert("Veículo", "Selecione um veículo.");
      return;
    }
    const odo = parseInt(odoStr.replace(/\D/g, ""), 10);
    if (!isFinite(odo) || odo <= 0) {
      Alert.alert("Quilometragem", "Informe a quilometragem atual.");
      return;
    }
    const interval = parseInt(intervalStr.replace(/\D/g, ""), 10);
    if (!isFinite(interval) || interval <= 0) {
      Alert.alert("Próxima troca", "Informe em quantos km será a próxima troca.");
      return;
    }
    const cost = parseDecimal(costStr);

    const vehicle = vehicles.find((v) => v.id === vehicleId);
    const vehicleName = vehicle?.name ?? "Veículo";
    const description = `Troca de óleo · ${vehicleName}`;
    const cat =
      categories.find((c) => c.id === OIL_EXPENSE_CATEGORY)?.id ??
      categories.find((c) => c.type === "expense")?.id ??
      OIL_EXPENSE_CATEGORY;

    let expenseTransactionId: string | undefined =
      editing?.expenseTransactionId;

    if (createExpense && cost > 0) {
      if (
        expenseTransactionId &&
        transactions.some((t) => t.id === expenseTransactionId)
      ) {
        await updateTransaction(expenseTransactionId, {
          amount: cost,
          description,
          date,
          categoryId: cat,
          type: "expense",
        });
      } else {
        const tx = await addTransaction({
          type: "expense",
          amount: cost,
          categoryId: cat,
          description,
          date,
        });
        expenseTransactionId = tx.id;
      }
    } else {
      if (
        expenseTransactionId &&
        transactions.some((t) => t.id === expenseTransactionId)
      ) {
        await removeTransaction(expenseTransactionId);
      }
      expenseTransactionId = undefined;
    }

    const payload = {
      vehicleId,
      date,
      odometer: odo,
      nextChangeKm: odo + interval,
      cost: cost > 0 ? cost : undefined,
      notes: notes.trim() || undefined,
      expenseTransactionId,
    };

    if (editing) {
      await updateOilChange(editing.id, payload);
    } else {
      await addOilChange(payload);
    }
    router.back();
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert(
      "Excluir troca de óleo",
      "Tem certeza? Se houver gasto vinculado, ele também será excluído.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            if (
              editing.expenseTransactionId &&
              transactions.some((t) => t.id === editing.expenseTransactionId)
            ) {
              await removeTransaction(editing.expenseTransactionId);
            }
            await removeOilChange(editing.id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen
        options={{ title: isNew ? "Nova troca de óleo" : "Editar troca de óleo" }}
      />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Veículo">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {vehicles.map((v) => {
              const active = vehicleId === v.id;
              return (
                <Pressable
                  key={v.id}
                  onPress={() => setVehicleId(v.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? colors.primaryForeground : colors.foreground,
                      fontFamily: active ? "Inter_700Bold" : "Inter_500Medium",
                      fontSize: 13,
                    }}
                  >
                    {v.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Field>

        <Field label="Quilometragem na troca (km)">
          <TextInput
            value={odoStr}
            onChangeText={(t) => setOdoStr(t.replace(/\D/g, ""))}
            placeholder="Ex: 45230"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
            ]}
          />
        </Field>

        <Field label="Trocar de novo após (km)">
          <TextInput
            value={intervalStr}
            onChangeText={(t) => setIntervalStr(t.replace(/\D/g, ""))}
            placeholder="5000"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
            ]}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[3000, 5000, 7500, 10000].map((km) => (
              <Pressable
                key={km}
                onPress={() => setIntervalStr(String(km))}
                style={[styles.quickBtn, { backgroundColor: colors.muted }]}
              >
                <Text
                  style={{ color: colors.foreground, fontFamily: "Inter_500Medium", fontSize: 12 }}
                >
                  {(km / 1000).toString().replace(".", ",")}k
                </Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Custo (R$)">
          <TextInput
            value={costStr}
            onChangeText={setCostStr}
            placeholder="0,00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
            ]}
          />
        </Field>

        <Field label="Data">
          <View style={[styles.dateRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable onPress={() => shiftDate(-1)} hitSlop={8} style={styles.dateBtn}>
              <Feather name="chevron-left" size={20} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.dateLabel, { color: colors.foreground }]}>{formatDate(date)}</Text>
            <Pressable onPress={() => shiftDate(1)} hitSlop={8} style={styles.dateBtn}>
              <Feather name="chevron-right" size={20} color={colors.foreground} />
            </Pressable>
          </View>
        </Field>

        <Field label="Observações (opcional)">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Marca do óleo, oficina, etc"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
            ]}
          />
        </Field>

        <View
          style={[
            styles.toggleRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
              Gerar gasto vinculado
            </Text>
            <Text
              style={{
                color: colors.mutedForeground,
                fontFamily: "Inter_500Medium",
                fontSize: 12,
                marginTop: 2,
              }}
            >
              Requer custo preenchido
            </Text>
          </View>
          <Switch
            value={createExpense}
            onValueChange={setCreateExpense}
            trackColor={{ false: colors.muted, true: colors.primary + "55" }}
            thumbColor={createExpense ? colors.primary : "#777"}
          />
        </View>

        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.submit,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
            {editing ? "Salvar" : "Adicionar"}
          </Text>
        </Pressable>

        {editing ? (
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.delete, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
            <Text style={[styles.deleteText, { color: colors.destructive }]}>Excluir</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </>
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
  container: { padding: 20, paddingBottom: 60, gap: 18 },
  field: { gap: 10 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  dateBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  dateLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  submit: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  delete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  deleteText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
