import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/api';
import ElderSidebar from './ElderSidebar';

// Reusing Pastoral Modules directly
import MembershipRecords from '../pastor/modules/PastorMembership';
import PastorMeetingRecords from '../pastor/modules/MeetingRecords';
import PastorChildDedications from '../pastor/modules/ChildDedications';
import PastorWeddingsAndNotifications from '../pastor/modules/WeddingsAndNotifications';
import PastorDepartments from '../pastor/modules/PastorDepartments';
import PastorCommunication from '../pastor/modules/PastorCommunication';

// Icons
import { 
  FaUsers, 
  FaWater, 
  FaBaby, 
  FaCalendarAlt,
  FaArrowRight,
  FaSpinner,
  FaFileAlt,
  FaClock,
  FaMapMarkerAlt
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

const ElderDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Graph Toggle Filter ('All', 'Baptisms', 'TransfersIn', 'TransfersOut')
  const [chartFilter, setChartFilter] = useState('All');

  // RBAC User Role resolution
  const currentUserRole = user?.role || user?.designation || 'Church Elder';

  const [monthlyMetricsData, setMonthlyMetricsData] = useState([]);
  const [kpiStats, setKpiStats] = useState({
    activeMembers: 0,
    baptismsYtd: 0,
    dedicationsCount: 0,
    upcomingEventsCount: 0,
  });

  // Upcoming Church Events State
  const [eventsList, setEventsList] = useState([]);

  // Fetch real analytics and KPI metrics from Django API
  const fetchElderAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, eventsRes] = await Promise.all([
        API.get('analytics/').catch((err) => {
          console.error("Analytics fetch failed:", err);
          return null;
        }),
        API.get('events/upcoming/').catch((err) => {
          console.error("Upcoming events fetch failed:", err);
          return null;
        })
      ]);

      // Robust parsing for Events data
      let fetchedEvents = [];
      if (eventsRes?.data) {
        if (Array.isArray(eventsRes.data)) {
          fetchedEvents = eventsRes.data;
        } else if (Array.isArray(eventsRes.data.results)) {
          fetchedEvents = eventsRes.data.results;
        }
      }
      
      setEventsList(fetchedEvents);

      // Parse KPI Metrics
      if (analyticsRes?.data) {
        const data = analyticsRes.data;
        setKpiStats({
          activeMembers: data.total_active_members || 0,
          baptismsYtd: data.baptisms_ytd || 0,
          dedicationsCount: data.child_dedications_total || 0,
          upcomingEventsCount: data.upcoming_events_count ?? fetchedEvents.length,
        });

        if (Array.isArray(data.monthly_metrics) && data.monthly_metrics.length > 0) {
          setMonthlyMetricsData(data.monthly_metrics);
        }
      }
    } catch (err) {
      console.error('Failed to load Elder analytics:', err);
      setError('Failed to fetch system metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchElderAnalytics();
  }, [fetchElderAnalytics]);

  // Quick Navigation Shortcuts
  const quickAccessModules = [
    { id: 1, title: 'Membership Registry', date: 'Active Members Directory', targetTab: 'membership' },
    { id: 2, title: 'Board & Business Minutes', date: 'Meeting Records', targetTab: 'meetings' },
    { id: 3, title: 'Weddings & Notifications', date: 'Upcoming & Past Registrations', targetTab: 'weddings' },
    { id: 4, title: 'Departments & Reports', date: 'Departmental Activity & Filings', targetTab: 'departments' }
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-['Plus_Jakarta_Sans',sans-serif] antialiased overflow-hidden select-none text-slate-800">
      
      {/* SIDEBAR NAVIGATION */}
      <ElderSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={logout} 
        userRole={currentUserRole}
      />

      {/* MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        
        {/* WORKSPACE BODY */}
        <main className="flex-1 p-5 overflow-hidden flex flex-col justify-between gap-4">
          
          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-sm rounded-xl flex items-center justify-between shrink-0">
              <span>{error}</span>
              <button onClick={fetchElderAnalytics} className="underline font-extrabold text-rose-800 cursor-pointer hover:text-rose-950">Retry</button>
            </div>
          )}

          {/* OVERVIEW & ANALYTICS TAB */}
          {activeTab === 'dashboard' && (
            <div className="flex-1 flex flex-col justify-between gap-4 overflow-hidden">
              
              {/* TIER 1: ENLARGED KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
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
                  valueColor="text-blue-600"
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
                  title="Upcoming Events" 
                  value={loading ? '...' : kpiStats.upcomingEventsCount} 
                  icon={FaCalendarAlt} 
                  valueColor="text-amber-600"
                  iconBg="bg-amber-500/10 text-amber-600"
                />
              </div>

              {/* TIER 2: ASYMMETRIC GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
                
                {/* UPCOMING EVENTS MODULE */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full min-h-0">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Upcoming Events</h2>
                    </div>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-100/80 border border-emerald-300/60 px-3 py-1 rounded-lg uppercase tracking-wider">
                      {eventsList.length} Scheduled
                    </span>
                  </div>

                  {/* Dynamic Events List */}
                  <div className="space-y-2.5 overflow-y-auto pr-1 my-1 flex-1">
                    {loading ? (
                      <div className="h-full flex items-center justify-center">
                        <FaSpinner className="animate-spin text-slate-400 w-6 h-6" />
                      </div>
                    ) : eventsList.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <FaCalendarAlt className="w-9 h-9 text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-600">No upcoming events found</p>
                        <p className="text-xs text-slate-400 mt-0.5">Scheduled events will appear here.</p>
                      </div>
                    ) : (
                      eventsList.map((evt) => {
                        const eventCategory = evt.category || evt.eventType || evt.event_type || 'General';
                        const eventDate = evt.date || evt.startDate || evt.start_date || 'TBD';
                        const eventTime = evt.time || evt.startTime || evt.start_time || 'All Day';
                        const eventLocation = evt.location || evt.venue || 'Main Sanctuary';

                        return (
                          <div 
                            key={evt.id} 
                            className="p-3 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 transition flex items-center justify-between gap-3"
                          >
                            <div className="space-y-1 min-w-0">
                              <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-500/15 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                                {eventCategory}
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-900 leading-snug truncate">{evt.title}</h4>
                              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium truncate">
                                <span className="flex items-center gap-1.5 shrink-0">
                                  <FaCalendarAlt className="w-3 h-3 text-slate-400" /> {eventDate}
                                </span>
                                <span className="flex items-center gap-1.5 truncate">
                                  <FaClock className="w-3 h-3 text-slate-400" /> {eventTime}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1 justify-end">
                                <FaMapMarkerAlt className="w-3 h-3 text-emerald-600" /> {eventLocation}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overview</span>
                    <button 
                      onClick={() => setActiveTab('departments')}
                      className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer transition"
                    >
                      View All <FaArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* GRAPH MODULE */}
                <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full min-h-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 shrink-0">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Membership Analytics</h2>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">Baptisms and Transfers</p>
                    </div>

                    {/* Interactive Filter Toggle */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {['All', 'Baptisms', 'TransfersIn', 'TransfersOut'].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setChartFilter(filter)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                            chartFilter === filter 
                              ? 'bg-slate-950 text-white shadow-xs' 
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {filter === 'TransfersIn' ? 'Transfers In' : filter === 'TransfersOut' ? 'Transfers Out' : filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="w-full flex-1 min-h-0 pt-2">
                    {loading ? (
                      <div className="h-full flex items-center justify-center">
                        <FaSpinner className="animate-spin text-slate-400 w-7 h-7" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyMetricsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="month" tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                          <YAxis allowDecimals={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '500', padding: '10px 14px' }} />
                          <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '8px' }} />

                          {(chartFilter === 'All' || chartFilter === 'Baptisms') && (
                            <Bar dataKey="Baptisms" name="Baptisms" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                          )}
                          {(chartFilter === 'All' || chartFilter === 'TransfersIn') && (
                            <Bar dataKey="TransfersIn" name="Transfers In" fill="#10B981" radius={[4, 4, 0, 0]} />
                          )}
                          {(chartFilter === 'All' || chartFilter === 'TransfersOut') && (
                            <Bar dataKey="TransfersOut" name="Transfers Out" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </div>

              {/* TIER 3: RECORDS AND ARCHIVES MODULES */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs shrink-0">
                <div className="mb-3">
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Records and Archives</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickAccessModules.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setActiveTab(item.targetTab)}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-emerald-500 hover:bg-emerald-50/20 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition">
                          <FaFileAlt className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-extrabold text-slate-900 leading-snug group-hover:text-emerald-700 transition truncate">{item.title}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{item.date}</p>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab(item.targetTab);
                        }}
                        className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition shadow-xs cursor-pointer shrink-0 ml-2"
                      >
                        <FaArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* OTHER TAB MODULES */}
          {activeTab === 'membership' ? (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-5">
              <MembershipRecords />
            </div>
          ) : activeTab === 'dedications' ? (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-5">
              <PastorChildDedications />
            </div>
          ) : activeTab === 'meetings' ? (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-5">
              <PastorMeetingRecords />
            </div>
          ) : activeTab === 'weddings' ? (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-5">
              <PastorWeddingsAndNotifications />
            </div>
          ) : activeTab === 'departments' ? (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-5">
              <PastorDepartments />
            </div>
          ) : activeTab === 'communication' ? (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-5">
              <PastorCommunication />
            </div>
          ) : activeTab !== 'dashboard' && (
            <div className="p-6 bg-white rounded-2xl shadow-xs border border-slate-200">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{activeTab} Workspace</h2>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

// Enlarged KPI Stat Card Component
const StatCard = ({ title, value, icon: Icon, valueColor, iconBg }) => {
  return (
    <div className="bg-white px-6 py-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">{title}</p>
        <h3 className={`text-3xl lg:text-4xl font-black ${valueColor} mt-1 tracking-tight`}>{value}</h3>
      </div>
      <div className={`p-3.5 rounded-2xl ${iconBg}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

export default ElderDashboard;