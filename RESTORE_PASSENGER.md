# Restore Hostinger Passenger Configuration

Here are the lines you asked for. This configuration hands control back to Hostinger's built-in Node.js manager (Passenger).

## 1. The `.htaccess` Content

Paste this into your `.htaccess` file on the server:

```apache
PassengerAppRoot /home/u220613152/domains/geomoneytv.com/public_html
PassengerAppType node
PassengerNodejs /opt/alt/alt-nodejs22/root/bin/node
PassengerStartupFile server.js
PassengerBaseURI /
```

## 2. CRITICAL REQUIREMENT: `server.js`

For this to work, **you MUST upload the `server.js` file** I created earlier to your `public_html` folder. Passenger looks for this specific file to start your app.

If you don't have it, here is the content again. Save it as `server.js` and upload it:

```javascript
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      if (pathname === "/a") {
        await app.render(req, res, "/a", query);
      } else if (pathname === "/b") {
        await app.render(req, res, "/b", query);
      } else {
        await handle(req, res, parsedUrl);
      }
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
```

## 3. Stop PM2

Since Passenger will now run the app, you should stop your manual PM2 instance to save memory and avoid conflicts:

```bash
pm2 stop geomoney
```
