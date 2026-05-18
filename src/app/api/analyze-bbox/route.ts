import { NextResponse } from 'next/server';
import { callOpenRouter } from '@/lib/openrouter';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { ships, aircraft, bounds, layer } = body;
        const shipsList = Array.isArray(ships) ? ships : [];
        const aircraftList = Array.isArray(aircraft) ? aircraft : [];

        const shipTypeBreakdown = shipsList.reduce<Record<string, number>>((acc, ship) => {
            const type = typeof ship?.type === 'string' ? ship.type.toLowerCase() : 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        const energyShips = shipsList.filter((ship) => {
            const type = typeof ship?.type === 'string' ? ship.type.toLowerCase() : '';
            return type === 'tanker' || type === 'lng';
        });

        const topDestinations = Array.from(
            new Set(
                shipsList
                    .map((ship) => (typeof ship?.destination === 'string' ? ship.destination.trim() : ''))
                    .filter(Boolean),
            ),
        ).slice(0, 5);

        let layerContext = "";
        if (layer) {
            const isWeather = ["temp", "wind", "rain", "storm"].some(l => layer.includes(l));
            if (isWeather) {
                layerContext = `The user is specifically inspecting the METEOROLOGICAL / EXTREME WEATHER layer (${layer}). Your analysis MUST focus primarily on how the typical geographic or current extreme weather/climate conditions in this specific bounding box impact global commodities, agriculture, infrastructure (like oil rigs or refineries), and regional supply chains. DO NOT focus heavily on shipping unless it's weather-delayed. NEVER hallucinate weather data—rely on known climatic risks (e.g. hurricane zones, monsoon flooding, heatwaves) inherent to this region.`;
            } else {
                layerContext = `The user is specifically inspecting INTELLIGENCE layers (e.g., ${layer} - like shadow fleets, thermal signatures, or military/AIS data). Your analysis MUST focus heavily on maritime security, trade bottlenecks, geopolitical tension, and infrastructure output in this region.`;
            }
        }

        const prompt = `You are a strategic geopolitical intelligence analyst at GeoMoney. 
A user has selected a bounding box area on the map.
Bounds: North ${bounds.north}, South ${bounds.south}, East ${bounds.east}, West ${bounds.west}

Here is the data detected in this area:
- Ships: ${shipsList.length} visible. (Sample: ${JSON.stringify(shipsList.slice(0, 10))})
- Aircraft: ${aircraftList.length} visible. (Sample: ${JSON.stringify(aircraftList.slice(0, 10))})
- Ship mix: ${JSON.stringify(shipTypeBreakdown)}
- Energy-linked vessels (tankers/LNG): ${energyShips.length}
- Top declared destinations: ${topDestinations.join(', ') || 'None reported'}

${layerContext}

TASK:
Write a concise 2-3 paragraph strategic intelligence and situational summary of this exact region based on the coordinates and the assets present.

RULES:
1. Identify any strategic choke points, military postures, supply chain concentrations, or points of interest. 
2. Keep the tone professional, objective, and intelligence-oriented.
3. DO NOT hallucinate data or make up specific tracked assets that aren't in the provided list. Do not talk to yourself or show your thinking process.
4. You MUST infer standard geographic context for those coordinates (e.g. if the coordinates cover Assam, mention Assam and its strategic context; if it covers the Strait of Hormuz, explicitly mention the Strait). 
5. If no ships or aircraft are present, just state the area is currently clear of tracked marine and aviation assets and briefly contextualize the geographic significance of the location in relation to the active layer filter.
6. If most visible vessels are not energy-linked, say so clearly instead of overstating oil and gas activity.`;

        const result = await callOpenRouter(prompt, { temperature: 0.3 }); // lowered temp slightly for more focused response

        return NextResponse.json({ summary: result.content, model: result.model });
    } catch (e: any) {
        console.error('BBox Analysis error:', e);
        return NextResponse.json({ error: 'Failed to analyze bounding box' }, { status: 500 });
    }
}
