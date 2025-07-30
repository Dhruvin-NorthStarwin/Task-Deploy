# Google Cloud Storage Integration for Task Module

This document explains how to integrate Google Cloud Storage with your Task Module for scalable file storage.

## 🎯 Overview

The Task Module now supports both local file storage and Google Cloud Storage (GCS). This allows you to:

- **Scale Better**: No storage limits unlike local file systems
- **Improve Performance**: CDN-backed global file access
- **Increase Reliability**: Google's redundant storage infrastructure
- **Deploy Anywhere**: Files persist independently of server instances

## 📋 Prerequisites

1. **Google Cloud Project**: You need access to project `swift-terminal-462018-q7`
2. **Service Account**: Create a service account with Storage permissions
3. **Bucket**: A GCS bucket for storing files

## 🔧 Setup Instructions

### Step 1: Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `swift-terminal-462018-q7`
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click **Create Service Account**
5. Fill details:
   - **Name**: `task-module-storage`
   - **Description**: `Service account for task module file storage`
6. Click **Create and Continue**
7. Add roles:
   - `Storage Admin`
   - `Storage Object Admin`
8. Click **Continue** and **Done**
9. Click on the created service account
10. Go to **Keys** tab
11. Click **Add Key** > **Create new key**
12. Select **JSON** format and download

### Step 2: Local Development Setup

1. Save the downloaded JSON file as `service-account-key.json` in the `backend/` directory
2. Run the setup helper:
   ```bash
   cd backend
   python gcs_setup_guide.py
   ```
3. Copy `.env.template` to `.env` and update with your values:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
   GCS_BUCKET_NAME=swift-terminal-462018-q7-task-storage
   USE_CLOUD_STORAGE=true
   GCS_BASE_URL=https://storage.googleapis.com
   ```
4. Test the setup:
   ```bash
   python gcs_setup_guide.py test
   ```

### Step 3: Railway Deployment Setup

1. Encode your service account for Railway:
   ```bash
   python railway_gcs_helper.py encode
   ```
2. Copy the base64 string and add these environment variables to Railway:
   ```
   GOOGLE_APPLICATION_CREDENTIALS_BASE64=<your-base64-string>
   GCS_BUCKET_NAME=swift-terminal-462018-q7-task-storage
   USE_CLOUD_STORAGE=true
   GCS_BASE_URL=https://storage.googleapis.com
   ```
3. Redeploy your application

## 🚀 Features

### Automatic Fallback
- If GCS fails, files are stored locally
- No service interruption during cloud issues
- Graceful degradation

### File Migration
- Migrate existing local files to cloud storage
- Admin endpoint: `POST /api/admin/storage/migrate`
- Selective migration by task ID

### Storage Status
- Check current storage configuration
- Admin endpoint: `GET /api/admin/storage/status`
- Test storage connectivity

### Image Optimization
- Automatic image resizing (max 1920x1080)
- JPEG optimization with 85% quality
- Bandwidth savings

## 📁 File Organization

```
GCS Bucket Structure:
├── task_completions/
│   ├── task_1/
│   │   ├── image1.jpg
│   │   └── video1.mp4
│   ├── task_2/
│   │   └── image2.png
│   └── ...
```

## 🔐 Security

### Permissions Required
- `storage.buckets.get`
- `storage.objects.create`
- `storage.objects.delete`
- `storage.objects.get`
- `storage.objects.list`

### File Access
- Files are publicly accessible via GCS URLs
- Consider implementing signed URLs for sensitive content
- Current setup optimized for restaurant task images/videos

## 🛠 API Changes

### Upload Response Format
```json
{
  "filename": "uuid-generated-name.jpg",
  "original_filename": "user-uploaded-name.jpg",
  "file_path": "task_completions/123/uuid-generated-name.jpg",
  "file_url": "https://storage.googleapis.com/bucket-name/task_completions/123/uuid-generated-name.jpg",
  "file_size": 1048576,
  "mime_type": "image/jpeg",
  "file_type": "image",
  "storage_type": "gcs"
}
```

### New Admin Endpoints
- `GET /api/admin/storage/status` - Check storage status
- `POST /api/admin/storage/migrate` - Migrate files to cloud
- `POST /api/admin/storage/test` - Test storage connection

## 🔄 Migration Guide

### From Local to Cloud Storage

1. **Enable Cloud Storage**:
   ```env
   USE_CLOUD_STORAGE=true
   ```

2. **Migrate Existing Files**:
   ```bash
   curl -X POST "https://your-api.railway.app/api/admin/storage/migrate" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Verify Migration**:
   ```bash
   curl "https://your-api.railway.app/api/admin/storage/status" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Rollback to Local Storage
1. Set `USE_CLOUD_STORAGE=false`
2. Restart application
3. Files will be stored locally again

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid credentials" Error**
   - Verify service account JSON is valid
   - Check file path in `GOOGLE_APPLICATION_CREDENTIALS`
   - Ensure service account has correct permissions

2. **"Bucket not found" Error**
   - Create bucket manually in GCS Console
   - Verify bucket name in environment variables
   - Check bucket permissions

3. **Railway Deployment Issues**
   - Verify base64 encoding is correct
   - Check Railway environment variables
   - Review deployment logs for GCS errors

### Debug Commands

```bash
# Check credentials file
python gcs_setup_guide.py check

# Test GCS connection
python gcs_setup_guide.py test

# Verify Railway setup
python railway_gcs_helper.py encode
```

## 📊 Monitoring

### File Storage Metrics
- Monitor bucket usage in GCS Console
- Track upload success/failure rates
- Review storage costs

### Performance Monitoring
- CDN cache hit rates
- File upload/download speeds
- Error rates by storage type

## 💰 Cost Optimization

### Storage Classes
- **Standard**: Frequently accessed files
- **Nearline**: Monthly access (30+ days)
- **Coldline**: Quarterly access (90+ days)
- **Archive**: Annual access (365+ days)

### Recommendations
- Use Standard for active task files
- Consider lifecycle policies for old tasks
- Monitor bandwidth usage

## 🔄 Future Enhancements

### Planned Features
- [ ] Signed URLs for private files
- [ ] Automatic image format conversion (WebP)
- [ ] Video transcoding integration
- [ ] CDN integration for faster delivery
- [ ] Backup to multiple regions

### Configuration Options
- [ ] Custom storage classes per file type
- [ ] Automatic cleanup of old files
- [ ] File versioning support
- [ ] Compression before upload

## 📚 Resources

- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Python Client Library](https://cloud.google.com/storage/docs/reference/libraries#python)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [FastAPI File Uploads](https://fastapi.tiangolo.com/tutorial/request-files/)

---

**Need Help?** Run `python gcs_setup_guide.py` for interactive setup assistance.
