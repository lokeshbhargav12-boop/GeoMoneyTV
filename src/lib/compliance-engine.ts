// GeoMoney Compliance Engine
// Ensures all generated reports follow non-advisory, system-focused language.
// Never describe what to DO. Only describe what is HAPPENING.

// ─── HARD BLOCK terms (auto-fail if present) ────────────────────────────────
const HARD_BLOCK = [
    /\b(buy|sell|trade|short(?:ing)?|long(?:ing)?)\b(?=.*\b(position|market|stock|fund|asset|commodit))/gi,
    /\bportfolio\b/gi,
    /\b(allocation|rebalancing|overweight|underweight)\b/gi,
    /\b(we recommend|recommendation|recommended)\b/gi,
    /\b(expected return|guaranteed|risk[- ]free)\b/gi,
]

// ─── HIGH RISK terms (auto-rewrite) ────────────────────────────────────────
const HIGH_RISK_REPLACEMENTS: [RegExp, string][] = [
    [/\binvestors?\b/gi, 'markets'],
    [/\bpositioning\b/gi, 'market behavior'],
    [/\bpositioned for\b/gi, 'reflecting conditions consistent with'],
    [/\b(upside)\b/gi, 'upper-bound scenario'],
    [/\b(downside)\b/gi, 'lower-bound scenario'],
    [/\b(forecast(?:ed)?|projected)\b/gi, 'scenario'],
    [/\bprice target\b/gi, 'scenario range'],
    [/\bshould monitor\b/gi, 'watchpoints include'],
    [/\bshould consider\b/gi, 'it is worth noting'],
    [/\bshould watch\b/gi, 'watchpoints include'],
    [/\bhedge\b/gi, 'defensive behavior'],
    [/\ballocations?\b/gi, 'capital flows'],
    [/\bopportunit(y|ies)\b/gi, 'system response'],
    [/\bbullish\b/gi, 'exhibiting upward pressure'],
    [/\bbearish\b/gi, 'exhibiting downward pressure'],
    [/\brally\b/gi, 'upward movement'],
    [/\bcorrection\b/gi, 'retracement'],
    [/\btrade setup\b/gi, 'system configuration'],
    [/\bentry point\b/gi, 'price level'],
    [/\bexit level\b/gi, 'price level'],
    [/\bstrategy\b/gi, 'system dynamic'],
    [/\bessential for positioning\b/gi, 'relevant to system analysis'],
]

/**
 * Run the compliance engine on generated report text.
 * Returns the sanitized text and any warnings found.
 */
export function enforceCompliance(text: string): { cleaned: string; warnings: string[] } {
    const warnings: string[] = []
    let cleaned = text

    // Step 1: Check for hard blocks
    for (const pattern of HARD_BLOCK) {
        const match = cleaned.match(pattern)
        if (match) {
            warnings.push(`HARD BLOCK removed: "${match[0]}"`)
            cleaned = cleaned.replace(pattern, '[content removed for compliance]')
        }
    }

    // Step 2: Apply high-risk replacements
    for (const [pattern, replacement] of HIGH_RISK_REPLACEMENTS) {
        const match = cleaned.match(pattern)
        if (match) {
            warnings.push(`Replaced: "${match[0]}" → "${replacement}"`)
            cleaned = cleaned.replace(pattern, replacement)
        }
    }

    // Step 3: Remove price + time combos (e.g. "will trade between $X–$Y next week")
    const priceTimePattern = /\b(will|expected to|projected to)\s+(trade|reach|hit|move)\s+(between\s+)?\$[\d,.]+[–\-]\$[\d,.]+\s+(next|this)\s+(week|month|day)/gi
    const ptMatch = cleaned.match(priceTimePattern)
    if (ptMatch) {
        warnings.push(`Price+time combo removed: "${ptMatch[0]}"`)
        cleaned = cleaned.replace(priceTimePattern, 'under current conditions, scenario analysis suggests a range')
    }

    // Step 4: Ensure disclaimer is mentioned
    if (!cleaned.includes('informational') && !cleaned.includes('analytical purposes')) {
        warnings.push('Disclaimer language not detected — will be added by template')
    }

    return { cleaned, warnings }
}

/**
 * Compliance prompt instructions injected into AI generation prompts.
 * This guides the AI to produce compliant content from the start.
 */
export const COMPLIANCE_PROMPT = `
CRITICAL COMPLIANCE RULES — You MUST follow these:
1. NEVER use: buy, sell, trade, short, long, portfolio, allocation, rebalancing, overweight, underweight, recommendation, expected return, guaranteed, risk-free
2. NEVER use: bullish, bearish, upside, downside, rally, correction, positioning, strategy, trade setup, entry/exit point
3. NEVER combine price + time predictions (e.g. "will trade at $X next week")
4. NEVER address "investors" — use "markets" or "systems"
5. NEVER use phrases like "should monitor", "should consider" — use "watchpoints include"
6. Replace: forecast→scenario, hedge→defensive behavior, allocation→capital flows, opportunity→system response
7. Structure: Geopolitics → Systems → Signals (NEVER Geopolitics → Market → Action)
8. Executive Summary: no investor language, no price forecasts
9. Market Snapshot: prices allowed as reference only, no action interpretation
10. Scenario sections: only conditional language, no price+time combos
11. Watchpoints: no instruction or positioning language
12. ALWAYS end with disclaimer: "This report is for informational and analytical purposes only and does not constitute financial or investment advice."
13. Core principle: NEVER describe what to DO. ONLY describe what is HAPPENING.
`.trim()
