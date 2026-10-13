// Pure, validated planning models. These are estimates, not production telemetry.
export function energyNumber(value: string, label: string, min = 0, max = Infinity): number {
  const number = value.trim() === "" ? NaN : Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${label}: enter a finite number between ${min} and ${max === Infinity ? "a reasonable positive value" : max}.`);
  }
  return number;
}

export function solarEstimate(size: string, cost: string, rate: string, hours: string) {
  const kw = energyNumber(size, "System size", 0.01, 1_000_000);
  const cpw = energyNumber(cost, "Cost per watt", 0, 1000);
  const tariff = energyNumber(rate, "Electricity rate", 0, 1000);
  const sun = energyNumber(hours, "Peak sun hours", 0, 24);
  const annualProduction = kw * sun * 365;
  const annualSavings = annualProduction * tariff;
  const totalCost = kw * 1000 * cpw;
  return {
    annualProduction,
    annualSavings,
    payback: annualSavings > 0 ? totalCost / annualSavings : null,
    savings25: annualSavings * 25 - totalCost,
  };
}

export function windEstimate(count: string, rating: string, factor: string) {
  const turbines = energyNumber(count, "Turbine count", 1, 1_000_000);
  if (!Number.isInteger(turbines)) throw new Error("Turbine count must be a whole number.");
  const mw = energyNumber(rating, "Turbine rating", 0.001, 1000);
  const cf = energyNumber(factor, "Capacity factor", 0, 100) / 100;
  const totalCapacity = turbines * mw;
  const annualOutput = totalCapacity * cf * 8760;
  return { totalCapacity, annualOutput, homesPowered: Math.round(annualOutput / 10.5) };
}

export function carbonEstimate(capacity: string, source: string) {
  const factors: Record<string, number> = { solar: 0.04, wind: 0.04, hydro: 0.038, nuclear: 0.045, geothermal: 0.035 };
  if (!(source in factors)) throw new Error("Choose a supported energy source.");
  const mw = energyNumber(capacity, "Renewable capacity", 0, 1_000_000);
  const co2Offset = mw * 0.25 * 8760 * (1 - factors[source]);
  return { co2Offset, trees: co2Offset * 45, cars: co2Offset / 4.6 };
}