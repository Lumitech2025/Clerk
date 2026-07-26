import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Users, 
  Award, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Phone, 
  Mail, 
  UserCheck, 
  MapPin, 
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2
} from 'lucide-react';

import API from '../../../api/api';

// Reusable KPI Stat Card
const KpiCard = ({ title, value, icon: Icon, valueColor, iconBg }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className={`text-3xl font-extrabold ${valueColor} mt-2 tracking-tight`}>{value}</h3>
      </div>
      <div className={`p-4 rounded-xl ${iconBg}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

const BaptismsModule = ({ currentUserRole = 'Church Clerk' }) => {
  const [baptisms, setBaptisms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reminderSendingId, setReminderSendingId] = useState(null);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    gender: 'Male',
    phone: '',
    email: '',
    officiatingPastor: '',
    placeOfBaptism: 'Newlife Main Sanctuary',
    baptismDate: '',
    status: 'Processing'
  });

  // Helper: Retrieve bearer token (checks common storage keys)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('access') || localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  };

  const canManageRecords = !currentUserRole || ['Church Clerk', 'Pastor'].includes(currentUserRole);

  // Fetch Baptisms from Backend
  const fetchBaptisms = async () => {
    setLoading(true);
    try {
      const response = await API.get('/baptisms/');
      const data = response.data;
      setBaptisms(Array.isArray(data) ? data : data.results || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaptisms();
  }, []);

  // Dynamic KPIs calculated from backend data
  const totalBaptisms = baptisms.length;
  const personsBaptised = baptisms.length;
  const certsCollected = baptisms.filter(b => b.status === 'Certificate Collected').length;
  const pendingCollection = baptisms.filter(b => b.status === 'Pending Collection' || b.status === 'Certificate Ready').length;

  // Inline Status Change Handler (PATCH)
  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await API.patch(`/baptisms/${id}/`, { status: newStatus });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to update status');
      }

      const updatedRecord = await response.json();
      setBaptisms(prev => prev.map(item => item.id === id ? updatedRecord : item));
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  // Send Reminder Handler (POST)
  const handleSendReminder = async (record) => {
    setReminderSendingId(record.id);
    try {
      const response = await API.post(`/baptisms/${record.id}/send-reminder/`);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to send reminder notifications');
      }

      const result = await response.json();
      alert(result.message || `Reminder successfully sent to ${record.fullName || record.full_name}!`);
    } catch (err) {
      alert(`Error sending reminder: ${err.message}`);
    } finally {
      setReminderSendingId(null);
    }
  };

  
    // Form Submit Handler (POST)
    const handleFormSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);

      // 1. Explicitly map frontend state (camelCase) to DRF expected fields (snake_case)
      const payload = {
        full_name: formData.fullName,
        dob: formData.dob,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        officiating_pastor: formData.officiatingPastor,
        place_of_baptism: formData.placeOfBaptism,
        baptism_date: formData.baptismDate,
        status: formData.status,
      };

      console.log('Sending Payload:', payload);

      try {
        // 2. Use centralized Axios instance (API) instead of fetch(API_BASE_URL)
        const response = await API.post('/baptisms/', payload);
        const newRecord = response.data;

        // 3. Update local state with newly saved record
        setBaptisms([newRecord, ...baptisms]);
        setIsModalOpen(false);

        // 4. Reset form state
        setFormData({
          fullName: '',
          dob: '',
          gender: 'Male',
          phone: '',
          email: '',
          officiatingPastor: '',
          placeOfBaptism: 'Newlife Main Sanctuary',
          baptismDate: '',
          status: 'Processing',
        });
      } catch (err) {
        console.error('Error creating record:', err);
        // DRF validation errors usually come back under err.response.data
        const errorMessage =
          err.response?.data?.detail ||
          (typeof err.response?.data === 'object'
            ? JSON.stringify(err.response.data)
            : err.message);

        alert(`Error creating record: ${errorMessage}`);
      } finally {
        setSubmitting(false);
      }
    };
  // Helper for status badge styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Certificate Collected':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500';
      case 'Certificate Ready':
        return 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500';
      case 'Pending Collection':
        return 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500';
      case 'Processing':
        return 'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-500';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 focus:ring-slate-400';
    }
  };

  // Filter Logic
  const filteredBaptisms = baptisms.filter(item => {
    const name = item.fullName || item.full_name || '';
    const pastor = item.officiatingPastor || item.officiating_pastor || '';
    const phone = item.phone || '';
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pastor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredBaptisms.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecords = filteredBaptisms.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased">
      
      {/* 1. TOP KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard 
          title="Total Baptisms" 
          value={totalBaptisms} 
          icon={Droplets} 
          valueColor="text-emerald-600"
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <KpiCard 
          title="Persons Baptised" 
          value={personsBaptised} 
          icon={Users} 
          valueColor="text-slate-900"
          iconBg="bg-blue-50 text-blue-600"
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
      </div>

      {/* 2. ACTIONS & FILTERS BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search candidate name, pastor, or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
          />
        </div>

        {/* Filters & Action Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
            <Filter size={18} className="text-slate-400" />
            <select 
              value={statusFilter} 
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Processing">Processing</option>
              <option value="Certificate Ready">Certificate Ready</option>
              <option value="Pending Collection">Pending Collection</option>
              <option value="Certificate Collected">Certificate Collected</option>
            </select>
          </div>

          {/* RECORD BAPTISM BUTTON */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-base font-bold shadow-xs transition cursor-pointer"
          >
            <Plus size={20} />
            <span>Record Baptism</span>
          </button>
        </div>
      </div>

      {/* 3. BAPTISM RECORDS DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Baptism Register</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Manage candidate profiles, certificate pickup, and notifications</p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-lg">
            {filteredBaptisms.length} Total Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold uppercase text-slate-600 tracking-wider">
                <th className="py-4 px-6">Candidate</th>
                <th className="py-4 px-6">Contact Details</th>
                <th className="py-4 px-6">Officiating Minister</th>
                <th className="py-4 px-6">Date & Venue</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-center">Collection Reminder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base font-normal">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-500 font-semibold">
                      <Loader2 className="animate-spin text-emerald-600" size={24} />
                      <span>Loading baptism records from database...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-rose-500 font-semibold">
                    {error}
                  </td>
                </tr>
              ) : currentRecords.length > 0 ? (
                currentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition">
                    
                    {/* Candidate */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-base">{record.fullName || record.full_name}</div>
                      <div className="text-xs font-semibold text-slate-500 mt-0.5">
                        {record.gender} • DOB: {record.dob}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                        <Phone size={14} className="text-slate-400" /> {record.phone}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mt-1">
                        <Mail size={14} className="text-slate-400" /> {record.email || 'N/A'}
                      </div>
                    </td>

                    {/* Officiating Pastor */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                        <UserCheck size={16} className="text-emerald-600" /> {record.officiatingPastor || record.officiating_pastor}
                      </div>
                    </td>

                    {/* Location & Date */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                        <Calendar size={14} className="text-slate-400" /> {record.baptismDate || record.baptism_date}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mt-1">
                        <MapPin size={14} className="text-slate-400" /> {record.placeOfBaptism || record.place_of_baptism}
                      </div>
                    </td>

                    {/* INLINE EDITABLE STATUS SELECTOR */}
                    <td className="py-4 px-6">
                      {canManageRecords ? (
                        <select
                          value={record.status}
                          onChange={(e) => handleStatusChange(record.id, e.target.value)}
                          className={`text-xs font-extrabold px-3 py-1.5 rounded-full border focus:outline-none cursor-pointer transition ${getStatusStyle(record.status)}`}
                        >
                          <option value="Processing">Processing</option>
                          <option value="Certificate Ready">Certificate Ready</option>
                          <option value="Pending Collection">Pending Collection</option>
                          <option value="Certificate Collected">Certificate Collected</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-extrabold border ${getStatusStyle(record.status)}`}>
                          {record.status}
                        </span>
                      )}
                    </td>

                    {/* REMINDER COLUMN */}
                    <td className="py-4 px-6 text-center">
                      {['Pending Collection', 'Certificate Ready'].includes(record.status) ? (
                        <button
                          onClick={() => handleSendReminder(record)}
                          disabled={reminderSendingId === record.id}
                          className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
                        >
                          {reminderSendingId === record.id ? (
                            <Loader2 className="animate-spin" size={12} />
                          ) : (
                            <Send size={12} />
                          )}
                          <span>{reminderSendingId === record.id ? 'Sending...' : 'Send Reminder'}</span>
                        </button>
                      ) : record.status === 'Certificate Collected' ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 inline-block">
                          Collected
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 italic">
                          N/A
                        </span>
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 font-semibold text-base">
                    No baptism records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-slate-600">
          <div>
            Showing <span className="font-extrabold text-slate-900">{filteredBaptisms.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-extrabold text-slate-900">{Math.min(startIndex + itemsPerPage, filteredBaptisms.length)}</span> of <span className="font-extrabold text-slate-900">{filteredBaptisms.length}</span> entries
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
      </div>

      {/* 4. MODAL: RECORD NEW BAPTISM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Droplets size={22} className="text-emerald-400" />
                <h3 className="font-bold text-lg">Record New Baptism</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white transition cursor-pointer p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-sm font-semibold">
              <div>
                <label className="block text-slate-800 font-bold mb-1.5">Candidate Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. John Doe Mwangi"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Date of Birth *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Gender *</label>
                  <select 
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Phone Number *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+254 7..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="candidate@email.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Officiating Pastor *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.officiatingPastor}
                    onChange={(e) => setFormData({ ...formData, officiatingPastor: e.target.value })}
                    placeholder="Pr. David Omondi"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Baptism Date *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.baptismDate}
                    onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Place of Baptism *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.placeOfBaptism}
                    onChange={(e) => setFormData({ ...formData, placeOfBaptism: e.target.value })}
                    placeholder="Newlife Main Sanctuary"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Initial Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
                  >
                    <option value="Processing">Processing</option>
                    <option value="Certificate Ready">Certificate Ready</option>
                    <option value="Pending Collection">Pending Collection</option>
                    <option value="Certificate Collected">Certificate Collected</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition cursor-pointer disabled:bg-emerald-400"
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  <span>{submitting ? 'Saving...' : 'Save Record'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default BaptismsModule;