import { computeVehicleStats } from "./vehicleStats";
import type { Fueling, Vehicle } from "./types";

const mockVehicle: Vehicle = {
  id: "v1",
  name: "Test Car",
  fuelType: "gasolina",
  createdAt: new Date().toISOString(),
};

function runTest(name: string, fuelings: Fueling[]) {
  console.log(`\n--- Test: ${name} ---`);
  const stats = computeVehicleStats(mockVehicle, fuelings, [], []);
  console.log(`KM/L Médio: ${stats.avgKmPerLiter}`);
  console.log(`Recent KM/L: ${stats.recentKmPerLiter}`);
  console.log(`Total KM: ${stats.totalKm}`);
  console.log(`Total Liters: ${stats.totalLitersInSegments}`);
  console.log(`Cost/KM: ${stats.avgCostPerKm}`);
}

// Case 1: Simple Full -> Full
runTest("Simple Full -> Full", [
  { id: "1", vehicleId: "v1", odometer: 1000, liters: 50, totalCost: 250, tankStatus: "full", date: "2024-01-01", pricePerLiter: 5, createdAt: "" },
  { id: "2", vehicleId: "v1", odometer: 1500, liters: 40, totalCost: 200, tankStatus: "full", date: "2024-01-10", pricePerLiter: 5, createdAt: "" },
]);
// Expected: 500km / 40L = 12.5 km/L. Cost = 200 / 500 = 0.4 R$/km.

// Case 2: Full -> Partial -> Full
runTest("Full -> Partial -> Full", [
  { id: "1", vehicleId: "v1", odometer: 1000, liters: 50, totalCost: 250, tankStatus: "full", date: "2024-01-01", pricePerLiter: 5, createdAt: "" },
  { id: "2", vehicleId: "v1", odometer: 1200, liters: 10, totalCost: 50, tankStatus: "partial", date: "2024-01-05", pricePerLiter: 5, createdAt: "" },
  { id: "3", vehicleId: "v1", odometer: 1500, liters: 30, totalCost: 150, tankStatus: "full", date: "2024-01-10", pricePerLiter: 5, createdAt: "" },
]);
// Expected: 500km / (10+30)L = 12.5 km/L. Cost = 200 / 500 = 0.4 R$/km.

// Case 3: Reserve -> Partial -> Reserve
runTest("Reserve -> Partial -> Reserve", [
  { id: "1", vehicleId: "v1", odometer: 1000, liters: 20, totalCost: 100, tankStatus: "reserve", date: "2024-01-01", pricePerLiter: 5, createdAt: "" },
  { id: "2", vehicleId: "v1", odometer: 1200, liters: 10, totalCost: 50, tankStatus: "partial", date: "2024-01-05", pricePerLiter: 5, createdAt: "" },
  { id: "3", vehicleId: "v1", odometer: 1500, liters: 30, totalCost: 150, tankStatus: "reserve", date: "2024-01-10", pricePerLiter: 5, createdAt: "" },
]);
// Expected: 500km / (20+10)L = 16.66 km/L. Cost = 150 / 500 = 0.3 R$/km.
