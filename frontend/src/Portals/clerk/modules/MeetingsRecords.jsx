import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Download, 
  Plus, 
  Search, 
  Users, 
  X, 
  Printer, 
  Briefcase, 
  FileCheck,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

// KPI Stat Card with boosted font sizes
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

const MeetingsRecords = ({ currentUserRole = 'Church Clerk' }) => {
  const [activeTab, setActiveTab] = useState('meetings'); // 'meetings' | 'attendance'

  // --- STATE 1: MEETINGS RECORDS ---
  const [meetings, setMeetings] = useState([
    {
      id: 1,
      date: '2026-07-10',
      time: '10:00 AM - 01:00 PM',
      venue: 'Main Boardroom',
      chairperson: 'Elder John Kamau',
      pastor: 'Pr. David Omondi',
      clerk: 'Collins Kimathi',
      agendaDoc: 'Quarterly_Board_Agenda_Q3.pdf',
      minutesDoc: 'Confirmed_Minutes_Board_Q3.pdf',
      status: 'Minutes Confirmed'
    },
    {
      id: 2,
      date: '2026-07-18',
      time: '02:00 PM - 04:30 PM',
      venue: 'Vestry Room',
      chairperson: 'Pr. David Omondi',
      pastor: 'Pr. David Omondi',
      clerk: 'Mary Wanjiku',
      agendaDoc: 'Departmental_Leaders_Briefing.pdf',
      minutesDoc: null,
      status: 'Pending Minutes'
    }
  ]);

  // --- STATE 2: BOARD ATTENDANCE TRACKER (Official Matrix Format) ---
  const [boardAttendance, setBoardAttendance] = useState([
    { sNo: 1, name: 'Gerald Mochoge', dept: 'Senior Pastor', jan: 'PR', feb: 'PR', mar: 'PR', apr: 'AA', may: 'PR', jun: 'AA', pct: '66.67%' },
    { sNo: 2, name: 'Elvis Onyango', dept: 'Associate Pastor', jan: 'AA', feb: 'PR', mar: 'AA', apr: 'PR', may: 'PR', jun: 'PR', pct: '66.67%' },
    { sNo: 3, name: 'Polycarp Nyang\'au', dept: 'Associate Pastor', jan: 'AA', feb: 'AA', mar: 'AA', apr: 'PR', may: 'PR', jun: 'PR', pct: '50.00%' },
    { sNo: 4, name: 'George Oyoo', dept: 'First Elder', jan: 'PR', feb: 'AA', mar: 'AA', apr: 'PR', may: 'AA', jun: 'AA', pct: '33.33%' },
    { sNo: 5, name: 'Mark Rotich', dept: 'Pastoral Elder', jan: 'PR', feb: 'PR', mar: 'PR', apr: 'PR', may: 'WA', jun: 'PR', pct: '83.33%' },
    { sNo: 6, name: 'Tom Omurwa', dept: 'Pastoral Elder', jan: 'PR', feb: 'PR', mar: 'AA', apr: 'PR', may: 'PR', jun: 'PR', pct: '83.33%' },
    { sNo: 7, name: 'Ken Ochuka', dept: 'Pastoral Elder', jan: 'PR', feb: 'PR', mar: 'WA', apr: 'PR', may: 'PR', jun: 'WA', pct: '66.67%' },
    { sNo: 8, name: 'David Singombe', dept: 'Pastoral Elder', jan: 'PR', feb: 'PR', mar: 'PR', apr: 'PR', may: 'PR', jun: 'PR', pct: '100.00%' },
    { sNo: 9, name: 'Collins Kimathi', dept: 'Church Clerk', jan: 'PR', feb: 'PR', mar: 'PR', apr: 'PR', may: 'PR', jun: 'PR', pct: '100.00%' },
    { sNo: 10, name: 'Isaac Nyangolo', dept: 'Church Clerk', jan: 'AA', feb: 'PR', mar: 'PR', apr: 'PR', may: 'PR', jun: 'PR', pct: '83.33%' }
  ]);

  // Modal UI Controls
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Meeting Form
  const [meetingForm, setMeetingForm] = useState({
    date: '', time: '', venue: '', chairperson: '', pastor: '', clerk: '', agendaDocName: '', minutesDocName: ''
  });

  // Attendance Form
  const [attendanceForm, setAttendanceForm] = useState({
    name: '', dept: '', jan: 'PR', feb: 'PR', mar: 'PR', apr: 'PR', may: 'PR', jun: 'PR'
  });

  // Handlers for Adding Meeting
  const handleMeetingSubmit = (e) => {
    e.preventDefault();
    const newMeeting = {
      id: Date.now(),
      ...meetingForm,
      agendaDoc: meetingForm.agendaDocName || 'Agenda_Document.pdf',
      minutesDoc: meetingForm.minutesDocName || null,
      status: meetingForm.minutesDocName ? 'Minutes Confirmed' : 'Pending Minutes'
    };
    setMeetings([newMeeting, ...meetings]);
    setIsMeetingModalOpen(false);
    setMeetingForm({ date: '', time: '', venue: '', chairperson: '', pastor: '', clerk: '', agendaDocName: '', minutesDocName: '' });
  };

  // Handlers for Adding Attendance Log
  const handleAttendanceSubmit = (e) => {
    e.preventDefault();
    const records = [attendanceForm.jan, attendanceForm.feb, attendanceForm.mar, attendanceForm.apr, attendanceForm.may, attendanceForm.jun];
    const presentCount = records.filter(r => r === 'PR').length;
    const calculatedPct = ((presentCount / 6) * 100).toFixed(2) + '%';

    const newEntry = {
      sNo: boardAttendance.length + 1,
      ...attendanceForm,
      pct: calculatedPct
    };
    setBoardAttendance([...boardAttendance, newEntry]);
    setIsAttendanceModalOpen(false);
    setAttendanceForm({ name: '', dept: '', jan: 'PR', feb: 'PR', mar: 'PR', apr: 'PR', may: 'PR', jun: 'PR' });
  };

  // Trigger browser print (CSS `@media print` handles clean rendering)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased">
      
      {/* Dynamic Print CSS Rules to Hide Sidebars and Show Clean Sheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-attendance-sheet, #printable-attendance-sheet * {
            visibility: visible;
          }
          #printable-attendance-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* HEADER & TAB SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Meetings & Attendance Records</h1>
          <p className="text-base font-semibold text-slate-500 mt-1">Manage executive meeting agendas, confirmed minutes, and attendance tracking.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/80 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('meetings')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-base font-bold transition cursor-pointer ${
              activeTab === 'meetings'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={20} />
            <span>Meeting Records</span>
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-base font-bold transition cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={20} />
            <span>Attendance Log</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 print:hidden">
        <StatCard title="Total Meetings" value={meetings.length} icon={Calendar} color="text-emerald-700" bg="bg-emerald-50 text-emerald-700" />
        <StatCard title="Minutes Confirmed" value={meetings.filter(m => m.minutesDoc).length} icon={FileCheck} color="text-blue-700" bg="bg-blue-50 text-blue-700" />
        <StatCard title="Members Tracked" value={boardAttendance.length} icon={Users} color="text-indigo-700" bg="bg-indigo-50 text-indigo-700" />
        <StatCard title="Departments" value={new Set(boardAttendance.map(a => a.dept)).size} icon={Briefcase} color="text-purple-700" bg="bg-purple-50 text-purple-700" />
      </div>

      {/* CONTROL & ACTION BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="relative w-full sm:w-96">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder={activeTab === 'meetings' ? "Search venue, chairperson, pastor..." : "Search member name or department..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {activeTab === 'attendance' && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-xl text-base font-bold shadow-xs transition cursor-pointer"
            >
              <Printer size={20} />
              <span>Print / Export Sheet</span>
            </button>
          )}

          {/* Guaranteed Add Button for Clerk */}
          <button 
            onClick={() => activeTab === 'meetings' ? setIsMeetingModalOpen(true) : setIsAttendanceModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-base font-bold shadow-sm transition cursor-pointer"
          >
            <Plus size={20} />
            <span>{activeTab === 'meetings' ? 'Record New Meeting' : 'Add Board Member Log'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MEETINGS RECORDS TABLE */}
      {activeTab === 'meetings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Official Meeting Records</h2>
              <p className="text-sm font-semibold text-slate-500 mt-1">Archive of executive agendas, leadership details, and confirmed minutes</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase text-slate-600 tracking-wider">
                  <th className="py-4 px-6">Date & Venue</th>
                  <th className="py-4 px-6">Leadership Team</th>
                  <th className="py-4 px-6">Recording Sec / Clerk</th>
                  <th className="py-4 px-6">Tabled Agenda</th>
                  <th className="py-4 px-6">Final Minutes</th>
                  <th className="py-4 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-base font-medium text-slate-800">
                {meetings
                  .filter(m => m.venue.toLowerCase().includes(searchTerm.toLowerCase()) || m.chairperson.toLowerCase().includes(searchTerm.toLowerCase()) || m.pastor.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((meeting) => (
                    <tr key={meeting.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-5 px-6">
                        <div className="font-extrabold text-slate-900 text-base">{meeting.date}</div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mt-1">
                          <Clock size={14} /> {meeting.time}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mt-1">
                          <MapPin size={14} /> {meeting.venue}
                        </div>
                      </td>

                      <td className="py-5 px-6">
                        <div className="text-sm font-bold text-slate-900">Chair: <span className="font-medium text-slate-700">{meeting.chairperson}</span></div>
                        <div className="text-sm font-bold text-slate-900 mt-1">Pastor: <span className="font-medium text-slate-700">{meeting.pastor}</span></div>
                      </td>

                      <td className="py-5 px-6 font-bold text-slate-800 text-base">
                        {meeting.clerk}
                      </td>

                      <td className="py-5 px-6">
                        {meeting.agendaDoc ? (
                          <button className="flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-300 transition cursor-pointer">
                            <Download size={16} /> Agenda Doc
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold">None Attached</span>
                        )}
                      </td>

                      <td className="py-5 px-6">
                        {meeting.minutesDoc ? (
                          <button className="flex items-center gap-2 text-xs font-bold text-blue-800 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-300 transition cursor-pointer">
                            <Download size={16} /> Confirmed Minutes
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-300">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-5 px-6 text-right">
                        <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold ${
                          meeting.status === 'Minutes Confirmed' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {meeting.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE TRACKER (Identical Layout to Church Document) */}
      {activeTab === 'attendance' && (
        <div id="printable-attendance-sheet" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-6">
          
          {/* Official Document Header */}
          <div className="text-center border-b-2 border-slate-900 pb-5 mb-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">NEWLIFE ADVENTIST CHURCH, 5TH NGONG AVENUE, NAIROBI</h2>
            <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider mt-1">2026 CHURCH BOARD ATTENDANCE TRACKER</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-xs font-black uppercase text-slate-900 tracking-wider">
                  <th className="border border-slate-300 py-3 px-3 text-center w-12">S/No.</th>
                  <th className="border border-slate-300 py-3 px-4">NAME</th>
                  <th className="border border-slate-300 py-3 px-4">DPT. / MINISTRY</th>
                  <th className="border border-slate-300 py-3 px-2 text-center w-14">JAN</th>
                  <th className="border border-slate-300 py-3 px-2 text-center w-14">FEB</th>
                  <th className="border border-slate-300 py-3 px-2 text-center w-14">MAR</th>
                  <th className="border border-slate-300 py-3 px-2 text-center w-14">APR</th>
                  <th className="border border-slate-300 py-3 px-2 text-center w-14">MAY</th>
                  <th className="border border-slate-300 py-3 px-2 text-center w-14">JUN</th>
                  <th className="border border-slate-300 py-3 px-3 text-center w-16">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm font-semibold text-slate-900">
                {boardAttendance
                  .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.dept.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((row) => (
                    <tr key={row.sNo} className="hover:bg-slate-50 transition">
                      <td className="border border-slate-300 py-2.5 px-3 text-center font-bold">{row.sNo}</td>
                      <td className="border border-slate-300 py-2.5 px-4 font-bold text-slate-900">{row.name}</td>
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

          {/* Official Key Footer matching document */}
          <div className="mt-6 pt-4 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-slate-700">
            <div>
              KEY: <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">[PR] - Present</span> | <span className="text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">[AA] - Absent with Apology</span> | <span className="text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">[WA] - Absent without Apology</span>
            </div>
            <div className="mt-2 sm:mt-0 font-extrabold text-slate-900">
              NEWLIFE CHURCH CLERK INFORMATION SYSTEM
            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: RECORD NEW MEETING */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Calendar className="text-emerald-400" size={20} /> Record New Meeting
              </h3>
              <button onClick={() => setIsMeetingModalOpen(false)} className="text-slate-400 hover:text-white transition cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleMeetingSubmit} className="p-6 space-y-4 text-sm font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date *</label>
                  <input type="date" required value={meetingForm.date} onChange={(e) => setMeetingForm({...meetingForm, date: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Time Range *</label>
                  <input type="text" placeholder="e.g. 10:00 AM - 01:00 PM" required value={meetingForm.time} onChange={(e) => setMeetingForm({...meetingForm, time: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Venue *</label>
                <input type="text" placeholder="e.g. Executive Boardroom" required value={meetingForm.venue} onChange={(e) => setMeetingForm({...meetingForm, venue: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Chairperson *</label>
                  <input type="text" placeholder="Chairperson Name" required value={meetingForm.chairperson} onChange={(e) => setMeetingForm({...meetingForm, chairperson: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pastor Present *</label>
                  <input type="text" placeholder="Officiating Pastor" required value={meetingForm.pastor} onChange={(e) => setMeetingForm({...meetingForm, pastor: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Clerk / Recording Sec *</label>
                <input type="text" placeholder="Recording Clerk Name" required value={meetingForm.clerk} onChange={(e) => setMeetingForm({...meetingForm, clerk: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Agenda Document Name</label>
                  <input type="text" placeholder="Agenda_Doc.pdf" value={meetingForm.agendaDocName} onChange={(e) => setMeetingForm({...meetingForm, agendaDocName: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Confirmed Minutes Name</label>
                  <input type="text" placeholder="Minutes_Doc.pdf" value={meetingForm.minutesDocName} onChange={(e) => setMeetingForm({...meetingForm, minutesDocName: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsMeetingModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer">Save Meeting</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD BOARD MEMBER ATTENDANCE LOG */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="text-emerald-400" size={20} /> Add Member Attendance Entry
              </h3>
              <button onClick={() => setIsAttendanceModalOpen(false)} className="text-slate-400 hover:text-white transition cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAttendanceSubmit} className="p-6 space-y-4 text-sm font-semibold">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Member Name *</label>
                <input type="text" placeholder="Full Name" required value={attendanceForm.name} onChange={(e) => setAttendanceForm({...attendanceForm, name: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Department / Role *</label>
                <input type="text" placeholder="e.g. Pastoral Elder, Sabbath School" required value={attendanceForm.dept} onChange={(e) => setAttendanceForm({...attendanceForm, dept: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {['jan', 'feb', 'mar', 'apr', 'may', 'jun'].map((m) => (
                  <div key={m}>
                    <label className="block text-slate-700 font-bold mb-1 uppercase">{m}</label>
                    <select value={attendanceForm[m]} onChange={(e) => setAttendanceForm({...attendanceForm, [m]: e.target.value})} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500">
                      <option value="PR">PR (Present)</option>
                      <option value="AA">AA (Apology)</option>
                      <option value="WA">WA (Absent)</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAttendanceModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MeetingsRecords;