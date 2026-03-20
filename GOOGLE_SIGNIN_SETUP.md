# Google Sign-In System Setup Guide

## Overview
This guide explains how to set up and use the fully functional Google Sign-In system with Firebase Authentication, role-based access control, and Firestore user management.

## Architecture

### Components
1. **Firebase Configuration** (`src/firebase.ts`)
   - Initializes Firebase using environment variables
   - Exports `auth` and `db` for use throughout the app

2. **Google Sign-In Button** (`src/components/GoogleSignInButton.tsx`)
   - Reusable component for Google authentication
   - Handles user creation/update in Firestore
   - Manages role assignment and redirection

3. **Auth Form** (`src/components/AuthForm.tsx`)
   - Email/password login and signup
   - Integrates Google Sign-In button
   - Stores user data in Firestore

4. **Auth Provider** (`src/App.tsx`)
   - Manages authentication state globally
   - Handles role-based routing
   - Prevents flickering with loading state

## Setup Instructions

### Step 1: Firebase Configuration

#### 1.1 Get Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click "Project Settings" (gear icon)
4. Go to "General" tab
5. Scroll down to "Your apps" section
6. Click on your web app
7. Copy the configuration values

#### 1.2 Update .env File
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_FIRESTORE_DATABASE_ID=your_database_id
```

### Step 2: Enable Google Sign-In in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to "Authentication" → "Sign-in method"
4. Click "Google"
5. Enable it and save

### Step 3: Get Google OAuth Credentials

#### 3.1 Create OAuth 2.0 Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:3000/login`
   - `http://localhost:3000/signup`
   - Your production domain

#### 3.2 Copy Client ID
1. Copy the Client ID from the credentials
2. Add to `.env`:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Step 4: Set Up Firestore

#### 4.1 Create Users Collection
1. Go to Firebase Console
2. Go to "Firestore Database"
3. Create a collection named `users`

#### 4.2 Set Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Admin can read all users
    match /users/{userId} {
      allow read: if request.auth.token.admin == true;
    }
  }
}
```

## How It Works

### Google Sign-In Flow

```
User clicks "Continue with Google"
    ↓
Google popup opens
    ↓
User authenticates with Google
    ↓
Firebase receives credentials
    ↓
Check if user exists in Firestore
    ├─ If NEW user:
    │  ├─ Create user document
    │  ├─ Assign role (Admin if designated email, else User)
    │  └─ Store metadata (name, email, photoURL, provider)
    │
    └─ If EXISTING user:
       └─ Update lastLogin timestamp
    ↓
Store user data in localStorage
    ↓
Redirect based on role
    ├─ Admin → /admin-dashboard
    └─ User → /dashboard
```

### Email/Password Login Flow

```
User enters email and password
    ↓
Firebase authenticates credentials
    ↓
Check if user exists in Firestore
    ├─ If EXISTS:
    │  └─ Update lastLogin timestamp
    │
    └─ If NOT EXISTS:
       ├─ Create user document
       ├─ Assign role (Admin if designated email, else User)
       └─ Store metadata
    ↓
Store user data in localStorage
    ↓
Redirect based on role
```

### Role-Based Redirection

The system automatically redirects users based on their role:

- **Admin Users** → `/admin-dashboard`
- **Regular Users** → `/dashboard`

Admin status is determined by:
1. Firestore `role` field = "Admin"
2. Email matches designated admin email (ahanish@karunya.edu.in)

### Session Management

The `onAuthStateChanged` listener in `App.tsx`:
- Monitors authentication state changes
- Fetches user role from Firestore
- Updates global auth context
- Prevents page flickering with loading state
- Automatically redirects on login/logout

## User Data Structure

### Firestore User Document
```javascript
{
  uid: "firebase_uid",
  name: "User Name",
  email: "user@example.com",
  photoURL: "https://...", // Only for Google Sign-In
  role: "User" | "Admin",
  provider: "google" | "email",
  createdAt: Timestamp,
  lastLogin: Timestamp,
  status: "Active" // Optional
}
```

## Error Handling

### Google Sign-In Errors

| Error | Message | Solution |
|-------|---------|----------|
| `popup_blocked` | Popup was blocked | Allow popups in browser settings |
| `popup_closed_by_user` | Sign-in cancelled | User closed the popup |
| `network_request_failed` | Network error | Check internet connection |

### Email/Password Errors

| Error Code | Message |
|-----------|---------|
| `auth/user-not-found` | User not found. Please check your email. |
| `auth/wrong-password` | Invalid password. Please try again. |
| `auth/invalid-credential` | Invalid email or password. Please try again. |
| `auth/email-already-in-use` | Email already in use. Please use a different email. |
| `auth/weak-password` | Password is too weak. Please use a stronger password. |
| `auth/too-many-requests` | Too many login attempts. Please try again later. |

## Security Features

### 1. Environment Variables
- All sensitive credentials stored in `.env`
- Never committed to version control
- Vite automatically injects at build time

### 2. Firebase Security Rules
- Users can only access their own data
- Admins can view all users
- Firestore enforces access control

### 3. Session Management
- Firebase Auth handles token management
- Automatic token refresh
- Secure logout clears session

### 4. Role-Based Access Control
- Routes protected by role checks
- Admin pages require admin role
- Unauthorized access shows error message

## Testing

### Test Google Sign-In
1. Start the app: `npm run dev`
2. Go to http://localhost:3000/login
3. Click "Continue with Google"
4. Sign in with your Google account
5. Should redirect to dashboard

### Test Email/Password Login
1. Go to http://localhost:3000/signup
2. Create account with email and password
3. Should redirect to dashboard
4. Go to http://localhost:3000/login
5. Sign in with same credentials

### Test Admin Access
1. Sign in with admin email (ahanish@karunya.edu.in)
2. Should redirect to /admin-dashboard
3. Try accessing /admin-dashboard as regular user
4. Should see "Access Denied" message

### Test Session Persistence
1. Sign in to the app
2. Refresh the page
3. Should remain logged in
4. Check browser console for auth state

## Troubleshooting

### Google Sign-In Not Working

**Problem**: Popup doesn't open or shows error
- Check if Google OAuth credentials are correct in `.env`
- Verify redirect URIs are added in Google Cloud Console
- Check browser console for specific error message
- Ensure Google Sign-In is enabled in Firebase

**Problem**: User not created in Firestore
- Check Firestore rules allow write access
- Verify Firestore database is initialized
- Check browser console for Firestore errors

### Email/Password Login Not Working

**Problem**: "Invalid email or password" error
- Verify email and password are correct
- Check if account exists in Firebase Auth
- Try resetting password via forgot-password page

**Problem**: User not created in Firestore
- Same as Google Sign-In troubleshooting
- Check if user document was created in Firebase Auth

### Role-Based Redirection Not Working

**Problem**: Admin user redirected to /dashboard
- Check Firestore user document has `role: "Admin"`
- Verify email matches designated admin email
- Check browser console for role fetch errors

**Problem**: Regular user can access /admin-dashboard
- Verify route protection in App.tsx
- Check user role in Firestore
- Clear browser cache and localStorage

## API Reference

### GoogleSignInButton Component

```typescript
interface GoogleSignInButtonProps {
  onSuccess?: () => void;        // Called on successful login
  onError?: (error: Error) => void; // Called on error
  className?: string;             // Additional CSS classes
  showLabel?: boolean;             // Show/hide button label
}
```

### Usage Example

```typescript
import GoogleSignInButton from './components/GoogleSignInButton';

export default function LoginPage() {
  return (
    <GoogleSignInButton
      onSuccess={() => console.log('Logged in!')}
      onError={(error) => console.error(error)}
    />
  );
}
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `my-project` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123:web:abc...` |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | Firestore Database ID | `(default)` or custom ID |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123.apps.googleusercontent.com` |

## Files Modified/Created

- ✅ `src/firebase.ts` - Updated to use environment variables
- ✅ `src/components/GoogleSignInButton.tsx` - New reusable component
- ✅ `src/components/AuthForm.tsx` - Updated to use GoogleSignInButton
- ✅ `src/App.tsx` - Already has role-based routing
- ✅ `.env` - Contains all credentials
- ✅ `.env.example` - Template for environment variables

## Next Steps

1. Configure Firebase project with your credentials
2. Enable Google Sign-In in Firebase
3. Create OAuth 2.0 credentials in Google Cloud Console
4. Update `.env` with all required values
5. Test Google Sign-In flow
6. Test email/password authentication
7. Test role-based access control
8. Deploy to production

## Support

For issues or questions:
1. Check browser console for error messages
2. Review Firestore rules and data
3. Verify all environment variables are set
4. Check Firebase Console for authentication logs
5. Review Google Cloud Console for OAuth issues
