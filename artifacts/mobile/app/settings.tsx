import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { useAppData } from "@/contexts/AppDataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { SUGGESTED_MODELS } from "@/lib/openrouter";

export default function SettingsScreen() {
  const colors = useColors();
  const { settings, apiKey, setApiKey, setModel } = useSettings();
  const { resetAll } = useAppData();

  const [keyDraft, setKeyDraft] = useState<string>("");
  const [modelDraft, setModelDraft] = useState<string>(settings.model);
  const [showKey, setShowKey] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setKeyDraft(apiKey ?? "");
  }, [apiKey]);

  useEffect(() => {
    setModelDraft(settings.model);
  }, [settings.model]);

  const handleSave = async () => {
    await setApiKey(keyDraft.trim() || null);
    await setModel(modelDraft.trim());
    setSavedAt(Date.now());
  };

  const handleClear = async () => {
    if (Platform.OS === "web") {
      const ok = globalThis.confirm?.("Apagar todos os dados? Essa ação não pode ser desfeita.");
      if (!ok) return;
      await resetAll();
      return;
    }
    Alert.alert(
      "Apagar todos os dados",
      "Isso remove transações, recorrências e categorias personalizadas. Não pode ser desfeito.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Apagar tudo", style: "destructive", onPress: () => void resetAll() },
      ],
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Section title="Inteligência Artificial">
        <Text style={[styles.help, { color: colors.mutedForeground }]}>
          O assistente usa o OpenRouter para acessar modelos de IA. Sua chave fica armazenada de
          forma segura apenas neste dispositivo.
        </Text>

        <Field label="Chave da API OpenRouter">
          <View
            style={[
              styles.inputRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={keyDraft}
              onChangeText={setKeyDraft}
              placeholder="sk-or-..."
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.inputInline, { color: colors.foreground }]}
            />
            <Pressable onPress={() => setShowKey(!showKey)} hitSlop={8} style={styles.eyeBtn}>
              <Feather
                name={showKey ? "eye-off" : "eye"}
                size={18}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>
          <Pressable
            onPress={() => Linking.openURL("https://openrouter.ai/keys")}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, paddingVertical: 4 }]}
          >
            <Text style={[styles.link, { color: colors.primary }]}>
              Como obter uma chave em openrouter.ai/keys
            </Text>
          </Pressable>
        </Field>

        <Field label="Modelo">
          <TextInput
            value={modelDraft}
            onChangeText={setModelDraft}
            placeholder="openai/gpt-4o-mini"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
            ]}
          />

          <View style={styles.modelGrid}>
            {SUGGESTED_MODELS.map((m) => {
              const active = modelDraft === m.value;
              return (
                <Pressable
                  key={m.value}
                  onPress={() => setModelDraft(m.value)}
                  style={[
                    styles.modelChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? colors.primaryForeground : colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 13,
                    }}
                  >
                    {m.label}
                  </Text>
                  <Text
                    style={{
                      color: active ? colors.primaryForeground : colors.mutedForeground,
                      fontFamily: "Inter_400Regular",
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    {m.hint}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.help, { color: colors.mutedForeground }]}>
            Você pode usar qualquer modelo do OpenRouter. Cole o ID exato (ex: provider/model).
          </Text>
        </Field>

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.saveText, { color: colors.primaryForeground }]}>
            Salvar configurações
          </Text>
        </Pressable>

        {savedAt ? (
          <Text style={[styles.savedFlag, { color: colors.income }]}>Configurações salvas.</Text>
        ) : null}
      </Section>

      <Section title="Dados">
        <Pressable
          onPress={() => router.push("/categories")}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
            <Feather name="tag" size={18} color={colors.foreground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>Categorias</Text>
            <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
              Adicionar e remover categorias
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </Pressable>

        <Pressable
          onPress={() => Alert.alert("Em breve", "O backup via arquivo JSON estará disponível na próxima versão.")}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={[styles.rowIcon, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="upload" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>Exportar Backup</Text>
            <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
              Salvar todos os seus dados em um arquivo
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </Pressable>

        <Pressable
          onPress={() => Alert.alert("Em breve", "A importação de backup estará disponível na próxima versão.")}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={[styles.rowIcon, { backgroundColor: colors.accent + "15" }]}>
            <Feather name="download" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>Importar Backup</Text>
            <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
              Restaurar dados de um arquivo salvo
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </Pressable>

        <Pressable
          onPress={handleClear}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View style={[styles.rowIcon, { backgroundColor: colors.destructive + "22" }]}>
            <Feather name="trash-2" size={18} color={colors.destructive} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.destructive }]}>Apagar todos os dados</Text>
            <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
              Remove transações e recorrências
            </Text>
          </View>
        </Pressable>
      </Section>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          Bolso · seus dados ficam apenas neste dispositivo.
        </Text>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60, gap: 24 },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  sectionBody: { gap: 12 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputInline: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  eyeBtn: { padding: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  modelGrid: {
    gap: 8,
  },
  modelChip: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  help: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  link: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  savedFlag: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  footer: { paddingTop: 8, alignItems: "center" },
  footerText: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
