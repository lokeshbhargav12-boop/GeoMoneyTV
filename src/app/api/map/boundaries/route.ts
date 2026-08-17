import { NextResponse } from "next/server";
import { MAP_API } from "@/config/energyLayers";
import { getBoundaries } from "@/lib/map/powerPlantsSource";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = getBoundaries();
    return NextResponse.json(data, {
      headers: { "Cache-Control": MAP_API.boundariesCache },
    });
  } catch (error) {
    console.error("[Map API] boundaries error:", error);
    return NextResponse.json(
      { error: "Failed to load boundaries" },
      { status: 500 },
    );
  }
}
