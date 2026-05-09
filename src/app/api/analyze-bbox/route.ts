import { NextResponse } from 'next/server';
import { callOpenRouter } from '@/lib/openrouter';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { ships, aircraft, bounds } = body;

        const prompt = `You are a strategic geopolitical intelligence analyst at GeoMoney. 
A user has selected a bounding box area on the map.
Bounds: North ${bounds.north}, South ${bounds.south}, East ${bounds.east}, West ${bounds.west}

Here is the data detected in this area:
- Ships: ${ships.length} visible. (Sample: ${JSON.stringify(ships.slice(0, 10))})
- Aircraft: ${aircraft.length} visible. (Sample: ${JSON.stringify(aircraft.slice(0, 10))})

Write a concise 2-3 paragraph strategic intelligence and situational summary of this region based on the assets present. 
Identify any strategic choke points, military postures, supply chain concentrations, or points of interest. 
Keep the tone professional and intelligence-oriented. Do not hallucinate data that isn't present in the provided list, but you may infer standard geographic context for those coordinates (e.g. if the coordinates cover Assam, mention Assam and its strategic context along with the data). If no ships or aircraft are present, just state the area is currently clear of tracked marine and aviation assets and briefly note its geographic significance.`;

        const result = await callOpenRouter(prompt, { temperature: 0.7 });

        return NextResponse.json({ summary: result.content, model: result.model });
    } catch (e: any) {
        console.error('BBox Analysis error:', e);
        return NextResponse.json({ error: 'Failed to analyze bounding box' }, { status: 500 });
    }
}
