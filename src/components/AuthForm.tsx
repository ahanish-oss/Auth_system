import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile,
  signOut
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import AuthCard from "./AuthCard";
import FormError from "./FormError";
import FormInput from "./FormInput";
import PasswordInput from "./PasswordInput";

const API_BASE = (import.meta as any).env.VITE_API_URL || "http://localhost:5001/api";
const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .regex(EMAIL_REGEX, "Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

const signupSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .regex(EMAIL_REGEX, "Enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(1, "Confirm password is required")
      .min(8, "Password must be at least 8 characters"),
    role: z.enum(["Admin", "User"], {
      message: "Please select a role",
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script.")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script."));
    document.body.appendChild(script);
  });
}

let googleInitialized = false;

interface AuthFormProps {
  mode: "login" | "signup";
}

function AuthForm({ mode }: AuthFormProps) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const [isFormShaking, setIsFormShaking] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const schema = useMemo(() => (isLogin ? loginSchema : signupSchema), [isLogin]);
  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    watch,
    formState: { errors, touchedFields, isSubmitting, isSubmitted, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      role: "User",
    },
  });

  const watchedEmail = watch("email", "");
  const watchedPassword = watch("password", "");
  const watchedConfirmPassword = watch("confirmPassword", "");
  const watchedRole = watch("role", "User");

  useEffect(() => {
    reset({
      email: "",
      password: "",
      confirmPassword: "",
      role: "User",
    });
  }, [isLogin, reset]);

  const triggerShake = useCallback(() => {
    setIsFormShaking(true);
    window.setTimeout(() => setIsFormShaking(false), 420);
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore, if not create profile
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        const userData = {
          uid: user.uid,
          name: user.displayName || "User",
          email: user.email || "",
          role: user.email?.toLowerCase() === 'ahanish@karunya.edu.in' ? "Admin" : "User",
          status: "Active",
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", user.uid), userData);
      } else {
        const userData = userDoc.data();
        if (userData.status === 'Blocked' || userData.status === 'Locked') {
          await signOut(auth);
          toast.error("❌ Your account has been blocked. Please contact support.", {
            duration: 5000,
            icon: '🚫'
          });
          setIsGoogleSubmitting(false);
          return;
        }
      }

      toast.success("Welcome back!");
      // Small delay to allow onAuthStateChanged to trigger and settle
      setTimeout(() => navigate("/", { replace: true }), 100);
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast.error(error.message || "Google authentication failed.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const labels = useMemo(
    () => ({
      title: isLogin ? "Welcome back" : "Create an account",
      subtitle: isLogin ? "Sign in with your email and password" : "Get started in seconds",
      cta: isLogin ? "Sign in" : "Create an account",
      alternatePath: isLogin ? "/signup" : "/login",
      alternateText: isLogin
        ? "Need an account? Create one"
        : "Already have an account? Login",
      endpoint: isLogin ? "login" : "signup",
    }),
    [isLogin]
  );

  const isLoginButtonEnabled =
    EMAIL_REGEX.test((watchedEmail || "").trim()) && (watchedPassword || "").trim().length > 0;

  const onValidSubmit = async (values: any) => {
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        
        // Fetch user data from Firestore
        let userDoc;
        try {
          userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.status === 'Blocked' || userData.status === 'Locked') {
              await signOut(auth);
              toast.error("❌ Your account has been blocked. Please contact support.", {
                duration: 5000,
                icon: '🚫'
              });
              return;
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }

        toast.success("Welcome back!");
        // Small delay to allow onAuthStateChanged to trigger and settle
        setTimeout(() => navigate("/", { replace: true }), 100);
        return; // Prevent falling through to the default navigate at the bottom
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        
        const name = values.email.split("@")[0] || "User";
        await updateProfile(user, { displayName: name });

        const userData = {
          uid: user.uid,
          name: name,
          email: values.email,
          role: values.role,
          status: "Active",
          createdAt: new Date().toISOString(),
        };

        // Store in Firestore
        try {
          await setDoc(doc(db, "users", user.uid), userData);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
        }
        
        toast.success("Account created successfully.");
        // Small delay to allow onAuthStateChanged to trigger and settle
        setTimeout(() => navigate("/", { replace: true }), 100);
        return; // Prevent falling through
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      let message = "Authentication failed. Please try again.";
      
      const errorCode = error.code || (error.message?.includes('auth/') ? error.message.match(/auth\/[a-z-]+/)?.[0] : null);

      if (errorCode === 'auth/user-not-found') {
        message = "❌ No account found with this email.";
      } else if (errorCode === 'auth/wrong-password') {
        message = "❌ Incorrect password. Please try again.";
      } else if (errorCode === 'auth/email-already-in-use') {
        message = "❌ This email is already registered. Try logging in instead.";
      } else if (errorCode === 'auth/invalid-email') {
        message = "❌ Please enter a valid email address.";
      } else if (errorCode === 'auth/weak-password') {
        message = "❌ Password is too weak. Use at least 8 characters.";
      } else if (errorCode === 'auth/popup-closed-by-user') {
        message = "❌ Sign-in cancelled.";
      } else if (errorCode === 'auth/network-request-failed') {
        message = "🌐 Network error. Please check your internet connection.";
      } else if (errorCode === 'auth/too-many-requests') {
        message = "⏳ Too many attempts. Please try again later.";
      } else if (error.message) {
        message = error.message.replace('Firebase: ', '');
      }

      toast.error(message, {
        duration: 4000,
        icon: '🔐'
      });
    }
  };

  const onInvalidSubmit = (fieldErrors: any) => {
    const firstField = Object.keys(fieldErrors)[0];
    if (firstField) {
      setFocus(firstField as any, { shouldSelect: true });
    }
    triggerShake();
    toast.error("Please fix the highlighted fields.");
  };

  const isSubmitDisabled = isSubmitting || (isLogin ? !isLoginButtonEnabled : !isValid);

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 2600,
          style: {
            borderRadius: "10px",
            border: "1px solid #d8dbe5",
            background: "#ffffff",
            color: "#121217",
            boxShadow: "0 14px 30px rgba(14, 15, 22, 0.12)",
          },
        }}
      />

      <AuthCard
        title={labels.title}
        subtitle={isLogin ? "Login to your account" : "Create your new account"}
      >
        <form
          onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
          className={`auth-form auth-form-clean ${isFormShaking ? "auth-shake" : ""}`.trim()}
          noValidate
        >
          <FormInput
            id="email"
            type="email"
            label="Email"
            placeholder="Email"
            autoComplete="email"
            registration={register("email")}
            error={errors.email}
            touched={touchedFields.email}
            isSubmitted={isSubmitted}
            value={watchedEmail}
            required
          />

          <PasswordInput
            id="password"
            label="Password"
            placeholder="Password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            registration={register("password")}
            error={errors.password}
            touched={touchedFields.password}
            isSubmitted={isSubmitted}
            value={watchedPassword}
            showStrength={!isLogin}
            required
          />

          {!isLogin ? (
            <>
              <div className="auth-input-group mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="role" className="auth-label block text-sm font-medium text-[#4A5568]">
                    Role
                  </label>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${watchedRole === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {watchedRole} Access
                  </span>
                </div>
                <select
                  id="role"
                  {...register("role")}
                  className={`w-full h-[52px] px-4 bg-white border ${errors.role ? 'border-red-500' : 'border-[#E2E8F0]'} rounded-[12px] text-[15px] text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/5 focus:border-[#1A1A1A] transition-all appearance-none cursor-pointer`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234A5568'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    backgroundSize: '16px'
                  }}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-xs text-red-500">{errors.role.message as string}</p>
                )}
              </div>

              <PasswordInput
                id="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm password"
                autoComplete="new-password"
                registration={register("confirmPassword")}
                error={errors.confirmPassword}
                touched={touchedFields.confirmPassword}
                isSubmitted={isSubmitted}
                value={watchedConfirmPassword}
                required
              />
            </>
          ) : null}

          {isLogin ? (
            <Link className="forgot-link forgot-link-under" to="/forgot-password">
              Forgot your password?
            </Link>
          ) : null}

          <button type="submit" disabled={isSubmitDisabled}>
            {isSubmitting ? (
              <span className="auth-loading-content">
                <span className="auth-spinner" aria-hidden="true" />
                <span>{isLogin ? "Signing in..." : "Creating account..."}</span>
              </span>
            ) : (
              labels.cta
            )}
          </button>
        </form>

        <div className="auth-divider" role="presentation">
          <span>Or continue with</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full h-[52px] bg-white border border-[#E2E8F0] rounded-[12px] flex items-center justify-center gap-3 text-[15px] font-medium text-[#1A1A1A] hover:bg-[#F8FAFC] active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
          aria-label="Sign in with Google"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="hidden">
          <div id="google-auth-button" />
        </div>

        {isGoogleSubmitting ? <p className="success text-center mt-2">Verifying Google account...</p> : null}

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Link className="alt-link" to={labels.alternatePath}>
            {isLogin ? "Sign up" : "Login"}
          </Link>
        </p>
      </AuthCard>
    </>
  );
}

export default AuthForm;
