import React, { useMemo } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";

import { EmptyState } from "@/components/EmptyState";
import { ContactAvatar } from "@/components/ContactAvatar";
import { useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency, formatDate } from "@/lib/format";

export default function LoanContactDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loanContacts, loans, loanPayments, removeLoanContact, removeLoan } = useAppData();

  const contact = useMemo(() => loanContacts.find((c) => c.id === id), [loanContacts, id]);
  
  const contactLoans = useMemo(() => 
    loans.filter((l) => l.contactId === id),
  [loans, id]);

  const stats = useMemo(() => {
    let balance = 0;
    let totalLend = 0;
    let totalBorrow = 0;

    contactLoans.forEach(l => {
      const payments = loanPayments.filter(p => p.loanId === l.id);
      const paid = payments.reduce((s, p) => s + p.amount, 0);
      const interest = (l.principalAmount * l.interestRate) / 100;
      const totalToPay = l.principalAmount + interest;

      if (l.direction === "lend") {
        totalLend += (totalToPay - paid);
      } else {
        totalBorrow += (totalToPay - paid);
      }
    });

    balance = totalLend - totalBorrow;
    return { balance, totalLend, totalBorrow };
  }, [contactLoans, loanPayments]);

  if (!contact) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Pessoa não encontrada</Text>
      </View>
    );
  }

  const handleDeleteContact = () => {
    // Trava de segurança: verificar se há empréstimos pendentes
    const hasPending = contactLoans.some(l => {
      const payments = loanPayments.filter(p => p.loanId === l.id);
      const paid = payments.reduce((s, p) => s + p.amount, 0);
      const interest = (l.principalAmount * l.interestRate) / 100;
      return (l.principalAmount + interest - paid) > 0.01; // Margem para arredondamento
    });

    if (hasPending) {
      if (Platform.OS === "web") {
        window.alert("Pendências Encontradas: Esta pessoa ainda possui empréstimos em aberto. Finalize todos os pagamentos antes de excluir o perfil.");
      } else {
        Alert.alert(
          "Pendências Encontradas",
          "Esta pessoa ainda possui empréstimos em aberto. Finalize todos os pagamentos antes de excluir o perfil.",
          [{ text: "Entendido" }]
        );
      }
      return;
    }

    const confirmMsg = "Tem certeza que deseja remover este perfil? Todos os registros históricos dele serão apagados.";
    
    if (Platform.OS === "web") {
      if (window.confirm(confirmMsg)) {
        removeLoanContact(contact.id).then(() => router.replace("/loans"));
      }
    } else {
      Alert.alert(
        "Excluir Pessoa",
        confirmMsg,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: async () => {
              await removeLoanContact(contact.id);
              router.replace("/loans");
            },
          },
        ]
      );
    }
  };

  const initials = contact.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <Stack.Screen
        options={{
          title: contact.name,
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable 
                onPress={() => router.push({ pathname: "/loans/new-contact", params: { id: contact.id } })}
                hitSlop={8} 
                style={{ padding: 6 }}
              >
                <Feather name="edit-2" size={18} color={colors.foreground} />
              </Pressable>
              <Pressable onPress={handleDeleteContact} hitSlop={8} style={{ padding: 6 }}>
                <Feather name="trash-2" size={18} color={colors.destructive} />
              </Pressable>
            </View>
          ),
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          {/* Cabeçalho do Perfil */}
          <View style={[styles.profileHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ContactAvatar name={contact.name} photo={contact.photo} size={70} />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.foreground }]}>{contact.name}</Text>
              <Text style={[styles.profileBalance, { color: stats.balance >= 0 ? colors.income : colors.expense }]}>
                {stats.balance >= 0 ? "Saldo a Receber" : "Saldo a Pagar"}
              </Text>
              <Text style={[styles.balanceValue, { color: stats.balance >= 0 ? colors.income : colors.expense }]}>
                {formatCurrency(Math.abs(stats.balance))}
              </Text>
            </View>
          </View>

          {/* Dados de Contato */}
          {(contact.phone || contact.address) && (
            <View style={[styles.contactDataBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {contact.phone && (
                <View style={styles.contactDataItem}>
                  <Feather name="phone" size={16} color={colors.mutedForeground} />
                  <Text style={[styles.contactDataText, { color: colors.foreground }]}>{contact.phone}</Text>
                </View>
              )}
              {contact.address && (
                <View style={styles.contactDataItem}>
                  <Feather name="map-pin" size={16} color={colors.mutedForeground} />
                  <Text style={[styles.contactDataText, { color: colors.foreground }]}>{contact.address}</Text>
                </View>
              )}
            </View>
          )}

          {/* Ações Rápidas */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => router.push(`/loans/new?contactId=${contact.id}`)}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="plus" size={20} color={colors.primaryForeground} />
              <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Novo Empréstimo</Text>
            </Pressable>
          </View>

          {/* Lista de Empréstimos */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Empréstimos Ativos</Text>
            {contactLoans.length === 0 ? (
              <EmptyState
                icon="briefcase"
                title="Sem empréstimos"
                description="Clique no botão acima para registrar um novo."
              />
            ) : (
              contactLoans.map((l) => (
                <Pressable
                  key={l.id}
                  onPress={() => router.push({ pathname: "/loans/loan-detail/[id]", params: { id: l.id } })}
                  style={({ pressed }) => [
                    styles.loanCard,
                    { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <View style={[styles.loanIcon, { backgroundColor: l.direction === "lend" ? colors.income + "15" : colors.expense + "15" }]}>
                    <Feather 
                      name={l.direction === "lend" ? "arrow-up-right" : "arrow-down-left"} 
                      size={20} 
                      color={l.direction === "lend" ? colors.income : colors.expense} 
                    />
                  </View>
                  <View style={styles.loanInfo}>
                    <Text style={[styles.loanDesc, { color: colors.foreground }]} numberOfLines={1}>
                      {l.description}
                    </Text>
                    <Text style={[styles.loanDate, { color: colors.mutedForeground }]}>
                      Início em {formatDate(l.startDate)}
                    </Text>
                  </View>
                  <View style={styles.loanValueBox}>
                    <Text style={[styles.loanValue, { color: colors.foreground }]}>
                      {formatCurrency(l.principalAmount)}
                    </Text>
                    <Text style={[styles.loanType, { color: colors.mutedForeground }]}>
                      {l.type === "monthly_interest" ? `${l.interestRate}%/mês` : `${l.installmentsCount}x`}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
    gap: 24,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 20,
  },
  contactDataBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginTop: -8,
  },
  contactDataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contactDataText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  profileBalance: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  loanCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  loanIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  loanInfo: {
    flex: 1,
    gap: 2,
  },
  loanDesc: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  loanDate: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  loanValueBox: {
    alignItems: "flex-end",
    gap: 2,
  },
  loanValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  loanType: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
