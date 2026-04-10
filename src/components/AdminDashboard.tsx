import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Users, 
  Shield, 
  Trash2, 
  UserPlus, 
  Search, 
  Filter, 
  ArrowLeft, 
  MoreVertical,
  Lock,
  Unlock,
  Activity,
  UserCheck,
  UserX,
  ShieldAlert,
  LogOut,
  Settings,
  Bell,
  Layout,
  Database,
  Cpu,
  Globe,
  Link2,
  HelpCircle,
  Key,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Server,
  Terminal,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  getDocs,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { getSecurityInsights } from '../utils/securityLogger';
import { ADMIN_EMAIL } from '../utils/auditLogger';
import toast from 'react-hot-toast';

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

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'User' | 'Admin';
  status: 'Active' | 'Blocked';
  createdAt: string;
  lastActive?: string;
}

interface AuditLog {
  id?: string;
  uid: string;
  name: string;
  email: string;
  action: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  attempts: number;
  timestamp: string;
}

interface UserActivityLog {
  uid: string;
  email: string;
  name: string;
  action: string;
  details?: string;
  timestamp: string;
}

function getRelativeTime(timestamp: any): string {
  if (!timestamp) return 'unknown';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  // 🔒 Restrict Admin Dashboard Access (Hard Check)
  if (auth.currentUser?.email !== ADMIN_EMAIL) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center p-8 bg-white rounded-3xl border border-[#E2E8F0] shadow-xl">
          <ShieldAlert size={48} className="text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Access Denied</h1>
          <p className="text-[#64748B] mb-6">You do not have permission to view this page.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-[#0A0A0A] text-white rounded-xl font-bold hover:bg-[#262626] transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'All' | 'User' | 'Admin'>('All');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userActivityLogs, setUserActivityLogs] = useState<UserActivityLog[]>([]);
  const [securityInsights, setSecurityInsights] = useState({
    totalAttempts: 0,
    failedAttempts: 0,
    successfulAttempts: 0,
    topAttacker: null as { email: string; failedCount: number } | null
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0
  });

  useEffect(() => {
    // ✅ NOTE: Admin access logging is now handled at the route level (AdminRoute.tsx)
    // This ensures EVERY access attempt is logged, including unauthorized attempts

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as UserProfile[];
      
      setUsers(usersData);
      
      // Calculate stats
      setStats({
        total: usersData.length,
        active: usersData.filter(u => u.status === 'Active').length,
        admins: usersData.filter(u => u.role === 'Admin').length
      });
      
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as AuditLog[];
      setAuditLogs(logsData);
    }, (error) => {
      console.error('Failed to fetch audit logs:', error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'userActivityLogs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        ...doc.data(),
      })) as UserActivityLog[];
      setUserActivityLogs(logsData);
    }, (error) => {
      console.error('Failed to fetch user activity logs:', error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSecurityInsights = async () => {
      const insights = await getSecurityInsights();
      setSecurityInsights(insights);
    };

    fetchSecurityInsights();
    const interval = setInterval(fetchSecurityInsights, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleToggleRole = async (user: UserProfile) => {
    if (user.uid === auth.currentUser?.uid) {
      toast.error("You cannot change your own role!");
      return;
    }
    const newRole = user.role === 'Admin' ? 'User' : 'Admin';
    try {
      await updateDoc(doc(db, 'users', user.uid), { role: newRole });
      toast.success(`Role updated to ${newRole}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'Blocked' ? 'Active' : 'Blocked';
    try {
      await updateDoc(doc(db, 'users', user.uid), { status: newStatus });
      toast.success(`User ${newStatus === 'Blocked' ? 'Blocked' : 'Unlocked'}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (uid === auth.currentUser?.uid) {
      toast.error("You cannot delete yourself!");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', uid));
      toast.success("User deleted successfully.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
      toast.success("Logged out successfully.");
    } catch (error) {
      toast.error("Failed to logout.");
    }
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (user.name || "").toLowerCase().includes(term) || 
                         (user.email || "").toLowerCase().includes(term);
    const matchesFilter = filterRole === 'All' || user.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0A0A0A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0F172A] font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 80 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="fixed inset-y-0 left-0 z-50 bg-[#0A0A0A] text-white flex flex-col lg:relative lg:translate-x-0"
      >
        {/* Auth System Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-blue-400 shrink-0" />
            {sidebarOpen && <span className="text-[14px] font-semibold text-white">Admin Panel</span>}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-white/60 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>

        {/* Menu Section */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
            <div className="px-3 py-2 text-[11px] font-bold text-white/40 uppercase tracking-wider">
              Menu
            </div>
            <button
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group text-left
                bg-white/10
              `}
            >
              <Layout size={16} className="text-white" />
              <span className="text-[13px] font-medium text-white">Dashboard</span>
            </button>
          </div>
        )}

        {!sidebarOpen && (
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            <button
              className="p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Layout size={20} className="text-white" />
            </button>
          </div>
        )}

        {/* Logout Button */}
        <div className={`p-4 border-t border-white/10 ${sidebarOpen ? '' : 'flex justify-center'}`}>
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-3 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors text-[13px] font-medium ${sidebarOpen ? 'w-full px-3 py-2' : 'p-3'}`}
          >
            <LogOut size={16} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-[#E2E8F0]">
          <div className="px-6 h-16 flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <ShieldAlert className="text-[#0A0A0A]" size={24} />
              <span className="font-bold text-[20px] tracking-tight"> Admin Portal </span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <button className="p-2 text-[#64748B] hover:text-[#0F172A] transition-colors relative group">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white group-hover:scale-110 transition-transform"></span>
              </button>
            </motion.div>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold tracking-tight mb-2">System Overview</h1>
          <p className="text-[#64748B]">Monitor user activity, manage permissions, and track system health.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            icon={<Users size={24} />}
            label="Total Users"
            value={stats.total}
            color="bg-blue-50 text-blue-600"
            delay={0.1}
          />
          <StatCard 
            icon={<UserCheck size={24} />}
            label="Active Users"
            value={stats.active}
            color="bg-green-50 text-green-600"
            delay={0.2}
          />
          <StatCard 
            icon={<Shield size={24} />}
            label="Admins"
            value={stats.admins}
            color="bg-purple-50 text-purple-600"
            delay={0.3}
          />
          <StatCard 
            icon={<AlertTriangle size={24} />}
            label="Security Alerts"
            value={0}
            color="bg-red-50 text-red-600"
            delay={0.4}
          />
        </div>

        {/* Security Insight Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        >
          <div className="bg-white p-6 rounded-[24px] border border-[#E2E8F0] shadow-sm">
            <h3 className="font-bold text-[16px] text-[#0F172A] mb-2">Failed Attempts</h3>
            <p className="text-4xl font-bold text-red-600">
              {auditLogs.filter(log => log.status === 'WARNING' || log.status === 'ERROR').length}
            </p>
            <p className="text-[12px] text-[#64748B] mt-2">Unauthorized access attempts</p>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-[#E2E8F0] shadow-sm">
            <h3 className="font-bold text-[16px] text-[#0F172A] mb-2">Total Attempts</h3>
            <p className="text-4xl font-bold text-blue-600">
              {auditLogs.length}
            </p>
            <p className="text-[12px] text-[#64748B] mt-2">All security events</p>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-[#E2E8F0] shadow-sm">
            <h3 className="font-bold text-[16px] text-[#0F172A] mb-2">Most Frequent Attacker</h3>
            {(() => {
              const failedByEmail: Record<string, number> = {};
              auditLogs.filter(log => log.status === 'WARNING' || log.status === 'ERROR').forEach(log => {
                failedByEmail[log.email] = (failedByEmail[log.email] || 0) + 1;
              });
              const topAttacker = Object.entries(failedByEmail)
                .sort((a, b) => b[1] - a[1])[0];
              return (
                <>
                  <p className="text-[18px] font-bold text-orange-600 truncate">
                    {topAttacker ? topAttacker[0] : 'None'}
                  </p>
                  <p className="text-[12px] text-[#64748B] mt-2">
                    {topAttacker ? `${topAttacker[1]} failed attempts` : 'No failed attempts'}
                  </p>
                </>
              );
            })()}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-10">
            {/* User Management Table */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-[18px] font-bold flex items-center gap-2">
                  <Users size={20} className="text-[#64748B]" /> User Management
                </h2>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
                    <input 
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 h-[38px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/5 focus:border-[#0A0A0A] w-full sm:w-[180px]"
                    />
                  </div>
                  
                  <select 
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as any)}
                    className="h-[38px] px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none"
                  >
                    <option value="All">All Roles</option>
                    <option value="User">Users</option>
                    <option value="Admin">Admins</option>
                  </select>

                  <button className="h-[38px] px-4 bg-[#0A0A0A] text-white rounded-xl text-[13px] font-semibold flex items-center gap-2 hover:bg-[#262626] transition-all">
                    <UserPlus size={16} /> Add User
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[#64748B] text-[12px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {filteredUsers.map((user) => (
                      <tr key={user.uid} className="hover:bg-[#F8FAFC] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#F1F5F9] rounded-full flex items-center justify-center font-bold text-[#0A0A0A] text-[13px]">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-[14px]">{user.name}</p>
                              <p className="text-[12px] text-[#64748B]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tight ${
                            user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-[13px] font-medium">{user.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-[#64748B]">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => handleToggleStatus(user)}
                              title={user.status === 'Blocked' ? 'Unlock User' : 'Block User'}
                              className={`p-2 rounded-lg transition-colors ${
                                user.status === 'Blocked' ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'
                              }`}
                            >
                              {user.status === 'Blocked' ? <Unlock size={16} /> : <Lock size={16} />}
                            </button>
                            <button 
                              onClick={() => handleToggleRole(user)}
                              title="Change Role"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Shield size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.uid)}
                              title="Delete User"
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">
                          <div className="flex flex-col items-center gap-2">
                            <Search size={32} className="opacity-20" />
                            <p>No users found matching your criteria</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* System Logs / Audit Trail */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-[18px] font-bold flex items-center gap-2">
                  <Terminal size={20} className="text-[#64748B]" /> Audit Logs
                </h2>
                <button className="text-[13px] font-bold text-blue-600 hover:underline">View All Logs</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[#64748B] text-[12px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">User / Event</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4 text-center">Attempts</th>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {auditLogs
                      .slice(0, 10)
                      .map((log, idx) => (
                        <AuditRow 
                          key={log.id || idx}
                          event={log.action} 
                          user={log.name}
                          email={log.email}
                          uid={log.uid}
                          time={getRelativeTime(log.timestamp)} 
                          attempts={log.attempts}
                          status={log.status as 'SUCCESS' | 'WARNING' | 'ERROR'} 
                          message={log.message}
                          severity={log.severity}
                        />
                      ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-[#64748B]">
                          <p>No activity logs yet</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Activity & Health Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-[24px] border border-[#E2E8F0] p-8 shadow-sm"
              >
                <h2 className="text-[18px] font-bold flex items-center gap-2 mb-6">
                  <Activity size={20} className="text-[#64748B]" /> Recent Activity
                </h2>
                <div className="space-y-6">
                  {userActivityLogs.slice(0, 3).map((log, idx) => (
                    <div key={`activity-${idx}`}>
                      <ActivityItem 
                        user={log.email} 
                        action={log.action} 
                        time={getRelativeTime(log.timestamp)} 
                        icon={log.action === 'Dashboard Access' ? <UserCheck size={14} className="text-green-600" /> : <Activity size={14} className="text-blue-600" />}
                      />
                    </div>
                  ))}
                  {userActivityLogs.length === 0 && (
                    <p className="text-[13px] text-[#64748B]">No recent activity</p>
                  )}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-[#0A0A0A] rounded-[24px] p-8 text-white shadow-xl"
              >
                <h2 className="text-[18px] font-bold flex items-center gap-2 mb-6">
                  <Server size={20} className="text-white/60" /> Infrastructure Health
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-[14px]">Database Status</span>
                    <span className="text-green-400 font-bold text-[14px]">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-[14px]">Auth Service</span>
                    <span className="text-green-400 font-bold text-[14px]">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-[14px]">API Latency</span>
                    <span className="text-white font-bold text-[14px]">24ms</span>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-white/40 text-[12px] leading-relaxed">
                      All systems are performing within normal parameters. No active incidents reported.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white rounded-[24px] border border-[#E2E8F0] p-8 shadow-sm"
            >
              <h2 className="text-[18px] font-bold flex items-center gap-2 mb-6">
                <Shield size={20} className="text-[#64748B]" /> Security Policies
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[14px] font-medium">MFA Enforcement</p>
                    <Shield size={14} className="text-[#94A3B8] group-hover:text-[#0A0A0A] transition-colors" />
                  </div>
                  <p className="text-[#64748B] text-[12px] mb-3">Enforce MFA for all admin accounts</p>
                  <button className="text-[12px] font-bold text-blue-600 hover:underline">Configure</button>
                </div>
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[14px] font-medium">Password Policy</p>
                    <Lock size={14} className="text-[#94A3B8] group-hover:text-[#0A0A0A] transition-colors" />
                  </div>
                  <p className="text-[#64748B] text-[12px] mb-3">Min 12 chars, special symbols</p>
                  <button className="text-[12px] font-bold text-blue-600 hover:underline">Update</button>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.92 }}
              className="bg-white rounded-[24px] border border-[#E2E8F0] p-8 shadow-sm"
            >
              <h2 className="text-[18px] font-bold flex items-center gap-2 mb-6">
                <ShieldAlert size={20} className="text-red-600" /> Security Insights
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-[12px] text-blue-600 font-semibold uppercase">Total Attempts</p>
                  <p className="text-[28px] font-bold text-blue-700 mt-1">{securityInsights.totalAttempts}</p>
                </div>
                <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                  <p className="text-[12px] text-green-600 font-semibold uppercase">Successful</p>
                  <p className="text-[28px] font-bold text-green-700 mt-1">{securityInsights.successfulAttempts}</p>
                </div>
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-[12px] text-red-600 font-semibold uppercase">Failed Attempts</p>
                  <p className="text-[28px] font-bold text-red-700 mt-1">{securityInsights.failedAttempts}</p>
                </div>
                {securityInsights.topAttacker && (
                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                    <p className="text-[12px] text-orange-600 font-semibold uppercase">Top Attacker</p>
                    <p className="text-[14px] font-bold text-orange-700 mt-2 truncate">{securityInsights.topAttacker.email}</p>
                    <p className="text-[12px] text-orange-600 mt-1">{securityInsights.topAttacker.failedCount} failed attempts</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.95 }}
              className="bg-white rounded-[24px] border border-[#E2E8F0] p-8 shadow-sm"
            >
              <h2 className="text-[18px] font-bold flex items-center gap-2 mb-6">
                <UserCheck size={20} className="text-[#64748B]" /> Frequent Visitors
              </h2>
              <FrequentVisitors auditLogs={auditLogs} />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
              className="bg-white rounded-[24px] border border-[#E2E8F0] p-8 shadow-sm"
            >
              <h2 className="text-[18px] font-bold flex items-center gap-2 mb-6">
                <Settings size={20} className="text-[#64748B]" /> Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <ActionButton icon={<UserPlus size={18} />} label="Add User" />
                <ActionButton icon={<Database size={18} />} label="Backup" />
                <ActionButton icon={<Cpu size={18} />} label="Logs" />
                <ActionButton icon={<Globe size={18} />} label="Settings" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.05 }}
              className="bg-white rounded-[24px] border border-[#E2E8F0] p-8 shadow-sm"
            >
              <h2 className="text-[18px] font-bold flex items-center gap-2 mb-4">
                <Database size={20} className="text-[#64748B]" /> Data Management
              </h2>
              <p className="text-[14px] text-[#64748B] mb-6 leading-relaxed">
                Manage system data, export user lists, and perform database maintenance.
              </p>
              <div className="space-y-3">
                <button className="w-full py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] font-bold hover:bg-[#F1F5F9] transition-all flex items-center justify-center gap-2">
                  <Link2 size={16} /> Export User Data
                </button>
                <button className="w-full py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] font-bold hover:bg-[#F1F5F9] transition-all flex items-center justify-center gap-2">
                  <Key size={16} /> API Keys
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 }}
              className="bg-orange-600 rounded-[24px] p-8 text-white shadow-lg"
            >
              <h2 className="text-[18px] font-bold mb-4 flex items-center gap-2">
                <AlertTriangle size={20} /> System Alert
              </h2>
              <p className="text-white/80 text-[14px] leading-relaxed mb-4">
                A scheduled maintenance is planned for next Sunday at 02:00 AM UTC.
              </p>
              <button className="text-[14px] font-bold underline">Notify Users</button>
            </motion.div>
          </div>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, delay = 0 }: { icon: any, label: string, value: number, color: string, delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-[24px] border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-[#64748B] text-[14px] font-medium mb-1">{label}</p>
      <p className="text-[28px] font-bold tracking-tight">{value}</p>
    </motion.div>
  );
}

function FrequentVisitors({ auditLogs }: { auditLogs: AuditLog[] }) {
  const frequentVisitors = Object.entries(
    auditLogs.reduce((acc, log) => {
      acc[log.email] = (acc[log.email] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {frequentVisitors.length === 0 ? (
        <p className="text-[13px] text-[#64748B]">No access logs yet</p>
      ) : (
        frequentVisitors.map(([email, count]) => (
          <div key={email} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="overflow-hidden">
              <p className="text-[13px] font-bold truncate">{email}</p>
              <p className="text-[11px] text-[#64748B]">Frequent Visitor</p>
            </div>
            <div className="bg-[#0A0A0A] text-white px-2.5 py-1 rounded-lg text-[12px] font-bold">
              {count}x
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ActionButton({ icon, label }: { icon: any, label: string }) {
  return (
    <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#CBD5E1] transition-all group">
      <div className="text-[#64748B] group-hover:text-[#0A0A0A] transition-colors">
        {icon}
      </div>
      <span className="text-[12px] font-bold text-[#64748B] group-hover:text-[#0A0A0A] transition-colors">{label}</span>
    </button>
  );
}

function AuditRow({ event, user, email, uid, time, status, attempts, message, severity }: { event: string, user: string, email: string, uid: string, time: string, status: 'SUCCESS' | 'WARNING' | 'ERROR', attempts: number, message: string, severity?: string, key?: any }) {
  const getStatusStyles = () => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-100 text-green-700 border-green-200';
      case 'WARNING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'ERROR': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSeverityStyles = () => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 font-black';
      case 'HIGH': return 'text-red-500 font-bold';
      case 'MEDIUM': return 'text-orange-500 font-bold';
      case 'LOW': return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  const isAlert = status === 'WARNING' || status === 'ERROR';
  const isAttack = event === "ADMIN_ACCESS_ATTEMPT";
  
  return (
    <tr className={`hover:bg-[#F8FAFC] transition-colors group ${isAttack ? 'bg-red-50/50' : ''}`}>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <p className={`font-semibold text-[14px] ${isAlert ? 'text-red-600' : 'text-[#0F172A]'}`}>
            {isAlert ? `⚠️ ${user || 'Unknown'}` : (user || 'Unknown')}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-[#64748B]">{event}</p>
            {severity && (
              <span className={`text-[9px] uppercase tracking-widest ${getSeverityStyles()}`}>
                • {severity}
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#94A3B8] mt-0.5">{message}</p>
          {isAlert && (
            <p className="text-[10px] font-mono text-red-400 mt-1">UID: {uid}</p>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-[13px] text-[#64748B]">{email || 'N/A'}</td>
      <td className="px-6 py-4 text-[13px] font-bold text-center">
        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${isAlert ? 'bg-red-600 text-white' : 'bg-[#0A0A0A] text-white'}`}>
          {attempts}x
        </span>
      </td>
      <td className="px-6 py-4 text-[13px] text-[#64748B]">{time}</td>
      <td className="px-6 py-4 text-right">
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tight border ${getStatusStyles()}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}

function ActivityItem({ user, action, time, icon }: { user: string, action: string, time: string, icon: any }) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="w-8 h-8 bg-[#F8FAFC] rounded-lg flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#F1F5F9] transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[14px] font-medium text-[#0F172A]">
          <span className="font-bold">{user}</span> {action}
        </p>
        <p className="text-[12px] text-[#94A3B8]">{time}</p>
      </div>
    </div>
  );
}
