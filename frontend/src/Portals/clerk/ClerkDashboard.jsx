import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/api';
import ClerkSidebar from './ClerkSidebar';
import Baptisms from './modules/Baptisms';
import ChildDedications from './modules/ChildDedications';
import MeetingsRecords from './modules/MeetingsRecords';
import Departments from './modules/Departments';
import Communication from './modules/Communication';
import MembershipRecords from './modules/MembershipRecords';

// Icons
import { 
  FaUsers, 
  FaWater, 
  FaBaby, 
  FaExchangeAlt,
  FaArrowRight,
  FaCalendarAlt,
  FaSpinner,
  FaFileAlt
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

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ClerkDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transferFilter, setTransferFilter] = useState('All'); // 'All', 'In', 'Out'

  // RBAC User Role resolution
  const currentUserRole = user?.role || user?.designation || 'Church Clerk';

  const [transferData, setTransferData] = useState([]);
  const [baptismData, setBaptismData] = useState([]);
  const [kpiStats, setKpiStats] = useState({
    activeMembers: 0,
    baptismsYtd: 0,
    dedicationsCount: 0,
    pendingTransfers: 0,
  });

  // Fetch real analytics and KPI metrics from Django API
  const fetchClerkAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Primary Overview Analytics
      const [analyticsRes, transfersRes] = await Promise.all([
        API.get('analytics/').catch(() => null),
        API.get('member-records/?joining_method=Transfer').catch(() => null)
      ]);

      let incomingCount = 0;
      let outgoingCount = 0;

      // Calculate exact Transfer In / Transfer Out counts from Membership Records
      if (transfersRes?.data) {
        const transferList = transfersRes.data.results || transfersRes.data || [];
        incomingCount = transferList.filter(m => m.transfer_type === 'Transfer In' || !m.transfer_type).length;
        outgoingCount = transferList.filter(m => m.transfer_type === 'Transfer Out').length;
      }

      if (analyticsRes?.data) {
        const data = analyticsRes.data;
        
        // KPI Stats
        setKpiStats({
          activeMembers: data.total_active_members || 0,
          baptismsYtd: data.baptisms_ytd || 0,
          dedicationsCount: data.child_dedications_total || 0,
          pendingTransfers: data.pending_transfers || (incomingCount + outgoingCount),
        });

        // Set Membership Transfers Data
        setTransferData([
          {
            month: 'YTD Summary',
            TransfersIn: incomingCount || data.membership_transfers?.incoming || 0,
            TransfersOut: outgoingCount || data.membership_transfers?.outgoing || 0,
          }
        ]);

        // Monthly Baptisms
        const monthlyCounts = data.baptism_trends?.monthly_counts || [0,0,0,0,0,0,0,0,0,0,0,0];
        const formattedBaptismData = monthlyCounts.map((count, index) => ({
          month: MONTH_NAMES[index],
          Baptisms: count
        }));
        setBaptismData(formattedBaptismData);
      } else {
        // Fallback for direct endpoints
        setTransferData([
          {
            month: 'YTD Summary',
            TransfersIn: incomingCount,
            TransfersOut: outgoingCount
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load CCIS live analytics:', err);
      setError('Failed to fetch system metrics. Please check network connection or backend state.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClerkAnalytics();
  }, [fetchClerkAnalytics]);

  // Clickable Navigation Tiles Configuration
  const quickAccessModules = [
    { 
      id: 1, 
      title: 'Master Membership Register', 
      date: 'Quarter 3, 2026', 
      type: 'VIEW REGISTER', 
      targetTab: 'membership' 
    },
    { 
      id: 2, 
      title: 'Board & Church Business Minutes', 
      date: 'Latest - July 2026', 
      type: 'VIEW MINUTES', 
      targetTab: 'meetings' 
    },
    { 
      id: 3, 
      title: 'Baptism & Dedication Certificates Log', 
      date: 'YTD 2026', 
      type: 'VIEW BAPTISMS', 
      targetTab: 'baptisms' 
    },
    { 
      id: 4, 
      title: 'Transfer Clearance Summary', 
      date: 'Active Transfers', 
      type: 'VIEW TRANSFERS', 
      targetTab: 'membership' 
    }
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased overflow-hidden select-none">
      
      {/* SIDEBAR */}
      <ClerkSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={logout} 
        kpiStats={kpiStats}
        userRole={currentUserRole}
      />

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Workspace Body */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs rounded-2xl flex items-center justify-between">
              <span>{error}</span>
              <button onClick={fetchClerkAnalytics} className="underline font-bold text-rose-800 cursor-pointer">Retry</button>
            </div>
          )}

          {/* 1. OVERVIEW & ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <>
              {/* KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Total Active Members" 
                  value={loading ? '...' : kpiStats.activeMembers.toLocaleString()} 
                  icon={FaUsers} 
                  valueColor="text-emerald-600"
                  iconBg="bg-emerald-500/10 text-emerald-600"
                />
                <StatCard 
                  title="Baptisms (YTD)" 
                  value={loading ? '...' : kpiStats.baptismsYtd} 
                  icon={FaWater} 
                  valueColor="text-slate-900"
                  iconBg="bg-blue-500/10 text-blue-600"
                />
                <StatCard 
                  title="Child Dedications" 
                  value={loading ? '...' : kpiStats.dedicationsCount} 
                  icon={FaBaby} 
                  valueColor="text-indigo-600"
                  iconBg="bg-indigo-500/10 text-indigo-600"
                />
                <StatCard 
                  title="Pending Transfers" 
                  value={loading ? '...' : kpiStats.pendingTransfers} 
                  icon={FaExchangeAlt} 
                  valueColor="text-rose-600"
                  iconBg="bg-amber-500/10 text-amber-600"
                />
              </div>

              {/* SIDE-BY-SIDE ANALYTICS CHARTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* CHART 1: Membership Transfers with Toggle Controls */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <h2 className="text-base font-black text-slate-900">Membership Transfers</h2>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">Incoming & Outgoing Summary</p>
                    </div>

                    {/* Filter Toggle Buttons */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button 
                        onClick={() => setTransferFilter('All')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                          transferFilter === 'All' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All
                      </button>
                      <button 
                        onClick={() => setTransferFilter('In')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                          transferFilter === 'In' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Incoming
                      </button>
                      <button 
                        onClick={() => setTransferFilter('Out')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                          transferFilter === 'Out' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Outgoing
                      </button>
                    </div>
                  </div>

                  <div className="h-72 w-full flex items-center justify-center">
                    {loading ? (
                      <FaSpinner className="animate-spin text-slate-400 w-6 h-6" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={transferData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="month" tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                          <YAxis allowDecimals={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }} />
                          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 700 }} />
                          
                          {(transferFilter === 'All' || transferFilter === 'In') && (
                            <Bar dataKey="TransfersIn" name="Incoming" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
                          )}
                          {(transferFilter === 'All' || transferFilter === 'Out') && (
                            <Bar dataKey="TransfersOut" name="Outgoing" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={32} />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* CHART 2: Baptisms Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-base font-black text-slate-900">Baptism Trends</h2>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">Total Baptisms Recorded (Jan - Dec)</p>
                    </div>
                    <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                      2026 Monthly View
                    </span>
                  </div>

                  <div className="h-72 w-full flex items-center justify-center">
                    {loading ? (
                      <FaSpinner className="animate-spin text-slate-400 w-6 h-6" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={baptismData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="month" tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                          <YAxis allowDecimals={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }} />
                          <Bar dataKey="Baptisms" name="Baptisms" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </div>

              {/* CLICKABLE ARCHIVE & NAVIGATION TILES */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="mb-5">
                  <h2 className="text-lg font-black text-slate-900">Archive & Quick Module Shortcuts</h2>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">Select a card to navigate directly to its workspace tab</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickAccessModules.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setActiveTab(item.targetTab)}
                      className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-emerald-500 hover:shadow-sm transition duration-200 cursor-pointer group"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:text-white transition">
                          <FaFileAlt className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-black text-slate-900 leading-snug group-hover:text-emerald-700 transition">{item.title}</h3>
                        <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5 font-bold">
                          <FaCalendarAlt className="w-3 h-3 text-slate-400" /> {item.date}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.type}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab(item.targetTab);
                          }}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          Open <FaArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* MODULE TABS */}
          {activeTab === 'baptisms' && <Baptisms currentUserRole={currentUserRole} />}
          {activeTab === 'membership' && <MembershipRecords currentUserRole={currentUserRole} />}
          {activeTab === 'dedications' && <ChildDedications currentUserRole={currentUserRole} />}
          {activeTab === 'meetings' && <MeetingsRecords currentUserRole={currentUserRole} />}
          {activeTab === 'departments' && <Departments currentUserRole={currentUserRole} />}
          {activeTab === 'communication' && <Communication currentUserRole={currentUserRole} />}

        </main>
      </div>
    </div>
  );
};

// Custom KPI Stat Card Component
const StatCard = ({ title, value, icon: Icon, valueColor, iconBg }) => {
  return (
    <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between min-h-[120px]">
      <div>
        <p className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">{title}</p>
        <h3 className={`text-3xl font-black ${valueColor} mt-2 tracking-tight`}>{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl ${iconBg}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

export default ClerkDashboard;