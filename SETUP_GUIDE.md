## Digital Marketing Analytics Dashboard - FARM Stack Setup Guide

### Stack Components
- **FastAPI** (Backend) - Python web framework
- **React** (Frontend) - UI framework with Recharts for visualizations
- **MongoDB** (Database) - NoSQL document database
- **Docker** (Containerization) - Local development environment

---

## Quick Start (Docker)

### Prerequisites
- Docker & Docker Compose installed
- Port 3000 (React), 8000 (FastAPI), 27017 (MongoDB) available

### 1. Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:latest
    container_name: marketing_mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
    volumes:
      - mongodb_data:/data/db
    networks:
      - marketing_network

  # FastAPI Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: marketing_backend
    ports:
      - "8000:8000"
    environment:
      MONGO_URL: "mongodb://admin:password123@mongodb:27017"
    depends_on:
      - mongodb
    networks:
      - marketing_network
    command: uvicorn farm_analytics_backend:app --host 0.0.0.0 --port 8000 --reload

  # React Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: marketing_frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - marketing_network
    environment:
      REACT_APP_API_URL: http://localhost:8000

volumes:
  mongodb_data:

networks:
  marketing_network:
    driver: bridge
```

### 2. Create Backend Dockerfile

**File: `backend/Dockerfile`**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY farm_analytics_backend.py .

EXPOSE 8000

CMD ["uvicorn", "farm_analytics_backend:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3. Create Backend Requirements

**File: `backend/requirements.txt`**

```
fastapi==0.104.1
uvicorn==0.24.0
pymongo==4.6.0
pydantic==2.5.0
python-multipart==0.0.6
```

### 4. Create Frontend Dockerfile

**File: `frontend/Dockerfile`**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Create React app with Vite (faster)
RUN npm create vite@latest . -- --template react

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host"]
```

### 5. Create Frontend package.json

**File: `frontend/package.json`**

```json
{
  "name": "marketing-dashboard",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

### 6. Create Frontend App

**File: `frontend/src/App.jsx`**
Copy the entire React component from `farm_analytics_frontend.jsx`

### 7. Run with Docker Compose

```bash
# From project root directory
docker-compose up --build

# Access dashboard
Frontend:  http://localhost:3000
API:       http://localhost:8000
API Docs:  http://localhost:8000/docs
```

---

## Local Setup (Without Docker)

### Backend Setup

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install fastapi uvicorn pymongo pydantic

# 3. Start MongoDB (local or use MongoDB Atlas)
# For local: mongod

# 4. Run FastAPI server
python farm_analytics_backend.py
# Server runs at http://localhost:8000
```

### Frontend Setup

```bash
# 1. Install Node.js dependencies
npm install

# 2. Create React app
npx create-vite marketing-dashboard --template react
cd marketing-dashboard
npm install recharts

# 3. Copy farm_analytics_frontend.jsx to src/App.jsx

# 4. Run development server
npm run dev
# Frontend runs at http://localhost:5173 (Vite) or http://localhost:3000 (Create React App)
```

---

## API Endpoints

### KPI Summary
```bash
GET /kpis/summary
# Returns: total_impressions, total_clicks, total_conversions, spend, revenue, CTR, conversion_rate, CPA, ROI
```

### Campaign Summary by Channel
```bash
GET /campaigns/summary
# Returns: aggregated metrics grouped by channel (email, social, paid_ads, organic)
```

### Daily Campaigns
```bash
GET /campaigns/daily?channel=email
# Returns: daily metrics for last 30 days, optionally filtered by channel
```

### Campaign Details
```bash
GET /campaigns/{campaign_id}
# Returns: specific campaign metrics
```

### A/B Test Results
```bash
GET /ab-tests
# Returns: all A/B test results with winners and confidence scores
```

### Conversion Funnel
```bash
GET /funnel
# Returns: funnel stages with user counts and drop-off rates
```

---

## Interactive API Testing

Visit `http://localhost:8000/docs` for Swagger UI interactive testing

---

## Key Features Covered

✅ **Core Responsibilities:**
- **Track Metrics** → KPI cards showing impressions, clicks, conversions, revenue
- **Analyze Campaigns** → Daily trend charts, channel performance comparison
- **A/B Testing** → Test results with variant comparison and winner selection
- **Report Insights** → Visualizations via Recharts (line, bar, pie charts)
- **Data Tools** → RESTful API with MongoDB persistence
- **Optimize Funnels** → Conversion funnel visualization with drop-off analysis

---

## Learning Outcomes

Students can learn:
1. **FastAPI patterns** → Route structure, models, CORS, async handlers
2. **MongoDB operations** → Collection queries, aggregation, dummy data initialization
3. **React state management** → useState, useEffect, conditional rendering
4. **Data visualization** → Recharts library usage for multiple chart types
5. **Full-stack workflow** → API integration, component lifecycle, responsive design
6. **Real analytics concepts** → CTR, conversion rates, CPA, ROI calculations

---

## Customization Ideas

1. **Add authentication** → JWT tokens in FastAPI
2. **Database seeding** → More realistic data patterns
3. **Real MongoDB Atlas** → Replace local MongoDB connection
4. **Advanced charts** → Heatmaps, scatter plots, custom metrics
5. **Export reports** → PDF generation from dashboard
6. **Real-time updates** → WebSocket integration
7. **Email integration** → Send report summaries

---

## Troubleshooting

**MongoDB Connection Error:**
```bash
# Ensure MongoDB is running
mongod  # Start MongoDB service

# Or update MONGO_URL in backend
MONGO_URL="mongodb://localhost:27017"
```

**CORS Errors:**
- Backend has CORS middleware enabled for `*` origins
- For production, update to specific domain

**Port Already in Use:**
```bash
# Change ports in docker-compose.yml or .env
# Or kill existing process on port:
lsof -i :8000  # Find process
kill -9 <PID>
```

**API Not Responding:**
```bash
# Check backend logs
curl http://localhost:8000/

# Check API docs
open http://localhost:8000/docs
```

---

## Production Deployment

**Render.com** (Recommended for learning):
```bash
# Backend: Deploy farm_analytics_backend.py to Render Web Service
# Frontend: Deploy to Render Static Site
# Database: Use MongoDB Atlas (free tier available)
```

**Docker Hub**:
```bash
docker build -t yourusername/marketing-dashboard:latest .
docker push yourusername/marketing-dashboard:latest
```

---

## Next Steps

1. Modify dummy data for your use case
2. Add authentication & user roles
3. Integrate with real data sources
4. Build custom metrics for specific businesses
5. Create mobile-responsive version
6. Add export/report functionality
