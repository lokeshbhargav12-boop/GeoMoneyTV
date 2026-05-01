import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─── TYPES ──────────────────────────────────────────────────
export interface CyberEvent {
    id: string;
    title: string;
    description: string;
    type: "vulnerability" | "ransomware" | "apt" | "ddos" | "breach" | "exploit" | "phishing" | "infrastructure";
    severity: number;           // 0–100
    attackVector?: string;
    cveId?: string;
    sourceCountry?: string;
    targetSector?: string;
    source: string;
    url: string;
    timestamp: string;
    active: boolean;
}

// ─── CACHE ──────────────────────────────────────────────────
let cache: { data: CyberEvent[]; ts: number } | null = null;
const CACHE_TTL = 300_000; // 5 min

// ─── CVE CIRCL.LU ───────────────────────────────────────────
function cvssToSeverity(cvss: number | null | undefined): number {
    if (cvss == null) return 40;
    if (cvss >= 9.0) return 95;
    if (cvss >= 7.0) return 75;
    if (cvss >= 5.0) return 55;
    if (cvss >= 3.0) return 35;
    return 20;
}

function classifyCveType(summary: string): CyberEvent["type"] {
    const lower = summary.toLowerCase();
    if (lower.includes("remote code execution") || lower.includes("rce")) return "exploit";
    if (lower.includes("ransomware")) return "ransomware";
    if (lower.includes("phishing")) return "phishing";
    if (lower.includes("denial of service") || lower.includes("dos")) return "ddos";
    if (lower.includes("data breach") || lower.includes("leak")) return "breach";
    if (lower.includes("apt") || lower.includes("advanced persistent")) return "apt";
    if (lower.includes("scada") || lower.includes("ics") || lower.includes("infrastructure")) return "infrastructure";
    return "vulnerability";
}

function extractTargetSector(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes("healthcare") || lower.includes("hospital")) return "Healthcare";
    if (lower.includes("finance") || lower.includes("bank")) return "Finance";
    if (lower.includes("energy") || lower.includes("power grid") || lower.includes("pipeline")) return "Energy";
    if (lower.includes("government") || lower.includes("federal")) return "Government";
    if (lower.includes("defense") || lower.includes("military")) return "Defense";
    if (lower.includes("telecom") || lower.includes("communications")) return "Telecom";
    if (lower.includes("education") || lower.includes("university")) return "Education";
    if (lower.includes("retail") || lower.includes("commerce")) return "Retail";
    if (lower.includes("transport") || lower.includes("aviation")) return "Transportation";
    return "Multi-sector";
}

async function fetchRecentCVEs(): Promise<CyberEvent[]> {
    const results: CyberEvent[] = [];
    try {
        const res = await fetch("https://cve.circl.lu/api/last/20", {
            signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return [];
        const cves: any[] = await res.json();

        for (const cve of cves.slice(0, 15)) {
            const summary = cve.summary || "";
            if (!summary.trim()) continue;

            const cvss = cve.cvss ?? cve.cvss_score ?? null;
            const severity = cvssToSeverity(typeof cvss === "number" ? cvss : parseFloat(cvss));

            // Only include medium+ severity CVEs
            if (severity < 50) continue;

            results.push({
                id: `cve-${cve.id || cve.cve_id || Math.random().toString(36).slice(2)}`,
                title: `${cve.id || "CVE"} — ${summary.substring(0, 80)}`,
                description: summary.substring(0, 400),
                type: classifyCveType(summary),
                severity,
                cveId: cve.id || cve.cve_id,
                attackVector: cve.access?.vector || undefined,
                targetSector: extractTargetSector(summary),
                source: "CVE/CIRCL",
                url: cve.references?.[0] || `https://cve.circl.lu/cve/${cve.id}`,
                timestamp: cve.Published || cve.last_modified || new Date().toISOString(),
                active: true,
            });
        }
    } catch (e) {
        console.warn("[Cyber] CVE CIRCL fetch failed:", e);
    }
    return results;
}

// ─── CISA KEV (Known Exploited Vulnerabilities) ─────────────
async function fetchCISAKEV(): Promise<CyberEvent[]> {
    const results: CyberEvent[] = [];
    try {
        const res = await fetch(
            "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
            { signal: AbortSignal.timeout(10000) },
        );
        if (!res.ok) return [];
        const data = await res.json();
        const vulns: any[] = data.vulnerabilities || [];

        // Get the 10 most recent
        const sorted = vulns
            .filter((v: any) => v.dateAdded)
            .sort((a: any, b: any) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
            .slice(0, 10);

        for (const vuln of sorted) {
            const desc = `${vuln.vulnerabilityName || ""}: ${vuln.shortDescription || ""}`;
            results.push({
                id: `kev-${vuln.cveID}`,
                title: `CISA KEV: ${vuln.cveID} — ${vuln.vulnerabilityName || "Exploited vulnerability"}`,
                description: desc.substring(0, 400),
                type: "exploit",
                severity: 85, // All CISA KEV are actively exploited
                cveId: vuln.cveID,
                attackVector: vuln.knownRansomwareCampaignUse === "Known" ? "Ransomware" : "Active exploitation",
                targetSector: extractTargetSector(desc),
                source: "CISA KEV",
                url: `https://nvd.nist.gov/vuln/detail/${vuln.cveID}`,
                timestamp: vuln.dateAdded ? new Date(vuln.dateAdded).toISOString() : new Date().toISOString(),
                active: true,
            });
        }
    } catch (e) {
        console.warn("[Cyber] CISA KEV fetch failed:", e);
    }
    return results;
}

// ─── CYBER SECURITY RSS FEEDS ───────────────────────────────
const CYBER_RSS_FEEDS = [
    { url: "https://feeds.feedburner.com/TheHackersNews", name: "The Hacker News" },
    { url: "https://www.bleepingcomputer.com/feed/", name: "BleepingComputer" },
    { url: "https://www.darkreading.com/rss.xml", name: "Dark Reading" },
    { url: "https://threatpost.com/feed/", name: "Threatpost" },
];

const CYBER_KEYWORDS = [
    "ransomware", "malware", "hack", "breach", "vulnerability", "zero-day",
    "exploit", "apt", "ddos", "phishing", "trojan", "backdoor", "botnet",
    "scada", "infrastructure attack", "supply chain attack", "data leak",
    "cyber espionage", "nation-state", "critical infrastructure", "encryption",
    "patch", "cve-", "stolen", "compromised", "attack", "threat",
];

function parseRSSItems(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
    const items: Array<{ title: string; link: string; description: string; pubDate: string }> = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
        const x = match[1];
        const title = x.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || "";
        const link = x.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || "";
        const desc = x.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || "";
        const pubDate = x.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || "";
        if (title) items.push({ title, link, description: desc.replace(/<[^>]*>/g, "").substring(0, 400), pubDate });
    }
    return items;
}

function cyberNewsSeverity(text: string): number {
    const lower = text.toLowerCase();
    let score = 40;
    const critical = ["zero-day", "critical infrastructure", "nation-state", "mass breach", "ransomware gang"];
    const high = ["ransomware", "exploit", "backdoor", "supply chain", "data breach", "million records"];
    const moderate = ["vulnerability", "patch", "phishing", "malware", "trojan"];

    critical.forEach((w) => { if (lower.includes(w)) score += 20; });
    high.forEach((w) => { if (lower.includes(w)) score += 12; });
    moderate.forEach((w) => { if (lower.includes(w)) score += 6; });

    return Math.min(100, score);
}

async function fetchCyberRSS(): Promise<CyberEvent[]> {
    const results: CyberEvent[] = [];
    const fetches = CYBER_RSS_FEEDS.map(async (feed) => {
        try {
            const res = await fetch(feed.url, {
                headers: { "User-Agent": "GeoMoney-Intelligence/2.0", "Accept": "application/rss+xml, application/xml, text/xml" },
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return [];
            const xml = await res.text();
            return parseRSSItems(xml).slice(0, 10).map((item) => ({ ...item, feedName: feed.name }));
        } catch {
            return [];
        }
    });

    const allItems = (await Promise.all(fetches)).flat();
    const seen = new Set<string>();

    for (const item of allItems) {
        const key = item.title.toLowerCase().substring(0, 50);
        if (seen.has(key)) continue;
        seen.add(key);

        const combined = `${item.title} ${item.description}`;
        const isRelevant = CYBER_KEYWORDS.some((kw) => combined.toLowerCase().includes(kw));
        if (!isRelevant) continue;

        const severity = cyberNewsSeverity(combined);
        const type = classifyCveType(combined);

        results.push({
            id: `cyber-rss-${Buffer.from(item.link || item.title).toString("base64url").substring(0, 20)}`,
            title: item.title,
            description: item.description.substring(0, 300),
            type,
            severity,
            targetSector: extractTargetSector(combined),
            source: (item as any).feedName || "Cyber OSINT",
            url: item.link,
            timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            active: true,
        });
    }
    return results;
}

// ─── AGGREGATOR ─────────────────────────────────────────────
async function aggregateCyber(): Promise<CyberEvent[]> {
    const [cves, kev, rss] = await Promise.all([
        fetchRecentCVEs().catch(() => []),
        fetchCISAKEV().catch(() => []),
        fetchCyberRSS().catch(() => []),
    ]);

    const all = [...kev, ...cves, ...rss]; // KEV first (highest priority)

    // Dedup by CVE ID or title
    const seen = new Set<string>();
    const deduped = all.filter((e) => {
        const key = e.cveId || e.title.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 40);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    deduped.sort((a, b) => b.severity - a.severity);
    return deduped.slice(0, 60);
}

// ─── HANDLER ────────────────────────────────────────────────
export async function GET() {
    try {
        if (cache && Date.now() - cache.ts < CACHE_TTL) {
            return NextResponse.json({
                success: true,
                cached: true,
                total: cache.data.length,
                events: cache.data,
                timestamp: new Date().toISOString(),
            });
        }

        const events = await aggregateCyber();
        cache = { data: events, ts: Date.now() };

        return NextResponse.json({
            success: true,
            cached: false,
            total: events.length,
            events,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[Cyber API]", error);
        return NextResponse.json({
            success: false,
            total: cache?.data.length || 0,
            events: cache?.data || [],
            timestamp: new Date().toISOString(),
        });
    }
}
