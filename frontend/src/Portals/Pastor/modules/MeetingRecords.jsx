import React, { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../../../api/api';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Download, 
  Search, 
  Users, 
  X, 
  Printer, 
  FileCheck,
  Eye,
  FolderArchive,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
    <div>
      <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{title}</p>
      <h3 className={`text-3xl font-black ${color} mt-1 tracking-tight`}>{value}</h3>
    </div>
    <div className={`p-4 rounded-xl ${bg}`}>
      <Icon size={24} />
    </div>
  </div>
);

export default function PastorMeetingRecords({ userRole = 'Church Clerk' }) {
  // Sub-tabs: 'meetings' | 'attendance' | 'vault'
  const [activeTab, setActiveTab] = useState('meetings');

  // API Data States
  const [meetings, setMeetings] = useState([]);
  const [boardAttendance, setBoardAttendance] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Drawers
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const meetingCategories = [
    'All Categories',
    'Board Meetings',
    'Business Meetings',
    'Membership Reviews',
    'Delegate Related Meetings',
    'Election Process Meetings',
    'Committee Reporting Meetings'
  ];

  // FETCH DATA FROM BACKEND
  const fetchMeetingsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [meetingsRes, matrixRes, deptsRes] = await Promise.all([
        API.get('/meetings/'),
        API.get('/meetings/board_attendance_matrix/'),
        API.get('/departments/')
      ]);

      setMeetings(meetingsRes.data.results || meetingsRes.data || []);
      setBoardAttendance(matrixRes.data.results || matrixRes.data || []);
      setDepartments(deptsRes.data.results || deptsRes.data || []);
    } catch (err) {
      console.error('Failed to load meeting records:', err);
      setError('Failed to fetch meeting records. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetingsData();
  }, [fetchMeetingsData]);

  // Extract all documents for Vault View (Memoized)
  const vaultDocuments = useMemo(() => {
    return meetings.flatMap((m) => {
      const docs = [];
      if (m.minutes_doc) {
        docs.push({
          id: `min-${m.id}`,
          name: m.minutes_doc.split('/').pop() || 'Confirmed_Minutes.pdf',
          url: m.minutes_doc,
          type: 'Confirmed Minutes',
          meetingRef: m.meeting_ref,
          category: m.category,
          date: m.date,
          venue: m.venue
        });
      }
      if (m.agenda_doc) {
        docs.push({
          id: `ag-${m.id}`,
          name: m.agenda_doc.split('/').pop() || 'Tabled_Agenda.pdf',
          url: m.agenda_doc,
          type: 'Tabled Agenda',
          meetingRef: m.meeting_ref,
          category: m.category,
          date: m.date,
          venue: m.venue
        });
      }
      if (m.physical_sheet) {
        docs.push({
          id: `sheet-${m.id}`,
          name: m.physical_sheet.split('/').pop() || 'SignIn_Sheet.pdf',
          url: m.physical_sheet,
          type: 'Scanned Sign-In Sheet',
          meetingRef: m.meeting_ref,
          category: m.category,
          date: m.date,
          venue: m.venue
        });
      }
      return docs;
    });
  }, [meetings]);

  // Filtered Meetings List (Memoized)
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const matchesSearch = 
        (m.meeting_ref || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (m.venue || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All Categories' || m.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [meetings, searchTerm, selectedCategory]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm font-bold gap-3">
        <Loader2 className="animate-spin text-emerald-600" size={30} />
        <p className="text-slate-600">Loading Meeting & Attendance Archives...</p>
      </div>
    );
  }

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif] antialiased space-y-6 text-slate-800 select-none text-sm">
      
      {/* PRINT MEDIA STYLING */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-sheet, #printable-sheet * { visibility: visible; }
          #printable-sheet { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
        }
      `}</style>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm font-bold text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </div>
          <button onClick={fetchMeetingsData} className="underline hover:text-rose-900 cursor-pointer">Retry</button>
        </div>
      )}

      {/* HEADER & SUB-NAV TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Meetings & Attendance Desk
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Official archives for board proceedings, agendas, minutes, and attendance tracking
          </p>
        </div>

        {/* CONTROLS & SUB-TABS */}
        <div className="flex items-center gap-2 overflow-x-auto bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 shrink-0">
          {[
            { id: 'meetings', label: 'Meeting Records', icon: FileText },
            { id: 'attendance', label: 'Attendance Matrix', icon: Users },
            { id: 'vault', label: 'Document Vault', icon: FolderArchive }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? 'bg-slate-950 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} /> 
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI METRICS */}
      {activeTab !== 'vault' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <StatCard title="Total Meetings" value={meetings.length} icon={Calendar} color="text-emerald-700" bg="bg-emerald-50" />
          <StatCard title="Minutes Confirmed" value={meetings.filter(m => m.minutes_doc).length} icon={FileCheck} color="text-blue-700" bg="bg-blue-50" />
          <StatCard title="Archived Documents" value={vaultDocuments.length} icon={FolderArchive} color="text-purple-700" bg="bg-purple-50" />
          <StatCard title="Board Members Tracked" value={boardAttendance.length} icon={Users} color="text-indigo-700" bg="bg-indigo-50" />
        </div>
      )}

      {/* SEARCH AND FILTERS TOOLBAR */}
      {activeTab !== 'vault' && (
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="relative w-full sm:w-96">
            <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
            <input 
              type="text"
              placeholder="Search reference, venue, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700">
              <Filter size={15} className="text-emerald-600" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent focus:outline-none font-bold text-slate-800 cursor-pointer text-xs"
              >
                {meetingCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {activeTab === 'attendance' && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-950 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Printer size={15} />
                <span>Print Tracker</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: OFFICIAL MEETINGS TABLE */}
      {activeTab === 'meetings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-xs">
                  <th className="py-3.5 px-5 border-r border-slate-100">Meeting Ref & Date</th>
                  <th className="py-3.5 px-5 border-r border-slate-100">Category</th>
                  <th className="py-3.5 px-5 border-r border-slate-100">Leadership Team</th>
                  <th className="py-3.5 px-5 border-r border-slate-100">Clerk</th>
                  <th className="py-3.5 px-5 border-r border-slate-100">Documents Attached</th>
                  <th className="py-3.5 px-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredMeetings.length > 0 ? (
                  filteredMeetings.map((m) => (
                    <tr 
                      key={m.id} 
                      onClick={() => setSelectedMeeting(m)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="py-4 px-5 border-r border-slate-100">
                        <span className="font-extrabold text-emerald-800 text-xs bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200/80 inline-block mb-1.5">
                          {m.meeting_ref}
                        </span>
                        <div className="font-extrabold text-slate-900 text-sm">{m.date}</div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-1">
                          <Clock size={13} /> {m.time}
                        </div>
                      </td>

                      <td className="py-4 px-5 border-r border-slate-100">
                        <span className="bg-slate-100 text-slate-800 font-extrabold text-xs uppercase px-3 py-1.5 rounded-md border border-slate-200 inline-block">
                          {m.category}
                        </span>
                      </td>

                      <td className="py-4 px-5 border-r border-slate-100 space-y-1">
                        <div className="text-xs font-bold text-slate-900">Chair: <span className="font-medium text-slate-600">{m.chairperson}</span></div>
                        <div className="text-xs font-bold text-slate-900">Pastor: <span className="font-medium text-slate-600">{m.pastor}</span></div>
                      </td>

                      <td className="py-4 px-5 font-bold text-slate-900 text-xs border-r border-slate-100">
                        {m.clerk}
                      </td>

                      <td className="py-4 px-5 border-r border-slate-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1.5">
                          {m.agenda_doc ? (
                            <a href={m.agenda_doc} download target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline">
                              <Download size={14} /> Agenda Doc
                            </a>
                          ) : <span className="text-xs text-slate-400">No Agenda</span>}

                          {m.minutes_doc ? (
                            <a href={m.minutes_doc} download target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline">
                              <Download size={14} /> Confirmed Minutes
                            </a>
                          ) : <span className="text-xs text-amber-700 font-bold">Minutes Pending</span>}
                        </div>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <button className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 font-bold text-xs">
                      No meeting records match your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BOARD ATTENDANCE MATRIX */}
      {activeTab === 'attendance' && (
        <div id="printable-sheet" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-5">
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">NEWLIFE ADVENTIST CHURCH, NAIROBI</h2>
            <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-widest mt-1">CHURCH BOARD ATTENDANCE TRACKER MATRIX</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-black uppercase text-xs">
                  <th className="border border-slate-300 py-3 px-3 text-center">S/No.</th>
                  <th className="border border-slate-300 py-3 px-4">Name</th>
                  <th className="border border-slate-300 py-3 px-4">Department / Ministry</th>
                  <th className="border border-slate-300 py-3 px-4">Designation</th>
                  <th className="border border-slate-300 py-3 px-3 text-center">Total Meetings</th>
                  <th className="border border-slate-300 py-3 px-3 text-center">Present</th>
                  <th className="border border-slate-300 py-3 px-3 text-center">% Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-semibold text-slate-800 text-xs">
                {boardAttendance.map((row, index) => (
                  <tr key={row.sNo || index} className="hover:bg-slate-50 transition">
                    <td className="border border-slate-300 py-2.5 px-3 text-center font-bold text-slate-500">{row.sNo || index + 1}</td>
                    <td className="border border-slate-300 py-2.5 px-4 font-extrabold text-slate-900 text-xs">{row.name}</td>
                    <td className="border border-slate-300 py-2.5 px-4 text-slate-600">{row.dept || row.department_name}</td>
                    <td className="border border-slate-300 py-2.5 px-4 font-bold text-emerald-800">
                      {row.designation || row.role || 'Board Member'}
                    </td>
                    <td className="border border-slate-300 py-2.5 px-3 text-center font-bold">{row.total_meetings}</td>
                    <td className="border border-slate-300 py-2.5 px-3 text-center font-bold">{row.present_count}</td>
                    <td className="border border-slate-300 py-2.5 px-3 text-center font-extrabold text-emerald-700">{row.percentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-slate-500">
            <div>KEY: [PR] - Present | [AA] - Absent with Apology | [WA] - Absent without Apology</div>
            <div className="font-extrabold text-slate-900">NEWLIFE CHURCH CLERK INFORMATION SYSTEM</div>
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENT VAULT */}
      {activeTab === 'vault' && (
        <div className="space-y-4 print:hidden">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
              <input 
                type="text"
                placeholder="Search document name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700">
              <Filter size={15} className="text-emerald-600" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent focus:outline-none font-bold text-slate-800 cursor-pointer text-xs"
              >
                {meetingCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {vaultDocuments
              .filter(doc => selectedCategory === 'All Categories' || doc.category === selectedCategory)
              .filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((doc) => (
                <div 
                  key={doc.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded tracking-wider ${
                        doc.type === 'Confirmed Minutes' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        doc.type === 'Tabled Agenda' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}>
                        {doc.type}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{doc.date}</span>
                    </div>

                    <div 
                      onClick={() => setPreviewDoc(doc)}
                      className="w-full h-24 bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 my-2.5 cursor-pointer relative overflow-hidden group-hover:border-emerald-300 group-hover:bg-emerald-50/20 transition flex flex-col justify-between"
                    >
                      <div className="space-y-1.5 opacity-60">
                        <div className="h-1.5 bg-slate-400 rounded w-3/4"></div>
                        <div className="h-1.5 bg-slate-300 rounded w-full"></div>
                        <div className="h-1.5 bg-slate-300 rounded w-5/6"></div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 font-extrabold border-t border-slate-200/60 pt-1.5">
                        <span>PREVIEW</span>
                        <Eye size={14} className="text-slate-500 group-hover:text-emerald-700" />
                      </div>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-xs line-clamp-2 leading-tight mt-1" title={doc.name}>
                      {doc.name}
                    </h4>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-slate-100">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      title="Preview Document"
                      className="flex items-center justify-center p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition cursor-pointer"
                    >
                      <Eye size={15} />
                    </button>

                    <a
                      href={doc.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      title="Download Document"
                      className="flex items-center justify-center p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg transition cursor-pointer"
                    >
                      <Download size={15} />
                    </a>

                    <button
                      onClick={() => {
                        const printWindow = window.open(doc.url, '_blank');
                        printWindow?.print();
                      }}
                      title="Print Document"
                      className="flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition cursor-pointer"
                    >
                      <Printer size={15} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW DOCUMENT */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden h-[85vh] flex flex-col">
            <div className="bg-slate-900 p-4.5 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-bold text-emerald-400">{previewDoc.category} ({previewDoc.date})</p>
                <h3 className="font-extrabold text-base">{previewDoc.name}</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 flex-1 bg-slate-100 flex flex-col items-center justify-center">
              <iframe 
                src={previewDoc.url} 
                title={previewDoc.name}
                className="w-full h-full rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: MEETING DETAILS */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <div>
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">
                  {selectedMeeting.meeting_ref} • {selectedMeeting.category}
                </span>
                <h3 className="font-extrabold text-base mt-0.5">{selectedMeeting.venue}</h3>
              </div>
              <button onClick={() => setSelectedMeeting(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <p className="text-xs font-extrabold text-slate-400 uppercase">Date</p>
                  <p className="font-extrabold text-slate-900 text-xs">{selectedMeeting.date}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-400 uppercase">Time</p>
                  <p className="font-extrabold text-slate-900 text-xs">{selectedMeeting.time}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-400 uppercase">Status</p>
                  <p className="font-extrabold text-emerald-700 text-xs">{selectedMeeting.status || 'Concluded'}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-400 uppercase">Chairperson</p>
                  <p className="font-bold text-slate-800 text-xs">{selectedMeeting.chairperson}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-400 uppercase">Pastor</p>
                  <p className="font-bold text-slate-800 text-xs">{selectedMeeting.pastor}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-400 uppercase">Clerk</p>
                  <p className="font-bold text-slate-800 text-xs">{selectedMeeting.clerk}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2.5">Attached Official Files</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedMeeting.agenda_doc ? (
                    <a href={selectedMeeting.agenda_doc} download target="_blank" rel="noreferrer" className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition">
                      <Download size={15} /> Tabled Agenda
                    </a>
                  ) : <div className="p-3 bg-slate-50 text-xs text-slate-400 rounded-xl">No Agenda</div>}

                  {selectedMeeting.minutes_doc ? (
                    <a href={selectedMeeting.minutes_doc} download target="_blank" rel="noreferrer" className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs font-bold text-blue-900 hover:bg-blue-100 transition">
                      <Download size={15} /> Confirmed Minutes
                    </a>
                  ) : <div className="p-3 bg-amber-50 text-xs text-amber-800 font-bold rounded-xl">Minutes Pending</div>}

                  {selectedMeeting.physical_sheet ? (
                    <a href={selectedMeeting.physical_sheet} download target="_blank" rel="noreferrer" className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2 text-xs font-bold text-purple-900 hover:bg-purple-100 transition">
                      <Download size={15} /> Physical Sheet
                    </a>
                  ) : <div className="p-3 bg-slate-50 text-xs text-slate-400 rounded-xl">No Physical Sheet</div>}
                </div>
              </div>

              {selectedMeeting.attendances && selectedMeeting.attendances.length > 0 && (
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2.5">Logged Attendees</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold text-xs">
                        <tr>
                          <th className="p-2.5 border-r border-slate-200">Member Name</th>
                          <th className="p-2.5 border-r border-slate-200">Department</th>
                          <th className="p-2.5 border-r border-slate-200">Status</th>
                          <th className="p-2.5">Times</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-xs">
                        {selectedMeeting.attendances.map((att) => (
                          <tr key={att.id}>
                            <td className="p-2.5 font-bold text-slate-800 border-r border-slate-100">{att.member_name}</td>
                            <td className="p-2.5 text-slate-600 border-r border-slate-100">{att.department_name || 'N/A'}</td>
                            <td className="p-2.5 border-r border-slate-100">
                              <span className={`px-2 py-0.5 rounded text-xs font-black ${
                                att.status === 'PR' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {att.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500">{att.arrival_time || 'N/A'} - {att.departure_time || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setSelectedMeeting(null)} 
                className="px-5 py-2 bg-slate-950 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}