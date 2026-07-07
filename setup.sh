#!/bin/bash

# FARM Stack Marketing Analytics Dashboard - Setup Script
# Run this script to set up the complete development environment

echo "🚀 Setting up FARM Stack Digital Marketing Analytics Dashboard"
echo "=============================================================="

# Check dependencies
echo "📋 Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi

echo "✅ Prerequisites OK"

# Create project structure
echo ""
echo "📁 Creating project structure..."
mkdir -p farm-analytics/{backend,frontend,docs}
cd farm-analytics

# Backend setup
echo ""
echo "⚙️  Setting up Backend..."
cd backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Create requirements.txt
cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn==0.24.0
pymongo==4.6.0
pydantic==2.5.0
python-multipart==0.0.6
python-dotenv==1.0.0
EOF

# Copy backend code
# (Assuming farm_analytics_backend.py is in same directory)
# If running from different location, adjust path accordingly

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt -q

# Create .env file
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000
ENV=development
EOF

echo "✅ Backend setup complete"

# Frontend setup
echo ""
echo "⚙️  Setting up Frontend..."
cd ../frontend

# Create package.json
cat > package.json << EOF
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
EOF

# Create vite config
cat > vite.config.js << EOF
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: 'localhost'
  }
})
EOF

# Create src directory structure
mkdir -p src

# Create index.html
cat > index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marketing Analytics Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
</body>
</html>
EOF

# Create main.jsx
cat > src/main.jsx << EOF
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# Install npm dependencies
echo "Installing npm dependencies..."
npm install -q

echo "✅ Frontend setup complete"

# Docker setup (optional)
echo ""
echo "🐳 Creating Docker configuration (optional)..."
cd ../

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
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

volumes:
  mongodb_data:

networks:
  marketing_network:
    driver: bridge
EOF

# Create Dockerfiles
cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY farm_analytics_backend.py .
EXPOSE 8000
CMD ["uvicorn", "farm_analytics_backend:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host"]
EOF

echo "✅ Docker configuration created"

# Create README
cd ..
cat > README.md << 'EOF'
# FARM Stack Digital Marketing Analytics Dashboard

A complete learning project demonstrating Full-stack development with FastAPI, React, and MongoDB.

## Quick Start

### Option 1: Docker (Recommended)
```bash
docker-compose up --build
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Local Development

#### Start Backend
```bash
cd backend
source venv/bin/activate
python farm_analytics_backend.py
```

#### Start Frontend
```bash
cd frontend
npm run dev
```

## Project Structure
```
farm-analytics/
├── backend/
│   ├── venv/
│   ├── farm_analytics_backend.py
│   ├── requirements.txt
│   ├── .env
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Features

✅ **Digital Marketing Analyst Responsibilities:**
- Track KPIs (CTR, Conversions, ROI, CPA)
- Channel performance analysis
- Daily campaign trends
- A/B test results visualization
- Conversion funnel analysis

✅ **Technology Stack:**
- FastAPI with MongoDB
- React with Recharts
- Responsive dark-theme UI
- RESTful API design
- Docker containerization

## API Endpoints

- `GET /kpis/summary` - Overall KPI metrics
- `GET /campaigns/summary` - Channel-level performance
- `GET /campaigns/daily` - Daily campaign metrics
- `GET /ab-tests` - A/B test results
- `GET /funnel` - Conversion funnel data

## Learning Outcomes

Students will understand:
1. FastAPI backend architecture and async patterns
2. MongoDB document structure and queries
3. React state management and hooks
4. Data visualization with Recharts
5. Full-stack integration and CORS
6. Real-world analytics calculations (CTR, CPA, ROI)
7. Docker containerization for development

## Customization Ideas

- Add user authentication (JWT)
- Integrate real data sources (Google Analytics, Facebook Ads)
- Build custom metrics and KPIs
- Export reports as PDF
- Real-time updates with WebSockets
- Mobile-responsive improvements

## Troubleshooting

**MongoDB connection error?**
```bash
# Ensure MongoDB is running
mongod

# Or update MONGO_URL in backend/.env
MONGO_URL=mongodb://localhost:27017
```

**CORS errors?**
- Backend has CORS enabled for local development
- Check API is running on http://localhost:8000

**Port conflicts?**
- Change ports in docker-compose.yml or vite.config.js

## Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [React Docs](https://react.dev/)
- [Recharts Docs](https://recharts.org/)
EOF

echo ""
echo "✅ Project setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Copy farm_analytics_backend.py to backend/"
echo "2. Copy farm_analytics_frontend.jsx to frontend/src/App.jsx"
echo ""
echo "🚀 To start:"
echo "   Option A (Docker): docker-compose up --build"
echo "   Option B (Local):  cd backend && python farm_analytics_backend.py"
echo "                      cd frontend && npm run dev"
echo ""
echo "📖 Open http://localhost:3000 in your browser"
echo ""
