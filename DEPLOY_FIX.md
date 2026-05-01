# Deployment Instructions

The issue you are seeing (unstyled content) typically happens when:

1. The project was not built on the server.
2. The `.next` folder or `node_modules` were copied from Windows to the Linux server (this causes binary incompatibility).
3. The CSS files are not being generated.

## Correct Deployment Steps

Follow these steps exactly on your server (via SSH or terminal):

1. **Clean old files** (Important!)

   ```bash
   rm -rf .next node_modules
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Generate Database Client**

   ```bash
   npx prisma generate
   ```

4. **Build the Project**

   ```bash
   npm run build
   ```

   _Wait for this to complete successfully. It should say "Compiled successfully"._

5. **Start the Server**
   ```bash
   npm start
   ```
   _Or if you use PM2:_
   ```bash
   pm2 restart geomoney-tv --update-env
   ```

## Troubleshooting

- **If `npm run build` fails:** Check the error message. It might be a memory issue on small VPS instances.
- **If styles are still missing:** Open the browser Developer Tools (F12), go to the **Network** tab, and refresh. Look for red (404) errors for `.css` files.
