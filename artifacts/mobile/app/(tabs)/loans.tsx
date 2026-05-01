import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { EmptyState } from "@/components/EmptyState";
import { ContactAvatar } from "@/components/ContactAvatar";
import { useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/lib/format";
import type { LoanContact } from "@/lib/types";

export default function LoansDashboard() {
  const colors = useColors();
  const { loanContacts, loans, loanPayments } = useAppData();
  const [search, setSearch] = useState("");

  // Cálculos de Resumo
  const stats = useMemo(() => {
    let toReceive = 0;
    let toReceiveInterest = 0;
    let toPay = 0;
    let toPayInterest = 0;
    let overdueCount = 0;

    loans.forEach((l) => {
      if (l.status === "active") {
        const payments = loanPayments.filter((p) => p.loanId === l.id);
        const paidPrincipal = payments.reduce((s, p) => s + p.principalPaid, 0);
        const remainingPrincipal = l.principalAmount - paidPrincipal;
        const currentInterest = (remainingPrincipal * l.interestRate) / 100;

        if (l.direction === "lend") {
          toReceive += remainingPrincipal + currentInterest;
          toReceiveInterest += currentInterest;
        } else {
          toPay += remainingPrincipal + currentInterest;
          toPayInterest += currentInterest;
        }
      }
    });

    return { toReceive, toReceiveInterest, toPay, toPayInterest, overdueCount };
  }, [loans, loanPayments]);

  const filteredContacts = useMemo(() => {
    return loanContacts.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [loanContacts, search]);

  const renderContact = ({ item }: { item: LoanContact }) => {
    return (
      <Pressable
        onPress={() => router.push({ pathname: "/loans/[id]", params: { id: item.id } })}
        style={({ pressed }) => [
          styles.contactCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <ContactAvatar name={item.name} photo={item.photo} size={50} />
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.foreground }]}>
            {item.name}
          </Text>
          <Text style={[styles.contactSub, { color: colors.mutedForeground }]}>
            Clique para ver empréstimos
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBackground, { backgroundColor: colors.primary, height: 200 }]} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primaryForeground }]}>Empréstimos</Text>
        
        {/* Cards de Resumo */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>A Receber</Text>
            <Text style={[styles.statValue, { color: colors.income }]}>
              {formatCurrency(stats.toReceive)}
            </Text>
            <Text style={[styles.statSub, { color: colors.mutedForeground }]}>
              Juros: {formatCurrency(stats.toReceiveInterest)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>A Pagar</Text>
            <Text style={[styles.statValue, { color: colors.expense }]}>
              {formatCurrency(stats.toPay)}
            </Text>
            <Text style={[styles.statSub, { color: colors.mutedForeground }]}>
              Juros: {formatCurrency(stats.toPayInterest)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.muted }]}>
            <Feather name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              placeholder="Buscar pessoa..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <Pressable
            onPress={() => router.push("/loans/new-contact")}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="plus" size={24} color={colors.primaryForeground} />
          </Pressable>
        </View>

        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="users"
              title="Nenhuma pessoa"
              description="Adicione contatos para gerenciar empréstimos."
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: -10,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  statSub: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  searchRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingBottom: 40,
    gap: 12,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  contactSub: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
