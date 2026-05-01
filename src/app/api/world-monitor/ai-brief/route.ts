import { NextResponse } from "next/server";
import { callOpenRouterJson } from "@/lib/openrouter";

// ─── CACHE ──────────────────────────────────────────────────
const cache = new Map<string, { brief: any; timestamp: number }>();
const CACHE_TTL = 300_000; // 5 minutes

interface AiBriefResponse {
    headline: string;
    threatLevel: string;
    summary: string;
    hotspots: { region: string; status: string; severity: string }[];
    keyInsight: string;
    recommendations: string[];
    queryAnswer?: string;
    timestamp: string;
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const events: string[] = (body.events || []).slice(0, 15);
        const query: string = (body.query || "").trim();
        const assetContext = body.assetContext || null;
        const cacheKey = JSON.stringify({ events, query, assetContext });

        const cachedEntry = cache.get(cacheKey);
        if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
            return NextResponse.json({ ...cachedEntry.brief, cached: true });
        }

        const eventsBlock = events.length
            ? `\nCURRENT INTELLIGENCE FEED:\n${events.map((e, i) => `${i + 1}. ${e}`).join("\n")}`
            : "";

        const isDemo = assetContext?.vessels?.live === false;
        const dataModeCaveat = isDemo
            ? `\nIMPORTANT: Vessel data is currently in DEMO/SIMULATION mode. The vessel positions shown on the globe are simulated and may not match chokepoint counts. When answering about vessel counts, state that data is from demo simulation and actual live counts may differ. Do NOT say "0 ships" as a definitive answer — instead say the demo simulation shows X vessels in the area.`
            : "";
        const assetBlock = assetContext
            ? `\nASSET SNAPSHOT (${isDemo ? "DEMO MODE — simulated positions" : "LIVE AIS DATA"}):\n${JSON.stringify(assetContext, null, 2)}${dataModeCaveat}`
            : "";

        // Build a different prompt depending on whether the user asked a question
        let prompt: string;

        if (query) {
            prompt = `You are GEOMONEY APERTURE, an elite AI intelligence analyst for a geopolitical monitoring command center.

A human analyst has asked this question: "${query}"

Answer the question directly and precisely using the data below.

IMPORTANT RULES FOR VESSEL COUNTS:
- The chokepoint vessel counts represent ships detected IN AND NEAR the chokepoint area (within several hundred km radius).
- If a chokepoint shows 0 vessels, say "No vessels currently detected in the immediate vicinity" but ALWAYS mention the total vessels visible globally (from globalSummary) for context.
- Never just say "0" without context — always provide the broader picture.
- Reference the globalSummary field for overall vessel activity.
- When answering "how many ships are stranded", look at the strandedShips field which counts vessels with speed ≤1 knot, anchored, or moored in the area.
${eventsBlock}${assetBlock}

You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no explanation text outside the JSON. The JSON must match this schema exactly:
{
  "headline": "Short headline summarizing your answer (max 15 words)",
  "threatLevel": "NOMINAL|GUARDED|ELEVATED|HIGH|CRITICAL",
  "summary": "Direct, concise answer to the analyst's question in 2-3 sentences",
  "queryAnswer": "A detailed answer to the specific question asked, referencing exact data and providing global context",
  "hotspots": [
    {"region": "Region name", "status": "brief status", "severity": "low|medium|high|critical"}
  ],
  "keyInsight": "One paragraph connecting the answer to broader strategic implications",
  "recommendations": ["Action 1", "Action 2", "Action 3"],
  "timestamp": "${new Date().toISOString()}"
}`;
        } else {
            prompt = `You are GEOMONEY APERTURE, an elite AI intelligence analyst for a geopolitical monitoring command center. Generate a concise intelligence briefing based on the current data.
${eventsBlock}${assetBlock}

You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no explanation text outside the JSON. The JSON must match this schema exactly:
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
}`;
        }

        try {
            const { data: brief, model } = await callOpenRouterJson<AiBriefResponse>(prompt, {
                temperature: 0.3,
                maxTokens: 1000,
                caller: "ai-brief",
            });

            // Ensure all required fields exist with sensible defaults
            const sanitized = {
                headline: brief.headline || (query ? "Analysis complete" : "Intelligence systems active"),
                threatLevel: brief.threatLevel || "ELEVATED",
                summary: brief.summary || "Analysis generated successfully.",
                queryAnswer: brief.queryAnswer || brief.summary || "",
                hotspots: Array.isArray(brief.hotspots) ? brief.hotspots.slice(0, 5) : [],
                keyInsight: brief.keyInsight || "",
                recommendations: Array.isArray(brief.recommendations) ? brief.recommendations.slice(0, 5) : [],
                timestamp: brief.timestamp || new Date().toISOString(),
                model,
                isQueryResponse: Boolean(query),
            };

            cache.set(cacheKey, { brief: sanitized, timestamp: Date.now() });
            return NextResponse.json(sanitized);
        } catch (parseError) {
            // All models failed to produce valid JSON — return a clean fallback
            console.error("[AI Brief] All models failed:", parseError instanceof Error ? parseError.message : String(parseError));

            const fallback = {
                headline: query
                    ? "Unable to process query — try rephrasing"
                    : "Intelligence systems active — monitoring global events",
                threatLevel: "ELEVATED",
                summary: query
                    ? `Your question "${query}" could not be processed by the AI engine at this time. The system is experiencing high demand. Please try again shortly or rephrase your question.`
                    : "Intelligence AI is experiencing high demand. Automated analysis will resume shortly.",
                queryAnswer: query
                    ? `Unable to answer "${query}" right now. Please try again in a moment.`
                    : "",
                hotspots: [
                    { region: "Middle East", status: "Tensions elevated", severity: "high" },
                    { region: "Indo-Pacific", status: "Active monitoring", severity: "medium" },
                    { region: "Eastern Europe", status: "Conflict ongoing", severity: "high" },
                ],
                keyInsight: "Automated analysis will resume shortly. Manual monitoring is recommended.",
                recommendations: ["Continue monitoring OSINT feeds", "Assess escalation risk", "Review asset positions"],
                timestamp: new Date().toISOString(),
                isQueryResponse: Boolean(query),
            };

            cache.set(cacheKey, { brief: fallback, timestamp: Date.now() });
            return NextResponse.json(fallback);
        }
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
