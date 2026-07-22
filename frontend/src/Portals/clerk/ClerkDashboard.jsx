import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import ClerkSidebar from './ClerkSidebar';
import Baptisms from './modules/Baptisms';
import ChildDedications from './modules/ChildDedications';
import MeetingsRecords from './modules/MeetingsRecords';

// Icons
import { 
  FaUsers, 
  FaWater, 
  FaBaby, 
  FaExchangeAlt,
  FaFileDownload,
  FaCalendarAlt,
  FaClipboardList,
  FaBuilding,
  FaBullhorn
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

const ClerkDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(false);
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

  const fetchClerkAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      // 12 Months Data (Jan - Dec)
      setTransferData([
        { month: 'Jan', TransfersIn: 18, TransfersOut: 7 },
        { month: 'Feb', TransfersIn: 24, TransfersOut: 12 },
        { month: 'Mar', TransfersIn: 30, TransfersOut: 15 },
        { month: 'Apr', TransfersIn: 22, TransfersOut: 9 },
        { month: 'May', TransfersIn: 35, TransfersOut: 18 },
        { month: 'Jun', TransfersIn: 28, TransfersOut: 11 },
        { month: 'Jul', TransfersIn: 32, TransfersOut: 14 },
        { month: 'Aug', TransfersIn: 20, TransfersOut: 8 },
        { month: 'Sep', TransfersIn: 26, TransfersOut: 10 },
        { month: 'Oct', TransfersIn: 31, TransfersOut: 13 },
        { month: 'Nov', TransfersIn: 29, TransfersOut: 12 },
        { month: 'Dec', TransfersIn: 40, TransfersOut: 19 },
      ]);

      setBaptismData([
        { month: 'Jan', Baptisms: 12 },
        { month: 'Feb', Baptisms: 15 },
        { month: 'Mar', Baptisms: 8 },
        { month: 'Apr', Baptisms: 22 },
        { month: 'May', Baptisms: 18 },
        { month: 'Jun', Baptisms: 25 },
        { month: 'Jul', Baptisms: 14 },
        { month: 'Aug', Baptisms: 19 },
        { month: 'Sep', Baptisms: 11 },
        { month: 'Oct', Baptisms: 16 },
        { month: 'Nov', Baptisms: 21 },
        { month: 'Dec', Baptisms: 30 },
      ]);

      setKpiStats({
        activeMembers: 7542,
        baptismsYtd: 142,
        dedicationsCount: 68,
        pendingTransfers: 24,
      });
    } catch (error) {
      console.error('Failed to load CCIS analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClerkAnalytics();
  }, [fetchClerkAnalytics]);

  const downloadableReports = [
    { id: 1, title: 'Master Membership Register', date: 'Quarter 2, 2026', type: 'PDF / EXCEL' },
    { id: 2, title: 'Board & Church Business Minutes', date: 'Latest - June 2026', type: 'PDF' },
    { id: 3, title: 'Baptism & Dedication Certificates Log', date: 'YTD 2026', type: 'PDF' },
    { id: 4, title: 'Transfer Clearance Summary', date: 'Active Transfers', type: 'EXCEL' }
  ];

  const handleDownload = (title) => {
    alert(`Downloading report: ${title}`);
  };

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
          
          {/* 1. OVERVIEW & ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <>
              {/* KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Total Active Members" 
                  value={kpiStats.activeMembers.toLocaleString()} 
                  icon={FaUsers} 
                  valueColor="text-emerald-600"
                  iconBg="bg-emerald-500/10 text-emerald-600"
                />
                <StatCard 
                  title="Baptisms (YTD)" 
                  value={kpiStats.baptismsYtd} 
                  icon={FaWater} 
                  valueColor="text-slate-900"
                  iconBg="bg-blue-500/10 text-blue-600"
                />
                <StatCard 
                  title="Child Dedications" 
                  value={kpiStats.dedicationsCount} 
                  icon={FaBaby} 
                  valueColor="text-indigo-600"
                  iconBg="bg-indigo-500/10 text-indigo-600"
                />
                <StatCard 
                  title="Pending Transfers" 
                  value={kpiStats.pendingTransfers} 
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
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">Incoming & Outgoing (Jan - Dec)</p>
                    </div>

                    {/* Filter Toggle Buttons */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button 
                        onClick={() => setTransferFilter('All')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                          transferFilter === 'All' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All
                      </button>
                      <button 
                        onClick={() => setTransferFilter('In')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                          transferFilter === 'In' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Incoming
                      </button>
                      <button 
                        onClick={() => setTransferFilter('Out')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                          transferFilter === 'Out' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Outgoing
                      </button>
                    </div>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={transferData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="month" tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                        <YAxis tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#020617', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }} />
                        <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 700 }} />
                        
                        {(transferFilter === 'All' || transferFilter === 'In') && (
                          <Bar dataKey="TransfersIn" name="Incoming" fill="#10B981" radius={[4, 4, 0, 0]} />
                        )}
                        {(transferFilter === 'All' || transferFilter === 'Out') && (
                          <Bar dataKey="TransfersOut" name="Outgoing" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
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

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={baptismData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="month" tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                        <YAxis tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#020617', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }} />
                        <Bar dataKey="Baptisms" name="Baptisms" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* REPORTS & MINUTES ARCHIVE */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="mb-5">
                  <h2 className="text-lg font-black text-slate-900">Archive & Official Minutes</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {downloadableReports.map((report) => (
                    <div key={report.id} className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-emerald-500/50 transition duration-200">
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
                          <FaFileDownload className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-black text-slate-900 leading-snug">{report.title}</h3>
                        <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5 font-bold">
                          <FaCalendarAlt className="w-3 h-3 text-slate-400" /> {report.date}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{report.type}</span>
                        <button 
                          onClick={() => handleDownload(report.title)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl transition shadow-xs cursor-pointer"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 2. BAPTISMS MODULE */}
          {activeTab === 'baptisms' && (
            <Baptisms currentUserRole={currentUserRole} />
          )}

          {/* 3. MEMBERSHIP RECORDS MODULE */}
          {activeTab === 'membership' && (
            <ModulePlaceholder 
              title="Membership Records & Transfers"
              description="Manage official church membership rolls, incoming/outgoing transfer letters, attestation status, and member master directories."
              icon={FaUsers}
            />
          )}

          {/* 4. CHILD DEDICATIONS MODULE */}
          {activeTab === 'dedications' && (
            <ChildDedications currentUserRole={currentUserRole} />
          )}

          {/* 5. MEETINGS RECORDS MODULE */}
          {activeTab === 'meetings' && (
            <MeetingsRecords currentUserRole={currentUserRole} />
          )}

          {/* 6. DEPARTMENTS & TORS MODULE */}
          {activeTab === 'departments' && (
            <ModulePlaceholder 
              title="Departments & Terms of Reference (TORs)"
              description="Maintain departmental structures, leadership rosters, terms of reference guidelines, and active ministry roles."
              icon={FaBuilding}
            />
          )}

          {/* 7. COMMUNICATION HUB MODULE */}
          {activeTab === 'communication' && (
            <ModulePlaceholder 
              title="Communication Hub & Bulletins"
              description="Coordinate official announcements, manage weekly bulletin postings, and issue notifications across all roles."
              icon={FaBullhorn}
            />
          )}

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

// Reusable Module Placeholder for Pending Desk Features
const ModulePlaceholder = ({ title, description, icon: Icon }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-500/20">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
      <p className="text-xs font-semibold text-slate-400 mt-2 max-w-md leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default ClerkDashboard;