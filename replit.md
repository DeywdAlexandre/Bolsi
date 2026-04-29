# Bolso — Controle financeiro pessoal

App mobile (Expo / React Native) em português brasileiro para controlar entradas e gastos pessoais.

## Visão geral

- **Tema**: dark mode premium inspirado em Robinhood / Cash App, com primary verde esmeralda.
- **Idioma**: pt-BR. Moeda BRL (R$).
- **Persistência**: 100% local — AsyncStorage para dados, expo-secure-store (com fallback localStorage no web) para a chave da API.
- **Sem backend.**

## Funcionalidades

- Adicionar / editar / excluir transações (entradas e gastos).
- Dashboard organizado por período (mês ou ano), com seletor visual e picker de mês/ano.
- Cartões de saldo, entradas e gastos.
- Quebra por categoria com barras proporcionais.
- Histórico completo com filtros por tipo e categoria, agrupado por dia.
- Recorrências (assinaturas, aluguel, salário): cadastra com dia do mês e o app aplica automaticamente.
- Categorias padrão (Alimentação, Transporte, etc.) + criação de categorias personalizadas com ícone e cor.
- Bolinha flutuante de IA visível em todas as telas com:
  - Chat livre (qualquer assunto)
  - Tool calling para `add_transaction`, `list_transactions`, `get_summary`, `get_categories`, `add_recurring`, `delete_transaction`.
  - Multi-round (até 4 rodadas de ferramenta por mensagem).
- Configurações com chave OpenRouter, escolha do modelo (sugestões: gpt-4o-mini padrão, gemini-2.0-flash, claude-3.5-haiku, deepseek-chat, gpt-4o), e reset de dados.

## Estrutura

```
artifacts/mobile/
  app/
    _layout.tsx                  Stack root + providers + ChatSheet overlay
    (tabs)/
      _layout.tsx                Tabs (Início, Histórico, Fixos) + ChatFAB
      index.tsx                  Dashboard
      history.tsx                Lista filtrada agrupada por dia
      recurring.tsx              Lista de recorrências com switch ativo
    transaction/{new,[id]}.tsx   Formulário de transação (modal)
    recurring/{new,[id]}.tsx     Formulário de recorrência (modal)
    settings.tsx                 Configurações (chave + modelo)
    categories.tsx               Gerenciamento de categorias
  components/                    UI atomica (AmountInput, IconCircle,
                                 CategoryPicker, PeriodSelector,
                                 SummaryCards, CategoryBreakdown,
                                 TransactionItem, EmptyState,
                                 ChatFAB, ChatSheet, etc.)
  contexts/
    AppDataContext.tsx           transactions/recurring/categories +
                                 aplicação automática de recorrências
    SettingsContext.tsx          settings + apiKey via SecureStore
    ChatContext.tsx              histórico do chat + execução de tools
  lib/
    types.ts | format.ts | categories.ts | storage.ts | secureStorage.ts
    openrouter.ts                Cliente OpenRouter (chat completions)
    aiTools.ts                   Definições de tools + handlers + system prompt
  constants/colors.ts            Paleta dark
  hooks/useColors.ts
```

## Notas técnicas

- O contexto de dados aplica recorrências quando o app abre: para cada recorrência ativa cujo `dayOfMonth` já passou no mês corrente e ainda não tem `lastApplied` neste mês, gera uma transação automaticamente e marca `lastApplied`.
- O ChatContext executa rodadas de tool calling reais: enquanto o modelo retornar `tool_calls`, ele executa, anexa os resultados como mensagens role=`tool` e refaz a chamada. Limite: 4 rodadas.
- A chave da API nunca aparece em logs e é armazenada em SecureStore (Keychain/Keystore). No web, cai para `localStorage` (apenas para preview de desenvolvimento).
- Toda comunicação com OpenRouter usa `expo/fetch` para compatibilidade com React Native.
- Não usar `console.log` em servidor — não há servidor neste app.

## Pacotes adicionados além do scaffold

- `@react-native-async-storage/async-storage` (já no scaffold)
- `expo-secure-store@~15.0.8` (pinado à versão do SDK 54)
- `date-fns`
