import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/api';
import PastorSidebar from './PastorSidebar';
import MembershipRecords from './modules/PastorMembership';
import PastorMeetingRecords from './modules/MeetingRecords';
import PastorChildDedications from './modules/ChildDedications';
import PastorWeddingsAndNotifications from './modules/WeddingsAndNotifications';
import PastorDepartments from './modules/PastorDepartments';
import PastorCommunication from './modules/PastorCommunication';

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

import { Upload, X, FileSpreadsheet } from 'lucide-react';

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

const PastorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Graph Toggle Filter ('All', 'Baptisms', 'TransfersIn', 'TransfersOut')
  const [chartFilter, setChartFilter] = useState('All');

  // RBAC User Role resolution
  const currentUserRole = user?.role || user?.designation || 'Senior Pastor';

  const [monthlyMetricsData, setMonthlyMetricsData] = useState([]);
  const [kpiStats, setKpiStats] = useState({
    activeMembers: 0,
    baptismsYtd: 0,
    dedicationsCount: 0,
    upcomingEventsCount: 0,
  });

  // Upcoming Church Events State (Initialized clean, loaded dynamically)
  const [eventsList, setEventsList] = useState([]);

  // Data Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importType, setImportType] = useState('membership');
  const [importFile, setImportFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch real analytics and KPI metrics from Django API
  const fetchPastorAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, eventsRes] = await Promise.all([
        API.get('analytics/').catch(() => null),
        API.get('events/upcoming/').catch(() => null)
      ]);

      let fetchedEvents = [];
      if (eventsRes?.data) {
        fetchedEvents = eventsRes.data.results || eventsRes.data || [];
        setEventsList(fetchedEvents);
      } else {
        setEventsList([]);
      }

      if (analyticsRes?.data) {
        const data = analyticsRes.data;
        setKpiStats({
          activeMembers: data.total_active_members || 0,
          baptismsYtd: data.baptisms_ytd || 0,
          dedicationsCount: data.child_dedications_total || 0,
          upcomingEventsCount: data.upcoming_events_count ?? fetchedEvents.length,
        });

        // Use real backend monthly analytics data or map empty skeleton array
        setMonthlyMetricsData(data.monthly_metrics || MONTH_NAMES.map(month => ({
          month,
          Baptisms: 0,
          TransfersIn: 0,
          TransfersOut: 0
        })));
      } else {
        setKpiStats({
          activeMembers: 0,
          baptismsYtd: 0,
          dedicationsCount: 0,
          upcomingEventsCount: fetchedEvents.length,
        });
        setMonthlyMetricsData(MONTH_NAMES.map(month => ({
          month,
          Baptisms: 0,
          TransfersIn: 0,
          TransfersOut: 0
        })));
      }
    } catch (err) {
      console.error('Failed to load Pastoral analytics:', err);
      setError('Failed to fetch system metrics. Please check network connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPastorAnalytics();
  }, [fetchPastorAnalytics]);

  // Handle Bulk Data Imports
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('type', importType);

    try {
      setUploading(true);
      await API.post('/pastor/import-data', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Data for ${importType} successfully imported!`);
      setIsImportOpen(false);
      setImportFile(null);
      fetchPastorAnalytics();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to upload data. Please verify file format.');
    } finally {
      setUploading(false);
    }
  };

  // Quick Navigation Shortcuts (Tier 3 Module updated)
  const quickAccessModules = [
    { id: 1, title: 'Membership Registry', date: 'Active Members Directory', targetTab: 'membership' },
    { id: 2, title: 'Board & Business Minutes', date: 'Meeting Records', targetTab: 'meetings' },
    { id: 3, title: 'Weddings', date: 'Upcoming & Past Registrations', targetTab: 'weddings' },
    { id: 4, title: 'Departments & Reports', date: 'Departmental Activity & Filings', targetTab: 'departments' }
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-['Roboto',sans-serif] antialiased overflow-hidden select-none">
      
      {/* SIDEBAR NAVIGATION */}
      <PastorSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={logout} 
        userRole={currentUserRole}
      />

      {/* MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        
        {/* WORKSPACE BODY */}
        <main className="flex-1 p-5 overflow-hidden flex flex-col justify-between gap-3.5">
          
          {/* Error Banner */}
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs rounded-xl flex items-center justify-between shrink-0">
              <span>{error}</span>
              <button onClick={fetchPastorAnalytics} className="underline font-bold text-rose-800 cursor-pointer">Retry</button>
            </div>
          )}

          {/* OVERVIEW & ANALYTICS TAB */}
          {activeTab === 'dashboard' && (
            <div className="flex-1 flex flex-col justify-between gap-3.5 overflow-hidden">
              
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
                <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full min-h-0">
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <div>
                      <h2 className="text-base font-black text-slate-900">Upcoming Events</h2>
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg uppercase">
                      {eventsList.length} Scheduled
                    </span>
                  </div>

                  {/* Dynamic Events List */}
                  <div className="space-y-2 overflow-y-auto pr-1 my-1 flex-1">
                    {loading ? (
                      <div className="h-full flex items-center justify-center">
                        <FaSpinner className="animate-spin text-slate-400 w-5 h-5" />
                      </div>
                    ) : eventsList.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <FaCalendarAlt className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-500">No upcoming events found</p>
                        <p className="text-[11px] text-slate-400">Scheduled events will appear here.</p>
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
                            className="p-2.5 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200 transition flex items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                {eventCategory}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">{evt.title}</h4>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-normal truncate">
                                <span className="flex items-center gap-1 shrink-0">
                                  <FaCalendarAlt className="w-2.5 h-2.5 text-slate-400" /> {eventDate}
                                </span>
                                <span className="flex items-center gap-1 truncate">
                                  <FaClock className="w-2.5 h-2.5 text-slate-400" /> {eventTime}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-[11px] font-medium text-slate-600 flex items-center gap-1 justify-end">
                                <FaMapMarkerAlt className="w-2.5 h-2.5 text-emerald-500" /> {eventLocation}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overview</span>
                    <button 
                      onClick={() => setActiveTab('departments')}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      View All <FaArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* GRAPH MODULE */}
                <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full min-h-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1 shrink-0">
                    <div>
                      <h2 className="text-base font-black text-slate-900">Membership Analytics</h2>
                      <p className="text-[11px] font-medium text-slate-400">Baptisms and Transfers</p>
                    </div>

                    {/* Interactive Filter Toggle */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {['All', 'Baptisms', 'TransfersIn', 'TransfersOut'].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setChartFilter(filter)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
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

                  <div className="w-full flex-1 min-h-0">
                    {loading ? (
                      <div className="h-full flex items-center justify-center">
                        <FaSpinner className="animate-spin text-slate-400 w-6 h-6" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyMetricsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="month" tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} />
                          <YAxis allowDecimals={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'normal' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500, paddingTop: '2px' }} />

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
                <div className="mb-2">
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Records and Archives</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickAccessModules.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setActiveTab(item.targetTab)}
                      className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 flex items-center justify-between hover:border-emerald-500 hover:bg-emerald-50/20 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition">
                          <FaFileAlt className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition">{item.title}</h3>
                          <p className="text-[11px] text-slate-500 font-normal mt-1">{item.date}</p>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab(item.targetTab);
                        }}
                        className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition shadow-xs cursor-pointer shrink-0"
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
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-4">
              <MembershipRecords />
            </div>
          ) : activeTab === 'dedications' ? (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-4">
              <PastorChildDedications />
            </div>
          ) : activeTab === 'meetings' ? (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-4">
              <PastorMeetingRecords />
            </div>
          ) : activeTab === 'weddings' ? (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-4">
              <PastorWeddingsAndNotifications />
            </div>
          ) : activeTab === 'departments' ? (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-4">
              <PastorDepartments />
            </div>
          ) : activeTab === 'communication' ? (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-4">
              <PastorCommunication />
            </div>
          ) : activeTab !== 'dashboard' && (
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-black text-slate-800 uppercase">{activeTab} Workspace</h2>
            </div>
          )}

        </main>
      </div>

      {/* DATA IMPORT MODAL */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button 
              onClick={() => setIsImportOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200">
                <FileSpreadsheet size={26} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg uppercase tracking-wide">Import Church Data</h3>
                <p className="text-xs text-slate-500 font-normal">Upload CSV or Excel spreadsheets</p>
              </div>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Target Category</label>
                <select 
                  value={importType} 
                  onChange={(e) => setImportType(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl p-3 outline-emerald-500"
                >
                  <option value="membership">Membership Records</option>
                  <option value="weddings">Wedding Notifications</option>
                  <option value="pulpit">Pulpit Rosters</option>
                  <option value="events">Church Events</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Select File (.csv, .xlsx)</label>
                <input 
                  type="file" 
                  accept=".csv, .xlsx, .xls"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 border border-slate-300 rounded-xl cursor-pointer"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 text-xs font-black text-slate-950 bg-emerald-500 hover:bg-emerald-600 rounded-xl transition uppercase tracking-wider"
                >
                  {uploading ? 'Uploading...' : 'Start Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Enlarged KPI Stat Card Component
const StatCard = ({ title, value, icon: Icon, valueColor, iconBg }) => {
  return (
    <div className="bg-white px-6 py-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">{title}</p>
        <h3 className={`text-3xl font-black ${valueColor} mt-2 tracking-tight`}>{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl ${iconBg}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

export default PastorDashboard;