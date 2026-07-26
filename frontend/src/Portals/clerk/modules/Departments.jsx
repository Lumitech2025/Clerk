import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  FileText, 
  Download, 
  Plus, 
  Search, 
  X, 
  Eye, 
  Upload, 
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit,
  Loader2,
  ExternalLink
} from 'lucide-react';
import API from '../../../api/api';

const Departments = () => {
  // Navigation Tabs: 'tors' | 'reports'
  const [activeTab, setActiveTab] = useState('tors');

  // API State
  const [departments, setDepartments] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All Departments');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All Types');

  // Pagination State for Departments Table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer / Modal States
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // Toggle edit mode inside details modal
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isUploadReportModalOpen, setIsUploadReportModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // --- FETCH DATA FROM BACKEND ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, reportsRes] = await Promise.all([
        API.get('/departments/'),
        API.get('/departmental-reports/')
      ]);
      setDepartments(deptRes.data.results || deptRes.data);
      setReports(reportsRes.data.results || reportsRes.data);
    } catch (err) {
      console.error('Error fetching department data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FORM STATE: ADD NEW DEPARTMENT ---
  const [deptForm, setDeptForm] = useState({
    name: '',
    leader: '',
    councilMembers: [{ name: '', role: '' }],
    torFile: null
  });

  // --- FORM STATE: EDIT EXISTING DEPARTMENT ---
  const [editForm, setEditForm] = useState({
    id: null,
    name: '',
    leader: '',
    councilMembers: [],
    torFile: null
  });

  // Populate Edit Form when entering Edit Mode
  const handleStartEdit = (dept) => {
    let members = [];
    if (Array.isArray(dept.council_members)) {
      members = dept.council_members.map(m => ({ name: m.name || '', role: m.role || '' }));
    }
    if (members.length === 0) members = [{ name: '', role: '' }];

    setEditForm({
      id: dept.id,
      name: dept.name,
      leader: dept.leader,
      councilMembers: members,
      torFile: null
    });
    setIsEditing(true);
  };

  // Dynamic Council Member Row Handlers for CREATE
  const handleAddCouncilMember = () => {
    setDeptForm({
      ...deptForm,
      councilMembers: [...deptForm.councilMembers, { name: '', role: '' }]
    });
  };

  const handleRemoveCouncilMember = (index) => {
    const updated = deptForm.councilMembers.filter((_, i) => i !== index);
    setDeptForm({ ...deptForm, councilMembers: updated });
  };

  const handleCouncilMemberChange = (index, field, value) => {
    const updated = [...deptForm.councilMembers];
    updated[index][field] = value;
    setDeptForm({ ...deptForm, councilMembers: updated });
  };

  // Dynamic Council Member Row Handlers for EDIT
  const handleAddEditCouncilMember = () => {
    setEditForm({
      ...editForm,
      councilMembers: [...editForm.councilMembers, { name: '', role: '' }]
    });
  };

  const handleRemoveEditCouncilMember = (index) => {
    const updated = editForm.councilMembers.filter((_, i) => i !== index);
    setEditForm({ ...editForm, councilMembers: updated });
  };

  const handleEditCouncilMemberChange = (index, field, value) => {
    const updated = [...editForm.councilMembers];
    updated[index][field] = value;
    setEditForm({ ...editForm, councilMembers: updated });
  };

  // Submit Add Department
  const handleAddDeptSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const cleanedCouncil = deptForm.councilMembers.filter(m => m.name.trim() !== '');

      const formData = new FormData();
      formData.append('name', deptForm.name);
      formData.append('leader', deptForm.leader);
      formData.append('council_members', JSON.stringify(cleanedCouncil));
      
      if (deptForm.torFile) {
        formData.append('tor_doc', deptForm.torFile);
      }

      await API.post('/departments/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await fetchData();
      setIsAddDeptModalOpen(false);

      setDeptForm({
        name: '',
        leader: '',
        councilMembers: [{ name: '', role: '' }],
        torFile: null
      });
    } catch (err) {
      console.error('Error saving department:', err);
      alert('Failed to save department. Please check fields.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Update Department (PATCH)
  const handleUpdateDeptSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const cleanedCouncil = editForm.councilMembers.filter(m => m.name.trim() !== '');

      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('leader', editForm.leader);
      formData.append('council_members', JSON.stringify(cleanedCouncil));

      if (editForm.torFile) {
        formData.append('tor_doc', editForm.torFile);
      }

      const res = await API.patch(`/departments/${editForm.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await fetchData();
      setSelectedDepartment(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating department:', err);
      alert('Failed to update department details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Department
  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) return;
    setSubmitting(true);
    try {
      await API.delete(`/departments/${id}/`);
      await fetchData();
      setSelectedDepartment(null);
      setIsEditing(false);
    } catch (err) {
      console.error('Error deleting department:', err);
      alert('Failed to delete department.');
    } finally {
      setSubmitting(false);
    }
  };

  // Form State: Upload Report Modal
  const [uploadForm, setUploadForm] = useState({
    departmentId: '',
    reportType: 'Monthly Report',
    date: '',
    title: '',
    file: null
  });

  // Submit Upload Report
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.departmentId) {
      alert('Please select a department and file.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('department', uploadForm.departmentId);
      formData.append('report_type', uploadForm.reportType);
      formData.append('date', uploadForm.date);
      formData.append('title', uploadForm.title || `${uploadForm.reportType}`);
      formData.append('report_file', uploadForm.file);

      await API.post('/departmental-reports/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await fetchData();
      setIsUploadReportModalOpen(false);
      setUploadForm({ departmentId: '', reportType: 'Monthly Report', date: '', title: '', file: null });
    } catch (err) {
      console.error('Error uploading report:', err);
      alert('Failed to upload report.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering & Pagination Logic for Departments
  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.leader.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDepartments = filteredDepartments.slice(startIndex, startIndex + itemsPerPage);

  // Helper to determine viewer URL based on file type
  const renderDocumentPreview = (fileUrl) => {
    if (!fileUrl) return null;

    const lowerUrl = fileUrl.toLowerCase();
    
    // PDF files can be rendered directly via browser iframe
    if (lowerUrl.includes('.pdf')) {
      return (
        <iframe
          src={`${fileUrl}#toolbar=0`}
          title="Report Preview"
          className="w-full h-full rounded-b-xl border-none"
        />
      );
    }

    // Word or Office files can be viewed using Google Docs Embed
    if (lowerUrl.includes('.doc') || lowerUrl.includes('.docx')) {
      const googleEmbedUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      return (
        <iframe
          src={googleEmbedUrl}
          title="Report Preview"
          className="w-full h-full rounded-b-xl border-none"
        />
      );
    }

    // Fallback View
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-500 space-y-3">
        <FileText size={48} className="text-slate-400" />
        <p className="text-sm font-semibold">Preview not directly supported in browser for this file type.</p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          download
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
        >
          Download to View File
        </a>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Departments & Terms of Reference</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of Newlife Church department leadership, council structures, and official TOR documents.
          </p>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('tors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === 'tors' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 size={16} />
            <span>Departments & TORs</span>
          </button>
          
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === 'reports' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={16} />
            <span>Departmental Reports</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DEPARTMENTS & TORS TABLE                                          */}
      {/* ========================================================================= */}
      {activeTab === 'tors' && (
        <div className="space-y-4">
          
          {/* ACTION & SEARCH BAR */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search department or leader..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            <button
              onClick={() => setIsAddDeptModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer shadow-2xs"
            >
              <Plus size={18} />
              <span>Add Department</span>
            </button>
          </div>

          {/* MASTER DEPARTMENT TABLE */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Department Name</th>
                    <th className="py-3.5 px-6">Leader</th>
                    <th className="py-3.5 px-6">Council Members</th>
                    <th className="py-3.5 px-6">TOR Document</th>
                    <th className="py-3.5 px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400">
                        <Loader2 className="animate-spin mx-auto mb-2 text-emerald-600" size={24} />
                        Loading departments...
                      </td>
                    </tr>
                  ) : paginatedDepartments.length > 0 ? (
                    paginatedDepartments.map((dept) => (
                      <tr 
                        key={dept.id} 
                        onClick={() => {
                          setSelectedDepartment(dept);
                          setIsEditing(false);
                        }}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                      >
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          {dept.name}
                        </td>

                        <td className="py-4 px-6 font-medium text-slate-800">
                          {dept.leader}
                        </td>

                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium border border-slate-200">
                            {Array.isArray(dept.council_members) ? dept.council_members.length : 0} Members
                          </span>
                        </td>

                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                          {dept.tor_doc_url ? (
                            <a
                              href={dept.tor_doc_url}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-semibold text-sm hover:underline"
                            >
                              <Download size={15} /> Download TOR
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No Document</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button className="text-slate-400 hover:text-slate-700 p-1 transition">
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                        No departments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* TABLE PAGINATION BAR */}
            <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-600">
              <div>
                Showing <span className="font-semibold text-slate-800">{filteredDepartments.length === 0 ? 0 : startIndex + 1}</span> to{' '}
                <span className="font-semibold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredDepartments.length)}</span> of{' '}
                <span className="font-semibold text-slate-800">{filteredDepartments.length}</span> departments
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer text-slate-700"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer text-slate-700"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DEPARTMENTAL REPORTS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          
          {/* CONTROLS BAR */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="All Departments">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>

              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="All Types">All Report Types</option>
                <option value="Monthly Report">Monthly Report</option>
                <option value="Quarterly Report">Quarterly Report</option>
                <option value="Event Report">Event Report</option>
              </select>

              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search report title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <button
              onClick={() => setIsUploadReportModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition shadow-2xs"
            >
              <Upload size={15} />
              <span>Upload Report</span>
            </button>
          </div>

          {/* REPORTS TILES GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {reports
              .filter(r => selectedDeptFilter === 'All Departments' || r.department_name === selectedDeptFilter)
              .filter(r => selectedTypeFilter === 'All Types' || r.report_type === selectedTypeFilter)
              .filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((report) => (
                <div 
                  key={report.id}
                  className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        report.report_type === 'Monthly Report' ? 'bg-blue-50 text-blue-700' :
                        report.report_type === 'Quarterly Report' ? 'bg-purple-50 text-purple-700' :
                        'bg-amber-50 text-amber-800'
                      }`}>
                        {report.report_type}
                      </span>
                      <span className="text-[10px] text-slate-400">{report.date}</span>
                    </div>

                    <div 
                      onClick={() => setPreviewDoc(report)}
                      className="w-full h-20 bg-slate-50 border border-slate-200 rounded-lg p-2 my-2 cursor-pointer relative overflow-hidden group-hover:border-emerald-300 transition flex flex-col justify-between"
                    >
                      <div className="space-y-1 opacity-50">
                        <div className="h-1 bg-slate-400 rounded w-3/4"></div>
                        <div className="h-1 bg-slate-300 rounded w-full"></div>
                        <div className="h-1 bg-slate-300 rounded w-5/6"></div>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium">
                        <span>Preview</span>
                        <Eye size={11} className="text-slate-500 group-hover:text-emerald-700" />
                      </div>
                    </div>

                    <p className="text-[10px] font-medium text-emerald-800 truncate">{report.department_name}</p>
                    <h4 className="font-semibold text-slate-800 text-xs line-clamp-2 leading-tight mt-0.5" title={report.title}>
                      {report.title}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-2.5 mt-2 border-t border-slate-100">
                    <button
                      onClick={() => setPreviewDoc(report)}
                      className="flex items-center justify-center gap-1 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-medium transition cursor-pointer"
                    >
                      <Eye size={12} /> View
                    </button>

                    <a
                      href={report.report_file_url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="flex items-center justify-center gap-1 p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-medium transition cursor-pointer"
                    >
                      <Download size={12} /> Get
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW DEPARTMENT                                              */}
      {/* ========================================================================= */}
      {isAddDeptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Building2 className="text-emerald-400" size={20} /> Add New Department
              </h3>
              <button onClick={() => setIsAddDeptModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <form onSubmit={handleAddDeptSubmit} className="p-6 space-y-4 text-sm font-medium text-slate-700 overflow-y-auto">
              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Children's Ministries"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({...deptForm, name: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Department Leader *</label>
                <input
                  type="text"
                  required
                  placeholder="Leader's Full Name"
                  value={deptForm.leader}
                  onChange={(e) => setDeptForm({...deptForm, leader: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-800">Council Members & Roles</label>
                  <button
                    type="button"
                    onClick={handleAddCouncilMember}
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 text-xs font-semibold cursor-pointer"
                  >
                    <Plus size={14} /> Add Council Member
                  </button>
                </div>

                {deptForm.councilMembers.map((member, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Member Name"
                      value={member.name}
                      onChange={(e) => handleCouncilMemberChange(index, 'name', e.target.value)}
                      className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. Secretary)"
                      value={member.role}
                      onChange={(e) => handleCouncilMemberChange(index, 'role', e.target.value)}
                      className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                    {deptForm.councilMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCouncilMember(index)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <label className="block font-semibold mb-1.5 text-slate-800">TOR Document Upload (PDF / Doc)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-100/50 transition text-center cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setDeptForm({...deptForm, torFile: e.target.files[0]})}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <Upload size={22} className="text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700">
                      {deptForm.torFile ? deptForm.torFile.name : 'Click to upload or drag & drop TOR document'}
                    </p>
                    <p className="text-xs text-slate-400">PDF, DOC, DOCX up to 10MB</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDeptModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-2xs cursor-pointer transition flex items-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DEPARTMENT DETAILS / EDIT DRAWER                                */}
      {/* ========================================================================= */}
      {selectedDepartment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* MODAL HEADER */}
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {isEditing ? 'Edit Department' : 'Department Details'}
                </p>
                <h3 className="font-bold text-lg mt-0.5">{selectedDepartment.name}</h3>
              </div>
              <button onClick={() => { setSelectedDepartment(null); setIsEditing(false); }} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            {/* VIEW MODE */}
            {!isEditing ? (
              <div className="p-6 space-y-5 text-sm font-medium text-slate-700 overflow-y-auto">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <p className="text-xs uppercase font-bold text-slate-400">Department Leader</p>
                  <p className="font-bold text-slate-900 text-base mt-1">{selectedDepartment.leader}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase font-bold text-slate-400">Council Members & Roles</p>
                    <span className="text-xs text-slate-500 font-medium">
                      {Array.isArray(selectedDepartment.council_members) ? selectedDepartment.council_members.length : 0} Total
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {Array.isArray(selectedDepartment.council_members) && selectedDepartment.council_members.length > 0 ? (
                      selectedDepartment.council_members.map((m, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200/80 text-sm">
                          <span className="font-semibold text-slate-800">{m.name}</span>
                          <span className="text-xs text-slate-500 font-medium bg-slate-200/60 px-2 py-0.5 rounded">{m.role || 'Member'}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic text-xs">No council members listed.</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Official TOR File:</span>
                  {selectedDepartment.tor_doc_url ? (
                    <a
                      href={selectedDepartment.tor_doc_url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg border border-emerald-200 font-bold transition text-sm"
                    >
                      <Download size={15} /> Download TOR
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs italic">None uploaded</span>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 -mx-6 -mb-6 mt-4 flex items-center justify-between">
                  <button
                    onClick={() => handleDeleteDepartment(selectedDepartment.id)}
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={16} /> Delete Dept
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDepartment(null)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                    >
                      Close
                    </button>

                    <button
                      onClick={() => handleStartEdit(selectedDepartment)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit size={14} /> Edit Department
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* EDIT MODE FORM */
              <form onSubmit={handleUpdateDeptSubmit} className="p-6 space-y-4 text-sm font-medium text-slate-700 overflow-y-auto">
                <div>
                  <label className="block font-semibold mb-1 text-slate-800">Department Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-800">Department Leader *</label>
                  <input
                    type="text"
                    required
                    value={editForm.leader}
                    onChange={(e) => setEditForm({ ...editForm, leader: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-800">Council Members & Roles</label>
                    <button
                      type="button"
                      onClick={handleAddEditCouncilMember}
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 text-xs font-semibold cursor-pointer"
                    >
                      <Plus size={14} /> Add Member
                    </button>
                  </div>

                  {editForm.councilMembers.map((member, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Member Name"
                        value={member.name}
                        onChange={(e) => handleEditCouncilMemberChange(index, 'name', e.target.value)}
                        className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        placeholder="Role (e.g. Secretary)"
                        value={member.role}
                        onChange={(e) => handleEditCouncilMemberChange(index, 'role', e.target.value)}
                        className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                      />
                      {editForm.councilMembers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEditCouncilMember(index)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block font-semibold mb-1 text-slate-800">Update TOR File (Optional)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setEditForm({ ...editForm, torFile: e.target.files[0] })}
                    className="w-full text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs"
                  />
                  {selectedDepartment.tor_doc_url && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Current TOR file exists. Uploading a new file will replace it.
                    </p>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-2xs cursor-pointer transition flex items-center gap-2"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: UPLOAD REPORT MODAL                                              */}
      {/* ========================================================================= */}
      {isUploadReportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Upload className="text-emerald-400" size={18} /> Upload Departmental Report
              </h3>
              <button onClick={() => setIsUploadReportModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-3.5 text-xs font-medium text-slate-700">
              <div>
                <label className="block font-semibold mb-1 text-slate-800">Department *</label>
                <select
                  required
                  value={uploadForm.departmentId}
                  onChange={(e) => setUploadForm({...uploadForm, departmentId: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">Select Department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-800">Report Type *</label>
                  <select
                    value={uploadForm.reportType}
                    onChange={(e) => setUploadForm({...uploadForm, reportType: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="Monthly Report">Monthly Report</option>
                    <option value="Quarterly Report">Quarterly Report</option>
                    <option value="Event Report">Event Report</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-800">Date *</label>
                  <input
                    type="date"
                    required
                    value={uploadForm.date}
                    onChange={(e) => setUploadForm({...uploadForm, date: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800">Report Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q2 Evangelism Progress Report"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800">Document Upload (PDF) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                  className="w-full text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadReportModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-2xs cursor-pointer flex items-center gap-2"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REPORT PREVIEW DRAWER (WITH DYNAMIC INLINE DOCUMENT VIEWING)     */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden h-[85vh] flex flex-col">
            
            {/* PREVIEW HEADER */}
            <div className="bg-slate-900 p-4 px-6 flex items-center justify-between text-white shrink-0">
              <div>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  {previewDoc.department_name} • {previewDoc.report_type}
                </span>
                <h3 className="font-bold text-base mt-0.5">{previewDoc.title}</h3>
                <p className="text-xs text-slate-400">Date: {previewDoc.date}</p>
              </div>

              <div className="flex items-center gap-3">
                {previewDoc.report_file_url && (
                  <a
                    href={previewDoc.report_file_url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    <Download size={14} /> Download File
                  </a>
                )}

                <button 
                  onClick={() => setPreviewDoc(null)} 
                  className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER BODY */}
            <div className="flex-1 bg-slate-100 overflow-hidden relative">
              {renderDocumentPreview(previewDoc.report_file_url || previewDoc.file)}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Departments;