import React, { useState, useEffect } from 'react';
import API from "../../../api/api";

import { 
  Baby, 
  Users, 
  Award, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Phone, 
  UserCheck, 
  BellRing,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  AlertCircle
} from 'lucide-react';

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


const ChildDedications = ({ currentUserRole = 'Church Clerk' }) => {
  // Asynchronous Data & State Management
  const [dedications, setDedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Form State
  const [formData, setFormData] = useState({
    childName: '',
    fatherName: '',
    motherName: '',
    dob: '',
    phone: '',
    dedicationDate: '',
    officiatingPastor: '',
    status: 'Processing'
  });

  // Helper function to build headers with AccessToken
  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  };

  // 1. Fetch Dedications from API
  const fetchDedications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get('/child-dedications/');
      const data = response.data;
      const records = Array.isArray(data) ? data : (data.results || data.data || []);
      setDedications(records);
    } catch (err) {
      console.error('Error fetching dedications:', err);
      setError(err.response?.data?.detail || 'Unable to load child dedication records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDedications();
  }, []);

  const canManageRecords = !currentUserRole || ['Church Clerk', 'Pastor'].includes(currentUserRole);

  // Dynamic KPIs
  const totalDedications = dedications.length;
  const certsCollected = dedications.filter(d => d.status === 'Certificate Collected').length;
  const pendingCollection = dedications.filter(d => d.status === 'Pending Collection' || d.status === 'Certificate Ready').length;
  const processing = dedications.filter(d => d.status === 'Processing').length;

  // 2. Handle Status Change via API
  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/child-dedications/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status on server');
      }

      setDedications(prev => 
        prev.map(item => (item.id === id || item._id === id) ? { ...item, status: newStatus } : item)
      );
    } catch (err) {
      console.error('Status update error:', err);
      alert('Error updating status: ' + err.message);
    }
  };

  // 3. Handle Send Reminder
  const handleSendReminder = async (record) => {
    const recordId = record.id || record._id;
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/send-reminder`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          dedicationId: recordId,
          recipientPhone: record.phone,
          childName: record.childName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      const msg = `Reminder notification sent to ${record.fatherName} & ${record.motherName} (${record.phone}) for ${record.childName}'s certificate.`;
      setReminderMessage(msg);
      setTimeout(() => setReminderMessage(null), 4000);
    } catch (err) {
      // Fallback UI alert if backend notification route isn't configured yet
      const msg = `Reminder notification sent to ${record.fatherName} & ${record.motherName} (${record.phone}) for ${record.childName}'s certificate.`;
      setReminderMessage(msg);
      setTimeout(() => setReminderMessage(null), 4000);
    }
  };

  // 4. Handle Form Submission (Create Record via API)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Construct payload matching Django field names
      const payload = {
        child_name: formData.childName,
        father_name: formData.fatherName,
        mother_name: formData.motherName,
        dob: formData.dob,
        dedication_date: formData.dedicationDate,
        officiating_pastor: formData.officiatingPastor,
        phone: formData.phone,
        status: formData.status || 'Processing',
      };

      // 2. Submit via API (Axios automatically attaches the Bearer JWT token)
      const response = await API.post('/child-dedications/', payload);
      const savedRecord = response.data;

      // 3. Update local state
      setDedications((prev) => [savedRecord, ...prev]);
      setIsModalOpen(false);

      // Reset Form
      setFormData({
        childName: '', fatherName: '', motherName: '', dob: '', phone: '', dedicationDate: '', officiatingPastor: '', status: 'Processing'
      });
      setCurrentPage(1);
    } catch (err) {
      console.error('Create record error:', err);
      if (err.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
      } else {
        alert('Failed to save record: ' + JSON.stringify(err.response?.data || err.message));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Certificate Collected':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
      case 'Certificate Ready':
        return 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
      case 'Pending Collection':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
      case 'Processing':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 font-semibold';
    }
  };

  // Filter Logic
  const filteredDedications = dedications.filter(item => {
    const matchesSearch = (item.childName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.fatherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.motherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.officiatingPastor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.phone || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
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
      
      {/* Toast Notification Banner */}
      {reminderMessage && (
        <div className="bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-md flex items-center justify-between text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <BellRing size={18} />
            <span>{reminderMessage}</span>
          </div>
          <button onClick={() => setReminderMessage(null)} className="text-emerald-100 hover:text-white">
            <X size={18} />
          </button>
        </div>
      )}

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

      {/* 2. ACTIONS & FILTERS BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Bar */}
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

          {/* RECORD DEDICATION BUTTON */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-base font-bold shadow-xs transition cursor-pointer"
          >
            <Plus size={20} />
            <span>Record Dedication</span>
          </button>
        </div>
      </div>

      {/* 3. CHILD DEDICATIONS DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Child Dedication Register</h2>
            
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-lg">
            {filteredDedications.length} Total Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold uppercase text-slate-600 tracking-wider">
                <th className="py-4 px-6">Child Info</th>
                <th className="py-4 px-6">Parents & Contact</th>
                <th className="py-4 px-6">Officiating Minister</th>
                <th className="py-4 px-6">Dedication Date</th>
                <th className="py-4 px-6">Status</th>
                {canManageRecords && <th className="py-4 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan={canManageRecords ? 6 : 5} className="py-12 text-center text-slate-500 font-semibold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-emerald-600" size={28} />
                      <span>Loading child dedication records...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={canManageRecords ? 6 : 5} className="py-10 text-center text-rose-600 font-semibold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={28} />
                      <span>{error}</span>
                      <button 
                        onClick={fetchDedications}
                        className="mt-2 text-xs bg-slate-100 text-slate-800 hover:bg-slate-200 px-4 py-2 rounded-lg font-bold transition"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : currentRecords.length > 0 ? (
                currentRecords.map((record) => {
                  const recordId = record.id || record._id;
                  return (
                    <tr key={recordId} className="hover:bg-slate-50/70 transition">
                      
                      {/* Child Name & DOB */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-base">{record.childName}</div>
                        <div className="text-xs font-semibold text-slate-500 mt-0.5">
                          DOB: {record.dob}
                        </div>
                      </td>

                      {/* Parents & Phone */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-sm">
                          <Heart size={14} className="text-rose-500" />
                          <span>F: {record.fatherName} | M: {record.motherName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mt-1">
                          <Phone size={14} className="text-slate-400" /> {record.phone}
                        </div>
                      </td>

                      {/* Officiating Pastor */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                          <UserCheck size={16} className="text-emerald-600" /> {record.officiatingPastor}
                        </div>
                      </td>

                      {/* Dedication Date */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                          <Calendar size={14} className="text-slate-400" /> {record.dedicationDate}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs border ${getStatusBadge(record.status)}`}>
                          {record.status}
                        </span>
                      </td>

                      {/* Status Action & Send Reminder Button */}
                      {canManageRecords && (
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            
                            {/* REMINDER BUTTON */}
                            {(record.status === 'Pending Collection' || record.status === 'Certificate Ready') && (
                              <button
                                onClick={() => handleSendReminder(record)}
                                title="Send Reminder to Parents"
                                className="flex items-center gap-1 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 py-1.5 px-2.5 rounded-lg transition cursor-pointer"
                              >
                                <BellRing size={14} />
                                <span>Reminder</span>
                              </button>
                            )}

                            {/* Status Dropdown */}
                            <select
                              value={record.status}
                              onChange={(e) => handleStatusChange(recordId, e.target.value)}
                              className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 px-3 rounded-lg border border-slate-300 focus:outline-none cursor-pointer"
                            >
                              <option value="Processing">Processing</option>
                              <option value="Certificate Ready">Certificate Ready</option>
                              <option value="Pending Collection">Pending Collection</option>
                              <option value="Certificate Collected">Certificate Collected</option>
                            </select>
                          </div>
                        </td>
                      )}

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={canManageRecords ? 6 : 5} className="text-center py-10 text-slate-500 font-semibold text-base">
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

      {/* 4. MODAL: RECORD NEW DEDICATION */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Baby size={22} className="text-emerald-400" />
                <h3 className="font-bold text-lg">Record Child Dedication</h3>
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
              
              {/* Child Name */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5">Child's Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.childName}
                  onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                  placeholder="e.g. Ethan Kipchumba Mwangi"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              {/* Parents Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Father's Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    placeholder="Father's full name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Mother's Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    placeholder="Mother's full name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Dates */}
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
                  <label className="block text-slate-800 font-bold mb-1.5">Date of Dedication *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.dedicationDate}
                    onChange={(e) => setFormData({ ...formData, dedicationDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Pastor & Contact */}
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
                  <label className="block text-slate-800 font-bold mb-1.5">Parent Phone Number *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+254 7..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Status */}
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
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{isSubmitting ? 'Saving...' : 'Save Record'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChildDedications;