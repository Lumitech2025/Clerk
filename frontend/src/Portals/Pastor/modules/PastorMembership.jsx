import React, { useState, useEffect, useCallback } from 'react';
import API from '../../../api/api';
import { 
  Users, 
  ArrowLeftRight, 
  Droplets, 
  BookOpen, 
  Search, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle
} from 'lucide-react';

export default function MembershipRecords() {
  const [activeSubTab, setActiveSubTab] = useState('all');
  
  // API State
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // FETCH MEMBERS FROM BACKEND API
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedYear !== 'All') params.year_joined = selectedYear;

      if (activeSubTab === 'transfers') params.joining_method = 'Transfer';
      if (activeSubTab === 'baptisms') params.joining_method = 'Baptism';
      if (activeSubTab === 'pof') params.joining_method = 'Profession of Faith';

      const response = await API.get('member-records/', { params });
      
      if (response.data.results) {
        setMembers(response.data.results);
        setTotalCount(response.data.count);
      } else {
        setMembers(response.data || []);
        setTotalCount(response.data?.length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setError('Failed to load membership records. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, selectedYear, activeSubTab]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif] antialiased space-y-5 text-slate-800 select-none">
      
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Membership Records & Registers
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Official membership directory, transfers, baptisms, and professions of faith
            </p>
          </div>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        
        {/* STANDARDIZED SUB-TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
          {[
            { id: 'all', label: 'All Members', icon: Users },
            { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
            { id: 'baptisms', label: 'Baptisms', icon: Droplets },
            { id: 'pof', label: 'Profession of Faith', icon: BookOpen }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveSubTab(tab.id); setCurrentPage(1); }}
                className={`flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? 'bg-slate-950 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} /> 
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* FILTERS & SEARCH */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 shadow-xs">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
              className="bg-transparent focus:outline-none font-bold text-slate-800 cursor-pointer text-xs"
            >
              <option value="All">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search member name or phone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
          <button onClick={fetchMembers} className="underline hover:text-rose-900 cursor-pointer">Retry</button>
        </div>
      )}

      {/* MAIN DATA TABLE AREA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 space-y-4 min-h-[420px] flex flex-col justify-between">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 text-xs font-bold gap-2">
            <Loader2 className="animate-spin text-emerald-600" size={26} />
            Loading registry records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-center border-r border-slate-100">S/No.</th>
                  <th className="py-3 px-4 border-r border-slate-100">Member Name</th>
                  <th className="py-3 px-3 border-r border-slate-100">Gender</th>
                  <th className="py-3 px-4 border-r border-slate-100">Phone Number</th>
                  <th className="py-3 px-4 border-r border-slate-100">Method of Entry</th>
                  <th className="py-3 px-4 border-r border-slate-100">Home Church</th>
                  <th className="py-3 px-3 text-center border-r border-slate-100">Year</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {members.length > 0 ? (
                  members.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 text-center font-bold text-slate-400 border-r border-slate-100">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 border-r border-slate-100">{m.full_name}</td>
                      <td className="py-3 px-3 font-semibold text-slate-600 border-r border-slate-100">{m.gender}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600 border-r border-slate-100">{m.phone_number || 'N/A'}</td>
                      <td className="py-3 px-4 border-r border-slate-100">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${
                          m.joining_method === 'Baptism' ? 'bg-blue-500/10 text-blue-700 border border-blue-500/20' :
                          m.joining_method === 'Transfer' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' :
                          'bg-purple-500/10 text-purple-700 border border-purple-500/20'
                        }`}>
                          {m.joining_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600 border-r border-slate-100">{m.home_church || '—'}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-600 border-r border-slate-100">{m.year_joined}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          m.is_active ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-800 border border-rose-500/30'
                        }`}>
                          {m.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 font-bold">
                      No member records found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-bold text-slate-800 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-slate-400">entries per page</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 font-extrabold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}