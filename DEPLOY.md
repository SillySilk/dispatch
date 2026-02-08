# Quick Deployment Guide

## Deploy to Netlify (Fastest Method)

### Method 1: Netlify Drop (No account needed initially)

1. **Build the app locally:**
   ```bash
   cd web-demo
   npm install
   npm run build
   ```

2. **Deploy:**
   - Open [https://app.netlify.com/drop](https://app.netlify.com/drop)
   - Drag the `dist` folder onto the drop zone
   - Get your live URL instantly!

### Method 2: Netlify CLI (For updates)

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and deploy:**
   ```bash
   cd web-demo
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Follow prompts:**
   - Login/create account if needed
   - Choose "Create & configure a new site"
   - Pick a site name (or accept random)
   - Get your live URL!

### Method 3: GitHub + Netlify (For continuous deployment)

1. **Push to GitHub:**
   ```bash
   cd web-demo
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Netlify:**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select your repository
   - Build settings:
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`
   - Click "Deploy site"

3. **Auto-deploy:** Every push to main will trigger a new deployment!

## Deploy to Vercel

### Quick Deploy

```bash
npm install -g vercel
cd web-demo
npm run build
vercel --prod
```

## Deploy to GitHub Pages

1. **Update `vite.config.ts`:**
   ```ts
   base: '/repository-name/',
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   # Use gh-pages or manual dist folder upload
   ```

## Share Demo Link

Once deployed, share the URL with your boss:
```
https://your-site-name.netlify.app
```

## Demo Features

The web demo includes:
- ✅ All UI components and navigation
- ✅ Mock data (3 houses, 3 clients, 4 staff, 3 appointments)
- ✅ Full appointment scheduling interface
- ✅ On-call nurse management
- ✅ Client contacts and details
- ⚠️ Changes don't persist (refresh resets data)
- ⚠️ No actual text messaging
- ⚠️ No database backup/restore

## For Full Desktop Version

After boss approves, provide the full Electron desktop app with:
- Persistent SQLite database
- Real SMS messaging via Twilio
- Database backup/restore
- Secure credential storage
- No internet required (runs locally)
