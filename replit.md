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
- Histórico completo (estilo extrato) com:
  - Seletor de período: Mês, Ano ou intervalo de datas (DD/MM – DD/MM) com calendário e atalhos (Hoje, 7 dias, 30 dias, Mês atual).
  - Filtros por tipo (Tudo / Gastos / Entradas) e por categoria.
  - Barra de totais (Entradas / Gastos / Saldo) do período filtrado.
  - Lista agrupada por dia.
- Recorrências (assinaturas, aluguel, salário): cadastra com dia do mês e o app aplica automaticamente.
- Categorias padrão (Alimentação, Transporte, etc.) + criação de categorias personalizadas com ícone e cor.
- Bolinha flutuante de IA visível em todas as telas com:
  - Chat livre (qualquer assunto)
  - Tool calling para `add_transaction`, `list_transactions`, `get_summary`, `get_categories`, `add_recurring`, `delete_transaction`.
  - Multi-round (até 4 rodadas de ferramenta por mensagem).
  - Botão de microfone (ditado em pt-BR): Web Speech API no navegador, expo-speech-recognition no celular (requer dev build/APK; em Expo Go o botão fica oculto).
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
- `expo-speech-recognition`
- `date-fns`

## Build (gerar APK com EAS)

Configurado em `artifacts/mobile/eas.json` com 3 perfis:

- **development** — APK com dev client (para testes em ambiente local).
- **preview** — APK Android distribuição interna (instala diretamente no celular). É o perfil recomendado para o usuário gerar e usar.
- **production** — App Bundle (`.aab`) para Play Store, com auto-incremento.

Identidade do app: `com.bolso.app` (Android `package` + iOS `bundleIdentifier`).

Comandos a partir de `artifacts/mobile/`:

```bash
# 1. Login na conta Expo (uma vez)
npx eas-cli@latest login

# 2. Inicializar projeto EAS (uma vez — cria o projectId em app.json)
npx eas-cli@latest init

# 3. Gerar APK de teste (preview)
npx eas-cli@latest build --platform android --profile preview
```

O build roda na nuvem da Expo (gratuito até o limite mensal) e ao final entrega um link `.apk` para baixar e instalar no celular. Atualizações JS subsequentes podem ser entregues via `npx eas-cli@latest update --channel preview` sem precisar gerar APK novo.

Quando mudar algo nativo (libs novas, permissões, ícone), gerar APK novo. Reinstalar por cima preserva todos os dados locais.
