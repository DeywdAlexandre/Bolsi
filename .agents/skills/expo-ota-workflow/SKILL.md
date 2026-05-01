---
name: expo-ota-workflow
description: Use para gerenciar atualizações Over-The-Air (OTA) e garantir que as mudanças no código cheguem aos usuários sem novo build nativo.
---
# Expo OTA Workflow (Bolso)

O Bolso utiliza `expo-updates` para manter o app atualizado dinamicamente.

## Regras de Deploy
1. **Branch Preview**: Use `eas update --branch preview` para testar mudanças antes de ir para produção.
2. **Runtime Version**: Nunca mude dependências nativas (que exigem `npx expo prebuild`) sem avisar. Isso quebra o OTA se a `runtimeVersion` mudar.
3. **Mensagens de Update**: Sempre use mensagens descritivas nos deploys (ex: "feat: novo cálculo de KM/L no Finn").
4. **Consistência de Ambiente**: O `app.json` deve manter o `projectId` e `owner: deywd`.

## Procedimento de Deploy
- Passo 1: Verificar lints e tipos (`pnpm run typecheck`).
- Passo 2: Rodar `eas update` especificando a branch desejada.
- Passo 3: Testar no Expo Go ou Development Client.
