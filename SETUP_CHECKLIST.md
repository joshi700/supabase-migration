# Setup Checklist

## ☑️ Pre-requisites
- [ ] Node.js 18+ installed
- [ ] Xcode 15+ installed (for iOS)
- [ ] Supabase account created

## ☑️ Day 1: Supabase Setup (2-3 hours)
- [ ] Create Supabase project
- [ ] Run SQL schema from docs/Step1_Supabase_Setup.md
- [ ] Verify tables created (users, leads)
- [ ] Enable Realtime on leads table
- [ ] Save API keys securely

## ☑️ Day 2: Backend Setup (4-6 hours)
- [ ] Install dependencies: `cd backend && npm install`
- [ ] Copy .env.example to .env
- [ ] Add Supabase credentials to .env
- [ ] Run migration (optional): `npm run migrate`
- [ ] Start backend: `npm start`
- [ ] Test login: `curl -X POST http://localhost:3001/api/auth/login ...`
- [ ] Verify Supabase connection in console

## ☑️ Day 2: Frontend Setup (30 minutes)
- [ ] Install dependencies: `cd frontend && npm install`
- [ ] Start frontend: `npm start`
- [ ] Login as admin (admin@realestate.com / AdminPass123!)
- [ ] Upload Excel test file
- [ ] Verify leads appear

## ☑️ Day 3: iOS Setup (4-6 hours)
- [ ] Open RealEstateBroker.xcodeproj
- [ ] Add Supabase Swift package
- [ ] Update Configuration.swift with credentials
- [ ] Find your computer's IP address
- [ ] Update apiBaseURL with IP
- [ ] Build project (Cmd+B)
- [ ] Fix any build errors
- [ ] Run on simulator (Cmd+R)
- [ ] Login as broker (broker@example.com / BrokerPass123!)

## ☑️ Testing Real-time (30 minutes)
- [ ] iOS app running and logged in
- [ ] Web browser open on admin portal
- [ ] Upload Excel file with new leads
- [ ] Verify leads appear in iOS app within 2 seconds
- [ ] Check Xcode console for real-time logs
- [ ] Update a lead status in web
- [ ] Verify status updates in iOS app

## ☑️ Production Deployment (when ready)
- [ ] Deploy backend to Heroku/Railway/Render
- [ ] Update iOS Configuration with production URL
- [ ] Generate app icons
- [ ] Create App Store screenshots
- [ ] Submit to TestFlight
- [ ] Gather beta tester feedback

## 🎉 Success Criteria
- ✅ Backend running without errors
- ✅ Supabase connected successfully
- ✅ Admin can upload leads
- ✅ Broker can view leads
- ✅ Real-time updates work instantly
- ✅ All CRUD operations functional

## 📞 Getting Help

If stuck:
1. Check individual README files in each directory
2. Review error messages in console/Xcode
3. Verify all credentials are correct
4. Ensure ports 3000 and 3001 are not blocked
5. Confirm backend is running when testing iOS

---

**Estimated Total Time**: 10-15 hours of focused work
**Result**: Production-ready app with real-time capabilities
