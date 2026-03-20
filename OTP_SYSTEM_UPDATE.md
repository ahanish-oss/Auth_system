# OTP System Update - Complete Integration

## Overview
The OTP-based password reset system has been fully integrated with the backend email service. The frontend now communicates with the backend API endpoints instead of storing OTP in Firestore.

## Changes Made

### 1. Backend (server.js) - Already Implemented
- **In-Memory OTP Storage**: OTPs are stored in a Map with 10-minute expiration
- **Automatic Cleanup**: Expired OTPs are automatically removed every 5 minutes
- **Email Integration**: Uses Nodemailer with Gmail SMTP to send OTP emails
- **Three API Endpoints**:
  - `POST /api/auth/forgot-password` - Generate OTP and send email
  - `POST /api/auth/verify-otp` - Verify OTP code
  - `POST /api/auth/clear-otp` - Clear OTP after successful reset

### 2. Frontend (src/components/ForgotPassword.tsx) - Updated
- **Removed Firestore OTP Storage**: No longer stores OTP in Firestore
- **API Integration**: Now calls backend endpoints for all OTP operations
- **Three-Step Flow**:
  1. **Email Step**: User enters email → Backend generates OTP and sends email
  2. **OTP Verification Step**: User enters 6-digit OTP → Backend verifies
  3. **Password Reset Step**: User sets new password → Firebase updates password

## How It Works

### Step 1: User Requests Password Reset
```
User enters email → Frontend calls /api/auth/forgot-password
Backend generates 6-digit OTP → Stores in memory with 10-min expiry
Backend sends OTP via Gmail SMTP → User receives email
```

### Step 2: User Verifies OTP
```
User enters 6-digit OTP → Frontend calls /api/auth/verify-otp
Backend checks OTP against stored value → Verifies expiration
Returns success if valid → Frontend moves to password reset step
```

### Step 3: User Resets Password
```
User enters new password → Frontend calls Firebase updatePassword()
Password is updated in Firebase → Frontend calls /api/auth/clear-otp
OTP is cleared from backend memory → User redirected to login
```

## Configuration Required

### 1. Gmail App Password (.env)
```
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
```

**To get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Windows Computer"
5. Copy the 16-character password (without spaces)

### 2. Firebase Configuration (.env)
Already configured with your Firebase project credentials.

### 3. API URL (.env)
```
VITE_API_URL=http://localhost:5001/api
PORT=5001
```

## Running the System

### Start Both Frontend and Backend
```bash
npm run dev
```
This runs:
- Backend on http://localhost:5001
- Frontend on http://localhost:3000

### Start Only Backend
```bash
npm run server
```

### Start Only Frontend
```bash
npm run frontend
```

## Testing the OTP System

1. **Start the application**: `npm run dev`
2. **Go to forgot password**: Click "Forgot password?" on login page
3. **Enter email**: Use any email address (doesn't need to exist in Firebase)
4. **Check email**: OTP will be sent to the email address
5. **Enter OTP**: Copy the 6-digit code from email
6. **Set new password**: Enter new password (min 6 characters)
7. **Success**: Password is reset and you're redirected to login

## Error Handling

The system handles these scenarios:
- **Invalid email format**: Shows error message
- **OTP not found**: Shows "OTP expired or not found"
- **OTP expired**: Shows "OTP has expired"
- **Invalid OTP**: Shows "Invalid OTP"
- **Password mismatch**: Shows "Passwords do not match"
- **Backend not running**: Shows "Failed to send OTP. Please ensure the backend server is running."

## Security Features

1. **In-Memory Storage**: OTPs are not persisted to database
2. **Automatic Expiration**: OTPs expire after 10 minutes
3. **Automatic Cleanup**: Expired OTPs are removed from memory
4. **Email Verification**: OTP is sent via email, not displayed in UI
5. **Firebase Integration**: Password is updated through Firebase Auth
6. **Environment Variables**: Credentials are never hardcoded

## Troubleshooting

### OTP Not Sending
1. Check `.env` file has correct EMAIL_USER and EMAIL_PASSWORD
2. Verify Gmail App Password is correct (not main password)
3. Check backend is running: `npm run server`
4. Check backend logs for email errors

### OTP Verification Failing
1. Ensure OTP is exactly 6 digits
2. Check OTP hasn't expired (10-minute limit)
3. Verify backend is running

### Password Reset Not Working
1. Ensure you're logged in to Firebase (for updatePassword)
2. Check password meets minimum 6 characters
3. Verify passwords match

## Files Modified
- `src/components/ForgotPassword.tsx` - Updated to use backend API endpoints
- `server.js` - Already configured with OTP system
- `.env` - Contains email and API configuration
