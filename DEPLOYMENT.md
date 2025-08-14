# 🚀 Digital Ocean Apps Deployment Guide

## 📋 Pre-Deployment Checklist

✅ Server runs on `process.env.PORT` (configured)  
✅ Orange outline CSS fixed with `!important` flags  
✅ Database schema includes negotiation status  
✅ `.gitignore` excludes node_modules  
✅ `app.yaml` configured for Digital Ocean Apps  

## 🌐 Deploy to Digital Ocean Apps

### Step 1: Upload to GitHub
1. **Drag and drop these files/folders** to your GitHub repo:
   - `docs/` folder
   - `public/` folder
   - `app.yaml`
   - `package.json`
   - `server.js`
   - `.gitignore`
   - `README.md`
   - `DEPLOYMENT.md`

   ⚠️ **DO NOT upload**: `node_modules/`, `*.db` files, or `test-api.html`

### Step 2: Digital Ocean Configuration
1. **Go to DigitalOcean Apps**: https://cloud.digitalocean.com/apps
2. **Create App** → **GitHub** → Select your repo
3. **Edit `app.yaml`** and update line 11:
   ```yaml
   repo: YOUR_GITHUB_USERNAME/YOUR_REPO_NAME
   ```
4. **Deploy**

### Step 3: Verify Deployment
Your app will be available at: `https://your-app-name.ondigitalocean.app`

**Check these work:**
- ✅ Orange outline on Closing column
- ✅ Drag tasks between columns (they stick)
- ✅ Delete tasks with [X] button
- ✅ Real-time sync (if multiple users)

## 🔧 Troubleshooting

**Tasks snap back after dragging:**
- Check browser console for API errors
- Verify your app URL is accessible

**No orange outline:**
- Force refresh browser (Ctrl+F5)
- CSS should now have `!important` flags

**App won't start:**
- Check DigitalOcean logs in the Apps dashboard
- Verify `package.json` dependencies are correct

## 📊 Cost
- **Basic plan**: ~$12/month for the web service
- **Database**: Uses SQLite (free) or upgrade to managed PostgreSQL ($7/month)

## 🔄 Updates
Push to your GitHub main branch and DigitalOcean will auto-deploy changes.

---
*Your sales war room is ready for deployment! 🎯*