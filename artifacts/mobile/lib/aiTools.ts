import type { ToolDefinition } from "./openrouter";
import type { Category, Recurring, Transaction, TransactionType } from "./types";
import { genId, todayIso } from "./format";
import { computeVehicleStats, formatKmPerLiter, formatKm } from "./vehicleStats";
import { generateLoanReport as generatePDF } from "./reports";

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

export type AddVehicleExpenseArgs = {
  vehicleName: string;
  description: string;
  amount: number;
  odometer?: number;
  date?: string;
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
  {
    type: "function",
    function: {
      name: "add_loan_contact",
      description: "Adiciona uma nova pessoa ao módulo de Empréstimos.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome completo da pessoa" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_loan_contacts",
      description: "Lista as pessoas cadastradas no módulo de empréstimos e seus saldos devedores ou a receber.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_loans",
      description: "Lista os empréstimos ativos de uma pessoa específica ou todos.",
      parameters: {
        type: "object",
        properties: {
          contactName: { type: "string", description: "Opcional: nome da pessoa para filtrar" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_loan_payment",
      description: "Registra um pagamento ou recebimento referente a um empréstimo.",
      parameters: {
        type: "object",
        properties: {
          loanDescription: { type: "string", description: "Descrição do empréstimo para identificar qual pagar (ex: 'reforma')" },
          amount: { type: "number", description: "Valor pago/recebido em reais" },
          addToExtrat: { type: "boolean", description: "Se deve lançar também no extrato principal (padrão true)" },
        },
        required: ["loanDescription", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_vehicles",
      description: "Lista os veículos cadastrados na garagem do usuário.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "add_fueling",
      description: "Registra um novo abastecimento de combustível.",
      parameters: {
        type: "object",
        properties: {
          vehicleName: { type: "string", description: "Nome ou placa do veículo (ex: 'Honda Civic' ou 'ABC-1234')" },
          amount: { type: "number", description: "Valor total pago em reais" },
          liters: { type: "number", description: "Quantidade de litros abastecidos" },
          odometer: { type: "number", description: "Quilometragem atual (odômetro) do veículo" },
          date: { type: "string", description: "Opcional: Data ISO (YYYY-MM-DD). Padrão é hoje." },
        },
        required: ["vehicleName", "amount", "liters", "odometer"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_oil_change",
      description: "Registra uma troca de óleo do motor.",
      parameters: {
        type: "object",
        properties: {
          vehicleName: { type: "string", description: "Nome ou placa do veículo" },
          odometer: { type: "number", description: "Quilometragem no momento da troca" },
          nextChangeOdometer: { type: "number", description: "Quilometragem prevista para a próxima troca" },
          date: { type: "string", description: "Opcional: Data ISO. Padrão é hoje." },
        },
        required: ["vehicleName", "odometer", "nextChangeOdometer"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_vehicle_stats",
      description: "Retorna estatísticas de consumo (KM/L) e status de manutenção de um veículo.",
      parameters: {
        type: "object",
        properties: {
          vehicleName: { type: "string", description: "Nome ou placa do veículo" },
        },
        required: ["vehicleName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_goals",
      description: "Lista as metas de economia (investimentos) atuais do usuário.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "add_goal_deposit",
      description: "Registra um depósito em uma meta de economia específica.",
      parameters: {
        type: "object",
        properties: {
          goalTitle: { type: "string", description: "Título ou parte do título da meta" },
          amount: { type: "number", description: "Valor a ser guardado/investido" },
        },
        required: ["goalTitle", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_loan_report",
      description: "Gera e compartilha um arquivo PDF com o extrato detalhado de um empréstimo.",
      parameters: {
        type: "object",
        properties: {
          loanDescription: { type: "string", description: "Descrição do empréstimo para gerar o PDF" },
        },
        required: ["loanDescription"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_vehicle_expense",
      description: "Registra um gasto extra ou manutenção variada com o veículo (lava-jato, mecânica, pneus, etc).",
      parameters: {
        type: "object",
        properties: {
          vehicleName: { type: "string", description: "Nome ou placa do veículo" },
          description: { type: "string", description: "Descrição do gasto (ex: 'Lava-jato', 'Conserto pneu')" },
          amount: { type: "number", description: "Valor total pago em reais" },
          odometer: { type: "number", description: "Opcional: Quilometragem atual" },
          date: { type: "string", description: "Opcional: Data ISO. Padrão é hoje." },
        },
        required: ["vehicleName", "description", "amount"],
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
  addLoanContact: (args: { name: string }) => Promise<{ ok: boolean; contact?: any; error?: string }>;
  listLoanContacts: () => Promise<{ contacts: any[] }>;
  addLoan: (args: {
    contactName: string;
    direction: "lend" | "borrow";
    type: "monthly_interest" | "fixed_installments";
    amount: number;
    interestRate: number;
    description: string;
    installmentsCount?: number;
  }) => Promise<{ ok: boolean; loan?: any; error?: string }>;
  listLoans: (args: { contactName?: string }) => Promise<{ loans: any[] }>;
  addLoanPayment: (args: { loanDescription: string; amount: number; addToExtrat?: boolean }) => Promise<{ ok: boolean; payment?: any; error?: string }>;
  listVehicles: () => Promise<{ vehicles: any[] }>;
  addFueling: (args: {
    vehicleName: string;
    amount: number;
    liters: number;
    odometer: number;
    date?: string;
  }) => Promise<{ ok: boolean; fueling?: any; error?: string }>;
  addOilChange: (args: {
    vehicleName: string;
    odometer: number;
    nextChangeOdometer: number;
    date?: string;
  }) => Promise<{ ok: boolean; oilChange?: any; error?: string }>;
  getVehicleStats: (args: { vehicleName: string }) => Promise<{ stats: any }>;
  listGoals: () => Promise<{ goals: any[] }>;
  addGoalDeposit: (args: { goalTitle: string; amount: number }) => Promise<{ ok: boolean; goal?: any; error?: string }>;
  generateLoanReport: (args: { loanDescription: string }) => Promise<{ ok: boolean; error?: string }>;
  addVehicleExpense: (args: AddVehicleExpenseArgs) => Promise<{ ok: boolean; expense?: any; error?: string }>;
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
  addTransactionRaw: (t: Transaction) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  addRecurring: (r: Recurring) => Promise<void>;
  loanContacts: any[];
  loans: any[];
  loanPayments: any[];
  addLoanContact: (c: any) => Promise<any>;
  addLoan: (l: any) => Promise<any>;
  addLoanPayment: (p: any) => Promise<any>;
  vehicles: any[];
  fuelings: any[];
  oilChanges: any[];
  addFueling: (f: any) => Promise<any>;
  addOilChange: (o: any) => Promise<any>;
  goals: any[];
  goalDeposits: any[];
  addGoalDeposit: (d: any) => Promise<any>;
  vehicleExpenses: any[];
  addVehicleExpense: (e: any) => Promise<any>;
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

    async addLoanContact(args) {
      const contact = await deps.addLoanContact({ name: args.name });
      return { ok: true, contact };
    },

    async listLoanContacts() {
      const result = deps.loanContacts.map((c) => {
        const cLoans = deps.loans.filter((l) => l.contactId === c.id);
        let balance = 0;
        cLoans.forEach((l) => {
          const lPayments = deps.loanPayments.filter((p) => p.loanId === l.id);
          const paid = lPayments.reduce((s, p) => s + p.amount, 0);
          const interest = (l.principalAmount * l.interestRate) / 100;
          const total = l.principalAmount + interest;
          if (l.direction === "lend") balance += total - paid;
          else balance -= total - paid;
        });
        return { name: c.name, balance };
      });
      return { contacts: result };
    },

    async addLoan(args) {
      const contact = deps.loanContacts.find(
        (c) => c.name.toLowerCase().includes(args.contactName.toLowerCase()) || args.contactName.toLowerCase().includes(c.name.toLowerCase())
      );
      if (!contact) return { ok: false, error: "Pessoa não encontrada. Você precisa adicionar o contato primeiro usando add_loan_contact." };

      const loan = await deps.addLoan({
        contactId: contact.id,
        direction: args.direction,
        type: args.type,
        description: args.description,
        principalAmount: args.amount,
        interestRate: args.interestRate,
        installmentsCount: args.installmentsCount,
        startDate: new Date().toISOString(),
      });
      return { ok: true, loan };
    },
    async listLoans(args) {
      let filteredLoans = deps.loans;
      if (args.contactName) {
        const contact = deps.loanContacts.find((c) =>
          c.name.toLowerCase().includes(args.contactName!.toLowerCase())
        );
        if (contact) {
          filteredLoans = filteredLoans.filter((l) => l.contactId === contact.id);
        }
      }

      const result = filteredLoans.map((l) => {
        const contact = deps.loanContacts.find((c) => c.id === l.contactId);
        const payments = deps.loanPayments.filter((p) => p.loanId === l.id);
        const paid = payments.reduce((s, p) => s + p.amount, 0);
        const interest = (l.principalAmount * l.interestRate) / 100;
        const total = l.principalAmount + interest;
        return {
          id: l.id,
          contactName: contact?.name || "Desconhecido",
          description: l.description,
          amount: l.principalAmount,
          balance: total - paid,
          direction: l.direction,
        };
      });
      return { loans: result };
    },
    async addLoanPayment(args) {
      const loan = deps.loans.find((l) =>
        l.description.toLowerCase().includes(args.loanDescription.toLowerCase())
      );
      if (!loan) return { ok: false, error: "Empréstimo não encontrado. Verifique a descrição." };

      const payments = deps.loanPayments.filter((p) => p.loanId === loan.id);
      const paidPrincipal = payments.reduce((s, p) => s + p.principalPaid, 0);
      const remainingPrincipal = loan.principalAmount - paidPrincipal;
      const currentInterest = (remainingPrincipal * loan.interestRate) / 100;

      const interestToPay = Math.min(args.amount, currentInterest);
      const principalToPay = Math.max(0, args.amount - interestToPay);

      const payment = await deps.addLoanPayment({
        loanId: loan.id,
        amount: args.amount,
        interestPaid: interestToPay,
        principalPaid: principalToPay,
        date: new Date().toISOString(),
      });

      if (args.addToExtrat !== false) {
        const isLend = loan.direction === "lend";
        await deps.addTransactionRaw({
          id: genId(),
          type: isLend ? "income" : "expense",
          amount: args.amount,
          categoryId: isLend ? "cat_loan_income" : "cat_loan_expense",
          date: new Date().toISOString(),
          description: `${isLend ? "Recebimento" : "Pagamento"} (IA): ${loan.description}`,
          createdAt: new Date().toISOString(),
        });
      }

      return { ok: true, payment };
    },
    async listVehicles() {
      const list = deps.vehicles.map((v) => ({
        id: v.id,
        name: v.name,
        plate: v.plate,
        fuelType: v.fuelType,
      }));
      return { vehicles: list };
    },
    async addFueling(args) {
      const vehicle = deps.vehicles.find(
        (v) => v.name.toLowerCase().includes(args.vehicleName.toLowerCase()) || v.plate?.toLowerCase().includes(args.vehicleName.toLowerCase())
      );
      if (!vehicle) return { ok: false, error: "Veículo não encontrado." };

      const fueling = await deps.addFueling({
        vehicleId: vehicle.id,
        amount: args.amount,
        liters: args.liters,
        odometer: args.odometer,
        date: args.date || new Date().toISOString(),
        totalCost: args.amount,
        tankStatus: "full", // Padrão IA assume tanque cheio para cálculo de consumo
      });

      return { ok: true, fueling };
    },
    async addOilChange(args) {
      const vehicle = deps.vehicles.find(
        (v) => v.name.toLowerCase().includes(args.vehicleName.toLowerCase()) || v.plate?.toLowerCase().includes(args.vehicleName.toLowerCase())
      );
      if (!vehicle) return { ok: false, error: "Veículo não encontrado." };

      const oilChange = await deps.addOilChange({
        vehicleId: vehicle.id,
        odometer: args.odometer,
        nextChangeKm: args.nextChangeOdometer,
        date: args.date || new Date().toISOString(),
        description: "Troca via IA",
      });

      return { ok: true, oilChange };
    },
    async getVehicleStats(args) {
      const vehicle = deps.vehicles.find(
        (v) => v.name.toLowerCase().includes(args.vehicleName.toLowerCase()) || v.plate?.toLowerCase().includes(args.vehicleName.toLowerCase())
      );
      if (!vehicle) return { stats: null, error: "Veículo não encontrado." };

      const stats = computeVehicleStats(vehicle, deps.fuelings, deps.oilChanges, deps.vehicleExpenses);
      return {
        stats: {
          vehicleName: vehicle.name,
          avgKmL: stats.avgKmPerLiter ? formatKmPerLiter(stats.avgKmPerLiter) + " km/L" : "N/A",
          lastOdometer: stats.lastOdometer ? formatKm(stats.lastOdometer) + " km" : "N/A",
          oilStatus: stats.oilStatus,
          kmRemainingOil: stats.kmRemainingOil ? formatKm(stats.kmRemainingOil) + " km" : "N/A",
          avgCostPerKm: stats.avgCostPerKm ? "R$ " + stats.avgCostPerKm.toFixed(2) + " / km" : "N/A",
        },
      };
    },
    async addVehicleExpense(args) {
      const vehicle = deps.vehicles.find(
        (v) => v.name.toLowerCase().includes(args.vehicleName.toLowerCase()) || v.plate?.toLowerCase().includes(args.vehicleName.toLowerCase())
      );
      if (!vehicle) return { ok: false, error: "Veículo não encontrado." };

      const expense = await deps.addVehicleExpense({
        vehicleId: vehicle.id,
        description: args.description,
        amount: args.amount,
        odometer: args.odometer,
        date: args.date || new Date().toISOString(),
      });

      return { ok: true, expense };
    },
    async listGoals() {
      const list = deps.goals.map((g) => {
        const deposits = deps.goalDeposits.filter((d) => d.goalId === g.id);
        const saved = deposits.reduce((s, d) => s + d.amount, 0);
        return {
          id: g.id,
          title: g.title,
          targetAmount: g.targetAmount,
          savedAmount: saved,
          progress: (saved / g.targetAmount) * 100,
        };
      });
      return { goals: list };
    },
    async addGoalDeposit(args) {
      const goal = deps.goals.find((g) =>
        g.title.toLowerCase().includes(args.goalTitle.toLowerCase())
      );
      if (!goal) return { ok: false, error: "Meta não encontrada." };

      const deposit = await deps.addGoalDeposit({
        goalId: goal.id,
        amount: args.amount,
        date: new Date().toISOString(),
        description: "Depósito via IA",
      });
      return { ok: true, goal: { title: goal.title }, deposit };
    },
    async generateLoanReport(args) {
      const loan = deps.loans.find((l) =>
        l.description.toLowerCase().includes(args.loanDescription.toLowerCase())
      );
      if (!loan) return { ok: false, error: "Empréstimo não encontrado." };

      const contact = deps.loanContacts.find((c) => c.id === loan.contactId);
      if (!contact) return { ok: false, error: "Contato não encontrado." };

      const payments = deps.loanPayments.filter((p) => p.loanId === loan.id);

      try {
        await generatePDF(loan, contact, payments);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: "Erro ao gerar PDF" };
      }
    },
  };
}

export const SYSTEM_PROMPT = `Você é o Finn, o cérebro financeiro do app Bolso. Você é inteligente, assertivo e tem um toque de sarcasmo refinado. Sua missão é manter o usuário no caminho da riqueza, sendo um mentor e não apenas um registrador de dados.

Diretrizes de Personalidade:
- Responda sempre em Português do Brasil.
- **Feedback Inteligente**: Não dê sermão por cada gasto pequeno. Comente apenas se:
    1. O usuário gastar mais de R$ 200,00 em uma categoria não-essencial no mês.
    2. O saldo atual estiver baixo em relação às despesas fixas (recorrências).
    3. For um gasto que claramente foge do padrão habitual dele.
- **Proatividade em Investimentos**: Se o usuário disser que "guardou", "poupou" ou "investiu" um valor:
    1. Use list_goals para ver as metas atuais.
    2. Se houver metas, pergunte em qual ele deseja depositar ou se quer criar uma nova.
    3. Nunca assuma a meta sozinho se houver mais de uma.
- **Precisão em Veículos**: Antes de registrar abastecimento ou troca de óleo, use list_vehicles. Se houver mais de um veículo, pergunte explicitamente para qual deles é o registro.
- **Domínio de Empréstimos**: 
    1. Você pode consultar quanto alguém deve usando list_loans.
    2. Pode registrar pagamentos com add_loan_payment.
    3. Se o usuário pedir um "extrato" ou "acerto" de um empréstimo, use generate_loan_report.
- **Estilo de Escrita**: Seja breve, direto e use um tom de "parceiro de negócios". Evite emojis em excesso.
- **Fluxo de Trabalho**: 
    - Para gastos comuns: add_transaction.
    - Para investimentos: list_goals -> add_goal_deposit.
    - Para dúvidas de saldo: get_summary.
    - Para planejar compras: Analise o summary + recurring antes de opinar.

Lembre-se: Você é o Finn. Você quer que o usuário fique rico.`;
