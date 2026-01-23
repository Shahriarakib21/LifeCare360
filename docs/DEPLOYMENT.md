# HealthLife Deployment Guide

## Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB 6.0+
- PostgreSQL 14+
- AWS Account (for S3)
- Firebase Account (for notifications)

## Environment Setup

### 1. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run build
npm start
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run build
npm start
```

### 3. AI Engine Setup

```bash
cd ai-engine
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Database Setup

### MongoDB

```bash
# Start MongoDB
mongod

# Create database
mongo
use healthlife
```

### PostgreSQL

```bash
# Create database
createdb healthlife

# Run migrations (if using Sequelize migrations)
cd backend
npx sequelize-cli db:migrate
```

## AWS S3 Configuration

1. Create S3 bucket: `healthlife-storage`
2. Configure CORS:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```
3. Set up IAM user with S3 access
4. Add credentials to backend `.env`

## Firebase Setup

1. Create Firebase project
2. Enable Cloud Messaging
3. Add web app configuration
4. Add credentials to frontend `.env`

## Docker Deployment (Optional)

### Dockerfile for Backend

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5000
  
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/healthlife
      - POSTGRES_HOST=postgres
    depends_on:
      - mongo
      - postgres
  
  ai-engine:
    build: ./ai-engine
    ports:
      - "8000:8000"
    depends_on:
      - backend
  
  mongo:
    image: mongo:6
    volumes:
      - mongo-data:/data/db
  
  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=healthlife
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  mongo-data:
  postgres-data:
```

## Production Deployment

### AWS EC2

1. Launch EC2 instance
2. Install Node.js, Python, MongoDB, PostgreSQL
3. Clone repository
4. Set up environment variables
5. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start backend/src/server.ts
pm2 start ai-engine/app.py --interpreter python3
```

### Security Checklist

- [ ] Use HTTPS (SSL/TLS certificates)
- [ ] Enable CORS only for trusted domains
- [ ] Use strong JWT secrets
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Encrypt sensitive data
- [ ] Regular security updates
- [ ] Enable MFA for admin accounts
- [ ] Set up monitoring and logging
- [ ] Regular backups

## Monitoring

### Health Checks

- Frontend: `http://localhost:3000/health`
- Backend: `http://localhost:5000/health`
- AI Engine: `http://localhost:8000/health`

### Logging

Logs are stored in:
- Backend: `backend/logs/`
- AI Engine: Console output

## Backup Strategy

1. **MongoDB Backup**
```bash
mongodump --db healthlife --out /backup/mongodb
```

2. **PostgreSQL Backup**
```bash
pg_dump healthlife > /backup/postgres/healthlife.sql
```

3. **S3 Backup**
- Enable versioning
- Set up lifecycle policies
- Regular cross-region replication

## Scaling

### Horizontal Scaling

- Use load balancer (AWS ALB, Nginx)
- Multiple backend instances
- Database replication (MongoDB replica set, PostgreSQL streaming replication)

### Vertical Scaling

- Increase instance sizes
- Optimize database queries
- Use caching (Redis)

## Performance Optimization

1. Enable database indexing
2. Use CDN for static assets
3. Implement caching layer
4. Optimize API queries
5. Use connection pooling
6. Enable compression

