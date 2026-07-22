import React, { useState } from 'react';
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
  ChevronRight
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

const BaptismsModule = ({ currentUserRole = 'Church Clerk' }) => {
  // Sample Data
  const [baptisms, setBaptisms] = useState([
    {
      id: 1,
      fullName: "Samuel Kibet",
      dob: "1998-05-14",
      gender: "Male",
      phone: "+254 712 345 678",
      email: "samuel.k@gmail.com",
      officiatingPastor: "Pr. David Omondi",
      placeOfBaptism: "Newlife Main Sanctuary",
      baptismDate: "2026-06-12",
      status: "Certificate Collected"
    },
    {
      id: 2,
      fullName: "Grace Njeri Mwangi",
      dob: "2002-11-20",
      gender: "Female",
      phone: "+254 722 987 654",
      email: "gnjeri@yahoo.com",
      officiatingPastor: "Pr. John Musyoka",
      placeOfBaptism: "Kitsuru Pool",
      baptismDate: "2026-07-01",
      status: "Pending Collection"
    },
    {
      id: 3,
      fullName: "Brian Kiprono",
      dob: "2000-02-10",
      gender: "Male",
      phone: "+254 700 112 233",
      email: "b.kiprono@outlook.com",
      officiatingPastor: "Pr. David Omondi",
      placeOfBaptism: "Newlife Main Sanctuary",
      baptismDate: "2026-07-15",
      status: "Certificate Ready"
    },
    {
      id: 4,
      fullName: "Amani Faith Otieno",
      dob: "2004-08-03",
      gender: "Female",
      phone: "+254 733 445 566",
      email: "amani.faith@gmail.com",
      officiatingPastor: "Pr. Josephat Wafula",
      placeOfBaptism: "Riverside Camp",
      baptismDate: "2026-07-20",
      status: "Processing"
    },
    {
      id: 5,
      fullName: "Emanuel Mutua",
      dob: "1995-03-12",
      gender: "Male",
      phone: "+254 711 223 344",
      email: "e.mutua@gmail.com",
      officiatingPastor: "Pr. David Omondi",
      placeOfBaptism: "Newlife Main Sanctuary",
      baptismDate: "2026-05-10",
      status: "Certificate Collected"
    },
    {
      id: 6,
      fullName: "Esther Wambui",
      dob: "2001-09-18",
      gender: "Female",
      phone: "+254 788 990 011",
      email: "esther.w@gmail.com",
      officiatingPastor: "Pr. John Musyoka",
      placeOfBaptism: "Kitsuru Pool",
      baptismDate: "2026-06-25",
      status: "Certificate Ready"
    }
  ]);

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

  const canManageRecords = !currentUserRole || ['Church Clerk', 'Pastor'].includes(currentUserRole);

  // Dynamic KPIs
  const totalBaptisms = baptisms.length;
  const personsBaptised = baptisms.length;
  const certsCollected = baptisms.filter(b => b.status === 'Certificate Collected').length;
  const pendingCollection = baptisms.filter(b => b.status === 'Pending Collection' || b.status === 'Certificate Ready').length;

  const handleStatusChange = (id, newStatus) => {
    setBaptisms(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const newRecord = {
      id: Date.now(),
      ...formData
    };
    setBaptisms([newRecord, ...baptisms]);
    setIsModalOpen(false);
    setFormData({
      fullName: '', dob: '', gender: 'Male', phone: '', email: '', officiatingPastor: '', placeOfBaptism: 'Newlife Main Sanctuary', baptismDate: '', status: 'Processing'
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
  const filteredBaptisms = baptisms.filter(item => {
    const matchesSearch = item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.officiatingPastor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.phone.includes(searchTerm);
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
            <p className="text-sm font-medium text-slate-500 mt-0.5">Manage candidate profiles and certificate statuses</p>
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
                {canManageRecords && <th className="py-4 px-6 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base font-normal">
              {currentRecords.length > 0 ? (
                currentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition">
                    
                    {/* Candidate */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-base">{record.fullName}</div>
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
                        <UserCheck size={16} className="text-emerald-600" /> {record.officiatingPastor}
                      </div>
                    </td>

                    {/* Location & Date */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                        <Calendar size={14} className="text-slate-400" /> {record.baptismDate}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mt-1">
                        <MapPin size={14} className="text-slate-400" /> {record.placeOfBaptism}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs border ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </span>
                    </td>

                    {/* Status Action */}
                    {canManageRecords && (
                      <td className="py-4 px-6 text-right">
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
                      </td>
                    )}

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canManageRecords ? 6 : 5} className="text-center py-10 text-slate-500 font-semibold text-base">
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

export default BaptismsModule;