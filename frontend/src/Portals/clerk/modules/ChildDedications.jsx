import React, { useState } from 'react';
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
  Heart
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
  // Sample Data
  const [dedications, setDedications] = useState([
    {
      id: 1,
      childName: "Ethan Kipchumba Mwangi",
      fatherName: "David Mwangi",
      motherName: "Hannah Wanjiku",
      dob: "2025-11-10",
      phone: "+254 712 987 654",
      officiatingPastor: "Pr. David Omondi",
      dedicationDate: "2026-02-15",
      status: "Certificate Collected"
    },
    {
      id: 2,
      childName: "Zoe Achieng Otieno",
      fatherName: "Peter Otieno",
      motherName: "Mary Otieno",
      dob: "2026-01-05",
      phone: "+254 722 112 233",
      officiatingPastor: "Pr. John Musyoka",
      dedicationDate: "2026-04-12",
      status: "Pending Collection"
    },
    {
      id: 3,
      childName: "Liam Mutua Kilonzo",
      fatherName: "Joseph Kilonzo",
      motherName: "Faith Kilonzo",
      dob: "2025-08-20",
      phone: "+254 733 445 566",
      officiatingPastor: "Pr. Josephat Wafula",
      dedicationDate: "2026-05-18",
      status: "Certificate Ready"
    },
    {
      id: 4,
      childName: "Chloe Nduta Kamau",
      fatherName: "Simon Kamau",
      motherName: "Eunice Kamau",
      dob: "2026-03-01",
      phone: "+254 700 889 900",
      officiatingPastor: "Pr. David Omondi",
      dedicationDate: "2026-06-20",
      status: "Processing"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Form State matching requested parameters
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

  const canManageRecords = !currentUserRole || ['Church Clerk', 'Pastor'].includes(currentUserRole);

  // Dynamic KPIs
  const totalDedications = dedications.length;
  const certsCollected = dedications.filter(d => d.status === 'Certificate Collected').length;
  const pendingCollection = dedications.filter(d => d.status === 'Pending Collection' || d.status === 'Certificate Ready').length;
  const processing = dedications.filter(d => d.status === 'Processing').length;

  const handleStatusChange = (id, newStatus) => {
    setDedications(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const handleSendReminder = (record) => {
    // Action to send reminder to parents via phone/email
    const msg = `Reminder notification sent to ${record.fatherName} & ${record.motherName} (${record.phone}) for ${record.childName}'s certificate.`;
    setReminderMessage(msg);
    setTimeout(() => setReminderMessage(null), 4000);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const newRecord = {
      id: Date.now(),
      ...formData
    };
    setDedications([newRecord, ...dedications]);
    setIsModalOpen(false);
    setFormData({
      childName: '', fatherName: '', motherName: '', dob: '', phone: '', dedicationDate: '', officiatingPastor: '', status: 'Processing'
    });
    setCurrentPage(1);
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
    const matchesSearch = item.childName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.motherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.officiatingPastor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.phone.includes(searchTerm);
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
            <p className="text-sm font-medium text-slate-500 mt-0.5">Manage infant dedication records and parent notifications</p>
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
              {currentRecords.length > 0 ? (
                currentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition">
                    
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
                            onChange={(e) => handleStatusChange(record.id, e.target.value)}
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
                ))
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
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Record
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