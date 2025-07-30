# PythonAnywhere Deployment Guide

## PythonAnywhere Free Plan Details

**Free Account Benefits:**
- 1 web application
- 512 MB disk space
- 100 seconds CPU per day
- MySQL database (1 database)
- Custom domain support (yourusername.pythonanywhere.com)
- HTTPS included
- No credit card required

**Limitations:**
- CPU seconds limited (100/day)
- No FFmpeg (audio conversion नहीं होगा)
- Outbound internet restrictions
- No background tasks
- File upload limit

## Deployment Steps:

### 1. Account Setup
1. PythonAnywhere.com पर जाएं
2. Free account बनाएं
3. Dashboard में login करें

### 2. File Upload
**Option A: Git Clone**
```bash
cd /home/yourusername
git clone https://github.com/your-repo/media-downloader.git
cd media-downloader
```

**Option B: Manual Upload**
- Files tab में जाकर manually upload करें
- Zip file upload कर सकते हैं

### 3. Virtual Environment Setup
```bash
cd /home/yourusername/media-downloader
python3.11 -m venv venv
source venv/bin/activate
pip install flask flask-sqlalchemy gunicorn yt-dlp
```

### 4. Database Setup
- MySQL database create करें
- Database settings note करें:
  - Database name: yourusername$default
  - Username: yourusername
  - Password: (जो आपने set किया)
  - Host: yourusername.mysql.pythonanywhere-services.com

### 5. WSGI Configuration
Web tab में जाकर:
- Python version: 3.11
- Source code path: /home/yourusername/media-downloader
- Virtual environment: /home/yourusername/media-downloader/venv

WSGI file edit करें:
```python
import sys
import os

path = '/home/yourusername/media-downloader'
if path not in sys.path:
    sys.path.insert(0, path)

os.environ['DATABASE_URL'] = 'mysql://username:password@host/dbname'
os.environ['SESSION_SECRET'] = 'your-secret-key'

from main import app as application
```

### 6. Static Files Setup
- Static files URL: /static/
- Static files directory: /home/yourusername/media-downloader/static/

## Important Notes:

**⚠️ Major Limitations:**
1. **No FFmpeg** - MP3 conversion नहीं होगा
2. **CPU Limits** - Heavy downloads fail हो सकते हैं
3. **Outbound restrictions** - कुछ sites block हो सकती हैं
4. **File size limits** - Large downloads नहीं हो सकते

**Database Configuration:**
```python
# app.py में MySQL के लिए
SQLALCHEMY_DATABASE_URI = 'mysql://username:password@host/dbname'
```

## Alternative: PythonAnywhere Paid Plans

**Hacker Plan ($5/month):**
- 1GB storage
- More CPU seconds
- Background tasks
- Better for media downloader

**Web Developer Plan ($12/month):**
- 10GB storage
- Unlimited CPU
- Multiple web apps
- SSH access

## Recommendation:

**PythonAnywhere Free की problems:**
- FFmpeg नहीं है (MP3 conversion fail)
- CPU limits (downloads slow/fail)
- File size restrictions

**Better Free Alternatives:**
1. **Render.com** - FFmpeg support, better for media
2. **Railway.app** - $5 credit monthly
3. **Fly.io** - Better resource limits

## Conclusion:

PythonAnywhere free plan आपके media downloader के लिए suitable नहीं है क्योंकि:
- Audio conversion नहीं होगा
- Large file downloads fail होंगे
- CPU limits की वजह से performance issues

**Render.com use करना बेहतर होगा** आपके project के लिए।