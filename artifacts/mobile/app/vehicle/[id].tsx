import React, { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
import type { Fueling, OilChange } from "@/lib/types";

type Entry =
  | { kind: "fueling"; data: Fueling }
  | { kind: "oilchange"; data: OilChange };

export default function VehicleDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    vehicles,
    fuelings,
    oilChanges,
    removeVehicle,
    removeFueling,
    removeOilChange,
    transactions,
    removeTransaction,
  } = useAppData();

  const vehicle = useMemo(
    () => vehicles.find((v) => v.id === id),
    [vehicles, id],
  );

  const stats = useMemo(
    () =>
      vehicle ? computeVehicleStats(vehicle, fuelings, oilChanges) : null,
    [vehicle, fuelings, oilChanges],
  );

  const entries: Entry[] = useMemo(() => {
    if (!vehicle) return [];
    const fs: Entry[] = fuelings
      .filter((f) => f.vehicleId === vehicle.id)
      .map((f) => ({ kind: "fueling" as const, data: f }));
    const os: Entry[] = oilChanges
      .filter((o) => o.vehicleId === vehicle.id)
      .map((o) => ({ kind: "oilchange" as const, data: o }));
    return [...fs, ...os].sort(
      (a, b) =>
        new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
    );
  }, [vehicle, fuelings, oilChanges]);

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
    Alert.alert(
      isFuel ? "Excluir abastecimento" : "Excluir troca de óleo",
      "Tem certeza? Se houver gasto vinculado, ele também será excluído.",
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
            else await removeOilChange(entry.data.id);
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
            label="Trocar óleo"
            color={colors.accent}
            onPress={() => router.push(`/oilchange/new?vehicleId=${vehicle.id}`)}
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
                  name={entry.kind === "fueling" ? "droplet" : "settings"}
                  color={
                    entry.kind === "fueling" ? colors.primary : colors.accent
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
                      : `Troca de óleo · ${formatKm(entry.data.odometer)} km`}
                  </Text>
                  <Text
                    style={[styles.entrySub, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {formatDate(entry.data.date)}
                    {entry.kind === "fueling"
                      ? ` · ${entry.data.tankStatus === "full" ? "tanque cheio" : "reserva"}`
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
                    : entry.data.cost
                      ? formatCurrency(entry.data.cost)
                      : ""}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </>
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
});
