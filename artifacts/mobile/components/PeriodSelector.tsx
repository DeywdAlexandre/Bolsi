import React, { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { getMonthName, getMonthShort } from "@/lib/format";

export type PeriodMode = "month" | "year";

export type Period = {
  mode: PeriodMode;
  month: number; // 0-11
  year: number;
};

type Props = {
  period: Period;
  onChange: (p: Period) => void;
  minYear?: number;
};

export function PeriodSelector({ period, onChange, minYear = 2020 }: Props) {
  const colors = useColors();
  const [pickerOpen, setPickerOpen] = useState(false);

  const label =
    period.mode === "month"
      ? `${getMonthName(period.month)} ${period.year}`
      : `${period.year}`;

  const goPrev = () => {
    if (period.mode === "year") {
      onChange({ ...period, year: period.year - 1 });
      return;
    }
    if (period.month === 0) {
      onChange({ ...period, month: 11, year: period.year - 1 });
    } else {
      onChange({ ...period, month: period.month - 1 });
    }
  };

  const goNext = () => {
    const now = new Date();
    if (period.mode === "year") {
      if (period.year < now.getFullYear() + 1) onChange({ ...period, year: period.year + 1 });
      return;
    }
    if (period.month === 11) {
      onChange({ ...period, month: 0, year: period.year + 1 });
    } else {
      onChange({ ...period, month: period.month + 1 });
    }
  };

  return (
    <View style={styles.row}>
      <View style={[styles.modePill, { backgroundColor: colors.muted }]}>
        {(["month", "year"] as const).map((m) => {
          const active = period.mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => onChange({ ...period, mode: m })}
              style={[
                styles.pillBtn,
                active && { backgroundColor: colors.background },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: active ? colors.foreground : colors.mutedForeground,
                    fontFamily: active ? "Inter_600SemiBold" : "Inter_500Medium",
                  },
                ]}
              >
                {m === "month" ? "Mês" : "Ano"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.navWrap, { backgroundColor: colors.muted }]}>
        <Pressable onPress={goPrev} style={styles.navBtn} hitSlop={8}>
          <Feather name="chevron-left" size={18} color={colors.foreground} />
        </Pressable>
        <Pressable onPress={() => setPickerOpen(true)} style={styles.label} hitSlop={8}>
          <Text style={[styles.labelText, { color: colors.foreground }]}>{label}</Text>
        </Pressable>
        <Pressable onPress={goNext} style={styles.navBtn} hitSlop={8}>
          <Feather name="chevron-right" size={18} color={colors.foreground} />
        </Pressable>
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Selecionar período</Text>

            <YearPicker
              year={period.year}
              minYear={minYear}
              maxYear={new Date().getFullYear() + 1}
              onChange={(y) => onChange({ ...period, year: y })}
            />

            {period.mode === "month" ? (
              <View style={styles.monthGrid}>
                {Array.from({ length: 12 }).map((_, m) => {
                  const active = m === period.month;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => {
                        onChange({ ...period, month: m });
                        setPickerOpen(false);
                      }}
                      style={[
                        styles.monthCell,
                        {
                          backgroundColor: active ? colors.primary : colors.muted,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.monthCellText,
                          {
                            color: active ? colors.primaryForeground : colors.foreground,
                            fontFamily: active ? "Inter_700Bold" : "Inter_500Medium",
                          },
                        ]}
                      >
                        {getMonthShort(m)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <Pressable
              onPress={() => setPickerOpen(false)}
              style={[styles.closeBtn, { backgroundColor: colors.muted }]}
            >
              <Text style={[styles.closeBtnText, { color: colors.foreground }]}>Fechar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function YearPicker({
  year,
  minYear,
  maxYear,
  onChange,
}: {
  year: number;
  minYear: number;
  maxYear: number;
  onChange: (y: number) => void;
}) {
  const colors = useColors();
  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);
  return (
    <FlatList
      data={years}
      keyExtractor={(y) => y.toString()}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
      renderItem={({ item }) => {
        const active = item === year;
        return (
          <Pressable
            onPress={() => onChange(item)}
            style={[
              styles.yearChip,
              {
                backgroundColor: active ? colors.foreground : colors.muted,
              },
            ]}
          >
            <Text
              style={{
                color: active ? colors.background : colors.foreground,
                fontFamily: active ? "Inter_700Bold" : "Inter_500Medium",
                fontSize: 14,
              }}
            >
              {item}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  modePill: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 12,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 13,
  },
  navWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 4,
  },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  label: {
    flex: 1,
    alignItems: "center",
  },
  labelText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  monthCell: {
    width: "23%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  monthCellText: {
    fontSize: 13,
  },
  yearChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  closeBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
