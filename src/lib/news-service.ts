import { prisma } from '@/lib/prisma'
import Parser from 'rss-parser'

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
    ],
  },
})

interface NewsArticle {
  title: string
  description: string
  content: string
  url: string
  imageUrl?: string
  publishedAt: Date
  source: string
}

// ── Geopolitics Relevance Filter ──────────────────────────────────────────
// Only articles matching these keywords will be synced and displayed.
const GEOPOLITICS_KEYWORDS = [
  // Core geopolitics
  'geopolit', 'sanction', 'tariff', 'trade war', 'cold war', 'proxy war',
  'diplomacy', 'diplomat', 'treaty', 'alliance', 'nato', 'brics', 'g7', 'g20',
  'sovereignty', 'territorial', 'annexation', 'embargo', 'blockade',
  // Military / conflict
  'military', 'defense', 'missile', 'nuclear', 'weapon', 'conflict', 'invasion',
  'war ', 'warfare', 'armed forces', 'pentagon', 'troops', 'army', 'navy',
  // Economics / finance (global)
  'economy', 'economic', 'gdp', 'inflation', 'recession', 'central bank',
  'federal reserve', 'interest rate', 'currency', 'forex', 'debt crisis',
  'fiscal', 'monetary policy', 'imf', 'world bank', 'opec',
  // Commodities / resources
  'rare earth', 'commodity', 'commodities', 'crude oil', 'natural gas',
  'uranium', 'lithium', 'cobalt', 'copper', 'gold price', 'silver price',
  'mining', 'mineral', 'resource', 'supply chain', 'semiconductor', 'chip',
  // Energy
  'energy crisis', 'energy security', 'pipeline', 'lng', 'renewable',
  'solar', 'wind energy', 'oil price', 'petroleum', 'refinery',
  // Global powers
  'china', 'beijing', 'russia', 'moscow', 'kremlin', 'united states', 'washington',
  'european union', 'brussels', 'india', 'modi', 'japan', 'tokyo',
  'iran', 'tehran', 'north korea', 'pyongyang', 'taiwan', 'ukraine',
  'middle east', 'africa', 'global south', 'indo-pacific', 'south china sea',
  'arctic', 'strait of hormuz', 'suez',
  // Trade / supply
  'export', 'import', 'trade deal', 'trade agreement', 'wto', 'quota',
  'protectionism', 'decoupling', 'reshoring', 'nearshoring',
  // Intelligence / security
  'intelligence', 'espionage', 'cyber', 'security', 'surveillance',
  // Political
  'election', 'referendum', 'coup', 'regime', 'authoritarian', 'democracy',
  'parliament', 'congress', 'senate', 'policy', 'legislation',
]

/**
 * Checks if an article is relevant to geopolitics/finance/commodities.
 * Scans title and description against keyword list.
 */
function isGeopoliticsRelevant(article: NewsArticle): boolean {
  const text = `${article.title} ${article.description}`.toLowerCase()
  return GEOPOLITICS_KEYWORDS.some(keyword => text.includes(keyword))
}

/**
 * Auto-detect article category based on content keywords.
 * Order matters: the most specific signal wins so a "copper mine" story does not
 * land in geopolitics (QA P1-1).
 */
function detectCategory(article: NewsArticle): string {
  const text = `${article.title} ${article.description}`.toLowerCase()

  // Academic papers, press releases and trade journals are not geopolitics.
  const lowerUrl = (article.url || '').toLowerCase()
  if (/(plos|nature\.com|sciencedirect|springer|wiley|mdpi|arxiv|researchgate|\.edu|\.ac\.)/.test(lowerUrl)) {
    return 'research'
  }

  if (['rare earth', 'commodity', 'commodities', 'mining', 'mineral', 'gold price', 'silver price', 'copper', 'lithium', 'cobalt', 'uranium', 'nickel', 'zinc', 'aluminium', 'aluminum'].some(k => text.includes(k))) {
    return 'commodities'
  }
  if (['energy', 'oil', 'gas', 'pipeline', 'lng', 'opec', 'petroleum', 'solar', 'wind energy', 'refinery', 'power grid', 'electricity'].some(k => text.includes(k))) {
    return 'energy'
  }
  if (['economy', 'economic', 'gdp', 'inflation', 'recession', 'central bank', 'federal reserve', 'interest rate', 'fiscal', 'monetary', 'imf', 'world bank', 'debt'].some(k => text.includes(k))) {
    return 'economy'
  }
  if (['semiconductor', 'chip', 'technology', 'cyber', 'ai ', 'artificial intelligence', 'tech'].some(k => text.includes(k))) {
    return 'technology'
  }
  return 'geopolitics'
}

// ─── INGEST DEDUPE / PER-ENTITY CAPS (QA P1-1) ───────────────────────────────

/** Normalised title used to spot near-duplicate headlines across sources. */
function normaliseTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** True when two headlines are near-duplicates (token overlap >= 70%). */
function titlesAreNearDuplicates(a: string, b: string): boolean {
  const left = normaliseTitle(a).split(' ').filter((w) => w.length > 2)
  const right = new Set(normaliseTitle(b).split(' ').filter((w) => w.length > 2))
  if (left.length === 0 || right.size === 0) return false
  let shared = 0
  for (const word of left) if (right.has(word)) shared++
  const overlap = shared / Math.min(new Set(left).size, right.size)
  return overlap >= 0.7
}

/** The headline entity used for per-feed caps (first meaningful proper noun). */
const ENTITY_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'from', 'into', 'over',
  'after', 'before', 'amid', 'as', 'at', 'by', 'in', 'of', 'on', 'to', 'up',
  'new', 'how', 'why', 'what', 'when', 'who', 'says', 'say', 'could', 'may',
  'will', 'would', 'us', 'uk', 'eu', 'global', 'world',
])

function headlineEntity(title: string): string | null {
  const words = title.replace(/[^A-Za-z0-9 ]+/g, ' ').split(/\s+/)
  for (const word of words) {
    const lower = word.toLowerCase()
    if (word.length < 3 || ENTITY_STOPWORDS.has(lower)) continue
    // Prefer a capitalised word that is not the first word of the sentence.
    if (/^[A-Z]/.test(word) && words.indexOf(word) > 0) return lower
  }
  return null
}

export async function fetchFromNewsAPI(apiKey: string): Promise<NewsArticle[]> {
  if (!apiKey) return []

  try {
    // GeoMoney Focused Keywords: Finance, Geopolitics, Rare Earths, Trade, Macro
    const keywords = '(economy OR finance OR geopolitics OR "rare earth" OR "supply chain" OR "trade war" OR semiconductor OR uranium) AND (China OR USA OR Russia OR "EU" OR "Global South")'

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(keywords)}&language=en&sortBy=publishedAt&pageSize=40&apiKey=${apiKey}`
    )

    if (!response.ok) {
      console.error('NewsAPI error:', response.statusText)
      return []
    }

    const data = await response.json()

    // Filter out articles that have been removed or have no valid content
    const validArticles = data.articles.filter((article: any) =>
      article.title !== '[Removed]' &&
      article.urlToImage &&
      article.description
    );

    return validArticles.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      content: article.content || article.description || '',
      url: article.url,
      imageUrl: article.urlToImage,
      publishedAt: new Date(article.publishedAt),
      source: article.source.name
    }))
  } catch (error) {
    console.error('Error fetching from NewsAPI:', error)
    return []
  }
}

/**
 * Try to extract the first <img> src from an HTML string.
 */
function extractImageFromHtml(html: string | undefined | null): string | undefined {
  if (!html) return undefined
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match?.[1] || undefined
}

export async function fetchFromRSS(feedUrl: string, feedName: string): Promise<NewsArticle[]> {
  try {
    const feed = await parser.parseURL(feedUrl)

    return feed.items.map((item: any) => {
      // Prefer media:content / media:thumbnail over enclosure — enclosures are
      // often site logos rather than article-specific images.
      const mediaContentUrl =
        item.mediaContent?.['$']?.url ||
        item.mediaContent?.url ||
        undefined
      const mediaThumbnailUrl =
        item.mediaThumbnail?.['$']?.url ||
        item.mediaThumbnail?.url ||
        undefined
      const htmlImageUrl = extractImageFromHtml(item.content || item.description || '')
      const enclosureUrl = item.enclosure?.url

      const imageUrl = mediaContentUrl || mediaThumbnailUrl || htmlImageUrl || enclosureUrl || undefined

      return {
        title: item.title || 'Untitled',
        description: item.contentSnippet || item.summary || '',
        content: item.content || item.contentSnippet || item.summary || '',
        url: item.link || '',
        imageUrl,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: feedName,
      }
    })
  } catch (error) {
    console.error(`Error fetching RSS from ${feedName}:`, error)
    return []
  }
}

/**
 * Converts Readability's HTML output into plain text that preserves paragraph
 * boundaries. Previously we stored `textContent`, which glued sentences
 * together and mixed image captions into the prose (QA P0-4).
 */
function htmlToParagraphText(html: string): string {
  let text = html
    // Captions and inline figures are not article prose.
    .replace(/<figure[\s\S]*?<\/figure>/gi, ' ')
    .replace(/<figcaption[\s\S]*?<\/figcaption>/gi, ' ')
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')

  // Block-level boundaries become paragraph breaks.
  text = text
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|section|article|blockquote|h[1-6]|li|tr|ul|ol)>/gi, '\n\n')
    .replace(/<\s*li[^>]*>/gi, '- ')

  // Drop any remaining tags and decode the common entities.
  text = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&hellip;/gi, '…')

  return text
    // Insert a space where a sentence end is glued to the next capital letter.
    .replace(/([.!?])(?=[A-Z"'(])/g, '$1 ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Removes a duplicated headline/lead paragraph from the top of the body. */
function stripDuplicatedLead(body: string, title: string, description?: string | null): string {
  const normalize = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

  const paragraphs = body.split('\n\n')
  const candidates = [title, description].filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 20,
  ).map(normalize)

  while (paragraphs.length > 1 && candidates.includes(normalize(paragraphs[0]))) {
    paragraphs.shift()
  }

  return paragraphs.join('\n\n').trim()
}

async function fetchFullContent(
  url: string,
  title?: string,
  description?: string | null,
): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) return null
    const html = await response.text()

    const { JSDOM, VirtualConsole } = await import('jsdom')
    const { Readability } = await import('@mozilla/readability')

    const virtualConsole = new VirtualConsole()
    const dom = new JSDOM(html, { url, virtualConsole })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    if (!article) return null

    // Prefer the structured HTML so paragraph breaks survive; fall back to the
    // plain-text extraction only when HTML is unavailable.
    const body = article.content
      ? htmlToParagraphText(article.content)
      : htmlToParagraphText(article.textContent ?? '')

    if (!body) return null

    return stripDuplicatedLead(body, title ?? article.title ?? '', description)
  } catch (error) {
    console.warn(`Failed to fetch full content for ${url}:`, error)
    return null
  }
}

export async function syncNewsToDatabase(adminUserId?: string): Promise<number> {
  try {
    // If no user provided, find a system admin to attribute to
    if (!adminUserId) {
      const admin = await prisma.user.findFirst({
        where: { role: 'admin' }
      })
      if (admin) {
        adminUserId = admin.id
      } else {
        console.warn("No admin user found to sync news. Checking for any user.")
        const anyUser = await prisma.user.findFirst()
        if (anyUser) adminUserId = anyUser.id
        else return 0 // Cannot sync without an author
      }
    }

    // Get settings
    const settings = await prisma.siteSettings.findMany({
      where: {
        key: {
          in: ['news_sources', 'news_api_key']
        }
      }
    })

    let newsSources: any[] = []
    let newsApiKey = ''

    settings.forEach((setting) => {
      if (setting.key === 'news_sources') {
        try {
          newsSources = JSON.parse(setting.value)
        } catch { }
      } else if (setting.key === 'news_api_key') {
        newsApiKey = setting.value
      }
    })

    const articles: NewsArticle[] = []

    // Fetch from NewsAPI if key exists
    if (newsApiKey) {
      console.log('Fetching from NewsAPI...');
      const newsApiArticles = await fetchFromNewsAPI(newsApiKey)
      console.log(`Received ${newsApiArticles.length} articles from NewsAPI`);
      articles.push(...newsApiArticles)
    }

    // Only fetch from RSS if NewsAPI is NOT configured or returned 0 articles
    if (articles.length === 0) {
      console.log('No NewsAPI articles found (or key missing). Falling back to RSS feeds...');

      // If no custom sources configured, use default geopolitics/finance feeds
      const feedSources = newsSources.length > 0 ? newsSources : [
        { name: 'Reuters World', url: 'https://feeds.reuters.com/reuters/worldNews', type: 'rss', enabled: true },
        { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', type: 'rss', enabled: true },
        { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', type: 'rss', enabled: true },
        { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', type: 'rss', enabled: true },
        { name: 'CNBC World', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100727362', type: 'rss', enabled: true },
        { name: 'Financial Times', url: 'https://www.ft.com/rss/home', type: 'rss', enabled: true },
      ]

      for (const source of feedSources) {
        if (source.enabled && source.type === 'rss') {
          const rssArticles = await fetchFromRSS(source.url, source.name)
          articles.push(...rssArticles)
        }
      }
    }

    // ── GEOPOLITICS FILTER ──────────────────────────────────────────
    // Only keep articles relevant to geopolitics, finance, commodities
    const relevantArticles = articles.filter(isGeopoliticsRelevant)
    console.log(`Filtered ${articles.length} articles → ${relevantArticles.length} geopolitics-relevant`)

    // ── INGEST DEDUPE + PER-ENTITY CAP (QA P1-1) ────────────────────────────
    // 33 of the latest 100 articles were the same Nvidia story with near-identical
    // headlines, so dedupe within the batch before it ever reaches the database.
    const MAX_PER_ENTITY = 3
    const entityCounts = new Map<string, number>()
    const acceptedTitles: string[] = []
    const dedupedArticles: NewsArticle[] = []

    for (const article of relevantArticles) {
      const entity = headlineEntity(article.title)
      if (entity) {
        const count = entityCounts.get(entity) ?? 0
        if (count >= MAX_PER_ENTITY) {
          console.log(`Skipped (per-entity cap ${MAX_PER_ENTITY}): ${article.title}`)
          continue
        }
        entityCounts.set(entity, count + 1)
      }

      if (acceptedTitles.some((existing) => titlesAreNearDuplicates(existing, article.title))) {
        console.log(`Skipped (near-duplicate headline): ${article.title}`)
        continue
      }

      acceptedTitles.push(article.title)
      dedupedArticles.push(article)
    }

    if (dedupedArticles.length !== relevantArticles.length) {
      console.log(`Dedupe: ${relevantArticles.length} → ${dedupedArticles.length} after entity caps and headline similarity`)
    }

    // Save to database
    let savedCount = 0
    for (const article of dedupedArticles) {
      try {
        // Create slug from title
        const slug = article.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .substring(0, 100) + '-' + Date.now()

        // Check if article already exists by URL or a near-duplicate headline
        // from another source (previously only an exact title match was caught).
        const recentArticles = await prisma.article.findMany({
          where: { published: true },
          select: { id: true, title: true, description: true, content: true, sourceUrl: true },
          orderBy: { createdAt: 'desc' },
          take: 120,
        })

        const existing = recentArticles.find(
          (row) =>
            row.sourceUrl === article.url ||
            row.title === article.title ||
            titlesAreNearDuplicates(row.title, article.title),
        )

        if (!existing) {
          // Try to fetch full content if the current content seems truncated or short
          if (article.url) {
            const fullContent = await fetchFullContent(article.url, article.title, article.description)
            if (fullContent && fullContent.length > article.content.length) {
              console.log(`Enriched content for: ${article.title}`)
              article.content = fullContent
            }
          }

          // Auto-detect category
          const category = detectCategory(article)

          await prisma.article.create({
            data: {
              title: article.title.substring(0, 255),
              slug,
              description: article.description.substring(0, 500),
              content: article.content,
              imageUrl: article.imageUrl || null,
              sourceUrl: article.url,
              sourceName: article.source,
              category,
              featured: false,
              published: true,
              authorId: adminUserId,
            }
          })
          savedCount++
        } else {
          // If article exists but content is truncated, try to fix it
          const isTruncated = existing.content.trim().match(/\[\+\d+ chars\]$/) || existing.content.trim().endsWith('...')

          if (isTruncated && article.url) {
            const fullContent = await fetchFullContent(article.url, existing.title, existing.description)
            if (fullContent && fullContent.length > existing.content.length) {
              await prisma.article.update({
                where: { id: existing.id },
                data: { content: fullContent }
              })
              console.log(`Fixed truncated content for existing article: ${existing.title}`)
            }
          }
        }
      } catch (error) {
        console.error('Error saving article:', error)
      }
    }

    return savedCount
  } catch (error) {
    console.error('Error syncing news:', error)
    throw error
  }
}
