# OTP Password Reset Flow - Complete Guide

## Overview

The OTP (One-Time Password) password reset flow allows users to securely reset their password by verifying their email address with a 6-digit code.

---

## Flow Diagram

```
User → Forgot Password Page
  ↓
Enter Email Address
  ↓
Backend Generates 6-digit OTP
  ↓
OTP Stored in Firestore (10-minute expiry)
  ↓
Email Sent to User with OTP
  ↓
User Receives Email
  ↓
User Enters OTP on Verification Page
  ↓
OTP Verified Against Firestore
  ↓
User Sets New Password
  ↓
Password Updated in Firebase Auth
  ↓
User Redirected to Login
  ↓
User Logs In with New Password
```

---

## Step-by-Step Process

### Step 1: User Initiates Password Reset

**URL**: `http://localhost:3000/forgot-password`

**User Action**:
- Clicks "Forgot your password?" link on login page
- Or navigates directly to forgot password page

**Page Shows**:
- Email input field
- "Send OTP" button

---

### Step 2: User Enters Email

**User Action**:
- Enters their email address
- Clicks "Send OTP" button

**Backend Process**:
1. Generates random 6-digit OTP
2. Stores OTP in Firestore `passwordResets` collection:
   ```
   Document ID: user_email@example.com
   Fields:
   - otp: "123456"
   - email: "user_email@example.com"
   - expiresAt: 2026-03-19 14:35:00 (10 minutes from now)
   - createdAt: 2026-03-19 14:25:00
   ```
3. Sends email with OTP using Gmail SMTP

**Email Template**:
```
Subject: Password Reset OTP

Your OTP Code

You requested to reset your password. Use the OTP below to proceed:

123456

This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.
```

**User Feedback**:
- Success message: "OTP sent to user_email@example.com. Check your email!"
- Page transitions to OTP verification step

---

### Step 3: User Receives Email

**What User Sees**:
- Email in inbox (or spam folder)
- 6-digit OTP code
- Expiry warning (10 minutes)

**Important**:
- OTP expires after 10 minutes
- User must enter OTP before expiry
- If expired, user can request new OTP

---

### Step 4: User Enters OTP

**URL**: `http://localhost:3000/forgot-password` (Step 2)

**Page Shows**:
- OTP input field (6 digits only)
- "Verify OTP" button
- "Try another email" link

**User Action**:
- Enters 6-digit OTP from email
- Clicks "Verify OTP" button

**Backend Process**:
1. Retrieves OTP from Firestore using email
2. Checks if OTP exists
3. Checks if OTP is expired
4. Compares entered OTP with stored OTP
5. If valid, proceeds to password reset step

**Validation**:
- OTP must be exactly 6 digits
- OTP must match stored value
- OTP must not be expired
- Document must exist in Firestore

**Error Handling**:
- "OTP expired or not found" → User can request new OTP
- "OTP has expired" → User can request new OTP
- "Invalid OTP" → User can try again

---

### Step 5: User Sets New Password

**URL**: `http://localhost:3000/forgot-password` (Step 3)

**Page Shows**:
- New Password input field
- Confirm Password input field
- "Reset Password" button
- "Back to login" link

**User Action**:
- Enters new password (minimum 8 characters)
- Confirms password (must match)
- Clicks "Reset Password" button

**Validation**:
- Both fields must be filled
- Passwords must match
- Password must be at least 8 characters

**Backend Process**:
1. Updates password in Firebase Auth
2. Clears OTP from Firestore
3. Shows success message
4. Redirects to login page

**User Feedback**:
- Success message: "Password reset successfully! Redirecting to login..."
- Automatic redirect to login page after 1.5 seconds

---

### Step 6: User Logs In

**URL**: `http://localhost:3000/login`

**User Action**:
- Enters email address
- Enters new password
- Clicks "Sign in" button

**Backend Process**:
1. Authenticates with Firebase Auth
2. Retrieves user data from Firestore
3. Stores user data in localStorage
4. Redirects to dashboard

**User Feedback**:
- Success message: "Welcome back!"
- Redirected to user dashboard

---

## Technical Details

### OTP Generation

```javascript
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
// Returns: "123456" (6-digit string)
```

### OTP Storage (Firestore)

**Collection**: `passwordResets`
**Document ID**: `{email}`

```javascript
{
  otp: "123456",
  email: "user@example.com",
  expiresAt: Timestamp(2026-03-19 14:35:00),
  createdAt: Timestamp(2026-03-19 14:25:00)
}
```

### OTP Expiry

- OTP expires after 10 minutes
- Expiry time: `Date.now() + 10 * 60 * 1000`
- Checked on verification: `new Date() > data.expiresAt.toDate()`

### Email Sending

**Service**: Gmail SMTP
**Port**: 587
**Authentication**: App Password (not main password)

**Endpoint**: `POST /api/send-otp`

**Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "type": "password-reset"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

---

## Error Scenarios

### Scenario 1: OTP Not Sent

**Symptoms**:
- User doesn't receive email
- Error message: "Failed to send OTP"

**Causes**:
- Backend server not running
- Email credentials incorrect
- Gmail SMTP blocked
- CORS error

**Solution**:
- See TROUBLESHOOTING.md → OTP Not Sending

### Scenario 2: OTP Expired

**Symptoms**:
- User enters OTP after 10 minutes
- Error message: "OTP has expired"

**Causes**:
- User took too long to enter OTP
- System time is incorrect

**Solution**:
- User can request new OTP by going back to email entry step

### Scenario 3: Invalid OTP

**Symptoms**:
- User enters wrong OTP
- Error message: "Invalid OTP"

**Causes**:
- User entered wrong code
- User copied wrong code from email

**Solution**:
- User can try again
- User can request new OTP

### Scenario 4: Password Reset Fails

**Symptoms**:
- OTP verified but password not updated
- Error message: "Failed to reset password"

**Causes**:
- Firebase Auth error
- Firestore permission error
- Network error

**Solution**:
- Check browser console for error details
- Check server logs
- See TROUBLESHOOTING.md

---

## Security Considerations

### OTP Security
- 6-digit OTP provides ~1 million combinations
- 10-minute expiry limits brute force attacks
- OTP stored in Firestore (not in transit)
- Email verification required

### Password Security
- Minimum 8 characters required
- Passwords must match (confirmation)
- Stored securely in Firebase Auth
- Never logged or exposed

### Email Security
- Gmail App Password used (not main password)
- SMTP over TLS (port 587)
- Email credentials in `.env` (not in code)
- Professional HTML template

### Firestore Security
- Unauthenticated access allowed for password resets
- Email validation required
- OTP validation required
- Automatic expiry after 10 minutes

---

## Testing the OTP Flow

### Test Case 1: Happy Path

1. Go to forgot password page
2. Enter valid email
3. Receive OTP in email
4. Enter OTP
5. Set new password
6. Login with new password
7. ✅ Success

### Test Case 2: Expired OTP

1. Go to forgot password page
2. Enter email
3. Wait 10+ minutes
4. Enter OTP
5. ❌ See "OTP has expired" error
6. Go back and request new OTP
7. ✅ Success

### Test Case 3: Invalid OTP

1. Go to forgot password page
2. Enter email
3. Receive OTP
4. Enter wrong OTP
5. ❌ See "Invalid OTP" error
6. Enter correct OTP
7. ✅ Success

### Test Case 4: Password Mismatch

1. Go to forgot password page
2. Enter email
3. Enter OTP
4. Enter different passwords
5. ❌ See "Passwords do not match" error
6. Enter matching passwords
7. ✅ Success

### Test Case 5: Backend Not Running

1. Stop backend server
2. Go to forgot password page
3. Enter email
4. ❌ See "Failed to send OTP" error
5. Start backend server
6. Try again
7. ✅ Success

---

## Debugging

### Enable Logging

**Frontend** (Browser Console):
```javascript
// Look for these messages:
"Sending OTP to: user@example.com"
"API URL: http://localhost:5001/api"
"OTP sent successfully"
"API Error: 500"
```

**Backend** (Server Terminal):
```javascript
// Look for these messages:
"Email sending to: user@example.com"
"Email sending error: Invalid credentials"
"OTP sent successfully"
```

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Click "Send OTP"
4. Look for `/api/send-otp` request
5. Check response status (should be 200)
6. Check response body for errors

### Check Firestore

1. Go to Firebase Console
2. Go to Firestore Database
3. Check `passwordResets` collection
4. Look for document with user's email
5. Verify OTP and expiry time

---

## Troubleshooting

### OTP Not Sending
- See TROUBLESHOOTING.md → OTP Not Sending

### Email Not Received
- Check spam folder
- Verify email address is correct
- Check email credentials in `.env`
- Check backend server logs

### OTP Verification Failing
- Verify OTP is correct
- Check OTP hasn't expired
- Check Firestore has OTP document
- Check browser console for errors

### Password Reset Not Working
- Verify password meets requirements (8+ chars)
- Check passwords match
- Check Firebase Auth is working
- Check Firestore permissions

---

## Summary

The OTP password reset flow provides a secure way for users to reset their password:

1. **Email Verification**: User verifies email ownership
2. **OTP Validation**: User proves they have access to email
3. **Password Update**: User sets new password securely
4. **Login**: User logs in with new password

The entire flow is protected by:
- Email verification
- Time-limited OTP (10 minutes)
- Password confirmation
- Firebase Auth security
- Firestore security rules

For more help, see TROUBLESHOOTING.md or contact support.
