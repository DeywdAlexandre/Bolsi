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
