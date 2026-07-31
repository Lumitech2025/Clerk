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
  Loader2,
  FileText,
  Download,
  Printer,
  Edit,
  Upload,
  CheckSquare,
  Square,
  MessageSquare
} from 'lucide-react';

import API from '../../../api/api';

// KPI Card Helper
const KpiCard = ({ title, value, icon: Icon, valueColor, iconBg }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
      <h3 className={`text-3xl font-extrabold ${valueColor} mt-2 tracking-tight`}>{value}</h3>
    </div>
    <div className={`p-4 rounded-xl ${iconBg}`}>
      <Icon size={24} />
    </div>
  </div>
);

const BaptismsModule = ({ currentUserRole = 'Church Clerk' }) => {
  const [baptisms, setBaptisms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // SMS Modal & Dispatch State
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsTargetRecords, setSmsTargetRecords] = useState([]);
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingSms, setSendingSms] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [venueFilter, setVenueFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    phone: '',
    email: '',
    fatherName: '',
    fatherPhone: '',
    motherName: '',
    motherPhone: '',
    officiatingPastor: '',
    placeOfBaptism: 'Newlife Main Sanctuary',
    baptismDate: '',
    cbmMinuteNo: '',
    status: 'Processing',
    baptismInfoForm: null,
    baptismCard: null
  });

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

  // Filter Logic
  const filteredBaptisms = baptisms.filter(item => {
    const name = item.fullName || item.full_name || '';
    const pastor = item.officiatingPastor || item.officiating_pastor || '';
    const phone = item.phone || '';
    const venue = item.placeOfBaptism || item.place_of_baptism || '';
    const date = item.baptismDate || item.baptism_date || '';
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pastor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesVenue = venueFilter === 'All' || venue.toLowerCase().includes(venueFilter.toLowerCase());
    const matchesDate = !dateFilter || date === dateFilter;

    return matchesSearch && matchesStatus && matchesVenue && matchesDate;
  });

  // Extract Unique Venues for Dropdown
  const uniqueVenues = Array.from(new Set(baptisms.map(b => b.placeOfBaptism || b.place_of_baptism).filter(Boolean)));

  // Pagination Calculation
  const effectivePerPage = itemsPerPage === 'All' ? filteredBaptisms.length || 1 : parseInt(itemsPerPage);
  const totalPages = Math.ceil(filteredBaptisms.length / effectivePerPage) || 1;
  const startIndex = (currentPage - 1) * effectivePerPage;
  const currentRecords = filteredBaptisms.slice(startIndex, startIndex + effectivePerPage);

  // Checkbox Multi-Selection Handlers
  const handleSelectAllOnPage = () => {
    const currentPageIds = currentRecords.map(r => r.id);
    const allSelected = currentPageIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const handleToggleSelectOne = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Open Bulk SMS Modal
  const handleOpenBulkSmsModal = () => {
    const targets = baptisms.filter(b => selectedIds.includes(b.id));
    setSmsTargetRecords(targets);
    setSmsMessage("Greetings from Newlife Church Clerk Desk! Please be reminded regarding your baptism process/certificate collection status.");
    setIsSmsModalOpen(true);
  };

  // Open Single Candidate SMS Modal
  const handleOpenSingleSmsModal = (record, e) => {
    if (e) e.stopPropagation();
    setSmsTargetRecords([record]);
    setSmsMessage(`Dear ${record.full_name || record.fullName}, your baptism certificate is ready for collection at the Clerk Desk. God bless you!`);
    setIsSmsModalOpen(true);
  };

  // Execute SMS Send
  const handleSendSms = async () => {
    if (!smsMessage.trim() || smsTargetRecords.length === 0) return;
    setSendingSms(true);

    try {
      const recipientIds = smsTargetRecords.map(r => r.id);
      await API.post('/baptisms/send-bulk-sms/', {
        recipient_ids: recipientIds,
        message: smsMessage
      });

      alert(`SMS successfully dispatched to ${smsTargetRecords.length} participant(s)!`);
      setIsSmsModalOpen(false);
      setSelectedIds([]);
    } catch (err) {
      alert(`Failed to send SMS: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSendingSms(false);
    }
  };

  // Reset form modal
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      fullName: '',
      gender: 'Male',
      phone: '',
      email: '',
      fatherName: '',
      fatherPhone: '',
      motherName: '',
      motherPhone: '',
      officiatingPastor: '',
      placeOfBaptism: 'Newlife Main Sanctuary',
      baptismDate: '',
      cbmMinuteNo: '',
      status: 'Processing',
      baptismInfoForm: null,
      baptismCard: null
    });
    setIsModalOpen(true);
  };

  // Pre-fill form modal for editing
  const handleOpenEditModal = (record, e) => {
    if (e) e.stopPropagation();
    setEditingId(record.id);
    setFormData({
      fullName: record.full_name || record.fullName || '',
      gender: record.gender || 'Male',
      phone: record.phone || '',
      email: record.email || '',
      fatherName: record.father_name || '',
      fatherPhone: record.father_phone || '',
      motherName: record.mother_name || '',
      motherPhone: record.mother_phone || '',
      officiatingPastor: record.officiating_pastor || record.officiatingPastor || '',
      placeOfBaptism: record.place_of_baptism || record.placeOfBaptism || 'Newlife Main Sanctuary',
      baptismDate: record.baptism_date || record.baptismDate || '',
      cbmMinuteNo: record.cbm_minute_no || '',
      status: record.status || 'Processing',
      baptismInfoForm: null,
      baptismCard: null
    });
    setIsModalOpen(true);
  };

  // Submit Handler (Create/Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = new FormData();
    payload.append('full_name', formData.fullName);
    payload.append('gender', formData.gender);
    payload.append('phone', formData.phone);
    if (formData.email) payload.append('email', formData.email);
    if (formData.fatherName) payload.append('father_name', formData.fatherName);
    if (formData.fatherPhone) payload.append('father_phone', formData.fatherPhone);
    if (formData.motherName) payload.append('mother_name', formData.motherName);
    if (formData.motherPhone) payload.append('mother_phone', formData.motherPhone);
    payload.append('officiating_pastor', formData.officiatingPastor);
    payload.append('place_of_baptism', formData.placeOfBaptism);
    payload.append('baptism_date', formData.baptismDate);
    if (formData.cbmMinuteNo) payload.append('cbm_minute_no', formData.cbmMinuteNo);
    payload.append('status', formData.status);

    if (formData.baptismInfoForm instanceof File) payload.append('baptism_info_form', formData.baptismInfoForm);
    if (formData.baptismCard instanceof File) payload.append('baptism_card', formData.baptismCard);

    try {
      if (editingId) {
        const response = await API.patch(`/baptisms/${editingId}/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setBaptisms(prev => prev.map(item => item.id === editingId ? response.data : item));
      } else {
        const response = await API.post('/baptisms/', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setBaptisms([response.data, ...baptisms]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(`Error saving record: ${err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Export Data to CSV
  const handleExportCSV = () => {
    const headers = ["Candidate Name", "Gender", "Phone Number", "Email", "Officiating Minister", "Baptism Date", "Venue", "Father Name", "Mother Name", "Status"];
    const rows = filteredBaptisms.map(b => [
      `"${b.full_name || b.fullName || ''}"`,
      `"${b.gender || ''}"`,
      `"${b.phone || ''}"`,
      `"${b.email || ''}"`,
      `"${b.officiating_pastor || b.officiatingPastor || ''}"`,
      `"${b.baptism_date || b.baptismDate || ''}"`,
      `"${b.place_of_baptism || b.placeOfBaptism || ''}"`,
      `"${b.father_name || ''}"`,
      `"${b.mother_name || ''}"`,
      `"${b.status || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Baptism_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Data to PDF / Print
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    const tableHtml = `
      <html>
        <head>
          <title>Baptism Register Export</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Newlife SDA Church - Official Baptism Register</h2>
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Officiating Minister</th>
                <th>Baptism Date</th>
                <th>Venue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBaptisms.map(b => `
                <tr>
                  <td>${b.full_name || b.fullName || ''}</td>
                  <td>${b.gender || ''}</td>
                  <td>${b.phone || ''}</td>
                  <td>${b.email || 'N/A'}</td>
                  <td>${b.officiating_pastor || b.officiatingPastor || ''}</td>
                  <td>${b.baptism_date || b.baptismDate || ''}</td>
                  <td>${b.place_of_baptism || b.placeOfBaptism || ''}</td>
                  <td>${b.status || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(tableHtml);
    printWindow.document.close();
    printWindow.print();
  };

  // Status Styling Helper
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Certificate Collected': return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Certificate Ready': return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'Pending Collection': return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'Processing': return 'bg-purple-50 text-purple-700 border-purple-300';
      default: return 'bg-slate-50 text-slate-700 border-slate-300';
    }
  };

  const isAllCurrentPageSelected = currentRecords.length > 0 && currentRecords.every(r => selectedIds.includes(r.id));

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased">
      
      {/* 1. KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard title="Total Baptisms" value={baptisms.length} icon={Droplets} valueColor="text-emerald-600" iconBg="bg-emerald-50 text-emerald-600" />
        <KpiCard title="Persons Baptised" value={baptisms.length} icon={Users} valueColor="text-slate-900" iconBg="bg-blue-50 text-blue-600" />
        <KpiCard title="Certificates Collected" value={baptisms.filter(b => b.status === 'Certificate Collected').length} icon={Award} valueColor="text-indigo-600" iconBg="bg-indigo-50 text-indigo-600" />
        <KpiCard title="Pending Collection" value={baptisms.filter(b => ['Pending Collection', 'Certificate Ready'].includes(b.status)).length} icon={Clock} valueColor="text-amber-600" iconBg="bg-amber-50 text-amber-600" />
      </div>

      {/* 2. FILTERS & EXPORT TOOLBAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search candidate, pastor, or phone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          {/* EXPORT & ACTION BUTTONS */}
          <div className="flex items-center gap-3 w-fit">
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Download size={15} /> Export to Excel (CSV)
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-950 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Printer size={15} /> Print / Export PDF
            </button>
            <button 
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus size={16} />
              <span>Record Baptism</span>
            </button>
          </div>
        </div>

        {/* SECOND ROW FILTERS: Status, Venue, Date */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-300">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Processing">Processing</option>
              <option value="Certificate Ready">Certificate Ready</option>
              <option value="Pending Collection">Pending Collection</option>
              <option value="Certificate Collected">Certificate Collected</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-300">
            <MapPin size={16} className="text-slate-400" />
            <select 
              value={venueFilter} 
              onChange={(e) => { setVenueFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Venues</option>
              {uniqueVenues.map((v, i) => (
                <option key={i} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-300">
            <Calendar size={16} className="text-slate-400" />
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 3. FLOATING BULK ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between border border-slate-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-slate-950 font-extrabold text-xs px-2.5 py-1 rounded-lg">
              {selectedIds.length} Selected
            </div>
            <span className="text-xs text-slate-300 font-medium">Participants selected across candidates register</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenBulkSmsModal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Send size={14} />
              <span>Send SMS to Selected ({selectedIds.length})</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg transition cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* 4. BAPTISM REGISTER DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Baptism Register</h2>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
            {filteredBaptisms.length} Total Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-spacing-0">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-xs font-extrabold uppercase text-slate-600 tracking-wider">
                <th className="py-3.5 px-3 border-r border-slate-200 text-center w-12">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    onChange={handleSelectAllOnPage}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 border-r border-slate-200">Candidate</th>
                <th className="py-3.5 px-4 border-r border-slate-200 text-center">Gender</th>
                <th className="py-3.5 px-4 border-r border-slate-200">Phone</th>
                <th className="py-3.5 px-4 border-r border-slate-200">Email</th>
                <th className="py-3.5 px-4 border-r border-slate-200">Officiating Minister</th>
                <th className="py-3.5 px-4 border-r border-slate-200">Baptism Date</th>
                <th className="py-3.5 px-4 border-r border-slate-200">Venue</th>
                <th className="py-3.5 px-4 border-r border-slate-200 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-500 font-semibold">
                      <Loader2 className="animate-spin text-emerald-600" size={20} />
                      <span>Loading baptism records...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-rose-500 font-semibold">
                    {error}
                  </td>
                </tr>
              ) : currentRecords.length > 0 ? (
                currentRecords.map((record) => {
                  const isSelected = selectedIds.includes(record.id);

                  return (
                    <tr 
                      key={record.id} 
                      onClick={(e) => handleOpenEditModal(record, e)}
                      className={`hover:bg-slate-50 transition cursor-pointer ${isSelected ? 'bg-emerald-50/40' : ''}`}
                    >
                      {/* Checkbox Selector */}
                      <td className="py-3.5 px-3 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelectOne(record.id, e)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      
                      {/* Candidate Name */}
                      <td className="py-3.5 px-4 border-r border-slate-200 font-bold text-slate-900">
                        {record.full_name || record.fullName}
                      </td>

                      {/* Gender */}
                      <td className="py-3.5 px-4 border-r border-slate-200 text-center font-semibold">
                        {record.gender}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 border-r border-slate-200 font-semibold">
                        {record.phone}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 border-r border-slate-200 font-medium text-slate-600">
                        {record.email || 'N/A'}
                      </td>

                      {/* Officiating Minister */}
                      <td className="py-3.5 px-4 border-r border-slate-200 font-semibold text-slate-800">
                        {record.officiating_pastor || record.officiatingPastor}
                      </td>

                      {/* Baptism Date */}
                      <td className="py-3.5 px-4 border-r border-slate-200 font-semibold">
                        {record.baptism_date || record.baptismDate}
                      </td>

                      {/* Venue */}
                      <td className="py-3.5 px-4 border-r border-slate-200 font-medium">
                        {record.place_of_baptism || record.placeOfBaptism}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}>
                        <span className={`inline-block text-xs font-extrabold px-3 py-1 rounded-full border ${getStatusStyle(record.status)}`}>
                          {record.status}
                        </span>
                      </td>

                      {/* Actions / Reminder */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => handleOpenEditModal(record, e)}
                            className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            onClick={(e) => handleOpenSingleSmsModal(record, e)}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                            title="Send SMS Reminder"
                          >
                            <Send size={11} /> Reminder
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-500 font-semibold">
                    No baptism records found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-slate-600 gap-4">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value={5}>5 entries</option>
              <option value={10}>10 entries</option>
              <option value={20}>20 entries</option>
              <option value={50}>50 entries</option>
              <option value="All">All entries</option>
            </select>
            <span>out of <strong className="text-slate-900">{filteredBaptisms.length}</strong> records</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || itemsPerPage === 'All'}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  currentPage === page
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || itemsPerPage === 'All'}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. MODAL: BULK / SINGLE SMS DISPATCH */}
      {isSmsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <MessageSquare size={20} className="text-emerald-400" />
                <h3 className="font-bold text-base">
                  {smsTargetRecords.length === 1 ? 'Send SMS Notification' : `Dispatch SMS to ${smsTargetRecords.length} Recipients`}
                </h3>
              </div>
              <button onClick={() => setIsSmsModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Recipients List</label>
                <div className="max-h-28 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-3 divide-y divide-slate-100">
                  {smsTargetRecords.map((r, i) => (
                    <div key={i} className="py-1 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{r.full_name || r.fullName}</span>
                      <span className="text-slate-500 font-mono">{r.phone}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Message Body *</label>
                <textarea
                  rows={4}
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  placeholder="Type message content here..."
                />
                <p className="text-[11px] text-slate-400 mt-1">Dispatched directly through the SMS Gateway.</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSmsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendSms}
                  disabled={sendingSms || !smsMessage.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  {sendingSms ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  <span>{sendingSms ? 'Dispatching...' : 'Send Message Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: CREATE / EDIT BAPTISM RECORD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <Droplets size={20} className="text-emerald-400" />
                <h3 className="font-bold text-base">{editingId ? 'Edit Baptism Record' : 'Record New Baptism'}</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs font-semibold overflow-y-auto flex-1">
              
              <div className="border-b border-slate-100 pb-2 font-bold text-emerald-700 uppercase tracking-wider">Candidate Details</div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Full Name *</label>
                  <input 
                    type="text" required value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Gender *</label>
                  <select 
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Phone Number *</label>
                  <input 
                    type="text" required value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+2547..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Email Address</label>
                  <input 
                    type="email" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="border-b border-slate-100 pb-2 pt-2 font-bold text-emerald-700 uppercase tracking-wider">Parents Info</div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Father's Name</label>
                  <input 
                    type="text" value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Father's Phone</label>
                  <input 
                    type="text" value={formData.fatherPhone}
                    onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Mother's Name</label>
                  <input 
                    type="text" value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Mother's Phone</label>
                  <input 
                    type="text" value={formData.motherPhone}
                    onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="border-b border-slate-100 pb-2 pt-2 font-bold text-emerald-700 uppercase tracking-wider">Ceremony & Document Uploads</div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Officiating Pastor *</label>
                  <input 
                    type="text" required value={formData.officiatingPastor}
                    onChange={(e) => setFormData({ ...formData, officiatingPastor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Baptism Date *</label>
                  <input 
                    type="date" required value={formData.baptismDate}
                    onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* THREE COLUMN GRID: Venue, CBM Minute Number, and Status Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Place of Baptism *</label>
                  <input 
                    type="text" required value={formData.placeOfBaptism}
                    onChange={(e) => setFormData({ ...formData, placeOfBaptism: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">CBM Minute No.</label>
                  <input 
                    type="text" value={formData.cbmMinuteNo} placeholder="e.g. Min 12/2026"
                    onChange={(e) => setFormData({ ...formData, cbmMinuteNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Record Status *</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Processing">Processing</option>
                    <option value="Certificate Ready">Certificate Ready</option>
                    <option value="Pending Collection">Pending Collection</option>
                    <option value="Certificate Collected">Certificate Collected</option>
                  </select>
                </div>
              </div>

              {/* TWO COLUMN GRID: File Uploads */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Baptism Info Form</label>
                  <input 
                    type="file" 
                    onChange={(e) => setFormData({ ...formData, baptismInfoForm: e.target.files[0] })}
                    className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-200 file:text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Baptism Card</label>
                  <input 
                    type="file" 
                    onChange={(e) => setFormData({ ...formData, baptismCard: e.target.files[0] })}
                    className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-200 file:text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:bg-emerald-400"
                >
                  {submitting && <Loader2 className="animate-spin" size={14} />}
                  <span>{submitting ? 'Saving...' : editingId ? 'Update Record' : 'Save Record'}</span>
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