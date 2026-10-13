import type { EnergyDataStatus } from "@/lib/energy-data";

export default function EnergyDataNotice({ status, source, observedAt }: {
  status: EnergyDataStatus;
  source: string;
  observedAt?: string | null;
}) {
  return (
    <p className="text-xs text-gray-300 leading-relaxed">
      <span className="inline-block rounded border border-white/20 bg-white/5 px-2 py-0.5 mr-2 capitalize">{status}</span>
      {source}{observedAt ? ` · As of ${new Date(observedAt).toLocaleString()}` : " · Observation time unavailable"}
    </p>
  );
}