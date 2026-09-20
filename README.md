# GeoMoney TV - Full Stack Application

Strategic intelligence platform with authentication, admin panel, and rare earth materials tracking.

## Features

✅ **Authentication System**

- NextAuth.js with credentials provider
- User registration and login
- Role-based access control (admin/user)
- Protected routes with middleware

✅ **Admin Panel**

- Dashboard with statistics
- Article management (CRUD operations)
- Rare earth materials management
- Newsletter subscriber management

✅ **Rare Earth Materials**

- Comprehensive database of critical minerals
- Category classification (Light/Heavy Rare Earth)
- Applications and supply chain data
- Country-wise production information

✅ **Real-Time Data**

- Integrated market ticker with Yahoo Finance API
- Support for stocks, crypto, commodities, and currencies
- Configurable ticker symbols from admin panel
- Color-coded real-time price changes

✅ **Automated News System**

- Integration with NewsAPI.org (80,000+ sources)
- RSS feed parser for custom news sources
- Automated duplicate article prevention
- Admin-controlled manual sync
- Rich content import with images

✅ **Database**

- PostgreSQL database integration via Prisma ORM
- EC2/self-hosted deployment ready configuration
- Automatic migrations
- Optimized schema for articles and settings

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database

Edit `.env.local` with your PostgreSQL credentials:

```env
# Replace with your actual PostgreSQL credentials
DATABASE_URL="postgresql://username:password@hostname:5432/database_name?schema=public"

# Generate a secure secret for NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
```

To generate a secure NEXTAUTH_SECRET, run:

```bash
openssl rand -base64 32
```

### 3. Initialize Database

Push the Prisma schema to your PostgreSQL database:

```bash
npx prisma db push
```

Generate Prisma Client:

```bash
npx prisma generate
```

### 4. Create Admin User

You can create an admin user by:

1. Register a new account at `/auth/register`
2. Manually update the user role in the database:

```sql
UPDATE User SET role = 'admin' WHERE email = 'your@email.com';
```

Or use Prisma Studio:

```bash
npx prisma studio
```

### 5. Seed Rare Earth Materials Data

Visit your admin panel at `/admin/rare-earth` and click "Seed Database" to populate initial rare earth materials data.

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 7. Build for Production

```bash
npm run build
npm start
```

## Deployment (EC2 / self-hosted)

### 1. Prepare Environment Variables

In your server environment, set these environment variables:

- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_URL` - Your production domain
- `NEXTAUTH_SECRET` - Secure random string

### 2. Upload Files

Upload your project files via:

- FTP/SFTP
- Git deployment (if available)
- Your deployment method (Git/SFTP/CI/CD)

### 3. Install Dependencies on Server

```bash
npm install --production
```

### 4. Run Database Migrations

```bash
npx prisma db push
npx prisma generate
```

### 5. Build and Start

```bash
npm run build
npm start
```

## Database Schema

### Tables

- **User** - User accounts with authentication
- **Session** - NextAuth session management
- **Article** - Content management
- **RareEarthMaterial** - Rare earth minerals database
- **Newsletter** - Email subscribers

## API Routes

### Public Routes

- `GET /api/rare-earth` - Fetch rare earth materials
- `POST /api/rare-earth` - Seed database (initial setup)

### Authentication Routes

- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth endpoints
- `GET /api/auth/[...nextauth]` - NextAuth session

### Admin Routes (Protected)

- `GET /api/admin/articles` - List all articles
- `POST /api/admin/articles` - Create new article
- `GET /api/admin/export/users-emails` - Export all users with emails
- `GET /api/admin/export/articles` - Export all articles
- `GET /api/admin/export/waitlist` - Export all active waitlist members

## Admin Panel Routes

- `/admin` - Dashboard
- `/admin/articles` - Article management
- `/admin/rare-earth` - Rare earth materials
- `/admin/newsletters` - Newsletter subscribers

## Technologies Used

- **Framework:** Next.js 14 (App Router)
- **Authentication:** NextAuth.js
- **Database:** PostgreSQL + Prisma ORM
- **Styling:** Tailwind CSS
- **3D Graphics:** Three.js + React Three Fiber
- **Animations:** Framer Motion

## Security Features

- Password hashing with bcrypt
- JWT-based sessions
- Protected API routes
- Role-based access control
- CSRF protection (NextAuth)
- SQL injection prevention (Prisma)

## Support

For issues or questions, contact your development team.

## License

© 2025 GeoMoney TV. All rights reserved.
