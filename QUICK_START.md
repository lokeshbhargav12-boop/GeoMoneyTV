# Quick Start Commands

## Installation

```bash
npm install
```

## Database Setup

```bash
# Sync database schema
npx prisma db push

# Create admin user (follow prompts)
node scripts/create-admin.js

# Initialize default settings (tickers & news sources)
node scripts/init-settings.js
```

## Development

```bash
# Start development server
npm run dev

# Access application
# http://localhost:3000
```

## Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Admin Panel Access

- URL: `http://localhost:3000/admin`
- Create admin: `node scripts/create-admin.js`

## Configure Real Data

### 1. Ticker Configuration

1. Go to `/admin/settings` > Ticker Configuration tab
2. Add/edit ticker symbols
3. Click "Save Ticker Configuration"

### 2. News Sources Configuration

1. Get API key from https://newsapi.org
2. Go to `/admin/settings` > News Sources tab
3. Enter NewsAPI key
4. Add/enable RSS feeds
5. Click "Save News Settings"
6. Click "Sync News Now"

## Useful Scripts

```bash
# Check database connection
node scripts/check-db.js

# Create admin user
node scripts/create-admin.js

# Initialize default settings
node scripts/init-settings.js
```

## URLs

- Homepage: `/`
- Admin Login: `/auth/signin`
- Admin Dashboard: `/admin`
- Settings: `/admin/settings`
- Articles: `/admin/articles`
- Users: `/admin/users`

## Common Issues

### Can't connect to database

```bash
# Check DATABASE_URL in .env
# Verify database server is running
# Test connection: node scripts/check-db.js
```

### Ticker not updating

- Check browser console for errors
- Verify Yahoo Finance symbol format
- Test at: https://finance.yahoo.com/quote/SYMBOL

### News not syncing

- Verify NewsAPI key is valid
- Check RSS feed URLs are accessible
- Review server logs for errors

## API Endpoints

### Public

- `GET /api/ticker` - Market ticker data

### Admin Only

- `POST /api/admin/settings/tickers` - Save tickers
- `POST /api/admin/settings/news` - Save news sources
- `POST /api/admin/news/sync` - Sync news manually

## Environment Variables

```env
DATABASE_URL="mysql://user:pass@host:3306/dbname"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Deployment Platforms

### Vercel

```bash
vercel --prod
```

### Hostinger/cPanel

1. Build locally: `npm run build`
2. Upload `.next`, `public`, and files
3. Use Node.js app or Passenger
4. See: HOSTINGER_SETUP.md

### PM2

```bash
pm2 start npm --name "geomoney" -- start
pm2 save
```

---

## Need Help?

📚 Read the guides:

- `REAL_DATA_GUIDE.md` - Configuration guide
- `IMPLEMENTATION_SUMMARY.md` - Technical overview
- `DEPLOYMENT_CHECKLIST.md` - Deployment steps
