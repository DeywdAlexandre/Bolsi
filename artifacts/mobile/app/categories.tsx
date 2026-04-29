import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { IconCircle } from "@/components/IconCircle";
import { useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";
import { CATEGORY_COLOR_OPTIONS, CATEGORY_ICON_OPTIONS } from "@/lib/categories";
import type { Category, TransactionType } from "@/lib/types";

export default function CategoriesScreen() {
  const colors = useColors();
  const { categories, addCategory, removeCategory } = useAppData();
  const [tab, setTab] = useState<TransactionType>("expense");
  const [modalOpen, setModalOpen] = useState(false);

  const list = categories.filter((c) => c.type === tab);

  const handleDelete = (cat: Category) => {
    if (cat.isDefault) {
      Alert.alert("Não removível", "Categorias padrão não podem ser removidas.");
      return;
    }
    if (Platform.OS === "web") {
      const ok = globalThis.confirm?.(`Remover ${cat.name}?`);
      if (!ok) return;
      void removeCategory(cat.id);
      return;
    }
    Alert.alert("Remover", `Remover a categoria "${cat.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => void removeCategory(cat.id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <View style={[styles.tabs, { backgroundColor: colors.muted }]}>
          {(["expense", "income"] as TransactionType[]).map((t) => {
            const active = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[
                  styles.tab,
                  { backgroundColor: active ? colors.background : "transparent" },
                ]}
              >
                <Text
                  style={{
                    color: active ? colors.foreground : colors.mutedForeground,
                    fontFamily: active ? "Inter_700Bold" : "Inter_500Medium",
                    fontSize: 13,
                  }}
                >
                  {t === "income" ? "Entradas" : "Gastos"}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={() => setModalOpen(true)}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.foreground, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="plus" size={18} color={colors.background} />
        </Pressable>
      </View>

      <FlatList
        data={list}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 8 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.row,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <IconCircle name={item.icon} color={item.color} size={36} />
            <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
            {item.isDefault ? (
              <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>padrão</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => handleDelete(item)}
                hitSlop={8}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 6 }]}
              >
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        )}
      />

      <NewCategoryModal
        visible={modalOpen}
        type={tab}
        onClose={() => setModalOpen(false)}
        onCreate={async (name, icon, color) => {
          await addCategory({ name, icon, color, type: tab });
          setModalOpen(false);
        }}
      />
    </View>
  );
}

function NewCategoryModal({
  visible,
  type,
  onClose,
  onCreate,
}: {
  visible: boolean;
  type: TransactionType;
  onClose: () => void;
  onCreate: (name: string, icon: string, color: string) => Promise<void>;
}) {
  const colors = useColors();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(CATEGORY_ICON_OPTIONS[0]!);
  const [color, setColor] = useState(CATEGORY_COLOR_OPTIONS[0]!);

  const reset = () => {
    setName("");
    setIcon(CATEGORY_ICON_OPTIONS[0]!);
    setColor(CATEGORY_COLOR_OPTIONS[0]!);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[modal.container, { backgroundColor: colors.background }]}>
        <View style={[modal.header, { borderBottomColor: colors.border }]}>
          <Text style={[modal.title, { color: colors.foreground }]}>
            Nova categoria de {type === "income" ? "entrada" : "gasto"}
          </Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
          <View style={modal.preview}>
            <IconCircle name={icon} color={color} size={64} iconSize={28} />
            <Text style={[modal.previewText, { color: colors.foreground }]}>
              {name.trim() || "Sua categoria"}
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={[modal.label, { color: colors.mutedForeground }]}>Nome</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex: Pet, Viagens, Mercado"
              placeholderTextColor={colors.mutedForeground}
              style={[
                modal.input,
                { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
              ]}
            />
          </View>

          <View style={{ gap: 10 }}>
            <Text style={[modal.label, { color: colors.mutedForeground }]}>Cor</Text>
            <View style={modal.colors}>
              {CATEGORY_COLOR_OPTIONS.map((c) => {
                const active = c === color;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={[
                      modal.colorChip,
                      {
                        backgroundColor: c,
                        borderWidth: active ? 3 : 0,
                        borderColor: colors.foreground,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={[modal.label, { color: colors.mutedForeground }]}>Ícone</Text>
            <View style={modal.iconGrid}>
              {CATEGORY_ICON_OPTIONS.map((i) => {
                const active = i === icon;
                return (
                  <Pressable
                    key={i}
                    onPress={() => setIcon(i)}
                    style={[
                      modal.iconChip,
                      {
                        backgroundColor: active ? color + "33" : colors.muted,
                        borderColor: active ? color : "transparent",
                      },
                    ]}
                  >
                    <Feather name={i as keyof typeof Feather.glyphMap} size={18} color={active ? color : colors.mutedForeground} />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={async () => {
              const trimmed = name.trim();
              if (!trimmed) return;
              await onCreate(trimmed, icon, color);
              reset();
            }}
            disabled={!name.trim()}
            style={({ pressed }) => [
              modal.submit,
              {
                backgroundColor: name.trim() ? colors.primary : colors.muted,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[modal.submitText, { color: name.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
              Criar categoria
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabs: { flexDirection: "row", padding: 4, borderRadius: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  name: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

const modal = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 16, fontFamily: "Inter_700Bold" },
  preview: { alignItems: "center", gap: 10, paddingVertical: 12 },
  previewText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  label: {
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
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  colors: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  submit: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
