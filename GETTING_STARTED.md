# Getting Started with Auth System

Welcome to the Auth System! This guide will help you get up and running in minutes.

## What is Auth System?

A complete, production-ready authentication system featuring:
- User signup/login with email and password
- Google OAuth authentication
- Admin dashboard with role-based access control
- Password reset with OTP email verification
- Collapsible sidebar navigation
- Professional UI with animations

## Prerequisites

- Node.js v16+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)
- Gmail account (for OTP emails)

## Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Email

To enable OTP email sending:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows Computer"
5. Copy the 16-character password

### 3. Update .env File

Open `.env` and update these lines:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
```

### 4. Run the Application

```bash
npm run dev
```

This starts:
- Backend server on http://localhost:5001
- Frontend on http://localhost:3000

### 5. Test It Out

1. Open http://localhost:3000
2. Click "Sign up" to create an account
3. Enter your email and password
4. Click "Create an account"
5. You're in! 🎉

## Features Overview

### Authentication
- **Email/Password**: Traditional signup and login
- **Google OAuth**: One-click Google sign-in
- **Password Reset**: OTP-based password recovery

### User Dashboard
- Personal command center
- Quick action cards
- Security stats
- Activity history
- Collapsible sidebar

### Admin Dashboard
- Admin-only access
- User management
- System audit logs
- Admin controls

### Security
- Firebase authentication
- Firestore database
- Role-based access control
- OTP verification
- Professional error messages

## Project Structure

```
src/
├── components/          # React components
│   ├── AuthForm.tsx     # Login/signup form
│   ├── ForgotPassword.tsx # Password reset
│   ├── UserDashboard.tsx # User dashboard
│   └── AdminDashboard.tsx # Admin dashboard
├── App.tsx              # Routing and auth
├── firebase.ts          # Firebase config
└── main.tsx             # Entry point

server.js               # Backend server
.env                    # Environment variables
package.json            # Dependencies
```

## Available Commands

```bash
# Run both backend and frontend
npm run dev

# Run backend only
npm run server

# Run frontend only
npm run frontend

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run lint
```

## Testing the Features

### Test User Signup
1. Go to http://localhost:3000
2. Click "Sign up"
3. Enter email and password
4. Click "Create an account"

### Test User Login
1. Go to http://localhost:3000/login
2. Enter your email and password
3. Click "Sign in"

### Test Password Reset
1. Go to http://localhost:3000/login
2. Click "Forgot password?"
3. Enter your email
4. Check your email for OTP
5. Enter OTP and set new password

### Test Admin Access
1. Sign up with: `ahanish@karunya.edu.in`
2. You'll see the admin dashboard
3. Try accessing `/admin-dashboard` with a regular user
4. You'll see "Access Denied" message

### Test Google OAuth
1. Click "Continue with Google"
2. Sign in with your Google account
3. You'll be logged in automatically

## Troubleshooting

### OTP Not Sending?
- Check `.env` has correct email and app password
- Verify backend is running (check terminal)
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Port Already in Use?
```bash
# Windows - Kill process on port 5001
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

### Firebase Errors?
- Verify Firebase credentials in `.env`
- Check Firestore database is enabled
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## Documentation

- **[QUICK_START.md](QUICK_START.md)** - Quick reference guide
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[EMAIL_SETUP.md](EMAIL_SETUP.md)** - Email configuration guide
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Production deployment
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Project overview

## Environment Variables

The `.env` file contains all configuration:

```env
# Firebase (pre-filled)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
# ... more Firebase vars

# Google OAuth (optional)
VITE_GOOGLE_CLIENT_ID=your_client_id

# Email (required for OTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# API
VITE_API_URL=http://localhost:5001/api
PORT=5001
```

## Key Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Firebase** - Authentication & database
- **Express.js** - Backend server
- **Nodemailer** - Email sending
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Motion** - Animations

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Configure email in `.env`
3. ✅ Run the app: `npm run dev`
4. ✅ Test all features
5. 📖 Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed configuration
6. 🚀 See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for production

## Common Tasks

### Change Admin Email
Edit `src/App.tsx` and update:
```typescript
const isDesignatedAdmin = u.email?.toLowerCase() === 'your_email@gmail.com';
```

### Customize Colors
Edit `src/index.css` and update Tailwind colors.

### Add New Features
1. Create component in `src/components/`
2. Add route in `src/App.tsx`
3. Update navigation in sidebar

### Deploy to Production
See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

## Support

If you encounter issues:

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Check browser console (F12) for errors
3. Check terminal for server errors
4. Verify `.env` configuration
5. Try restarting: `npm run dev`

## What's Included

✅ Complete authentication system
✅ User and admin dashboards
✅ Password reset with OTP
✅ Google OAuth integration
✅ Role-based access control
✅ Professional UI with animations
✅ Comprehensive documentation
✅ Error handling and validation
✅ Responsive design
✅ Production-ready code

## Ready to Go!

You now have a complete, production-ready authentication system. Start building amazing features on top of it!

```bash
npm run dev
```

Visit http://localhost:3000 and start exploring! 🚀

---

**Need help?** Check the documentation files or see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
