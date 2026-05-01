# 📱 Projeto Bolso - Status & Roadmap

O **Bolso** é um assistente financeiro pessoal "Offline-First" com inteligência artificial integrada, focado em simplicidade, privacidade e controle total de gastos, veículos e empréstimos.

---

## 🏗️ Arquitetura e Tech Stack
- **Framework**: React Native com Expo (SDK 54).
- **Navegação**: Expo Router (File-based routing).
- **Persistência**: AsyncStorage & SecureStore.
- **IA**: Integrado com OpenRouter (Assistente Finn).
- **Estilo**: Premium Minimalista (Dark Mode por padrão).
- **Deploy**: Expo Updates (OTA Workflow).

---

## ✅ Módulos Implementados

### 1. Dashboard & Extrato
- Resumo de Saldo, Entradas e Gastos.
- Gráfico de gastos por categoria.
- Lista de transações recentes com badges de identificação (fixo, empréstimo, etc).
- **Novo**: Tela de Extrato Completo com filtro por período.

### 2. Veículos
- Gestão de múltiplos veículos.
- Log de abastecimentos (cálculo automático de KM/L).
- Controle de trocas de óleo com alertas de validade.

### 3. Empréstimos & CRM (Módulo Atual)
- **Gestão de Pessoas**: Cadastro de contatos com Nome, Telefone e Endereço.
- **Tipos de Empréstimo**: Suporte a Juros Mensais (renovação) e Parcelas Fixas (financiamento).
- **Lógica Inteligente**:
    - Abate automático (Juros primeiro, depois Principal).
    - Atalho para pagamento de "Apenas Juros".
    - Registro opcional no extrato principal.
- **Trava de Segurança**: Impede a exclusão de contatos com saldo devedor/a receber pendente.

### 4. IA Finn
- Conversa natural sobre finanças.
- **Inserção Direta**: Adiciona transações e recorrências via chat.
- **Integração com Empréstimos**: O Finn consegue consultar quem deve, quanto deve e registrar pagamentos apenas por voz/texto.

---

## 📈 Log de Atualizações Recentes (01/05/2026)

- **Feature**: Lançamento do Módulo de Empréstimos completo.
- **Feature**: Adição de campos de CRM (Telefone/Endereço) no perfil do contato.
- **UX**: Implementação de badges no extrato para identificar transações de empréstimo.
- **UX**: Atalho "Apenas Juros" no modal de pagamento.
- **Fix**: Correção do erro de rota no "Ver tudo" do Dashboard (restauração do Histórico).
- **Fix**: Compatibilidade de alertas de exclusão entre Web e Mobile (Platform OS check).
- **IA**: Novas `tools` para o Finn gerenciar pagamentos e consultar dívidas.
- **Deploy**: Primeira atualização via OTA realizada com sucesso para as branches `production` e `preview`.

---

## ⏳ Próximos Passos (Backlog)

### 🚀 Prioridade Máxima: Próximo Build Nativo
- [ ] **EAS Build (Android/iOS)**: Gerar instaladores (.apk e .ipa) para testar o app em ambiente real.
- [ ] **Proteção Biométrica**: Solicitar digital/face ID ao abrir o app (exige build nativo).
- [ ] **Sistema de Alertas/Notificações**: Avisar sobre vencimentos e trocas de óleo (exige build nativo).

### 📡 Para Atualização via OTA (Apenas código)
- [ ] **Módulo de Metas**: Criar interface de objetivos e sonhos financeiros (Próximo grande módulo).
- [ ] **Backup JSON**: Implementar a lógica real dos botões de exportação e importação.
- [ ] **Relatórios**: Gerar extratos detalhados em PDF.

---

## 💾 Estratégia de Backup e Sincronização (Planejado)

Para garantir a segurança dos dados e a persistência em caso de troca de dispositivo:

### Fase 1: Exportação/Importação Manual (JSON)
- **Exportar**: Gerar um arquivo `bolso_backup_YYYYMMDD.json` com o dump completo do `AsyncStorage`.
- **Importar**: Leitura do arquivo JSON com validação de esquema antes de sobrescrever o banco local.
- **Partilha**: Uso do `expo-sharing` para permitir enviar o arquivo para WhatsApp, E-mail ou Nuvem.

### Fase 2: Sincronização com Google Drive (Premium)
- **Integração OAuth 2.0**: Autenticação via Google para salvar na pasta oculta `appData`.
- **Sobrescrita Inteligente**: Opção para manter apenas o backup mais recente ou as últimas 3 versões.
- **Sincronização Automática**: Backup disparado após grandes alterações ou ao fechar o app.

### 🛡️ Compatibilidade de Versões (Data Migration)
- **Versionamento**: Cada backup terá um campo `version`.
- **Migradores**: Lógica interna no app para "traduzir" dados de versões antigas para novos formatos de módulos futuros, garantindo que o app nunca trave ao restaurar dados do passado.

---
*Atualizado por Antigravity em 01/05/2026 - Versão Premium 1.1*
