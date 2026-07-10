import { NextResponse } from "next/server";
import {
  getEnergyInfrastructureData,
  enrichScenarioImpact,
  clearEnergyInfrastructureCache,
} from "@/lib/energy-infrastructure-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getEnergyInfrastructureData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("[Energy Infrastructure API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch energy infrastructure data" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { scenarioId } = await req.json();
    if (!scenarioId) {
      return NextResponse.json(
        { error: "scenarioId is required" },
        { status: 400 },
      );
    }

    const payload = await getEnergyInfrastructureData();
    const impact = await enrichScenarioImpact(scenarioId, payload);

    return NextResponse.json({ scenarioId, impact });
  } catch (error) {
    console.error("[Energy Infrastructure API] POST error:", error);
    return NextResponse.json(
      { error: "Failed to enrich scenario" },
      { status: 500 },
    );
  }
}
