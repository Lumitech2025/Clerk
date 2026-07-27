import React, { useState, useEffect } from 'react';
import API from '../../../api/api';
import { 
  Baby, 
  Users, 
  Award, 
  Clock, 
  Search, 
  Calendar, 
  Phone, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

// Reusable KPI Stat Card Component
const KpiCard = ({ title, value, icon: Icon, valueColor, iconBg }) => {
  return (
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
};

const PastorChildDedications = () => {
  // Asynchronous Data & State Management
  const [dedications, setDedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch Dedications from Backend API
  const fetchDedications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get('/child-dedications/');
      const data = response.data;
      const records = Array.isArray(data) ? data : (data.results || data.data || []);
      setDedications(records);
    } catch (err) {
      console.error('Error fetching child dedications:', err);
      setError(err.response?.data?.detail || 'Unable to load child dedication records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDedications();
  }, []);

  // Dynamic Executive KPIs
  const totalDedications = dedications.length;
  const certsCollected = dedications.filter(d => (d.status || d.dedication_status) === 'Certificate Collected').length;
  const pendingCollection = dedications.filter(d => ['Pending Collection', 'Certificate Ready'].includes(d.status || d.dedication_status)).length;
  const processing = dedications.filter(d => (d.status || d.dedication_status) === 'Processing').length;

  // Search Filter Logic
  const filteredDedications = dedications.filter(item => {
    const childName = item.childName || item.child_name || '';
    const fatherName = item.fatherName || item.father_name || '';
    const motherName = item.motherName || item.mother_name || '';
    const pastor = item.officiatingPastor || item.officiating_pastor || '';
    const phone = item.phone || '';

    return (
      childName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      motherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pastor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm)
    );
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredDedications.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecords = filteredDedications.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Child Dedications</h1>
          
        </div>
      </div>

      {/* 1. TOP KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard 
          title="Total Dedications" 
          value={totalDedications} 
          icon={Baby} 
          valueColor="text-emerald-600"
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <KpiCard 
          title="Certificates Collected" 
          value={certsCollected} 
          icon={Award} 
          valueColor="text-indigo-600"
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <KpiCard 
          title="Pending Collection" 
          value={pendingCollection} 
          icon={Clock} 
          valueColor="text-amber-600"
          iconBg="bg-amber-50 text-amber-600"
        />
        <KpiCard 
          title="Processing" 
          value={processing} 
          icon={Users} 
          valueColor="text-purple-600"
          iconBg="bg-purple-50 text-purple-600"
        />
      </div>

      {/* 2. SEARCH BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search child, parents, pastor or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* 3. CHILD DEDICATIONS REGISTER TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Child Dedication Registry</h2>
            
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-lg">
            {filteredDedications.length} Total Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase text-slate-600 tracking-wider">
                <th className="py-4 px-6">Child Info</th>
                <th className="py-4 px-6">Father's Name</th>
                <th className="py-4 px-6">Mother's Name</th>
                <th className="py-4 px-6">Parent Phone</th>
                <th className="py-4 px-6">Officiating Minister</th>
                <th className="py-4 px-6">Dedication Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-semibold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-emerald-600" size={28} />
                      <span>Loading child dedication records...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-rose-600 font-semibold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={28} />
                      <span>{error}</span>
                      <button 
                        onClick={fetchDedications}
                        className="mt-2 text-xs bg-slate-100 text-slate-800 hover:bg-slate-200 px-4 py-2 rounded-lg font-bold transition cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : currentRecords.length > 0 ? (
                currentRecords.map((record) => {
                  const recordId = record.id || record._id;
                  const childName = record.childName || record.child_name;
                  const fatherName = record.fatherName || record.father_name;
                  const motherName = record.motherName || record.mother_name;
                  const dob = record.dob;
                  const phone = record.phone;
                  const pastor = record.officiatingPastor || record.officiating_pastor;
                  const dedicationDate = record.dedicationDate || record.dedication_date;

                  return (
                    <tr key={recordId} className="hover:bg-slate-50/70 transition">
                      
                      {/* Child Name & DOB */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-base">{childName}</div>
                        <div className="text-xs font-semibold text-slate-500 mt-0.5">
                          DOB: {dob}
                        </div>
                      </td>

                      {/* Father's Name */}
                      <td className="py-4 px-6 font-semibold text-slate-800 text-sm">
                        {fatherName || '—'}
                      </td>

                      {/* Mother's Name */}
                      <td className="py-4 px-6 font-semibold text-slate-800 text-sm">
                        {motherName || '—'}
                      </td>

                      {/* Parent Phone */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                          <Phone size={14} className="text-slate-400 shrink-0" /> {phone || '—'}
                        </div>
                      </td>

                      {/* Officiating Pastor */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                          <UserCheck size={16} className="text-emerald-600 shrink-0" /> {pastor}
                        </div>
                      </td>

                      {/* Dedication Date */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                          <Calendar size={14} className="text-slate-400 shrink-0" /> {dedicationDate}
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 font-semibold text-base">
                    No child dedication records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {!isLoading && !error && (
          <div className="p-5 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-slate-600">
            <div>
              Showing <span className="font-extrabold text-slate-900">{filteredDedications.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-extrabold text-slate-900">{Math.min(startIndex + itemsPerPage, filteredDedications.length)}</span> of <span className="font-extrabold text-slate-900">{filteredDedications.length}</span> entries
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
  );
};

export default PastorChildDedications;