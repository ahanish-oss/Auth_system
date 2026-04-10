/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import AuthForm from './components/AuthForm';
import EmailVerification from './components/EmailVerification';
import ForgotPassword from './components/ForgotPassword';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';

interface AuthContextType {
  user: any;
  isAdmin: boolean;
  role: 'Admin' | 'User' | null;
  status: 'Active' | 'Blocked' | null;
  loading: boolean;
}

import { logEvent, ADMIN_EMAIL } from './utils/auditLogger';

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  isAdmin: false, 
  role: null, 
  status: null,
  loading: true 
});

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<'Admin' | 'User' | null>(null);
  const [status, setStatus] = useState<'Active' | 'Blocked' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setIsAdmin(false);
        setRole(null);
        setStatus(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
      const email = user.email?.toLowerCase() || '';
      const isDesignatedAdmin = email === 'ahanish@karunya.edu.in' || email === ADMIN_EMAIL;
      
      let isActuallyAdmin = isDesignatedAdmin;
      let fetchedRole: 'Admin' | 'User' = isDesignatedAdmin ? 'Admin' : 'User';
      let fetchedStatus: 'Active' | 'Blocked' = 'Active';

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const roleFromDb = userData.role;
        fetchedStatus = userData.status === 'Blocked' ? 'Blocked' : 'Active';
        
        if (roleFromDb === 'Admin' || roleFromDb === 'admin') {
          isActuallyAdmin = true;
          fetchedRole = 'Admin';
        } else if (roleFromDb === 'User' || roleFromDb === 'user') {
          isActuallyAdmin = isDesignatedAdmin;
          fetchedRole = isDesignatedAdmin ? 'Admin' : 'User';
        }
      } else {
        isActuallyAdmin = isDesignatedAdmin;
        fetchedRole = isDesignatedAdmin ? 'Admin' : 'User';
      }
      
      setRole(fetchedRole);
      setIsAdmin(isActuallyAdmin);
      setStatus(fetchedStatus);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to user doc:", error);
      const email = user.email?.toLowerCase() || '';
      const isActuallyAdmin = email === 'ahanish@karunya.edu.in' || email === ADMIN_EMAIL;
      setRole(isActuallyAdmin ? 'Admin' : 'User');
      setIsAdmin(isActuallyAdmin);
      setStatus('Active');
      setLoading(false);
    });

    return () => unsubscribeDoc();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAdmin, role, status, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, status, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (user) {
    if (status === 'Blocked') return <Navigate to="/blocked" replace />;
    return <Navigate to={isAdmin ? "/admin-dashboard" : "/dashboard"} replace />;
  }

  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, status, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) return <Navigate to="/login" replace />;
  
  if (status === 'Blocked') return <Navigate to="/blocked" replace />;

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, status, loading } = useAuth();
  const [hasLogged, setHasLogged] = useState(false);

  useEffect(() => {
    const triggerLog = async () => {
      if (!loading && user && !hasLogged) {
        if (user.email !== ADMIN_EMAIL) {
          // 🚨 LOG UNAUTHORIZED ACCESS
          await logEvent({
            user,
            action: "ADMIN_ACCESS_ATTEMPT",
            status: "WARNING",
            message: "Unauthorized user tried to access admin dashboard",
            severity: "MEDIUM"
          });
          console.log("Audit Log Created: ADMIN_ACCESS_ATTEMPT", user.email);
        } else {
          // ✅ LOG ADMIN SUCCESS
          await logEvent({
            user,
            action: "ADMIN_ACCESS_SUCCESS",
            status: "SUCCESS",
            message: "Admin accessed dashboard",
            severity: "LOW"
          });
          console.log("Audit Log Created: ADMIN_ACCESS_SUCCESS", user.email);
        }
        setHasLogged(true);
      }
    };
    triggerLog();
  }, [loading, user, hasLogged]);

  if (loading || (user && !hasLogged)) return <LoadingScreen />;

  if (!user) return <Navigate to="/login" replace />;
  
  if (status === 'Blocked') return <Navigate to="/blocked" replace />;

  if (user.email !== ADMIN_EMAIL) {
    return <AccessDenied />;
  }
  
  return <>{children}</>;
};

const AccessDenied = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full bg-white rounded-[40px] border border-[#E2E8F0] p-12 text-center shadow-2xl relative overflow-hidden"
      >
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
        
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 group-hover:rotate-0 transition-transform">
          <ShieldAlert size={40} className="text-red-600" />
        </div>

        <h1 className="text-[32px] font-black text-[#0F172A] mb-4 tracking-tight">Access Denied</h1>
        
        <p className="text-[#64748B] text-[16px] leading-relaxed mb-10 max-w-[340px] mx-auto">
          You do not have the required permissions to access the admin panel. 
          Please contact your administrator if you believe this is an error.
        </p>

        <button 
          onClick={() => navigate("/dashboard", { replace: true })}
          className="w-full h-[64px] bg-[#0A0A0A] text-white rounded-[20px] font-bold text-[16px] hover:bg-[#262626] active:scale-[0.98] transition-all shadow-lg shadow-black/10"
        >
          Return to Dashboard
        </button>
      </motion.div>
    </div>
  );
};

const RootRedirect = () => {
  const { user, isAdmin, status, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) return <Navigate to="/login" replace />;
  
  if (status === 'Blocked') return <Navigate to="/blocked" replace />;

  return isAdmin ? <Navigate to="/admin-dashboard" replace /> : <Navigate to="/dashboard" replace />;
};

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-[#0A0A0A] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[14px] font-medium text-[#64748B] animate-pulse">Securing your session...</p>
    </div>
  </div>
);

const BlockedPage = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[32px] border border-[#E2E8F0] p-10 text-center shadow-xl">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-4">Account Blocked</h1>
        <p className="text-[#64748B] mb-8">
          Your account ({user?.email}) has been suspended due to a violation of our security policies or terms of service.
        </p>
        <div className="space-y-4">
          <button 
            onClick={() => signOut(auth)}
            className="w-full h-[52px] bg-[#0A0A0A] text-white rounded-[16px] font-bold hover:bg-[#262626] transition-all"
          >
            Sign Out
          </button>
          <p className="text-[13px] text-[#94A3B8]">
            Contact support if you believe this is a mistake.
          </p>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <AuthForm mode="login" />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <AuthForm mode="signup" />
            </PublicRoute>
          } />
          <Route path="/blocked" element={<BlockedPage />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin-dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
