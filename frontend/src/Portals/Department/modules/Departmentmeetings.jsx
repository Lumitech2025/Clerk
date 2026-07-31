import React, { useState, useEffect } from 'react';
import API from '../../../api/api';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Download, 
  Plus, 
  Search, 
  Trash2, 
  Users, 
  X, 
  Eye, 
  FolderArchive, 
  Loader2,
  Filter,
  RotateCcw
} from 'lucide-react';

const DepartmentalMeetings = () => {
  const [activeTab, setActiveTab] = useState('meetings');

  // API Data States
  const [meetings, setMeetings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal & Filter States
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Documents Vault Specific Filters
  const [docDeptFilter, setDocDeptFilter] = useState('');
  const [docYearFilter, setDocYearFilter] = useState('');
  const [docMonthFilter, setDocMonthFilter] = useState('');

  // Form State
  const [meetingForm, setMeetingForm] = useState({
    departmentId: '',
    meetingType: 'Monthly',
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    agendaFile: null,
    minutesFile: null
  });

  const [membersPresent, setMembersPresent] = useState([
    { name: '', role: '' }
  ]);

  // Fetch initial data
  const fetchMeetingsData = async () => {
    try {
      setLoading(true);
      const [meetingsRes, deptsRes] = await Promise.all([
        API.get('/departmental-meetings/'),
        API.get('/departments/')
      ]);
      setMeetings(meetingsRes.data.results || meetingsRes.data);
      setDepartments(deptsRes.data.results || deptsRes.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to fetch meeting records. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetingsData();
  }, []);

  // Repeater handlers
  const handleAddMember = () => {
    setMembersPresent([...membersPresent, { name: '', role: '' }]);
  };

  const handleRemoveMember = (index) => {
    if (membersPresent.length === 1) {
      setMembersPresent([{ name: '', role: '' }]);
      return;
    }
    setMembersPresent(membersPresent.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...membersPresent];
    updated[index][field] = value;
    setMembersPresent(updated);
  };

  // Submit Handler
  const handleMeetingSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('department', meetingForm.departmentId);
      formData.append('meeting_type', meetingForm.meetingType);
      formData.append('title', meetingForm.title);
      formData.append('date', meetingForm.date);
      if (meetingForm.startTime) formData.append('start_time', meetingForm.startTime);
      if (meetingForm.endTime) formData.append('end_time', meetingForm.endTime);
      formData.append('venue', meetingForm.venue);
      
      const validMembers = membersPresent.filter(m => m.name.trim() !== '');
      formData.append('members_present', JSON.stringify(validMembers));

      if (meetingForm.agendaFile) formData.append('agenda_doc', meetingForm.agendaFile);
      if (meetingForm.minutesFile) formData.append('minutes_doc', meetingForm.minutesFile);

      await API.post('/departmental-meetings/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setIsMeetingModalOpen(false);
      setMeetingForm({
        departmentId: '',
        meetingType: 'Monthly',
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        venue: '',
        agendaFile: null,
        minutesFile: null
      });
      setMembersPresent([{ name: '', role: '' }]);
      fetchMeetingsData();
    } catch (err) {
      console.error('Error saving departmental meeting:', err);
      alert('Failed to save departmental meeting record.');
    }
  };

  // Build Vault documents list with Department metadata attached
  const vaultDocuments = meetings.flatMap(m => {
    const docs = [];
    const minUrl = m.minutes_doc_url || m.minutes_doc;
    const agUrl = m.agenda_doc_url || m.agenda_doc;
    const deptName = m.department_name || m.department?.name || 'General';
    const deptId = m.department?.id || m.department;

    if (minUrl) {
      docs.push({
        id: `min-${m.id}`,
        name: minUrl.split('/').pop(),
        url: minUrl,
        type: 'Confirmed Minutes',
        title: m.title,
        date: m.date,
        venue: m.venue,
        department: deptName,
        departmentId: deptId
      });
    }
    if (agUrl) {
      docs.push({
        id: `ag-${m.id}`,
        name: agUrl.split('/').pop(),
        url: agUrl,
        type: 'Tabled Agenda',
        title: m.title,
        date: m.date,
        venue: m.venue,
        department: deptName,
        departmentId: deptId
      });
    }
    return docs;
  });

  // Filter Vault Documents by Search, Department, Year & Month
  const filteredVaultDocs = vaultDocuments.filter(doc => {
    const matchesSearch = (doc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (doc.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = !docDeptFilter || String(doc.departmentId) === String(docDeptFilter) || doc.department === docDeptFilter;

    const docDate = new Date(doc.date);
    const docYear = docDate.getFullYear().toString();
    const docMonth = (docDate.getMonth() + 1).toString().padStart(2, '0');

    const matchesYear = !docYearFilter || docYear === docYearFilter;
    const matchesMonth = !docMonthFilter || docMonth === docMonthFilter;

    return matchesSearch && matchesDept && matchesYear && matchesMonth;
  });

  const resetVaultFilters = () => {
    setDocDeptFilter('');
    setDocYearFilter('');
    setDocMonthFilter('');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-['Plus_Jakarta_Sans',sans-serif]">
        <Loader2 className="animate-spin mb-3 text-emerald-600" size={36} />
        <p className="text-sm font-semibold">Loading Departmental Meeting Records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 antialiased">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold rounded-xl flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchMeetingsData} className="underline text-xs cursor-pointer">Retry</button>
        </div>
      )}

      {/* HEADER & TAB NAVIGATION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Departmental Meetings</h1>
          <p className="text-xs font-bold text-slate-500 mt-1">Manage departmental agendas, confirmed minutes, and attendance logs.</p>
        </div>

        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/80">
          <button
            onClick={() => setActiveTab('meetings')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              activeTab === 'meetings' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={18} />
            <span>Meeting Records</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              activeTab === 'vault' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderArchive size={18} />
            <span>Documents</span>
          </button>
        </div>
      </div>

      {/* CONTROLS & FILTER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder={activeTab === 'meetings' ? "Search meeting title, venue, or date..." : "Search document name or meeting title..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          {activeTab === 'meetings' && (
            <button 
              onClick={() => setIsMeetingModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-sm cursor-pointer transition"
            >
              <Plus size={18} />
              <span>Record Departmental Meeting</span>
            </button>
          )}
        </div>

        {/* VAULT SPECIFIC FILTERS (DEPARTMENT & TIME) */}
        {activeTab === 'vault' && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-slate-500 mr-2">
              <Filter size={15} className="text-emerald-600" />
              <span>Filter Documents By:</span>
            </div>

            {/* Department Filter */}
            <select
              value={docDeptFilter}
              onChange={(e) => setDocDeptFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={docYearFilter}
              onChange={(e) => setDocYearFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>

            {/* Month Filter */}
            <select
              value={docMonthFilter}
              onChange={(e) => setDocMonthFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">All Months</option>
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>

            {(docDeptFilter || docYearFilter || docMonthFilter || searchTerm) && (
              <button
                onClick={resetVaultFilters}
                className="flex items-center gap-1 text-slate-500 hover:text-rose-600 px-2 py-1.5 transition cursor-pointer"
              >
                <RotateCcw size={13} /> Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* TAB 1: MEETINGS TABLE */}
      {activeTab === 'meetings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase text-slate-900 tracking-wider">
                  <th className="py-4 px-6 font-black text-slate-900">DEPARTMENT</th>
                  <th className="py-4 px-6 font-black text-slate-900">SUBJECT</th>
                  <th className="py-4 px-6 font-black text-slate-900">DATE & TIME</th>
                  <th className="py-4 px-6 font-black text-slate-900">VENUE</th>
                  <th className="py-4 px-6 font-black text-slate-900">MEMBERS LOGGED</th>
                  <th className="py-4 px-6 font-black text-slate-900">DOCUMENTS</th>
                  <th className="py-4 px-6 font-black text-slate-900 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-800">
                {meetings
                  .filter(m => 
                    (m.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (m.venue || '').toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((meeting) => (
                    <tr 
                      key={meeting.id} 
                      onClick={() => setSelectedMeeting(meeting)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      {/* Separate Column 1: Department */}
                      <td className="py-5 px-6">
                        <span className="font-extrabold text-emerald-800 text-xs bg-emerald-50 px-2.5 py-1 rounded-md inline-block border border-emerald-200/80">
                          {meeting.department_name || meeting.department?.name || 'Department'}
                        </span>
                      </td>

                      {/* Separate Column 2: Subject */}
                      <td className="py-5 px-6 font-black text-slate-900">
                        {meeting.title}
                      </td>

                      <td className="py-5 px-6">
                        <div className="font-black text-slate-900">{meeting.date}</div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mt-1">
                          <Clock size={13} /> {meeting.start_time || '--:--'} - {meeting.end_time || '--:--'}
                        </div>
                      </td>

                      <td className="py-5 px-6 font-bold text-slate-700">
                        {meeting.venue}
                      </td>

                      <td className="py-5 px-6 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Users size={16} />
                          <span>{meeting.attendance_summary?.present ?? meeting.attendances?.length ?? 0} Present</span>
                        </div>
                      </td>

                      <td className="py-5 px-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1.5">
                          {meeting.agenda_doc_url || meeting.agenda_doc ? (
                            <a href={meeting.agenda_doc_url || meeting.agenda_doc} download target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline">
                              <Download size={13} /> Agenda
                            </a>
                          ) : <span className="text-xs text-slate-400 font-semibold">No Agenda</span>}

                          {meeting.minutes_doc_url || meeting.minutes_doc ? (
                            <a href={meeting.minutes_doc_url || meeting.minutes_doc} download target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-blue-800 hover:underline">
                              <Download size={13} /> Confirmed Minutes
                            </a>
                          ) : <span className="text-xs text-amber-700 font-bold">Minutes Pending</span>}
                        </div>
                      </td>

                      <td className="py-5 px-6 text-right">
                        <button className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENTS VAULT */}
      {activeTab === 'vault' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredVaultDocs.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <FolderArchive size={40} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">No documents match the selected filters.</p>
              <button onClick={resetVaultFilters} className="mt-2 text-xs text-emerald-600 font-bold underline cursor-pointer">Reset Filters</button>
            </div>
          ) : (
            filteredVaultDocs.map((doc) => (
              <div 
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  {/* Top Row: Type & Date */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider ${
                      doc.type === 'Confirmed Minutes' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {doc.type}
                    </span>
                    <span className="text-[11px] font-extrabold text-slate-500">{doc.date}</span>
                  </div>

                  {/* Department Name Tag */}
                  <div className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50/80 border border-emerald-200/70 px-2.5 py-1 rounded-md mb-2 inline-block truncate max-w-full">
                    {doc.department}
                  </div>

                  {/* Document Preview Placeholder Box */}
                  <div 
                    onClick={() => setPreviewDoc(doc)}
                    className="w-full h-24 bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 my-2 cursor-pointer relative overflow-hidden group-hover:border-emerald-300 group-hover:bg-emerald-50/20 transition flex flex-col justify-between"
                  >
                    <div className="space-y-1.5 opacity-60">
                      <div className="h-1.5 bg-slate-400 rounded w-3/4"></div>
                      <div className="h-1 bg-slate-300 rounded w-full"></div>
                      <div className="h-1 bg-slate-300 rounded w-5/6"></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-extrabold border-t border-slate-200/60 pt-1">
                      <span>PREVIEW</span>
                      <Eye size={12} className="text-slate-500 group-hover:text-emerald-700" />
                    </div>
                  </div>

                  <h4 className="font-black text-slate-900 text-xs line-clamp-2 leading-tight mt-1" title={doc.name}>
                    {doc.name}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-3 mt-3 border-t border-slate-100">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="flex items-center justify-center p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition cursor-pointer"
                    title="Preview Document"
                  >
                    <Eye size={14} />
                  </button>
                  <a
                    href={doc.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg transition cursor-pointer"
                    title="Download Document"
                  >
                    <Download size={14} />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL: RECORD DEPARTMENTAL MEETING */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Calendar className="text-emerald-400" size={20} /> Record Departmental Meeting
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Upload agendas, minutes and log attendance details.</p>
              </div>
              <button onClick={() => setIsMeetingModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <form onSubmit={handleMeetingSubmit} className="p-6 space-y-4 text-sm font-semibold overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">DEPARTMENT *</label>
                  <select 
                    required
                    value={meetingForm.departmentId}
                    onChange={(e) => setMeetingForm({...meetingForm, departmentId: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">MEETING TYPE *</label>
                  <select 
                    value={meetingForm.meetingType}
                    onChange={(e) => setMeetingForm({...meetingForm, meetingType: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Planning">Planning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">MEETING TITLE / SUBJECT *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Strategic Planning & Workstation Review" 
                  value={meetingForm.title} 
                  onChange={(e) => setMeetingForm({...meetingForm, title: e.target.value})} 
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">DATE *</label>
                  <input 
                    type="date" 
                    required 
                    value={meetingForm.date} 
                    onChange={(e) => setMeetingForm({...meetingForm, date: e.target.value})} 
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">START TIME</label>
                  <input 
                    type="time" 
                    value={meetingForm.startTime} 
                    onChange={(e) => setMeetingForm({...meetingForm, startTime: e.target.value})} 
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">END TIME</label>
                  <input 
                    type="time" 
                    value={meetingForm.endTime} 
                    onChange={(e) => setMeetingForm({...meetingForm, endTime: e.target.value})} 
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">VENUE / LOCATION *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Main Sanctuary / Boardroom / Zoom Link" 
                  value={meetingForm.venue} 
                  onChange={(e) => setMeetingForm({...meetingForm, venue: e.target.value})} 
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                  <label className="block text-slate-700 font-bold text-xs uppercase mb-1">UPLOAD AGENDA DOCUMENT</label>
                  <p className="text-[10px] text-slate-500 mb-2">PDF, DOC, DOCX up to 10MB</p>
                  <input 
                    type="file" 
                    onChange={(e) => setMeetingForm({...meetingForm, agendaFile: e.target.files[0]})} 
                    className="w-full text-xs text-slate-600 cursor-pointer" 
                  />
                </div>

                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                  <label className="block text-slate-700 font-bold text-xs uppercase mb-1">UPLOAD MINUTES DOCUMENT</label>
                  <p className="text-[10px] text-slate-500 mb-2">PDF, DOC, DOCX up to 10MB</p>
                  <input 
                    type="file" 
                    onChange={(e) => setMeetingForm({...meetingForm, minutesFile: e.target.files[0]})} 
                    className="w-full text-xs text-slate-600 cursor-pointer" 
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-slate-800 font-black text-xs uppercase">MEMBERS PRESENT (MEMBER & ROLE)</label>
                    <p className="text-xs text-slate-500 font-medium">Record attendee names and their respective roles.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddMember}
                    className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 transition cursor-pointer"
                  >
                    <Plus size={14} /> Add Member
                  </button>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {membersPresent.map((member, index) => (
                    <div key={index} className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          placeholder="Member Name" 
                          value={member.name} 
                          onChange={(e) => handleMemberChange(index, 'name', e.target.value)} 
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500" 
                        />
                      </div>
                      <div className="flex-1">
                        <input 
                          type="text" 
                          placeholder="Role (e.g. Secretary, Member)" 
                          value={member.role} 
                          onChange={(e) => handleMemberChange(index, 'role', e.target.value)} 
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500" 
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMember(index)} 
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        title="Remove Member"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsMeetingModalOpen(false)} 
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition"
                >
                  Save Meeting Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden h-[85vh] flex flex-col">
            <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-bold text-emerald-400">{previewDoc.department} • {previewDoc.date}</p>
                <h3 className="font-extrabold text-base">{previewDoc.name}</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-6 flex-1 bg-slate-100">
              <iframe 
                src={previewDoc.url} 
                title={previewDoc.name}
                className="w-full h-full rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentalMeetings;