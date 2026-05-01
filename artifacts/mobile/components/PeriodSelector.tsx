import React, { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import {
  addDaysIso,
  formatRangeLabel,
  getMonthName,
  getMonthShort,
  toIsoDay,
} from "@/lib/format";
import { DateRangeCalendar } from "@/components/DateRangeCalendar";

export type PeriodMode = "month" | "year" | "range";

export type Period = {
  mode: PeriodMode;
  month: number; // 0-11
  year: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
};

type Props = {
  period: Period;
  onChange: (p: Period) => void;
  minYear?: number;
  enableRange?: boolean;
  isDarkBackground?: boolean;
};

function ensureRange(p: Period): { start: string; end: string } {
  if (p.startDate && p.endDate) return { start: p.startDate, end: p.endDate };
  const now = new Date();
  const first = toIsoDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const today = toIsoDay(now);
  return { start: first, end: today };
}

export function PeriodSelector({
  period,
  onChange,
  minYear = 2020,
  enableRange = false,
  isDarkBackground = false,
}: Props) {
  const colors = useColors();
  const [pickerOpen, setPickerOpen] = useState(false);

  const label = (() => {
    if (period.mode === "month") return `${getMonthName(period.month)} ${period.year}`;
    if (period.mode === "year") return `${period.year}`;
    const { start, end } = ensureRange(period);
    return formatRangeLabel(start, end);
  })();

  const bgColor = isDarkBackground ? colors.primaryForeground + "22" : colors.muted;
  const activePillBg = isDarkBackground ? colors.primaryForeground : colors.background;
  const textColor = isDarkBackground ? colors.primaryForeground : colors.foreground;
  const inactiveTextColor = isDarkBackground ? colors.primaryForeground + "88" : colors.mutedForeground;

  const goPrev = () => {
    if (period.mode === "year") {
      onChange({ ...period, year: period.year - 1 });
      return;
    }
    if (period.mode === "range") {
      const { start, end } = ensureRange(period);
      const days = Math.max(
        1,
        Math.round(
          (new Date(end).getTime() - new Date(start).getTime()) / 86400000,
        ) + 1,
      );
      onChange({
        ...period,
        startDate: addDaysIso(start, -days),
        endDate: addDaysIso(end, -days),
      });
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
    if (period.mode === "range") {
      const { start, end } = ensureRange(period);
      const days = Math.max(
        1,
        Math.round(
          (new Date(end).getTime() - new Date(start).getTime()) / 86400000,
        ) + 1,
      );
      onChange({
        ...period,
        startDate: addDaysIso(start, days),
        endDate: addDaysIso(end, days),
      });
      return;
    }
    if (period.month === 11) {
      onChange({ ...period, month: 0, year: period.year + 1 });
    } else {
      onChange({ ...period, month: period.month + 1 });
    }
  };

  const switchMode = (mode: PeriodMode) => {
    if (mode === "range") {
      const { start, end } = ensureRange(period);
      onChange({ ...period, mode, startDate: start, endDate: end });
    } else {
      onChange({ ...period, mode });
    }
  };

  const modes: { value: PeriodMode; label: string }[] = [
    { value: "month", label: "Mês" },
    { value: "year", label: "Ano" },
  ];
  if (enableRange) modes.push({ value: "range", label: "Datas" });

  return (
    <View style={styles.row}>
      <View style={[styles.modePill, { backgroundColor: bgColor }]}>
        {modes.map((m) => {
          const active = period.mode === m.value;
          return (
            <Pressable
              key={m.value}
              onPress={() => switchMode(m.value)}
              style={[
                styles.pillBtn,
                active && { backgroundColor: activePillBg },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: active ? (isDarkBackground ? colors.primary : colors.foreground) : inactiveTextColor,
                    fontFamily: active ? "Inter_600SemiBold" : "Inter_500Medium",
                  },
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.navWrap, { backgroundColor: bgColor }]}>
        <Pressable onPress={goPrev} style={styles.navBtn} hitSlop={8}>
          <Feather name="chevron-left" size={18} color={textColor} />
        </Pressable>
        <Pressable onPress={() => setPickerOpen(true)} style={styles.label} hitSlop={8}>
          <Text style={[styles.labelText, { color: textColor }]} numberOfLines={1}>
            {label}
          </Text>
        </Pressable>
        <Pressable onPress={goNext} style={styles.navBtn} hitSlop={8}>
          <Feather name="chevron-right" size={18} color={textColor} />
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
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              {period.mode === "range" ? "Selecionar datas" : "Selecionar período"}
            </Text>

            {period.mode === "range" ? (
              <DateRangeCalendar
                startDate={period.startDate ?? ensureRange(period).start}
                endDate={period.endDate ?? ensureRange(period).end}
                onChange={(start, end) =>
                  onChange({ ...period, startDate: start, endDate: end })
                }
              />
            ) : (
              <>
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
              </>
            )}

            <Pressable
              onPress={() => setPickerOpen(false)}
              style={[styles.closeBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.closeBtnText, { color: colors.primaryForeground }]}>
                {period.mode === "range" ? "Aplicar" : "Fechar"}
              </Text>
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
    paddingHorizontal: 10,
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
    paddingHorizontal: 4,
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
