# Railway Environment Variables Setup

## Essential Variables for Railway Deployment

Set these environment variables in Railway's dashboard under your service Variables tab:

### Required Variables
```
DATABASE_URL=postgresql://postgres:hXtqctJOiUofFjeCdncyRVqjrdSNuGNB@trolley.proxy.rlwy.net:38780/railway
SECRET_KEY=your-production-secret-key-here-generate-a-secure-one
ENVIRONMENT=production
```

### Optional Variables (with defaults)
```
ALLOWED_ORIGINS=https://task-module.up.railway.app,https://radiant-amazement-production-d68f.up.railway.app
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=false
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
LOG_LEVEL=INFO
RATE_LIMIT_PER_MINUTE=60
```

## How to Set Variables in Railway

1. Go to your Railway project dashboard
2. Select your backend service
3. Go to "Variables" tab
4. Add each variable name and value
5. Deploy your service

## Important Security Notes

1. **SECRET_KEY**: Generate a secure random string for production
2. **DATABASE_URL**: Railway provides this automatically, or use the proxy URL provided
3. **ENVIRONMENT**: Must be set to "production" for Railway deployment
4. **ALLOWED_ORIGINS**: Update with your actual frontend domains

## Verification

After deployment, check the logs to ensure:
- ✅ Database connection successful
- ✅ Environment set to "production"
- ✅ Secret key is not the default value
- ✅ CORS origins are correct
