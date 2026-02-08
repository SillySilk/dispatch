# Deploy via GitHub + Netlify (Recommended)

This is the **professional approach** - push to GitHub, let Netlify automatically build and deploy. Every future update is just a `git push` away.

## Step 1: Create GitHub Repository

### Option A: Via GitHub Website
1. Go to https://github.com/new
2. Repository name: `dispatcher-app-demo` (or whatever you prefer)
3. **Important:** Choose **Private** (your boss can still see the deployed site)
4. **Do NOT** initialize with README (we already have files)
5. Click "Create repository"

### Option B: Via GitHub CLI
```bash
gh repo create dispatcher-app-demo --private --source=. --remote=origin
```

## Step 2: Push Code to GitHub

```bash
cd C:\AI\dispatcher-app\web-demo

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Dispatcher App web demo"

# Add remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/dispatcher-app-demo.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Example with actual username:**
```bash
git remote add origin https://github.com/PanPDX/dispatcher-app-demo.git
git branch -M main
git push -u origin main
```

## Step 3: Connect Netlify to GitHub

1. **Log in to Netlify:**
   - Go to https://app.netlify.com
   - Sign in with your Netlify account (or create one)

2. **Import from GitHub:**
   - Click **"Add new site"** → **"Import an existing project"**
   - Choose **"Deploy with GitHub"**
   - Authorize Netlify to access your GitHub account (if first time)
   - Select your repository: `dispatcher-app-demo`

3. **Configure Build Settings:**
   - **Branch to deploy:** `main`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Leave everything else as default**

4. **Deploy!**
   - Click **"Deploy site"**
   - Netlify will:
     - Install dependencies (`npm install`)
     - Run build (`npm run build`)
     - Deploy the `dist` folder
   - First deployment takes 1-2 minutes

5. **Get Your URL:**
   - You'll get a random URL like: `https://amazing-cupcake-1a2b3c.netlify.app`
   - Click "Site settings" → "Change site name" to customize it
   - Example: `https://dispatcher-demo.netlify.app`

## Step 4: Test Your Live Site

Visit your Netlify URL and verify:
- ✅ Demo banner appears at top
- ✅ Sidebar navigation works
- ✅ Can view dashboard, clients, appointments
- ✅ Can create/edit records (until refresh)
- ✅ All UI looks correct

## Step 5: Share with Your Boss

Send them the URL:
```
Hey [Boss Name],

I've built a demo of the dispatcher management app I mentioned.
You can explore it here: https://dispatcher-demo.netlify.app

Key features to check out:
- Dashboard overview
- Client management with medical info
- Appointment scheduling with Google Maps integration
- On-call nurse scheduling
- Text messaging interface

Note: This is a demo version with sample data. The full desktop
version includes persistent database, real SMS integration, and
offline capability.

Let me know what you think!
```

## Future Updates (Auto-Deploy!)

After the initial setup, any changes you make are automatically deployed:

```bash
cd C:\AI\dispatcher-app\web-demo

# Make some changes to the code
# ... edit files ...

# Commit and push
git add .
git commit -m "Update appointment interface"
git push

# Netlify automatically:
# 1. Detects the push
# 2. Runs npm install && npm run build
# 3. Deploys the new version
# 4. Your boss sees updates in ~2 minutes
```

## Netlify Deploy Status

You can see build status at:
- https://app.netlify.com/sites/YOUR-SITE-NAME/deploys

Each deploy shows:
- ✅ Success/failure
- 📋 Build logs
- 🕐 Deploy time
- 🔄 Roll back to previous version (if needed)

## Benefits of This Approach

✅ **Automatic deployments** - Just `git push` to update
✅ **Version control** - Git tracks all changes
✅ **Easy rollback** - Revert to any previous deploy
✅ **Deploy previews** - Test changes before merging
✅ **Custom domain** - Add your own domain later
✅ **Free SSL** - HTTPS included
✅ **Professional** - Industry-standard workflow

## Troubleshooting

### If build fails on Netlify:

1. Check the deploy log in Netlify dashboard
2. Common issues:
   - Node version mismatch
   - Missing dependencies
   - TypeScript errors

3. Force Node version (if needed):
   Create `web-demo/.nvmrc`:
   ```
   20
   ```

### If site loads but looks broken:

- Check browser console for errors
- Verify `base: './'` in `vite.config.ts` (already set)
- Check `netlify.toml` redirects are in place (already configured)

## Optional: Custom Domain

After your boss approves, you can add a custom domain:

1. In Netlify: Site settings → Domain management
2. Add custom domain: `dispatcher-demo.yourdomain.com`
3. Update DNS records as Netlify instructs
4. Free SSL certificate auto-generated

---

## Quick Reference

```bash
# First time setup
cd C:\AI\dispatcher-app\web-demo
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/dispatcher-app-demo.git
git push -u origin main

# Future updates
git add .
git commit -m "Description of changes"
git push
```

Then connect Netlify → GitHub → Auto-deploy! 🚀
