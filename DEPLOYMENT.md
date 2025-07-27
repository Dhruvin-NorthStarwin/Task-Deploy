# Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Restaurant Task Management Module to production.

## Prerequisites

### System Requirements
- Docker and Docker Compose
- At least 2GB RAM
- 10GB free disk space
- Domain name (for HTTPS)
- SSL certificate (recommended)

### Environment Setup
1. Copy environment files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Update production values in `backend/.env`:
```bash
SECRET_KEY=your-super-secret-production-key-32-chars-min
DATABASE_URL=postgresql://user:password@localhost/restaurant_tasks
ALLOWED_ORIGINS=https://yourdomain.com
ENVIRONMENT=production
DEBUG=false
```

3. Update production values in `frontend/.env`:
```bash
REACT_APP_API_BASE_URL=https://api.yourdomain.com/api
REACT_APP_DEBUG=false
```

## Deployment Options

### Option 1: Docker Compose (Recommended)

1. **Build and start services:**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

2. **Verify deployment:**
```bash
# Check backend health
curl http://localhost:8000/api/health

# Check frontend
curl http://localhost/health
```

3. **View logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Option 2: Kubernetes

1. **Create namespace:**
```bash
kubectl create namespace restaurant-tasks
```

2. **Deploy secrets:**
```bash
kubectl create secret generic app-secrets \
  --from-literal=SECRET_KEY="your-secret-key" \
  --from-literal=DATABASE_URL="your-db-url" \
  -n restaurant-tasks
```

3. **Apply manifests:**
```bash
kubectl apply -f k8s/ -n restaurant-tasks
```

### Option 3: Cloud Platforms

#### AWS ECS
- Use the provided Dockerfiles
- Configure ALB for load balancing
- Use RDS for PostgreSQL database
- Use S3 for file uploads (optional)

#### Google Cloud Run
- Build and push images to GCR
- Deploy with Cloud Run
- Use Cloud SQL for database
- Use Cloud Storage for files

#### Azure Container Instances
- Use Azure Container Registry
- Deploy with Container Instances
- Use Azure Database for PostgreSQL
- Use Azure Blob Storage for files

## Database Setup

### PostgreSQL (Recommended for Production)

1. **Install PostgreSQL:**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql postgresql-server
```

2. **Create database and user:**
```sql
CREATE DATABASE restaurant_tasks;
CREATE USER restaurant_admin WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE restaurant_tasks TO restaurant_admin;
```

3. **Update connection string:**
```bash
DATABASE_URL=postgresql://restaurant_admin:secure_password@localhost:5432/restaurant_tasks
```

### SQLite (Development Only)
For small deployments, SQLite can be used but is not recommended for production.

## Security Checklist

### Application Security
- [ ] Change default SECRET_KEY
- [ ] Use strong passwords for database
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Use non-root user in containers
- [ ] Enable security headers

### Infrastructure Security
- [ ] Use firewall to restrict access
- [ ] Enable fail2ban for SSH protection
- [ ] Keep system packages updated
- [ ] Use separate network for containers
- [ ] Enable container security scanning
- [ ] Set up backup strategy

## Monitoring and Logging

### Health Checks
The application provides health check endpoints:
- Backend: `GET /api/health`
- Frontend: `GET /health`
- Metrics: `GET /api/metrics`

### Logging Configuration
Set appropriate log levels:
```bash
# Production
LOG_LEVEL=INFO

# Debug (temporary troubleshooting)
LOG_LEVEL=DEBUG
```

### Monitoring Setup
Recommended monitoring stack:
- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **AlertManager** - Alerting
- **Loki** - Log aggregation

## Backup Strategy

### Database Backup
```bash
# PostgreSQL backup
pg_dump -h localhost -U restaurant_admin restaurant_tasks > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DB_NAME="restaurant_tasks"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -h localhost -U restaurant_admin $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
```

### File Backup
```bash
# Backup uploaded files
rsync -av /path/to/uploads/ /backup/uploads/

# Or using Docker volumes
docker run --rm -v backend_uploads:/source alpine tar -czf /backup/uploads_$(date +%Y%m%d).tar.gz -C /source .
```

## Performance Optimization

### Backend Optimization
- Use multiple workers: `--workers 4`
- Enable gzip compression
- Use connection pooling for database
- Implement caching (Redis)
- Optimize database queries

### Frontend Optimization
- Enable Nginx gzip compression
- Set proper cache headers
- Use CDN for static assets
- Enable HTTP/2
- Optimize images

### Database Optimization
- Add proper indexes
- Configure connection pooling
- Regular VACUUM (PostgreSQL)
- Monitor slow queries

## Troubleshooting

### Common Issues

#### Backend not starting
```bash
# Check logs
docker-compose logs backend

# Common fixes
- Verify DATABASE_URL format
- Check SECRET_KEY is set
- Ensure database is accessible
- Verify file permissions
```

#### Frontend 502 errors
```bash
# Check if backend is healthy
curl http://backend:8000/api/health

# Check nginx configuration
docker-compose exec frontend nginx -t

# Restart services
docker-compose restart frontend backend
```

#### Database connection errors
```bash
# Test database connection
docker-compose exec backend python -c "
from app.database import engine
try:
    engine.connect()
    print('Database connection successful')
except Exception as e:
    print(f'Database error: {e}')
"
```

### Log Analysis
```bash
# Follow logs in real-time
docker-compose logs -f

# Search for errors
docker-compose logs | grep -i error

# Check specific timeframe
docker-compose logs --since 1h
```

## Scaling

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy, AWS ALB)
- Run multiple backend instances
- Use shared database
- Use shared file storage (S3, NFS)

### Vertical Scaling
- Increase container resources
- Optimize database configuration
- Use faster storage (SSD)
- Add more CPU/RAM

## Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Review security logs weekly
- [ ] Check disk space daily
- [ ] Test backups monthly
- [ ] Update SSL certificates annually

### Update Procedure
1. Test updates in staging environment
2. Create backup before updating
3. Update one service at a time
4. Verify health checks pass
5. Monitor for issues

## Support

For production support:
- Check application logs first
- Review this deployment guide
- Check GitHub issues
- Contact system administrator

## Recovery Procedures

### Database Recovery
```bash
# Restore from backup
gunzip < backup_20240127.sql.gz | psql -h localhost -U restaurant_admin restaurant_tasks
```

### Application Recovery
```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Rebuild if needed
docker-compose -f docker-compose.prod.yml up -d --build
```
