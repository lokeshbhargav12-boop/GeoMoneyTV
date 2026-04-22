import { NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";

// ─── CACHE ──────────────────────────────────────────────────
const cache = new Map<string, { brief: any; timestamp: number }>();
const CACHE_TTL = 300_000; // 5 minutes

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const events: string[] = (body.events || []).slice(0, 15);
        const query: string = body.query || "";
        const assetContext = body.assetContext || null;
        const cacheKey = JSON.stringify({ events, query, assetContext });

        const cachedEntry = cache.get(cacheKey);
        if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
            return NextResponse.json({ ...cachedEntry.brief, cached: true });
        }

        const eventsContext = events.length
            ? `\n\nCURRENT INTELLIGENCE FEED:\n${events.map((e, i) => `${i + 1}. ${e}`).join("\n")}`
            : "";

        const userQuery = query
            ? `\n\nANALYST QUERY: ${query}`
            : "";

        const assetSnapshot = assetContext
            ? `\n\nLIVE ASSET SNAPSHOT:\n${JSON.stringify(assetContext, null, 2)}`
            : "";

        const prompt = `You are GEOMONEY APERTURE, an elite AI intelligence analyst for a geopolitical monitoring command center. Generate a concise intelligence briefing. When asset counts or chokepoint counts are present in the live asset snapshot, use those exact values directly instead of estimating.${eventsContext}${userQuery}${assetSnapshot}

Respond in this EXACT JSON format:
{
  "headline": "One-line critical assessment (max 15 words)",
  "threatLevel": "NOMINAL|GUARDED|ELEVATED|HIGH|CRITICAL",
  "summary": "2-3 sentence executive summary of the current global situation",
  "hotspots": [
    {"region": "Region name", "status": "brief status", "severity": "low|medium|high|critical"},
    {"region": "Region name", "status": "brief status", "severity": "low|medium|high|critical"},
    {"region": "Region name", "status": "brief status", "severity": "low|medium|high|critical"}
  ],
  "keyInsight": "One paragraph of deep analytical insight connecting dots across events",
  "recommendations": ["Action item 1", "Action item 2", "Action item 3"],
  "timestamp": "${new Date().toISOString()}"
}

Return ONLY valid JSON. No markdown, no code blocks.`;

        const result = await callOpenRouter(prompt, {
            temperature: 0.4,
            maxTokens: 800,
            caller: "ai-brief",
        });

        // Parse the JSON response
        let brief;
        try {
            // Try to extract JSON from the response
            const jsonMatch = result.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found");
            brief = JSON.parse(jsonMatch[0]);
        } catch {
            // Fallback structured response
            brief = {
                headline: "Intelligence systems active — monitoring global events",
                threatLevel: "ELEVATED",
                summary: result.content.slice(0, 300),
                hotspots: [
                    { region: "Middle East", status: "Tensions elevated", severity: "high" },
                    { region: "Indo-Pacific", status: "Active monitoring", severity: "medium" },
                    { region: "Eastern Europe", status: "Conflict ongoing", severity: "high" },
                ],
                keyInsight: result.content.slice(0, 500),
                recommendations: ["Continue monitoring", "Assess escalation risk", "Review asset positions"],
                timestamp: new Date().toISOString(),
            };
        }

        brief.model = result.model;
        cache.set(cacheKey, { brief, timestamp: Date.now() });

        return NextResponse.json(brief);
    } catch (error: any) {
        console.error("[AI Brief]", error.message);

        return NextResponse.json(
            {
                headline: "AI briefing temporarily unavailable",
                threatLevel: "ELEVATED",
                summary: "Intelligence AI systems are experiencing high load. Reverting to manual analysis protocols.",
                hotspots: [],
                keyInsight: "Automated analysis will resume shortly.",
                recommendations: ["Monitor OSINT feeds manually", "Check back in 5 minutes"],
                error: error.message,
            },
            { status: 503 },
        );
    }
}
