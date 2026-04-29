import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import {
  addDaysIso,
  fromIsoDay,
  getMonthName,
  toIsoDay,
} from "@/lib/format";

type Props = {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
};

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function DateRangeCalendar({ startDate, endDate, onChange }: Props) {
  const colors = useColors();
  const initial = startDate ? fromIsoDay(startDate) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [pendingStart, setPendingStart] = useState<string | null>(null);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const arr: (string | null)[] = [];
    for (let i = 0; i < startWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(toIsoDay(new Date(viewYear, viewMonth, d)));
    }
    return arr;
  }, [viewMonth, viewYear]);

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handlePress = (iso: string) => {
    if (pendingStart) {
      const a = pendingStart;
      const b = iso;
      const [s, e] = a <= b ? [a, b] : [b, a];
      onChange(s, e);
      setPendingStart(null);
    } else {
      setPendingStart(iso);
      onChange(iso, iso);
    }
  };

  const isInRange = (iso: string | null) => {
    if (!iso) return false;
    const s = pendingStart ?? startDate;
    const e = pendingStart ? pendingStart : endDate;
    if (!s || !e) return false;
    const lo = s <= e ? s : e;
    const hi = s <= e ? e : s;
    return iso >= lo && iso <= hi;
  };

  const isStart = (iso: string | null) => iso === (pendingStart ?? startDate);
  const isEnd = (iso: string | null) =>
    !pendingStart && iso === endDate && startDate !== endDate;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Pressable onPress={goPrev} hitSlop={10} style={styles.navBtn}>
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerLabel, { color: colors.foreground }]}>
          {getMonthName(viewMonth)} {viewYear}
        </Text>
        <Pressable onPress={goNext} hitSlop={10} style={styles.navBtn}>
          <Feather name="chevron-right" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text
            key={i}
            style={[styles.weekday, { color: colors.mutedForeground }]}
          >
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((iso, i) => {
          if (!iso) return <View key={i} style={styles.cell} />;
          const inRange = isInRange(iso);
          const start = isStart(iso);
          const end = isEnd(iso);
          const isEdge = start || end;
          return (
            <Pressable
              key={i}
              onPress={() => handlePress(iso)}
              style={styles.cell}
            >
              <View
                style={[
                  styles.cellInner,
                  inRange && !isEdge
                    ? { backgroundColor: colors.primary + "26" }
                    : null,
                  isEdge ? { backgroundColor: colors.primary } : null,
                ]}
              >
                <Text
                  style={{
                    color: isEdge
                      ? colors.primaryForeground
                      : inRange
                        ? colors.foreground
                        : colors.foreground,
                    fontFamily: isEdge ? "Inter_700Bold" : "Inter_500Medium",
                    fontSize: 14,
                  }}
                >
                  {fromIsoDay(iso).getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.shortcuts}>
        <ShortcutBtn
          label="Hoje"
          onPress={() => {
            const t = toIsoDay(new Date());
            onChange(t, t);
            setPendingStart(null);
          }}
        />
        <ShortcutBtn
          label="7 dias"
          onPress={() => {
            const today = toIsoDay(new Date());
            onChange(addDaysIso(today, -6), today);
            setPendingStart(null);
          }}
        />
        <ShortcutBtn
          label="30 dias"
          onPress={() => {
            const today = toIsoDay(new Date());
            onChange(addDaysIso(today, -29), today);
            setPendingStart(null);
          }}
        />
        <ShortcutBtn
          label="Mês atual"
          onPress={() => {
            const now = new Date();
            const first = toIsoDay(new Date(now.getFullYear(), now.getMonth(), 1));
            const last = toIsoDay(
              new Date(now.getFullYear(), now.getMonth() + 1, 0),
            );
            onChange(first, last);
            setPendingStart(null);
          }}
        />
      </View>

      {pendingStart ? (
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Selecione a data final
        </Text>
      ) : null}
    </View>
  );
}

function ShortcutBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.shortcut, { backgroundColor: colors.muted }]}
    >
      <Text
        style={{
          color: colors.foreground,
          fontFamily: "Inter_500Medium",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  weekRow: {
    flexDirection: "row",
    paddingTop: 2,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    paddingVertical: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  cellInner: {
    flex: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcuts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 6,
  },
  shortcut: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    paddingTop: 4,
  },
});
