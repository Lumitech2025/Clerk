import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  AlertCircle
} from 'lucide-react';

export default function MembershipRecords() {
  const [activeSubTab, setActiveSubTab] = useState('all');
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
    fatherName: '',
    fatherPhone: '',
    fatherEmail: '',
    motherName: '',
    motherPhone: '',
    motherEmail: '',
    homeChurch: 'Newlife SDA Church',
    baptismCard: null,
    formerFaith: '',
    previousChurchLetter: null,
    parentsLetter: null,
    transferStatus: 'Request Made',
    transferType: 'Transfer In', 
    currentChurch: '',
    targetChurch: '',
    boardMeetingDate: '',
    approvalMinute: '',
    firstReadingDate: '',
    secondReadingDate: '',
    cbmMinute: ''
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

      if (activeSubTab === 'transfers') params.joining_method = 'Transfer';
      if (activeSubTab === 'baptisms') params.joining_method = 'Baptism';
      if (activeSubTab === 'pof') params.joining_method = 'Profession of Faith';

      const response = await API.get('member-records/', { params });
      
      // DRF Paginated Response Structure
      if (response.data.results) {
        setMembers(response.data.results);
        setTotalCount(response.data.count);
      } else {
        // Fallback for non-paginated endpoints
        setMembers(response.data);
        setTotalCount(response.data.length);
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

  // Handle Form Inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMemberForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (field, file) => {
    setMemberForm(prev => ({ ...prev, [field]: file }));
  };

  // 2. CREATE NEW MEMBER VIA API
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

      // Registry
      formData.append('joining_method', memberForm.joiningMethod);
      formData.append('home_church', memberForm.homeChurch);
      formData.append('year_joined', new Date().getFullYear());

      // File attachments & optional fields
      if (memberForm.formerFaith) formData.append('former_faith', memberForm.formerFaith);
      if (memberForm.previousChurchLetter) formData.append('previous_church_letter', memberForm.previousChurchLetter);
      if (memberForm.parentsLetter) formData.append('parents_consent_letter', memberForm.parentsLetter);
      if (memberForm.baptismCard) formData.append('baptism_card', memberForm.baptismCard);

      if (memberForm.joiningMethod === 'Transfer') {
        formData.append('transfer_status', memberForm.transferStatus);
        formData.append('transfer_type', memberForm.transferType);
        formData.append('origin_church', memberForm.currentChurch);
        formData.append('target_church', memberForm.targetChurch);
      }

      await API.post('member-records/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setIsAddModalOpen(false);
      fetchMembers(); // Reload list from backend
    } catch (err) {
      console.error('Error adding member:', err);
      alert('Failed to save member. Please check required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. EDIT TRANSFER STATUS VIA API
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
        origin_church: selectedTransferRow.origin_church,
        target_church: selectedTransferRow.target_church,
        board_meeting_date: selectedTransferRow.board_meeting_date || null,
        approval_minute: selectedTransferRow.approval_minute,
        first_reading_date: selectedTransferRow.first_reading_date || null,
        second_reading_date: selectedTransferRow.second_reading_date || null,
        cbm_minute: selectedTransferRow.cbm_minute,
      };

      await API.patch(`member-records/${selectedTransferRow.id}/`, payload);
      setIsEditTransferModalOpen(false);
      fetchMembers();
    } catch (err) {
      console.error('Error updating transfer:', err);
      alert('Failed to update transfer status.');
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
    <div className="font-sans space-y-6 text-slate-800 leading-relaxed">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Users size={22} />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Membership Records & Registers</h1>
          </div>
          
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsUploadArchiveModalOpen(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-300/70 transition cursor-pointer"
          >
            <UploadCloud size={16} className="text-slate-500" /> Upload Past Registers (PDF/Excel)
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <UserPlus size={16} /> Add New Member
          </button>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* SUB TABS */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => { setActiveSubTab('all'); setCurrentPage(1); }}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer ${
              activeSubTab === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Users size={15} /> All Members
          </button>

          <button
            onClick={() => { setActiveSubTab('transfers'); setCurrentPage(1); }}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer ${
              activeSubTab === 'transfers' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <ArrowLeftRight size={15} /> Transfers
          </button>

          <button
            onClick={() => { setActiveSubTab('baptisms'); setCurrentPage(1); }}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer ${
              activeSubTab === 'baptisms' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Droplets size={15} /> Baptisms
          </button>

          <button
            onClick={() => { setActiveSubTab('pof'); setCurrentPage(1); }}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer ${
              activeSubTab === 'pof' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <BookOpen size={15} /> Profession of Faith
          </button>
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
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
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
          <>
            {/* TAB 1: ALL MEMBERS DIRECTORY */}
            {activeSubTab === 'all' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-xs font-semibold uppercase text-slate-800">
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
                  <tbody className="divide-y divide-slate-200 text-xs font-normal text-slate-800">
                    {members.length > 0 ? (
                      members.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                          <td className="border border-slate-300 py-2.5 px-3 text-center font-medium text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
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
                        <td colSpan="8" className="text-center py-8 text-slate-400 font-medium">No member records found matching your query.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: TRANSFERS TAB */}
            {activeSubTab === 'transfers' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-semibold uppercase text-slate-800">
                      <th className="border border-slate-300 py-3 px-3">Member</th>
                      <th className="border border-slate-300 py-3 px-3">Status Progress</th>
                      <th className="border border-slate-300 py-3 px-3">Type</th>
                      <th className="border border-slate-300 py-3 px-3">Origin Church</th>
                      <th className="border border-slate-300 py-3 px-3">Destination Church</th>
                      <th className="border border-slate-300 py-3 px-3">Board Date</th>
                      <th className="border border-slate-300 py-3 px-3">Approval Minute</th>
                      <th className="border border-slate-300 py-3 px-3">1st Reading</th>
                      <th className="border border-slate-300 py-3 px-3">2nd Reading</th>
                      <th className="border border-slate-300 py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-normal text-slate-800">
                    {members.map((m) => (
                      <tr 
                        key={m.id} 
                        onClick={() => handleOpenTransferEdit(m)}
                        className="hover:bg-amber-50/50 transition cursor-pointer group"
                      >
                        <td className="border border-slate-300 py-2.5 px-3 font-semibold text-slate-900 group-hover:text-amber-900">{m.full_name}</td>
                        <td className="border border-slate-300 py-2.5 px-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border uppercase tracking-wider ${getTransferStatusBadge(m.transfer_status)}`}>
                            {m.transfer_status || 'Request Made'}
                          </span>
                        </td>
                        <td className="border border-slate-300 py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-900">
                            {m.transfer_type || 'Transfer In'}
                          </span>
                        </td>
                        <td className="border border-slate-300 py-2.5 px-3">{m.origin_church || 'N/A'}</td>
                        <td className="border border-slate-300 py-2.5 px-3">{m.target_church || 'Newlife SDA Church'}</td>
                        <td className="border border-slate-300 py-2.5 px-3">{m.board_meeting_date || 'Pending'}</td>
                        <td className="border border-slate-300 py-2.5 px-3 font-mono text-[11px]">{m.approval_minute || 'Pending'}</td>
                        <td className="border border-slate-300 py-2.5 px-3">{m.first_reading_date || 'Pending'}</td>
                        <td className="border border-slate-300 py-2.5 px-3">{m.second_reading_date || 'Pending'}</td>
                        <td className="border border-slate-300 py-2.5 px-3 text-center">
                          <span className="text-amber-700 font-semibold hover:underline inline-flex items-center gap-1">
                            <Edit3 size={13} /> Edit
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: BAPTISMS TAB */}
            {activeSubTab === 'baptisms' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-semibold uppercase text-slate-800">
                      <th className="border border-slate-300 py-3 px-3">Member Name</th>
                      <th className="border border-slate-300 py-3 px-3">Gender</th>
                      <th className="border border-slate-300 py-3 px-3">Date of Birth</th>
                      <th className="border border-slate-300 py-3 px-3">Home Church</th>
                      <th className="border border-slate-300 py-3 px-3">Parents Info</th>
                      <th className="border border-slate-300 py-3 px-3 text-center">Baptism Card</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-normal text-slate-800">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="border border-slate-300 py-2.5 px-3 font-semibold text-slate-900">{m.full_name}</td>
                        <td className="border border-slate-300 py-2.5 px-3">{m.gender}</td>
                        <td className="border border-slate-300 py-2.5 px-3">{m.date_of_birth || 'N/A'}</td>
                        <td className="border border-slate-300 py-2.5 px-3">{m.home_church}</td>
                        <td className="border border-slate-300 py-2.5 px-3 text-[11px]">
                          <div>F: {m.father_name || 'N/A'}</div>
                          <div>M: {m.mother_name || 'N/A'}</div>
                        </td>
                        <td className="border border-slate-300 py-2.5 px-3 text-center">
                          {m.baptism_card ? (
                            <a href={m.baptism_card} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-semibold hover:bg-blue-100">
                              <FileText size={13} /> View Card
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px]">None</span>
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
                <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-semibold uppercase text-slate-800">
                      <th className="border border-slate-300 py-3 px-3">Member Name</th>
                      <th className="border border-slate-300 py-3 px-3">Former Church / Faith</th>
                      <th className="border border-slate-300 py-3 px-3">Phone</th>
                      <th className="border border-slate-300 py-3 px-3">Citizenship</th>
                      <th className="border border-slate-300 py-3 px-3">Date Received</th>
                      <th className="border border-slate-300 py-3 px-3 text-center">Supporting Documents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-normal text-slate-800">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="border border-slate-300 py-2.5 px-3 font-semibold text-slate-900">{m.full_name}</td>
                        <td className="border border-slate-300 py-2.5 px-3 text-purple-900 font-medium">{m.former_faith || 'N/A'}</td>
                        <td className="border border-slate-300 py-2.5 px-3">{m.phone_number}</td>
                        <td className="border border-slate-300 py-2.5 px-3">{m.citizenship || 'Kenyan'}</td>
                        <td className="border border-slate-300 py-2.5 px-3">{m.date_joined}</td>
                        <td className="border border-slate-300 py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {m.previous_church_letter && (
                              <a href={m.previous_church_letter} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200 font-semibold hover:bg-purple-100">
                                <Paperclip size={12} /> Previous Letter
                              </a>
                            )}
                            {m.parents_consent_letter && (
                              <a href={m.parents_consent_letter} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 font-semibold hover:bg-slate-100">
                                <Paperclip size={12} /> Parents Letter
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
              <option value={100}>100</option>
            </select>
            <span>entries per page</span>
            <span className="text-slate-400 border-l pl-2 ml-1">
              Showing {totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} records
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
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
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* ================= MODAL: UPLOAD HISTORICAL REGISTERS ================= */}
      {isUploadArchiveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden font-sans">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-400" size={20} /> Upload Historical Registers
              </h3>
              <button onClick={() => setIsUploadArchiveModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <form onSubmit={handleArchiveSubmit} className="p-6 space-y-4 text-xs font-normal">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Register Year *</label>
                <select 
                  value={archiveForm.year}
                  onChange={(e) => setArchiveForm({...archiveForm, year: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
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
                  <span className="text-[11px] text-slate-400 mt-0.5">Supports .xlsx, .csv, .pdf up to 50MB</span>
                  {archiveForm.file && (
                    <span className="mt-2 text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
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

      {/* ================= MODAL: ADD NEW MEMBER ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-sans">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white flex-shrink-0">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <UserPlus className="text-emerald-400" size={20} /> Register New Member
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6 text-xs font-normal overflow-y-auto">
              <div className="bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-xl space-y-2">
                <label className="block text-slate-900 font-semibold">Method of Admission *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Baptism', 'Transfer', 'Profession of Faith'].map((method) => (
                    <label key={method} className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer transition ${
                      memberForm.joiningMethod === method ? 'bg-emerald-700 text-white border-emerald-700 font-semibold' : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      <input type="radio" name="joiningMethod" value={method} checked={memberForm.joiningMethod === method} onChange={handleInputChange} className="hidden" />
                      <span className="text-xs">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-xs uppercase border-b pb-1 mb-3 text-emerald-800">1. Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
                    <input type="text" name="fullName" required value={memberForm.fullName} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" placeholder="First Middle Last" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Date of Birth</label>
                    <input type="date" name="dob" value={memberForm.dob} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Gender *</label>
                    <select name="gender" value={memberForm.gender} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Citizenship *</label>
                    <input type="text" name="citizenship" value={memberForm.citizenship} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
                    <input type="text" name="phone" value={memberForm.phone} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" placeholder="+254 7..." />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Email Address</label>
                    <input type="email" name="email" value={memberForm.email} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" placeholder="member@example.com" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-xs uppercase border-b pb-1 mb-3 text-emerald-800">2. Parents Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-3">
                  <div className="md:col-span-3 font-semibold text-slate-800">Father's Information</div>
                  <input type="text" name="fatherName" placeholder="Father's Full Name" value={memberForm.fatherName} onChange={handleInputChange} className="px-3 py-2 bg-white border border-slate-200 rounded-xl" />
                  <input type="text" name="fatherPhone" placeholder="Mobile Number" value={memberForm.fatherPhone} onChange={handleInputChange} className="px-3 py-2 bg-white border border-slate-200 rounded-xl" />
                  <input type="email" name="fatherEmail" placeholder="Email" value={memberForm.fatherEmail} onChange={handleInputChange} className="px-3 py-2 bg-white border border-slate-200 rounded-xl" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="md:col-span-3 font-semibold text-slate-800">Mother's Information</div>
                  <input type="text" name="motherName" placeholder="Mother's Full Name" value={memberForm.motherName} onChange={handleInputChange} className="px-3 py-2 bg-white border border-slate-200 rounded-xl" />
                  <input type="text" name="motherPhone" placeholder="Mobile Number" value={memberForm.motherPhone} onChange={handleInputChange} className="px-3 py-2 bg-white border border-slate-200 rounded-xl" />
                  <input type="email" name="motherEmail" placeholder="Email" value={memberForm.motherEmail} onChange={handleInputChange} className="px-3 py-2 bg-white border border-slate-200 rounded-xl" />
                </div>
              </div>

              {memberForm.joiningMethod === 'Profession of Faith' && (
                <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-xl space-y-4">
                  <h4 className="font-semibold text-purple-900 text-xs uppercase border-b border-purple-200 pb-1">Profession of Faith Details & Attachments</h4>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Former Church / Faith Denomination *</label>
                    <input type="text" name="formerFaith" value={memberForm.formerFaith} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl" placeholder="e.g. ACK, Catholic, Baptist, None..." />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Letter from Previous Church</label>
                      <label className="flex items-center gap-2 border border-purple-200 bg-white p-2.5 rounded-xl cursor-pointer text-slate-600">
                        <UploadCloud size={16} className="text-purple-700" />
                        <span className="truncate">{memberForm.previousChurchLetter ? memberForm.previousChurchLetter.name : 'Upload Letter...'}</span>
                        <input type="file" onChange={(e) => handleFileUpload('previousChurchLetter', e.target.files[0])} className="hidden" />
                      </label>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Letter from Parents (If applicable)</label>
                      <label className="flex items-center gap-2 border border-purple-200 bg-white p-2.5 rounded-xl cursor-pointer text-slate-600">
                        <UploadCloud size={16} className="text-purple-700" />
                        <span className="truncate">{memberForm.parentsLetter ? memberForm.parentsLetter.name : 'Upload Letter...'}</span>
                        <input type="file" onChange={(e) => handleFileUpload('parentsLetter', e.target.files[0])} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {memberForm.joiningMethod === 'Transfer' && (
                <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl space-y-4">
                  <h4 className="font-semibold text-amber-900 text-xs uppercase border-b border-amber-200 pb-1">Transfer Tracking Setup</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Transfer Status Stage *</label>
                      <select name="transferStatus" value={memberForm.transferStatus} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl font-semibold">
                        <option value="Request Made">Request Made</option>
                        <option value="Board Approval">Board Approval</option>
                        <option value="1st Reading">1st Reading</option>
                        <option value="2nd Reading / Transfer Granted">2nd Reading / Transfer Granted</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Transfer Type</label>
                      <select name="transferType" value={memberForm.transferType} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl">
                        <option value="Transfer In">Transfer In</option>
                        <option value="Transfer Out">Transfer Out</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium cursor-pointer hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer flex items-center gap-2">
                  {isSubmitting && <Loader2 className="animate-spin" size={14} />} Save Member Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT TRANSFER STATUS ================= */}
      {isEditTransferModalOpen && selectedTransferRow && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Edit3 className="text-amber-400" size={18} /> Update Transfer: {selectedTransferRow.full_name}
              </h3>
              <button onClick={() => setIsEditTransferModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveTransferEdit} className="p-6 space-y-4 text-xs font-normal">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Current Status Stage *</label>
                <select 
                  value={selectedTransferRow.transfer_status || 'Request Made'} 
                  onChange={(e) => setSelectedTransferRow({...selectedTransferRow, transfer_status: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-semibold focus:outline-none"
                >
                  <option value="Request Made">Request Made</option>
                  <option value="Board Approval">Board Approval</option>
                  <option value="1st Reading">1st Reading</option>
                  <option value="2nd Reading / Transfer Granted">2nd Reading / Transfer Granted</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Origin Church</label>
                  <input type="text" value={selectedTransferRow.origin_church || ''} onChange={(e) => setSelectedTransferRow({...selectedTransferRow, origin_church: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Receiving Church</label>
                  <input type="text" value={selectedTransferRow.target_church || ''} onChange={(e) => setSelectedTransferRow({...selectedTransferRow, target_church: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Board Meeting Date</label>
                  <input type="date" value={selectedTransferRow.board_meeting_date || ''} onChange={(e) => setSelectedTransferRow({...selectedTransferRow, board_meeting_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Approval Minute Ref.</label>
                  <input type="text" placeholder="MIN/BRD/..." value={selectedTransferRow.approval_minute || ''} onChange={(e) => setSelectedTransferRow({...selectedTransferRow, approval_minute: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-[11px]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">First Reading Date</label>
                  <input type="date" value={selectedTransferRow.first_reading_date || ''} onChange={(e) => setSelectedTransferRow({...selectedTransferRow, first_reading_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Second Reading Date</label>
                  <input type="date" value={selectedTransferRow.second_reading_date || ''} onChange={(e) => setSelectedTransferRow({...selectedTransferRow, second_reading_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Church Business Meeting (CBM) Minute</label>
                <input type="text" placeholder="CBM/..." value={selectedTransferRow.cbm_minute || ''} onChange={(e) => setSelectedTransferRow({...selectedTransferRow, cbm_minute: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-[11px]" />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsEditTransferModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer flex items-center gap-2">
                  {isSubmitting && <Loader2 className="animate-spin" size={14} />} Update Transfer Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}