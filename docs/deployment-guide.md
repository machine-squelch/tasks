# DLuxe Task Tracker - Digital Ocean Deployment Guide

## Project Structure
```
dluxe-task-tracker/
├── server.js           # Backend Express server
├── package.json        # Node dependencies
├── app.yaml           # Digital Ocean App spec (optional)
├── public/            # Frontend files
│   ├── index.html     # Your glitch tracker UI
│   └── dllogoonly.png # DL logo image (REQUIRED)
└── README.md          # This guide
```

## Quick Deploy to Digital Ocean App Platform

### Option 1: Deploy via GitHub (Recommended)

1. **Prepare Your Repository**
   ```bash
   # Create a new GitHub repo
   mkdir dluxe-task-tracker
   cd dluxe-task-tracker
   
   # Add backend files
   # Copy server.js and package.json from artifacts
   
   # Create public folder and add your HTML + logo
   mkdir public
   # Copy index.html to public/
   # Copy dllogoonly.png to public/
   
   # Initialize git
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/dluxe-task-tracker.git
   git push -u origin main
   ```

2. **Deploy on Digital Ocean**
   - Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Choose GitHub as source
   - Select your repository
   - Digital Ocean auto-detects Node.js app
   - Review settings:
     - **Build Command**: `npm install`
     - **Run Command**: `npm start`
     - **HTTP Port**: 8080
   - Choose instance size: Basic XXS ($5/month) is perfect for small teams
   - Click "Create Resources"

3. **Your app deploys automatically!**
   - URL will be: `https://dluxe-task-tracker-xxxxx.ondigitalocean.app`
   - Pushes to main branch auto-deploy

### Option 2: Deploy via CLI

1. **Install Digital Ocean CLI**
   ```bash
   # macOS
   brew install doctl
   
   # Windows/Linux - download from:
   # https://docs.digitalocean.com/reference/doctl/how-to/install/
   ```

2. **Authenticate**
   ```bash
   doctl auth init
   # Enter your API token from DO dashboard
   ```

3. **Deploy App**
   ```bash
   # From your project directory
   doctl apps create --spec app.yaml
   ```

### Option 3: Deploy via Docker (Alternative)

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

Then deploy using DO's container registry.

## Database Options

### Current: SQLite (Included)
- **Pros**: Zero config, file-based, perfect for <100 users
- **Cons**: Single server only, no horizontal scaling
- **Cost**: $0 (uses app storage)

### Upgrade Path 1: Digital Ocean Dev Database
```yaml
# Add to app.yaml
databases:
  - name: db
    engine: PG
    version: "15"
    size: db-s-dev-database  # $7/month
```

### Upgrade Path 2: Managed PostgreSQL
- Full managed database
- Starting at $15/month
- High availability, backups, scaling

### Upgrade Path 3: Managed MongoDB
- NoSQL option
- Starting at $15/month
- Perfect for document storage

## Environment Variables

Set in DO App Platform dashboard:
```
NODE_ENV=production
PORT=8080
DATABASE_PATH=/workspace/data/tasks.db
```

## Monitoring & Logs

1. **View Logs**
   ```bash
   doctl apps logs YOUR_APP_ID --type=run
   ```

2. **Monitor Health**
   - Check endpoint: `https://your-app.ondigitalocean.app/api/health`
   - DO dashboard shows metrics

## Scaling

1. **Vertical Scaling**
   - Upgrade instance size in DO dashboard
   - Basic → Professional instances

2. **Horizontal Scaling**
   - Increase instance count
   - Load balancing automatic

3. **Database Scaling**
   - SQLite → PostgreSQL for multi-instance
   - Add read replicas for performance

## Cost Breakdown

**Minimal Setup** ($5/month):
- 1x Basic XXS instance
- SQLite database
- 1 GiB bandwidth included

**Small Team** ($12/month):
- 1x Basic XS instance ($7)
- Dev PostgreSQL database ($7)
- 2 GiB bandwidth included

**Growing Team** ($35/month):
- 2x Basic S instances ($24)
- Managed PostgreSQL ($15)
- High availability

## Troubleshooting

**App won't start?**
- Check logs: `doctl apps logs YOUR_APP_ID`
- Verify PORT environment variable
- Check build logs in DO dashboard

**Database not persisting?**
- Ensure `/workspace/data/` directory exists
- Check file permissions
- Consider upgrading to managed DB

**CORS errors?**
- Update CORS settings in server.js
- Add your domain to allowed origins

## Next Steps

1. **Add authentication** (Auth0, Firebase Auth)
2. **Set up CI/CD** with GitHub Actions
3. **Add monitoring** (Datadog, New Relic)
4. **Configure backups** for SQLite file
5. **Add SSL certificate** (automatic with DO)

## Support

- [Digital Ocean Documentation](https://docs.digitalocean.com/products/app-platform/)
- [Community Forum](https://www.digitalocean.com/community)
- [Support Ticket](https://cloud.digitalocean.com/support)

---

**Pro Tip**: Start with SQLite for MVP, upgrade to managed database when you hit 50+ daily users or need multi-device sync.