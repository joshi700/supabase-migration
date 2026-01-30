# Real Estate Broking Backend - Supabase Version

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

Then edit `.env` and add your credentials:
- Get Supabase credentials from: https://app.supabase.com → Your Project → Settings → API
- Generate a random JWT secret (or use: `openssl rand -base64 32`)

### 3. Setup Supabase Database
Follow the SQL script in `/docs/Step1_Supabase_Setup.md` to create your database schema.

### 4. Migrate Existing Data (Optional)
If you have existing JSON data:
```bash
npm run migrate
```

### 5. Start the Server
```bash
# Development
npm run dev

# Production
npm start
```

Server will run on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Leads (Admin)
- `GET /api/leads` - Get all leads
- `GET /api/leads/:id` - Get specific lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Leads (Broker)
- `GET /api/broker/leads` - Get broker's leads
- `GET /api/broker/leads/:id` - Get specific lead
- `GET /api/broker/stats` - Get statistics

### Upload (Admin)
- `POST /api/upload/excel` - Upload Excel file
- `GET /api/upload/template` - Download template

### Users (Admin)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Timeline
- `GET /api/timeline/:leadId` - Get timeline milestones

## Default Credentials

**Admin:**
- Email: admin@realestate.com
- Password: AdminPass123!

**Broker:**
- Email: broker@example.com
- Password: BrokerPass123!

## Features

✅ JWT authentication
✅ Role-based access control
✅ Real-time updates via Supabase
✅ Excel file upload
✅ Timeline tracking
✅ PostgreSQL database
✅ Row-level security

## Tech Stack

- Node.js + Express
- Supabase (PostgreSQL)
- JWT for auth
- Multer for file uploads
- XLSX for Excel parsing

## Support

For issues or questions, refer to the documentation in `/docs/`
