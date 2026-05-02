# 📱 Projeto Bolso - Status & Roadmap

O **Bolso** é um assistente financeiro pessoal "Offline-First" com inteligência artificial integrada, focado em simplicidade, privacidade e controle total de gastos, veículos e empréstimos.

---

## 🏗️ Arquitetura e Tech Stack
- **Framework**: React Native com Expo (SDK 54).
- **Navegação**: Expo Router (File-based routing).
- **Persistência**: AsyncStorage & SecureStore.
- **IA**: Integrado com OpenRouter (Assistente Finn).
- **Estilo**: Premium Minimalista (Mercado Pago Style / Dark Mode).
- **Deploy**: Expo Updates (OTA Workflow).

---

## ✅ Módulos Implementados

### 1. Dashboard & Extrato
- Resumo de Saldo, Entradas e Gastos.
- Gráfico de gastos por categoria.
- Lista de transações recentes com badges de identificação.
- Filtro por período e visão detalhada de histórico.

### 2. Veículos
- Gestão de múltiplos veículos, log de abastecimentos e controle de trocas de óleo.

### 3. Empréstimos & CRM
- Gestão de contatos, juros mensais vs. parcelas fixas, e abates inteligentes.

### 4. Metas & Futuro (Novo 🚀)
- **Simulador Inteligente**: Projeção com juros compostos baseada em CDI (customizável) ou Poupança.
- **Modos de Meta**: Valor Alvo (sonhos com prazo) ou Hábito Mensal (investimento recorrente).
- **Rendimento Automático**: O app aplica juros mensalmente sobre o saldo das metas de forma autônoma.
- **Visão de Futuro**: Projeções visuais para 1, 2, 5 e 10 anos.
- **Gestão de Aportes**: Registro de depósitos manuais com integração opcional ao extrato de gastos.

### 5. Gestão de Assinaturas (Recorrências)
- Marcação de gastos fixos como "Assinatura".
- Cálculo automático de **Custo Anual** para conscientização financeira.
- Badges `[ASSIN]` no Dashboard e lista de Fixos.

### 6. IA Finn
- Inserção de dados via chat e consulta inteligente de empréstimos e status financeiro.

---

## 📈 Log de Atualizações Recentes (02/05/2026)

- **Feature**: Lançamento do módulo **Metas & Futuro** com simulador CDI.
- **Feature**: Implementação do sistema de **Rendimento Automático** mensal para metas.
- **Feature**: Evolução do módulo de Fixos para suporte a **Assinaturas** com projeção anual.
- **UX**: Refatoração da Barra de Navegação (Tab Bar) - Meta agora é um módulo de primeira classe.
- **UX**: Design de Detalhes de Meta imersivo e colorido de acordo com o objetivo.
- **Math**: Fórmulas financeiras corrigidas para considerar PV (Saldo Atual) + PMT (Aportes) nas projeções.

---

## ⏳ Próximos Passos (Backlog)

### 🚀 Prioridade Máxima: Próximo Build Nativo
- [ ] **EAS Build (Android/iOS)**: Gerar instaladores reais.
- [ ] **Proteção Biométrica**: Digital/Face ID ao abrir o app.
- [ ] **Notificações Push**: Alertas de vencimento de assinaturas e metas.

### 📡 Para Atualização via OTA (Apenas código)
- [ ] **Backup JSON**: Implementar exportação e importação real de dados.
- [ ] **Relatórios PDF**: Gerar extratos mensais profissionais.
- [ ] **Gamificação**: Medalhas por metas alcançadas ou meses de economia.

---
*Atualizado por Antigravity em 02/05/2026 - Versão Premium 1.2*
