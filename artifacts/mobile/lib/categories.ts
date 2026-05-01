import type { Category } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
  // Income
  { id: "cat_salary", name: "Salário", icon: "briefcase", color: "#00d68f", type: "income", isDefault: true },
  { id: "cat_freelance", name: "Freelance", icon: "edit-3", color: "#3ddc97", type: "income", isDefault: true },
  { id: "cat_investments", name: "Investimentos", icon: "trending-up", color: "#06b6d4", type: "income", isDefault: true },
  { id: "cat_gifts", name: "Presentes", icon: "gift", color: "#a78bfa", type: "income", isDefault: true },
  { id: "cat_loan_income", name: "Recebimento de Empréstimo", icon: "repeat", color: "#22d3ee", type: "income", isDefault: true },
  { id: "cat_income_other", name: "Outros", icon: "plus-circle", color: "#94a3b8", type: "income", isDefault: true },

  // Expenses
  { id: "cat_food", name: "Alimentação", icon: "shopping-bag", color: "#ff8a4c", type: "expense", isDefault: true },
  { id: "cat_transport", name: "Transporte", icon: "navigation", color: "#60a5fa", type: "expense", isDefault: true },
  { id: "cat_housing", name: "Moradia", icon: "home", color: "#f472b6", type: "expense", isDefault: true },
  { id: "cat_health", name: "Saúde", icon: "heart", color: "#fb7185", type: "expense", isDefault: true },
  { id: "cat_leisure", name: "Lazer", icon: "music", color: "#a78bfa", type: "expense", isDefault: true },
  { id: "cat_education", name: "Educação", icon: "book-open", color: "#34d399", type: "expense", isDefault: true },
  { id: "cat_clothing", name: "Vestuário", icon: "tag", color: "#fbbf24", type: "expense", isDefault: true },
  { id: "cat_bills", name: "Contas", icon: "file-text", color: "#94a3b8", type: "expense", isDefault: true },
  { id: "cat_subscriptions", name: "Assinaturas", icon: "repeat", color: "#22d3ee", type: "expense", isDefault: true },
  { id: "cat_loan_expense", name: "Pagamento de Empréstimo", icon: "repeat", color: "#ef4444", type: "expense", isDefault: true },
  { id: "cat_expense_other", name: "Outros", icon: "more-horizontal", color: "#737380", type: "expense", isDefault: true },
];

export const CATEGORY_ICON_OPTIONS = [
  "briefcase", "edit-3", "trending-up", "gift", "plus-circle",
  "shopping-bag", "navigation", "home", "heart", "music",
  "book-open", "tag", "file-text", "repeat", "coffee",
  "smartphone", "globe", "tool", "truck", "anchor",
  "camera", "film", "scissors", "shield", "star",
];

export const CATEGORY_COLOR_OPTIONS = [
  "#00d68f", "#3ddc97", "#06b6d4", "#a78bfa", "#94a3b8",
  "#ff8a4c", "#60a5fa", "#f472b6", "#fb7185", "#34d399",
  "#fbbf24", "#22d3ee", "#737380", "#ef4444", "#10b981",
];
