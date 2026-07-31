import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/api';
import DepartmentSidebar from './DepartmentSidebar';

// Departmental Shared Workspace Modules
import DepartmentPortal from '../Department/modules/DepartmentPortal';
import DepartmentEventsWorkspace from '../Department/modules/DepartmentEventsWorkspace';
import Departmentalmeetings from '../Department/modules/Departmentmeetings';
import Reports from '../Department/modules/Reports';

// Icons
import { 
  FaBuilding, 
  FaCalendarAlt, 
  FaFileAlt, 
  FaArrowRight,
  FaSpinner,
  FaClock,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaHourglassHalf,
  FaUsers,
  FaChartLine
} from 'react-icons/fa';

import { X, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';

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

// Helper to generate empty 12-month calendar template
const createEmptyYearData = () => MONTH_NAMES.map(month => ({
  month,
  Events: 0,
  Meetings: 0,
  Reports: 0
}));

const DepartmentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Graph Filter Toggle ('All', 'Events', 'Meetings', 'Reports')
  const [chartFilter, setChartFilter] = useState('All');

  // Role resolution
  const currentUserRole = user?.role || user?.designation || 'Church Clerk';

  // Analytics State spanning Jan -> Dec
  const [departmentMetricsData, setDepartmentMetricsData] = useState(createEmptyYearData());

  const [kpiStats, setKpiStats] = useState({
    totalDepartments: 0,
    upcomingEventsCount: 0,
    meetingsLoggedCount: 0,
    reportsSubmittedCount: 0,
  });

  // Upcoming Events State
  const [eventsList, setEventsList] = useState([]);

  // Upload/Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importType, setImportType] = useState('event_proposal');
  const [importFile, setImportFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch real analytics & records directly from Django models
  const fetchDepartmentAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, deptsRes, eventsRes, meetingsRes, reportsRes] = await Promise.all([
        API.get('departments/analytics/').catch(() => null),
        API.get('departments/').catch(() => null),
        API.get('departmental-events/').catch(() => null),
        API.get('departmental-meetings/').catch(() => null),
        API.get('departmental-reports/').catch(() => null),
      ]);

      // 1. Calculate Exact Department Count (Department model)
      let deptsList = [];
      if (deptsRes?.data) {
        deptsList = Array.isArray(deptsRes.data) ? deptsRes.data : deptsRes.data.results || [];
      }
      const actualDeptCount = deptsList.length > 0 
        ? deptsList.length 
        : (analyticsRes?.data?.total_departments || 0);

      // 2. Parse Departmental Events
      let fetchedEvents = [];
      if (eventsRes?.data) {
        fetchedEvents = Array.isArray(eventsRes.data) ? eventsRes.data : eventsRes.data.results || [];
      }
      setEventsList(fetchedEvents.slice(0, 5)); // Display top 5 upcoming

      // 3. Parse Departmental Meetings
      let meetingsList = [];
      if (meetingsRes?.data) {
        meetingsList = Array.isArray(meetingsRes.data) ? meetingsRes.data : meetingsRes.data.results || [];
      }

      // 4. Parse Departmental Reports (DepartmentalReport model)
      let reportsList = [];
      if (reportsRes?.data) {
        reportsList = Array.isArray(reportsRes.data) ? reportsRes.data : reportsRes.data.results || [];
      }

      // Set Updated KPI Cards
      setKpiStats({
        totalDepartments: actualDeptCount,
        upcomingEventsCount: analyticsRes?.data?.upcoming_events_count ?? fetchedEvents.length,
        meetingsLoggedCount: analyticsRes?.data?.meetings_count ?? meetingsList.length,
        reportsSubmittedCount: analyticsRes?.data?.total_reports ?? reportsList.length,
      });

      // 5. Construct 12-Month Bar Graph Dataset (Jan -> Dec)
      const fullYearData = createEmptyYearData();

      if (Array.isArray(analyticsRes?.data?.monthly_department_metrics) && analyticsRes.data.monthly_department_metrics.length > 0) {
        // Merge API analytics response into 12-month array
        analyticsRes.data.monthly_department_metrics.forEach(item => {
          const index = fullYearData.findIndex(m => m.month.toLowerCase() === item.month?.toLowerCase());
          if (index !== -1) {
            fullYearData[index].Events = item.Events || 0;
            fullYearData[index].Meetings = item.Meetings || 0;
            fullYearData[index].Reports = item.Reports || 0;
          }
        });
      } else {
        // Dynamically aggregate counts per month from fetched model lists
        fetchedEvents.forEach(evt => {
          const dStr = evt.start_date || evt.date;
          if (dStr) {
            const monthIdx = new Date(dStr).getMonth();
            if (monthIdx >= 0 && monthIdx < 12) fullYearData[monthIdx].Events += 1;
          }
        });

        meetingsList.forEach(mtg => {
          const dStr = mtg.date;
          if (dStr) {
            const monthIdx = new Date(dStr).getMonth();
            if (monthIdx >= 0 && monthIdx < 12) fullYearData[monthIdx].Meetings += 1;
          }
        });

        reportsList.forEach(rpt => {
          const dStr = rpt.date || rpt.uploaded_at;
          if (dStr) {
            const monthIdx = new Date(dStr).getMonth();
            if (monthIdx >= 0 && monthIdx < 12) fullYearData[monthIdx].Reports += 1;
          }
        });
      }

      setDepartmentMetricsData(fullYearData);

    } catch (err) {
      console.error('Failed to load Department analytics:', err);
      setError('Failed to fetch departmental metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartmentAnalytics();
  }, [fetchDepartmentAnalytics]);

  // Handle Document Uploads
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('type', importType);

    try {
      setUploading(true);
      await API.post('/departments/upload-record/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Document/Media for ${importType} successfully submitted!`);
      setIsImportOpen(false);
      setImportFile(null);
      fetchDepartmentAnalytics();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please verify file format.');
    } finally {
      setUploading(false);
    }
  };

  // Operational Directory Shortcuts
  const quickAccessModules = [
    { 
      id: 1, 
      title: 'Departments & TORs', 
      desc: 'Roles, leadership rosters & terms of reference', 
      targetTab: 'departments', 
      icon: FaBuilding,
      color: 'text-emerald-600 bg-emerald-500/10'
    },
    { 
      id: 2, 
      title: 'Events Calendar', 
      desc: 'Church events & board approval statuses', 
      targetTab: 'events', 
      icon: FaCalendarAlt,
      color: 'text-blue-600 bg-blue-500/10'
    },
    { 
      id: 3, 
      title: 'Departmental Meetings', 
      desc: 'Tabled agendas, confirmed minutes & attendance logs', 
      targetTab: 'meetings', 
      icon: FaUsers,
      color: 'text-purple-600 bg-purple-500/10'
    },
    { 
      id: 4, 
      title: 'Reports & Budgets', 
      desc: 'Quarterly departmental submissions & financial requests', 
      targetTab: 'reports', 
      icon: FaFileAlt,
      color: 'text-amber-600 bg-amber-500/10'
    }
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-['Plus_Jakarta_Sans',sans-serif] antialiased overflow-hidden select-none text-slate-800">
      
      {/* SIDEBAR NAVIGATION */}
      <DepartmentSidebar 
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
              <button onClick={fetchDepartmentAnalytics} className="underline font-extrabold text-rose-800 cursor-pointer hover:text-rose-950">Retry</button>
            </div>
          )}

          {/* OVERVIEW & ANALYTICS TAB */}
          {activeTab === 'dashboard' && (
            <div className="flex-1 flex flex-col justify-between gap-4 overflow-hidden">
              
              {/* TIER 1: ENLARGED CHURCH CLERK KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <StatCard 
                  title="Active Departments" 
                  value={loading ? '...' : kpiStats.totalDepartments} 
                  icon={FaBuilding} 
                  valueColor="text-emerald-600"
                  iconBg="bg-emerald-500/10 text-emerald-600"
                />
                <StatCard 
                  title="Upcoming Events" 
                  value={loading ? '...' : kpiStats.upcomingEventsCount} 
                  icon={FaCalendarAlt} 
                  valueColor="text-blue-600"
                  iconBg="bg-blue-500/10 text-blue-600"
                />
                <StatCard 
                  title="Meetings & Minutes Filed" 
                  value={loading ? '...' : kpiStats.meetingsLoggedCount} 
                  icon={FaUsers} 
                  valueColor="text-purple-600"
                  iconBg="bg-purple-500/10 text-purple-600"
                />
                <StatCard 
                  title="Reports Submitted" 
                  value={loading ? '...' : kpiStats.reportsSubmittedCount} 
                  icon={FaFileAlt} 
                  valueColor="text-amber-600"
                  iconBg="bg-amber-500/10 text-amber-600"
                />
              </div>

              {/* TIER 2: ASYMMETRIC GRID (EVENTS & 12-MONTH ANALYTICS) */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
                
                {/* UPCOMING DEPARTMENTAL EVENTS MODULE */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full min-h-0">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Upcoming Church Events</h2>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">Schedules submitted for clerk & board review</p>
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
                        <p className="text-sm font-bold text-slate-600">No scheduled activities</p>
                        <p className="text-xs text-slate-400 mt-0.5">Department leaders can submit new events.</p>
                      </div>
                    ) : (
                      eventsList.map((evt) => {
                        const eventCategory = evt.department_name || evt.category || 'General';
                        const eventDate = evt.start_date || evt.date || 'TBD';
                        const eventTime = evt.start_time || evt.time || 'All Day';
                        const eventLocation = evt.venue || evt.location || 'Main Sanctuary';
                        const status = evt.status || 'PROPOSED';

                        return (
                          <div 
                            key={evt.id} 
                            className="p-3 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 transition flex items-center justify-between gap-3"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                                  {eventCategory}
                                </span>
                                {status === 'APPROVED' ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    <FaCheckCircle className="w-2.5 h-2.5" /> Approved
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    <FaHourglassHalf className="w-2.5 h-2.5" /> Pending Board
                                  </span>
                                )}
                              </div>
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
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clerk Desk Workflow</span>
                    <button 
                      onClick={() => setActiveTab('events')}
                      className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer transition"
                    >
                      View Full Calendar <FaArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* GRAPH MODULE: 12-MONTH DEPARTMENTAL FILINGS (JAN - DEC) */}
                <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full min-h-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 shrink-0">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <FaChartLine className="text-emerald-600 w-5 h-5" /> Departmental Submissions & Activity
                      </h2>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">Annual tracking of events, logged minutes, and submitted reports (Jan - Dec)</p>
                    </div>

                    {/* Interactive Filter Toggle */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {['All', 'Events', 'Meetings', 'Reports'].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setChartFilter(filter)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                            chartFilter === filter 
                              ? 'bg-slate-950 text-white shadow-xs' 
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {filter}
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
                        <BarChart data={departmentMetricsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="month" tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                          <YAxis allowDecimals={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '500', padding: '10px 14px' }} />
                          <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '8px' }} />

                          {(chartFilter === 'All' || chartFilter === 'Events') && (
                            <Bar dataKey="Events" name="Events Conducted" fill="#10B981" radius={[4, 4, 0, 0]} />
                          )}
                          {(chartFilter === 'All' || chartFilter === 'Meetings') && (
                            <Bar dataKey="Meetings" name="Meetings & Minutes Filed" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                          )}
                          {(chartFilter === 'All' || chartFilter === 'Reports') && (
                            <Bar dataKey="Reports" name="Proposals & Reports" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </div>

              {/* TIER 3: OPERATIONS DIRECTORY SHORTCUTS */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs shrink-0">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Church Clerk Operations Directory</h2>
                  <span className="text-xs font-bold text-slate-400">Quick Access to Key Desk Modules</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickAccessModules.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => setActiveTab(item.targetTab)}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-emerald-500 hover:bg-emerald-50/20 transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-extrabold text-slate-900 leading-snug group-hover:text-emerald-700 transition truncate">{item.title}</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{item.desc}</p>
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
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* WORKSPACE TAB MODULE ROUTING */}
          {activeTab === 'departments' ? (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-5">
              <DepartmentPortal />
            </div>
          ) : 
          activeTab === 'meetings' ? (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-5">
              <Departmentalmeetings />
            </div>
          ) : 
          activeTab === 'events' ? (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-5">
              <DepartmentEventsWorkspace />
            </div>
          ) : 
          activeTab === 'reports' ? (
            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xs p-5">
              <Reports />
            </div>
          ) : 
          activeTab !== 'dashboard' && (
            <div className="p-6 bg-white rounded-2xl shadow-xs border border-slate-200 flex flex-col items-center justify-center h-full text-center">
              <ImageIcon className="w-12 h-12 text-slate-300 mb-3" />
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{activeTab} Workspace</h2>
            </div>
          )}

        </main>
      </div>

      {/* DOCUMENT / MEDIA UPLOAD MODAL */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative font-['Plus_Jakarta_Sans',sans-serif]">
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
                <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Upload Department Record</h3>
                <p className="text-xs text-slate-500 font-medium">Submit minutes, proposals, or activity reports</p>
              </div>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Record Type</label>
                <select 
                  value={importType} 
                  onChange={(e) => setImportType(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-3 outline-emerald-500"
                >
                  <option value="event_proposal">Event Proposal (For Board Approval)</option>
                  <option value="budget">Budget Request</option>
                  <option value="minutes">Meeting Minutes / Report</option>
                  <option value="media_proof">Activity Photos / Digital Proof</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Attach File (.pdf, .png, .jpg, .xlsx)</label>
                <input 
                  type="file" 
                  accept=".pdf, .jpg, .jpeg, .png, .xlsx, .docx"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 border border-slate-300 rounded-xl cursor-pointer"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 text-xs font-black text-slate-950 bg-emerald-500 hover:bg-emerald-600 rounded-xl transition uppercase tracking-wider"
                >
                  {uploading ? 'Uploading...' : 'Submit File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// KPI Stat Card Component
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

export default DepartmentDashboard;