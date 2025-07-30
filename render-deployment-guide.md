# 🚀 Render.com Deployment Guide for Media Tab 4K

## Complete Step-by-Step Deployment

### Prerequisites
- GitHub account with your Media Tab 4K repository
- Render.com account (free signup)

## Step 1: Prepare Repository Files

Make sure your GitHub repository contains these files:

### requirements.txt
Create this file in your repository root:
```
Flask==3.0.0
Flask-SQLAlchemy==3.1.1
gunicorn==23.0.0
yt-dlp==2024.7.25
psycopg2-binary==2.9.9
SQLAlchemy==2.0.25
email-validator==2.1.0
```

### render.yaml (Optional - for auto-deployment)
```yaml
services:
  - type: web
    name: media-tab-4k
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "gunicorn --bind 0.0.0.0:$PORT main:app"
    plan: free
    envVars:
      - key: SESSION_SECRET
        generateValue: true
```

## Step 2: Create Render Account

1. Visit [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with GitHub account
4. Authorize Render to access your repositories

## Step 3: Create Web Service

1. **Dashboard** → Click **"New +"** → **"Web Service"**
2. **Connect Repository**: Select `Media-tab` repository
3. **Configure Service**:

### Basic Configuration
| Setting | Value |
|---------|-------|
| **Name** | `media-tab-4k` |
| **Environment** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn --bind 0.0.0.0:$PORT main:app` |
| **Plan** | `Free` |

### Advanced Settings
- **Auto-Deploy**: `Yes`
- **Branch**: `main` (or your default branch)

## Step 4: Environment Variables

Add these environment variables in Render:

1. Go to **Environment** tab in your service
2. Add the following:

| Key | Value | Notes |
|-----|-------|-------|
| `SESSION_SECRET` | `your-random-secret-key-123` | Use any random string |
| `PYTHON_VERSION` | `3.11.0` | Specify Python version |

**Generate SESSION_SECRET:**
You can use this random string or generate your own:
```
media-tab-4k-secret-key-2024-render-deployment-xyz789
```

## Step 5: Database Setup (Optional)

For production use, add PostgreSQL database:

1. **Dashboard** → **"New +"** → **"PostgreSQL"**
2. **Database Name**: `media-tab-db`
3. **Plan**: `Free`
4. **Create Database**

After creation:
1. Copy **Internal Database URL**
2. Add to your web service environment variables:
   - **Key**: `DATABASE_URL`
   - **Value**: [Paste the Internal Database URL]

## Step 6: Deploy

1. Click **"Create Web Service"**
2. Wait for build and deployment (5-10 minutes)
3. Monitor logs for any errors
4. Your app will be live at: `https://your-service-name.onrender.com`

## Step 7: Verify Deployment

1. Visit your live URL
2. Test the interface:
   - Paste a YouTube URL
   - Click "Analyze URL"
   - Verify video information loads
   - Test download functionality

## 🎯 Expected Deployment Timeline

- **Build Time**: 3-5 minutes
- **First Deploy**: 5-10 minutes
- **Future Deploys**: 2-3 minutes (auto-deploy from GitHub)

## ✅ Features Available on Render

| Feature | Status | Notes |
|---------|--------|-------|
| **FFmpeg** | ✅ Available | Pre-installed on Render |
| **4K/8K Downloads** | ✅ Working | Full quality support |
| **MP3 Conversion** | ✅ Working | Audio downloads enabled |
| **Playlist Support** | ✅ Working | Large playlists supported |
| **Database** | ✅ PostgreSQL | Free tier included |
| **HTTPS** | ✅ Automatic | SSL certificate included |
| **Custom Domain** | ✅ Available | Upgrade to paid plan |

## 🚨 Troubleshooting

### Common Issues

**Build Fails:**
```bash
# Check requirements.txt formatting
# Ensure all dependencies are correct
```

**Database Connection Error:**
```bash
# Verify DATABASE_URL environment variable
# Check PostgreSQL service status
```

**FFmpeg Not Found:**
```bash
# Render includes FFmpeg by default
# No additional installation needed
```

**Session Secret Error:**
```bash
# Add SESSION_SECRET environment variable
# Use a random string value
```

### Build Logs

Monitor deployment in **Logs** tab:
- Green = Success
- Red = Error (check error message)
- Yellow = Warning (usually safe to ignore)

## 🔄 Auto-Deployment Setup

After initial deployment, every git push triggers auto-deployment:

1. Make changes to your code
2. Commit and push to GitHub:
```bash
git add .
git commit -m "Update feature"
git push origin main
```
3. Render automatically rebuilds and deploys
4. Live in 2-3 minutes

## 💡 Render Free Plan Limits

- **Bandwidth**: 100GB/month
- **Build Minutes**: 500 minutes/month
- **Sleep**: Services sleep after 15 minutes of inactivity
- **Wake Time**: ~30 seconds to wake up
- **Concurrent Builds**: 1

### Upgrade Benefits
- **Faster builds**
- **No sleep mode**
- **Custom domains**
- **More bandwidth**
- **Priority support**

## 🌟 Alternative Commands

If you need different commands:

### For Railway.app:
```bash
# Build: pip install -r requirements.txt
# Start: gunicorn main:app
```

### For Heroku:
```bash
# Procfile: web: gunicorn main:app
```

### For Fly.io:
```bash
# Dockerfile needed
```

## 📞 Support

If deployment fails:
1. Check [Render Status Page](https://status.render.com)
2. Review build logs carefully
3. Check environment variables
4. Verify requirements.txt syntax
5. Test locally first: `python main.py`

---

**Your Media Tab 4K will be live in minutes! 🎉**

Free hosting with premium features - perfect for your media downloader.