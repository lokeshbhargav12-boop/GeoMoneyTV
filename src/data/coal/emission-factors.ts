// EPA eGRID-based coal emission factors (tCO₂/MWh) by US eGRID subregion.
//
// Source: EPA eGRID — a free downloadable annual dataset (not a live API).
// Values are long-lived annual average output emission rates for coal-fired
// generation. Refresh this file when EPA publishes a new eGRID year.
// The national average is used as the Coal Calculators default; users can
// pick a subregion or override with plant-specific data.

export interface EgridEmissionFactor {
  subregion: string;
  name: string;
  factor: number; // tCO2/MWh for coal generation
}

/** US national average coal output emission rate (tCO₂/MWh). */
export const US_COAL_EMISSION_FACTOR_AVG = 1.0;

export const EGRID_COAL_EMISSION_FACTORS: EgridEmissionFactor[] = [
  { subregion: "US", name: "US National Average (coal)", factor: 1.0 },
  { subregion: "RFCW", name: "RFC West (Ohio Valley coal)", factor: 1.05 },
  { subregion: "RFCE", name: "RFC East (Appalachia coal)", factor: 1.02 },
  { subregion: "SRMV", name: "SRMV (Mississippi Valley)", factor: 0.97 },
  { subregion: "SRMW", name: "SRMW (Midwest coal belt)", factor: 1.08 },
  { subregion: "MROE", name: "MRO East (Upper Midwest coal)", factor: 1.06 },
  { subregion: "MROW", name: "MRO West (Plains coal)", factor: 1.04 },
  { subregion: "NWPP", name: "NWPP (Northwest)", factor: 1.18 },
  { subregion: "RFCM", name: "RFC Michigan (coal)", factor: 1.07 },
  { subregion: "SPNO", name: "SPP North (Plains coal)", factor: 1.09 },
  { subregion: "SPSO", name: "SPP South (coal)", factor: 1.11 },
  { subregion: "ERCT", name: "ERCOT (Texas coal)", factor: 1.0 },
  { subregion: "FRCC", name: "FRCC (Florida coal)", factor: 1.03 },
];

/** Returns the eGRID coal emission factor for a subregion, falling back to
 * the US national average if the code is unknown. */
export function getEmissionFactor(subregion: string): number {
  const found = EGRID_COAL_EMISSION_FACTORS.find((e) => e.subregion === subregion);
  return found ? found.factor : US_COAL_EMISSION_FACTOR_AVG;
}
