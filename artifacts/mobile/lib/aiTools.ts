import type { ToolDefinition } from "./openrouter";
import type { Category, Recurring, Transaction, TransactionType } from "./types";
import { genId, todayIso } from "./format";

export type AddTransactionArgs = {
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  date?: string;
};

export type ListTransactionsArgs = {
  type?: TransactionType | "all";
  category?: string;
  month?: number;
  year?: number;
  limit?: number;
};

export type SummaryArgs = {
  month?: number;
  year?: number;
};

export type AddRecurringArgs = {
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  dayOfMonth: number;
};

export type DeleteTransactionArgs = {
  id?: string;
  description?: string;
};

export const AI_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "add_transaction",
      description:
        "Adiciona uma transação financeira (entrada/income ou gasto/expense). Use quando o usuário mencionar um gasto ou entrada para registrar.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["income", "expense"], description: "Tipo: 'income' para entrada, 'expense' para gasto" },
          amount: { type: "number", description: "Valor positivo em reais (ex: 50.00)" },
          category: {
            type: "string",
            description: "Nome da categoria (ex: 'Alimentação', 'Salário'). Veja a lista em get_categories.",
          },
          description: { type: "string", description: "Breve descrição opcional (ex: 'almoço no restaurante')" },
          date: { type: "string", description: "Data ISO opcional (YYYY-MM-DD). Padrão é hoje." },
        },
        required: ["type", "amount", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_transactions",
      description: "Lista transações do usuário com filtros opcionais. Use para consultas como 'meus gastos com comida esse mês'.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["income", "expense", "all"], description: "Filtrar por tipo" },
          category: { type: "string", description: "Filtrar por nome da categoria" },
          month: { type: "number", description: "Mês 1-12 (opcional)" },
          year: { type: "number", description: "Ano 4 dígitos (opcional)" },
          limit: { type: "number", description: "Máximo de resultados (padrão 20)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_summary",
      description: "Retorna resumo financeiro (total de entradas, gastos, saldo, gastos por categoria) para um período.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "number", description: "Mês 1-12. Se omitido junto a year, usa mês atual." },
          year: { type: "number", description: "Ano 4 dígitos. Se omitido, usa ano atual." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_categories",
      description: "Retorna a lista de categorias disponíveis (entrada e gasto).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "add_recurring",
      description: "Adiciona um gasto/entrada recorrente que se repete todo mês em um dia específico (ex: aluguel, assinaturas).",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["income", "expense"] },
          amount: { type: "number", description: "Valor positivo em reais" },
          category: { type: "string", description: "Nome da categoria" },
          description: { type: "string", description: "Descrição (ex: 'Netflix', 'Aluguel')" },
          dayOfMonth: { type: "number", description: "Dia do mês (1-31)" },
        },
        required: ["type", "amount", "category", "dayOfMonth"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_transaction",
      description: "Remove uma transação. Forneça o id se já souber, senão uma descrição para buscar.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          description: { type: "string" },
        },
      },
    },
  },
];

export type ToolHandlers = {
  addTransaction: (args: AddTransactionArgs) => Promise<{ ok: boolean; transaction?: Transaction; error?: string }>;
  listTransactions: (args: ListTransactionsArgs) => Promise<{ transactions: (Transaction & { categoryName: string })[]; total: number }>;
  getSummary: (args: SummaryArgs) => Promise<{
    period: string;
    income: number;
    expense: number;
    balance: number;
    byCategory: { category: string; type: TransactionType; total: number }[];
  }>;
  getCategories: () => Promise<{ income: { id: string; name: string }[]; expense: { id: string; name: string }[] }>;
  addRecurring: (args: AddRecurringArgs) => Promise<{ ok: boolean; recurring?: Recurring; error?: string }>;
  deleteTransaction: (args: DeleteTransactionArgs) => Promise<{ ok: boolean; deleted?: number; error?: string }>;
};

function findCategory(categories: Category[], name: string, type: TransactionType): Category | undefined {
  const norm = name.trim().toLowerCase();
  return (
    categories.find((c) => c.type === type && c.name.toLowerCase() === norm) ||
    categories.find((c) => c.type === type && c.name.toLowerCase().includes(norm)) ||
    categories.find((c) => c.type === type && c.id.toLowerCase().includes(norm))
  );
}

export function buildToolHandlers(deps: {
  transactions: Transaction[];
  categories: Category[];
  addTransaction: (t: Transaction) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  addRecurring: (r: Recurring) => Promise<void>;
}): ToolHandlers {
  return {
    async addTransaction(args) {
      if (!args || typeof args.amount !== "number" || args.amount <= 0) {
        return { ok: false, error: "amount inválido" };
      }
      const cat = findCategory(deps.categories, args.category || "", args.type);
      if (!cat) {
        const list = deps.categories
          .filter((c) => c.type === args.type)
          .map((c) => c.name)
          .join(", ");
        return { ok: false, error: `Categoria não encontrada. Categorias de ${args.type === "income" ? "entrada" : "gasto"}: ${list}` };
      }
      const date = args.date ? new Date(args.date).toISOString() : todayIso();
      const tx: Transaction = {
        id: genId(),
        type: args.type,
        amount: args.amount,
        categoryId: cat.id,
        description: args.description?.trim() || cat.name,
        date,
        createdAt: new Date().toISOString(),
      };
      await deps.addTransaction(tx);
      return { ok: true, transaction: tx };
    },

    async listTransactions(args) {
      let list = [...deps.transactions];
      if (args.type && args.type !== "all") list = list.filter((t) => t.type === args.type);
      if (args.category) {
        const cat = deps.categories.find((c) => c.name.toLowerCase() === args.category!.toLowerCase());
        if (cat) list = list.filter((t) => t.categoryId === cat.id);
      }
      if (args.month || args.year) {
        const now = new Date();
        const month = (args.month ?? now.getMonth() + 1) - 1;
        const year = args.year ?? now.getFullYear();
        list = list.filter((t) => {
          const d = new Date(t.date);
          return d.getMonth() === month && d.getFullYear() === year;
        });
      }
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const limit = args.limit ?? 20;
      const sliced = list.slice(0, limit);
      const enriched = sliced.map((t) => ({
        ...t,
        categoryName: deps.categories.find((c) => c.id === t.categoryId)?.name ?? "?",
      }));
      return { transactions: enriched, total: list.length };
    },

    async getSummary(args) {
      const now = new Date();
      const month = (args.month ?? now.getMonth() + 1) - 1;
      const year = args.year ?? now.getFullYear();
      const period = args.month ? `${(month + 1).toString().padStart(2, "0")}/${year}` : `${year}`;

      let list = deps.transactions;
      if (args.month) {
        list = list.filter((t) => {
          const d = new Date(t.date);
          return d.getMonth() === month && d.getFullYear() === year;
        });
      } else if (args.year || true) {
        list = list.filter((t) => new Date(t.date).getFullYear() === year);
      }

      const income = list.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

      const byCatMap = new Map<string, number>();
      for (const t of list) {
        const cat = deps.categories.find((c) => c.id === t.categoryId);
        if (!cat) continue;
        const key = `${cat.type}:${cat.name}`;
        byCatMap.set(key, (byCatMap.get(key) ?? 0) + t.amount);
      }
      const byCategory = Array.from(byCatMap.entries())
        .map(([k, total]) => {
          const [type, name] = k.split(":");
          return { category: name!, type: type as TransactionType, total };
        })
        .sort((a, b) => b.total - a.total);

      return { period, income, expense, balance: income - expense, byCategory };
    },

    async getCategories() {
      return {
        income: deps.categories.filter((c) => c.type === "income").map((c) => ({ id: c.id, name: c.name })),
        expense: deps.categories.filter((c) => c.type === "expense").map((c) => ({ id: c.id, name: c.name })),
      };
    },

    async addRecurring(args) {
      if (!args || typeof args.amount !== "number" || args.amount <= 0) {
        return { ok: false, error: "amount inválido" };
      }
      if (!args.dayOfMonth || args.dayOfMonth < 1 || args.dayOfMonth > 31) {
        return { ok: false, error: "dayOfMonth deve ser entre 1 e 31" };
      }
      const cat = findCategory(deps.categories, args.category || "", args.type);
      if (!cat) return { ok: false, error: "Categoria não encontrada" };
      const r: Recurring = {
        id: genId(),
        type: args.type,
        amount: args.amount,
        categoryId: cat.id,
        description: args.description?.trim() || cat.name,
        dayOfMonth: args.dayOfMonth,
        active: true,
        createdAt: new Date().toISOString(),
      };
      await deps.addRecurring(r);
      return { ok: true, recurring: r };
    },

    async deleteTransaction(args) {
      let target: Transaction | undefined;
      if (args.id) target = deps.transactions.find((t) => t.id === args.id);
      if (!target && args.description) {
        const norm = args.description.toLowerCase();
        target = deps.transactions.find((t) => t.description.toLowerCase().includes(norm));
      }
      if (!target) return { ok: false, error: "Transação não encontrada" };
      await deps.removeTransaction(target.id);
      return { ok: true, deleted: 1 };
    },
  };
}

export const SYSTEM_PROMPT = `Você é o assistente do Bolso, um app brasileiro de controle financeiro pessoal. Seu papel principal é ajudar o usuário a gerenciar finanças, mas você também pode conversar sobre qualquer assunto naturalmente.

Diretrizes:
- Sempre responda em português do Brasil.
- Use as ferramentas disponíveis para realmente adicionar, consultar e remover dados — não invente números.
- Quando o usuário descrever um gasto ou entrada (ex: "gastei 30 no almoço"), use add_transaction imediatamente, sem pedir confirmação para valores triviais.
- Para perguntas tipo "quanto gastei...", chame list_transactions ou get_summary com os filtros adequados.
- Valores em reais (R$). Quando responder, formate como "R$ 45,90".
- Seja breve, claro e natural. Não use emojis.
- Se for tema fora de finanças, converse normalmente como um assistente útil.`;
