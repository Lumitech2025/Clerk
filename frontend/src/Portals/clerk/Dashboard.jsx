import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { 
  FaUsers, 
  FaWater, 
  FaBaby, 
  FaClipboardList, 
  FaBuilding, 
  FaBullhorn, 
  FaSignOutAlt, 
  FaCross,
  FaExchangeAlt,
  FaExclamationCircle,
  FaUserClock,
  FaChartBar
} from 'react-icons/fa';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Data sourced to reflect Newlife SDA 2026 Transfer Workflows & Register metrics
const transferData = [
  { month: 'Jan', TransfersIn: 18, TransfersOut: 7 },
  { month: 'Feb', TransfersIn: 24, TransfersOut: 12 },
  { month: 'Mar', TransfersIn: 30, TransfersOut: 15 },
  { month: 'Apr', TransfersIn: 22, TransfersOut: 9 },
  { month: 'May', TransfersIn: 35, TransfersOut: 18 },
  { month: 'Jun', TransfersIn: 28, TransfersOut: 11 },
];

const ClerkDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('analytics');

  const navItems = [
    { id: 'analytics', name: 'Overview & Analytics', icon: <FaChartBar className="w-5 h-5" /> },
    { id: 'membership', name: 'Membership Records', icon: <FaUsers className="w-5 h-5" />, badge: '7,500+' },
    { id: 'baptisms', name: 'Baptisms', icon: <FaWater className="w-5 h-5" /> },
    { id: 'dedications', name: 'Child Dedications', icon: <FaBaby className="w-5 h-5" /> },
    { id: 'meetings', name: 'Meetings Records', icon: <FaClipboardList className="w-5 h-5" /> },
    { id: 'departments', name: 'Departments', icon: <FaBuilding className="w-5 h-5" /> },
    { id: 'communication', name: 'Communication', icon: <FaBullhorn className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-slate-950 font-sans antialiased overflow-hidden select-none">
      
      {/* ────────────────────────────────────────────────────────────────────────
          1. UNIFORM SIDEBAR SYSTEM (Dark Navy Theme, Clear Hierarchy)
         ──────────────────────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col justify-between border-r border-slate-800 shadow-xl flex-shrink-0">
        <div>
          {/* Header Branding */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-800/80">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <FaCross className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-wide leading-snug">
                CCIS PORTAL
              </h1>
              <p className="text-xs text-blue-400 font-medium tracking-wider uppercase">
                Church Clerk Desk
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Main Management
            </p>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 ease-in-out cursor-pointer
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'}
                  `}
                >
                  <div className="flex items-center gap-3.5">
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer & Logout Button */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all duration-200 border border-rose-500/20 mb-4 cursor-pointer"
          >
            <FaSignOutAlt className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <div className="text-center pt-2 border-t border-slate-800/40">
            <p className="text-xs font-semibold text-slate-400">
              Newlife SDA Church
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Clerk Information System v1.0
            </p>
          </div>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA (Dynamic Tab Views)
         ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Newlife SDA Church — Executive Clerk Desk
            </h2>
            <p className="text-xs text-slate-500">
              Master Register & Governance Operations Center
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-medium text-slate-600">
              User: <strong className="text-slate-900">{user?.username || 'Church Clerk'}</strong>
            </span>
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'analytics' && (
            <>
              {/* Executive Welcome Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Executive Clerk Dashboard</h1>
                  <p className="text-slate-400 text-sm mt-1">
                    Real-time metrics for life events, transfers, and official records.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ACMS Sync Active
                  </span>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    ODPC Compliant
                  </span>
                </div>
              </div>

              {/* KPI Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Master Register</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">7,542</h3>
                    <p className="text-xs text-emerald-600 font-medium mt-1">Active Church Members</p>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <FaUsers className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Baptisms (YTD)</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">142</h3>
                    <p className="text-xs text-blue-600 font-medium mt-1">18 Scheduled Next Sabbath</p>
                  </div>
                  <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
                    <FaWater className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Child Dedications</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">68</h3>
                    <p className="text-xs text-indigo-600 font-medium mt-1">Certificates Issued</p>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FaBaby className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Pending Transfers</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">24</h3>
                    <p className="text-xs text-amber-600 font-medium mt-1">Awaiting Board Vote</p>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <FaExchangeAlt className="w-6 h-6" />
                  </div>
                </div>

              </div>

              {/* Bar Chart & Action Tracker Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Transfer Analytics Bar Graph */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Transfer Analytics (2026)</h2>
                      <p className="text-xs text-slate-500">Comparative trend of Membership Transfers In vs Transfers Out</p>
                    </div>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-md">
                      YTD Metrics
                    </span>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={transferData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="month" tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                        <YAxis tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Bar dataKey="TransfersIn" name="Transfers In" fill="#2563EB" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="TransfersOut" name="Transfers Out" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Governance Action Tracker */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Clerk Action Tracker</h2>
                    <p className="text-xs text-slate-500 mb-4">Urgent governance and compliance deadlines.</p>

                    <ul className="space-y-3">
                      <li className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
                        <FaExclamationCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-900">Conference Quarterly Report</p>
                          <p className="text-[11px] text-amber-700">Due in 5 days. 12 transfers pending verification.</p>
                        </div>
                      </li>

                      <li className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-3">
                        <FaClipboardList className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-blue-900">Board Minutes Approval</p>
                          <p className="text-[11px] text-blue-700">Recent Board Meeting minutes pending clerk sign-off.</p>
                        </div>
                      </li>

                      <li className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                        <FaUserClock className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Redemptive Register Review</p>
                          <p className="text-[11px] text-slate-600">34 members flagged for elder visitations.</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => setActiveTab('meetings')}
                    className="mt-5 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    Manage Governance Minutes & Actions
                  </button>
                </div>

              </div>
            </>
          )}

          {/* Dynamic Views for Other Nav Tabs */}
          {activeTab === 'membership' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Master Membership Register (7,500+ Members)</h2>
              <p className="text-slate-500 text-sm mt-1">Filter by Sabbath School Units, Prayer Cells, and ACMS sync status.</p>
            </div>
          )}

          {activeTab === 'baptisms' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Baptismal Services & Certificate Generator</h2>
              <p className="text-slate-500 text-sm mt-1">Schedule candidates, assign officiating pastors, and issue certificates.</p>
            </div>
          )}

          {activeTab === 'dedications' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Child Dedication Register</h2>
              <p className="text-slate-500 text-sm mt-1">Manage child dedication records and generate official certificates.</p>
            </div>
          )}

          {activeTab === 'meetings' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Board & Business Meeting Minutes</h2>
              <p className="text-slate-500 text-sm mt-1">Draft actions, record votes, and track resolutions.</p>
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Department Roster & TORs Repository</h2>
              <p className="text-slate-500 text-sm mt-1">Manage department leaders, reports, and annual budget uploads.</p>
            </div>
          )}

          {activeTab === 'communication' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Broadcast Messaging Center</h2>
              <p className="text-slate-500 text-sm mt-1">Send SMS and WhatsApp announcements to prayer cells and departments.</p>
            </div>
          )}

        </main>
      </div>

    </div>
  );
};

export default ClerkDashboard;