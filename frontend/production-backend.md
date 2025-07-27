# Restaurant Management System - Production Backend
# Node.js + Express + PostgreSQL + File Storage

## Project Structure
```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Authentication, validation, etc.
│   ├── models/          # Database models
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── config/          # Database, environment config
├── uploads/             # File storage
├── migrations/          # Database migrations
├── seeds/               # Sample data
├── tests/               # Unit and integration tests
└── docker/              # Docker configuration
```

## Features
- **Role-based Authentication** (Admin, Manager, Staff)
- **Offline-first Frontend** with sync capabilities
- **File Upload** (Images/Videos) with cloud storage
- **Real-time Updates** via WebSockets
- **Database Integration** with PostgreSQL
- **Production Deployment** ready
- **API Documentation** with Swagger
- **Logging & Monitoring**
- **Rate Limiting & Security**
