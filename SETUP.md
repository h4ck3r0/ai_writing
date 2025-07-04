# AI Writing Platform - Setup Guide

## Prerequisites

1. Install required tools:
```bash
# Node.js dependencies
npm install -g typescript ts-node nodemon

# Python dependencies for T5 model
pip install torch transformers numpy scikit-learn nltk
```

2. Set up environment variables:
```bash
# Backend (.env)
GOOGLE_AI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_uri
T5_MODEL_PATH=./models/t5
THESAURUS_API_KEY=your_thesaurus_api_key
```

## Installation Steps

1. Clone and setup repository:
```bash
git clone <repo-url>
cd ai_writing_platform
npm install
```

2. Install backend dependencies:
```bash
cd backend
npm install
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

## Development Workflow

1. Start development servers:
```bash
# Start both frontend and backend
npm run dev

# Or start separately:
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start
```

2. Run tests:
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Adding New Features

### 1. Grammar Analysis

1. Install additional dependencies:
```bash
cd backend
npm install language-tool-api readability-scores
```

2. Create necessary directories:
```bash
mkdir -p backend/src/services/analysis
mkdir -p frontend/src/components/Analysis
```

3. Update API routes in `backend/src/routes/index.ts`

### 2. Style Analysis

1. Install style analysis tools:
```bash
npm install text-statistics style-analyzer
```

2. Add style metrics collection

### 3. Plot Analysis

1. Set up story analysis tools:
```bash
npm install narrative-analysis plot-structure
```

2. Configure plot detection rules

### 4. Writing Tools

1. Install creative tools:
```bash
npm install name-generator writing-prompts
```

2. Set up templates system

## Database Setup

1. Create MongoDB collections:
```javascript
// Create indexes
db.analyses.createIndex({ "documentId": 1, "type": 1 });
db.characters.createIndex({ "documentId": 1, "name": 1 });
```

2. Set up caching:
```bash
npm install redis
```

## Testing

1. Set up test environment:
```bash
# Install testing tools
npm install -D jest @testing-library/react @testing-library/jest-dom

# Run tests with coverage
npm test -- --coverage
```

2. Add test data:
```bash
# Load test data
npm run seed:test
```

## Monitoring

1. Set up monitoring:
```bash
# Install monitoring tools
npm install prometheus-client winston

# Start monitoring
npm run monitor
```

## Common Issues

1. T5 Model Setup:
```bash
# If T5 model fails to load:
python -m spacy download en_core_web_sm
pip install --upgrade transformers
```

2. API Connection Issues:
```bash
# Check API status
curl http://localhost:3001/api/health

# Test Gemini API
curl -X POST http://localhost:3001/api/ai/suggestions \
  -H "Content-Type: application/json" \
  -d '{"content":"test content"}'
```

3. Database Connection:
```bash
# Test MongoDB connection
mongo mongodb://localhost:27017/ai_writing_test
```

## Production Deployment

1. Build applications:
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

2. Configure production environment:
```bash
# Set production variables
export NODE_ENV=production
export PORT=3000
```

3. Deploy using Docker:
```bash
docker-compose up -d
```

## Performance Optimization

1. Enable caching:
```bash
# Redis cache
redis-cli config set maxmemory-policy allkeys-lru
```

2. Configure worker threads:
```bash
# PM2 configuration
pm2 start ecosystem.config.js
```

## Backup and Recovery

1. Set up backups:
```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/ai_writing"

# Restore from backup
mongorestore --uri="mongodb://localhost:27017/ai_writing" dump/
```

## Support and Maintenance

1. Log monitoring:
```bash
# View logs
tail -f logs/error.log
tail -f logs/combined.log
```

2. Performance monitoring:
```bash
# Monitor API performance
curl http://localhost:3001/metrics
```

Remember to check the documentation in `docs/` for detailed API references and component guides.