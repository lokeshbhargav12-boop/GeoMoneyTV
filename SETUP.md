# 🚀 GeoMoney TV - Complete Setup Guide

## Quick Start (5 Steps)

### Step 1: Configure Database

Edit `.env.local` with your Hostinger MySQL credentials:

```env
DATABASE_URL="mysql://your_username:your_password@your_host:3306/your_database"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
```

**Finding Your Hostinger MySQL Credentials:**

1. Login to Hostinger control panel
2. Go to "Databases" → "MySQL Databases"
3. Note down:
   - Database name
   - Database username
   - Database password
   - Hostname (usually localhost or specific server)

### Step 2: Initialize Database

```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### Step 3: Create Admin User

```bash
# Replace with your actual credentials
node scripts/create-admin.js admin@geomoney.com YourSecurePassword123 "Admin Name"
```

### Step 4: Seed Rare Earth Data

After starting the server, visit `/admin/rare-earth` and click "Seed Database"

### Step 5: Start Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## Full Production Deployment

### Hostinger Deployment Steps

#### 1. Upload Your Project

**Option A: Git (Recommended)**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

**Option B: FTP/File Manager**

- Zip your project (excluding node_modules)
- Upload via Hostinger File Manager
- Extract on server

#### 2. Server Setup

SSH into your Hostinger server:

```bash
ssh your-username@your-server-ip
```

Navigate to project directory:

```bash
cd ~/domains/yourdomain.com/public_html
```

#### 3. Install Dependencies

```bash
npm install --production
```

#### 4. Configure Environment

Create `.env.local` on server:

```bash
nano .env.local
```

Add your production credentials:

```env
DATABASE_URL="mysql://prod_user:prod_pass@localhost:3306/prod_db"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-generated-secret-key"
```

#### 5. Setup Database

```bash
npx prisma db push
npx prisma generate
```

#### 6. Create Admin User

```bash
node scripts/create-admin.js admin@yourdomain.com SecurePassword123 "Admin"
```

#### 7. Build Application

```bash
npm run build
```

#### 8. Start with PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "geomoney" -- start

# Save PM2 process list
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

#### 9. Configure Nginx (if needed)

Create Nginx config:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 10. SSL Certificate (Hostinger Auto-SSL)

Enable SSL in Hostinger control panel:

1. Go to "SSL" section
2. Enable Auto-SSL for your domain
3. Update NEXTAUTH_URL to https://yourdomain.com

---

## Database Management

### Using Prisma Studio

```bash
npx prisma studio
```

This opens a GUI at http://localhost:5555 for database management.

### Manual Database Queries

```bash
# Connect to MySQL
mysql -u your_username -p your_database

# View users
SELECT email, role FROM User;

# Make user admin
UPDATE User SET role = 'admin' WHERE email = 'user@email.com';

# View newsletter subscribers
SELECT * FROM Newsletter ORDER BY createdAt DESC;
```

### Database Backup

```bash
# Backup database
mysqldump -u username -p database_name > backup.sql

# Restore database
mysql -u username -p database_name < backup.sql
```

---

## API Routes Overview

### Public APIs

- `GET /api/rare-earth` - Fetch rare earth materials
- `POST /api/newsletter` - Subscribe to newsletter
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - Authentication

### Protected Admin APIs

- `GET /api/admin/articles` - List articles
- `POST /api/admin/articles` - Create article

---

## Common Issues & Solutions

### Issue: "Cannot connect to database"

**Solution:**

- Check DATABASE_URL format
- Verify MySQL credentials
- Ensure database exists
- Check if MySQL service is running

### Issue: "Prisma Client not generated"

**Solution:**

```bash
npx prisma generate
```

### Issue: "NEXTAUTH_SECRET missing"

**Solution:**

```bash
# Generate secret
openssl rand -base64 32

# Add to .env.local
NEXTAUTH_SECRET="generated-secret-here"
```

### Issue: "Cannot access admin panel"

**Solution:**

- Ensure user role is 'admin' in database
- Check if logged in
- Clear cookies and re-login

---

## Environment Variables Explained

| Variable        | Purpose                 | Example                          |
| --------------- | ----------------------- | -------------------------------- |
| DATABASE_URL    | MySQL connection string | `mysql://user:pass@host:3306/db` |
| NEXTAUTH_URL    | Your site URL           | `https://yourdomain.com`         |
| NEXTAUTH_SECRET | JWT encryption key      | `random-32-char-string`          |

---

## Performance Optimization

### 1. Enable Production Mode

Ensure `NODE_ENV=production` is set

### 2. Database Connection Pooling

Already configured in Prisma schema

### 3. Caching

Consider adding Redis for session caching

### 4. CDN

Use Cloudflare or similar for static assets

---

## Security Checklist

- ✅ Change default admin password
- ✅ Use strong NEXTAUTH_SECRET
- ✅ Enable HTTPS/SSL
- ✅ Keep dependencies updated
- ✅ Regular database backups
- ✅ Restrict database access
- ✅ Use environment variables (never commit .env files)

---

## Support Commands

```bash
# View logs with PM2
pm2 logs geomoney

# Restart application
pm2 restart geomoney

# Stop application
pm2 stop geomoney

# View application status
pm2 status

# Monitor application
pm2 monit
```

---

## Development Tips

### Hot Reload Development

```bash
npm run dev
```

### Build and Test Production Locally

```bash
npm run build
npm start
```

### Database Schema Changes

```bash
# After modifying schema.prisma
npx prisma db push
npx prisma generate
```

### View Database in Browser

```bash
npx prisma studio
```

---

## Need Help?

- Check logs: `pm2 logs`
- Database GUI: `npx prisma studio`
- Check .env.local configuration
- Verify MySQL connection
- Review README.md

---

© 2025 GeoMoney TV - Strategic Intelligence Platform
