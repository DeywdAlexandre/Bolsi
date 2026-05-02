import React, { useMemo, useState, useEffect } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
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
  const [isExpanded, setIsExpanded] = useState(false);

  // Ativar LayoutAnimation no Android
  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  // Cálculos de Resumo
  const stats = useMemo(() => {
    let toReceive = 0;
    let toPay = 0;
    
    // Novos indicadores
    let monthlyProjection = 0;
    let interestToReceiveTotal = 0;
    let interestToReceivePending = 0;
    let interestToPayTotal = 0;
    let interestToPayPending = 0;
    let installmentsToReceiveTotal = 0;
    let installmentsToReceiveRemaining = 0;
    let installmentsToPayTotal = 0;
    let installmentsToPayRemaining = 0;

    loans.forEach((l) => {
      if (l.status === "active") {
        const payments = loanPayments.filter((p) => p.loanId === l.id);
        const paidPrincipal = payments.reduce((s, p) => s + p.principalPaid, 0);
        const paidInterest = payments.reduce((s, p) => s + p.interestPaid, 0);
        const totalPaid = paidPrincipal + paidInterest;
        
        const isLend = l.direction === "lend";
        const isMonthly = l.type === "monthly_interest";
        const remainingPrincipal = l.principalAmount - paidPrincipal;
        
        // Cálculo de Juros e Totais
        const contractedInterest = (l.principalAmount * l.interestRate) / 100;
        const totalContractedValue = l.principalAmount + contractedInterest;
        
        // Juros pendentes para Mensal considera o juros do saldo atual
        const currentPendingInterest = isMonthly 
          ? (remainingPrincipal * l.interestRate) / 100 
          : Math.max(0, contractedInterest - paidInterest);

        const currentMonthlyValue = isMonthly 
          ? currentPendingInterest 
          : (totalContractedValue / (l.installmentsCount || 1));

        const remainingTotal = Math.max(0, totalContractedValue - totalPaid);

        if (isLend) {
          toReceive += remainingPrincipal + currentPendingInterest;
          monthlyProjection += currentMonthlyValue;
          
          interestToReceiveTotal += isMonthly ? (paidInterest + currentPendingInterest) : contractedInterest;
          interestToReceivePending += currentPendingInterest;
          
          if (!isMonthly) {
            installmentsToReceiveTotal += totalContractedValue;
            installmentsToReceiveRemaining += remainingTotal;
          }
        } else {
          toPay += remainingPrincipal + currentPendingInterest;
          monthlyProjection -= currentMonthlyValue; // Saída de caixa reduz a projeção líquida
          
          interestToPayTotal += isMonthly ? (paidInterest + currentPendingInterest) : contractedInterest;
          interestToPayPending += currentPendingInterest;

          if (!isMonthly) {
            installmentsToPayTotal += totalContractedValue;
            installmentsToPayRemaining += remainingTotal;
          }
        }
      }
    });

    const netBalance = toReceive - toPay;
    const netInterestProfit = interestToReceivePending - interestToPayPending;

    return { 
      toReceive, 
      toPay, 
      monthlyProjection,
      interestToReceiveTotal,
      interestToReceivePending,
      interestToPayTotal,
      interestToPayPending,
      installmentsToReceiveTotal,
      installmentsToReceiveRemaining,
      installmentsToPayTotal,
      installmentsToPayRemaining,
      netBalance,
      netInterestProfit
    };
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
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.primaryForeground }]}>Empréstimos</Text>
          <Pressable 
            onPress={toggleExpand}
            style={[styles.expandBtn, { backgroundColor: colors.primaryForeground + "20" }]}
          >
            <Feather 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.primaryForeground} 
            />
            <Text style={[styles.expandBtnText, { color: colors.primaryForeground }]}>
              {isExpanded ? "Recolher" : "Detalhes"}
            </Text>
          </Pressable>
        </View>
        
        {/* Cards de Resumo Principais */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>A Receber</Text>
            <Text style={[styles.statValue, { color: colors.income }]}>
              {formatCurrency(stats.toReceive)}
            </Text>
            <Text style={[styles.statSub, { color: colors.mutedForeground }]}>
              Principal + Juros
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>A Pagar</Text>
            <Text style={[styles.statValue, { color: colors.expense }]}>
              {formatCurrency(stats.toPay)}
            </Text>
            <Text style={[styles.statSub, { color: colors.mutedForeground }]}>
              Dívida Total
            </Text>
          </View>
        </View>

        {/* Grade de Detalhes (Expansível) */}
        {isExpanded && (
          <View style={styles.expandedGrid}>
            <View style={styles.gridRow}>
              {/* Card 1: Previsão */}
              <View style={[styles.miniCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.miniHeader}>
                  <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>Projeção Mês</Text>
                  <Pressable onPress={() => alert("Soma do juros mensal + valor das parcelas fixas previstas para o período atual.")}>
                    <Feather name="help-circle" size={12} color={colors.mutedForeground} />
                  </Pressable>
                </View>
                <Text style={[styles.miniValue, { color: stats.monthlyProjection >= 0 ? colors.income : colors.expense }]}>
                  {formatCurrency(Math.abs(stats.monthlyProjection))}
                </Text>
                <Text style={[styles.miniSub, { color: colors.mutedForeground }]}>Fluxo Estimado</Text>
              </View>

              {/* Card 2: Juros a Receber */}
              <View style={[styles.miniCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>Juros a Receber</Text>
                <Text style={[styles.miniValue, { color: colors.foreground }]}>
                  {formatCurrency(stats.interestToReceiveTotal)}
                </Text>
                <Text style={[styles.miniSub, { color: colors.income }]}>
                  Pend: {formatCurrency(stats.interestToReceivePending)}
                </Text>
              </View>

              {/* Card 3: Juros a Pagar */}
              <View style={[styles.miniCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>Juros a Pagar</Text>
                <Text style={[styles.miniValue, { color: colors.foreground }]}>
                  {formatCurrency(stats.interestToPayTotal)}
                </Text>
                <Text style={[styles.miniSub, { color: colors.expense }]}>
                  Pend: {formatCurrency(stats.interestToPayPending)}
                </Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              {/* Card 4: Parcelados (Geral) */}
              <View style={[styles.miniCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>Parcelados</Text>
                <Text style={[styles.miniValue, { color: colors.foreground }]}>
                  {formatCurrency(stats.installmentsToReceiveTotal)}
                </Text>
                <Text style={[styles.miniSub, { color: colors.mutedForeground }]}>
                  Resto: {formatCurrency(stats.installmentsToReceiveRemaining)}
                </Text>
              </View>

              {/* Card 5: Balanço Líquido */}
              <View style={[styles.miniCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>Saldo Líquido</Text>
                <Text style={[styles.miniValue, { color: stats.netBalance >= 0 ? colors.income : colors.expense }]}>
                  {formatCurrency(Math.abs(stats.netBalance))}
                </Text>
                <Text style={[styles.miniSub, { color: colors.mutedForeground }]}>
                  Net: {formatCurrency(stats.netInterestProfit)} (Juros)
                </Text>
              </View>

              {/* Card 6: Parcelados Pagar */}
              <View style={[styles.miniCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>Parcelas Pagar</Text>
                <Text style={[styles.miniValue, { color: colors.foreground }]}>
                  {formatCurrency(stats.installmentsToPayTotal)}
                </Text>
                <Text style={[styles.miniSub, { color: colors.mutedForeground }]}>
                  Resto: {formatCurrency(stats.installmentsToPayRemaining)}
                </Text>
              </View>
            </View>
          </View>
        )}
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
    paddingBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  expandBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
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
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  expandedGrid: {
    marginTop: 16,
    gap: 10,
  },
  gridRow: {
    flexDirection: "row",
    gap: 10,
  },
  miniCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    justifyContent: "center",
  },
  miniHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  miniLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
  },
  miniValue: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  miniSub: {
    fontSize: 9,
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
