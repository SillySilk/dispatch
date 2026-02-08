# Dispatcher App - Web Demo

This is a **demonstration version** of the Dispatcher App designed for easy sharing and testing without requiring local installation. This web demo uses mock data and does not persist changes.

## Features Demonstrated

- **Dashboard**: Overview of clients, appointments, and on-call nurses
- **Houses**: Group home management
- **Clients**: Client profiles with contacts and medical information
- **Staff**: Staff member management
- **Appointments**: Schedule and track client appointments with Google Maps integration
- **On-Call Nurses**: Weekly on-call nurse scheduling
- **Messaging**: Text message interface (demo mode - no actual messages sent)

## Demo Limitations

⚠️ **This is a demo version with the following limitations:**
- All data is stored in browser memory (not persistent)
- Changes are lost when you refresh the page
- No actual text messages are sent
- No real database backup/restore
- Limited to demonstration data only

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploying to Netlify

### Option 1: Drag & Drop
1. Build the app: `npm run build`
2. Go to [Netlify Drop](https://app.netlify.com/drop)
3. Drag the `dist` folder to the drop zone

### Option 2: CLI Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the app
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Option 3: Git Integration
1. Push this `web-demo` folder to a GitHub repository
2. Log in to [Netlify](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click "Deploy site"

## Environment Variables

No environment variables are required for the demo version.

## Support

This is a demonstration version. For the full desktop application with persistent data storage, database backup/restore, and actual messaging capabilities, please see the main Electron app.

---

**Note**: The full production version is an Electron desktop application with SQLite database, secure credential storage, and full HIPAA compliance considerations. This web demo is for evaluation purposes only.
