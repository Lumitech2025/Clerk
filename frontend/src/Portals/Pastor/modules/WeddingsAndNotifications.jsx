import React, { useState, useEffect, useCallback } from 'react';
import API from '../../../api/api';
import { 
  Heart, 
  Search, 
  Calendar, 
  Loader2, 
  RefreshCw, 
  Printer,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';

// Reusable Pastoral Executive KPI Stat Card
const KpiCard = ({ title, value, icon: Icon, valueColor, iconBg }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
    <div>
      <p className="text-xs font-black text-slate-500 uppercase tracking-wider">{title}</p>
      <h3 className={`text-3xl font-black ${valueColor} mt-2 tracking-tight`}>{value}</h3>
    </div>
    <div className={`p-4 rounded-xl ${iconBg}`}>
      <Icon size={24} />
    </div>
  </div>
);

const PastorWeddingsAndNotifications = () => {
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Print State
  const [selectedWeddingForPrint, setSelectedWeddingForPrint] = useState(null);

  // Fetch real data directly from backend API
  const fetchWeddings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get('/weddings/');
      const data = response.data.results ? response.data.results : response.data;
      setWeddings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load weddings:', err);
      setError(err.response?.data?.detail || 'Unable to retrieve wedding records from server.');
      setWeddings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeddings();
  }, [fetchWeddings]);

  // Executive Pastoral KPI Calculations
  const totalNotifications = weddings.length;
  const pendingReview = weddings.filter(w => w.status === 'PENDING').length;
  const approvedUpcoming = weddings.filter(w => w.status === 'APPROVED').length;
  const completedWeddings = weddings.filter(w => w.status === 'COMPLETED').length;

  // Filter & Search Logic
  const filteredWeddings = weddings.filter(w => {
    const search = searchQuery.toLowerCase();
    const matchesSearch = 
      (w.applicant_name && w.applicant_name.toLowerCase().includes(search)) ||
      (w.spouse_name && w.spouse_name.toLowerCase().includes(search)) ||
      (w.officiating_pastor && w.officiating_pastor.toLowerCase().includes(search)) ||
      (w.counseling_pastor && w.counseling_pastor.toLowerCase().includes(search)) ||
      (w.officiating_elder && w.officiating_elder.toLowerCase().includes(search));
    
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredWeddings.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecords = filteredWeddings.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePrint = (wedding) => {
    setSelectedWeddingForPrint(wedding);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');
        
        .font-roboto {
          font-family: 'Roboto', sans-serif;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          #printable-form, #printable-form * {
            visibility: visible;
          }
          #printable-form {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
          }
        }
      `}</style>

      <div className="space-y-6 font-roboto text-slate-800 print:p-0 print:m-0 antialiased">
        
        {/* HEADER BAR */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
              <Heart className="text-rose-500" size={30} /> Weddings Notifications
            </h1>
            
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchWeddings}
              className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer flex items-center gap-2 font-bold text-xs"
              title="Refresh Registry"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-600' : ''} />
              
            </button>
          </div>
        </div>

        {/* 1. PASTORAL EXECUTIVE KPI STAT CARDS */}
        <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard 
            title="Total Notifications" 
            value={totalNotifications} 
            icon={Heart} 
            valueColor="text-rose-600"
            iconBg="bg-rose-50 text-rose-600"
          />
          <KpiCard 
            title="Pending Board Action" 
            value={pendingReview} 
            icon={Clock} 
            valueColor="text-amber-600"
            iconBg="bg-amber-50 text-amber-600"
          />
          <KpiCard 
            title="Approved & Upcoming" 
            value={approvedUpcoming} 
            icon={CheckCircle2} 
            valueColor="text-emerald-600"
            iconBg="bg-emerald-50 text-emerald-600"
          />
          <KpiCard 
            title="Completed Weddings" 
            value={completedWeddings} 
            icon={BookOpen} 
            valueColor="text-indigo-600"
            iconBg="bg-indigo-50 text-indigo-600"
          />
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="print:hidden bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium">
            <AlertCircle size={20} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 2. SEARCH & STATUS FILTER BAR */}
        <div className="print:hidden bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by groom, bride, pastor, or elder..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
            {['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  statusFilter === st 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* 3. WEDDINGS REGISTER TABLE */}
        <div className="print:hidden bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Wedding Notifications</h2>
              
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-lg">
              {filteredWeddings.length} Total Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider text-xs">
                  <th className="py-4 px-5">Couple Details</th>
                  <th className="py-4 px-5">Church / Field</th>
                  <th className="py-4 px-5">Intended Date & Place</th>
                  <th className="py-4 px-5">Officiating Team</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="animate-spin text-emerald-600" size={28} />
                        <span>Loading wedding records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredWeddings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500 font-semibold">
                      No wedding notifications found matching your search or status filter.
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Couple Details */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-base">{w.applicant_name}</div>
                        <div className="font-bold text-rose-600 text-xs mt-0.5">{w.spouse_name}</div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-1">
                          <Phone size={12} /> {w.applicant_phone || 'N/A'} / {w.spouse_phone || 'N/A'}
                        </div>
                      </td>

                      {/* Church / Field */}
                      <td className="py-4 px-5 text-xs space-y-1">
                        <div>
                          <span className="font-semibold text-slate-500">Groom: </span>
                          <span className="font-bold text-slate-800">{w.applicant_membership || 'NEWLIFE SDA CHURCH'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">Bride: </span>
                          <span className="font-bold text-slate-800">{w.spouse_church || '—'}</span>
                          {w.spouse_conference && (
                            <span className="text-slate-500 block text-[11px] font-medium">({w.spouse_conference})</span>
                          )}
                        </div>
                      </td>

                      {/* Intended Date & Place */}
                      <td className="py-4 px-5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                          <Calendar size={14} className="text-emerald-600 shrink-0" />
                          {w.wedding_date}
                        </div>
                        <p className="text-slate-600 font-semibold mt-1">{w.wedding_place}</p>
                        {w.reception_venue && (
                          <p className="text-slate-400 text-[11px]">Reception: {w.reception_venue}</p>
                        )}
                      </td>

                      {/* Officiating Team */}
                      <td className="py-4 px-5 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <UserCheck size={14} className="text-emerald-600 shrink-0" />
                          <span>Officiating: {w.officiating_pastor}</span>
                        </div>
                        {w.counseling_pastor && (
                          <p className="text-slate-500 font-medium pl-5">Counseling: {w.counseling_pastor}</p>
                        )}
                        {w.officiating_elder && (
                          <p className="text-slate-500 font-medium pl-5">Elder: {w.officiating_elder}</p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                          w.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 
                          w.status === 'COMPLETED' ? 'bg-indigo-100 text-indigo-800' :
                          w.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {w.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handlePrint(w)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer size={15} /> Print Form
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          {!loading && !error && filteredWeddings.length > 0 && (
            <div className="p-5 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-slate-600">
              <div>
                Showing <span className="font-extrabold text-slate-900">{startIndex + 1}</span> to <span className="font-extrabold text-slate-900">{Math.min(startIndex + itemsPerPage, filteredWeddings.length)}</span> of <span className="font-extrabold text-slate-900">{filteredWeddings.length}</span> entries
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition cursor-pointer ${
                      currentPage === page
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* PRINTABLE DOCUMENT TEMPLATE FOR PASTORAL COUNSELING AND BOARD REVIEW */}
      {selectedWeddingForPrint && (
        <div id="printable-form" className="hidden print:block font-serif text-black max-w-3xl mx-auto space-y-4">
          <div className="text-center space-y-1 border-b-2 border-black pb-3">
            <h1 className="text-lg font-bold uppercase tracking-wider">NEWLIFE SEVENTH-DAY ADVENTIST CHURCH</h1>
            <p className="text-[10px] uppercase tracking-widest font-sans font-semibold">5TH AVENUE, NAIROBI • CHURCH CLERK DESK</p>
            <h2 className="text-sm font-bold underline mt-2 uppercase font-sans">WEDDING NOTIFICATION FORM</h2>
          </div>

          <div className="text-xs space-y-2 font-mono leading-relaxed">
            <p>1. Full name of applicant: <span className="font-bold underline">{selectedWeddingForPrint.applicant_name}</span></p>
            <p>2. Church membership: <span className="font-bold underline">{selectedWeddingForPrint.applicant_membership || 'NEWLIFE SDA CHURCH, 5TH AVENUE'}</span></p>
            <p>3. Date of birth: <span className="font-bold underline">{selectedWeddingForPrint.applicant_dob || '—'}</span></p>
            <p>4. Occupation: <span className="font-bold underline">{selectedWeddingForPrint.applicant_occupation || '—'}</span></p>
            <p>5. Mobile number: <span className="font-bold underline">{selectedWeddingForPrint.applicant_phone}</span></p>
            <p>6. Address: <span className="font-bold underline">{selectedWeddingForPrint.applicant_address || '—'}</span></p>
            <p>7. Intended date of wedding: <span className="font-bold underline">{selectedWeddingForPrint.wedding_date}</span></p>
            <p>8. Place of wedding: <span className="font-bold underline">{selectedWeddingForPrint.wedding_place}</span></p>
            <p>9. The officiating pastor: <span className="font-bold underline">{selectedWeddingForPrint.officiating_pastor}</span></p>
            <p>10. The counseling pastor: <span className="font-bold underline">{selectedWeddingForPrint.counseling_pastor || selectedWeddingForPrint.officiating_pastor}</span></p>
            <p>11. The officiating elder: <span className="font-bold underline">{selectedWeddingForPrint.officiating_elder}</span></p>
            <p>12. Wedding reception venue: <span className="font-bold underline">{selectedWeddingForPrint.reception_venue || '—'}</span></p>
            
            <div className="pt-2 flex justify-between">
              <p>13. Signed: ___________________________</p>
              <p>On this date: <span className="font-bold underline">{selectedWeddingForPrint.applicant_signature_date || selectedWeddingForPrint.notification_date || '—'}</span></p>
            </div>

            <div className="border-t border-black my-2"></div>

            <h3 className="font-bold uppercase text-xs text-center my-1 font-sans">PARTICULARS OF SPOUSE TO BE</h3>
            <p>1. Name: <span className="font-bold underline">{selectedWeddingForPrint.spouse_name}</span></p>
            <p>2. Name of church where membership is: <span className="font-bold underline">{selectedWeddingForPrint.spouse_church}</span></p>
            <p>3. Conference or field: <span className="font-bold underline">{selectedWeddingForPrint.spouse_conference || '—'}</span></p>
            <p>4. Membership number if in Newlife: <span className="font-bold underline">{selectedWeddingForPrint.spouse_membership_no || 'N/A'}</span></p>
            <p>5. Date of birth: <span className="font-bold underline">{selectedWeddingForPrint.spouse_dob || '—'}</span></p>
            <p>6. Occupation: <span className="font-bold underline">{selectedWeddingForPrint.spouse_occupation || '—'}</span></p>
            <p>7. Mobile Number: <span className="font-bold underline">{selectedWeddingForPrint.spouse_phone}</span></p>
            <p>8. Address: <span className="font-bold underline">{selectedWeddingForPrint.spouse_address || '—'}</span></p>

            <div className="pt-2 flex justify-between">
              <p>9. Signed: ___________________________</p>
              <p>On this date: <span className="font-bold underline">{selectedWeddingForPrint.spouse_signature_date || selectedWeddingForPrint.notification_date || '—'}</span></p>
            </div>

            <div className="border-t border-black my-2"></div>

            <div className="flex justify-between font-mono">
              <p>This notice was received by: <span className="font-bold underline">{selectedWeddingForPrint.notice_received_by || '___________________________'}</span></p>
              <p>On this date: <span className="font-bold underline">{selectedWeddingForPrint.notice_received_date || '___________________'}</span></p>
            </div>
          </div>

          <div className="border-t border-black pt-2 text-[9px] font-sans italic text-slate-700">
            <p>This notice must be given to the church at least three months in advance to give the church ample time to prepare the applicants for a decent and acceptable church wedding. The preparation involves prayer and counseling. The applicants are supposed to choose the officiating Pastor and Elder. The elder must be a serving Elder of Newlife SDA Church.</p>
          </div>

          <div className="border border-black p-2 space-y-1 text-[11px] font-mono">
            <p className="font-bold text-center font-sans uppercase">FOR OFFICIAL USE ONLY</p>
            <p>Action taken by the Newlife SDA Church board on Date: ____________________</p>
            <p>Status: [ {selectedWeddingForPrint.status === 'APPROVED' ? 'X' : ' '} ] Approved &nbsp;&nbsp;&nbsp;&nbsp; [ {selectedWeddingForPrint.status === 'REJECTED' ? 'X' : ' '} ] Not approved</p>
            <p>Signed by the Chairman of the board: ____________________________</p>
            <p>Recommendations: _______________________________________________________</p>
          </div>
        </div>
      )}
    </>
  );
};

export default PastorWeddingsAndNotifications;