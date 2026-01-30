# Real Estate Broking App - Supabase Migration

Complete real estate lead management system with real-time updates.

## 📦 What's Included

- **backend/** - Node.js/Express API with Supabase
- **frontend/** - React admin portal
- **ios-app/** - Native iPhone app with real-time sync
- **docs/** - Complete migration guides

## 🚀 Quick Start

### 1. Setup Supabase (10 minutes)

1. Go to https://supabase.com and create account
2. Create new project
3. Run SQL from `docs/Step1_Supabase_Setup.md`
4. Save your API keys

### 2. Setup Backend (5 minutes)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm start
```

### 3. Setup Frontend (5 minutes)

```bash
cd frontend
npm install
npm start
```

### 4. Setup iOS App (10 minutes)

1. Open `ios-app/RealEstateBroker.xcodeproj`
2. Add Supabase Swift package
3. Update Configuration.swift
4. Build and run

## ✨ Features

### Real-time Updates
- Admin uploads leads → Brokers see them instantly
- No manual refresh needed
- WebSocket-based synchronization

### Admin Portal (Web)
- Excel file upload
- User management
- Dashboard analytics
- All leads visibility

### Broker App (iOS)
- View assigned leads
- Track timeline milestones
- Search and filter
- Real-time notifications

## 📊 Architecture

```
Excel Upload → Backend API → Supabase PostgreSQL
                                    ↓
                            Real-time Broadcast
                                    ↓
                        iOS App (instant update)
```

## 🔐 Default Credentials

**Admin:**
- Email: admin@realestate.com
- Password: AdminPass123!

**Broker:**
- Email: broker@example.com
- Password: BrokerPass123!

## 📱 Testing Real-time

1. Login to iOS app as broker
2. Open web browser as admin
3. Upload Excel file with new leads
4. **Watch iOS app update in 1-2 seconds!**

## 💰 Cost

- **Supabase Free Tier**: $0/month
  - 500MB database
  - 50K monthly active users
  - Perfect for MVP and testing
- **Upgrade when needed**: $25/month (Pro tier)

## 📚 Documentation

Detailed guides in `/docs/`:
- Step 1: Supabase Setup
- Step 2: Backend Migration
- Step 3: iOS Integration
- Migration Script Usage

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Supabase
- **Frontend**: React.js
- **iOS**: SwiftUI, Supabase Swift SDK
- **Database**: PostgreSQL (via Supabase)
- **Real-time**: Supabase Realtime (WebSockets)

## ⚡ Key Improvements

✅ Real-time synchronization (was: manual refresh)
✅ PostgreSQL reliability (was: JSON files)
✅ Automatic backups (was: none)
✅ Row-level security (was: basic JWT)
✅ Scalable to millions (was: limited by files)
✅ Production-ready (was: prototype)

## 🔧 Environment Setup

**Backend (.env)**:
```
SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key
JWT_SECRET=random-secret
```

**iOS (Configuration.swift)**:
```swift
supabaseURL = "your-url"
supabaseAnonKey = "your-anon-key"
apiBaseURL = "http://your-ip:3001/api"
```

## 📞 Support

Refer to individual README files in each directory for specific setup instructions.

## 🎯 Next Steps

1. Complete Supabase setup
2. Migrate existing data (optional)
3. Test locally
4. Deploy backend to production
5. Submit iOS app to TestFlight

---

**Estimated Setup Time**: 30 minutes for complete setup
**Cost**: $0 (free tier sufficient for 100+ brokers)
**Production Ready**: Yes ✅
