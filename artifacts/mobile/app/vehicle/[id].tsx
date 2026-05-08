import React, { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";

import { EmptyState } from "@/components/EmptyState";
import { IconCircle } from "@/components/IconCircle";
import { useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  computeVehicleStats,
  formatKm,
  formatKmPerLiter,
  formatLiters,
  FUEL_TYPE_LABELS,
} from "@/lib/vehicleStats";
import type { Fueling, OilChange, Vehicle, VehicleExpense } from "@/lib/types";

type Entry =
  | { kind: "fueling"; data: Fueling }
  | { kind: "oilchange"; data: OilChange }
  | { kind: "vehicleexpense"; data: VehicleExpense };

export default function VehicleDetailScreen() {
  const colors = useColors();
  const [extraModalVisible, setExtraModalVisible] = React.useState(false);
  const [extraDesc, setExtraDesc] = React.useState("");
  const [extraAmount, setExtraAmount] = React.useState("");
  const [extraOdo, setExtraOdo] = React.useState("");
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    vehicles,
    fuelings,
    oilChanges,
    vehicleExpenses,
    removeVehicle,
    removeFueling,
    removeOilChange,
    addVehicleExpense,
    removeVehicleExpense,
    transactions,
    removeTransaction,
  } = useAppData();

  const vehicle = useMemo(
    () => vehicles.find((v) => v.id === id),
    [vehicles, id],
  );

  const stats = useMemo(
    () =>
      vehicle ? computeVehicleStats(vehicle, fuelings, oilChanges, vehicleExpenses) : null,
    [vehicle, fuelings, oilChanges, vehicleExpenses],
  );

  const entries: Entry[] = useMemo(() => {
    if (!vehicle) return [];
    const fs: Entry[] = fuelings
      .filter((f) => f.vehicleId === vehicle.id)
      .map((f) => ({ kind: "fueling" as const, data: f }));
    const os: Entry[] = oilChanges
      .filter((o) => o.vehicleId === vehicle.id)
      .map((o) => ({ kind: "oilchange" as const, data: o }));
    const vexs: Entry[] = vehicleExpenses
      .filter((v) => v.vehicleId === vehicle.id)
      .map((v) => ({ kind: "vehicleexpense" as const, data: v }));
    return [...fs, ...os, ...vexs].sort(
      (a, b) =>
        new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
    );
  }, [vehicle, fuelings, oilChanges, vehicleExpenses]);

  if (!vehicle || !stats) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: colors.mutedForeground }}>Veículo não encontrado</Text>
      </View>
    );
  }

  const accent = vehicle.color || colors.primary;

  const handleDeleteVehicle = () => {
    Alert.alert(
      "Excluir veículo",
      "Isso vai apagar o veículo e todo o histórico de abastecimentos e trocas. Tem certeza?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await removeVehicle(vehicle.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleDeleteEntry = (entry: Entry) => {
    const isFuel = entry.kind === "fueling";
    const isOil = entry.kind === "oilchange";
    const title = isFuel ? "Excluir abastecimento" : isOil ? "Excluir troca de óleo" : "Excluir gasto extra";
    Alert.alert(
      title,
      "Tem certeza? Se houver gasto vinculado no extrato, ele também será excluído.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const linkedId = entry.data.expenseTransactionId;
            if (linkedId && transactions.some((t) => t.id === linkedId)) {
              await removeTransaction(linkedId);
            }
            if (isFuel) await removeFueling(entry.data.id);
            else if (isOil) await removeOilChange(entry.data.id);
            else await removeVehicleExpense(entry.data.id);
          },
        },
      ],
    );
  };

  const oilColor =
    stats.oilStatus === "overdue"
      ? colors.destructive
      : stats.oilStatus === "soon"
        ? colors.accent
        : colors.foreground;

  return (
    <>
      <Stack.Screen
        options={{
          title: vehicle.name,
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 4 }}>
              <Pressable
                onPress={() => router.push(`/vehicle/new?id=${vehicle.id}`)}
                hitSlop={8}
                style={{ padding: 6 }}
              >
                <Feather name="edit-2" size={18} color={colors.foreground} />
              </Pressable>
              <Pressable
                onPress={handleDeleteVehicle}
                hitSlop={8}
                style={{ padding: 6 }}
              >
                <Feather name="trash-2" size={18} color={colors.destructive} />
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.container}
      >
        <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconCircle name={vehicle.icon || "truck"} color={accent} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.vName, { color: colors.foreground }]} numberOfLines={1}>
              {vehicle.name}
            </Text>
            <Text style={[styles.vMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
              {FUEL_TYPE_LABELS[vehicle.fuelType] ?? vehicle.fuelType}
              {vehicle.plate ? ` · ${vehicle.plate}` : ""}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <ActionButton
            icon="droplet"
            label="Abastecer"
            color={colors.primary}
            onPress={() => router.push(`/fueling/new?vehicleId=${vehicle.id}`)}
          />
          <ActionButton
            icon="settings"
            label="Óleo"
            color={colors.accent}
            onPress={() => router.push(`/oilchange/new?vehicleId=${vehicle.id}`)}
          />
          <ActionButton
            icon="tool"
            label="Gasto"
            color={colors.mutedForeground}
            onPress={() => setExtraModalVisible(true)}
          />
        </View>

        <View style={styles.statsGrid}>
          <BigStat
            label="KM/L médio"
            value={
              stats.avgKmPerLiter != null
                ? formatKmPerLiter(stats.avgKmPerLiter)
                : "—"
            }
            sub={
              stats.recentKmPerLiter != null && stats.recentKmPerLiter !== stats.avgKmPerLiter
                ? `Último: ${formatKmPerLiter(stats.recentKmPerLiter)}`
                : "Média geral"
            }
          />
          <BigStat
            label="R$ por km"
            value={
              stats.avgCostPerKm != null
                ? formatCurrency(stats.avgCostPerKm)
                : "—"
            }
            sub={
              stats.totalKm > 0
                ? `${formatKm(stats.totalKm)} km medidos`
                : "Sem dados ainda"
            }
          />
        </View>

        <View
          style={[
            styles.oilCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <IconCircle
              name="settings"
              color={
                stats.oilStatus === "overdue"
                  ? colors.destructive
                  : stats.oilStatus === "soon"
                    ? colors.accent
                    : colors.primary
              }
              size={40}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.oilTitle, { color: colors.foreground }]}>
                Próxima troca de óleo
              </Text>
              {stats.lastOilChange ? (
                <Text style={[styles.oilSub, { color: colors.mutedForeground }]}>
                  Última em {formatDate(stats.lastOilChange.date)} ·{" "}
                  {formatKm(stats.lastOilChange.odometer)} km
                </Text>
              ) : (
                <Text style={[styles.oilSub, { color: colors.mutedForeground }]}>
                  Nenhuma troca registrada ainda
                </Text>
              )}
            </View>
          </View>

          {stats.nextOilChangeAt != null ? (
            <View style={styles.oilBigRow}>
              <View>
                <Text style={[styles.oilBigLabel, { color: colors.mutedForeground }]}>
                  Trocar em
                </Text>
                <Text style={[styles.oilBigValue, { color: colors.foreground }]}>
                  {formatKm(stats.nextOilChangeAt)} km
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.oilBigLabel, { color: colors.mutedForeground }]}>
                  {(stats.kmRemainingOil ?? 0) <= 0 ? "Atrasado" : "Faltam"}
                </Text>
                <Text style={[styles.oilBigValue, { color: oilColor }]}>
                  {formatKm(Math.abs(stats.kmRemainingOil ?? 0))} km
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={{ gap: 10 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Histórico
          </Text>
          {entries.length === 0 ? (
            <EmptyState
              icon="clock"
              title="Sem registros ainda"
              description="Adicione um abastecimento ou troca de óleo acima."
            />
          ) : (
            entries.map((entry) => (
              <Pressable
                key={`${entry.kind}-${entry.data.id}`}
                onPress={() =>
                  router.push(
                    entry.kind === "fueling"
                      ? `/fueling/${entry.data.id}`
                      : `/oilchange/${entry.data.id}`,
                  )
                }
                onLongPress={() => handleDeleteEntry(entry)}
                style={({ pressed }) => [
                  styles.entryRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <IconCircle
                  name={
                    entry.kind === "fueling"
                      ? "droplet"
                      : entry.kind === "oilchange"
                        ? "settings"
                        : "tool"
                  }
                  color={
                    entry.kind === "fueling"
                      ? colors.primary
                      : entry.kind === "oilchange"
                        ? colors.accent
                        : colors.mutedForeground
                  }
                  size={40}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.entryTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {entry.kind === "fueling"
                      ? `${formatLiters(entry.data.liters)} L · ${formatKm(entry.data.odometer)} km`
                      : entry.kind === "oilchange"
                        ? `Troca de óleo · ${formatKm(entry.data.odometer)} km`
                        : `${entry.data.description}`}
                  </Text>
                  <Text
                    style={[styles.entrySub, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {formatDate(entry.data.date)}
                    {entry.kind === "fueling"
                      ? ` · ${entry.data.tankStatus === "full" ? "tanque cheio" : entry.data.tankStatus === "partial" ? "parcial" : "reserva"}`
                      : ` · próx. em ${formatKm(entry.data.nextChangeKm)} km`}
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.foreground,
                    fontFamily: "Inter_700Bold",
                    fontSize: 14,
                  }}
                >
                  {entry.kind === "fueling"
                    ? formatCurrency(entry.data.totalCost)
                    : entry.kind === "oilchange"
                      ? entry.data.cost
                        ? formatCurrency(entry.data.cost)
                        : ""
                      : formatCurrency(entry.data.amount)}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
      <ExtraExpenseModal
        visible={extraModalVisible}
        onClose={() => setExtraModalVisible(false)}
        vehicleId={vehicle.id}
      />
    </>
  );
}

function ExtraExpenseModal({
  visible,
  onClose,
  vehicleId,
}: {
  visible: boolean;
  onClose: () => void;
  vehicleId: string;
}) {
  const colors = useColors();
  const { addVehicleExpense } = useAppData();
  const [desc, setDesc] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [odo, setOdo] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSave = async () => {
    if (!desc || !amount) {
      Alert.alert("Erro", "Preencha a descrição e o valor.");
      return;
    }
    setLoading(true);
    try {
      await addVehicleExpense({
        vehicleId,
        description: desc,
        amount: parseFloat(amount.replace(",", ".")),
        date: new Date().toISOString(),
        odometer: odo ? parseInt(odo) : undefined,
      });
      setDesc("");
      setAmount("");
      setOdo("");
      onClose();
    } catch (e) {
      Alert.alert("Erro ao salvar", "Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Novo Gasto Extra</Text>
          
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Descrição (ex: Lava-jato)</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            value={desc}
            onChangeText={setDesc}
            placeholder="O que você pagou?"
            placeholderTextColor={colors.mutedForeground}
          />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Valor (R$)</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>KM (Opcional)</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                value={odo}
                onChangeText={setOdo}
                keyboardType="numeric"
                placeholder="Km atual"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <View style={styles.modalButtons}>
            <Pressable onPress={onClose} style={[styles.btn, { backgroundColor: colors.muted + "40" }]}>
              <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={handleSave} disabled={loading} style={[styles.btn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: "white", fontFamily: "Inter_700Bold" }}>{loading ? "Salvando..." : "Salvar"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function BigStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.bigStat,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.bigStatLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.bigStatValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.bigStatSub, { color: colors.mutedForeground }]}>
        {sub}
      </Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: color + "26",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color: colors.foreground }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
    gap: 16,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  vName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  vMeta: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  bigStat: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
  },
  bigStatLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  bigStatValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  bigStatSub: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  oilCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  oilTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  oilSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  oilBigRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  oilBigLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  oilBigValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  entryTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  entrySub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
