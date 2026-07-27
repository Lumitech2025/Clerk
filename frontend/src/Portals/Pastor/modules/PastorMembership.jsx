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
    <div className="font-sans space-y-6 text-slate-800 leading-relaxed">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Users size={22} />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Membership Records & Registers
            </h1>
          </div>
          <p className="text-xs font-normal text-slate-500 mt-1">
            Centralized portal for viewing church membership rolls, transfers, baptisms, and professions of faith.
          </p>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* SUB TABS */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All Members', icon: Users },
            { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
            { id: 'baptisms', label: 'Baptisms', icon: Droplets },
            { id: 'pof', label: 'Profession of Faith', icon: BookOpen }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveSubTab(tab.id); setCurrentPage(1); }}
                className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer ${
                  activeSubTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* FILTERS */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700">
            <Calendar size={15} className="text-slate-400" />
            <span className="text-slate-500">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
              className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer"
            >
              <option value="All">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search member name or phone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* MAIN DATA TABLES AREA */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-6 space-y-4 min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
            <Loader2 className="animate-spin mb-2" size={24} />
            Loading registry records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 font-semibold uppercase text-slate-800">
                  <th className="border border-slate-300 py-3 px-3 text-center">S/No.</th>
                  <th className="border border-slate-300 py-3 px-4">Member Name</th>
                  <th className="border border-slate-300 py-3 px-3">Gender</th>
                  <th className="border border-slate-300 py-3 px-4">Phone Number</th>
                  <th className="border border-slate-300 py-3 px-4">Method of Entry</th>
                  <th className="border border-slate-300 py-3 px-4">Home Church</th>
                  <th className="border border-slate-300 py-3 px-3 text-center">Year</th>
                  <th className="border border-slate-300 py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-normal text-slate-800">
                {members.length > 0 ? (
                  members.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="border border-slate-300 py-2.5 px-3 text-center font-medium text-slate-600">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="border border-slate-300 py-2.5 px-4 font-semibold text-slate-900">{m.full_name}</td>
                      <td className="border border-slate-300 py-2.5 px-3 text-slate-700">{m.gender}</td>
                      <td className="border border-slate-300 py-2.5 px-4 text-slate-700">{m.phone_number || 'N/A'}</td>
                      <td className="border border-slate-300 py-2.5 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                          m.joining_method === 'Baptism' ? 'bg-blue-100 text-blue-800' :
                          m.joining_method === 'Transfer' ? 'bg-amber-100 text-amber-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {m.joining_method}
                        </span>
                      </td>
                      <td className="border border-slate-300 py-2.5 px-4 text-slate-700">{m.home_church}</td>
                      <td className="border border-slate-300 py-2.5 px-3 text-center font-medium text-slate-600">{m.year_joined}</td>
                      <td className="border border-slate-300 py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${m.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {m.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                      No member records found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-normal text-slate-600">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries per page</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded-xl hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border rounded-xl hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}