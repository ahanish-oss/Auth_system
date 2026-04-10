import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Settings, 
  Shield, 
  Activity, 
  LogOut, 
  Mail, 
  Calendar, 
  Clock,
  CheckCircle2,
  Lock,
  Layout,
  HelpCircle,
  Bell,
  Search,
  Smartphone,
  Globe,
  Cpu,
  Link2,
  Database,
  Key,
  Plus,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../App';
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

async function logUserActivity(action: string, details?: string) {
  try {
    if (!auth.currentUser) return;
    
    await addDoc(collection(db, 'userActivityLogs'), {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      name: auth.currentUser.displayName || 'Unknown',
      action,
      details: details || '',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log user activity:', error);
  }
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Fallback redirect if user is actually an admin
  useEffect(() => {
    if (!authLoading && isAdmin) {
      navigate('/admin-dashboard', { replace: true });
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            setProfile({
              ...userDoc.data(),
              uid: userDoc.id
            } as UserProfile);
            
            // Log user dashboard access
            await logUserActivity('Dashboard Access', 'User accessed their dashboard');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser.uid}`);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await logUserActivity('Logout', 'User logged out');
      await signOut(auth);
      navigate('/login');
      toast.success("Logged out successfully.");
    } catch (error) {
      toast.error("Failed to logout.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0A0A0A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0F172A] font-sans overflow-hidden">
      {/* ChatGPT-style Sidebar */}
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
                {sidebarOpen && <span className="text-[14px] font-semibold text-white">Auth System</span>}
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

                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin-dashboard')}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group text-left hover:bg-purple-500/20 text-purple-400"
                  >
                    <Shield size={16} />
                    <span className="text-[13px] font-medium">Admin Dashboard</span>
                  </button>
                )}
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

            {/* Mobile Close Button */}
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden absolute top-4 -right-12 p-2 bg-[#0A0A0A] text-white rounded-r-lg"
            >
              <PanelLeftClose size={20} />
            </button>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header / Top Bar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Layout className="text-[#0A0A0A]" size={20} />
              <span className="font-bold text-[18px] tracking-tight">User Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-[#64748B] hover:text-[#0F172A] transition-colors relative group">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white group-hover:scale-110 transition-transform"></span>
            </button>
            <div className="h-6 w-[1px] bg-[#E2E8F0]"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0A0A0A] flex items-center justify-center text-white text-[12px] font-bold">
                {profile?.name.charAt(0)}
              </div>
              <span className="text-[14px] font-semibold hidden sm:inline-block">{profile?.name}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <>
              {/* Welcome Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-10"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[11px] font-bold uppercase tracking-wider">
                      {profile?.role} Account
                    </span>
                    <span className="text-[#64748B] text-[13px]">•</span>
                    <span className="text-[#64748B] text-[13px]">Last active: Just now</span>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome back, {profile?.name}!</h1>
                  <p className="text-[#64748B] text-lg">Your personal command center for security, data, and account management.</p>
                </motion.div>

                {/* Quick Actions Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-10"
                >
                  <h2 className="text-[18px] font-bold mb-6 flex items-center gap-2">
                    <Plus size={20} className="text-[#64748B]" /> Quick Actions
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickActionCard 
                      title="Update Profile" 
                      description="Change your name or avatar" 
                      icon={<User size={20} />} 
                      onClick={() => toast.success("Opening profile editor...")}
                    />
                    <QuickActionCard 
                      title="Security Audit" 
                      description="Review your recent logins" 
                      icon={<Shield size={20} />} 
                      onClick={() => toast.success("Starting security audit...")}
                    />
                    <QuickActionCard 
                      title="Request Data" 
                      description="Download your account data" 
                      icon={<Database size={20} />} 
                      onClick={() => toast.success("Preparing data export...")}
                    />
                    <QuickActionCard 
                      title="Contact Support" 
                      description="Get help from our team" 
                      icon={<HelpCircle size={20} />} 
                      onClick={() => toast.success("Connecting to support...")}
                    />
                  </div>
                </motion.div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard 
                      icon={<Clock size={24} />}
                      label="Account Age"
                      value={profile ? `${Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))} Days` : '0 Days'}
                      color="bg-blue-50 text-blue-600"
                      delay={0.1}
                    />
                    <StatCard 
                      icon={<Shield size={24} />}
                      label="Security Score"
                      value="98/100"
                      color="bg-green-50 text-green-600"
                      delay={0.2}
                    />
                    <StatCard 
                      icon={<Database size={24} />}
                      label="Storage Used"
                      value="1.2 GB"
                      color="bg-purple-50 text-purple-600"
                      delay={0.3}
                    />
                    <StatCard 
                      icon={<Activity size={24} />}
                      label="API Requests"
                      value="2.4k"
                      color="bg-orange-50 text-orange-600"
                      delay={0.4}
                    />
                  </div>

                  {/* System Status Banner */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-10 p-6 bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
                        <Globe size={24} className="text-green-600 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold">Global System Status</h3>
                        <p className="text-[13px] text-[#64748B]">All systems operational. Next maintenance in 4 days.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Latency</p>
                        <p className="text-[15px] font-bold text-green-600">24ms</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Uptime</p>
                        <p className="text-[15px] font-bold text-green-600">99.99%</p>
                      </div>
                      <div className="h-10 w-[1px] bg-[#E2E8F0]"></div>
                      <button className="px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] font-bold hover:bg-[#F1F5F9] transition-all">
                        View Details
                      </button>
                    </div>
                  </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Profile Details */}
                  <div className="lg:col-span-2 space-y-10">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm overflow-hidden"
                    >
                      <div className="p-8 border-b border-[#E2E8F0] flex items-center justify-between">
                        <h2 className="text-[18px] font-bold flex items-center gap-2">
                          <User size={20} className="text-[#64748B]" /> Profile Information
                        </h2>
                        <button className="text-[14px] font-semibold text-[#0A0A0A] hover:underline flex items-center gap-1">
                          <Settings size={16} /> Edit Profile
                        </button>
                      </div>
                      <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-1">
                            <p className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">Full Name</p>
                            <p className="text-[16px] font-medium">{profile?.name}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">Email Address</p>
                            <div className="flex items-center gap-2">
                              <Mail size={16} className="text-[#64748B]" />
                              <p className="text-[16px] font-medium">{profile?.email}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">Account Role</p>
                            <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[11px] font-bold uppercase tracking-tight">
                              {profile?.role}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">Member Since</p>
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-[#64748B]" />
                              <p className="text-[16px] font-medium">
                                {profile ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-10 p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-[14px] font-bold">Profile Completion</p>
                            <p className="text-[14px] font-bold text-blue-600">85%</p>
                          </div>
                          <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden mb-8">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '85%' }}
                              transition={{ duration: 1, delay: 0.8 }}
                              className="h-full bg-blue-600"
                            />
                          </div>

                          <div className="space-y-4">
                            <p className="text-[14px] font-bold">Resource Usage</p>
                            <div className="space-y-3">
                              {[
                                { label: 'CPU Usage', value: 45, color: 'bg-blue-500' },
                                { label: 'Memory', value: 72, color: 'bg-purple-500' },
                                { label: 'Network', value: 28, color: 'bg-orange-500' }
                              ].map((item, idx) => (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold text-[#64748B] uppercase">
                                    <span>{item.label}</span>
                                    <span>{item.value}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${item.value}%` }}
                                      transition={{ duration: 1, delay: 1 + (idx * 0.1) }}
                                      className={`h-full ${item.color}`}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <p className="mt-6 text-[12px] text-[#64748B]">Real-time metrics updated every 30s.</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Login History Table */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm overflow-hidden"
                    >
                      <div className="p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-[18px] font-bold flex items-center gap-2">
                          <Clock size={20} className="text-[#64748B]" /> Login History
                        </h2>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
                            <input 
                              type="text"
                              placeholder="Search logs..."
                              className="pl-10 pr-4 h-[38px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/5 focus:border-[#0A0A0A] w-full sm:w-[200px]"
                            />
                          </div>
                          <button className="h-[38px] px-4 bg-[#0A0A0A] text-white rounded-xl text-[13px] font-semibold flex items-center gap-2 hover:bg-[#262626] transition-all">
                            Export
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#F8FAFC] text-[#64748B] text-[12px] font-bold uppercase tracking-wider">
                              <th className="px-6 py-4">Device / Browser</th>
                              <th className="px-6 py-4">Location</th>
                              <th className="px-6 py-4">IP Address</th>
                              <th className="px-6 py-4 text-right">Date & Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1F5F9]">
                            <HistoryRow 
                              device="Chrome on Windows" 
                              location="New York, US" 
                              ip="192.168.1.1" 
                              time="Today, 10:30 AM" 
                              status="Success" 
                            />
                            <HistoryRow 
                              device="Safari on iPhone" 
                              location="New York, US" 
                              ip="192.168.1.45" 
                              time="Yesterday, 08:15 PM" 
                              status="Success" 
                            />
                            <HistoryRow 
                              device="Firefox on MacOS" 
                              location="Unknown" 
                              ip="45.12.33.102" 
                              time="Mar 15, 2026, 02:00 PM" 
                              status="Blocked" 
                            />
                          </tbody>
                        </table>
                      </div>
                    </motion.div>

                    {/* Bottom Grid */}
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
                          <ActivityItem 
                            action="Logged in from Chrome" 
                            time="2 hours ago" 
                            icon={<Clock size={14} className="text-blue-600" />}
                          />
                          <ActivityItem 
                            action="Changed profile picture" 
                            time="3 days ago" 
                            icon={<User size={14} className="text-purple-600" />}
                          />
                          <ActivityItem 
                            action="Updated security settings" 
                            time="1 week ago" 
                            icon={<Shield size={14} className="text-green-600" />}
                          />
                        </div>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="bg-[#0A0A0A] rounded-[24px] p-8 text-white shadow-xl"
                      >
                        <h2 className="text-[18px] font-bold flex items-center gap-2 mb-6">
                          <Shield size={20} className="text-white/60" /> Session Health
                        </h2>
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <span className="text-white/60 text-[14px]">Session Status</span>
                            <span className="text-green-400 font-bold text-[14px]">Active & Secure</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/60 text-[14px]">Encryption</span>
                            <span className="text-green-400 font-bold text-[14px]">AES-256</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/60 text-[14px]">Last Verified</span>
                            <span className="text-white font-bold text-[14px]">5 mins ago</span>
                          </div>
                          <div className="pt-4 border-t border-white/10">
                            <p className="text-white/40 text-[12px] leading-relaxed">
                              Your session is protected by end-to-end encryption and regular security checks.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Sidebar Cards */}
                  <div className="space-y-6">
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                      className="bg-white rounded-[24px] border border-[#E2E8F0] p-8 shadow-sm"
                    >
                      <h2 className="text-[18px] font-bold flex items-center gap-2 mb-6">
                        <Lock size={20} className="text-[#64748B]" /> Security Center
                      </h2>
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors cursor-pointer group">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[14px] font-medium">Password</p>
                            <Settings size={14} className="text-[#94A3B8] group-hover:text-[#0A0A0A] transition-colors" />
                          </div>
                          <p className="text-[#64748B] text-[12px] mb-3">Last changed 3 months ago</p>
                          <button className="text-[12px] font-bold text-[#0A0A0A] hover:underline transition-colors">
                            Update Password
                          </button>
                        </div>
                        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors cursor-pointer group">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[14px] font-medium">Two-Factor Auth</p>
                            <Shield size={14} className="text-[#94A3B8] group-hover:text-[#0A0A0A] transition-colors" />
                          </div>
                          <p className="text-[#64748B] text-[12px] mb-3">Add an extra layer of security</p>
                          <button className="text-[12px] font-bold text-green-600 hover:text-green-700 transition-colors">
                            Enable 2FA Now
                          </button>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      className="bg-white rounded-[24px] border border-[#E2E8F0] p-8 shadow-sm"
                    >
                      <h2 className="text-[18px] font-bold flex items-center gap-2 mb-4">
                        <HelpCircle size={20} className="text-[#64748B]" /> Support & Help
                      </h2>
                      <p className="text-[14px] text-[#64748B] mb-6 leading-relaxed">
                        Have questions about your account or our services? Our support team is available 24/7.
                      </p>
                      <div className="space-y-3">
                        <button className="w-full py-3 bg-[#0A0A0A] text-white rounded-xl text-[14px] font-bold hover:bg-[#262626] transition-all">
                          Contact Support
                        </button>
                        <button className="w-full py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] font-bold hover:bg-[#F1F5F9] transition-all">
                          View Documentation
                        </button>
                      </div>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 }}
                      className="bg-white rounded-[24px] border border-[#E2E8F0] p-8 shadow-sm"
                    >
                      <h2 className="text-[18px] font-bold flex items-center gap-2 mb-6">
                        <Link2 size={20} className="text-[#64748B]" /> Connected Apps
                      </h2>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                              <Globe size={18} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold">Google Account</p>
                              <p className="text-[12px] text-[#64748B]">Connected</p>
                            </div>
                          </div>
                          <CheckCircle2 size={16} className="text-green-500" />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                              <Smartphone size={18} className="text-orange-600" />
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold">Mobile App</p>
                              <p className="text-[12px] text-[#64748B]">Not linked</p>
                            </div>
                          </div>
                          <button className="text-[12px] font-bold text-blue-600 hover:underline">Link</button>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 }}
                      className="bg-white rounded-[24px] border border-[#E2E8F0] p-8 shadow-sm"
                    >
                      <h2 className="text-[18px] font-bold flex items-center gap-2 mb-4">
                        <Database size={20} className="text-[#64748B]" /> Data & Privacy
                      </h2>
                      <p className="text-[14px] text-[#64748B] mb-6 leading-relaxed">
                        Control how your data is used and download your account information.
                      </p>
                      <div className="space-y-3">
                        <button className="w-full py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] font-bold hover:bg-[#F1F5F9] transition-all flex items-center justify-center gap-2">
                          <Key size={16} /> Privacy Settings
                        </button>
                        <button className="w-full py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] font-bold hover:bg-[#F1F5F9] transition-all flex items-center justify-center gap-2">
                          <Cpu size={16} /> Download My Data
                        </button>
                      </div>
                    </motion.div>

                    {/* Quick Tips */}
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                      className="bg-blue-600 rounded-[24px] p-8 text-white shadow-lg"
                    >
                      <h2 className="text-[18px] font-bold mb-4">Quick Tip 💡</h2>
                      <p className="text-white/80 text-[14px] leading-relaxed mb-4">
                        Regularly reviewing your login history helps keep your account secure from unauthorized access.
                      </p>
                      <button className="text-[14px] font-bold underline">Learn more</button>
                    </motion.div>
                  </div>
                </div>
              </>
          </div>
        </main>
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, icon, onClick }: { title: string, description: string, icon: any, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-start p-6 bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#0A0A0A] transition-all text-left group"
    >
      <div className="w-10 h-10 bg-[#F8FAFC] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
        {icon}
      </div>
      <p className="text-[15px] font-bold mb-1">{title}</p>
      <p className="text-[13px] text-[#64748B] leading-relaxed">{description}</p>
    </button>
  );
}

function StatCard({ icon, label, value, color, delay = 0 }: { icon: any, label: string, value: string, color: string, delay?: number }) {
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
      <p className="text-[24px] font-bold tracking-tight">{value}</p>
    </motion.div>
  );
}

function HistoryRow({ device, location, ip, time, status }: { device: string, location: string, ip: string, time: string, status: string }) {
  return (
    <tr className="hover:bg-[#F8FAFC] transition-colors group">
      <td className="px-6 py-4">
        <p className="font-semibold text-[14px]">{device}</p>
      </td>
      <td className="px-6 py-4 text-[13px] text-[#64748B]">{location}</td>
      <td className="px-6 py-4 text-[13px] text-[#64748B] font-mono">{ip}</td>
      <td className="px-6 py-4 text-[13px] text-[#64748B]">{time}</td>
      <td className="px-6 py-4 text-right">
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tight ${
          status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {status}
        </span>
      </td>
    </tr>
  );
}

function ActivityItem({ action, time, icon }: { action: string, time: string, icon: any }) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="w-8 h-8 bg-[#F8FAFC] rounded-lg flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#F1F5F9] transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[14px] font-medium text-[#0F172A]">{action}</p>
        <p className="text-[12px] text-[#94A3B8]">{time}</p>
      </div>
    </div>
  );
}
