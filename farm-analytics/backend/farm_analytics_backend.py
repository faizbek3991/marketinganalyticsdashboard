from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pymongo import MongoClient
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
import os

# MongoDB Connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = MongoClient(MONGO_URL)
db = client["marketing_analytics"]

app = FastAPI(title="Digital Marketing Analytics API")

# CORS Middleware
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")
allow_origins = [o.strip() for o in ALLOWED_ORIGINS.split(",")] if ALLOWED_ORIGINS != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Auth Config ====================
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-key-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8

DEFAULT_ADMIN_USERNAME = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
DEFAULT_ADMIN_PASSWORD = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


def create_access_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    credentials_error = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise credentials_error
    except JWTError:
        raise credentials_error

    if not db["users"].find_one({"username": username}):
        raise credentials_error
    return username


def init_default_admin():
    """Seed a default admin user if none exist"""
    if db["users"].count_documents({}) > 0:
        return
    db["users"].insert_one({
        "username": DEFAULT_ADMIN_USERNAME,
        "password_hash": pwd_context.hash(DEFAULT_ADMIN_PASSWORD),
        "created_at": datetime.now()
    })

# ==================== Models ====================
class CampaignMetrics(BaseModel):
    campaign_id: str
    campaign_name: str
    channel: str  # email, social, paid_ads, organic
    impressions: int
    clicks: int
    conversions: int
    spend: float
    revenue: float
    date: str
    ctr: float  # Click-through rate
    conversion_rate: float
    cpa: float  # Cost per acquisition
    roi: float

class ABTestResult(BaseModel):
    test_id: str
    campaign_id: str
    variant_a: str
    variant_b: str
    metric: str  # CTR, conversion_rate, etc
    variant_a_value: float
    variant_b_value: float
    winner: str
    confidence: float

class FunnelStage(BaseModel):
    stage: str
    users: int
    drop_off_rate: float

# ==================== Initialize Dummy Data ====================
def init_dummy_data():
    """Initialize database with dummy marketing data"""
    
    # Check if data exists
    if db["campaigns"].count_documents({}) > 0:
        return
    
    # Dummy campaign metrics (last 30 days)
    campaigns = []
    channels = ["email", "social", "paid_ads", "organic"]
    campaign_names = {
        "email": ["Email Q1 Promo", "Welcome Series", "Re-engagement"],
        "social": ["Instagram Spring", "LinkedIn B2B", "TikTok Campaign"],
        "paid_ads": ["Google Search", "Facebook Retargeting", "LinkedIn Ads"],
        "organic": ["Blog SEO", "Content Hub", "Video Series"]
    }
    
    base_date = datetime.now() - timedelta(days=30)
    for i in range(30):
        date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        for channel in channels:
            campaign_name = campaign_names[channel][i % len(campaign_names[channel])]
            
            impressions = 10000 + (i * 500)
            clicks = int(impressions * (0.03 + (i * 0.001)))
            conversions = int(clicks * (0.05 + (i * 0.002)))
            spend = clicks * 0.5
            revenue = conversions * 150
            
            ctr = (clicks / impressions) * 100
            conversion_rate = (conversions / clicks) * 100 if clicks > 0 else 0
            cpa = spend / conversions if conversions > 0 else 0
            roi = ((revenue - spend) / spend) * 100 if spend > 0 else 0
            
            campaigns.append({
                "campaign_id": f"{channel}_{i}",
                "campaign_name": campaign_name,
                "channel": channel,
                "impressions": impressions,
                "clicks": clicks,
                "conversions": conversions,
                "spend": round(spend, 2),
                "revenue": round(revenue, 2),
                "date": date,
                "ctr": round(ctr, 2),
                "conversion_rate": round(conversion_rate, 2),
                "cpa": round(cpa, 2),
                "roi": round(roi, 2),
                "created_at": datetime.now()
            })
    
    db["campaigns"].insert_many(campaigns)
    
    # A/B Test Results
    ab_tests = [
        {
            "test_id": "test_001",
            "campaign_id": "email_15",
            "variant_a": "Subject: 50% Off Today",
            "variant_b": "Subject: Exclusive Offer Inside",
            "metric": "ctr",
            "variant_a_value": 3.2,
            "variant_b_value": 4.8,
            "winner": "B",
            "confidence": 95.0,
            "created_at": datetime.now()
        },
        {
            "test_id": "test_002",
            "campaign_id": "paid_ads_20",
            "variant_a": "Green CTA Button",
            "variant_b": "Red CTA Button",
            "metric": "conversion_rate",
            "variant_a_value": 4.2,
            "variant_b_value": 5.1,
            "winner": "B",
            "confidence": 92.0,
            "created_at": datetime.now()
        },
        {
            "test_id": "test_003",
            "campaign_id": "social_10",
            "variant_a": "Video Post",
            "variant_b": "Carousel Post",
            "metric": "ctr",
            "variant_a_value": 2.1,
            "variant_b_value": 3.5,
            "winner": "B",
            "confidence": 88.0,
            "created_at": datetime.now()
        }
    ]
    
    db["ab_tests"].insert_many(ab_tests)
    
    # Funnel Data
    funnel = [
        {"stage": "Landing Page", "users": 50000, "drop_off_rate": 0},
        {"stage": "Product View", "users": 42000, "drop_off_rate": 16.0},
        {"stage": "Add to Cart", "users": 18900, "drop_off_rate": 55.0},
        {"stage": "Checkout", "users": 8505, "drop_off_rate": 55.0},
        {"stage": "Purchase", "users": 4252, "drop_off_rate": 50.0}
    ]
    
    db["funnel"].insert_many(funnel)

# ==================== Routes ====================

@app.on_event("startup")
async def startup_event():
    """Initialize dummy data on startup"""
    init_dummy_data()
    init_default_admin()

@app.get("/")
async def root():
    return {"message": "Digital Marketing Analytics API"}

@app.post("/auth/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """Authenticate a user and return a JWT access token"""
    user = db["users"].find_one({"username": credentials.username})
    if not user or not pwd_context.verify(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    return TokenResponse(access_token=create_access_token(user["username"]))

@app.get("/auth/me")
async def get_me(current_user: str = Depends(get_current_user)):
    return {"username": current_user}

@app.post("/auth/change-password")
async def change_password(payload: ChangePasswordRequest, current_user: str = Depends(get_current_user)):
    """Change the current user's password"""
    user = db["users"].find_one({"username": current_user})
    if not user or not pwd_context.verify(payload.current_password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    db["users"].update_one(
        {"username": current_user},
        {"$set": {"password_hash": pwd_context.hash(payload.new_password)}}
    )
    return {"message": "Password updated successfully"}

@app.get("/campaigns/summary")
async def get_campaign_summary(current_user: str = Depends(get_current_user)):
    """Get aggregated campaign metrics for all channels"""
    campaigns = list(db["campaigns"].find({}, {"_id": 0}))
    
    # Group by channel
    by_channel = {}
    for campaign in campaigns:
        channel = campaign["channel"]
        if channel not in by_channel:
            by_channel[channel] = {
                "channel": channel,
                "total_impressions": 0,
                "total_clicks": 0,
                "total_conversions": 0,
                "total_spend": 0,
                "total_revenue": 0,
                "avg_ctr": 0,
                "avg_conversion_rate": 0,
                "count": 0
            }
        
        by_channel[channel]["total_impressions"] += campaign["impressions"]
        by_channel[channel]["total_clicks"] += campaign["clicks"]
        by_channel[channel]["total_conversions"] += campaign["conversions"]
        by_channel[channel]["total_spend"] += campaign["spend"]
        by_channel[channel]["total_revenue"] += campaign["revenue"]
        by_channel[channel]["avg_ctr"] += campaign["ctr"]
        by_channel[channel]["avg_conversion_rate"] += campaign["conversion_rate"]
        by_channel[channel]["count"] += 1
    
    # Calculate averages
    for channel in by_channel:
        count = by_channel[channel]["count"]
        by_channel[channel]["avg_ctr"] = round(by_channel[channel]["avg_ctr"] / count, 2)
        by_channel[channel]["avg_conversion_rate"] = round(by_channel[channel]["avg_conversion_rate"] / count, 2)
        by_channel[channel]["roi"] = round(
            ((by_channel[channel]["total_revenue"] - by_channel[channel]["total_spend"]) / 
             by_channel[channel]["total_spend"]) * 100, 2
        )
        by_channel[channel]["cpa"] = round(
            by_channel[channel]["total_spend"] / by_channel[channel]["total_conversions"], 2
        ) if by_channel[channel]["total_conversions"] > 0 else 0
    
    return list(by_channel.values())

@app.get("/campaigns/daily")
async def get_daily_campaigns(channel: Optional[str] = None, current_user: str = Depends(get_current_user)):
    """Get daily campaign metrics, optionally filtered by channel"""
    query = {} if not channel else {"channel": channel}
    campaigns = list(db["campaigns"].find(query, {"_id": 0}).sort("date", 1))
    return campaigns

@app.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str, current_user: str = Depends(get_current_user)):
    """Get specific campaign details"""
    campaign = db["campaigns"].find_one({"campaign_id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@app.get("/ab-tests")
async def get_ab_tests(current_user: str = Depends(get_current_user)):
    """Get all A/B test results"""
    tests = list(db["ab_tests"].find({}, {"_id": 0}))
    return tests

@app.get("/funnel")
async def get_funnel(current_user: str = Depends(get_current_user)):
    """Get conversion funnel data"""
    funnel = list(db["funnel"].find({}, {"_id": 0}))
    return funnel

@app.get("/kpis/summary")
async def get_kpi_summary(current_user: str = Depends(get_current_user)):
    """Get key performance indicators summary"""
    campaigns = list(db["campaigns"].find({}, {"_id": 0}))
    
    total_impressions = sum(c["impressions"] for c in campaigns)
    total_clicks = sum(c["clicks"] for c in campaigns)
    total_conversions = sum(c["conversions"] for c in campaigns)
    total_spend = sum(c["spend"] for c in campaigns)
    total_revenue = sum(c["revenue"] for c in campaigns)
    
    avg_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
    avg_conversion_rate = (total_conversions / total_clicks * 100) if total_clicks > 0 else 0
    avg_cpa = total_spend / total_conversions if total_conversions > 0 else 0
    avg_roi = ((total_revenue - total_spend) / total_spend * 100) if total_spend > 0 else 0
    
    return {
        "total_impressions": total_impressions,
        "total_clicks": total_clicks,
        "total_conversions": total_conversions,
        "total_spend": round(total_spend, 2),
        "total_revenue": round(total_revenue, 2),
        "avg_ctr": round(avg_ctr, 2),
        "avg_conversion_rate": round(avg_conversion_rate, 2),
        "avg_cpa": round(avg_cpa, 2),
        "avg_roi": round(avg_roi, 2)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
