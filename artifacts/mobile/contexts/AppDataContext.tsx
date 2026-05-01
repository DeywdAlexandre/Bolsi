import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { genId, todayIso } from "@/lib/format";
import { loadJson, saveJson, STORAGE_KEYS } from "@/lib/storage";
import type {
  Category,
  Fueling,
  OilChange,
  Recurring,
  Transaction,
  TransactionType,
  Vehicle,
  LoanContact,
  Loan,
  LoanPayment,
} from "@/lib/types";

type AppDataContextValue = {
  ready: boolean;
  transactions: Transaction[];
  recurring: Recurring[];
  categories: Category[];
  vehicles: Vehicle[];
  fuelings: Fueling[];
  oilChanges: OilChange[];
  addTransaction: (input: Omit<Transaction, "id" | "createdAt">) => Promise<Transaction>;
  addTransactionRaw: (tx: Transaction) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  addRecurring: (input: Omit<Recurring, "id" | "createdAt" | "active"> & { active?: boolean }) => Promise<Recurring>;
  addRecurringRaw: (r: Recurring) => Promise<void>;
  updateRecurring: (id: string, patch: Partial<Recurring>) => Promise<void>;
  removeRecurring: (id: string) => Promise<void>;
  addCategory: (input: Omit<Category, "id">) => Promise<Category>;
  removeCategory: (id: string) => Promise<void>;
  addVehicle: (input: Omit<Vehicle, "id" | "createdAt">) => Promise<Vehicle>;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => Promise<void>;
  removeVehicle: (id: string) => Promise<void>;
  addFueling: (input: Omit<Fueling, "id" | "createdAt">) => Promise<Fueling>;
  updateFueling: (id: string, patch: Partial<Fueling>) => Promise<void>;
  removeFueling: (id: string) => Promise<void>;
  addOilChange: (input: Omit<OilChange, "id" | "createdAt">) => Promise<OilChange>;
  updateOilChange: (id: string, patch: Partial<OilChange>) => Promise<void>;
  removeOilChange: (id: string) => Promise<void>;
  loanContacts: LoanContact[];
  loans: Loan[ ];
  loanPayments: LoanPayment[];
  addLoanContact: (input: Omit<LoanContact, "id" | "createdAt">) => Promise<LoanContact>;
  updateLoanContact: (id: string, patch: Partial<LoanContact>) => Promise<void>;
  removeLoanContact: (id: string) => Promise<void>;
  addLoan: (input: Omit<Loan, "id" | "createdAt" | "status">) => Promise<Loan>;
  updateLoan: (id: string, patch: Partial<Loan>) => Promise<void>;
  removeLoan: (id: string) => Promise<void>;
  addLoanPayment: (input: Omit<LoanPayment, "id" | "createdAt">) => Promise<LoanPayment>;
  removeLoanPayment: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelings, setFuelings] = useState<Fueling[]>([]);
  const [oilChanges, setOilChanges] = useState<OilChange[]>([]);
  const [loanContacts, setLoanContacts] = useState<LoanContact[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanPayments, setLoanPayments] = useState<LoanPayment[]>([]);

  // Load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all([
        loadJson<Transaction[]>(STORAGE_KEYS.transactions, []),
        loadJson<Recurring[]>(STORAGE_KEYS.recurring, []),
        loadJson<Category[]>(STORAGE_KEYS.categories, DEFAULT_CATEGORIES),
        loadJson<Vehicle[]>(STORAGE_KEYS.vehicles, []),
        loadJson<Fueling[]>(STORAGE_KEYS.fuelings, []),
        loadJson<OilChange[]>(STORAGE_KEYS.oilChanges, []),
        loadJson<LoanContact[]>(STORAGE_KEYS.loanContacts, []),
        loadJson<Loan[]>(STORAGE_KEYS.loans, []),
        loadJson<LoanPayment[]>(STORAGE_KEYS.loanPayments, []),
      ]);
      if (cancelled) return;
      const [tx, rc, cats, veh, fue, oil, lc, l, lp] = results;
      
      // Merge com categorias padrões caso falte alguma (como as novas de empréstimo)
      const mergedCats = [...cats];
      DEFAULT_CATEGORIES.forEach(def => {
        if (!mergedCats.find(c => c.id === def.id)) {
          mergedCats.push(def);
        }
      });

      setTransactions(tx);
      setRecurring(rc);
      setCategories(mergedCats);
      setVehicles(veh);
      setFuelings(fue);
      setOilChanges(oil);
      setLoanContacts(lc);
      setLoans(l);
      setLoanPayments(lp);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply recurring transactions for current month
  useEffect(() => {
    if (!ready) return;
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const today = now.getDate();

    let changed = false;
    const newTx: Transaction[] = [];
    const updatedRecurring = recurring.map((r) => {
      if (!r.active) return r;
      if (r.dayOfMonth > today) return r;
      const targetDay = Math.min(r.dayOfMonth, new Date(year, month + 1, 0).getDate());
      const targetDate = new Date(year, month, targetDay, 12, 0, 0);
      const lastApplied = r.lastApplied ? new Date(r.lastApplied) : null;
      const alreadyApplied =
        lastApplied &&
        lastApplied.getMonth() === month &&
        lastApplied.getFullYear() === year;
      if (alreadyApplied) return r;
      newTx.push({
        id: genId(),
        type: r.type,
        amount: r.amount,
        categoryId: r.categoryId,
        description: r.description,
        date: targetDate.toISOString(),
        recurringId: r.id,
        createdAt: new Date().toISOString(),
      });
      changed = true;
      return { ...r, lastApplied: targetDate.toISOString() };
    });
    if (changed) {
      const allTx = [...newTx, ...transactions];
      setTransactions(allTx);
      setRecurring(updatedRecurring);
      void saveJson(STORAGE_KEYS.transactions, allTx);
      void saveJson(STORAGE_KEYS.recurring, updatedRecurring);
    }
    // run once when ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const addTransactionRaw = useCallback(async (tx: Transaction) => {
    setTransactions((prev) => {
      const next = [tx, ...prev];
      void saveJson(STORAGE_KEYS.transactions, next);
      return next;
    });
  }, []);

  const addTransaction = useCallback(
    async (input: Omit<Transaction, "id" | "createdAt">) => {
      const tx: Transaction = {
        ...input,
        id: genId(),
        createdAt: new Date().toISOString(),
      };
      await addTransactionRaw(tx);
      return tx;
    },
    [addTransactionRaw],
  );

  const updateTransaction = useCallback(async (id: string, patch: Partial<Transaction>) => {
    setTransactions((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...patch } : t));
      void saveJson(STORAGE_KEYS.transactions, next);
      return next;
    });
  }, []);

  const removeTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => {
      const next = prev.filter((t) => t.id !== id);
      void saveJson(STORAGE_KEYS.transactions, next);
      return next;
    });
  }, []);

  const addRecurringRaw = useCallback(async (r: Recurring) => {
    setRecurring((prev) => {
      const next = [r, ...prev];
      void saveJson(STORAGE_KEYS.recurring, next);
      return next;
    });
  }, []);

  const addRecurring = useCallback(
    async (input: Omit<Recurring, "id" | "createdAt" | "active"> & { active?: boolean }) => {
      const r: Recurring = {
        ...input,
        active: input.active ?? true,
        id: genId(),
        createdAt: new Date().toISOString(),
      };
      await addRecurringRaw(r);
      return r;
    },
    [addRecurringRaw],
  );

  const updateRecurring = useCallback(async (id: string, patch: Partial<Recurring>) => {
    setRecurring((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      void saveJson(STORAGE_KEYS.recurring, next);
      return next;
    });
  }, []);

  const removeRecurring = useCallback(async (id: string) => {
    setRecurring((prev) => {
      const next = prev.filter((r) => r.id !== id);
      void saveJson(STORAGE_KEYS.recurring, next);
      return next;
    });
  }, []);

  const addCategory = useCallback(async (input: Omit<Category, "id">) => {
    const cat: Category = { ...input, id: "cat_" + genId() };
    setCategories((prev) => {
      const next = [...prev, cat];
      void saveJson(STORAGE_KEYS.categories, next);
      return next;
    });
    return cat;
  }, []);

  const removeCategory = useCallback(async (id: string) => {
    setCategories((prev) => {
      const target = prev.find((c) => c.id === id);
      if (!target || target.isDefault) return prev;
      const next = prev.filter((c) => c.id !== id);
      void saveJson(STORAGE_KEYS.categories, next);
      return next;
    });
  }, []);

  const addVehicle = useCallback(async (input: Omit<Vehicle, "id" | "createdAt">) => {
    const v: Vehicle = { ...input, id: "veh_" + genId(), createdAt: new Date().toISOString() };
    setVehicles((prev) => {
      const next = [v, ...prev];
      void saveJson(STORAGE_KEYS.vehicles, next);
      return next;
    });
    return v;
  }, []);

  const updateVehicle = useCallback(async (id: string, patch: Partial<Vehicle>) => {
    setVehicles((prev) => {
      const next = prev.map((v) => (v.id === id ? { ...v, ...patch } : v));
      void saveJson(STORAGE_KEYS.vehicles, next);
      return next;
    });
  }, []);

  const removeVehicle = useCallback(async (id: string) => {
    setVehicles((prev) => {
      const next = prev.filter((v) => v.id !== id);
      void saveJson(STORAGE_KEYS.vehicles, next);
      return next;
    });
    setFuelings((prev) => {
      const next = prev.filter((f) => f.vehicleId !== id);
      void saveJson(STORAGE_KEYS.fuelings, next);
      return next;
    });
    setOilChanges((prev) => {
      const next = prev.filter((o) => o.vehicleId !== id);
      void saveJson(STORAGE_KEYS.oilChanges, next);
      return next;
    });
  }, []);

  const addFueling = useCallback(async (input: Omit<Fueling, "id" | "createdAt">) => {
    const f: Fueling = { ...input, id: "fue_" + genId(), createdAt: new Date().toISOString() };
    setFuelings((prev) => {
      const next = [f, ...prev];
      void saveJson(STORAGE_KEYS.fuelings, next);
      return next;
    });
    return f;
  }, []);

  const updateFueling = useCallback(async (id: string, patch: Partial<Fueling>) => {
    setFuelings((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, ...patch } : f));
      void saveJson(STORAGE_KEYS.fuelings, next);
      return next;
    });
  }, []);

  const removeFueling = useCallback(async (id: string) => {
    setFuelings((prev) => {
      const next = prev.filter((f) => f.id !== id);
      void saveJson(STORAGE_KEYS.fuelings, next);
      return next;
    });
  }, []);

  const addOilChange = useCallback(async (input: Omit<OilChange, "id" | "createdAt">) => {
    const o: OilChange = { ...input, id: "oil_" + genId(), createdAt: new Date().toISOString() };
    setOilChanges((prev) => {
      const next = [o, ...prev];
      void saveJson(STORAGE_KEYS.oilChanges, next);
      return next;
    });
    return o;
  }, []);

  const updateOilChange = useCallback(async (id: string, patch: Partial<OilChange>) => {
    setOilChanges((prev) => {
      const next = prev.map((o) => (o.id === id ? { ...o, ...patch } : o));
      void saveJson(STORAGE_KEYS.oilChanges, next);
      return next;
    });
  }, []);

  const removeOilChange = useCallback(async (id: string) => {
    setOilChanges((prev) => {
      const next = prev.filter((o) => o.id !== id);
      void saveJson(STORAGE_KEYS.oilChanges, next);
      return next;
    });
  }, []);

  const addLoanContact = useCallback(async (input: Omit<LoanContact, "id" | "createdAt">) => {
    const lc: LoanContact = { ...input, id: "lc_" + genId(), createdAt: new Date().toISOString() };
    setLoanContacts((prev) => {
      const next = [lc, ...prev];
      void saveJson(STORAGE_KEYS.loanContacts, next);
      return next;
    });
    return lc;
  }, []);

  const updateLoanContact = useCallback(async (id: string, patch: Partial<LoanContact>) => {
    setLoanContacts((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      void saveJson(STORAGE_KEYS.loanContacts, next);
      return next;
    });
  }, []);

  const removeLoanContact = useCallback(async (id: string) => {
    setLoanContacts((prev) => {
      const next = prev.filter((c) => c.id !== id);
      void saveJson(STORAGE_KEYS.loanContacts, next);
      return next;
    });
    setLoans((prev) => {
      const next = prev.filter((l) => l.contactId !== id);
      void saveJson(STORAGE_KEYS.loans, next);
      return next;
    });
  }, []);

  const addLoan = useCallback(async (input: Omit<Loan, "id" | "createdAt" | "status">) => {
    const l: Loan = { ...input, id: "loan_" + genId(), createdAt: new Date().toISOString(), status: "active" };
    setLoans((prev) => {
      const next = [l, ...prev];
      void saveJson(STORAGE_KEYS.loans, next);
      return next;
    });
    return l;
  }, []);

  const updateLoan = useCallback(async (id: string, patch: Partial<Loan>) => {
    setLoans((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, ...patch } : l));
      void saveJson(STORAGE_KEYS.loans, next);
      return next;
    });
  }, []);

  const removeLoan = useCallback(async (id: string) => {
    let initialTxId: string | undefined;

    setLoans((prev) => {
      const target = prev.find((l) => l.id === id);
      initialTxId = target?.initialTransactionId;
      const next = prev.filter((l) => l.id !== id);
      void saveJson(STORAGE_KEYS.loans, next);
      return next;
    });

    if (initialTxId) {
      setTransactions((prev) => {
        const next = prev.filter((t) => t.id !== initialTxId);
        void saveJson(STORAGE_KEYS.transactions, next);
        return next;
      });
    }

    setLoanPayments((prev) => {
      const next = prev.filter((p) => p.loanId !== id);
      void saveJson(STORAGE_KEYS.loanPayments, next);
      return next;
    });
  }, []);

  const addLoanPayment = useCallback(async (input: Omit<LoanPayment, "id" | "createdAt">) => {
    const lp: LoanPayment = { ...input, id: "lp_" + genId(), createdAt: new Date().toISOString() };
    setLoanPayments((prev) => {
      const next = [lp, ...prev];
      void saveJson(STORAGE_KEYS.loanPayments, next);
      return next;
    });
    return lp;
  }, []);

  const removeLoanPayment = useCallback(async (id: string) => {
    let txToRemoveId: string | undefined;

    setLoanPayments((prev) => {
      const target = prev.find((p) => p.id === id);
      txToRemoveId = target?.transactionId;
      const next = prev.filter((p) => p.id !== id);
      void saveJson(STORAGE_KEYS.loanPayments, next);
      return next;
    });

    if (txToRemoveId) {
      setTransactions((prev) => {
        const next = prev.filter((t) => t.id !== txToRemoveId);
        void saveJson(STORAGE_KEYS.transactions, next);
        return next;
      });
    }
  }, []);

  const resetAll = useCallback(async () => {
    setTransactions([]);
    setRecurring([]);
    setCategories(DEFAULT_CATEGORIES);
    setVehicles([]);
    setFuelings([]);
    setOilChanges([]);
    setLoanContacts([]);
    setLoans([]);
    setLoanPayments([]);
    await Promise.all([
      saveJson(STORAGE_KEYS.transactions, []),
      saveJson(STORAGE_KEYS.recurring, []),
      saveJson(STORAGE_KEYS.categories, DEFAULT_CATEGORIES),
      saveJson(STORAGE_KEYS.vehicles, []),
      saveJson(STORAGE_KEYS.fuelings, []),
      saveJson(STORAGE_KEYS.oilChanges, []),
      saveJson(STORAGE_KEYS.loanContacts, []),
      saveJson(STORAGE_KEYS.loans, []),
      saveJson(STORAGE_KEYS.loanPayments, []),
    ]);
  }, []);

  // unused fallback to silence linter
  void todayIso;

  const value = useMemo<AppDataContextValue>(
    () => ({
      ready,
      transactions,
      recurring,
      categories,
      vehicles,
      fuelings,
      oilChanges,
      addTransaction,
      addTransactionRaw,
      updateTransaction,
      removeTransaction,
      addRecurring,
      addRecurringRaw,
      updateRecurring,
      removeRecurring,
      addCategory,
      removeCategory,
      addVehicle,
      updateVehicle,
      removeVehicle,
      addFueling,
      updateFueling,
      removeFueling,
      addOilChange,
      updateOilChange,
      removeOilChange,
      loanContacts,
      loans,
      loanPayments,
      addLoanContact,
      updateLoanContact,
      removeLoanContact,
      addLoan,
      updateLoan,
      removeLoan,
      addLoanPayment,
      removeLoanPayment,
      resetAll,
    }),
    [
      ready,
      transactions,
      recurring,
      categories,
      vehicles,
      fuelings,
      oilChanges,
      addTransaction,
      addTransactionRaw,
      updateTransaction,
      removeTransaction,
      addRecurring,
      addRecurringRaw,
      updateRecurring,
      removeRecurring,
      addCategory,
      removeCategory,
      addVehicle,
      updateVehicle,
      removeVehicle,
      addFueling,
      updateFueling,
      removeFueling,
      addOilChange,
      updateOilChange,
      removeOilChange,
      loanContacts,
      loans,
      loanPayments,
      addLoanContact,
      updateLoanContact,
      removeLoanContact,
      addLoan,
      updateLoan,
      removeLoan,
      addLoanPayment,
      removeLoanPayment,
      resetAll,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

export function useCategoriesByType(type: TransactionType): Category[] {
  const { categories } = useAppData();
  return useMemo(() => categories.filter((c) => c.type === type), [categories, type]);
}
