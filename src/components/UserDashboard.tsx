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
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal,
  ChevronRight
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
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
  status: 'Active' | 'Locked';
  createdAt: string;
  lastActive?: string;
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<'dashboard' | 'chat'>('dashboard');
  const [chats, setChats] = useState([
    { id: 1, title: "Account Security Audit", date: "2h ago" },
    { id: 2, title: "Profile Update Request", date: "Yesterday" },
    { id: 3, title: "Billing Inquiry #4421", date: "Mar 15" },
    { id: 4, title: "General Support Chat", date: "Mar 12" },
  ]);
  const [chatMessages, setChatMessages] = useState<Record<number, { role: 'user' | 'assistant', content: string }[]>>({
    1: [{ role: 'assistant', content: "Hello! I'm your security assistant. How can I help with your Account Security Audit?" }],
    2: [{ role: 'assistant', content: "I see you've requested a profile update. What would you like to change?" }],
    3: [{ role: 'assistant', content: "Regarding your billing inquiry #4421, I can help you review your recent invoices." }],
    4: [{ role: 'assistant', content: "General support session started. How can I assist you today?" }],
  });
  const [newMessage, setNewMessage] = useState("");
  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

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
      await signOut(auth);
      navigate('/login');
      toast.success("Logged out successfully.");
    } catch (error) {
      toast.error("Failed to logout.");
    }
  };

  const handleNewSession = () => {
    const newId = Date.now();
    const newChat = {
      id: newId,
      title: "New Session",
      date: "Just now"
    };
    setChats([newChat, ...chats]);
    setChatMessages({
      ...chatMessages,
      [newId]: [{ role: 'assistant', content: "Hello! I'm your support assistant. How can I help you today?" }]
    });
    setActiveChat(newId);
    setView('chat');
    toast.success("Starting a new support session...");
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || activeChat === null) return;

    const userMsg = { role: 'user' as const, content: newMessage };
    const currentMessages = chatMessages[activeChat] || [];
    
    setChatMessages({
      ...chatMessages,
      [activeChat]: [...currentMessages, userMsg]
    });
    setNewMessage("");

    // Mock assistant response
    setTimeout(() => {
      const assistantMsg = { role: 'assistant' as const, content: "I've received your message. Let me look into that for you. Is there anything else you'd like to add?" };
      setChatMessages(prev => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), assistantMsg]
      }));
    }, 1000);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all conversations?")) {
      setChats([]);
      setChatMessages({});
      setActiveChat(null);
      setView('dashboard');
      toast.success("All conversations cleared");
    }
  };

  const handleRenameChat = (id: number, currentTitle: string) => {
    setEditingChatId(id);
    setEditTitle(currentTitle);
  };

  const saveRename = (id: number) => {
    setChats(chats.map(chat => chat.id === id ? { ...chat, title: editTitle } : chat));
    setEditingChatId(null);
    toast.success("Session renamed");
  };

  const handleDeleteChat = (id: number) => {
    setChats(chats.filter(chat => chat.id !== id));
    if (activeChat === id) {
      setActiveChat(null);
      setView('dashboard');
    }
    toast.success("Session deleted");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0A0A0A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0F172A] font-sans overflow-hidden">
      {/* ChatGPT-style Sidebar */}
      <AnimatePresence mode="wait">
        {(sidebarOpen || mobileSidebarOpen) && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className={`
              fixed inset-y-0 left-0 z-50 w-[260px] bg-[#0A0A0A] text-white flex flex-col
              lg:relative lg:translate-x-0
              ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            {/* New Chat Button */}
            <div className="p-4 space-y-4">
              <button 
                onClick={handleNewSession}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition-colors text-[14px] font-medium"
              >
                <Plus size={16} />
                New Session
              </button>
              
   
            </div>

            {/* Recent Sessions List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
              <div className="px-3 py-2 text-[11px] font-bold text-white/40 uppercase tracking-wider">
                Menu
              </div>
              <button
                onClick={() => {
                  setView('dashboard');
                  setActiveChat(null);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group text-left
                  ${view === 'dashboard' ? 'bg-white/10' : 'hover:bg-white/5'}
                `}
              >
                <Layout size={16} className={`${view === 'dashboard' ? 'text-white' : 'text-white/40 group-hover:text-white/80'}`} />
                <span className={`text-[13px] font-medium ${view === 'dashboard' ? 'text-white' : 'text-white/80'}`}>Dashboard</span>
              </button>

              {filteredChats.map((chat) => (
                <div key={chat.id} className="relative group/item">
                  {editingChatId === chat.id ? (
                    <div className="px-3 py-2">
                      <input 
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => saveRename(chat.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveRename(chat.id)}
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-[13px] text-white outline-none"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveChat(chat.id);
                        setView('chat');
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group text-left
                        ${activeChat === chat.id ? 'bg-white/10' : 'hover:bg-white/5'}
                      `}
                    >
                      <MessageSquare size={16} className={`${activeChat === chat.id ? 'text-white' : 'text-white/40 group-hover:text-white/80'}`} />
                      <div className="flex-1 truncate">
                        <p className={`text-[13px] font-medium truncate ${activeChat === chat.id ? 'text-white' : 'text-white/80'}`}>{chat.title}</p>
                        <p className="text-[11px] text-white/30">{chat.date}</p>
                      </div>
                      
                      <div className={`flex items-center gap-1 ${activeChat === chat.id ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'} transition-opacity`}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameChat(chat.id, chat.title);
                          }}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <Settings size={12} className="text-white/40 hover:text-white" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id);
                          }}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <LogOut size={12} className="text-red-400/60 hover:text-red-400" />
                        </button>
                      </div>
                    </button>
                  )}
                </div>
              ))}
             
            </div>

            {/* Sidebar Footer / User Profile */}
            <div className="p-4 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[12px] font-bold">
                  {profile?.name.charAt(0)}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-[13px] font-medium truncate">{profile?.name}</p>
                  <p className="text-[11px] text-white/40 truncate">{profile?.email}</p>
                </div>
                <Settings size={16} className="text-white/40 group-hover:text-white/80" />
              </div>
              <button 
                onClick={handleLogout}
                className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors text-[13px] font-medium"
              >
                <LogOut size={16} />
                Logout
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
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header / Top Bar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setSidebarOpen(!sidebarOpen);
                setMobileSidebarOpen(!mobileSidebarOpen);
              }}
              className="p-2 text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
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
            {view === 'dashboard' ? (
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
            ) : (
              <div className="h-[calc(100vh-160px)] flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                  <div className="flex justify-center">
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-2xl text-center shadow-sm">
                      <MessageSquare size={40} className="mx-auto mb-4 text-blue-600" />
                      <h3 className="text-xl font-bold mb-2">Support Session: {chats.find(c => c.id === activeChat)?.title}</h3>
                      <p className="text-[#64748B]">This is a secure support session. How can we help you today?</p>
                    </div>
                  </div>
                  
                  {/* Chat Messages */}
                  <div className="max-w-3xl mx-auto w-full space-y-6">
                    {chatMessages[activeChat || 0]?.map((msg, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx} 
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${msg.role === 'user' ? 'bg-[#0A0A0A]' : 'bg-blue-600'}`}>
                          {msg.role === 'user' ? profile?.name.charAt(0) : 'AI'}
                        </div>
                        <div className={`
                          p-4 text-[14px] leading-relaxed shadow-sm rounded-2xl max-w-[80%]
                          ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-[#E2E8F0]'}
                        `}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 border-t border-[#E2E8F0] bg-white/50 backdrop-blur-sm rounded-t-3xl">
                  <div className="max-w-3xl mx-auto relative">
                    <input 
                      type="text"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="w-full bg-white border border-[#E2E8F0] rounded-2xl pl-6 pr-12 py-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#0A0A0A] text-white rounded-xl hover:bg-[#262626] transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <p className="text-center text-[11px] text-[#94A3B8] mt-3">
                    Our AI assistant can help with common tasks. For sensitive issues, you'll be connected to a human agent.
                  </p>
                </div>
              </div>
            )}
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
