# Real Estate Broker - iOS App

Native SwiftUI app for brokers to track leads on the go.

## Setup Instructions

### 1. Install Supabase Swift SDK

1. Open `RealEstateBroker.xcodeproj` in Xcode
2. Go to **File** → **Add Package Dependencies**
3. Enter: `https://github.com/supabase/supabase-swift`
4. Click **Add Package**
5. Select: **Supabase**, **Realtime**, **PostgREST**, **Auth**
6. Click **Add Package**

### 2. Configure Credentials

Edit `RealEstateBroker/Utils/Configuration.swift`:

```swift
static let supabaseURL = "https://xxxxx.supabase.co" // Your Supabase URL
static let supabaseAnonKey = "eyJhbGc..." // Your anon key
static let apiBaseURL = "http://192.168.1.100:3001/api" // Your computer's IP
```

**Find your computer's IP:**
- Mac: System Settings → Network → Wi-Fi/Ethernet → IP Address
- Use this IP so simulator can reach your backend

### 3. Build and Run

1. Select iPhone Simulator (iPhone 15 Pro recommended)
2. Click Run (Cmd+R)
3. Wait for app to build and launch

### 4. Login

Use broker credentials:
- Email: broker@example.com
- Password: BrokerPass123!

## Features

✅ View assigned leads
✅ Real-time updates (no refresh needed!)
✅ Timeline tracking
✅ Search and filter
✅ Pull to refresh
✅ Secure authentication

## Real-time Testing

1. Login to iOS app
2. Open web browser: http://localhost:3000
3. Login as admin
4. Upload Excel file with leads
5. **Watch iOS app** - new leads appear automatically!

## Troubleshooting

### Cannot connect to backend
- Make sure backend is running: `cd backend && npm start`
- Use your computer's IP address, not `localhost`
- Check firewall isn't blocking port 3001

### Build failed
- Clean build folder: Product → Clean Build Folder (Cmd+Shift+K)
- Rebuild: Product → Build (Cmd+B)

### Real-time not working
- Check Xcode console for subscription logs
- Verify Supabase Realtime is enabled in dashboard
- Make sure credentials are correct

## Requirements

- Xcode 15.0+
- iOS 17.0+
- Swift 5.9+

## Tech Stack

- SwiftUI
- Supabase Swift SDK
- Combine
- Keychain (secure storage)
