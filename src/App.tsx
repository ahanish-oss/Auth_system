/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import AuthForm from './components/AuthForm';
import EmailVerification from './components/EmailVerification';
import ForgotPassword from './components/ForgotPassword';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';

interface AuthContextType {
  user: any;
  isAdmin: boolean;
  role: 'Admin' | 'User' | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, role: null, loading: true });

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<'Admin' | 'User' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      if (u) {
        setUser(u);
        try {
          // Case-insensitive check for designated admin
          const isDesignatedAdmin = u.email?.toLowerCase() === 'ahanish@karunya.edu.in';
          
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const fetchedRole = userData.role;
            const isActuallyAdmin = fetchedRole === 'Admin' || fetchedRole === 'admin' || isDesignatedAdmin;
            setRole(isActuallyAdmin ? 'Admin' : 'User');
            setIsAdmin(isActuallyAdmin);
          } else {
            // Fallback to designated email if doc doesn't exist yet
            const isActuallyAdmin = isDesignatedAdmin;
            setRole(isActuallyAdmin ? 'Admin' : 'User');
            setIsAdmin(isActuallyAdmin);
          }
        } catch (error) {
          console.error("Role check failed:", error);
          setRole('User');
          setIsAdmin(u.email?.toLowerCase() === 'ahanish@karunya.edu.in');
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0A0A0A] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0A0A0A] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const UserRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0A0A0A] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  
  if (isAdmin) {
    return <Navigate to="/admin-dashboard" replace />;
  }
  
  return <>{children}</>;
};

const RootRedirect = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0A0A0A] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  
  return isAdmin ? <Navigate to="/admin-dashboard" replace /> : <Navigate to="/dashboard" replace />;
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
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin-dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/dashboard" element={
            <UserRoute>
              <UserDashboard />
            </UserRoute>
          } />
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
