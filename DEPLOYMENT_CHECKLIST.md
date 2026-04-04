# 🚀 GeoMoney Deployment Checklist

Use this checklist when deploying the completed GeoMoney application.

## Pre-Deployment

- [ ] All dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env`)
  - [ ] `DATABASE_URL` - MySQL connection string
  - [ ] `NEXTAUTH_SECRET` - Authentication secret
  - [ ] `NEXTAUTH_URL` - Application URL
- [ ] Database schema synced (`npx prisma db push`)
- [ ] Admin user created (`node scripts/create-admin.js`)

## Post-Deployment Setup

### 1. Initialize Default Settings

```bash
node scripts/init-settings.js
```

- [ ] Script runs successfully
- [ ] Default tickers configured
- [ ] Default RSS feeds configured

### 2. Configure News Sources

#### Get NewsAPI Key

- [ ] Sign up at https://newsapi.org
- [ ] Copy API key

#### Admin Panel Configuration

- [ ] Log in to `/admin`
- [ ] Navigate to Settings > News Sources
- [ ] Paste NewsAPI key
- [ ] Review/enable RSS feeds
- [ ] Click "Save News Settings"

### 3. Initial News Sync

- [ ] Click "Sync News Now" button
- [ ] Verify articles appear in `/admin/articles`
- [ ] Check articles display on homepage

### 4. Verify Ticker Display

- [ ] Open homepage
- [ ] Verify ticker displays market data
- [ ] Confirm values update (wait 60 seconds)
- [ ] Check for errors in browser console

### 5. Customize Tickers (Optional)

- [ ] Go to Settings > Ticker Configuration
- [ ] Add/remove ticker symbols as needed
- [ ] Click "Save Ticker Configuration"
- [ ] Verify changes on homepage

## Testing Checklist

### Ticker System

- [ ] Ticker displays on homepage
- [ ] All configured symbols show data
- [ ] Color coding works (green/red)
- [ ] Values update automatically
- [ ] No console errors

### News System

- [ ] Manual sync works
- [ ] Articles saved to database
- [ ] Articles display on homepage
- [ ] Images load correctly
- [ ] No duplicate articles

### Admin Panel

- [ ] All tabs accessible
- [ ] Ticker CRUD operations work
- [ ] News sources CRUD operations work
- [ ] Save buttons provide feedback
- [ ] Logo upload still works

## Performance Checks

- [ ] Homepage loads in < 3 seconds
- [ ] Ticker data loads within 2 seconds
- [ ] News sync completes in < 30 seconds
- [ ] No database connection errors
- [ ] No API rate limit errors

## Production Configuration

### Recommended Settings

**Ticker Update Frequency**

- Current: 60 seconds (optimal)
- Can be adjusted in `src/components/Ticker.tsx`

**News Sync Frequency**

- Recommended: Every 2-6 hours
- Set up cron job or scheduled task

### Optional: Automatic News Sync

#### Using Cron (Linux/Mac)

```bash
# Add to crontab (every 3 hours)
0 */3 * * * curl -X POST https://yourdomain.com/api/admin/news/sync \
  -H "Cookie: your-session-cookie"
```

#### Using Windows Task Scheduler

```powershell
# PowerShell script to run every 3 hours
$url = "https://yourdomain.com/api/admin/news/sync"
# Configure authentication as needed
Invoke-RestMethod -Method POST -Uri $url
```

#### Using External Service

- Use [cron-job.org](https://cron-job.org)
- Set URL: `https://yourdomain.com/api/admin/news/sync`
- Frequency: Every 3 hours
- Note: Requires public API access

## Monitoring

### Things to Monitor

- [ ] Database size (articles accumulate)
- [ ] API usage (NewsAPI free tier = 100/day)
- [ ] Yahoo Finance API availability
- [ ] RSS feed accessibility
- [ ] Application error logs

### Maintenance Tasks

**Weekly**

- [ ] Review new articles for quality
- [ ] Check ticker data accuracy
- [ ] Monitor API usage

**Monthly**

- [ ] Clean up old articles (optional)
- [ ] Review and update RSS feeds
- [ ] Check for duplicate articles
- [ ] Backup database

## Troubleshooting

### Ticker Not Working

1. Check Yahoo Finance API status
2. Verify ticker symbols are correct
3. Check browser console for errors
4. Test symbol at finance.yahoo.com/quote/SYMBOL

### News Not Syncing

1. Verify NewsAPI key is valid
2. Check API usage limits
3. Test RSS feed URLs in browser
4. Review server logs for errors

### Database Issues

1. Verify DATABASE_URL is correct
2. Check database server is running
3. Ensure Prisma schema is synced
4. Review connection pool settings

## Support Resources

- **Implementation Guide**: `REAL_DATA_GUIDE.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Database Schema**: `prisma/schema.prisma`
- **API Docs**: Comments in route files

## Rollback Plan

If issues occur:

1. Revert to previous deployment
2. Check database integrity
3. Review recent changes
4. Test in staging first

## Success Criteria

Deployment is successful when:

- ✅ Homepage loads without errors
- ✅ Ticker displays real-time data
- ✅ News articles populate automatically
- ✅ Admin panel fully functional
- ✅ All tests pass
- ✅ No console errors

---

## Final Steps

- [ ] Mark deployment as complete
- [ ] Document any custom configurations
- [ ] Share admin credentials securely
- [ ] Schedule first news sync
- [ ] Monitor for 24 hours

**Deployment Date**: ******\_******

**Deployed By**: ******\_******

**Notes**: **********************\_**********************

---

🎉 **Congratulations! Your GeoMoney application is live with real data!**
