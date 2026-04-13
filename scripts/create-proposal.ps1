
$Out = "C:\Users\nicus\Desktop\GeoMoney_Prod\GeoMoney\GeoMoney_WorldMonitor_Feature_Proposal.docx"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc  = $word.Documents.Add()
$sel  = $word.Selection

$doc.PageSetup.TopMargin    = 72
$doc.PageSetup.BottomMargin = 72
$doc.PageSetup.LeftMargin   = 85
$doc.PageSetup.RightMargin  = 85

function H1($t)  { $sel.Style = $doc.Styles.Item("Heading 1"); $sel.TypeText($t); $sel.TypeParagraph() }
function H2($t)  { $sel.Style = $doc.Styles.Item("Heading 2"); $sel.TypeText($t); $sel.TypeParagraph() }
function H3($t)  { $sel.Style = $doc.Styles.Item("Heading 3"); $sel.TypeText($t); $sel.TypeParagraph() }
function P($t)   { $sel.Style = $doc.Styles.Item("Normal");    $sel.TypeText($t); $sel.TypeParagraph() }
function B($t)   { $sel.Style = $doc.Styles.Item("List Bullet"); $sel.TypeText($t); $sel.TypeParagraph() }
function PB()    { $sel.InsertBreak(7) }
function Blank() { $sel.Style = $doc.Styles.Item("Normal"); $sel.TypeParagraph() }

# ══ COVER PAGE ═══════════════════════════════════════════════════════════
$sel.ParagraphFormat.Alignment = 1
$sel.Style = $doc.Styles.Item("Title")
$sel.TypeText("GEOMONEY WORLD MONITOR")
$sel.TypeParagraph()

$sel.Style = $doc.Styles.Item("Subtitle")
$sel.TypeText("Feature Proposal and Product Design Document")
$sel.TypeParagraph()
$sel.TypeParagraph()

$sel.Style = $doc.Styles.Item("Normal")
$sel.TypeText("Prepared by: GeoMoney TV Strategic Product Team")
$sel.TypeParagraph()
$sel.TypeText("Date: April 2026")
$sel.TypeParagraph()
$sel.TypeText("Version: 1.0   |   Client Proposal")
$sel.TypeParagraph()
$sel.TypeParagraph()
$sel.Font.Bold = $true
$sel.TypeText("CONFIDENTIAL -- NOT FOR DISTRIBUTION")
$sel.Font.Bold = $false
$sel.TypeParagraph()
$sel.ParagraphFormat.Alignment = 0

PB

# ══ 1. EXECUTIVE SUMMARY ════════════════════════════════════════════════
H1 "1. Executive Summary"
P "GeoMoney World Monitor is a next-generation premium strategic intelligence platform that unifies geopolitical monitoring, financial market intelligence, energy and commodities tracking, and an industry-first operational theater visualization system -- all within a single command-centre interface."
P "By combining GeoMoney TV's established geopolitical-financial intelligence brand with the capabilities of the open-source World Monitor platform and a `God's Eye View' operational replay system, this product delivers the most comprehensive geopolitical intelligence experience available to analysts, institutional investors, government clients, and strategic decision-makers."
P "The platform is built on GeoMoney's existing Next.js 14 codebase, with Three.js already installed and ready for the 3D globe layer. This dramatically reduces development time and risk, allowing the team to ship a market-ready product on an accelerated timeline."

PB

# ══ 2. THE VISION ═══════════════════════════════════════════════════════
H1 "2. The Vision"
$sel.Style = $doc.Styles.Item("Normal")
$sel.Font.Bold = $true
$sel.Font.Italic = $true
$sel.TypeText("Every significant global event has a financial implication. Every market move has a geopolitical trigger.")
$sel.Font.Bold = $false
$sel.Font.Italic = $false
$sel.TypeParagraph()

P "GeoMoney World Monitor bridges these two worlds -- not merely showing what happened, but WHO moved, WHERE they moved, WHEN it occurred, and precisely what it means for global markets and supply chains."
P "The platform fuses three reference concepts into a single product:"
B "WorldMonitor.app (GitHub: koala73/worldmonitor) -- The world's most feature-complete open-source real-time global intelligence dashboard, with 49 data layers, 3D globe, AI news synthesis, and country instability scoring (47,000+ GitHub stars; 7,600+ forks)."
B "God's Eye View -- Bilawal Sidhu's concept of a 24-hour temporal replay of military operations, showing aircraft tracks, naval vessel routes, missile vectors, and event sequences from a satellite-perspective with a timeline scrubber."
B "GeoMoney TV -- The existing premium geopolitical-financial intelligence platform, with deep commodities analysis, rare earth materials tracking, energy transition intelligence, TradingView-integrated analytics, and AI-powered briefings."
Blank

PB

# ══ 3. REFERENCE DESIGN ANALYSIS ════════════════════════════════════════
H1 "3. Reference Design Analysis"

H2 "3.1  WorldMonitor.app -- Reference One"
P "World Monitor is a production-grade open-source platform that sets the benchmark for real-time global intelligence dashboards. Key capabilities include:"
B "49 toggleable data layers covering military flights, AIS naval vessels, satellites, earthquakes, wildfires, cyber APT groups, undersea cables, oil/gas pipelines, nuclear facilities, trade routes, and maritime chokepoints."
B "Dual map engine: 3D globe (globe.gl / Three.js) and WebGL flat map (deck.gl / MapLibre GL) -- both simultaneously supported."
B "435+ curated news feeds across 15 categories, AI-synthesized into actionable intelligence briefs with source attribution and confidence scoring."
B "Country Instability Index (CII): Real-time stability scores for 24 countries using conflict data, social unrest indicators, and news velocity."
B "Cross-stream signal correlation: Convergence detection across military, economic, disaster, and escalation signals."
B "Finance radar: 92 stock exchanges, commodities, crypto, Gulf economy indicators, central bank policy rates, and prediction market integration."
B "226 global military installations, nuclear facilities, spaceports, and 313 AI compute clusters mapped and interactive."
B "Live AIS vessel tracking with 62 strategic port monitoring and chokepoint disruption alerts."
B "Snapshot system with 7-day historical playback and data export (CSV/JSON)."
P "Strategic Gaps for GeoMoney Integration: No financial depth beyond basic indexes, no commodities-first framing, no operational replay timeline, no media or newsletter distribution layer, and no broadcast-ready content capabilities."

H2 "3.2  God's Eye View -- Reference Two"
P "The `God's Eye View' concept presents geopolitical events from a top-down satellite perspective with temporal replay capability. The LinkedIn post by Bilawal Sidhu demonstrated a 24-hour replay of a major military operation, showing:"
B "Aircraft trajectory paths with timestamps and identification callsigns."
B "Naval vessel routes and positioning during the operation window."
B "Missile or projectile vectors and interception zones."
B "A timeline scrubber that allows the viewer to step forward and backward through the event window -- second by second or hour by hour."
B "Color-coded asset types (airborne, naval, ground; friendly vs adversary) for rapid situational reading."
B "A broadcast-quality visual narrative of how a geopolitical event unfolded in physical space."
P "Strategic Insight: Markets move before, during, and after geopolitical events. A temporal God's Eye View replay directly enables analysts to correlate asset movements (oil price spikes, gold rallies, currency swings) against the precise sequence of physical events -- a capability that currently does not exist in any commercial platform."

H2 "3.3  GeoMoney TV -- Existing Platform Strengths"
P "GeoMoney TV's existing codebase provides an accelerated foundation:"
B "Next.js 14 App Router with ISR, full TypeScript 5, React 18, Tailwind CSS, Framer Motion -- production-ready frontend."
B "Three.js + @react-three/fiber + @react-three/drei already installed -- 3D globe is dependency-ready with zero new frontend packages required."
B "TradingView embedded charts (Gold/XAUUSD, WTI Oil, Copper, DXY, S&P 500, Natural Gas, Silver) with live AI market sentiment analysis."
B "AI infrastructure via OpenRouter API (5 active endpoints: sentiment, navigation, bias, summarize, energy analysis)."
B "Rare earth and critical materials tracking with full admin CRUD management."
B "Energy intelligence page with transition analysis, commodity prices, and three interactive calculators (Solar ROI, Wind Farm, Carbon Offset)."
B "Newsletter system: AI-generated HTML newsletters with SMTP delivery and subscriber management."
B "Full admin panel: articles, videos, energy, materials, users, AI settings, YouTube channel sync, tickers."
B "NextAuth.js with role-based access (user/admin) and JWT sessions -- extensible to multi-tenancy."
B "MySQL / Prisma ORM 6.19 -- robust relational data layer ready for the expanded schema."
Blank

PB

# ══ 4. FEATURE ARCHITECTURE ═════════════════════════════════════════════
H1 "4. GeoMoney World Monitor -- Feature Architecture"
P "The platform is organized into eight integrated modules, each addressing a critical intelligence need while composing into a unified dashboard experience."

# Module 1
H2 "Module 1: Interactive World Map -- The Intelligence Globe"
P "The centrepiece of the platform: a full-screen 3D globe (with 2D flat-map toggle) serving as the primary intelligence canvas. Built using Three.js and globe.gl -- dependencies already installed in GeoMoney's package.json."

H3 "Core Map Capabilities"
B "3D Rotating Globe and 2D Flat Map (deck.gl / MapLibre GL) -- dual-mode with one-click toggle."
B "8 Regional Preset Views: Global, Americas, Europe, MENA, Asia-Pacific, Africa, Latin America, Oceania."
B "50+ Data Layers organized into five logical categories (Geopolitical, Military & Strategic, Energy & Commodities, Infrastructure, Natural Events)."
B "Temporal Filter: 1 hour / 6 hours / 24 hours / 48 hours / 7 days."
B "Smart Marker Clustering to prevent visual overload at continental zoom levels."
B "Day/Night Solar Terminator Overlay (live, 5-minute updates)."
B "Pin Map mode: fix the globe while scrolling intelligence panels independently."
B "Shareable URL-encoded map state: latitude, longitude, zoom level, active layers, and time filter."

H3 "Data Layer Groups"
P "GEOPOLITICAL LAYERS: Active conflict zones with involved parties and status; intelligence hotspots driven by news velocity; sanctions overlays; social unrest events (ACLED and GDELT corroborated); coup and instability alerts."
P "MILITARY & STRATEGIC LAYERS: 226+ global military installations; nuclear facilities; military aviation (ADS-B live tracks); naval vessels (AIS live positions); satellite positions; APT cyber group attribution markers; GPS jamming zones."
P "ENERGY & COMMODITIES LAYERS: 88 operating oil & gas pipeline routes; maritime chokepoints (Hormuz, Suez, Malacca, Bosphorus, Red Sea, Cape of Good Hope, Panama Canal); critical mineral deposits (lithium, cobalt, rare earths); LNG terminals; energy infrastructure incident alerts."
P "INFRASTRUCTURE LAYERS: 86 undersea cable routes; internet outage monitoring (Cloudflare Radar); AI datacenter locations; 62 strategic port monitoring; airport delay status and NOTAM airspace closures."
P "NATURAL EVENTS LAYERS: USGS earthquakes (M4.5+); NASA EONET (wildfires, volcanoes, floods, storms); NASA FIRMS satellite fire detection; severe weather warnings; climate anomaly zones."

# Module 2
H2 "Module 2: God's Eye Operational Theater"
P "The signature differentiating feature of GeoMoney World Monitor. This module presents a satellite-perspective, temporally-accurate replay of significant geopolitical operations and events -- directly inspired by the God's Eye View visualization concept."

H3 "Operational Replay System"
B "Timeline Scrubber: Step through any recorded event second-by-second or hour-by-hour. Drag, pause, and rewind -- full VCR-style control of geopolitical history."
B "Theater Zoom: Auto-focuses the globe on the event's geographic bounding box. User can zoom out to global context to see the broader picture."
B "Asset Track Visualization: Aircraft flight paths with directional arcs, ship routes with vessel symbols, ground movement position indicators."
B "Color-Coded Asset Classification: Airborne (amber), Naval (blue), Ground (green), Adversarial (red), Unknown (grey)."
B "Event Annotation Layer: Key moments stamped to the timeline (e.g., '00:14 -- Air Defence Activation', '02:31 -- Carrier Group Repositions to Sector 7')."
B "Simultaneous Market Overlay: Shows Gold, WTI Oil, and key currency movements synchronized to the event timeline -- connecting physical operations to their market impact in one view."
B "GeoFinancial Correlation Bar: Displays which financial assets moved and by what percentage during each phase of the operation."
B "Export and Share: Generate a shareable URL encoding the specific event replay state. Pro users can download MP4 exports of the replay for briefing and broadcast use."
B "Event Archive: 90-day archive of recorded significant operations, searchable by date, region, and asset type."

H3 "Live Theater Mode"
B "For active developments: switches from replay to live tracking, updating asset positions in near-real-time (60-second refresh on AIS/ADS-B data)."
B "Theater Alert: When unusual asset concentration is detected near a strategic chokepoint or military base, an automated alert is issued to subscribed users."
B "Auto-record: Significant live events are captured automatically for later replay archival."

# Module 3
H2 "Module 3: GeoFinancial Correlation Engine"
P "The core intellectual value proposition of GeoMoney. This module cross-correlates geopolitical events with financial market movements -- turning situational awareness into actionable trading and investment intelligence."
B "Event-to-Market Correlation: Algorithmically surfaces patterns such as 'When this conflict escalated (timestamp) -- Gold +2.3%, WTI Oil +4.1%, USD/IRR +8%'. Historical correlations presented automatically."
B "TradingView Integration: Full-featured charts for XAUUSD, WTI Oil, DXY, S&P 500, Copper, Silver, and Natural Gas -- all synchronizable with geopolitical timeline events."
B "Prediction Market Integration: Polymarket geopolitical event probabilities cross-referenced with live map intelligence."
B "Central Bank Policy Radar: 13 central bank rate decisions tracked via BIS data with monetary divergence alerts."
B "Gulf Economy Dashboard: Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman -- indices, currencies, and oil income data."
B "7-Signal Market Composite: Intelligence composite combining news velocity, conflict escalation, sanctions activity, commodity disruption, and market volatility into a single risk score per asset class."
B "Sector Heatmap: SPDR 11-sector visual performance updated in real time."
B "WTO Trade Policy Tracker: Active trade restrictions, tariff trends, bilateral trade flows, and SPS/TBT barriers."

# Module 4
H2 "Module 4: Energy & Critical Materials Command Centre"
P "Expanding GeoMoney TV's existing energy and rare earth intelligence into a fully map-integrated strategic resource command centre."
B "Supply Chain Globe View: Critical mineral extraction sites (lithium, cobalt, rare earths, uranium, copper) pinned on the 3D globe with supply chain flow arcs showing dependency on processing nations."
B "Pipeline Intelligence: 88 operating oil & gas pipelines with disruption alert overlays. Each pipeline interaction shows volume data, operator, recent incidents, and geopolitical risk score."
B "Chokepoint Monitor: Real-time status of all seven major maritime chokepoints -- vessel traffic density, incident alerts, and closure notifications."
B "Energy Transition Tracker: IRA implementation status, EU Green Deal milestones, China 5-Year Plan progress, and OPEC+ production decisions -- all mapped and time-stamped."
B "Material Price Dashboard: Live pricing for lithium (Li), cobalt (Co), uranium (U3O8), copper (Cu), nickel (Ni), platinum (Pt), silver (Ag), and 15 additional critical materials."
B "Disruption Risk Scoring: AI-generated supply chain vulnerability ratings for each critical material, updated with geopolitical event context."
B "Interactive Calculators (existing, retained): Solar ROI, Wind Farm Output, and Carbon Offset -- enhanced with live data inputs."

# Module 5
H2 "Module 5: Intelligence Feed Hub"
P "500+ curated global news feeds synthesized by AI into the most signal-dense, noise-minimal intelligence feed in the market."
B "Categories: Geopolitical, MENA, Africa, Latin America, Asia-Pacific, Europe, Energy & Resources, Technology, AI/ML, Finance, Government & Official, Think Tanks, Crisis Watch, Intel Feed, and Regional Sources."
B "AI News Synthesis: Each category produces an AI-generated summary brief with source attribution and confidence scoring -- expanding GeoMoney's existing OpenRouter AI pipeline."
B "Bias Scoring: Source-level bias analysis with political lean, ownership, and geographic bias metrics per outlet."
B "Geospatial Article Tagging: Each article is automatically geo-tagged and pinned to the map globe -- creating a news layer that lives in physical space, not just a list."
B "Custom Keyword Monitors: User-defined alerts that scan all incoming feeds. Color-coded highlighting in the feed with panel badge counts."
B "21 Language Support: Native-language feeds for non-English regions with translation layer."
B "GDELT + ACLED Integration: Academic-grade conflict event data cross-corroborated with RSS intelligence feeds."
B "Live News Streams: Embedded YouTube streams (Bloomberg, Sky News, Al Jazeera, France 24, DW, Euronews, Al Arabiya) with auto-pause when tab is idle."

# Module 6
H2 "Module 6: AI Intelligence Analyst"
P "A contextually-aware AI assistant combining geospatial intelligence with financial analysis -- expanding GeoMoney's existing 5 AI endpoints into a comprehensive analyst layer."
B "Natural Language Command Interface: 'Show me all military assets within 200km of the Strait of Hormuz' or 'Correlate the last OPEC+ decision with oil price movement'. Expands the existing /api/ai/navigate endpoint."
B "Market Sentiment Analysis: Real-time AI sentiment for Gold, WTI, DXY, Copper, and key indices with geopolitical event context injection (existing, enhanced)."
B "Country Intelligence Profiles: AI-generated risk profiles for any country -- political stability, economic outlook, military posture, resource exposure, and sanctions risk."
B "Scenario Forecasting: 'If Iran closes the Strait of Hormuz, model the impact on these 5 assets' -- AI-driven scenario analysis drawing on historical precedent."
B "Article Summarization: One-click deep summary of any news article with bias rating and geopolitical context (existing feature, enhanced with map context)."
B "Energy AI Advisor: Dedicated energy and materials analysis endpoint (existing, enhanced with globe layer context)."
B "Local AI Support: Optional Ollama integration for air-gapped deployments serving government and defense clients. No data leaves the client environment."
B "Weekly AI Intelligence Brief: Auto-generated Sunday briefing synthesizing the week's key geopolitical shifts, market impacts, and emerging risks."

# Module 7
H2 "Module 7: Briefings and Newsletter System"
P "GeoMoney TV's newsletter infrastructure, upgraded with World Monitor intelligence data."
B "AI-Generated Weekly Intelligence Brief: Aggregates top articles, material prices, market movements, and key geopolitical events into a professionally styled HTML email (existing system, enhanced)."
B "God's Eye Event Recap (New Feature): A visual section with a static globe screenshot of the week's key operational events, embedded in the newsletter alongside market correlation data."
B "Personalized Briefings: Subscriber-configurable regional focus (MENA, Asia, Europe, Americas, Africa) and asset class focus (energy, metals, equities, crypto)."
B "Daily Flash Alert: Optional daily digest of critical intelligence signals delivered to inbox -- threshold-triggered by escalation score changes."
B "YouTube Integration: Auto-publish video briefings to linked YouTube channel with AI-generated script and chapter markers (existing feature, enhanced)."
B "Subscriber Management: Full admin panel control over subscriber list, send schedule, template customization, and delivery analytics."

# Module 8
H2 "Module 8: Admin, Multi-Tenancy, and API Layer"
P "Enterprise-grade platform management and integration capabilities."
B "Admin Command Centre: Full CRUD for articles, videos, materials, energy data, newsletters, and users. Live dashboard stats and quick action buttons (existing, extended)."
B "Data Source Configuration: Admin UI for managing API keys, news feeds, AI model selection, SMTP settings, and YouTube sync (existing, extended)."
B "Multi-Organization Support: Multiple client organizations on a single deployment, each with isolated data views, custom branding, and user pools."
B "White-Label Capability: Custom logo, color scheme, and domain per tenant -- GeoMoney's dark/gold premium aesthetic fully configurable per enterprise client."
B "REST API Access: Institutional clients receive programmatic access to intelligence data, market correlations, and country risk scores (Professional and Enterprise tiers)."
B "Webhook Alerts: Push notifications to client systems when escalation thresholds are breached."
B "Custom Ticker Configuration: Alpha Vantage-powered ticker with client-configurable symbols per organization."
B "Audit Logging: Full trail of admin actions, data exports, and API calls for compliance."
Blank

PB

# ══ 5. USER SEGMENTS ════════════════════════════════════════════════════
H1 "5. Target User Segments"
P "GeoMoney World Monitor serves five distinct user segments, each with a different primary use case and intelligence priority."

H2 "5.1  Financial Analysts and Institutional Investors"
P "Primary Need: Connect geopolitical risk to portfolio exposure before the market prices it in."
P "Key Modules Used: GeoFinancial Correlation Engine, TradingView Analytics, Country Risk Scores, Prediction Markets, Central Bank Radar."
P "Value Proposition: Being the first to understand that naval posturing near the Strait of Hormuz preceded the last four oil price spikes is not just academic -- it is alpha. GeoMoney World Monitor delivers that edge."

H2 "5.2  Strategic Intelligence Analysts"
P "Primary Need: Comprehensive situational awareness across military, diplomatic, economic, and cyber domains."
P "Key Modules Used: Interactive Globe (all military and strategic layers), God's Eye Operational Theater, Country Intelligence Profiles, GDELT/ACLED integration, APT cyber tracking."
P "Value Proposition: A single platform replacing the need for 12 separate monitoring tools. The God's Eye replay enables post-operation analysis and broadcast-quality briefing production."

H2 "5.3  Energy Sector Professionals"
P "Primary Need: Commodity price signals, supply chain vulnerability assessment, and infrastructure risk monitoring."
P "Key Modules Used: Energy and Critical Materials Command Centre, Pipeline Intelligence, Chokepoint Monitor, Critical Mineral Deposits layer, Energy Transition Tracker."
P "Value Proposition: Real-time correlation between geopolitical events and energy commodity prices, with infrastructure-layer visualization of exactly which pipelines and terminals are at risk."

H2 "5.4  Journalists and Media Organizations"
P "Primary Need: Background context, visual data support, and developing story tracking for geopolitical reporting."
P "Key Modules Used: Intelligence Feed Hub, God's Eye Replay (for visual storytelling), Country Profiles, Live News Streams, God's Eye Event Recap newsletters."
P "Value Proposition: The God's Eye Replay is a broadcast-ready visual asset. Journalists can embed shareable replay links in digital stories, creating interactive explainers of how events unfolded in space and time."

H2 "5.5  Corporate Risk and Compliance Teams"
P "Primary Need: Supply chain monitoring, sanctions screening, and operational security for globally-exposed businesses."
P "Key Modules Used: Sanctions layer, supply chain disruption alerts, chokepoint status, Country Risk API, webhook alert system."
P "Value Proposition: Proactive risk identification before disruptions impact operations, with API integration into existing enterprise risk management systems."
Blank

PB

# ══ 6. SUBSCRIPTION TIERS ═══════════════════════════════════════════════
H1 "6. Subscription Tiers and Monetization"
P "The platform operates a freemium model with four commercial tiers, designed to convert casual users into paid subscribers through demonstrable intelligence value."

H2 "Free Tier"
B "Interactive 3D globe with 10 base data layers (conflicts, hotspots, earthquakes, wildfires, sanctions)."
B "24 hours of news feed access (top 5 sources per category)."
B "Daily AI summary brief headlines (3 per day, no full analysis)."
B "Basic TradingView chart widgets (Gold and WTI Oil only)."
B "1 active keyword monitor."
B "No God's Eye Replay access."

H2 "Intelligence Tier  --  USD 49 per month"
B "Full 50+ data layer access on the globe."
B "All 500+ news feeds with full AI synthesis and bias scoring."
B "Full GeoFinancial Correlation Engine -- all instruments, historical correlations."
B "Energy and Critical Materials Command Centre."
B "Country Intelligence Profiles (24 countries)."
B "Full AI Intelligence Analyst -- complete query capability."
B "God's Eye Replay -- 30-day event archive."
B "Weekly AI Intelligence Brief delivered to inbox."
B "10 active keyword monitors."
B "CSV / JSON data export."

H2 "Professional Tier  --  USD 149 per month"
B "Everything in Intelligence, plus:"
B "God's Eye Replay -- full 90-day event archive with MP4 export capability."
B "Live Theater Mode -- real-time asset tracking with Theater Alert system."
B "REST API access -- programmatic intelligence data, risk scores, and market correlations."
B "Webhook Alerts -- push notifications on escalation threshold breaches."
B "Daily Flash Alert emails -- threshold-triggered intelligence digests."
B "Personalized briefings -- region and asset class configurable."
B "God's Eye Event Recap in weekly newsletter (globe screenshot + market correlation data)."
B "Scenario Forecasting AI -- model what-if geopolitical scenarios."
B "50 active keyword monitors."
B "Priority support."

H2 "Enterprise Tier  --  Custom Pricing"
B "Everything in Professional, plus:"
B "White-label deployment: custom domain, logo, and brand theme."
B "Multi-seat licensing for organizational access (5 to unlimited users)."
B "Local AI option: Ollama integration for air-gapped / zero-data-residency deployments."
B "Custom data feed integration: connect proprietary intelligence data sources."
B "Dedicated account management and onboarding."
B "SLA-backed uptime guarantee."
B "Custom report generation API."
Blank

PB

# ══ 7. TECHNICAL ARCHITECTURE ═══════════════════════════════════════════
H1 "7. Technical Architecture"
P "GeoMoney World Monitor is built on GeoMoney TV's existing production-ready technology stack, with targeted additions to support the globe visualization and real-time operational tracking capabilities."

H2 "7.1  Core Technology Stack"
B "Frontend Framework: Next.js 14 (App Router, ISR) with TypeScript 5 and React 18 (existing)."
B "Styling and Animation: Tailwind CSS 3.3 plus Framer Motion 11 with the dark premium aesthetic (existing). Brand palette: geo-gold (#D4AF37), geo-dark (#050505), geo-blue (#0A192F)."
B "3D Globe: Three.js 0.161 plus globe.gl -- ALREADY INSTALLED in GeoMoney's package.json. Zero new frontend dependencies required for the core globe feature."
B "WebGL Map Engine: deck.gl plus MapLibre GL for the flat-map 2D mode and high-performance data layer rendering."
B "Market Charts: TradingView widgets (existing) -- zero-cost, no API key required."
B "Desktop App (Phase 4): Tauri 2 (Rust) -- cross-platform native desktop client for macOS, Windows, and Linux."

H2 "7.2  Backend and Data Layer"
B "Database: MySQL with Prisma ORM 6.19 (existing). New tables for event archive, operational replays, subscriber preferences, API keys, and organization tenants."
B "Authentication: NextAuth.js 4.24 with JWT sessions and role-based access (existing). Extended with organization-scoped roles for multi-tenancy."
B "Caching: Redis (Upstash) -- 3-tier cache for real-time AIS/ADS-B data, news clusters, and country risk scores. Critical for live theater performance."
B "Server: Express.js sidecar (existing server.js) plus Vercel Edge Functions for CDN-delivered API responses."
B "Email: Nodemailer 7 with configurable SMTP (existing). Extended for daily flash alerts and personalized briefings."

H2 "7.3  AI and Intelligence Layer"
B "AI Backend: OpenRouter API (existing) -- model-configurable from admin panel. Default: free tier model; Pro/Enterprise: GPT-4o or Claude 3.5 Sonnet."
B "Local AI: Ollama integration for enterprise air-gapped deployments."
B "Browser-Side ML: Transformers.js plus ONNX Runtime Web -- offline-capable threat classification, headline scoring, and entity extraction (no server required)."
B "Existing AI Endpoints (enhanced): /api/ai/market-sentiment, /api/ai/navigate, /api/ai/bias, /api/ai/summarize, /api/ai/energy."
B "New AI Endpoints: /api/ai/country-profile, /api/ai/scenario-forecast, /api/ai/theater-annotation, /api/ai/weekly-brief."

H2 "7.4  Real-Time Data Sources (65+ Providers)"
P "Extending GeoMoney's existing data layer with World Monitor's aggregated sources:"
B "Military and Aviation: ADS-B Exchange (aircraft tracking), AISStream.io (naval vessels), FAA ASWS, ICAO NOTAM, AviationStack."
B "Geopolitical: ACLED, GDELT, UCDP, UNHCR HAPI, IAEA, WHO."
B "Energy and Infrastructure: EIA, Open-Meteo ERA5, NASA FIRMS, USGS, NASA EONET."
B "Finance: Finnhub (stocks), CoinGecko (crypto), Polymarket (prediction markets), BIS, FRED (macroeconomic indicators), Alpha Vantage (existing)."
B "News: NewsAPI.org (existing), 500+ RSS feeds (existing infrastructure extended), Cloudflare Radar (internet outages)."
B "Cyber: CISA advisories, APT attribution intelligence databases."
Blank

PB

# ══ 8. DEVELOPMENT ROADMAP ══════════════════════════════════════════════
H1 "8. Development Roadmap"
P "A phased build approach that delivers value incrementally, leveraging GeoMoney's existing production codebase to compress timelines significantly."

H2 "Phase 1  --  Intelligence Globe Foundation  (Months 1-2)"
B "Activate Three.js 3D Globe: Replace Globe.tsx video wrapper with globe.gl globe component. Three.js is already installed -- this is a component rebuild, not a new dependency."
B "Implement base data layers: conflicts, military bases, AIS vessels, earthquakes, and sanctions."
B "8 regional preset views and temporal range filter (1h / 6h / 24h / 48h / 7 days)."
B "Country Instability Index integration (12-signal composite scoring for 24 countries)."
B "Expand news aggregation from 70 keywords to 500+ feeds across 15 categories."
B "AIS vessel tracking integration with chokepoint monitoring for the 7 major maritime chokepoints."
P "Deliverable: Functional intelligence globe dashboard with full layer foundation -- internal launch."

H2 "Phase 2  --  GeoFinancial Intelligence Depth  (Months 3-4)"
B "GeoFinancial Correlation Engine: event-to-market correlation with historical pattern surfacing."
B "Energy and Commodities map layers: pipelines, chokepoints, critical minerals, LNG terminals."
B "Supply chain vulnerability scoring and disruption alerts."
B "Expanded AI endpoints: country intelligence profiles and scenario forecasting."
B "Gulf Economy dashboard and central bank policy radar."
B "Prediction market integration (Polymarket)."
B "Subscription tier enforcement: Free and Intelligence tiers go live."
P "Deliverable: Full geopolitical-financial intelligence platform -- soft launch to Intelligence tier subscribers."

H2 "Phase 3  --  God's Eye Operational Theater  (Months 5-6)"
B "Operational Replay System: timeline scrubber, asset track visualization, and event annotation layer."
B "Simultaneous market overlay synchronized to event timeline."
B "90-day event archive with searchable and filterable catalog."
B "Live Theater Mode with automated Theater Alert system."
B "Export and shareable replay URL functionality."
B "God's Eye Event Recap section in newsletter."
B "Professional tier launch."
P "Deliverable: God's Eye View fully operational -- the platform's signature differentiator live and available to Professional subscribers."

H2 "Phase 4  --  Enterprise Scale and Desktop  (Months 7-8)"
B "Multi-tenancy and white-label capability."
B "REST API and webhook system for enterprise integrations."
B "Tauri 2 desktop app (macOS, Windows, Linux native)."
B "Local AI (Ollama) integration for air-gapped enterprise clients."
B "Mobile-optimized responsive experience with curated layer defaults."
B "Full 21-language support."
B "MP4 replay export for broadcast clients."
B "Enterprise tier launch."
P "Deliverable: Full enterprise-grade platform with desktop app, API ecosystem, and white-label capability."
Blank

PB

# ══ 9. COMPETITIVE LANDSCAPE ════════════════════════════════════════════
H1 "9. Competitive Landscape"
P "GeoMoney World Monitor occupies a unique intersection that no existing product addresses completely."

H2 "9.1  Competitive Differentiation"
B "vs. WorldMonitor.app (Open Source): GeoMoney adds deep financial intelligence (TradingView analytics, GeoFinancial correlations), commodities-first framing, the God's Eye Replay system, a media and broadcast layer (newsletter, YouTube videos), and a commercial-grade subscription model. WorldMonitor.app is AGPL-3.0 -- commercial use requires a separate license. Our platform is independently architected."
B "vs. Bloomberg Terminal (USD 24,000/year): Bloomberg has financial depth but no geospatial intelligence, no God's Eye View, no military tracking, and no supply chain visualization. GeoMoney World Monitor delivers comparable financial intelligence plus a geospatial layer at 1/160th the Bloomberg Terminal price."
B "vs. Palantir Gotham (Enterprise, millions USD/year): Palantir serves government defense with deep data fusion but has no public availability, no financial market integration, and no media/broadcast readiness. GeoMoney World Monitor is the accessible commercial equivalent for institutional and analyst audiences."
B "vs. Jane's Intelligence and RAND: Think-tank quality analysis but delivered as static reports with no real-time map layer, no market correlation, and no interactive visualization capabilities."
B "vs. Maxar and Planet Labs (satellite imagery): Raw imagery without intelligence synthesis, AI analysis, financial correlation, or news integration."

H2 "9.2  Unique Value Pillars"
B "The ONLY platform that shows you where assets moved, what the news said, and what the market did -- simultaneously, on the same timeline. This is God's Eye View financial intelligence fusion."
B "Built for three audiences simultaneously: analysts, investors, and media -- with a single unified codebase and no feature compromise."
B "Accessible pricing that democratizes intelligence previously available only to institutional and government actors."
B "Built for broadcast: shareable links, MP4 export, and visual briefing assets make the platform content-ready for media clients."
B "Established foundation: GeoMoney TV's existing brand, subscriber base, and production codebase eliminate typical greenfield project risks."
Blank

PB

# ══ 10. DESIGN PRINCIPLES ═══════════════════════════════════════════════
H1 "10. Design Principles and Brand Identity"
P "GeoMoney World Monitor inherits and extends GeoMoney TV's established premium dark intelligence aesthetic."

H2 "10.1  Visual Language"
B "Primary Background: geo-dark (#050505) -- near black. The intelligence command centre aesthetic that signals seriousness and focus."
B "Section Background: geo-blue (#0A192F) -- deep navy. Panel and card surfaces that provide depth without distraction."
B "Primary Accent: geo-gold (#D4AF37) -- GeoMoney's signature gold. Headlines, active states, highlights, borders. The color of intelligence value."
B "Secondary Accent: geo-accent (#1E3A8A) -- deep royal blue. Interactive elements, hover states, and data overlays."
B "Alert Color: geo-crimson (#5c232d) -- muted red. Escalation alerts and high-severity event markers."
B "Globe Night Mode: The 3D globe renders at night by default -- dark ocean with lit city clusters reinforces the command-centre metaphor and positions the tool as a surveillance-grade asset."

H2 "10.2  UX Principles"
B "Signal over Noise: Smart clustering, layer toggle defaults, and AI synthesis prevent information overload. Every visible element earns its screen real estate."
B "Context over Data: Raw AIS positions are not useful. AIS positions near a chokepoint during a geopolitical escalation are intelligence. Every layer is contextually enriched."
B "Speed to Insight: Cmd+K universal search, regional preset views, and panel drag-to-reorder enable analysts to reach critical information in under 3 seconds."
B "Persistence: All user preferences (panel order, active layers, keyword monitors, subscriptions) persist across sessions via localStorage and server-side sync."
B "Progressive Disclosure: Markers show labels on hover and full context on click -- preventing visual clutter while keeping all data accessible."
B "Broadcast Ready: Globe states and God's Eye replays can be shared as links, exported as images, and presented in briefing rooms. The platform is designed to be on a screen in front of decision-makers."
Blank

PB

# ══ 11. CONCLUSION ══════════════════════════════════════════════════════
H1 "11. Why Now  --  The Strategic Opportunity"
P "We are living in a historical moment where geopolitical volatility has become the dominant driver of financial markets. Trade wars, supply chain disruptions, military operations, energy transitions, and sanctions regimes are moving commodity prices, currencies, and equity indices faster than any traditional fundamental analysis can capture."
P "The tools that exist today fall into two siloed categories: financial platforms that ignore physical geography, and defense/intelligence platforms that ignore markets. GeoMoney World Monitor is the bridge."
P "The God's Eye View concept is more than a visualization innovation -- it is the answer to a question every analyst, investor, and journalist is actively asking: 'How did this happen, and what does it mean for my exposure?'"
P "Built on GeoMoney's solid production foundation, with Three.js already installed and a subscriber base already established, this is not a greenfield project -- it is an evolution. The core intelligence brand is proven. The codebase is ready. The market is waiting."
Blank

$sel.Style = $doc.Styles.Item("Normal")
$sel.Font.Bold = $true
$sel.Font.Size = 14
$sel.TypeText("GeoMoney World Monitor: See everything. Understand the market. Act with confidence.")
$sel.Font.Bold = $false
$sel.Font.Size = 11
$sel.TypeParagraph()
Blank
Blank

P "End of Proposal."
Blank

$sel.Font.Italic = $true
$sel.Font.Size = 9
$sel.Style = $doc.Styles.Item("Normal")
$sel.TypeText("For questions, scoping discussions, or commercial licensing inquiries, please contact the GeoMoney TV product team. This document is confidential and intended solely for the named recipient.")
$sel.Font.Italic = $false
$sel.Font.Size = 11

# ══ SAVE ════════════════════════════════════════════════════════════════
$doc.SaveAs2($Out)
$doc.Close()
$word.Quit()

Write-Host "Saved: $Out"
