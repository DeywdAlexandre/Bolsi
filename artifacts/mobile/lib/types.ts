export type TransactionType = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isDefault?: boolean;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  date: string;
  recurringId?: string;
  createdAt: string;
};

export type Recurring = {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  dayOfMonth: number;
  active: boolean;
  lastApplied?: string;
  createdAt: string;
};

export type Settings = {
  model: string;
  currency: string;
};

export type ChatRole = "user" | "assistant" | "system" | "tool";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
  createdAt: number;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type FuelType = "gasolina" | "etanol" | "diesel" | "gnv" | "flex";

export type Vehicle = {
  id: string;
  name: string;
  plate?: string;
  fuelType: FuelType;
  color?: string;
  icon?: string;
  initialOdometer?: number;
  createdAt: string;
};

export type TankStatus = "full" | "reserve";

export type Fueling = {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  tankStatus: TankStatus;
  notes?: string;
  expenseTransactionId?: string;
  createdAt: string;
};

export type OilChange = {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  nextChangeKm: number;
  cost?: number;
  notes?: string;
  expenseTransactionId?: string;
  createdAt: string;
};
export type LoanContact = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  photo?: string;
  createdAt: string;
};

export type LoanType = "monthly_interest" | "fixed_installments";
export type LoanDirection = "lend" | "borrow"; // lend = emprestei, borrow = peguei

export type Loan = {
  id: string;
  contactId: string;
  type: LoanType;
  direction: LoanDirection;
  description: string;
  principalAmount: number;
  interestRate: number; // Porcentagem (ex: 10 para 10%)
  installmentsCount?: number; // Para fixed_installments
  startDate: string;
  status: "active" | "completed";
  initialTransactionId?: string; // ID da transação inicial no extrato principal
  createdAt: string;
};

export type LoanPayment = {
  id: string;
  loanId: string;
  amount: number;
  interestPaid: number;
  principalPaid: number;
  date: string;
  isMainExtratEntry: boolean;
  transactionId?: string; // ID da transação vinculada no extrato principal
  createdAt: string;
};
