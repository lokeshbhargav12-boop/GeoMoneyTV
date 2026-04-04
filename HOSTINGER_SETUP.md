# Manual Node.js Installation (For Cloud Plans)

If the "Node.js" button is missing from your hPanel, you can install it manually via SSH since you have a Cloud plan.

## Step 1: Install NVM (Node Version Manager)

Run these commands in your SSH terminal one by one:

1. **Download NVM:**

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   ```

2. **Activate NVM:**

   ```bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   ```

3. **Install Node.js:**

   ```bash
   nvm install 20
   ```

4. **Verify Installation:**
   ```bash
   node -v
   npm -v
   ```
   _If you see version numbers, you are ready to go!_

## Step 2: Install & Build Your App

Now that `npm` is working:

```bash
# 1. Install dependencies
npm install

# 2. Generate Database Client
npx prisma generate

# 3. Build the project
npm run build
```

## Step 3: Setup Port Forwarding (.htaccess)

I have created a `.htaccess` file in your `public` folder.
**Make sure this file is uploaded to your `public_html` folder on the server.**
This tells the web server to send traffic from your domain to your Next.js app running on port 3000.

## Step 4: Start the Server with PM2

To keep your site running even when you close the terminal, use PM2.

```bash
# 1. Install PM2 globally
npm install -g pm2

# 2. Start your app
pm2 start npm --name "geomoney" -- start

# 3. Save the process list
pm2 save
```

## Troubleshooting

- If `curl` fails, try `wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
- If you see a 500 error, check if the `.htaccess` file is correct and if the app is actually running on port 3000 (`pm2 logs`).
