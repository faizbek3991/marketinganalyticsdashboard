## Backend Requirements

File: `backend/requirements.txt`

```
fastapi==0.104.1
uvicorn==0.24.0
pymongo==4.6.0
pydantic==2.5.0
python-multipart==0.0.6
python-dotenv==1.0.0
```

---

## Architecture Overview

### Database Schema (MongoDB)

**Collections:**

1. **campaigns**
```javascript
{
  "_id": ObjectId,
  "campaign_id": "email_0",
  "campaign_name": "Email Q1 Promo",
  "channel": "email",
  "impressions": 10000,
  "clicks": 300,
  "conversions": 15,
  "spend": 150.00,
  "revenue": 2250.00,
  "date": "2024-01-01",
  "ctr": 3.0,
  "conversion_rate": 5.0,
  "cpa": 10.00,
  "roi": 1400.0,
  "created_at": ISODate()
}
```

2. **ab_tests**
```javascript
{
  "_id": ObjectId,
  "test_id": "test_001",
  "campaign_id": "email_15",
  "variant_a": "Subject: 50% Off Today",
  "variant_b": "Subject: Exclusive Offer Inside",
  "metric": "ctr",
  "variant_a_value": 3.2,
  "variant_b_value": 4.8,
  "winner": "B",
  "confidence": 95.0,
  "created_at": ISODate()
}
```

3. **funnel**
```javascript
{
  "_id": ObjectId,
  "stage": "Landing Page",
  "users": 50000,
  "drop_off_rate": 0
}
```

---

## FastAPI Routes Reference

### GET /
- **Purpose:** Health check
- **Response:** `{"message": "Digital Marketing Analytics API"}`

### GET /kpis/summary
- **Purpose:** Overall KPI aggregation
- **Response:**
```json
{
  "total_impressions": 1234567,
  "total_clicks": 45678,
  "total_conversions": 2345,
  "total_spend": 12345.67,
  "total_revenue": 351750.00,
  "avg_ctr": 3.70,
  "avg_conversion_rate": 5.13,
  "avg_cpa": 5.26,
  "avg_roi": 2754.00
}
```

### GET /campaigns/summary
- **Purpose:** Channel-level aggregation
- **Response:** Array of channel objects with totals and averages
```json
[
  {
    "channel": "email",
    "total_impressions": 300000,
    "total_clicks": 9000,
    "total_conversions": 450,
    "total_spend": 3000.00,
    "total_revenue": 67500.00,
    "avg_ctr": 3.0,
    "avg_conversion_rate": 5.0,
    "roi": 2150.0,
    "cpa": 6.67,
    "count": 30
  }
]
```

### GET /campaigns/daily?channel=email (optional)
- **Purpose:** Daily metrics for trend analysis
- **Query Params:**
  - `channel` (optional): Filter by channel
- **Response:** Array of campaign objects sorted by date

### GET /campaigns/{campaign_id}
- **Purpose:** Single campaign details
- **Path Params:**
  - `campaign_id` (required): Campaign identifier
- **Response:** Campaign object
- **Error:** 404 if not found

### GET /ab-tests
- **Purpose:** All A/B test results
- **Response:** Array of test objects with variants and winners

### GET /funnel
- **Purpose:** Conversion funnel stages
- **Response:** Array of funnel stages with user counts

---

## Key Calculations (In Backend)

### Click-Through Rate (CTR)
```
CTR % = (clicks / impressions) * 100
```

### Conversion Rate
```
Conversion Rate % = (conversions / clicks) * 100
```

### Cost Per Acquisition (CPA)
```
CPA = spend / conversions
```

### Return on Investment (ROI)
```
ROI % = ((revenue - spend) / spend) * 100
```

---

## Data Initialization Flow

1. **Startup Event** → `@app.on_event("startup")`
   - Checks if database has data
   - If empty, calls `init_dummy_data()`

2. **init_dummy_data()**
   - Generates 30 days of campaign data
   - 4 channels × 30 days = 120 campaign records
   - Creates 3 A/B tests
   - Creates 5 funnel stages

3. **Dummy Data Logic**
   - Impressions: 10,000 + (day × 500)
   - Clicks: impressions × random rate (3-4%)
   - Conversions: clicks × random rate (5-7%)
   - Spend: clicks × $0.50
   - Revenue: conversions × $150

---

## Frontend API Integration

React component uses:
```javascript
const API_BASE = 'http://localhost:8000';

// Example fetch pattern
const response = await fetch(`${API_BASE}/kpis/summary`);
const data = await response.json();
```

---

## CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

⚠️ **Security Note:** 
- Use `["http://localhost:3000"]` for local development
- Use specific domain URLs for production
- Never use `["*"]` with `allow_credentials=True` in production

---

## Environment Variables

Create `.env` file:
```
MONGO_URL=mongodb://localhost:27017
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000
ENV=development
```

Load in FastAPI:
```python
from dotenv import load_dotenv
load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
```

---

## Common Tasks

### Add New Campaign Metric
1. Add field to `CampaignMetrics` Pydantic model
2. Update `init_dummy_data()` to generate the field
3. Update `/campaigns/summary` aggregation logic
4. Update React component to display the metric

### Add New Dashboard Chart
1. Add API endpoint to fetch relevant data
2. Create new section in React component
3. Use Recharts to visualize
4. Add to tab navigation if needed

### Modify Dummy Data
Edit `init_dummy_data()`:
```python
campaigns.append({
    "campaign_name": campaign_names[channel][i % len(campaign_names[channel])],
    "impressions": 10000 + (i * 500),  # Modify growth rate
    # ... other fields
})
```

---

## Useful MongoDB Queries (for debugging)

```javascript
// Check all campaigns
db.campaigns.find({}).limit(5);

// Find by channel
db.campaigns.find({ channel: "email" });

// Aggregate by channel
db.campaigns.aggregate([
  { $group: {
      _id: "$channel",
      total_conversions: { $sum: "$conversions" },
      avg_roi: { $avg: "$roi" }
    }
  }
]);

// Delete all and reinitialize
db.campaigns.deleteMany({});
```

---

## Testing Tips

### Frontend Testing
1. Open browser DevTools (F12)
2. Check Network tab for API calls
3. Verify JSON responses
4. Check for CORS errors

### Backend Testing
```bash
# Test API endpoint
curl http://localhost:8000/kpis/summary

# Check FastAPI docs
open http://localhost:8000/docs

# Test with Python
python -c "
import requests
response = requests.get('http://localhost:8000/kpis/summary')
print(response.json())
"
```

### Database Testing
```bash
# Connect to MongoDB
mongosh

# List databases
show databases

# Use marketing_analytics
use marketing_analytics

# Check collections
show collections

# Count documents
db.campaigns.countDocuments()
```

---

## Performance Considerations

1. **Indexes** → Add MongoDB indexes for frequently queried fields:
```javascript
db.campaigns.createIndex({ channel: 1 });
db.campaigns.createIndex({ date: 1 });
```

2. **Caching** → Add Redis for frequently accessed KPIs
3. **Pagination** → Add limit/skip for large datasets
4. **Aggregation** → Use MongoDB aggregation pipeline for complex queries

---

## Extension Ideas for Students

1. **Authentication** → Add JWT and user roles
2. **Real Data** → Connect to Google Analytics, Facebook Ads API
3. **Alerts** → Email notifications for low-performing campaigns
4. **Forecasting** → ML model for predicting next month's performance
5. **Customization** → Let users create custom metrics
6. **Mobile App** → React Native version
7. **Reporting** → Generate PDF reports
8. **Webhooks** → Send data to external services
