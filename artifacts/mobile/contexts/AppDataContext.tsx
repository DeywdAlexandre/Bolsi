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

  // Load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [tx, rc, cats, veh, fue, oil] = await Promise.all([
        loadJson<Transaction[]>(STORAGE_KEYS.transactions, []),
        loadJson<Recurring[]>(STORAGE_KEYS.recurring, []),
        loadJson<Category[]>(STORAGE_KEYS.categories, DEFAULT_CATEGORIES),
        loadJson<Vehicle[]>(STORAGE_KEYS.vehicles, []),
        loadJson<Fueling[]>(STORAGE_KEYS.fuelings, []),
        loadJson<OilChange[]>(STORAGE_KEYS.oilChanges, []),
      ]);
      if (cancelled) return;
      setTransactions(tx);
      setRecurring(rc);
      setCategories(cats.length ? cats : DEFAULT_CATEGORIES);
      setVehicles(veh);
      setFuelings(fue);
      setOilChanges(oil);
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

  const resetAll = useCallback(async () => {
    setTransactions([]);
    setRecurring([]);
    setCategories(DEFAULT_CATEGORIES);
    setVehicles([]);
    setFuelings([]);
    setOilChanges([]);
    await Promise.all([
      saveJson(STORAGE_KEYS.transactions, []),
      saveJson(STORAGE_KEYS.recurring, []),
      saveJson(STORAGE_KEYS.categories, DEFAULT_CATEGORIES),
      saveJson(STORAGE_KEYS.vehicles, []),
      saveJson(STORAGE_KEYS.fuelings, []),
      saveJson(STORAGE_KEYS.oilChanges, []),
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
