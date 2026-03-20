# Google Sign-In System Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    App.tsx                               │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  AuthProvider                                      │  │   │
│  │  │  - onAuthStateChanged listener                     │  │   │
│  │  │  - Fetches user role from Firestore               │  │   │
│  │  │  - Manages global auth context                    │  │   │
│  │  │  - Prevents page flickering                       │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                            │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Route Protection                                  │  │   │
│  │  │  - PublicRoute (login/signup)                      │  │   │
│  │  │  - AdminRoute (/admin-dashboard)                  │  │   │
│  │  │  - UserRoute (/dashboard)                         │  │   │
│  │  │  - RootRedirect (role-based routing)              │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  AuthForm.tsx                            │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Email/Password Login                              │  │   │
│  │  │  - Form validation                                 │  │   │
│  │  │  - Firebase authentication                         │  │   │
│  │  │  - Firestore user creation                         │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                            │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  GoogleSignInButton.tsx                            │  │   │
│  │  │  - Google OAuth popup                              │  │   │
│  │  │  - User creation/update in Firestore               │  │   │
│  │  │  - Role assignment                                 │  │   │
│  │  │  - Automatic redirection                           │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Dashboards                              │   │
│  │  - UserDashboard.tsx                                     │   │
│  │  - AdminDashboard.tsx                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Services                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Firebase Authentication                                 │   │
│  │  - Email/Password authentication                         │   │
│  │  - Google OAuth 2.0                                      │   │
│  │  - Token management                                      │   │
│  │  - Session management                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Firestore Database                                      │   │
│  │  - users collection                                      │   │
│  │  - User documents with role, email, metadata            │   │
│  │  - Security rules for access control                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Google Cloud Services                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Google OAuth 2.0                                        │   │
│  │  - User authentication                                   │   │
│  │  - Credential exchange                                   │   │
│  │  - Redirect URI validation                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Google Sign-In Flow

```
User clicks "Continue with Google"
        ↓
GoogleSignInButton.tsx
        ↓
signInWithPopup(auth, provider)
        ↓
Google OAuth Popup
        ↓
User authenticates with Google
        ↓
Google returns credentials
        ↓
Firebase receives credentials
        ↓
Check Firestore for existing user
        ├─ User exists
        │  ├─ Fetch user document
        │  ├─ Update lastLogin
        │  └─ userData = existing data
        │
        └─ User doesn't exist
           ├─ Create new user document
           ├─ Assign role (Admin/User)
           ├─ Store metadata (name, email, photoURL)
           └─ userData = new data
        ↓
Store userData in localStorage
        ↓
Navigate to "/" (RootRedirect)
        ↓
RootRedirect checks role
        ├─ Admin → /admin-dashboard
        └─ User → /dashboard
```

### Email/Password Login Flow

```
User enters email & password
        ↓
AuthForm.tsx
        ↓
signInWithEmailAndPassword(auth, email, password)
        ↓
Firebase authenticates credentials
        ↓
Check Firestore for user document
        ├─ Document exists
        │  ├─ Fetch user data
        │  ├─ Update lastLogin
        │  └─ userData = existing data
        │
        └─ Document doesn't exist
           ├─ Create new user document
           ├─ Assign role (Admin/User)
           └─ userData = new data
        ↓
Store userData in localStorage
        ↓
Navigate to "/" (RootRedirect)
        ↓
RootRedirect checks role
        ├─ Admin → /admin-dashboard
        └─ User → /dashboard
```

### Session Management Flow

```
App loads
        ↓
AuthProvider mounts
        ↓
onAuthStateChanged listener starts
        ↓
Check if user is logged in
        ├─ User logged in
        │  ├─ Fetch user from Firebase Auth
        │  ├─ Fetch user role from Firestore
        │  ├─ Update auth context
        │  ├─ setLoading(false)
        │  └─ Render protected routes
        │
        └─ User not logged in
           ├─ setUser(null)
           ├─ setLoading(false)
           └─ Redirect to /login
        ↓
User navigates to protected route
        ↓
Route component checks auth context
        ├─ User authenticated & authorized
        │  └─ Render component
        │
        └─ User not authenticated/authorized
           └─ Redirect to appropriate page
```

## Component Hierarchy

```
App
├── AuthProvider
│   ├── BrowserRouter
│   │   └── Routes
│   │       ├── /login
│   │       │   └── PublicRoute
│   │       │       └── AuthForm (mode="login")
│   │       │           ├── FormInput
│   │       │           ├── PasswordInput
│   │       │           └── GoogleSignInButton
│   │       │
│   │       ├── /signup
│   │       │   └── PublicRoute
│   │       │       └── AuthForm (mode="signup")
│   │       │           ├── FormInput
│   │       │           ├── PasswordInput
│   │       │           └── GoogleSignInButton
│   │       │
│   │       ├── /admin-dashboard
│   │       │   └── AdminRoute
│   │       │       └── AdminDashboard
│   │       │
│   │       ├── /dashboard
│   │       │   └── UserRoute
│   │       │       └── UserDashboard
│   │       │
│   │       └── /
│   │           └── RootRedirect
│   │
│   └── AuthContext.Provider
```

## State Management

### Global Auth Context

```typescript
interface AuthContextType {
  user: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    emailVerified: boolean;
    // ... other Firebase user properties
  } | null;
  
  isAdmin: boolean;
  
  role: 'Admin' | 'User' | null;
  
  loading: boolean;
}
```

### Component Local State

```typescript
// AuthForm.tsx
const [isFormShaking, setIsFormShaking] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
// ... form fields

// GoogleSignInButton.tsx
const [isLoading, setIsLoading] = useState(false);
```

### LocalStorage

```javascript
// Stored after successful authentication
localStorage.setItem('user', JSON.stringify({
  uid: "firebase_uid",
  name: "User Name",
  email: "user@example.com",
  photoURL: "https://...",
  role: "User" | "Admin",
  provider: "google" | "email",
  createdAt: Timestamp,
  lastLogin: Timestamp
}));
```

## Environment Variables Flow

```
.env file
    ↓
Vite build process
    ↓
import.meta.env.VITE_*
    ↓
firebase.ts
    ├── VITE_FIREBASE_API_KEY
    ├── VITE_FIREBASE_AUTH_DOMAIN
    ├── VITE_FIREBASE_PROJECT_ID
    ├── VITE_FIREBASE_STORAGE_BUCKET
    ├── VITE_FIREBASE_MESSAGING_SENDER_ID
    ├── VITE_FIREBASE_APP_ID
    └── VITE_FIREBASE_FIRESTORE_DATABASE_ID
    ↓
Firebase initialization
    ↓
auth & db exports
    ↓
Used throughout app
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  - Route protection (PublicRoute, AdminRoute, UserRoute)    │
│  - Role-based access control                                │
│  - Loading states prevent unauthorized access              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Firebase Auth Layer                        │
│  - Email/password authentication                            │
│  - Google OAuth 2.0                                         │
│  - Token management and refresh                             │
│  - Session management                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Firestore Security Layer                    │
│  - Security rules enforce access control                    │
│  - Users can only read/write their own data                 │
│  - Admins can read all user data                            │
│  - Timestamps prevent tampering                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Environment Variables Layer                 │
│  - Credentials stored in .env                               │
│  - Never committed to version control                       │
│  - Different values for dev/production                      │
│  - Vite injects at build time                               │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Methods Comparison

| Feature | Google Sign-In | Email/Password |
|---------|---|---|
| Setup Complexity | Medium | Low |
| User Experience | One-click | Form-based |
| Password Management | Google handles | App handles |
| Email Verification | Optional | Can be added |
| Social Profile | Yes | No |
| Account Recovery | Google handles | Forgot password |
| 2FA Support | Google handles | Can be added |

## File Dependencies

```
src/
├── firebase.ts
│   ├── Uses: import.meta.env (Vite)
│   └── Exports: auth, db
│
├── App.tsx
│   ├── Imports: firebase.ts (auth, db)
│   ├── Uses: onAuthStateChanged, getDoc
│   └── Provides: AuthContext
│
├── components/
│   ├── AuthForm.tsx
│   │   ├── Imports: firebase.ts (auth, db)
│   │   ├── Imports: GoogleSignInButton
│   │   ├── Uses: signInWithEmailAndPassword, createUserWithEmailAndPassword
│   │   └── Uses: setDoc, getDoc, serverTimestamp
│   │
│   ├── GoogleSignInButton.tsx
│   │   ├── Imports: firebase.ts (auth, db)
│   │   ├── Uses: signInWithPopup, GoogleAuthProvider
│   │   ├── Uses: setDoc, getDoc, serverTimestamp
│   │   └── Uses: useNavigate, useAuth
│   │
│   ├── UserDashboard.tsx
│   │   └── Uses: useAuth
│   │
│   └── AdminDashboard.tsx
│       └── Uses: useAuth
│
└── .env
    └── Contains: All VITE_* variables
```

## Deployment Architecture

```
Development
├── npm run dev
├── Frontend: http://localhost:3000
├── Backend: http://localhost:5001
└── Firebase: Development project

Production
├── npm run build
├── Frontend: Deployed to CDN/hosting
├── Backend: Deployed to server
└── Firebase: Production project
```

## Performance Considerations

1. **Code Splitting**
   - GoogleSignInButton is a separate component
   - Can be lazy-loaded if needed

2. **Caching**
   - User data cached in localStorage
   - Firebase handles token caching

3. **Loading States**
   - Prevents multiple submissions
   - Shows loading indicators
   - Prevents flickering

4. **Error Handling**
   - User-friendly error messages
   - Detailed console logging
   - Graceful fallbacks

## Scalability

- **Multi-tenant support**: Can add tenant ID to user documents
- **Custom claims**: Can use Firebase custom claims for roles
- **Batch operations**: Can batch user creation for imports
- **Real-time updates**: Can use Firestore listeners for live updates
- **Analytics**: Can track authentication events
- **Audit logging**: Can log all authentication actions

## Future Enhancements

1. **Email Verification**
   - Send verification email on signup
   - Require verification before access

2. **Two-Factor Authentication**
   - SMS or authenticator app
   - Enhanced security

3. **Social Sign-In**
   - Facebook, GitHub, Twitter
   - More authentication options

4. **Custom Claims**
   - Firebase custom claims for roles
   - More granular permissions

5. **User Profiles**
   - Profile picture upload
   - User preferences
   - Account settings

6. **Audit Logging**
   - Track all authentication events
   - Security monitoring
   - Compliance reporting
