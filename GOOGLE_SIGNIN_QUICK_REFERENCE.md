# Google Sign-In Quick Reference

## 🚀 Quick Start (5 minutes)

### 1. Get Firebase Credentials
- Go to [Firebase Console](https://console.firebase.google.com)
- Project Settings → General tab
- Copy all values to `.env`

### 2. Get Google OAuth Credentials
- Go to [Google Cloud Console](https://console.cloud.google.com)
- APIs & Services → Credentials
- Create OAuth 2.0 Client ID (Web application)
- Add redirect URIs: `http://localhost:3000`, `http://localhost:3000/login`, `http://localhost:3000/signup`
- Copy Client ID to `.env`

### 3. Enable Google Sign-In
- Firebase Console → Authentication → Sign-in method
- Enable Google
- Save

### 4. Update .env
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_FIRESTORE_DATABASE_ID=your_database_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 5. Run the App
```bash
npm run dev
```

## 📋 Features

✅ **Google Sign-In** - One-click authentication  
✅ **Email/Password** - Traditional login  
✅ **Auto User Creation** - New users stored in Firestore  
✅ **Role Assignment** - Admin/User roles  
✅ **Role-Based Routing** - Automatic dashboard selection  
✅ **Session Persistence** - Stay logged in on refresh  
✅ **Error Handling** - User-friendly error messages  

## 🔑 Key Components

### GoogleSignInButton
```typescript
import GoogleSignInButton from './components/GoogleSignInButton';

<GoogleSignInButton />
```

### Firebase Configuration
```typescript
import { auth, db } from './firebase';
```

### Auth Context
```typescript
const { user, isAdmin, role, loading } = useAuth();
```

## 🔄 User Flow

```
Login Page
    ↓
[Google Sign-In] or [Email/Password]
    ↓
Firebase Authentication
    ↓
Create/Update Firestore User
    ↓
Assign Role (Admin/User)
    ↓
Redirect to Dashboard
```

## 📊 User Data in Firestore

```javascript
{
  uid: "firebase_uid",
  name: "User Name",
  email: "user@example.com",
  photoURL: "https://...",
  role: "User" | "Admin",
  provider: "google" | "email",
  createdAt: Timestamp,
  lastLogin: Timestamp
}
```

## 🛡️ Admin Detection

Users are marked as Admin if:
1. Firestore `role` = "Admin", OR
2. Email = "ahanish@karunya.edu.in"

## 🚫 Error Messages

| Scenario | Message |
|----------|---------|
| Popup blocked | "Popup was blocked. Please allow popups and try again." |
| User cancelled | "Sign-in cancelled. Please try again." |
| Network error | "Network error. Please check your connection." |
| Invalid credentials | "Invalid email or password. Please try again." |
| Email in use | "Email already in use. Please use a different email." |

## 🧪 Testing Checklist

- [ ] Google Sign-In works
- [ ] New user created in Firestore
- [ ] User redirected to dashboard
- [ ] Email/password login works
- [ ] Admin user redirected to admin dashboard
- [ ] Regular user cannot access admin dashboard
- [ ] Session persists on page refresh
- [ ] Logout clears session

## 📁 Files

| File | Purpose |
|------|---------|
| `src/firebase.ts` | Firebase initialization |
| `src/components/GoogleSignInButton.tsx` | Google Sign-In button |
| `src/components/AuthForm.tsx` | Login/signup form |
| `src/App.tsx` | Auth provider & routing |
| `.env` | Environment variables |

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com)
- [Google Cloud Console](https://console.cloud.google.com)
- [Firebase Docs](https://firebase.google.com/docs)
- [Google Sign-In Docs](https://developers.google.com/identity/protocols/oauth2)

## ⚡ Common Issues

**Google Sign-In not working?**
- Check `.env` has correct credentials
- Verify redirect URIs in Google Cloud Console
- Check browser console for errors

**User not created in Firestore?**
- Check Firestore rules allow write
- Verify Firestore database exists
- Check browser console for errors

**Admin access not working?**
- Check user `role` in Firestore
- Verify email matches admin email
- Clear browser cache

## 💡 Tips

- Use `npm run dev` to run frontend + backend together
- Check browser console for detailed error messages
- Use Firebase Console to verify user creation
- Test with different email addresses
- Use incognito mode to test fresh login

## 🎯 Next Steps

1. ✅ Configure Firebase
2. ✅ Get Google OAuth credentials
3. ✅ Update `.env` file
4. ✅ Run `npm run dev`
5. ✅ Test Google Sign-In
6. ✅ Test email/password login
7. ✅ Test role-based access
8. ✅ Deploy to production
