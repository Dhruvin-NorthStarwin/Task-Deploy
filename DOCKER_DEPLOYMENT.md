# Docker Deployment Guide

This guide explains how to deploy the Task Management System using Docker containers for both frontend and backend services.

## Quick Start

### Development Environment

1. **Clone the repository and navigate to the project directory**
   ```bash
   git clone <repository-url>
   cd task-module--master
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your preferred settings
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Production Environment

1. **Set up production environment variables**
   ```bash
   cp .env.prod .env
   # Edit .env file with secure production values
   ```

2. **Deploy with production compose file**
   ```bash
   docker-compose -f docker-compose.production.yml up -d --build
   ```

## Docker Images

### Backend (FastAPI)
- **Base Image**: `python:3.11-slim`
- **Multi-stage build** for optimized image size
- **Non-root user** for security
- **Health checks** for container monitoring
- **Volume mounts** for file uploads

### Frontend (React + Nginx)
- **Base Image**: `node:18-alpine` (build stage) + `nginx:alpine` (runtime)
- **Multi-stage build** for minimal production image
- **Optimized Nginx configuration** with caching and compression
- **Security headers** and CSP policies
- **Health checks** for monitoring

## Services Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │   PostgreSQL    │
│   (React)       │    │   (FastAPI)     │    │   (Database)    │
│   Port: 80      │◄──►│   Port: 8000    │◄──►│   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │      Redis      │
                    │   (Caching)     │
                    │   Port: 6379    │
                    └─────────────────┘
```

## Environment Variables

### Backend Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SECRET_KEY`: JWT signing key (change in production!)
- `ENVIRONMENT`: development/production
- `DEBUG`: true/false
- `ALLOWED_ORIGINS`: CORS origins
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT expiration
- `MAX_FILE_SIZE`: Maximum upload file size
- `UPLOAD_DIR`: Upload directory path

### Frontend Configuration
- `REACT_APP_API_URL`: Backend API URL
- `NODE_ENV`: development/production

### Database Configuration
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_PORT`: Database port (default: 5432)

### Redis Configuration
- `REDIS_PASSWORD`: Redis password
- `REDIS_PORT`: Redis port (default: 6379)

## Volume Management

### Named Volumes
- `postgres_data`: Database data persistence
- `redis_data`: Redis data persistence
- `backend_uploads`: File uploads storage

### Volume Commands
```bash
# List volumes
docker volume ls

# Backup database
docker exec task-postgres-prod pg_dump -U postgres restro_manage > backup.sql

# Restore database
docker exec -i task-postgres-prod psql -U postgres restro_manage < backup.sql

# Clear all volumes (WARNING: Data loss!)
docker-compose down -v
```

## Health Checks

All services include health checks:

### Backend Health Check
```bash
curl -f http://localhost:8000/api/health
```

### Frontend Health Check
```bash
curl -f http://localhost/
```

### Database Health Check
```bash
docker exec task-postgres-prod pg_isready -U postgres -d restro_manage
```

## Security Features

### Container Security
- **Non-root users** in all containers
- **Read-only filesystem** where possible
- **Resource limits** to prevent DoS
- **Security headers** in Nginx
- **Secrets management** for production

### Network Security
- **Custom bridge network** for service isolation
- **No exposed database ports** in production
- **CORS configuration** for API access
- **CSP headers** for XSS protection

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :80
   
   # Change ports in .env file
   FRONTEND_PORT=8080
   ```

2. **Database connection issues**
   ```bash
   # Check database logs
   docker logs task-postgres-prod
   
   # Test connection
   docker exec -it task-postgres-prod psql -U postgres -d restro_manage
   ```

3. **File upload issues**
   ```bash
   # Check upload directory permissions
   docker exec -it task-backend-prod ls -la /app/uploads
   
   # Fix permissions
   docker exec -it task-backend-prod chown -R appuser:appuser /app/uploads
   ```

### Useful Commands

```bash
# View container logs
docker logs task-backend-prod -f
docker logs task-frontend-prod -f

# Execute commands in containers
docker exec -it task-backend-prod bash
docker exec -it task-frontend-prod sh

# Monitor resource usage
docker stats

# Update images
docker-compose pull
docker-compose up -d --build

# Clean up unused images
docker image prune -f
```

## Performance Optimization

### Backend Optimizations
- Multi-stage Docker build reduces image size by ~60%
- Virtual environment for faster dependency installation
- Non-root user for security
- Resource limits prevent memory leaks

### Frontend Optimizations
- Multi-stage build with Alpine Linux base
- Nginx with gzip compression and caching
- Static asset optimization
- Security headers for better performance

### Database Optimizations
- Connection pooling in SQLAlchemy
- Indexes on frequently queried columns
- Health checks with proper timeouts
- Separate data volume for persistence

## Monitoring

### Container Health
```bash
# Check container status
docker ps

# Check health status
docker inspect task-backend-prod | grep Health -A 10
```

### Log Monitoring
```bash
# Centralized logging
docker logs task-backend-prod --since 1h
docker logs task-frontend-prod --since 1h
docker logs task-postgres-prod --since 1h
```

### Resource Monitoring
```bash
# Resource usage
docker stats --no-stream

# Disk usage
docker system df
```

## Production Deployment Checklist

- [ ] Change default passwords in `.env`
- [ ] Set secure `SECRET_KEY`
- [ ] Configure proper `ALLOWED_ORIGINS`
- [ ] Set up SSL certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerting
- [ ] Test disaster recovery procedures
- [ ] Configure log rotation
- [ ] Set up automated security updates
- [ ] Configure firewall rules

## Backup and Recovery

### Database Backup
```bash
# Create backup
docker exec task-postgres-prod pg_dump -U postgres restro_manage > backup_$(date +%Y%m%d_%H%M%S).sql

# Scheduled backup (add to crontab)
0 2 * * * docker exec task-postgres-prod pg_dump -U postgres restro_manage > /backups/backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```

### File Uploads Backup
```bash
# Backup uploads
docker run --rm -v backend_uploads:/source -v $(pwd)/backups:/backup alpine tar czf /backup/uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /source .
```

### Full System Backup
```bash
# Stop containers
docker-compose down

# Backup volumes
docker run --rm -v postgres_data:/source -v $(pwd)/backups:/backup alpine tar czf /backup/postgres_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /source .
docker run --rm -v backend_uploads:/source -v $(pwd)/backups:/backup alpine tar czf /backup/uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /source .

# Restart containers
docker-compose up -d
```
