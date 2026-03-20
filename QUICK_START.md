# Quick Start Guide - Auth System

Get the authentication system up and running in 5 minutes.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Gmail account (for OTP email sending)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Email (Gmail)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows Computer"
5. Copy the 16-character password (without spaces)

## Step 3: Update .env File

The `.env` file has been created with Firebase credentials. Now add your email:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
```

Replace:
- `your_email@gmail.com` with your Gmail address
- `your_app_password_here` with the 16-character password from Step 2

## Step 4: Run the Application

```bash
npm run dev
```

This starts both the backend (port 5001) and frontend (port 3000) simultaneously.

## Step 5: Test the Application

1. Open http://localhost:3000 in your browser
2. Click "Sign up" to create an account
3. Enter your email and password
4. Click "Forgot password?" to test OTP functionality
5. Check your email for the OTP code

## Troubleshooting

### OTP Not Sending?

1. Verify `.env` has correct email credentials
2. Check that backend is running (you should see "Email transporter ready: true" in console)
3. Check browser console for API errors
4. Verify Gmail App Password is correct (16 characters, no spaces)

### Backend Not Starting?

```bash
# Kill any process on port 5001
# Windows:
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Then try again:
npm run dev
```

### Firebase Errors?

All Firebase errors are converted to user-friendly messages. If you see technical errors, check:
- Firebase credentials in `.env` are correct
- Firestore database is enabled in Firebase Console
- Security rules allow read/write for authenticated users

## Features

✅ User signup/login with email and password
✅ Google OAuth authentication
✅ Admin dashboard with access control
✅ Collapsible sidebar navigation
✅ Password reset with OTP verification
✅ User-friendly error messages
✅ Professional UI with animations

## Next Steps

- Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed configuration
- Read [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- Check [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) before going to production
