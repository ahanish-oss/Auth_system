# Email OTP Setup Guide

This guide explains how to set up the email OTP functionality for password reset.

## Prerequisites

- Node.js installed
- Gmail account (or other email service)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Email Service

#### For Gmail:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already enabled
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows Computer" (or your device)
5. Copy the generated 16-character password

#### For Other Email Services:

Update the `transporter` configuration in `server.js` with your email service details.

### 3. Create .env File

Copy `.env.example` to `.env` and fill in your credentials:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
PORT=5001
VITE_API_URL=http://localhost:5001/api
```

### 4. Run the Application

**Option 1: Run frontend and backend separately**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run dev
```

**Option 2: Run both together (requires concurrently)**

```bash
npm install -D concurrently
npm run dev:all
```

### 5. Test the Functionality

1. Go to the login page
2. Click "Forgot password?"
3. Enter your email address
4. Check your email for the OTP
5. Enter the OTP to verify
6. Set your new password

## Troubleshooting

### OTP not sending?

1. Check that `EMAIL_USER` and `EMAIL_PASSWORD` are correct in `.env`
2. Ensure the backend server is running on port 5001
3. Check browser console for API errors
4. Check server logs for email sending errors

### Gmail App Password Issues?

- Make sure 2-Step Verification is enabled
- Generate a new App Password
- Use the 16-character password without spaces

### CORS Errors?

- Ensure `VITE_API_URL` matches your backend URL
- Check that the backend server is running
- Verify CORS is enabled in `server.js`

## Email Template

The OTP email includes:
- Professional HTML template
- 6-digit OTP code
- 10-minute expiry notice
- Company branding

## Security Notes

- Never commit `.env` file to version control
- Use App Passwords instead of main account password
- OTPs expire after 10 minutes
- OTPs are stored in Firestore with encryption
