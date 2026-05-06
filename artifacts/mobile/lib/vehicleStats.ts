import type { Fueling, OilChange, Vehicle, VehicleExpense } from "./types";

export type VehicleStats = {
  hasFuelings: boolean;
  hasComputedKmL: boolean;
  avgKmPerLiter: number | null;
  recentKmPerLiter: number | null;
  avgCostPerKm: number | null;
  totalKm: number;
  totalLitersInSegments: number;
  totalCostInSegments: number;
  totalSpentAllTime: number;
  totalLitersAllTime: number;
  totalExtraExpenses: number;
  lastFueling: Fueling | null;
  lastOilChange: OilChange | null;
  lastOdometer: number | null;
  nextOilChangeAt: number | null;
  kmRemainingOil: number | null;
  oilStatus: "ok" | "soon" | "overdue" | "unknown";
};

const SOON_THRESHOLD_KM = 500;

function sortByDateAsc<T extends { date: string }>(arr: T[]): T[] {
  return [...arr].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

export function computeVehicleStats(
  vehicle: Vehicle,
  allFuelings: Fueling[],
  allOilChanges: OilChange[],
  allExtraExpenses: VehicleExpense[],
): VehicleStats {
  const fuelings = sortByDateAsc(
    allFuelings.filter((f) => f.vehicleId === vehicle.id),
  );
  const oilChanges = sortByDateAsc(
    allOilChanges.filter((o) => o.vehicleId === vehicle.id),
  );
  const extraExpenses = allExtraExpenses.filter((e) => e.vehicleId === vehicle.id);

  const lastFueling = fuelings.length ? fuelings[fuelings.length - 1]! : null;
  const lastOilChange = oilChanges.length
    ? oilChanges[oilChanges.length - 1]!
    : null;

  const totalSpentFuel = fuelings.reduce((s, f) => s + f.totalCost, 0);
  const totalSpentOil = oilChanges.reduce((s, o) => s + (o.cost || 0), 0);
  const totalExtraExpenses = extraExpenses.reduce((s, e) => s + e.amount, 0);
  
  const totalSpentAllTime = totalSpentFuel + totalSpentOil + totalExtraExpenses;
  const totalLitersAllTime = fuelings.reduce((s, f) => s + f.liters, 0);

  // segments between consecutive fuelings with the same tank status
  let totalKm = 0;
  let totalLitersInSegments = 0;
  let totalCostInSegments = 0;
  const segments: { km: number; liters: number; cost: number }[] = [];
  for (let i = 1; i < fuelings.length; i++) {
    const prev = fuelings[i - 1]!;
    const curr = fuelings[i]!;
    if (prev.tankStatus !== curr.tankStatus) continue;
    const km = curr.odometer - prev.odometer;
    if (km <= 0 || curr.liters <= 0) continue;
    segments.push({ km, liters: curr.liters, cost: curr.totalCost });
    totalKm += km;
    totalLitersInSegments += curr.liters;
    totalCostInSegments += curr.totalCost;
  }

  // Custo por KM levando em conta tudo o que foi gasto (não apenas combustivel)
  // Se medimos uma certa quilometragem, queremos saber quanto custou rodar aquilo no total.
  // Usamos totalCostInSegments para a parte de combustível e proporcionalizamos o resto ou simplesmente usamos o total geral pelo km total medido.
  // Para ser mais simples e preciso: (Gastos Totais / KM Total percorrido desde o inicio)
  const measuredKm = fuelings.length >= 2 
    ? (fuelings[fuelings.length - 1]!.odometer - fuelings[0]!.odometer)
    : 0;

  const avgCostPerKm = measuredKm > 0 ? (totalSpentAllTime / measuredKm) : (totalKm > 0 ? totalCostInSegments / totalKm : null);

  const hasComputedKmL = totalLitersInSegments > 0;
  const avgKmPerLiter = hasComputedKmL ? totalKm / totalLitersInSegments : null;
  const recentSegment = segments[segments.length - 1] ?? null;
  const recentKmPerLiter = recentSegment
    ? recentSegment.km / recentSegment.liters
    : null;

  const odometers: number[] = [];
  for (const f of fuelings) odometers.push(f.odometer);
  for (const o of oilChanges) odometers.push(o.odometer);
  if (vehicle.initialOdometer != null) odometers.push(vehicle.initialOdometer);
  const lastOdometer = odometers.length ? Math.max(...odometers) : null;

  const nextOilChangeAt = lastOilChange ? lastOilChange.nextChangeKm : null;
  const kmRemainingOil =
    nextOilChangeAt != null && lastOdometer != null
      ? nextOilChangeAt - lastOdometer
      : null;

  let oilStatus: VehicleStats["oilStatus"] = "unknown";
  if (kmRemainingOil != null) {
    if (kmRemainingOil <= 0) oilStatus = "overdue";
    else if (kmRemainingOil <= SOON_THRESHOLD_KM) oilStatus = "soon";
    else oilStatus = "ok";
  }

  return {
    hasFuelings: fuelings.length > 0,
    hasComputedKmL,
    avgKmPerLiter,
    recentKmPerLiter,
    avgCostPerKm,
    totalKm,
    totalLitersInSegments,
    totalCostInSegments,
    totalSpentAllTime,
    totalExtraExpenses,
    totalLitersAllTime,
    lastFueling,
    lastOilChange,
    lastOdometer,
    nextOilChangeAt,
    kmRemainingOil,
    oilStatus,
  };
}

export const FUEL_TYPE_LABELS: Record<string, string> = {
  gasolina: "Gasolina",
  etanol: "Etanol",
  diesel: "Diesel",
  gnv: "GNV",
  flex: "Flex",
};

export function formatKm(km: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(km);
}

export function formatKmPerLiter(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(v);
}

export function formatLiters(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(v);
}
