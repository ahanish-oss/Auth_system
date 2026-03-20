# Authentication System with Firebase & OTP

A complete authentication system built with React, Firebase, and Node.js featuring user signup/login, admin dashboard, and email-based password reset with OTP.

## 🚀 Quick Start

**New to this project?** Start here: [QUICK_START.md](QUICK_START.md) (5 minutes)

**Need detailed setup?** See: [SETUP_GUIDE.md](SETUP_GUIDE.md)

## ✨ Features

- ✅ User Authentication (Email/Password)
- ✅ Google Sign-In
- ✅ Email OTP Verification
- ✅ Password Reset
- ✅ Admin Dashboard
- ✅ User Management
- ✅ Role-Based Access Control
- ✅ Collapsible Sidebar
- ✅ Professional UI with Tailwind CSS
- ✅ Real-time Database (Firestore)

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Gmail account (for email OTP)

## 🔧 Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update:

```env
# Firebase (Already configured)
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=your_project_id

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Google OAuth (Optional)
VITE_GOOGLE_CLIENT_ID=your_client_id
```

**Get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Windows Computer"
5. Copy the 16-character password

### 3. Start Backend Server
```bash
npm run server
```

### 4. Start Frontend (in new terminal)
```bash
npm run dev
```

### 5. Open in Browser
```
http://localhost:3000
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [QUICK_START.md](QUICK_START.md) | 5-minute setup guide |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Comprehensive setup instructions |
| [EMAIL_SETUP.md](EMAIL_SETUP.md) | Email configuration guide |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Feature overview |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Pre-deployment checklist |

## 🧪 Testing

### Sign Up
1. Click "Create an account"
2. Enter email and password
3. Account created successfully

### Login
1. Enter credentials
2. Redirected to dashboard

### Password Reset
1. Click "Forgot password?"
2. Enter email
3. Check email for OTP
4. Enter OTP and set new password

### Admin Access
1. Login as admin: `ahanish@karunya.edu.in`
2. Access admin dashboard
3. Try accessing with regular user → Access Denied

## 🏗️ Project Structure

```
project/
├── .env                    # Environment variables
├── server.js              # Backend server
├── src/
│   ├── App.tsx            # Main app
│   ├── firebase.ts        # Firebase config
│   └── components/
│       ├── AuthForm.tsx
│       ├── ForgotPassword.tsx
│       ├── UserDashboard.tsx
│       └── AdminDashboard.tsx
└── package.json
```

## 🔐 Security Features

- Firebase Authentication
- OTP Verification (10-minute expiry)
- Role-Based Access Control
- User Status Management
- Secure Password Reset
- Environment Variables for Credentials

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, React Router
- **Backend**: Express.js, Node.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth, Google OAuth
- **Email**: Nodemailer
- **UI**: Lucide React, Framer Motion

## 📱 Features in Detail

### Authentication
- Email/Password signup and login
- Google Sign-In integration
- Email verification
- Password reset with OTP
- Session management

### User Dashboard
- Profile information
- Security settings
- Activity tracking
- Quick actions
- Collapsible sidebar

### Admin Dashboard
- User management
- Role assignment
- User status control
- System statistics
- Audit logs

## 🚨 Troubleshooting

### OTP Not Sending?
1. Check backend is running: `npm run server`
2. Verify EMAIL_USER and EMAIL_PASSWORD in `.env`
3. Check browser console (F12) for errors

### Port Already in Use?
Change PORT in `.env` to a different number

### Firebase Errors?
Check that Firestore is enabled in Firebase Console

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for more troubleshooting

## 📦 Available Scripts

```bash
npm run dev          # Start frontend
npm run server       # Start backend
npm run dev:all      # Start both (requires concurrently)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check TypeScript
```

## 🌐 Deployment

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for:
- Pre-deployment verification
- Deployment steps
- Hosting options
- Post-deployment monitoring

## 📞 Support

For issues:
1. Check the relevant documentation file
2. Review browser console (F12)
3. Check server terminal logs
4. Verify `.env` configuration

## 📄 License

This project is licensed under the Apache License 2.0

## 🎉 Getting Started

1. Read [QUICK_START.md](QUICK_START.md)
2. Follow the 5-minute setup
3. Test all features
4. Deploy to production

Happy coding! 🚀
