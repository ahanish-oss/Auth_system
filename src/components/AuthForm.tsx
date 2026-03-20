import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import GoogleSignInButton from "./GoogleSignInButton";

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
        const userDocRef = doc(db, "users", user.uid);
        let userDoc;
        try {
          userDoc = await getDoc(userDocRef);
        } catch (error) {
          console.error('[AUTH] Error fetching user data:', error);
        }

        let userData;
        if (userDoc && userDoc.exists()) {
          userData = userDoc.data();
          // Update last login
          await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true });
        } else {
          // Create user profile if it doesn't exist
          const isAdmin = user.email?.toLowerCase() === 'ahanish@karunya.edu.in';
          userData = {
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            role: isAdmin ? 'Admin' : 'User',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            provider: 'email',
          };
          await setDoc(userDocRef, userData);
        }

        localStorage.setItem("user", JSON.stringify(userData));
        
        toast.success("Welcome back!");
        navigate("/", { replace: true });
        return;
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
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          provider: 'email',
        };

        // Store in Firestore
        try {
          await setDoc(doc(db, "users", user.uid), userData);
        } catch (error) {
          console.error('[AUTH] Error creating user profile:', error);
          throw error;
        }
        localStorage.setItem("user", JSON.stringify(userData));
        
        toast.success("Account created successfully.");
        navigate("/", { replace: true });
        return;
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      let message = "Authentication failed. Please try again.";
      
      if (error.code === 'auth/user-not-found') message = "User not found. Please check your email.";
      else if (error.code === 'auth/wrong-password') message = "Invalid password. Please try again.";
      else if (error.code === 'auth/invalid-credential') message = "Invalid email or password. Please try again.";
      else if (error.code === 'auth/email-already-in-use') message = "Email already in use. Please use a different email.";
      else if (error.code === 'auth/invalid-email') message = "Invalid email address. Please check and try again.";
      else if (error.code === 'auth/weak-password') message = "Password is too weak. Please use a stronger password.";
      else if (error.code === 'auth/too-many-requests') message = "Too many login attempts. Please try again later.";
      else if (error.code === 'auth/operation-not-allowed') message = "This operation is not allowed. Please contact support.";
      else if (error.message) message = error.message;

      toast.error(message);
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
                <label htmlFor="role" className="auth-label mb-2 block text-sm font-medium text-[#4A5568]">
                  Role
                </label>
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

        <GoogleSignInButton />

        <div className="hidden">
          <div id="google-auth-button" />
        </div>

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
