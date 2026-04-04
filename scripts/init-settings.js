const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const DEFAULT_TICKERS = [
  { label: 'USD Index', symbol: 'DX-Y.NYB', type: 'currency' },
  { label: 'Oil (WTI)', symbol: 'CL=F', type: 'commodity' },
  { label: 'Gold', symbol: 'GC=F', type: 'commodity' },
  { label: 'Bitcoin', symbol: 'BTC-USD', type: 'crypto' },
  { label: 'Ethereum', symbol: 'ETH-USD', type: 'crypto' },
  { label: 'Rare Earth ETF', symbol: 'REMX', type: 'stock' },
  { label: 'MP Materials', symbol: 'MP', type: 'stock' },
  { label: 'Lynas Rare Earths', symbol: 'LYC.AX', type: 'stock' },
]

const DEFAULT_RSS_FEEDS = [
  {
    name: 'Reuters Business',
    type: 'rss',
    url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
    enabled: true
  },
  {
    name: 'Financial Times',
    type: 'rss',
    url: 'https://www.ft.com/?format=rss',
    enabled: false
  },
  {
    name: 'Bloomberg Markets',
    type: 'rss',
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    enabled: false
  }
]

async function initializeSettings() {
  try {
    console.log('Initializing default settings...')

    // Initialize ticker symbols
    await prisma.siteSettings.upsert({
      where: { key: 'ticker_symbols' },
      update: { value: JSON.stringify(DEFAULT_TICKERS) },
      create: {
        key: 'ticker_symbols',
        value: JSON.stringify(DEFAULT_TICKERS)
      }
    })
    console.log('✓ Default ticker symbols initialized')

    // Initialize news sources
    await prisma.siteSettings.upsert({
      where: { key: 'news_sources' },
      update: { value: JSON.stringify(DEFAULT_RSS_FEEDS) },
      create: {
        key: 'news_sources',
        value: JSON.stringify(DEFAULT_RSS_FEEDS)
      }
    })
    console.log('✓ Default news sources initialized')

    // Initialize empty NewsAPI key
    await prisma.siteSettings.upsert({
      where: { key: 'news_api_key' },
      update: {},
      create: {
        key: 'news_api_key',
        value: ''
      }
    })
    console.log('✓ NewsAPI key placeholder created')

    console.log('\n✅ All default settings initialized successfully!')
    console.log('\nNext steps:')
    console.log('1. Log in to the admin panel')
    console.log('2. Go to Settings > News Sources')
    console.log('3. Add your NewsAPI.org API key')
    console.log('4. Configure RSS feeds as needed')
    console.log('5. Click "Sync News Now" to fetch articles\n')

  } catch (error) {
    console.error('\n❌ CRITICAL DATABASE ERROR')
    
    if (error.message.includes("Can't reach database server")) {
      console.error('----------------------------------------')
      console.error('Could not connect to the remote database.')
      console.error('If you are using Hostinger or cPanel, you likely need to whitelist your IP address.')
      console.error('\nSTEPS TO FIX:')
      console.error('1. Log in to your hosting control panel (Hostinger/cPanel)')
      console.error('2. Go to "Remote MySQL" section')
      console.error('3. Add your current public IP address (or % to allow all)')
      console.error('4. Wait 1 minute and try again')
      console.error('----------------------------------------\n')
    }
    
    console.error('Original Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

initializeSettings()
