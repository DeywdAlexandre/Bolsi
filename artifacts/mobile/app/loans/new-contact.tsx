import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Alert } from "react-native";

import { useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";

export default function NewContactScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { loanContacts, addLoanContact, updateLoanContact } = useAppData();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const editingContact = useMemo(() => (id ? loanContacts.find((c) => c.id === id) : null), [id, loanContacts]);

  useEffect(() => {
    if (editingContact) {
      setName(editingContact.name);
      setPhone(editingContact.phone || "");
      setAddress(editingContact.address || "");
      setPhoto(editingContact.photo);
    }
  }, [editingContact]);

  const handlePickImage = async () => {
    Alert.alert(
      "Foto do Perfil",
      "Escolha uma opção",
      [
        {
          text: "Galeria",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (!result.canceled) {
              setPhoto(result.assets[0].uri);
            }
          },
        },
        {
          text: "Câmera",
          onPress: async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
              Alert.alert("Permissão negada", "Precisamos de acesso à câmera para tirar fotos.");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (!result.canceled) {
              setPhoto(result.assets[0].uri);
            }
          },
        },
        { text: "Remover Foto", style: "destructive", onPress: () => setPhoto(undefined) },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        photo,
      };

      if (id) {
        await updateLoanContact(id, payload);
      } else {
        await addLoanContact(payload);
      }
      router.back();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {id ? "Editar Perfil" : "Nova Pessoa"}
          </Text>
        </View>
        
        <View style={styles.avatarContainer}>
          <Pressable onPress={handlePickImage} style={styles.avatarWrapper}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatarImage} />
              ) : (
                <Feather name="camera" size={32} color={colors.mutedForeground} />
              )}
            </View>
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              <Feather name="edit-2" size={12} color={colors.primaryForeground} />
            </View>
          </Pressable>
          <Text style={[styles.avatarLabel, { color: colors.mutedForeground }]}>Toque para alterar foto</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Nome Completo</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="user" size={20} color={colors.mutedForeground} />
              <TextInput
                autoFocus={!id}
                placeholder="Ex: João Silva"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Telefone</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="phone" size={20} color={colors.mutedForeground} />
              <TextInput
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Endereço</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border, height: 80 }]}>
              <Feather name="map-pin" size={20} color={colors.mutedForeground} style={{ marginTop: -30 }} />
              <TextInput
                placeholder="Rua, Número, Bairro..."
                multiline
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, height: 60, textAlignVertical: "top" }]}
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={!name.trim() || saving}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: colors.primary,
                opacity: !name.trim() || saving ? 0.5 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
              {saving ? "Salvando..." : id ? "Salvar Alterações" : "Cadastrar Pessoa"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 32,
    gap: 8,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  editBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent", // Será preenchido pelo background
  },
  avatarLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  form: {
    paddingHorizontal: 20,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginLeft: 4,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  hint: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  saveBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
