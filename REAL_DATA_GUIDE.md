# GeoMoney - Real Data Configuration Guide

This guide explains how to configure real market data (tickers) and news sources for your GeoMoney application.

## 🚀 Quick Start

After deployment, run the initialization script to set up default configurations:

```bash
node scripts/init-settings.js
```

This will create:

- Default ticker symbols (USD Index, Oil, Gold, Bitcoin, etc.)
- Default RSS feed sources
- Placeholder for NewsAPI key

## 📊 Market Ticker Configuration

### How It Works

The ticker displays real-time financial data from Yahoo Finance API. You can customize which instruments appear in the ticker through the admin panel.

### Configuring Tickers

1. **Access Admin Panel**

   - Navigate to `/admin/settings`
   - Click on the "Ticker Configuration" tab

2. **Add New Ticker**

   - **Label**: Display name (e.g., "Bitcoin", "Gold Price")
   - **Symbol**: Yahoo Finance symbol (e.g., "BTC-USD", "GC=F")
   - **Type**: Category (Stock, Crypto, Commodity, Currency)
   - Click "Add" to include it

3. **Common Yahoo Finance Symbols**

   ```
   Cryptocurrencies:
   - Bitcoin: BTC-USD
   - Ethereum: ETH-USD
   - Solana: SOL-USD

   Commodities:
   - Gold: GC=F
   - Silver: SI=F
   - Oil (WTI): CL=F
   - Natural Gas: NG=F

   Currencies:
   - USD Index: DX-Y.NYB
   - EUR/USD: EURUSD=X
   - GBP/USD: GBPUSD=X

   Stocks:
   - S&P 500: ^GSPC
   - Dow Jones: ^DJI
   - NASDAQ: ^IXIC
   - Tesla: TSLA
   - Apple: AAPL

   Rare Earth Materials:
   - MP Materials: MP
   - Lynas Rare Earths: LYC.AX
   - Rare Earth ETF: REMX
   ```

4. **Save Configuration**
   - Review your ticker list
   - Click "Save Ticker Configuration"
   - Changes take effect on next page refresh (1-minute cache)

## 📰 News Sources Configuration

### NewsAPI.org Integration

1. **Get API Key**

   - Sign up at [newsapi.org](https://newsapi.org)
   - Free tier: 100 requests/day, 1000 articles/request
   - Copy your API key

2. **Configure in Admin Panel**

   - Go to `/admin/settings` > "News Sources" tab
   - Paste your NewsAPI.org API key
   - Click "Save News Settings"

3. **What It Fetches**
   - Searches for: economy, finance, geopolitics, commodities, rare earth, gold, oil, currency
   - Language: English
   - Sorted by: Most recent first
   - Limit: 20 articles per sync

### RSS Feeds Configuration

1. **Add RSS Feed**

   - Enter Feed Name (e.g., "Reuters Business")
   - Enter RSS Feed URL
   - Click "Add Feed"

2. **Recommended RSS Feeds**

   ```
   Reuters Business:
   https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best

   Bloomberg Markets:
   https://feeds.bloomberg.com/markets/news.rss

   Financial Times:
   https://www.ft.com/?format=rss

   CNBC Markets:
   https://www.cnbc.com/id/10000664/device/rss/rss.html

   Forbes Finance:
   https://www.forbes.com/finance/feed/

   Wall Street Journal Markets:
   https://feeds.a.dj.com/rss/RSSMarketsMain.xml

   MarketWatch:
   https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines
   ```

3. **Enable/Disable Feeds**

   - Toggle feeds on/off as needed
   - Only enabled feeds are fetched during sync

4. **Save and Sync**
   - Click "Save News Settings"
   - Click "Sync News Now" to fetch articles immediately

### Manual News Sync

- Go to Settings > News Sources
- Click "Sync News Now"
- System fetches articles from all enabled sources
- Duplicates are automatically prevented
- New articles appear in the articles list immediately

### Automatic News Sync (Optional)

To automatically sync news every hour, add a cron job or scheduled task:

```bash
# Using curl (Linux/Mac)
*/60 * * * * curl -X POST https://yourdomain.com/api/admin/news/sync \
  -H "Cookie: your-session-cookie"

# Using PowerShell (Windows)
# Create a scheduled task that runs this every hour:
Invoke-RestMethod -Method POST -Uri "https://yourdomain.com/api/admin/news/sync" `
  -WebSession $session
```

Or use a service like [cron-job.org](https://cron-job.org) for external scheduling.

## 🎨 Customizing Categories

News articles are stored with these categories:

- `news` - General news articles (from RSS/NewsAPI)
- `analysis` - In-depth analysis pieces
- `geopolitics` - Geopolitical content
- `markets` - Market reports

You can edit article categories in `/admin/articles`.

## 🔧 Technical Details

### Database Schema

Settings are stored in the `SiteSettings` table:

```prisma
model SiteSettings {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   @db.Text
  updatedAt DateTime @updatedAt
}
```

Keys used:

- `ticker_symbols` - JSON array of ticker configurations
- `news_sources` - JSON array of RSS feed configurations
- `news_api_key` - NewsAPI.org API key
- `logo_url` - Site logo path

### API Endpoints

- `GET /api/ticker` - Fetch current ticker data
- `GET /api/admin/settings` - Get all settings
- `POST /api/admin/settings/tickers` - Save ticker configuration
- `POST /api/admin/settings/news` - Save news source configuration
- `POST /api/admin/news/sync` - Manually trigger news sync

### News Service

Location: `src/lib/news-service.ts`

Functions:

- `fetchFromNewsAPI(apiKey)` - Fetch from NewsAPI.org
- `fetchFromRSS(url, name)` - Parse RSS feed
- `syncNewsToDatabase(userId)` - Main sync function

## 🛠️ Troubleshooting

### Ticker Not Updating

- Check browser console for errors
- Verify Yahoo Finance symbol is correct
- Try symbol directly: `https://finance.yahoo.com/quote/SYMBOL`
- Clear browser cache

### News Not Syncing

- Verify NewsAPI key is valid
- Check RSS feed URLs are accessible
- Review server logs for errors
- Ensure database connection is working

### RSS Feed Errors

- Test RSS URL in browser first
- Some feeds require User-Agent headers
- Corporate firewalls may block external requests

## 📊 Performance Optimization

1. **Ticker Caching**

   - Data cached for 60 seconds
   - Reduce API calls to Yahoo Finance

2. **News Sync Frequency**

   - Recommended: Every 1-6 hours
   - NewsAPI free tier: 100 requests/day
   - RSS feeds: No limit (be respectful)

3. **Database Cleanup**
   - Old articles not automatically deleted
   - Manually clean up via `/admin/articles`
   - Consider adding auto-cleanup after 30 days

## 🎉 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Initialize settings: `node scripts/init-settings.js`
3. ✅ Configure tickers in admin panel
4. ✅ Add NewsAPI key
5. ✅ Configure RSS feeds
6. ✅ Sync news
7. ✅ Test ticker display on homepage
8. ✅ Verify articles appear in news grid

## 📝 Support

For issues or questions:

- Check server logs
- Review browser console
- Test API endpoints directly
- Verify database connectivity

---

**Congratulations!** Your GeoMoney application now has real market data and automated news fetching! 🚀
