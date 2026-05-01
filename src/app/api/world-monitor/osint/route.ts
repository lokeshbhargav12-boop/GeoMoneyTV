import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  MULTI-SOURCE OSINT INTELLIGENCE AGGREGATOR
//  Sources: Reddit, GDELT, RSS (Reuters/BBC/AlJazeera/etc),
//           USGS Earthquakes, ReliefWeb, Wikipedia, GDACS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

interface OsintEvent {
    id: string
    title: string
    description: string
    source: string
    sourceDetail: string
    url: string
    timestamp: string
    category: string
    threatScore: number
    engagement?: { upvotes?: number; comments?: number }
    locations: Array<{ name: string; lat: number; lng: number; region: string }>
    region: string
    imageUrl?: string
    verified?: boolean
}

// â”€â”€â”€ Caching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let cache: { data: OsintEvent[]; sources: Record<string, number>; ts: number } | null = null
const CACHE_TTL = 90_000

// â”€â”€â”€ REDDIT Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const REDDIT_SUBREDDITS = [
    'worldnews', 'geopolitics', 'economics', 'energy',
    'commodities', 'cybersecurity', 'military', 'intelligence',
    'UkrainianConflict', 'CredibleDefense',
    'MiddleEastNews', 'NuclearPower',
]

// â”€â”€â”€ RSS Feed Sources â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const RSS_FEEDS = [
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', name: 'NY Times World' },
    { url: 'https://www.theguardian.com/world/rss', name: 'The Guardian' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera' },
    { url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html', name: 'CNBC World' },
    { url: 'https://feeds.feedburner.com/ndaboris/fJur', name: 'Defense One' },
]

// â”€â”€â”€ Geopolitics Keywords â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const GEOPOLITICS_KEYWORDS = [
    'conflict', 'sanctions', 'military', 'nato', 'china', 'russia', 'iran',
    'oil', 'gas', 'uranium', 'lithium', 'rare earth', 'cyber', 'attack',
    'missile', 'nuclear', 'navy', 'strait', 'pipeline', 'supply chain',
    'coup', 'election', 'tariff', 'embargo', 'drone', 'submarine',
    'taiwan', 'ukraine', 'israel', 'gaza', 'yemen', 'houthi',
    'south china sea', 'arctic', 'semiconductor', 'defense',
    'espionage', 'intelligence', 'terrorism', 'migration', 'pandemic',
    'inflation', 'recession', 'central bank', 'gold', 'bitcoin',
    'opec', 'lng', 'chokepoint', 'shipping', 'suez', 'panama canal',
    'north korea', 'pyongyang', 'ballistic', 'hypersonic', 'carrier',
    'deployment', 'airspace', 'violation', 'intercept', 'ceasefire',
    'humanitarian', 'refugee', 'blockade', 'strike', 'assassination',
    'weapons', 'arms deal', 'proxy war', 'insurgent', 'militia',
    'earthquake', 'volcano', 'tsunami', 'flooding', 'disaster',
    'martial law', 'state of emergency', 'genocide', 'famine',
    'trade deal', 'belt and road', 'brics', 'g7', 'g20', 'un security',
    'wagner', 'mercenary', 'sanctions evasion',
    'satellite', 'reconnaissance', 'surveillance',
    'border clash', 'territorial waters', 'exclusive economic zone',
    'bomb', 'troops', 'army', 'killed', 'invasion', 'war', 'crisis',
]

// â”€â”€â”€ Location extraction â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const LOCATION_MAP: Record<string, { lat: number; lng: number; region: string }> = {
    'united states': { lat: 39.8, lng: -98.5, region: 'North America' },
    'usa': { lat: 39.8, lng: -98.5, region: 'North America' },
    'washington': { lat: 38.9, lng: -77.0, region: 'North America' },
    'new york': { lat: 40.7, lng: -74.0, region: 'North America' },
    'pentagon': { lat: 38.87, lng: -77.05, region: 'North America' },
    'canada': { lat: 56.1, lng: -106.3, region: 'North America' },
    'mexico': { lat: 23.6, lng: -102.5, region: 'North America' },
    'ukraine': { lat: 48.3, lng: 31.1, region: 'Europe' },
    'kyiv': { lat: 50.4, lng: 30.5, region: 'Europe' },
    'kharkiv': { lat: 49.9, lng: 36.2, region: 'Europe' },
    'crimea': { lat: 44.9, lng: 34.1, region: 'Europe' },
    'donbas': { lat: 48.0, lng: 37.8, region: 'Europe' },
    'zaporizhzhia': { lat: 47.8, lng: 35.1, region: 'Europe' },
    'odesa': { lat: 46.4, lng: 30.7, region: 'Europe' },
    'russia': { lat: 61.5, lng: 105.3, region: 'Europe' },
    'moscow': { lat: 55.7, lng: 37.6, region: 'Europe' },
    'st petersburg': { lat: 59.9, lng: 30.3, region: 'Europe' },
    'kaliningrad': { lat: 54.7, lng: 20.5, region: 'Europe' },
    'germany': { lat: 51.1, lng: 10.4, region: 'Europe' },
    'berlin': { lat: 52.5, lng: 13.4, region: 'Europe' },
    'france': { lat: 46.2, lng: 2.2, region: 'Europe' },
    'paris': { lat: 48.8, lng: 2.3, region: 'Europe' },
    'uk': { lat: 55.3, lng: -3.4, region: 'Europe' },
    'britain': { lat: 55.3, lng: -3.4, region: 'Europe' },
    'london': { lat: 51.5, lng: -0.1, region: 'Europe' },
    'poland': { lat: 51.9, lng: 19.1, region: 'Europe' },
    'romania': { lat: 45.9, lng: 24.9, region: 'Europe' },
    'norway': { lat: 60.4, lng: 8.4, region: 'Europe' },
    'sweden': { lat: 60.1, lng: 18.6, region: 'Europe' },
    'finland': { lat: 61.9, lng: 25.7, region: 'Europe' },
    'baltic': { lat: 56.8, lng: 24.3, region: 'Europe' },
    'lithuania': { lat: 55.1, lng: 23.8, region: 'Europe' },
    'estonia': { lat: 58.5, lng: 25.0, region: 'Europe' },
    'serbia': { lat: 44.0, lng: 20.9, region: 'Europe' },
    'kosovo': { lat: 42.6, lng: 20.9, region: 'Europe' },
    'china': { lat: 35.8, lng: 104.1, region: 'Asia-Pacific' },
    'beijing': { lat: 39.9, lng: 116.4, region: 'Asia-Pacific' },
    'shanghai': { lat: 31.2, lng: 121.4, region: 'Asia-Pacific' },
    'hong kong': { lat: 22.3, lng: 114.1, region: 'Asia-Pacific' },
    'xinjiang': { lat: 41.7, lng: 86.1, region: 'Asia-Pacific' },
    'tibet': { lat: 29.6, lng: 91.1, region: 'Asia-Pacific' },
    'taiwan': { lat: 23.6, lng: 120.9, region: 'Asia-Pacific' },
    'taipei': { lat: 25.0, lng: 121.5, region: 'Asia-Pacific' },
    'taiwan strait': { lat: 24.0, lng: 119.0, region: 'Asia-Pacific' },
    'japan': { lat: 36.2, lng: 138.2, region: 'Asia-Pacific' },
    'tokyo': { lat: 35.6, lng: 139.6, region: 'Asia-Pacific' },
    'okinawa': { lat: 26.3, lng: 127.8, region: 'Asia-Pacific' },
    'south korea': { lat: 35.9, lng: 127.7, region: 'Asia-Pacific' },
    'seoul': { lat: 37.5, lng: 127.0, region: 'Asia-Pacific' },
    'north korea': { lat: 40.3, lng: 127.5, region: 'Asia-Pacific' },
    'pyongyang': { lat: 39.0, lng: 125.7, region: 'Asia-Pacific' },
    'india': { lat: 20.5, lng: 78.9, region: 'Asia-Pacific' },
    'new delhi': { lat: 28.6, lng: 77.2, region: 'Asia-Pacific' },
    'kashmir': { lat: 34.0, lng: 76.0, region: 'Asia-Pacific' },
    'pakistan': { lat: 30.3, lng: 69.3, region: 'Asia-Pacific' },
    'afghanistan': { lat: 33.9, lng: 67.7, region: 'Asia-Pacific' },
    'myanmar': { lat: 19.7, lng: 96.0, region: 'Asia-Pacific' },
    'australia': { lat: -25.2, lng: 133.7, region: 'Asia-Pacific' },
    'philippines': { lat: 12.8, lng: 121.7, region: 'Asia-Pacific' },
    'vietnam': { lat: 14.0, lng: 108.2, region: 'Asia-Pacific' },
    'indonesia': { lat: -0.7, lng: 113.9, region: 'Asia-Pacific' },
    'south china sea': { lat: 12.0, lng: 114.0, region: 'Asia-Pacific' },
    'malaysia': { lat: 4.2, lng: 101.9, region: 'Asia-Pacific' },
    'singapore': { lat: 1.3, lng: 103.8, region: 'Asia-Pacific' },
    'iran': { lat: 32.4, lng: 53.6, region: 'Middle East' },
    'tehran': { lat: 35.6, lng: 51.3, region: 'Middle East' },
    'iraq': { lat: 33.2, lng: 43.6, region: 'Middle East' },
    'baghdad': { lat: 33.3, lng: 44.3, region: 'Middle East' },
    'israel': { lat: 31.0, lng: 34.8, region: 'Middle East' },
    'tel aviv': { lat: 32.0, lng: 34.7, region: 'Middle East' },
    'jerusalem': { lat: 31.7, lng: 35.2, region: 'Middle East' },
    'gaza': { lat: 31.3, lng: 34.3, region: 'Middle East' },
    'west bank': { lat: 31.9, lng: 35.2, region: 'Middle East' },
    'lebanon': { lat: 33.8, lng: 35.8, region: 'Middle East' },
    'beirut': { lat: 33.8, lng: 35.5, region: 'Middle East' },
    'hezbollah': { lat: 33.8, lng: 35.8, region: 'Middle East' },
    'saudi arabia': { lat: 23.8, lng: 45.0, region: 'Middle East' },
    'riyadh': { lat: 24.7, lng: 46.7, region: 'Middle East' },
    'yemen': { lat: 15.5, lng: 48.5, region: 'Middle East' },
    'houthi': { lat: 15.3, lng: 44.2, region: 'Middle East' },
    'syria': { lat: 34.8, lng: 38.9, region: 'Middle East' },
    'damascus': { lat: 33.5, lng: 36.2, region: 'Middle East' },
    'turkey': { lat: 38.9, lng: 35.2, region: 'Middle East' },
    'ankara': { lat: 39.9, lng: 32.8, region: 'Middle East' },
    'istanbul': { lat: 41.0, lng: 28.9, region: 'Middle East' },
    'uae': { lat: 23.4, lng: 53.8, region: 'Middle East' },
    'dubai': { lat: 25.2, lng: 55.2, region: 'Middle East' },
    'qatar': { lat: 25.3, lng: 51.1, region: 'Middle East' },
    'oman': { lat: 21.4, lng: 55.9, region: 'Middle East' },
    'kuwait': { lat: 29.3, lng: 47.9, region: 'Middle East' },
    'bahrain': { lat: 26.0, lng: 50.5, region: 'Middle East' },
    'strait of hormuz': { lat: 26.5, lng: 56.2, region: 'Middle East' },
    'red sea': { lat: 20.0, lng: 38.0, region: 'Middle East' },
    'nigeria': { lat: 9.0, lng: 8.6, region: 'Africa' },
    'south africa': { lat: -30.5, lng: 22.9, region: 'Africa' },
    'congo': { lat: -4.0, lng: 21.7, region: 'Africa' },
    'drc': { lat: -4.0, lng: 21.7, region: 'Africa' },
    'ethiopia': { lat: 9.1, lng: 40.4, region: 'Africa' },
    'niger': { lat: 17.6, lng: 8.0, region: 'Africa' },
    'mali': { lat: 17.5, lng: -3.9, region: 'Africa' },
    'sahel': { lat: 15.0, lng: 0.0, region: 'Africa' },
    'libya': { lat: 26.3, lng: 17.2, region: 'Africa' },
    'sudan': { lat: 12.8, lng: 30.2, region: 'Africa' },
    'khartoum': { lat: 15.5, lng: 32.5, region: 'Africa' },
    'somalia': { lat: 5.1, lng: 46.1, region: 'Africa' },
    'mozambique': { lat: -18.6, lng: 35.5, region: 'Africa' },
    'egypt': { lat: 26.8, lng: 30.8, region: 'Africa' },
    'cairo': { lat: 30.0, lng: 31.2, region: 'Africa' },
    'morocco': { lat: 31.7, lng: -7.0, region: 'Africa' },
    'kenya': { lat: -0.0, lng: 37.9, region: 'Africa' },
    'brazil': { lat: -14.2, lng: -51.9, region: 'South America' },
    'argentina': { lat: -38.4, lng: -63.6, region: 'South America' },
    'chile': { lat: -35.6, lng: -71.5, region: 'South America' },
    'bolivia': { lat: -16.2, lng: -63.5, region: 'South America' },
    'venezuela': { lat: 6.4, lng: -66.5, region: 'South America' },
    'colombia': { lat: 4.5, lng: -74.2, region: 'South America' },
    'peru': { lat: -9.1, lng: -75.0, region: 'South America' },
    'arctic': { lat: 72.0, lng: 0.0, region: 'Arctic' },
    'greenland': { lat: 71.7, lng: -42.6, region: 'Arctic' },
    'suez canal': { lat: 30.4, lng: 32.3, region: 'Middle East' },
    'suez': { lat: 30.4, lng: 32.3, region: 'Middle East' },
    'panama canal': { lat: 9.0, lng: -79.6, region: 'North America' },
    'malacca': { lat: 2.5, lng: 101.5, region: 'Asia-Pacific' },
    'malacca strait': { lat: 2.5, lng: 101.5, region: 'Asia-Pacific' },
    'bab el mandeb': { lat: 12.5, lng: 43.3, region: 'Middle East' },
    'bosporus': { lat: 41.1, lng: 29.0, region: 'Europe' },
    'black sea': { lat: 43.0, lng: 35.0, region: 'Europe' },
    'mediterranean': { lat: 35.0, lng: 18.0, region: 'Europe' },
    'persian gulf': { lat: 26.0, lng: 52.0, region: 'Middle East' },
    'gulf of aden': { lat: 12.5, lng: 47.0, region: 'Middle East' },
}

// â”€â”€â”€ Category classification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CATEGORY_PATTERNS: Record<string, RegExp> = {
    military: /military|navy|army|airforce|missile|weapon|defense|nato|war|conflict|troops|submarine|warship|drone strike|artillery|ammunition|battalion|brigade|airstrike|bombing|offensive|counteroffensive|frontline/i,
    cyber: /cyber|hack|ransomware|malware|data breach|zero.day|phishing|ddos|scada|infrastructure attack|vulnerability|exploit|apt|botnet|spyware/i,
    energy: /oil|gas|opec|pipeline|energy|nuclear power|uranium|solar|wind|lng|refinery|coal|electricity|power grid|blackout|barrel|crude|brent|wti/i,
    economic: /sanction|tariff|trade war|gdp|inflation|recession|central bank|currency|debt|bond|stock|market crash|imf|world bank|default|devaluation|interest rate/i,
    geopolitical: /diplomat|treaty|summit|alliance|coup|election|referendum|protest|revolution|territorial|border|annexation|recognition|sovereignty|independence|negotiation/i,
    supply_chain: /supply chain|rare earth|lithium|cobalt|semiconductor|chip|shipping|chokepoint|blockade|embargo|cargo|freight|container|logistics|port/i,
    terrorism: /terror|extremis|insurgent|militia|bomb|explosive|hostage|kidnap|isis|al.qaeda|boko haram|al.shabaab|separatist/i,
    climate: /climate|flood|drought|wildfire|hurricane|earthquake|tsunami|disaster|famine|typhoon|cyclone|volcano|landslide|heat wave/i,
    nuclear: /nuclear|warhead|icbm|enrichment|centrifuge|plutonium|nonproliferation|iaea|atomic|radiation|fallout|deterrent|arsenal/i,
}

function classifyCategory(text: string): string {
    const lower = text.toLowerCase()
    for (const [cat, pattern] of Object.entries(CATEGORY_PATTERNS)) {
        if (pattern.test(lower)) return cat
    }
    return 'geopolitical'
}

function extractLocations(text: string): Array<{ name: string; lat: number; lng: number; region: string }> {
    const lower = text.toLowerCase()
    const found: Array<{ name: string; lat: number; lng: number; region: string }> = []
    const seen = new Set<string>()
    const entries = Object.entries(LOCATION_MAP).sort((a, b) => b[0].length - a[0].length)
    for (const [key, loc] of entries) {
        if (lower.includes(key) && !seen.has(`${loc.lat},${loc.lng}`)) {
            seen.add(`${loc.lat},${loc.lng}`)
            found.push({ name: key, ...loc })
        }
    }
    return found
}

function scoreThreat(text: string): number {
    let score = 30
    const lower = text.toLowerCase()
    const critical = ['nuclear strike', 'world war', 'invasion launched', 'chemical weapon', 'genocide', 'mass casualty']
    const escalation = ['war', 'attack', 'missile', 'nuclear', 'invasion', 'killed', 'explosion', 'strike', 'crash', 'crisis', 'bombing', 'airstrike', 'casualties', 'dead', 'wounded', 'destroyed']
    const moderate = ['sanction', 'tension', 'dispute', 'protest', 'threat', 'warning', 'military', 'deploy', 'mobilization', 'drill', 'exercise', 'buildup']
    const deescalation = ['peace', 'treaty', 'agreement', 'ceasefire', 'negotiate', 'resolve', 'aid', 'humanitarian', 'withdraw']

    critical.forEach(w => { if (lower.includes(w)) score += 25 })
    escalation.forEach(w => { if (lower.includes(w)) score += 12 })
    moderate.forEach(w => { if (lower.includes(w)) score += 6 })
    deescalation.forEach(w => { if (lower.includes(w)) score -= 4 })

    return Math.max(10, Math.min(100, score))
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SOURCE 1: Reddit OSINT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function fetchRedditOSINT(): Promise<OsintEvent[]> {
    const results: OsintEvent[] = []
    const fetches = REDDIT_SUBREDDITS.map(async (sub) => {
        try {
            const res = await fetch(
                `https://www.reddit.com/r/${sub}/hot.json?limit=20`,
                {
                    headers: { 'User-Agent': 'GeoMoney-WorldMonitor/2.0 (intelligence-dashboard)' },
                    signal: AbortSignal.timeout(8000),
                }
            )
            if (!res.ok) return []
            const data = await res.json()
            return (data?.data?.children || []).map((child: any) => ({
                id: child.data.id,
                title: child.data.title,
                text: (child.data.selftext || '').substring(0, 500),
                url: `https://reddit.com${child.data.permalink}`,
                score: child.data.score,
                comments: child.data.num_comments,
                subreddit: child.data.subreddit,
                created: child.data.created_utc,
                thumbnail: child.data.thumbnail?.startsWith('http') ? child.data.thumbnail : undefined,
            }))
        } catch { return [] }
    })

    const allPosts = (await Promise.all(fetches)).flat()
    for (const post of allPosts) {
        const combined = `${post.title} ${post.text}`.toLowerCase()
        const isRelevant = GEOPOLITICS_KEYWORDS.some(kw => combined.includes(kw))
        if (isRelevant && post.score > 30) {
            const locations = extractLocations(`${post.title} ${post.text}`)
            const category = classifyCategory(`${post.title} ${post.text}`)
            const threat = scoreThreat(`${post.title} ${post.text}`)
            results.push({
                id: `reddit-${post.id}`,
                title: post.title,
                description: post.text.substring(0, 250) || post.title,
                source: 'reddit',
                sourceDetail: `r/${post.subreddit}`,
                url: post.url,
                timestamp: new Date(post.created * 1000).toISOString(),
                category,
                threatScore: threat,
                engagement: { upvotes: post.score, comments: post.comments },
                locations,
                region: locations[0]?.region || 'Global',
                imageUrl: post.thumbnail,
            })
        }
    }
    return results
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SOURCE 2: GDELT Project (free, no auth, massive event DB)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function fetchGDELT(): Promise<OsintEvent[]> {
    const results: OsintEvent[] = []
    try {
        const queries = [
            'conflict OR military OR sanctions OR missile',
            'nuclear OR terrorism OR cyber attack',
            'oil crisis OR energy OR OPEC OR pipeline',
            'China Taiwan OR South China Sea',
            'Russia Ukraine OR NATO',
            'Iran Israel OR Middle East crisis',
        ]
        const fetches = queries.map(async (query) => {
            try {
                const encoded = encodeURIComponent(query)
                const res = await fetch(
                    `https://api.gdeltproject.org/api/v2/doc/doc?query=${encoded}&mode=ArtList&maxrecords=15&format=json&timespan=24h&sort=DateDesc`,
                    { signal: AbortSignal.timeout(10000) }
                )
                if (!res.ok) return []
                const data = await res.json()
                return data?.articles || []
            } catch { return [] }
        })

        const allArticles = (await Promise.all(fetches)).flat()
        const seen = new Set<string>()

        for (const article of allArticles) {
            if (!article.title || seen.has(article.title)) continue
            seen.add(article.title)
            const combined = `${article.title} ${article.seendate || ''}`
            const locations = extractLocations(combined)
            const category = classifyCategory(combined)
            const threat = scoreThreat(combined)

            // Parse GDELT date format (20260416T120000Z)
            let ts = new Date().toISOString()
            if (article.seendate) {
                try {
                    const d = article.seendate
                    ts = new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(9, 11)}:${d.slice(11, 13)}:${d.slice(13, 15)}Z`).toISOString()
                } catch { /* use default */ }
            }

            results.push({
                id: `gdelt-${Buffer.from(article.url || article.title).toString('base64url').substring(0, 20)}`,
                title: article.title,
                description: article.title,
                source: 'gdelt',
                sourceDetail: article.domain || 'GDELT Monitor',
                url: article.url || '',
                timestamp: ts,
                category,
                threatScore: threat,
                locations,
                region: locations[0]?.region || 'Global',
                imageUrl: article.socialimage || undefined,
                verified: true,
            })
        }
    } catch (e) {
        console.error('GDELT fetch error:', e)
    }
    return results
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SOURCE 3: RSS Feeds (major news agencies)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function parseRSSItems(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
    const items: Array<{ title: string; link: string; description: string; pubDate: string }> = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi
    let match
    while ((match = itemRegex.exec(xml)) !== null) {
        const x = match[1]
        const title = x.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || ''
        const link = x.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || ''
        const desc = x.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || ''
        const pubDate = x.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || ''
        if (title) items.push({ title, link, description: desc.replace(/<[^>]*>/g, '').substring(0, 300), pubDate })
    }
    return items
}

async function fetchRSSFeeds(): Promise<OsintEvent[]> {
    const results: OsintEvent[] = []
    const fetches = RSS_FEEDS.map(async (feed) => {
        try {
            const res = await fetch(feed.url, {
                headers: { 'User-Agent': 'GeoMoney-Intelligence/2.0', 'Accept': 'application/rss+xml, application/xml, text/xml' },
                signal: AbortSignal.timeout(8000),
            })
            if (!res.ok) return []
            const xml = await res.text()
            return parseRSSItems(xml).slice(0, 10).map(item => ({ ...item, feedName: feed.name }))
        } catch { return [] }
    })

    const allItems = (await Promise.all(fetches)).flat()
    const seen = new Set<string>()

    for (const item of allItems) {
        const key = item.title.toLowerCase().substring(0, 50)
        if (seen.has(key)) continue
        seen.add(key)
        const combined = `${item.title} ${item.description}`
        const isRelevant = GEOPOLITICS_KEYWORDS.some(kw => combined.toLowerCase().includes(kw))
        if (!isRelevant) continue

        const locations = extractLocations(combined)
        const category = classifyCategory(combined)
        const threat = scoreThreat(combined)

        results.push({
            id: `rss-${Buffer.from(item.link || item.title).toString('base64url').substring(0, 20)}`,
            title: item.title,
            description: item.description || item.title,
            source: 'news',
            sourceDetail: item.feedName,
            url: item.link,
            timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            category,
            threatScore: threat,
            locations,
            region: locations[0]?.region || 'Global',
            verified: true,
        })
    }
    return results
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SOURCE 4: USGS Earthquake Hazards (free, no auth)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function fetchUSGSEarthquakes(): Promise<OsintEvent[]> {
    const results: OsintEvent[] = []
    try {
        const res = await fetch(
            'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson',
            { signal: AbortSignal.timeout(8000) }
        )
        if (!res.ok) return []
        const data = await res.json()

        for (const feature of (data.features || []).slice(0, 15)) {
            const props = feature.properties
            const [lng, lat] = feature.geometry.coordinates
            const mag = props.mag || 0
            let threat = 30
            if (mag >= 7) threat = 90
            else if (mag >= 6) threat = 70
            else if (mag >= 5) threat = 50

            results.push({
                id: `usgs-${feature.id}`,
                title: `M${mag.toFixed(1)} Earthquake â€” ${props.place || 'Unknown'}`,
                description: `Magnitude ${mag.toFixed(1)} earthquake at depth ${(feature.geometry.coordinates[2] || 0).toFixed(0)}km. ${props.tsunami ? 'âš ï¸ TSUNAMI WARNING' : ''} Alert: ${props.alert || 'none'}`,
                source: 'usgs',
                sourceDetail: 'USGS Earthquake Hazards',
                url: props.url || 'https://earthquake.usgs.gov',
                timestamp: new Date(props.time).toISOString(),
                category: 'climate',
                threatScore: threat,
                locations: [{ name: props.place || 'Unknown', lat, lng, region: 'Global' }],
                region: 'Global',
                verified: true,
            })
        }
    } catch (e) { console.error('USGS fetch error:', e) }
    return results
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SOURCE 5: ReliefWeb (UN OCHA humanitarian crises, free)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function fetchReliefWeb(): Promise<OsintEvent[]> {
    const results: OsintEvent[] = []
    try {
        const res = await fetch(
            'https://api.reliefweb.int/v1/reports?appname=geomoney&limit=20&preset=latest&fields[include][]=title&fields[include][]=body-html&fields[include][]=url&fields[include][]=date.created&fields[include][]=country.name&fields[include][]=primary_country.location&fields[include][]=source.shortname',
            { signal: AbortSignal.timeout(8000) }
        )
        if (!res.ok) return []
        const data = await res.json()

        for (const item of (data.data || []).slice(0, 15)) {
            const f = item.fields
            const title = f.title || ''
            const body = (f['body-html'] || '').replace(/<[^>]*>/g, '').substring(0, 300)
            const country = f.country?.[0]?.name || ''
            const loc = f.primary_country?.location
            const locations = extractLocations(`${title} ${country}`)
            if (loc?.lat && loc?.lon && locations.length === 0) {
                locations.push({ name: country, lat: loc.lat, lng: loc.lon, region: 'Global' })
            }
            const category = classifyCategory(`${title} ${body}`)
            const threat = scoreThreat(`${title} ${body}`)

            results.push({
                id: `reliefweb-${item.id}`,
                title,
                description: body || title,
                source: 'reliefweb',
                sourceDetail: f.source?.[0]?.shortname || 'ReliefWeb',
                url: f.url || `https://reliefweb.int/node/${item.id}`,
                timestamp: f.date?.created || new Date().toISOString(),
                category: category === 'geopolitical' ? 'climate' : category,
                threatScore: Math.max(threat, 40),
                locations,
                region: locations[0]?.region || 'Global',
                verified: true,
            })
        }
    } catch (e) { console.error('ReliefWeb fetch error:', e) }
    return results
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SOURCE 6: GDACS (Global Disaster Alerting System)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function fetchGDACS(): Promise<OsintEvent[]> {
    const results: OsintEvent[] = []
    try {
        const res = await fetch('https://www.gdacs.org/xml/rss.xml', {
            headers: { 'User-Agent': 'GeoMoney-Intelligence/2.0' },
            signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) return []
        const xml = await res.text()
        const items = parseRSSItems(xml)

        for (const item of items.slice(0, 10)) {
            const combined = `${item.title} ${item.description}`
            const locations = extractLocations(combined)
            const threat = scoreThreat(combined)

            const coordMatch = combined.match(/Lat:\s*([-\d.]+)\s*,?\s*Lon:\s*([-\d.]+)/i)
            if (coordMatch && locations.length === 0) {
                locations.push({ name: item.title.substring(0, 40), lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]), region: 'Global' })
            }

            results.push({
                id: `gdacs-${Buffer.from(item.title).toString('base64url').substring(0, 16)}`,
                title: item.title,
                description: item.description || item.title,
                source: 'gdacs',
                sourceDetail: 'GDACS Alert System',
                url: item.link || 'https://www.gdacs.org',
                timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                category: 'climate',
                threatScore: Math.max(threat, 50),
                locations,
                region: locations[0]?.region || 'Global',
                verified: true,
            })
        }
    } catch (e) { console.error('GDACS fetch error:', e) }
    return results
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SOURCE 7: Hacker News (tech/security intelligence)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function fetchHackerNews(): Promise<OsintEvent[]> {
    const results: OsintEvent[] = []
    try {
        const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { signal: AbortSignal.timeout(5000) })
        if (!res.ok) return []
        const ids: number[] = await res.json()

        const storyFetches = ids.slice(0, 30).map(async (id) => {
            try {
                const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(4000) })
                if (!r.ok) return null
                return r.json()
            } catch { return null }
        })
        const stories = (await Promise.all(storyFetches)).filter(Boolean)

        for (const story of stories) {
            if (!story?.title || story.score < 50) continue
            const combined = `${story.title} ${story.text || ''}`
            const isRelevant = GEOPOLITICS_KEYWORDS.some(kw => combined.toLowerCase().includes(kw))
            if (!isRelevant) continue

            const locations = extractLocations(combined)
            const category = classifyCategory(combined)
            const threat = scoreThreat(combined)

            results.push({
                id: `hn-${story.id}`,
                title: story.title,
                description: (story.text || story.title).substring(0, 250),
                source: 'hackernews',
                sourceDetail: 'Hacker News',
                url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
                timestamp: new Date(story.time * 1000).toISOString(),
                category,
                threatScore: threat,
                engagement: { upvotes: story.score, comments: story.descendants || 0 },
                locations,
                region: locations[0]?.region || 'Global',
            })
        }
    } catch (e) { console.error('HN fetch error:', e) }
    return results
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  AGGREGATOR â€” Merge, deduplicate, rank
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function aggregateAllSources(): Promise<{ events: OsintEvent[]; sources: Record<string, number> }> {
    const [reddit, gdelt, rss, usgs, reliefweb, gdacs, hn] = await Promise.all([
        fetchRedditOSINT().catch(() => []),
        fetchGDELT().catch(() => []),
        fetchRSSFeeds().catch(() => []),
        fetchUSGSEarthquakes().catch(() => []),
        fetchReliefWeb().catch(() => []),
        fetchGDACS().catch(() => []),
        fetchHackerNews().catch(() => []),
    ])

    const allEvents = [...reddit, ...gdelt, ...rss, ...usgs, ...reliefweb, ...gdacs, ...hn]

    // Deduplicate by title similarity
    const seen = new Set<string>()
    const unique = allEvents.filter(e => {
        const key = e.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 40)
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })

    // Sort by threat score then recency
    unique.sort((a, b) => {
        const scoreDiff = b.threatScore - a.threatScore
        if (Math.abs(scoreDiff) > 5) return scoreDiff
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    const sources: Record<string, number> = {
        reddit: reddit.length,
        gdelt: gdelt.length,
        news: rss.length,
        usgs: usgs.length,
        reliefweb: reliefweb.length,
        gdacs: gdacs.length,
        hackernews: hn.length,
    }

    return { events: unique.slice(0, 250), sources }
}

// â”€â”€â”€ Main GET handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function GET() {
    try {
        if (cache && Date.now() - cache.ts < CACHE_TTL) {
            return NextResponse.json({
                success: true,
                timestamp: new Date().toISOString(),
                cached: true,
                sources: cache.sources,
                totalEvents: cache.data.length,
                events: cache.data,
            })
        }

        const { events, sources } = await aggregateAllSources()
        cache = { data: events, sources, ts: Date.now() }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            cached: false,
            sources,
            totalEvents: events.length,
            events,
        }, {
            headers: { 'Cache-Control': 's-maxage=90, stale-while-revalidate=300' },
        })
    } catch (error) {
        console.error('OSINT aggregator error:', error)
        if (cache) {
            return NextResponse.json({
                success: true,
                timestamp: new Date().toISOString(),
                cached: true,
                stale: true,
                sources: cache.sources,
                totalEvents: cache.data.length,
                events: cache.data,
            })
        }
        return NextResponse.json({
            success: false,
            timestamp: new Date().toISOString(),
            sources: {},
            totalEvents: 0,
            events: [],
        }, { status: 200 })
    }
}
