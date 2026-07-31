import React, { useState, useEffect, useCallback } from 'react';
import API from '../../../api/api';
import { 
  Users, 
  UserPlus, 
  ArrowLeftRight, 
  Droplets, 
  BookOpen, 
  Search, 
  X, 
  UploadCloud, 
  FileText, 
  Edit3,
  Paperclip,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  Download,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  MapPin,
  UserCheck
} from 'lucide-react';

export default function MembershipRecords() {
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all' | 'transfers' | 'baptisms' | 'pof'
  const [transferDirection, setTransferDirection] = useState('incoming'); // 'incoming' | 'outgoing'
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditTransferModalOpen, setIsEditTransferModalOpen] = useState(false);
  const [isUploadArchiveModalOpen, setIsUploadArchiveModalOpen] = useState(false);
  const [selectedTransferRow, setSelectedTransferRow] = useState(null);
  
  // API State
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search, Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Archival File Upload State
  const [archiveForm, setArchiveForm] = useState({
    year: '2026',
    registerType: 'All Members Roll',
    file: null
  });

  // Form State for Add Member
  const [memberForm, setMemberForm] = useState({
    joiningMethod: 'Baptism',
    fullName: '',
    dob: '',
    gender: 'Male',
    citizenship: 'Kenyan',
    phone: '',
    email: '',
    
    // Parents Info
    fatherName: '',
    fatherPhone: '',
    fatherEmail: '',
    motherName: '',
    motherPhone: '',
    motherEmail: '',
    
    // Baptism Specific Details
    baptismDate: '',
    officiatingPastor: '',
    baptismLocation: 'Newlife SDA Church',
    baptismCard: null,
    
    // Transfer Details (ACMS Aligned)
    transferType: 'Transfer In', // 'Transfer In' | 'Transfer Out'
    transferStatus: 'Request Made',
    originChurch: '', // Incoming Church
    targetChurch: 'Newlife SDA Church', // Outgoing Church
    cbmMinute: '',
    boardMeetingDate: '',
    approvalMinute: '',
    firstReadingDate: '',
    secondReadingDate: '',

    // Profession of Faith Details
    formerFaith: '',
    previousChurchLetter: null,
    parentsLetter: null,
    
    homeChurch: 'Newlife SDA Church'
  });

  // 1. FETCH MEMBERS FROM BACKEND API
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

      if (activeSubTab === 'transfers') {
        params.joining_method = 'Transfer';
        params.transfer_type = transferDirection === 'incoming' ? 'Transfer In' : 'Transfer Out';
      }
      if (activeSubTab === 'baptisms') params.joining_method = 'Baptism';
      if (activeSubTab === 'pof') params.joining_method = 'Profession of Faith';

      const response = await API.get('member-records/', { params });
      
      if (response.data && Array.isArray(response.data.results)) {
        setMembers(response.data.results);
        setTotalCount(response.data.count);
      } else if (Array.isArray(response.data)) {
        setMembers(response.data);
        setTotalCount(response.data.length);
      } else {
        setMembers([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setError('Failed to load membership records. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, selectedYear, activeSubTab, transferDirection]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Handle Form Inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMemberForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (field, file) => {
    setMemberForm(prev => ({ ...prev, [field]: file }));
  };

  // 2. EXPORT TO EXCEL / CSV
  const handleExportExcel = () => {
    if (!members.length) {
      alert('No records available to export.');
      return;
    }

    let headers = [];
    let rows = [];

    if (activeSubTab === 'all') {
      headers = ['S/No', 'Member Name', 'Gender', 'Phone Number', 'Method of Entry', 'Home Church', 'Year Joined', 'Status'];
      rows = members.map((m, idx) => [
        idx + 1,
        `"${m.full_name || ''}"`,
        `"${m.gender || ''}"`,
        `"${m.phone_number || ''}"`,
        `"${m.joining_method || ''}"`,
        `"${m.home_church || ''}"`,
        `"${m.year_joined || ''}"`,
        `"${m.is_active ? 'Active' : 'Inactive'}"`
      ]);
    } else if (activeSubTab === 'transfers') {
      headers = ['Member Name', 'Transfer Direction', 'Status Progress', 'Incoming Church', 'Outgoing Church', 'CBM Min No.', '1st Reading', '2nd Reading / Approved'];
      rows = members.map((m) => [
        `"${m.full_name || ''}"`,
        `"${m.transfer_type || 'Transfer In'}"`,
        `"${m.transfer_status || 'Request Made'}"`,
        `"${m.origin_church || 'N/A'}"`,
        `"${m.target_church || 'N/A'}"`,
        `"${m.cbm_minute || '—'}"`,
        `"${m.first_reading_date || '—'}"`,
        `"${m.second_reading_date || '—'}"`
      ]);
    } else if (activeSubTab === 'baptisms') {
      headers = ['Member Name', 'Gender', 'Date of Birth', 'Baptism Date', 'Officiating Pastor', 'Baptism Location', 'Father Name', 'Mother Name'];
      rows = members.map((m) => [
        `"${m.full_name || ''}"`,
        `"${m.gender || ''}"`,
        `"${m.date_of_birth || 'N/A'}"`,
        `"${m.baptism_date || 'N/A'}"`,
        `"${m.officiating_pastor || 'N/A'}"`,
        `"${m.baptism_location || 'Newlife SDA Church'}"`,
        `"${m.father_name || 'N/A'}"`,
        `"${m.mother_name || 'N/A'}"`
      ]);
    } else if (activeSubTab === 'pof') {
      headers = ['Member Name', 'Former Church / Faith', 'Phone Number', 'Citizenship', 'Date Received'];
      rows = members.map((m) => [
        `"${m.full_name || ''}"`,
        `"${m.former_faith || 'N/A'}"`,
        `"${m.phone_number || ''}"`,
        `"${m.citizenship || 'Kenyan'}"`,
        `"${m.date_joined || ''}"`
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeSubTab}_registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. EXPORT TO PDF
  const handleExportPDF = () => {
    if (!members.length) {
      alert('No records available to export.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let title = activeSubTab.toUpperCase() + (activeSubTab === 'transfers' ? ` (${transferDirection.toUpperCase()})` : '') + ' REGISTRY REPORT';
    let tableHtml = '';

    if (activeSubTab === 'all') {
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">S/No</th>
              <th>Member Name</th>
              <th>Gender</th>
              <th>Phone Number</th>
              <th>Method of Entry</th>
              <th>Home Church</th>
              <th style="width: 60px;">Year</th>
              <th style="width: 70px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${members.map((m, i) => `
              <tr>
                <td style="text-align:center;">${i + 1}</td>
                <td><strong>${m.full_name}</strong></td>
                <td>${m.gender}</td>
                <td>${m.phone_number || 'N/A'}</td>
                <td>${m.joining_method}</td>
                <td>${m.home_church}</td>
                <td style="text-align:center;">${m.year_joined}</td>
                <td style="text-align:center;">${m.is_active ? 'Active' : 'Inactive'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (activeSubTab === 'transfers') {
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Status Progress</th>
              <th>${transferDirection === 'incoming' ? 'Incoming Church' : 'Outgoing Church'}</th>
              <th>CBM Min No.</th>
              <th>Board Approval Date</th>
              <th>1st Reading</th>
              <th>2nd Reading / Voted</th>
            </tr>
          </thead>
          <tbody>
            ${members.map(m => `
              <tr>
                <td><strong>${m.full_name}</strong></td>
                <td>${m.transfer_status || 'Request Made'}</td>
                <td>${transferDirection === 'incoming' ? (m.origin_church || 'N/A') : (m.target_church || 'N/A')}</td>
                <td>${m.cbm_minute || '—'}</td>
                <td>${m.board_meeting_date || '—'}</td>
                <td>${m.first_reading_date || '—'}</td>
                <td>${m.second_reading_date || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (activeSubTab === 'baptisms') {
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Gender</th>
              <th>Date of Birth</th>
              <th>Baptism Date</th>
              <th>Officiating Pastor</th>
              <th>Location</th>
              <th>Parents Info</th>
            </tr>
          </thead>
          <tbody>
            ${members.map(m => `
              <tr>
                <td><strong>${m.full_name}</strong></td>
                <td>${m.gender}</td>
                <td>${m.date_of_birth || 'N/A'}</td>
                <td>${m.baptism_date || 'N/A'}</td>
                <td>${m.officiating_pastor || 'N/A'}</td>
                <td>${m.baptism_location || 'Newlife SDA Church'}</td>
                <td>F: ${m.father_name || 'N/A'} | M: ${m.mother_name || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (activeSubTab === 'pof') {
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Former Church / Faith</th>
              <th>Phone</th>
              <th>Citizenship</th>
              <th>Date Received</th>
            </tr>
          </thead>
          <tbody>
            ${members.map(m => `
              <tr>
                <td><strong>${m.full_name}</strong></td>
                <td>${m.former_faith || 'N/A'}</td>
                <td>${m.phone_number || 'N/A'}</td>
                <td>${m.citizenship || 'Kenyan'}</td>
                <td>${m.date_joined || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Newlife SDA Church - ${title}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #0f172a; }
            h1 { margin-bottom: 4px; font-size: 20px; text-transform: uppercase; color: #047857; }
            p { margin-top: 0; color: #64748b; font-size: 13px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }
            @page { size: landscape; margin: 12mm; }
          </style>
        </head>
        <body>
          <h1>NEWLIFE SDA CHURCH - ${title}</h1>
          <p>Generated Date: ${new Date().toLocaleDateString()} | Total Exported Records: ${members.length}</p>
          ${tableHtml}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // CREATE NEW MEMBER VIA API (POST)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('full_name', memberForm.fullName);
      formData.append('gender', memberForm.gender);
      if (memberForm.dob) formData.append('date_of_birth', memberForm.dob);
      formData.append('citizenship', memberForm.citizenship);
      formData.append('phone_number', memberForm.phone);
      formData.append('email', memberForm.email);
      formData.append('is_active', 'true');

      // Parents Info
      formData.append('father_name', memberForm.fatherName);
      formData.append('father_phone', memberForm.fatherPhone);
      formData.append('father_email', memberForm.fatherEmail);
      formData.append('mother_name', memberForm.motherName);
      formData.append('mother_phone', memberForm.motherPhone);
      formData.append('mother_email', memberForm.motherEmail);

      // Registry Method
      formData.append('joining_method', memberForm.joiningMethod);
      formData.append('home_church', memberForm.homeChurch);
      formData.append('year_joined', new Date().getFullYear().toString());

      // Baptism Specifics
      if (memberForm.joiningMethod === 'Baptism') {
        if (memberForm.baptismDate) formData.append('baptism_date', memberForm.baptismDate);
        if (memberForm.officiatingPastor) formData.append('officiating_pastor', memberForm.officiatingPastor);
        if (memberForm.baptismLocation) formData.append('baptism_location', memberForm.baptismLocation);
      }

      // Transfer Specifics (ACMS Aligned)
      if (memberForm.joiningMethod === 'Transfer') {
        formData.append('transfer_status', memberForm.transferStatus);
        formData.append('transfer_type', memberForm.transferType);
        formData.append('origin_church', memberForm.originChurch);
        formData.append('target_church', memberForm.targetChurch);
        if (memberForm.cbmMinute) formData.append('cbm_minute', memberForm.cbmMinute);
        if (memberForm.boardMeetingDate) formData.append('board_meeting_date', memberForm.boardMeetingDate);
        if (memberForm.firstReadingDate) formData.append('first_reading_date', memberForm.firstReadingDate);
        if (memberForm.secondReadingDate) formData.append('second_reading_date', memberForm.secondReadingDate);
      }

      // File attachments & optional fields
      if (memberForm.formerFaith) formData.append('former_faith', memberForm.formerFaith);
      if (memberForm.previousChurchLetter instanceof File) formData.append('previous_church_letter', memberForm.previousChurchLetter);
      if (memberForm.parentsLetter instanceof File) formData.append('parents_consent_letter', memberForm.parentsLetter);
      if (memberForm.baptismCard instanceof File) formData.append('baptism_card', memberForm.baptismCard);

      await API.post('member-records/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setIsAddModalOpen(false);
      fetchMembers();
    } catch (err) {
      console.error('Error adding member:', err);
      alert(`Failed to save member: ${err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // EDIT TRANSFER STATUS VIA API (PATCH)
  const handleOpenTransferEdit = (row) => {
    setSelectedTransferRow({ ...row });
    setIsEditTransferModalOpen(true);
  };

  const handleSaveTransferEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        transfer_status: selectedTransferRow.transfer_status,
        transfer_type: selectedTransferRow.transfer_type,
        origin_church: selectedTransferRow.origin_church || '',
        target_church: selectedTransferRow.target_church || '',
        cbm_minute: selectedTransferRow.cbm_minute || '',
        board_meeting_date: selectedTransferRow.board_meeting_date || null,
        approval_minute: selectedTransferRow.approval_minute || '',
        first_reading_date: selectedTransferRow.first_reading_date || null,
        second_reading_date: selectedTransferRow.second_reading_date || null,
      };

      const response = await API.patch(`member-records/${selectedTransferRow.id}/`, payload);
      
      setMembers(prev => prev.map(m => m.id === selectedTransferRow.id ? response.data : m));
      setIsEditTransferModalOpen(false);
    } catch (err) {
      console.error('Error updating transfer:', err);
      alert(`Failed to update transfer status: ${err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveSubmit = (e) => {
    e.preventDefault();
    alert(`Archive dataset for year ${archiveForm.year} queued for processing!`);
    setIsUploadArchiveModalOpen(false);
  };

  const getTransferStatusBadge = (status) => {
    switch (status) {
      case 'Request Made':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Board Approval':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case '1st Reading':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case '2nd Reading / Transfer Granted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  return (
    <div className="font-sans space-y-6 text-slate-800 text-sm leading-relaxed">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <Users size={24} />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Membership Records & Registers</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsUploadArchiveModalOpen(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-300/70 transition cursor-pointer"
          >
            <UploadCloud size={18} className="text-slate-500" /> Upload Past Registers (PDF/Excel)
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <UserPlus size={18} /> Add New Member
          </button>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* SUB TABS */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => { setActiveSubTab('all'); setCurrentPage(1); }}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer ${
              activeSubTab === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Users size={17} /> All Members
          </button>

          <button
            onClick={() => { setActiveSubTab('transfers'); setCurrentPage(1); }}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer ${
              activeSubTab === 'transfers' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <ArrowLeftRight size={17} /> Transfers
          </button>

          <button
            onClick={() => { setActiveSubTab('baptisms'); setCurrentPage(1); }}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer ${
              activeSubTab === 'baptisms' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Droplets size={17} /> Baptisms
          </button>

          <button
            onClick={() => { setActiveSubTab('pof'); setCurrentPage(1); }}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer ${
              activeSubTab === 'pof' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <BookOpen size={17} /> Profession of Faith
          </button>
        </div>

        {/* FILTERS */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200/80 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700">
            <Calendar size={17} className="text-slate-400" />
            <span className="text-slate-500">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
              className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer text-sm"
            >
              <option value="All">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search member name or phone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* MAIN DATA TABLES AREA */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-6 space-y-6 min-h-[400px]">
        
        {/* TRANSFERS DIRECTION SUB-TOGGLE BAR (ONLY VISIBLE ON TRANSFERS TAB) */}
        {activeSubTab === 'transfers' && (
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setTransferDirection('incoming'); setCurrentPage(1); }}
                className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer ${
                  transferDirection === 'incoming' 
                    ? 'bg-emerald-700 text-white shadow-xs' 
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                <ArrowDownLeft size={16} /> Incoming Members (Transfer In)
              </button>

              <button
                onClick={() => { setTransferDirection('outgoing'); setCurrentPage(1); }}
                className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer ${
                  transferDirection === 'outgoing' 
                    ? 'bg-amber-700 text-white shadow-xs' 
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                <ArrowUpRight size={16} /> Outgoing Members (Transfer Out)
              </button>
            </div>

            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              ACMS Aligned Transfers Registry
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-sm">
            <Loader2 className="animate-spin mb-3 text-emerald-600" size={28} />
            Loading registry records...
          </div>
        ) : (
          <>
            {/* TAB 1: ALL MEMBERS DIRECTORY */}
            {activeSubTab === 'all' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-sm font-bold uppercase text-slate-800">
                      <th className="border border-slate-300 py-3.5 px-4 text-center">S/No.</th>
                      <th className="border border-slate-300 py-3.5 px-4">Member Name</th>
                      <th className="border border-slate-300 py-3.5 px-4">Gender</th>
                      <th className="border border-slate-300 py-3.5 px-4">Phone Number</th>
                      <th className="border border-slate-300 py-3.5 px-4">Method of Entry</th>
                      <th className="border border-slate-300 py-3.5 px-4">Home Church</th>
                      <th className="border border-slate-300 py-3.5 px-4 text-center">Year</th>
                      <th className="border border-slate-300 py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm font-normal text-slate-800">
                    {members.length > 0 ? (
                      members.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                          <td className="border border-slate-300 py-3 px-4 text-center font-medium text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                          <td className="border border-slate-300 py-3 px-4 font-semibold text-slate-900">{m.full_name}</td>
                          <td className="border border-slate-300 py-3 px-4 text-slate-700">{m.gender}</td>
                          <td className="border border-slate-300 py-3 px-4 text-slate-700">{m.phone_number || 'N/A'}</td>
                          <td className="border border-slate-300 py-3 px-4">
                            <span className={`px-3 py-1 rounded-md text-xs font-semibold ${
                              m.joining_method === 'Baptism' ? 'bg-blue-100 text-blue-800' :
                              m.joining_method === 'Transfer' ? 'bg-amber-100 text-amber-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {m.joining_method}
                            </span>
                          </td>
                          <td className="border border-slate-300 py-3 px-4 text-slate-700">{m.home_church}</td>
                          <td className="border border-slate-300 py-3 px-4 text-center font-medium text-slate-600">{m.year_joined}</td>
                          <td className="border border-slate-300 py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${m.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {m.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-10 text-slate-400 font-medium text-sm">No member records found matching your query.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: TRANSFERS TAB (INCOMING / OUTGOING TOGGLEABLE) */}
            {activeSubTab === 'transfers' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-300 text-sm">
                  <thead>
                    <tr className="bg-slate-100 font-bold uppercase text-slate-800">
                      <th className="border border-slate-300 py-3.5 px-4">Member Name</th>
                      <th className="border border-slate-300 py-3.5 px-4">Status Progress</th>
                      {transferDirection === 'incoming' ? (
                        <th className="border border-slate-300 py-3.5 px-4">Incoming Church (Origin)</th>
                      ) : (
                        <th className="border border-slate-300 py-3.5 px-4">Outgoing Church (Destination)</th>
                      )}
                      <th className="border border-slate-300 py-3.5 px-4">CBM Min No.</th>
                      <th className="border border-slate-300 py-3.5 px-4">Board Approval Date</th>
                      <th className="border border-slate-300 py-3.5 px-4">1st Reading</th>
                      <th className="border border-slate-300 py-3.5 px-4">2nd Reading / Approval</th>
                      <th className="border border-slate-300 py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-normal text-slate-800">
                    {members.length > 0 ? (
                      members.map((m) => (
                        <tr 
                          key={m.id} 
                          onClick={() => handleOpenTransferEdit(m)}
                          className="hover:bg-amber-50/50 transition cursor-pointer group"
                        >
                          <td className="border border-slate-300 py-3 px-4 font-semibold text-slate-900 group-hover:text-amber-900">{m.full_name}</td>
                          <td className="border border-slate-300 py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border uppercase tracking-wider ${getTransferStatusBadge(m.transfer_status)}`}>
                              {m.transfer_status || 'Request Made'}
                            </span>
                          </td>
                          <td className="border border-slate-300 py-3 px-4 font-medium text-slate-800">
                            {transferDirection === 'incoming' 
                              ? (m.origin_church || <span className="text-slate-400 italic">Not Specified</span>)
                              : (m.target_church || <span className="text-slate-400 italic">Not Specified</span>)
                            }
                          </td>
                          <td className="border border-slate-300 py-3 px-4 font-mono text-xs font-semibold text-slate-700">
                            {m.cbm_minute ? m.cbm_minute : <span className="text-slate-400 font-normal">—</span>}
                          </td>
                          <td className="border border-slate-300 py-3 px-4">
                            {m.board_meeting_date ? m.board_meeting_date : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="border border-slate-300 py-3 px-4">
                            {m.first_reading_date ? m.first_reading_date : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="border border-slate-300 py-3 px-4 font-medium text-emerald-800">
                            {m.second_reading_date ? m.second_reading_date : <span className="text-slate-400 font-normal">—</span>}
                          </td>
                          <td className="border border-slate-300 py-3 px-4 text-center">
                            <span className="text-amber-700 font-semibold hover:underline inline-flex items-center gap-1">
                              <Edit3 size={15} /> Edit
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-10 text-slate-400 font-medium text-sm">
                          No {transferDirection === 'incoming' ? 'Incoming' : 'Outgoing'} transfer records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: BAPTISMS TAB */}
            {activeSubTab === 'baptisms' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-300 text-sm">
                  <thead>
                    <tr className="bg-slate-100 font-bold uppercase text-slate-800">
                      <th className="border border-slate-300 py-3.5 px-4">Member Name</th>
                      <th className="border border-slate-300 py-3.5 px-4">Gender</th>
                      <th className="border border-slate-300 py-3.5 px-4">Date of Birth</th>
                      <th className="border border-slate-300 py-3.5 px-4">Baptism Date</th>
                      <th className="border border-slate-300 py-3.5 px-4">Officiating Pastor</th>
                      <th className="border border-slate-300 py-3.5 px-4">Parents Details</th>
                      <th className="border border-slate-300 py-3.5 px-4 text-center">Baptism Card</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-normal text-slate-800">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="border border-slate-300 py-3 px-4 font-semibold text-slate-900">{m.full_name}</td>
                        <td className="border border-slate-300 py-3 px-4">{m.gender}</td>
                        <td className="border border-slate-300 py-3 px-4">{m.date_of_birth || 'N/A'}</td>
                        <td className="border border-slate-300 py-3 px-4 text-blue-900 font-medium">{m.baptism_date || 'N/A'}</td>
                        <td className="border border-slate-300 py-3 px-4 text-slate-800">{m.officiating_pastor || 'N/A'}</td>
                        <td className="border border-slate-300 py-3 px-4 text-xs">
                          <div>F: {m.father_name || 'N/A'}</div>
                          <div>M: {m.mother_name || 'N/A'}</div>
                        </td>
                        <td className="border border-slate-300 py-3 px-4 text-center">
                          {m.baptism_card ? (
                            <a href={m.baptism_card} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 font-semibold hover:bg-blue-100">
                              <FileText size={14} /> View Card
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs italic">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: PROFESSION OF FAITH TAB */}
            {activeSubTab === 'pof' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-300 text-sm">
                  <thead>
                    <tr className="bg-slate-100 font-bold uppercase text-slate-800">
                      <th className="border border-slate-300 py-3.5 px-4">Member Name</th>
                      <th className="border border-slate-300 py-3.5 px-4">Former Church / Faith</th>
                      <th className="border border-slate-300 py-3.5 px-4">Phone</th>
                      <th className="border border-slate-300 py-3.5 px-4">Citizenship</th>
                      <th className="border border-slate-300 py-3.5 px-4">Date Received</th>
                      <th className="border border-slate-300 py-3.5 px-4 text-center">Supporting Documents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-normal text-slate-800">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="border border-slate-300 py-3 px-4 font-semibold text-slate-900">{m.full_name}</td>
                        <td className="border border-slate-300 py-3 px-4 text-purple-900 font-medium">{m.former_faith || 'N/A'}</td>
                        <td className="border border-slate-300 py-3 px-4">{m.phone_number}</td>
                        <td className="border border-slate-300 py-3 px-4">{m.citizenship || 'Kenyan'}</td>
                        <td className="border border-slate-300 py-3 px-4">{m.date_joined}</td>
                        <td className="border border-slate-300 py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {m.previous_church_letter && (
                              <a href={m.previous_church_letter} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 font-semibold hover:bg-purple-100">
                                <Paperclip size={13} /> Previous Letter
                              </a>
                            )}
                            {m.parents_consent_letter && (
                              <a href={m.parents_consent_letter} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-semibold hover:bg-slate-100">
                                <Paperclip size={13} /> Parents Letter
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* PAGINATION FOOTER */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-normal text-slate-600">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 text-sm focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries per page</span>
            <span className="text-slate-400 border-l pl-3 ml-1">
              Showing {totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} records
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer text-sm ${
                  currentPage === page 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* EXPORT REGISTRY BAR AT BOTTOM */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Download Registry Records</h4>
            <p className="text-xs text-slate-500">Export active register view to Excel (.csv) or PDF.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Download size={16} /> Export to Excel (CSV)
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-950 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Printer size={16} /> Download PDF Report
            </button>
          </div>
        </div>

      </div>

      {/* MODAL: UPLOAD HISTORICAL REGISTERS */}
      {isUploadArchiveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden font-sans">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-400" size={20} /> Upload Historical Registers
              </h3>
              <button onClick={() => setIsUploadArchiveModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <form onSubmit={handleArchiveSubmit} className="p-6 space-y-4 text-sm font-normal">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Register Year *</label>
                <select 
                  value={archiveForm.year}
                  onChange={(e) => setArchiveForm({...archiveForm, year: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm"
                >
                  {Array.from({ length: 30 }, (_, i) => 2026 - i).map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Register Category *</label>
                <select 
                  value={archiveForm.registerType}
                  onChange={(e) => setArchiveForm({...archiveForm, registerType: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="All Members Roll">All Members Master Roll</option>
                  <option value="Baptism Register">Baptism Register</option>
                  <option value="Transfers Archive">Transfers Ledger</option>
                  <option value="Profession of Faith Register">Profession of Faith Register</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Upload File (Excel .xlsx, .csv, or PDF) *</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 p-6 rounded-2xl cursor-pointer text-slate-600 transition">
                  <UploadCloud size={32} className="text-emerald-600 mb-2" />
                  <span className="font-semibold text-slate-800">Click or Drag & Drop File</span>
                  <span className="text-xs text-slate-400 mt-0.5">Supports .xlsx, .csv, .pdf up to 50MB</span>
                  {archiveForm.file && (
                    <span className="mt-2 text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 text-xs">
                      {archiveForm.file.name}
                    </span>
                  )}
                  <input 
                    type="file" 
                    accept=".xlsx,.csv,.pdf" 
                    onChange={(e) => setArchiveForm({...archiveForm, file: e.target.files[0]})}
                    className="hidden" 
                  />
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsUploadArchiveModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer">Import Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW MEMBER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-sans">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white flex-shrink-0">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <UserPlus className="text-emerald-400" size={20} /> Register New Member
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6 text-sm font-normal overflow-y-auto">
              {/* METHOD SELECTION */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-xl space-y-2">
                <label className="block text-slate-900 font-semibold">Method of Admission *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Baptism', 'Transfer', 'Profession of Faith'].map((method) => (
                    <label key={method} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition ${
                      memberForm.joiningMethod === method ? 'bg-emerald-700 text-white border-emerald-700 font-semibold' : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      <input type="radio" name="joiningMethod" value={method} checked={memberForm.joiningMethod === method} onChange={handleInputChange} className="hidden" />
                      <span className="text-sm">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 1. PERSONAL INFORMATION */}
              <div>
                <h4 className="font-semibold text-slate-900 text-sm uppercase border-b pb-1.5 mb-3 text-emerald-800">1. Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
                    <input type="text" name="fullName" required value={memberForm.fullName} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" placeholder="First Middle Last" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Date of Birth</label>
                    <input type="date" name="dob" value={memberForm.dob} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Gender *</label>
                    <select name="gender" value={memberForm.gender} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Citizenship *</label>
                    <input type="text" name="citizenship" value={memberForm.citizenship} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
                    <input type="text" name="phone" value={memberForm.phone} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" placeholder="+254 7..." />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Email Address</label>
                    <input type="email" name="email" value={memberForm.email} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" placeholder="member@example.com" />
                  </div>
                </div>
              </div>

              {/* 2. PARENTS DETAILS */}
              <div>
                <h4 className="font-semibold text-slate-900 text-sm uppercase border-b pb-1.5 mb-3 text-emerald-800">2. Parents Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 mb-3">
                  <div className="md:col-span-3 font-semibold text-slate-800">Father's Information</div>
                  <input type="text" name="fatherName" placeholder="Father's Full Name" value={memberForm.fatherName} onChange={handleInputChange} className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl" />
                  <input type="text" name="fatherPhone" placeholder="Mobile Number" value={memberForm.fatherPhone} onChange={handleInputChange} className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl" />
                  <input type="email" name="fatherEmail" placeholder="Email" value={memberForm.fatherEmail} onChange={handleInputChange} className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="md:col-span-3 font-semibold text-slate-800">Mother's Information</div>
                  <input type="text" name="motherName" placeholder="Mother's Full Name" value={memberForm.motherName} onChange={handleInputChange} className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl" />
                  <input type="text" name="motherPhone" placeholder="Mobile Number" value={memberForm.motherPhone} onChange={handleInputChange} className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl" />
                  <input type="email" name="motherEmail" placeholder="Email" value={memberForm.motherEmail} onChange={handleInputChange} className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl" />
                </div>
              </div>

              {/* BAPTISM METHOD SPECIFICS */}
              {memberForm.joiningMethod === 'Baptism' && (
                <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-xl space-y-4">
                  <h4 className="font-semibold text-blue-900 text-sm uppercase border-b border-blue-200 pb-1 flex items-center gap-2">
                    <Droplets size={16} /> Baptism Details & Documentation
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Baptism Date</label>
                      <input type="date" name="baptismDate" value={memberForm.baptismDate} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Officiating Pastor</label>
                      <input type="text" name="officiatingPastor" placeholder="Pr. First Name Last Name" value={memberForm.officiatingPastor} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-slate-700 font-medium mb-1">Baptism Location / Church</label>
                      <input type="text" name="baptismLocation" value={memberForm.baptismLocation} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-slate-700 font-medium mb-1">Upload Baptism Card / Certificate</label>
                      <label className="flex items-center gap-2 border border-blue-200 bg-white p-3 rounded-xl cursor-pointer text-slate-600">
                        <UploadCloud size={18} className="text-blue-700" />
                        <span className="truncate">{memberForm.baptismCard ? memberForm.baptismCard.name : 'Choose PDF/Image file...'}</span>
                        <input type="file" onChange={(e) => handleFileUpload('baptismCard', e.target.files[0])} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TRANSFER METHOD SPECIFICS (ACMS ALIGNED) */}
              {memberForm.joiningMethod === 'Transfer' && (
                <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl space-y-4">
                  <h4 className="font-semibold text-amber-900 text-sm uppercase border-b border-amber-200 pb-1 flex items-center gap-2">
                    <ArrowLeftRight size={16} /> Transfer Details (ACMS Aligned)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Transfer Direction *</label>
                      <select name="transferType" value={memberForm.transferType} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl font-semibold">
                        <option value="Transfer In">Transfer In (Incoming Member)</option>
                        <option value="Transfer Out">Transfer Out (Outgoing Member)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Status Stage *</label>
                      <select name="transferStatus" value={memberForm.transferStatus} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl font-semibold">
                        <option value="Request Made">Request Made</option>
                        <option value="Board Approval">Board Approval</option>
                        <option value="1st Reading">1st Reading</option>
                        <option value="2nd Reading / Transfer Granted">2nd Reading / Transfer Granted</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Incoming Church (Origin)</label>
                      <input type="text" name="originChurch" placeholder="Origin SDA Church" value={memberForm.originChurch} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Outgoing Church (Destination)</label>
                      <input type="text" name="targetChurch" placeholder="Target SDA Church" value={memberForm.targetChurch} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">CBM Minute Number</label>
                      <input type="text" name="cbmMinute" placeholder="e.g. CBM/04/2026" value={memberForm.cbmMinute} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl font-mono text-xs" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Date of 2nd Reading / Voted Approval</label>
                      <input type="date" name="secondReadingDate" value={memberForm.secondReadingDate} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl" />
                    </div>
                  </div>
                </div>
              )}

              {/* PROFESSION OF FAITH SPECIFICS */}
              {memberForm.joiningMethod === 'Profession of Faith' && (
                <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-xl space-y-4">
                  <h4 className="font-semibold text-purple-900 text-sm uppercase border-b border-purple-200 pb-1">Profession of Faith Details & Attachments</h4>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Former Church / Faith Denomination *</label>
                    <input type="text" name="formerFaith" value={memberForm.formerFaith} onChange={handleInputChange} className="w-full px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl" placeholder="e.g. ACK, Catholic, Baptist, None..." />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Letter from Previous Church</label>
                      <label className="flex items-center gap-2 border border-purple-200 bg-white p-3 rounded-xl cursor-pointer text-slate-600">
                        <UploadCloud size={18} className="text-purple-700" />
                        <span className="truncate">{memberForm.previousChurchLetter ? memberForm.previousChurchLetter.name : 'Upload Letter...'}</span>
                        <input type="file" onChange={(e) => handleFileUpload('previousChurchLetter', e.target.files[0])} className="hidden" />
                      </label>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Letter from Parents (If applicable)</label>
                      <label className="flex items-center gap-2 border border-purple-200 bg-white p-3 rounded-xl cursor-pointer text-slate-600">
                        <UploadCloud size={18} className="text-purple-700" />
                        <span className="truncate">{memberForm.parentsLetter ? memberForm.parentsLetter.name : 'Upload Letter...'}</span>
                        <input type="file" onChange={(e) => handleFileUpload('parentsLetter', e.target.files[0])} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium cursor-pointer hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer flex items-center gap-2">
                  {isSubmitting && <Loader2 className="animate-spin" size={16} />} Save Member Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TRANSFER STATUS */}
      {isEditTransferModalOpen && selectedTransferRow && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Edit3 className="text-amber-400" size={20} /> ACMS Transfer Update: {selectedTransferRow.full_name}
              </h3>
              <button onClick={() => setIsEditTransferModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveTransferEdit} className="p-6 space-y-4 text-sm font-normal">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Transfer Type</label>
                  <select 
                    value={selectedTransferRow.transfer_type || 'Transfer In'} 
                    onChange={(e) => setSelectedTransferRow({...selectedTransferRow, transfer_type: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-sm"
                  >
                    <option value="Transfer In">Transfer In (Incoming)</option>
                    <option value="Transfer Out">Transfer Out (Outgoing)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Current Status Stage *</label>
                  <select 
                    value={selectedTransferRow.transfer_status || 'Request Made'} 
                    onChange={(e) => setSelectedTransferRow({...selectedTransferRow, transfer_status: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-semibold focus:outline-none text-sm"
                  >
                    <option value="Request Made">Request Made</option>
                    <option value="Board Approval">Board Approval</option>
                    <option value="1st Reading">1st Reading</option>
                    <option value="2nd Reading / Transfer Granted">2nd Reading / Transfer Granted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Incoming Church (Origin)</label>
                  <input type="text" value={selectedTransferRow.origin_church || ''} onChange={(e) => setSelectedTransferRow({...selectedTransferRow, origin_church: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Outgoing Church (Destination)</label>
                  <input type="text" value={selectedTransferRow.target_church || ''} onChange={(e) => setSelectedTransferRow({...selectedTransferRow, target_church: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Church Business Meeting (CBM) Minute No.</label>
                <input type="text" placeholder="e.g. CBM/MIN/04/2026" value={selectedTransferRow.cbm_minute || ''} onChange={(e) => setSelectedTransferRow({...selectedTransferRow, cbm_minute: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Board Meeting Date</label>
                  <input type="date" value={selectedTransferRow.board_meeting_date || ''} onChange={(e) => setSelectedTransferRow({...selectedTransferRow, board_meeting_date: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Board Minute Ref.</label>
                  <input type="text" placeholder="MIN/BRD/..." value={selectedTransferRow.approval_minute || ''} onChange={(e) => setSelectedTransferRow({...selectedTransferRow, approval_minute: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">First Reading Date</label>
                  <input type="date" value={selectedTransferRow.first_reading_date || ''} onChange={(e) => setSelectedTransferRow({...selectedTransferRow, first_reading_date: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">2nd Reading / Approval Date</label>
                  <input type="date" value={selectedTransferRow.second_reading_date || ''} onChange={(e) => setSelectedTransferRow({...selectedTransferRow, second_reading_date: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl" />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsEditTransferModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer flex items-center gap-2">
                  {isSubmitting && <Loader2 className="animate-spin" size={16} />} Update Transfer Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}