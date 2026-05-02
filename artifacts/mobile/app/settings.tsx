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

import { Stack } from "expo-router";

export default function SettingsScreen() {
  const colors = useColors();
  const { settings, apiKey, setApiKey, setModel, setThemeMode } = useSettings();
  const { resetAll, userName, setUserName } = useAppData();

  const [nameDraft, setNameDraft] = useState(userName);
  const [keyDraft, setKeyDraft] = useState<string>("");
  const [modelDraft, setModelDraft] = useState<string>(settings.model);
  const [showKey, setShowKey] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);

  useEffect(() => {
    setKeyDraft(apiKey ?? "");
  }, [apiKey]);

  useEffect(() => {
    setModelDraft(settings.model);
  }, [settings.model]);

  const handleSave = async () => {
    await setUserName(nameDraft.trim());
    await setApiKey(keyDraft.trim() || null);
    await setModel(modelDraft.trim());
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 3000);
  };

  const handleClear = async () => {
    const confirmAction = () => {
      if (Platform.OS === "web") {
        const text = globalThis.prompt?.("Para apagar todos os dados, digite APAGAR abaixo:");
        if (text === "APAGAR") {
          resetAll();
        } else if (text !== null) {
          globalThis.alert?.("Palavra-chave incorreta. Ação cancelada.");
        }
      } else {
        // No Mobile, usamos o Alert.prompt se disponível, ou uma sequência de confirmação
        Alert.alert(
          "⚠️ Ação Irreversível",
          "Todos os seus dados (transações, veículos, empréstimos) serão apagados. Deseja continuar?",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Sim, Prosseguir",
              style: "destructive",
              onPress: () => {
                // Segunda camada de segurança
                setTimeout(() => {
                  Alert.alert(
                    "Confirmação Final",
                    'Tem certeza absoluta? Essa é sua última chance de cancelar.',
                    [
                      { text: "Cancelar", style: "cancel" },
                      { text: "APAGAR TUDO", style: "destructive", onPress: () => void resetAll() }
                    ]
                  );
                }, 500);
              }
            }
          ]
        );
      }
    };

    confirmAction();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Configurações",
          headerLeft: () => (
            <Pressable 
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(tabs)");
                }
              }} 
              hitSlop={12} 
              style={{ marginLeft: -10, padding: 8 }}
            >
              <Feather name="arrow-left" size={24} color={colors.foreground} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Section title="Perfil">
        <Field label="Seu Nome">
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="Como quer ser chamado?"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
          />
        </Field>
      </Section>

      <Section title="Aparência">
        <View style={[styles.themeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(["system", "light", "dark"] as const).map((m) => {
            const active = settings.themeMode === m;
            const labels = { system: "Sistema", light: "Claro", dark: "Escuro" };
            const icons = { system: "smartphone", light: "sun", dark: "moon" } as const;
            
            return (
              <Pressable
                key={m}
                onPress={() => setThemeMode(m)}
                style={[
                  styles.themeBtn,
                  active && { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Feather 
                  name={icons[m]} 
                  size={16} 
                  color={active ? colors.primary : colors.mutedForeground} 
                />
                <Text style={[
                  styles.themeText, 
                  { color: active ? colors.foreground : colors.mutedForeground }
                ]}>
                  {labels[m]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

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

        <Field label="Modelo de IA">
          <Pressable
            onPress={() => setIsModelPickerOpen(!isModelPickerOpen)}
            style={[
              styles.modelSelector,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.modelValue, { color: colors.foreground }]}>
                {SUGGESTED_MODELS.find(m => m.value === modelDraft)?.label || modelDraft}
              </Text>
              <Text style={[styles.modelSub, { color: colors.mutedForeground }]}>
                {modelDraft}
              </Text>
            </View>
            <Feather 
              name={isModelPickerOpen ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.mutedForeground} 
            />
          </Pressable>

          {isModelPickerOpen && (
            <View style={[styles.modelPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {SUGGESTED_MODELS.map((m) => {
                const active = modelDraft === m.value;
                return (
                  <Pressable
                    key={m.value}
                    onPress={() => {
                      setModelDraft(m.value);
                      setIsModelPickerOpen(false);
                    }}
                    style={[
                      styles.modelItem,
                      active && { backgroundColor: colors.primary + "15" }
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modelItemLabel, { color: active ? colors.primary : colors.foreground }]}>
                        {m.label}
                      </Text>
                      <Text style={[styles.modelItemHint, { color: colors.mutedForeground }]}>
                        {m.hint}
                      </Text>
                    </View>
                    {active && <Feather name="check" size={18} color={colors.primary} />}
                  </Pressable>
                );
              })}
              <View style={styles.customModelBox}>
                <Text style={[styles.customLabel, { color: colors.mutedForeground }]}>Outro modelo (ID):</Text>
                <TextInput
                  value={modelDraft}
                  onChangeText={setModelDraft}
                  placeholder="provider/model-id"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  style={[styles.customInput, { color: colors.foreground, borderBottomColor: colors.border }]}
                />
              </View>
            </View>
          )}
        </Field>

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.saveText, { color: colors.primaryForeground }]}>
            Salvar IA
          </Text>
        </Pressable>

        {savedAt ? (
          <Text style={[styles.savedFlag, { color: colors.income }]}>Alterações salvas.</Text>
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
    </>
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
  themeRow: {
    flexDirection: "row",
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  themeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  themeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  modelSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  modelValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  modelSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  modelPicker: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  modelItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  modelItemLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  modelItemHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  customModelBox: {
    padding: 16,
    gap: 8,
  },
  customLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
  },
  customInput: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  help: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  link: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  savedFlag: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center", marginTop: 8 },
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

