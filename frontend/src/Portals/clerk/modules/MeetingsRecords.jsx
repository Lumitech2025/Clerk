import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Download, 
  Plus, 
  Search, 
  Users, 
  X, 
  Printer, 
  FileCheck,
  UserPlus,
  Eye,
  Scan,
  FolderArchive,
  Filter
} from 'lucide-react';

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
    <div>
      <p className="text-xs font-black text-slate-500 uppercase tracking-wider">{title}</p>
      <h3 className={`text-3xl font-black ${color} mt-2 tracking-tight`}>{value}</h3>
    </div>
    <div className={`p-4 rounded-xl ${bg}`}>
      <Icon size={26} />
    </div>
  </div>
);

const MeetingsRecords = () => {
  // Navigation Tabs: 'meetings' | 'attendance' | 'vault'
  const [activeTab, setActiveTab] = useState('meetings');

  // --- MEETING CATEGORIES ---
  const meetingCategories = [
    'All Categories',
    'Board Meetings',
    'Business Meetings',
    'Membership Reviews',
    'Delegate Related Meetings',
    'Election Process Meetings',
    'Committee Reporting Meetings'
  ];

  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // --- STATE: MEETINGS RECORDS ---
  const [meetings, setMeetings] = useState([
    {
      id: 1,
      meetingRef: 'Board001/10/7/2026',
      category: 'Board Meetings',
      date: '2026-07-10',
      time: '10:00 AM - 01:00 PM',
      venue: 'Main Boardroom',
      chairperson: 'Elder John Kamau',
      pastor: 'Pr. David Omondi',
      clerk: 'Collins Kimathi',
      agendaDoc: { name: 'Quarterly_Board_Agenda_Q3.pdf', size: '1.2 MB', url: '#' },
      minutesDoc: { name: 'Confirmed_Minutes_Board_Q3.pdf', size: '2.8 MB', url: '#' },
      physicalSheet: { name: 'Scanned_Sign_In_10July.jpg', size: '3.1 MB', url: '#' },
      status: 'Minutes Confirmed',
      attendeesLog: []
    },
    {
      id: 2,
      meetingRef: 'Biz004/18/7/2026',
      category: 'Business Meetings',
      date: '2026-07-18',
      time: '02:00 PM - 04:30 PM',
      venue: 'Main Sanctuary',
      chairperson: 'Pr. David Omondi',
      pastor: 'Pr. David Omondi',
      clerk: 'Mary Wanjiku',
      agendaDoc: { name: 'Annual_Business_Agenda.pdf', size: '850 KB', url: '#' },
      minutesDoc: { name: 'Business_Meeting_Minutes_Draft.pdf', size: '1.9 MB', url: '#' },
      physicalSheet: null,
      status: 'Pending Minutes',
      attendeesLog: []
    },
    {
      id: 3,
      meetingRef: 'Mem002/05/6/2026',
      category: 'Membership Reviews',
      date: '2026-06-05',
      time: '04:00 PM - 06:00 PM',
      venue: 'Vestry Room',
      chairperson: 'Elder Mark Rotich',
      pastor: 'Pr. Gerald Mochoge',
      clerk: 'Collins Kimathi',
      agendaDoc: { name: 'Transfer_Reviews_June.pdf', size: '620 KB', url: '#' },
      minutesDoc: { name: 'Approved_Transfers_Minutes.pdf', size: '1.4 MB', url: '#' },
      physicalSheet: null,
      status: 'Minutes Confirmed',
      attendeesLog: []
    },
    {
      id: 4,
      meetingRef: 'Elect001/12/5/2026',
      category: 'Election Process Meetings',
      date: '2026-05-12',
      time: '11:00 AM - 02:00 PM',
      venue: 'Conference Hall',
      chairperson: 'Elder George Oyoo',
      pastor: 'Pr. David Omondi',
      clerk: 'Collins Kimathi',
      agendaDoc: { name: 'Nominating_Committee_Guidelines.pdf', size: '1.1 MB', url: '#' },
      minutesDoc: { name: 'Election_Process_Report.pdf', size: '3.4 MB', url: '#' },
      physicalSheet: null,
      status: 'Minutes Confirmed',
      attendeesLog: []
    }
  ]);

  // --- STATE: BOARD ATTENDANCE MATRIX ---
  const [boardAttendance] = useState([
    { sNo: 1, name: 'Gerald Mochoge', dept: 'Senior Pastor', jan: 'PR', feb: 'PR', mar: 'PR', apr: 'AA', may: 'PR', jun: 'AA', pct: '66.67%' },
    { sNo: 2, name: 'Elvis Onyango', dept: 'Associate Pastor', jan: 'AA', feb: 'PR', mar: 'AA', apr: 'PR', may: 'PR', jun: 'PR', pct: '66.67%' },
    { sNo: 3, name: 'Polycarp Nyang\'au', dept: 'Associate Pastor', jan: 'AA', feb: 'AA', mar: 'AA', apr: 'PR', may: 'PR', jun: 'PR', pct: '50.00%' },
    { sNo: 4, name: 'George Oyoo', dept: 'First Elder', jan: 'PR', feb: 'AA', mar: 'AA', apr: 'PR', may: 'AA', jun: 'AA', pct: '33.33%' },
    { sNo: 5, name: 'Collins Kimathi', dept: 'Church Clerk', jan: 'PR', feb: 'PR', mar: 'PR', apr: 'PR', may: 'PR', jun: 'PR', pct: '100.00%' }
  ]);

  // Modal & Preview Controls
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State: New Meeting
  const [meetingForm, setMeetingForm] = useState({
    refNumber: '',
    category: 'Board Meetings',
    date: '',
    time: '',
    venue: '',
    chairperson: '',
    pastor: '',
    clerk: '',
    agendaFile: null,
    minutesFile: null,
    physicalSheetFile: null
  });

  // Form State: Attendance Entry
  const [attendanceEntry, setAttendanceEntry] = useState({
    meetingRef: 'Board001/10/7/2026',
    name: '',
    dept: '',
    status: 'PR',
    arrival: '',
    departure: ''
  });

  // Save New Meeting
  const handleMeetingSubmit = (e) => {
    e.preventDefault();
    const newMeeting = {
      id: Date.now(),
      meetingRef: meetingForm.refNumber || `Ref/${meetingForm.date.replaceAll('-', '/')}`,
      category: meetingForm.category,
      date: meetingForm.date,
      time: meetingForm.time,
      venue: meetingForm.venue,
      chairperson: meetingForm.chairperson,
      pastor: meetingForm.pastor,
      clerk: meetingForm.clerk,
      agendaDoc: meetingForm.agendaFile ? { name: meetingForm.agendaFile.name, size: 'Uploaded', url: URL.createObjectURL(meetingForm.agendaFile) } : null,
      minutesDoc: meetingForm.minutesFile ? { name: meetingForm.minutesFile.name, size: 'Uploaded', url: URL.createObjectURL(meetingForm.minutesFile) } : null,
      physicalSheet: meetingForm.physicalSheetFile ? { name: meetingForm.physicalSheetFile.name, size: 'Uploaded', url: URL.createObjectURL(meetingForm.physicalSheetFile) } : null,
      status: meetingForm.minutesFile ? 'Minutes Confirmed' : 'Pending Minutes',
      attendeesLog: []
    };

    setMeetings([newMeeting, ...meetings]);
    setIsMeetingModalOpen(false);
  };

  // OCR Scanner Simulation
  const handleOcrScan = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsOcrScanning(true);
    setTimeout(() => {
      setAttendanceEntry({
        meetingRef: meetings[0]?.meetingRef || 'Board001/10/7/2026',
        name: 'Elder Mark Rotich (Scanned)',
        dept: 'Pastoral Elder',
        status: 'PR',
        arrival: '09:55 AM',
        departure: '01:00 PM'
      });
      setIsOcrScanning(false);
      alert('Handwritten Sheet Scanned! Data populated.');
    }, 1800);
  };

  // Log Attendance Submit
  const handleAttendanceSubmit = (e) => {
    e.preventDefault();
    const updatedMeetings = meetings.map(m => {
      if (m.meetingRef === attendanceEntry.meetingRef) {
        return {
          ...m,
          attendeesLog: [
            ...m.attendeesLog,
            { name: attendanceEntry.name, dept: attendanceEntry.dept, status: attendanceEntry.status, arrival: attendanceEntry.arrival || 'N/A', departure: attendanceEntry.departure || 'N/A' }
          ]
        };
      }
      return m;
    });

    setMeetings(updatedMeetings);
    setIsAttendanceModalOpen(false);
  };

  // Extract all documents for Vault View
  const vaultDocuments = meetings.flatMap(m => {
    const docs = [];
    if (m.minutesDoc) docs.push({ ...m.minutesDoc, type: 'Confirmed Minutes', meetingRef: m.meetingRef, category: m.category, date: m.date, venue: m.venue });
    if (m.agendaDoc) docs.push({ ...m.agendaDoc, type: 'Tabled Agenda', meetingRef: m.meetingRef, category: m.category, date: m.date, venue: m.venue });
    if (m.physicalSheet) docs.push({ ...m.physicalSheet, type: 'Scanned Sign-In Sheet', meetingRef: m.meetingRef, category: m.category, date: m.date, venue: m.venue });
    return docs;
  });

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased">
      
      {/* Print Dynamic CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-sheet, #printable-sheet * { visibility: visible; }
          #printable-sheet { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
        }
      `}</style>

      {/* HEADER & TAB NAVIGATION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Meetings & Attendance Records</h1>
          
        </div>

        {/* 3 NAVIGATION TABS */}
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
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              activeTab === 'attendance' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={18} />
            <span>Attendance Log Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              activeTab === 'vault' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderArchive size={18} />
            <span>Document Vault</span>
          </button>
        </div>
      </div>

      {/* KPI STATS BAR (HIDDEN IN DOCUMENT VAULT TAB) */}
      {activeTab !== 'vault' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 print:hidden">
          <StatCard title="Total Meetings" value={meetings.length} icon={Calendar} color="text-emerald-700" bg="bg-emerald-50" />
          <StatCard title="Minutes Confirmed" value={meetings.filter(m => m.minutesDoc).length} icon={FileCheck} color="text-blue-700" bg="bg-blue-50" />
          <StatCard title="Archived Documents" value={vaultDocuments.length} icon={FolderArchive} color="text-purple-700" bg="bg-purple-50" />
          <StatCard title="Board Members Tracked" value={boardAttendance.length} icon={Users} color="text-indigo-700" bg="bg-indigo-50" />
        </div>
      )}

      {/* SEARCH AND CONTROLS BAR (FOR MEETINGS & ATTENDANCE TABS) */}
      {activeTab !== 'vault' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="relative w-full sm:w-96">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search ref, venue, doc name, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {activeTab === 'meetings' && (
              <>
                <button
                  onClick={() => setIsAttendanceModalOpen(true)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-xs cursor-pointer"
                >
                  <UserPlus size={18} />
                  <span>Log Attendance</span>
                </button>
                <button 
                  onClick={() => setIsMeetingModalOpen(true)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-sm cursor-pointer"
                >
                  <Plus size={18} />
                  <span>Record New Meeting</span>
                </button>
              </>
            )}

            {activeTab === 'attendance' && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-xs cursor-pointer"
              >
                <Printer size={18} />
                <span>Print Attendance</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: OFFICIAL MEETINGS TABLE */}
      {activeTab === 'meetings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Official Meeting Records</h2>
            <p className="text-sm font-semibold text-slate-500 mt-1">Click on any row to open details, preview files, download documents, and view attendance logs.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase text-slate-600 tracking-wider">
                  <th className="py-4 px-6">Meeting Ref & Date</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Leadership Team</th>
                  <th className="py-4 px-6">Clerk</th>
                  <th className="py-4 px-6">Agenda & Minutes Docs</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-800">
                {meetings
                  .filter(m => 
                    m.meetingRef.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    m.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    m.category.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((meeting) => (
                    <tr 
                      key={meeting.id} 
                      onClick={() => setSelectedMeeting(meeting)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="py-5 px-6">
                        <div className="font-extrabold text-emerald-800 text-xs bg-emerald-50 px-2.5 py-1 rounded-md inline-block mb-1 border border-emerald-200">
                          {meeting.meetingRef}
                        </div>
                        <div className="font-extrabold text-slate-900 text-base">{meeting.date}</div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mt-1">
                          <Clock size={13} /> {meeting.time}
                        </div>
                      </td>

                      <td className="py-5 px-6">
                        <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-200">
                          {meeting.category}
                        </span>
                      </td>

                      <td className="py-5 px-6">
                        <div className="text-xs font-bold text-slate-900">Chair: <span className="font-medium text-slate-700">{meeting.chairperson}</span></div>
                        <div className="text-xs font-bold text-slate-900 mt-1">Pastor: <span className="font-medium text-slate-700">{meeting.pastor}</span></div>
                      </td>

                      <td className="py-5 px-6 font-bold text-slate-800 text-sm">
                        {meeting.clerk}
                      </td>

                      <td className="py-5 px-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1.5">
                          {meeting.agendaDoc ? (
                            <a href={meeting.agendaDoc.url} download={meeting.agendaDoc.name} className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline">
                              <Download size={13} /> {meeting.agendaDoc.name}
                            </a>
                          ) : <span className="text-xs text-slate-400">No Agenda</span>}

                          {meeting.minutesDoc ? (
                            <a href={meeting.minutesDoc.url} download={meeting.minutesDoc.name} className="flex items-center gap-1.5 text-xs font-bold text-blue-800 hover:underline">
                              <Download size={13} /> {meeting.minutesDoc.name}
                            </a>
                          ) : <span className="text-xs text-amber-700 font-bold">Minutes Pending</span>}
                        </div>
                      </td>

                      <td className="py-5 px-6 text-right">
                        <button className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
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

      {/* TAB 2: ATTENDANCE TRACKER MATRIX */}
      {activeTab === 'attendance' && (
        <div id="printable-sheet" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-6">
          <div className="text-center border-b-2 border-slate-900 pb-5 mb-6">
            <h2 className="text-xl font-black text-slate-900 uppercase">NEWLIFE ADVENTIST CHURCH, 5TH NGONG AVENUE, NAIROBI</h2>
            <h3 className="text-lg font-bold text-slate-700 uppercase mt-1">2026 CHURCH BOARD ATTENDANCE TRACKER</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-xs font-black uppercase text-slate-900">
                  <th className="border border-slate-300 py-3 px-3 text-center">S/No.</th>
                  <th className="border border-slate-300 py-3 px-4">NAME</th>
                  <th className="border border-slate-300 py-3 px-4">DPT. / MINISTRY</th>
                  <th className="border border-slate-300 py-3 px-2 text-center">JAN</th>
                  <th className="border border-slate-300 py-3 px-2 text-center">FEB</th>
                  <th className="border border-slate-300 py-3 px-2 text-center">MAR</th>
                  <th className="border border-slate-300 py-3 px-2 text-center">APR</th>
                  <th className="border border-slate-300 py-3 px-2 text-center">MAY</th>
                  <th className="border border-slate-300 py-3 px-2 text-center">JUN</th>
                  <th className="border border-slate-300 py-3 px-3 text-center">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm font-semibold text-slate-900">
                {boardAttendance.map((row) => (
                  <tr key={row.sNo} className="hover:bg-slate-50 transition">
                    <td className="border border-slate-300 py-2.5 px-3 text-center font-bold">{row.sNo}</td>
                    <td className="border border-slate-300 py-2.5 px-4 font-bold">{row.name}</td>
                    <td className="border border-slate-300 py-2.5 px-4 text-slate-700">{row.dept}</td>
                    <td className="border border-slate-300 py-2.5 px-2 text-center font-black">{row.jan}</td>
                    <td className="border border-slate-300 py-2.5 px-2 text-center font-black">{row.feb}</td>
                    <td className="border border-slate-300 py-2.5 px-2 text-center font-black">{row.mar}</td>
                    <td className="border border-slate-300 py-2.5 px-2 text-center font-black">{row.apr}</td>
                    <td className="border border-slate-300 py-2.5 px-2 text-center font-black">{row.may}</td>
                    <td className="border border-slate-300 py-2.5 px-2 text-center font-black">{row.jun}</td>
                    <td className="border border-slate-300 py-2.5 px-3 text-center font-black text-emerald-800">{row.pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-slate-700">
            <div>KEY: [PR] - Present | [AA] - Absent with Apology | [WA] - Absent without Apology</div>
            <div className="font-extrabold text-slate-900">NEWLIFE CHURCH CLERK INFORMATION SYSTEM</div>
          </div>
        </div>
      )}

      {/* TAB 3: MEETING DOCUMENT VAULT (STARTS AT TOP + COMPACT TILES + SNEAK VIEW) */}
      {activeTab === 'vault' && (
        <div className="space-y-5 print:hidden">
          
          {/* HEADER BAR WITH SEARCH AND CATEGORY FILTER DROPDOWN */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-auto">
              <h2 className="text-xl font-black text-slate-900">Meeting Document Vault</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Filter, preview, download, or print official meeting records.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Vault Search */}
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search document name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              {/* Category Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={15} className="text-emerald-600 shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600 transition"
                >
                  {meetingCategories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* COMPACT SQUARE TILES GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {vaultDocuments
              .filter(doc => selectedCategory === 'All Categories' || doc.category === selectedCategory)
              .filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((doc, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    {/* TYPE BADGE & DATE */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                        doc.type === 'Confirmed Minutes' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        doc.type === 'Tabled Agenda' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}>
                        {doc.type}
                      </span>
                      <span className="text-[10px] font-extrabold text-slate-500">{doc.date}</span>
                    </div>

                    {/* DOCUMENT SNEAK VIEW (PAGE THUMBNAIL PREVIEW MOCKUP) */}
                    <div 
                      onClick={() => setPreviewDoc(doc)}
                      className="w-full h-24 bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 my-2.5 cursor-pointer relative overflow-hidden group-hover:border-emerald-300 group-hover:bg-emerald-50/20 transition flex flex-col justify-between"
                    >
                      {/* Simulated preview document lines */}
                      <div className="space-y-1.5 opacity-60">
                        <div className="h-1.5 bg-slate-400 rounded w-3/4"></div>
                        <div className="h-1 bg-slate-300 rounded w-full"></div>
                        <div className="h-1 bg-slate-300 rounded w-5/6"></div>
                        <div className="h-1 bg-slate-300 rounded w-2/3"></div>
                        <div className="h-1 bg-slate-300 rounded w-4/5"></div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-extrabold border-t border-slate-200/60 pt-1">
                        <span>PDF PREVIEW</span>
                        <Eye size={12} className="text-slate-500 group-hover:text-emerald-700" />
                      </div>
                    </div>

                    {/* TITLE AND CATEGORY ONLY */}
                    <div className="mt-1">
                      <h4 className="font-extrabold text-slate-900 text-xs line-clamp-2 leading-tight" title={doc.name}>
                        {doc.name}
                      </h4>
                    </div>
                  </div>

                  {/* COMPACT ACTION BUTTONS (PREVIEW, DOWNLOAD, PRINT) */}
                  <div className="grid grid-cols-3 gap-1 pt-3 mt-2 border-t border-slate-100">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      title="Preview Document"
                      className="flex items-center justify-center p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition cursor-pointer"
                    >
                      <Eye size={13} />
                    </button>

                    <a
                      href={doc.url}
                      download={doc.name}
                      title="Download Document"
                      className="flex items-center justify-center p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg transition cursor-pointer"
                    >
                      <Download size={13} />
                    </a>

                    <button
                      onClick={() => {
                        const printWindow = window.open(doc.url, '_blank');
                        printWindow?.print();
                      }}
                      title="Print Document"
                      className="flex items-center justify-center p-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition cursor-pointer"
                    >
                      <Printer size={13} />
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {vaultDocuments.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <FolderArchive size={40} className="mx-auto text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No Documents Found</h3>
              <p className="text-xs text-slate-500 mt-0.5">Upload agenda or minutes documents when recording a new meeting.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: RECORD NEW MEETING */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Calendar className="text-emerald-400" size={20} /> Record New Meeting
              </h3>
              <button onClick={() => setIsMeetingModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <form onSubmit={handleMeetingSubmit} className="p-6 space-y-4 text-sm font-semibold overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Meeting Category *</label>
                  <select 
                    value={meetingForm.category}
                    onChange={(e) => setMeetingForm({...meetingForm, category: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {meetingCategories.filter(c => c !== 'All Categories').map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Meeting Reference Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Board001/10/7/2026" 
                    value={meetingForm.refNumber} 
                    onChange={(e) => setMeetingForm({...meetingForm, refNumber: e.target.value})} 
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date *</label>
                  <input type="date" required value={meetingForm.date} onChange={(e) => setMeetingForm({...meetingForm, date: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Time Range *</label>
                  <input type="text" placeholder="10:00 AM - 01:00 PM" required value={meetingForm.time} onChange={(e) => setMeetingForm({...meetingForm, time: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Venue *</label>
                <input type="text" placeholder="Main Boardroom" required value={meetingForm.venue} onChange={(e) => setMeetingForm({...meetingForm, venue: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Chairperson *</label>
                  <input type="text" placeholder="Chairperson Name" required value={meetingForm.chairperson} onChange={(e) => setMeetingForm({...meetingForm, chairperson: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pastor Present *</label>
                  <input type="text" placeholder="Officiating Pastor" required value={meetingForm.pastor} onChange={(e) => setMeetingForm({...meetingForm, pastor: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Clerk / Recording Sec *</label>
                <input type="text" placeholder="Recording Clerk Name" required value={meetingForm.clerk} onChange={(e) => setMeetingForm({...meetingForm, clerk: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
              </div>

              {/* UPLOAD FIELDS */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Upload Agenda Document (PDF)</label>
                  <input type="file" onChange={(e) => setMeetingForm({...meetingForm, agendaFile: e.target.files[0]})} className="w-full text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200" />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Upload Confirmed Minutes Document (PDF)</label>
                  <input type="file" onChange={(e) => setMeetingForm({...meetingForm, minutesFile: e.target.files[0]})} className="w-full text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200" />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Upload Physical Attendance Sheet (Photo/PDF)</label>
                  <input type="file" onChange={(e) => setMeetingForm({...meetingForm, physicalSheetFile: e.target.files[0]})} className="w-full text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200" />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsMeetingModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer">Save Meeting</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG ATTENDANCE WITH OCR SCAN */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="text-emerald-400" size={20} /> Log Meeting Attendance
              </h3>
              <button onClick={() => setIsAttendanceModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <form onSubmit={handleAttendanceSubmit} className="p-6 space-y-4 text-sm font-semibold">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-900 text-xs">Scan Physical Sheet (OCR Feasibility)</p>
                  <p className="text-xs text-emerald-700">Upload handwritten image to populate fields</p>
                </div>
                <label className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition">
                  <Scan size={14} /> {isOcrScanning ? 'Scanning...' : 'Scan Photo'}
                  <input type="file" accept="image/*" onChange={handleOcrScan} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Meeting Reference *</label>
                <select value={attendanceEntry.meetingRef} onChange={(e) => setAttendanceEntry({...attendanceEntry, meetingRef: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                  {meetings.map(m => (
                    <option key={m.id} value={m.meetingRef}>{m.meetingRef} - {m.category} ({m.date})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Member Name *</label>
                  <input type="text" placeholder="Full Name" required value={attendanceEntry.name} onChange={(e) => setAttendanceEntry({...attendanceEntry, name: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department *</label>
                  <input type="text" placeholder="e.g. Pastoral Elder" required value={attendanceEntry.dept} onChange={(e) => setAttendanceEntry({...attendanceEntry, dept: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Attendance Status *</label>
                <select value={attendanceEntry.status} onChange={(e) => setAttendanceEntry({...attendanceEntry, status: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                  <option value="PR">PR - Present</option>
                  <option value="AA">AA - Absent with Apology</option>
                  <option value="WA">WA - Absent without Apology</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Arrival Time</label>
                  <input type="text" placeholder="e.g. 09:50 AM" value={attendanceEntry.arrival} onChange={(e) => setAttendanceEntry({...attendanceEntry, arrival: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Departure Time</label>
                  <input type="text" placeholder="e.g. 01:05 PM" value={attendanceEntry.departure} onChange={(e) => setAttendanceEntry({...attendanceEntry, departure: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAttendanceModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PREVIEW DOCUMENT MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden h-[85vh] flex flex-col">
            <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-bold text-emerald-400">{previewDoc.category} ({previewDoc.date})</p>
                <h3 className="font-extrabold text-base">{previewDoc.name}</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <div className="p-6 flex-1 bg-slate-100 flex flex-col items-center justify-center text-center">
              <FileText size={64} className="text-slate-400 mb-4" />
              <h4 className="text-lg font-bold text-slate-800">{previewDoc.name}</h4>
              <p className="text-sm font-semibold text-slate-500 mt-1">Ref: {previewDoc.meetingRef} | Size: {previewDoc.size}</p>
              <p className="text-xs text-slate-400 max-w-md mt-4">
                In production, an embedded PDF viewer (`&lt;iframe&gt;` or `pdfjs`) will render the document inline here directly from backend storage.
              </p>

              <div className="flex gap-3 mt-6">
                <a href={previewDoc.url} download={previewDoc.name} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2">
                  <Download size={14} /> Download Document
                </a>
                <button onClick={() => window.print()} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer">
                  <Printer size={14} /> Print Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER 4: CLICKABLE MEETING DETAILS */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{selectedMeeting.meetingRef} ({selectedMeeting.category})</span>
                <h3 className="font-black text-lg">{selectedMeeting.venue}</h3>
              </div>
              <button onClick={() => setSelectedMeeting(null)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-sm">
                <div>
                  <p className="text-xs font-bold text-slate-500">Date</p>
                  <p className="font-black text-slate-900">{selectedMeeting.date}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Time</p>
                  <p className="font-black text-slate-900">{selectedMeeting.time}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Status</p>
                  <p className="font-black text-emerald-700">{selectedMeeting.status}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Chairperson</p>
                  <p className="font-bold text-slate-800">{selectedMeeting.chairperson}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Pastor</p>
                  <p className="font-bold text-slate-800">{selectedMeeting.pastor}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Clerk</p>
                  <p className="font-bold text-slate-800">{selectedMeeting.clerk}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">Attached Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedMeeting.agendaDoc ? (
                    <a href={selectedMeeting.agendaDoc.url} download={selectedMeeting.agendaDoc.name} className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100">
                      <Download size={15} /> {selectedMeeting.agendaDoc.name}
                    </a>
                  ) : <div className="p-3 bg-slate-50 text-xs text-slate-400 rounded-xl">No Agenda</div>}

                  {selectedMeeting.minutesDoc ? (
                    <a href={selectedMeeting.minutesDoc.url} download={selectedMeeting.minutesDoc.name} className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs font-bold text-blue-900 hover:bg-blue-100">
                      <Download size={15} /> {selectedMeeting.minutesDoc.name}
                    </a>
                  ) : <div className="p-3 bg-amber-50 text-xs text-amber-800 font-bold rounded-xl">Minutes Pending</div>}

                  {selectedMeeting.physicalSheet ? (
                    <a href={selectedMeeting.physicalSheet.url} download={selectedMeeting.physicalSheet.name} className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2 text-xs font-bold text-purple-900 hover:bg-purple-100">
                      <Download size={15} /> {selectedMeeting.physicalSheet.name}
                    </a>
                  ) : <div className="p-3 bg-slate-50 text-xs text-slate-400 rounded-xl">No Physical Sheet</div>}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSelectedMeeting(null)} className="px-5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MeetingsRecords;