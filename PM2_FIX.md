# Fix: "pm2: command not found"

This error happens because the server "forgot" where Node.js and PM2 are installed when you opened a new terminal session. This is common with NVM (Node Version Manager).

## Option 1: Reactivate NVM (Quick Fix)

Run these commands in your terminal to "remind" the server where Node.js is:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

Now try running PM2 again:

```bash
pm2 restart geomoney
```

## Option 2: Use `npx` (Alternative)

If you don't want to mess with paths, you can run PM2 directly using `npx` (this might be slower):

```bash
npx pm2 restart geomoney
```

## Option 3: Make it Permanent (Recommended)

To stop this from happening every time you log in, add the NVM configuration to your `.bashrc` file:

1.  Open `.bashrc`:
    ```bash
    nano ~/.bashrc
    ```
2.  Scroll to the bottom and paste this:
    ```bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    ```
3.  Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).
4.  Reload the configuration:
    ```bash
    source ~/.bashrc
    ```
