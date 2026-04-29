import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useChat } from "@/contexts/ChatContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { ChatMessage } from "@/lib/types";

export function ChatSheet() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { messages, sending, isOpen, close, send, clear } = useChat();
  const { apiKey } = useSettings();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<TextInput>(null);
  const baseDraftRef = useRef("");
  const speech = useSpeechRecognition("pt-BR");

  const toggleMic = useCallback(() => {
    if (speech.listening) {
      speech.stop();
      return;
    }
    baseDraftRef.current = draft ? draft.trimEnd() + " " : "";
    speech.start((text, isFinal) => {
      setDraft(baseDraftRef.current + text);
      if (isFinal) baseDraftRef.current = baseDraftRef.current + text + " ";
    });
  }, [draft, speech]);

  const visibleMessages = useMemo(
    () =>
      messages.filter(
        (m) =>
          m.role === "user" ||
          (m.role === "assistant" && (m.content || (m.toolCalls?.length ?? 0) > 0)),
      ),
    [messages],
  );

  const handleSend = useCallback(() => {
    if (!draft.trim() || sending) return;
    const text = draft.trim();
    setDraft("");
    void send(text);
  }, [draft, sending, send]);

  const goSettings = useCallback(() => {
    close();
    router.push("/settings");
  }, [close]);

  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              paddingTop: Platform.OS === "web" ? 16 : 12,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Feather name="zap" size={16} color={colors.primaryForeground} />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>Assistente</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {apiKey ? "Pronto para conversar" : "Configurar API"}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {messages.length > 0 ? (
              <Pressable
                onPress={() => void clear()}
                hitSlop={10}
                style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Feather name="trash-2" size={18} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
            <Pressable
              onPress={close}
              hitSlop={10}
              style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          {visibleMessages.length === 0 ? (
            <ChatEmpty hasKey={!!apiKey} onConfigure={goSettings} onPick={(text) => setDraft(text)} />
          ) : (
            <FlatList
              data={visibleMessages}
              inverted
              keyExtractor={(m) => m.id}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.list}
              renderItem={({ item }) => <Bubble message={item} />}
              ListHeaderComponent={
                sending ? (
                  <View style={styles.typing}>
                    <View style={[styles.typingBubble, { backgroundColor: colors.muted }]}>
                      <ActivityIndicator size="small" color={colors.mutedForeground} />
                    </View>
                  </View>
                ) : null
              }
            />
          )}

          {!apiKey ? (
            <Pressable
              onPress={goSettings}
              style={[styles.warnBar, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <Feather name="key" size={14} color={colors.accent} />
              <Text style={[styles.warnText, { color: colors.foreground }]}>
                Configurar chave do OpenRouter
              </Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}

          <View
            style={[
              styles.inputBar,
              {
                paddingBottom: Math.max(insets.bottom, 12),
                borderTopColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          >
            <View style={[styles.inputWrap, { backgroundColor: colors.muted }]}>
              <TextInput
                ref={inputRef}
                value={draft}
                onChangeText={setDraft}
                placeholder={
                  speech.listening ? "Ouvindo..." : "Pergunte ou registre um gasto..."
                }
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
                multiline
                maxLength={1000}
                editable={!sending}
              />
              {speech.supported ? (
                <Pressable
                  onPress={toggleMic}
                  disabled={sending}
                  style={({ pressed }) => [
                    styles.micBtn,
                    {
                      backgroundColor: speech.listening ? colors.expense : "transparent",
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                  hitSlop={6}
                >
                  <Feather
                    name={speech.listening ? "square" : "mic"}
                    size={18}
                    color={
                      speech.listening
                        ? colors.primaryForeground
                        : colors.mutedForeground
                    }
                  />
                </Pressable>
              ) : null}
              <Pressable
                onPress={handleSend}
                disabled={!draft.trim() || sending}
                style={({ pressed }) => [
                  styles.sendBtn,
                  {
                    backgroundColor: draft.trim() && !sending ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Feather
                  name="arrow-up"
                  size={18}
                  color={draft.trim() && !sending ? colors.primaryForeground : colors.mutedForeground}
                />
              </Pressable>
            </View>
            {speech.error ? (
              <Text style={[styles.micError, { color: colors.expense }]}>
                {speech.error}
              </Text>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const colors = useColors();
  const isUser = message.role === "user";

  if (message.role === "assistant" && !message.content && (message.toolCalls?.length ?? 0) > 0) {
    return (
      <View style={styles.toolRow}>
        <View style={[styles.toolPill, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="cpu" size={11} color={colors.mutedForeground} />
          <Text style={[styles.toolText, { color: colors.mutedForeground }]}>
            executando · {message.toolCalls?.map((t) => t.function.name).join(", ")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleRow, { justifyContent: isUser ? "flex-end" : "flex-start" }]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.muted,
            borderBottomRightRadius: isUser ? 6 : 18,
            borderBottomLeftRadius: isUser ? 18 : 6,
          },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isUser ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function ChatEmpty({
  hasKey,
  onConfigure,
  onPick,
}: {
  hasKey: boolean;
  onConfigure: () => void;
  onPick: (text: string) => void;
}) {
  const colors = useColors();
  const suggestions = [
    "Gastei 45 reais no almoço hoje",
    "Quanto gastei esse mês?",
    "Mostra meus gastos com alimentação",
    "Adiciona uma assinatura de Netflix de 55 reais todo dia 5",
  ];

  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "22" }]}>
        <Feather name="message-circle" size={28} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Como posso ajudar?</Text>
      <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
        {hasKey
          ? "Registre gastos por conversa, pergunte sobre seus dados ou converse sobre qualquer assunto."
          : "Configure sua chave do OpenRouter para começar a conversar."}
      </Text>
      {!hasKey ? (
        <Pressable
          onPress={onConfigure}
          style={[styles.cta, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>Configurar agora</Text>
        </Pressable>
      ) : (
        <View style={styles.suggestions}>
          {suggestions.map((s) => (
            <Pressable
              key={s}
              onPress={() => onPick(s)}
              style={[styles.suggestion, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.suggestionText, { color: colors.foreground }]}>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBtn: { padding: 6 },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  bubbleRow: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  toolRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 6,
  },
  toolPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  toolText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  typing: {
    flexDirection: "row",
    paddingVertical: 6,
  },
  typingBubble: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 320,
  },
  cta: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  suggestions: {
    width: "100%",
    marginTop: 12,
    gap: 8,
  },
  suggestion: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  warnBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  warnText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 8,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 120,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  micError: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 6,
    marginLeft: 4,
  },
});
