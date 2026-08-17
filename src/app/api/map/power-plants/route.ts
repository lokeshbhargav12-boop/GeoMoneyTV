import { NextResponse } from "next/server";
import { MAP_API } from "@/config/energyLayers";
import {
  parsePlantQueryParams,
  queryPowerPlants,
} from "@/lib/map/powerPlantsSource";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const query = parsePlantQueryParams(sp);
    const data = queryPowerPlants(query);
    return NextResponse.json(data, {
      headers: { "Cache-Control": MAP_API.plantsCache },
    });
  } catch (error) {
    console.error("[Map API] power-plants error:", error);
    return NextResponse.json(
      { error: "Failed to load power plants" },
      { status: 500 },
    );
  }
}
