# Restore Previous .htaccess

Here is the configuration we had before the "Proxy Everything" change. This version checks if a file exists locally before proxying, which is safer but might still have the CSS issue if the `_next` folder structure isn't perfect.

**However, a 503 Error usually means your Next.js app is NOT running.**
Since you saw `pm2: command not found`, your server likely stopped and didn't restart.

## Step 1: Restore .htaccess

Paste this into your `.htaccess` file:

```apache
Options -MultiViews
RewriteEngine On
ProxyPreserveHost On

# Proxy _next assets explicitly
RewriteRule ^_next/(.*) http://127.0.0.1:3000/_next/$1 [P,L]

# Proxy root
RewriteRule ^$ http://127.0.0.1:3000/ [P,L]

# Proxy everything else that isn't a local file/dir
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

## Step 2: CRITICAL - Start the Server

If you don't do this, you will keep getting 503 errors regardless of the `.htaccess` file.

1.  **Fix PM2 command:**
    ```bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    ```
2.  **Start the app:**
    ```bash
    pm2 start npm --name "geomoney" -- start
    ```
    _(Or if it's already in the list: `pm2 restart geomoney`)_
3.  **Check status:**
    ```bash
    pm2 list
    ```
    Make sure it says "online".
