# How to Deploy to Vercel with Hostinger Database

Since your Hostinger plan doesn't support Node.js, we will deploy the app to Vercel (which is built for Next.js) and connect it to your existing Hostinger database.

## Step 1: Prepare Hostinger Database for Remote Access

1. Log in to **Hostinger hPanel**.
2. Go to **Databases** > **Remote MySQL**.
3. In the **IP (IPv4) or %** field, enter: `%` (This allows connections from any IP, which is needed for Vercel).
4. Select your database (`u220613152_test`).
5. Click **Create**.
   _Note: This allows Vercel to talk to your database._

## Step 2: Push Code to GitHub

1. If you haven't already, push your code to a GitHub repository.
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

## Step 3: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (using your GitHub account is easiest).
2. Click **"Add New..."** > **"Project"**.
3. Import your `GeoMoney` repository.
4. In the **Configure Project** screen:
   - **Framework Preset**: Next.js (should be auto-detected).
   - **Root Directory**: `.` (default).
   - **Environment Variables**: Expand this section. You need to add the variables from your `.env` file:
     - `DATABASE_URL`: `mysql://u220613152_root:GeoMoney2025DB@srv837.hstgr.io:3306/u220613152_test`
     - `NEXTAUTH_URL`: `https://your-project-name.vercel.app` (You will get this URL after deploy, for now you can put `http://localhost:3000` and update it later, or guess the name).
     - `NEXTAUTH_SECRET`: `12345678` (Or generate a new long random string).
5. Click **Deploy**.

## Step 4: Final Configuration

1. Once deployed, Vercel will give you a domain (e.g., `geomoney-tv.vercel.app`).
2. Go to your Vercel Project Settings > Environment Variables.
3. Update `NEXTAUTH_URL` to match your new Vercel domain (e.g., `https://geomoney-tv.vercel.app`).
4. Go to the **Deployments** tab and "Redeploy" the latest commit for the changes to take effect.

## Step 5: Point Your Domain (Optional)

If you want `geomoneytv.com` to point to Vercel:

1. Go to **Hostinger hPanel** > **DNS Zone Editor**.
2. Delete the existing `A` record for `@`.
3. Add a `CNAME` record:
   - **Name**: `@`
   - **Target**: `cname.vercel-dns.com`
4. Add the domain in your Vercel Project Settings > Domains.
