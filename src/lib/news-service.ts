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
 */
function detectCategory(article: NewsArticle): string {
  const text = `${article.title} ${article.description}`.toLowerCase()

  if (['rare earth', 'commodity', 'commodities', 'mining', 'mineral', 'gold price', 'silver price', 'copper', 'lithium', 'cobalt', 'uranium'].some(k => text.includes(k))) {
    return 'commodities'
  }
  if (['energy', 'oil', 'gas', 'pipeline', 'lng', 'opec', 'petroleum', 'solar', 'wind energy', 'refinery'].some(k => text.includes(k))) {
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

async function fetchFullContent(url: string): Promise<string | null> {
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

    return article ? article.textContent : null
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

    // Save to database
    let savedCount = 0
    for (const article of relevantArticles) {
      try {
        // Create slug from title
        const slug = article.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .substring(0, 100) + '-' + Date.now()

        // Check if article already exists by URL or similar title
        const existing = await prisma.article.findFirst({
          where: {
            OR: [
              { title: article.title },
              { description: { contains: article.url } }
            ]
          }
        })

        if (!existing) {
          // Try to fetch full content if the current content seems truncated or short
          if (article.url) {
            const fullContent = await fetchFullContent(article.url)
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
            const fullContent = await fetchFullContent(article.url)
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
