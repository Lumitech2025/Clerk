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
  UserCheck,
  Phone,
  Briefcase,
  ShieldAlert
} from 'lucide-react';
import API from '../../../api/api';

const Departments = ({ userRole = 'Church Clerk' }) => {
  // --- RBAC PERMISSIONS ---
  // Roles: 'Church Clerk', 'Pastor', 'Elder', 'Communication', 'Departmental Leader', 'Member'
  const isClerk = userRole === 'Church Clerk';
  const isLeaderOrAdmin = ['Church Clerk', 'Pastor', 'Elder', 'Departmental Leader'].includes(userRole);
  const canModifyData = ['Church Clerk', 'Pastor', 'Departmental Leader'].includes(userRole);

  // Navigation Tabs: 'tors' | 'reports' | 'workers'
  const [activeTab, setActiveTab] = useState('tors');

  // API State
  const [departments, setDepartments] = useState([]);
  const [reports, setReports] = useState([]);
  const [churchWorkers, setChurchWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All Departments');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All Types');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All Roles');

  // Pagination State for Tables
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer / Modal States
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isUploadReportModalOpen, setIsUploadReportModalOpen] = useState(false);
  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // --- FETCH DATA FROM BACKEND ---
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [deptRes, reportsRes, workersRes] = await Promise.all([
        API.get('/departments/'),
        API.get('/departmental-reports/'),
        API.get('/church-workers/')
      ]);

      // Handle both DRF Paginated responses (data.results) and flat arrays (data)
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.results || []);
      setReports(Array.isArray(reportsRes.data) ? reportsRes.data : reportsRes.data?.results || []);
      setChurchWorkers(Array.isArray(workersRes.data) ? workersRes.data : workersRes.data?.results || []);
    } catch (err) {
      console.error('Error fetching church management data:', err);
      setErrorMsg('Failed to load system data from the backend servers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FORM STATES ---
  const [deptForm, setDeptForm] = useState({
    name: '',
    leader: '',
    councilMembers: [{ name: '', role: '', phone_number: '' }],
    generalMembers: [{ name: '', phone_number: '', role: 'Deacon' }],
    isDiaconate: false,
    torFile: null
  });

  const [editForm, setEditForm] = useState({
    id: null,
    name: '',
    leader: '',
    councilMembers: [],
    torFile: null
  });

  const [workerForm, setWorkerForm] = useState({
    name: '',
    phone_number: '',
    role: 'Deacon',
    department: ''
  });

  const [uploadForm, setUploadForm] = useState({
    departmentId: '',
    reportType: 'Monthly Report',
    date: '',
    title: '',
    file: null
  });

  // Start Edit Mode Handler
  const handleStartEdit = (dept) => {
    let members = [];
    if (Array.isArray(dept.council_members)) {
      members = dept.council_members.map(m => ({
        name: m.name || '',
        role: m.role || '',
        phone_number: m.phone_number || ''
      }));
    }
    if (members.length === 0) members = [{ name: '', role: '', phone_number: '' }];

    setEditForm({
      id: dept.id,
      name: dept.name,
      leader: dept.leader,
      councilMembers: members,
      torFile: null
    });
    setIsEditing(true);
  };

  // Council Member Dynamic Row Handlers (CREATE)
  const handleAddCouncilMember = () => {
    setDeptForm({
      ...deptForm,
      councilMembers: [...deptForm.councilMembers, { name: '', role: '', phone_number: '' }]
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

  // Council Member Dynamic Row Handlers (EDIT)
  const handleAddEditCouncilMember = () => {
    setEditForm({
      ...editForm,
      councilMembers: [...editForm.councilMembers, { name: '', role: '', phone_number: '' }]
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
    if (!canModifyData) return;
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

      const res = await API.post('/departments/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newDept = res.data;

      // Auto-register Diaconate team members as Church Workers if checked
      if (deptForm.isDiaconate && deptForm.generalMembers.length > 0) {
        for (const genMem of deptForm.generalMembers) {
          if (genMem.name.trim() !== '') {
            await API.post('/church-workers/', {
              full_name: genMem.name,
              phone_number: genMem.phone_number,
              designation: genMem.role || 'Deacon',
              department: newDept.id
            });
          }
        }
      }

      await fetchData();
      setIsAddDeptModalOpen(false);
      setDeptForm({
        name: '',
        leader: '',
        councilMembers: [{ name: '', role: '', phone_number: '' }],
        generalMembers: [{ name: '', phone_number: '', role: 'Deacon' }],
        isDiaconate: false,
        torFile: null
      });
    } catch (err) {
      console.error('Error saving department:', err);
      alert('Failed to save department. Please verify fields.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Update Department (PATCH)
  const handleUpdateDeptSubmit = async (e) => {
    e.preventDefault();
    if (!canModifyData) return;
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

  // Submit Add Church Worker
  const handleAddWorkerSubmit = async (e) => {
    e.preventDefault();
    if (!canModifyData) return;
    setSubmitting(true);

    try {
      // Construct payload with exact field names backend serializer expects
      const payload = {
        full_name: workerForm.name,               
        phone_number: workerForm.phone_number,
        designation: workerForm.role || 'Deacon', 
        department: workerForm.department || null
      };

      await API.post('/church-workers/', payload);
      await fetchData();
      setIsAddWorkerModalOpen(false);
      setWorkerForm({ name: '', phone_number: '', role: 'Deacon', department: '' });
    } catch (err) {
      console.error('Error adding church worker:', err);
      alert('Failed to add church worker.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Department
  const handleDeleteDepartment = async (id) => {
    if (!canModifyData) return;
    if (!window.confirm('Are you sure you want to delete this department?')) return;
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

  // Delete Church Worker
  const handleDeleteWorker = async (id) => {
    if (!canModifyData) return;
    if (!window.confirm('Are you sure you want to delete this church worker entry?')) return;
    try {
      await API.delete(`/church-workers/${id}/`);
      await fetchData();
    } catch (err) {
      console.error('Error deleting worker:', err);
      alert('Failed to delete worker.');
    }
  };

  // Upload Report Submit Handler
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

  // Filtered Datasets
  const filteredDepartments = departments.filter(d => 
    (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.leader || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWorkers = churchWorkers.filter(w => {
    const workerName = w.full_name || w.name || '';
    const workerRole = w.designation || w.role || '';

    const matchesSearch = workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (w.phone_number || '').includes(searchTerm);
    const matchesDept = selectedDeptFilter === 'All Departments' || w.department_name === selectedDeptFilter;
    const matchesRole = selectedRoleFilter === 'All Roles' || workerRole === selectedRoleFilter;
    return matchesSearch && matchesDept && matchesRole;
  });

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDepartments = filteredDepartments.slice(startIndex, startIndex + itemsPerPage);

  const renderDocumentPreview = (fileUrl) => {
    if (!fileUrl) return null;
    const lowerUrl = fileUrl.toLowerCase();
    
    if (lowerUrl.includes('.pdf')) {
      return (
        <iframe
          src={`${fileUrl}#toolbar=0`}
          title="Report Preview"
          className="w-full h-full rounded-b-xl border-none"
        />
      );
    }

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

    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-500 space-y-3">
        <FileText size={48} className="text-slate-400" />
        <p className="text-sm font-semibold">Preview not directly supported for this file type.</p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          download
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
        >
          Download File
        </a>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 antialiased">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
              Departments & Church Workers
            </h1>
            
          </div>
          
        </div>

        {/* 3 TOGGLE TABS */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto gap-1">
          <button
            onClick={() => { setActiveTab('tors'); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'tors' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <Building2 size={16} />
            <span>Departments & TORs</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('reports'); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'reports' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <FileText size={16} />
            <span>Departmental Reports</span>
          </button>

          <button
            onClick={() => { setActiveTab('workers'); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'workers' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <UserCheck size={16} />
            <span>Church Workers</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-extrabold flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DEPARTMENTS & TORS TABLE                                          */}
      {/* ========================================================================= */}
      {activeTab === 'tors' && (
        <div className="space-y-4">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            {canModifyData && (
              <button
                onClick={() => setIsAddDeptModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase text-xs tracking-wider px-5 py-3 rounded-xl transition cursor-pointer shadow-md"
              >
                <Plus size={18} />
                <span>Add Department</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
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
                        <Loader2 className="animate-spin mx-auto mb-2 text-emerald-500" size={24} />
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
                        <td className="py-4 px-6 font-extrabold text-slate-900">
                          {dept.name}
                        </td>

                        <td className="py-4 px-6 font-bold text-slate-800">
                          {dept.leader}
                        </td>

                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-lg font-extrabold border border-slate-200">
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
                              className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-extrabold text-xs uppercase tracking-wider hover:underline"
                            >
                              <Download size={15} /> Download TOR
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs italic font-semibold">No Document</span>
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
                      <td colSpan="5" className="py-8 text-center text-slate-400 text-sm font-semibold">
                        No departments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* TABLE PAGINATION BAR */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-600">
              <div>
                Showing <span className="font-extrabold text-slate-900">{filteredDepartments.length === 0 ? 0 : startIndex + 1}</span> to{' '}
                <span className="font-extrabold text-slate-900">{Math.min(startIndex + itemsPerPage, filteredDepartments.length)}</span> of{' '}
                <span className="font-extrabold text-slate-900">{filteredDepartments.length}</span> departments
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition cursor-pointer text-slate-700"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-extrabold text-slate-800">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition cursor-pointer text-slate-700"
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
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="All Departments">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>

              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
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
                  className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {canModifyData && (
              <button
                onClick={() => setIsUploadReportModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md"
              >
                <Upload size={15} />
                <span>Upload Report</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {reports
              .filter(r => selectedDeptFilter === 'All Departments' || r.department_name === selectedDeptFilter)
              .filter(r => selectedTypeFilter === 'All Types' || r.report_type === selectedTypeFilter)
              .filter(r => (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()))
              .map((report) => (
                <div 
                  key={report.id}
                  className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        report.report_type === 'Monthly Report' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        report.report_type === 'Quarterly Report' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {report.report_type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{report.date}</span>
                    </div>

                    <div 
                      onClick={() => setPreviewDoc(report)}
                      className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-2 my-2 cursor-pointer relative overflow-hidden group-hover:border-emerald-300 transition flex flex-col justify-between"
                    >
                      <div className="space-y-1 opacity-50">
                        <div className="h-1 bg-slate-400 rounded w-3/4"></div>
                        <div className="h-1 bg-slate-300 rounded w-full"></div>
                        <div className="h-1 bg-slate-300 rounded w-5/6"></div>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-extrabold uppercase">
                        <span>Preview</span>
                        <Eye size={11} className="text-slate-500 group-hover:text-emerald-600" />
                      </div>
                    </div>

                    <p className="text-[10px] font-black text-emerald-600 uppercase truncate">{report.department_name}</p>
                    <h4 className="font-extrabold text-slate-800 text-xs line-clamp-2 leading-tight mt-0.5" title={report.title}>
                      {report.title}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-2.5 mt-2 border-t border-slate-100">
                    <button
                      onClick={() => setPreviewDoc(report)}
                      className="flex items-center justify-center gap-1 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase transition cursor-pointer"
                    >
                      <Eye size={12} /> View
                    </button>

                    <a
                      href={report.report_file_url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="flex items-center justify-center gap-1 p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black uppercase transition cursor-pointer"
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
      {/* TAB 3: CHURCH WORKERS TAB                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'workers' && (
        <div className="space-y-4">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="All Roles">All Church Worker Roles</option>
                <option value="Pastor">Pastor</option>
                <option value="Elder">Elder</option>
                <option value="Department Leader">Department Leader</option>
                <option value="Assistant Department Leader">Assistant Department Leader</option>
                <option value="Head Deacon">Head Deacon</option>
                <option value="Head Deaconess">Head Deaconess</option>
                <option value="Deacon">Deacon</option>
                <option value="Deaconess">Deaconess</option>
              </select>

              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="All Departments">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            {canModifyData && (
              <button
                onClick={() => setIsAddWorkerModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md"
              >
                <Plus size={18} />
                <span>Add Church Worker</span>
              </button>
            )}
          </div>

          {/* WORKERS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Worker Name</th>
                    <th className="py-3.5 px-6">Role / Position</th>
                    <th className="py-3.5 px-6">Department</th>
                    <th className="py-3.5 px-6">Phone Number</th>
                    {canModifyData && <th className="py-3.5 px-6 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={canModifyData ? "5" : "4"} className="py-12 text-center text-slate-400 font-bold">
                        <Loader2 className="animate-spin mx-auto mb-2 text-emerald-500" size={24} />
                        Loading church workers...
                      </td>
                    </tr>
                  ) : filteredWorkers.length > 0 ? (
                    filteredWorkers.map((worker) => {
                      // Fallback handling for DRF backend key names
                      const name = worker.full_name || worker.name || 'Church Worker';
                      const role = worker.designation || worker.role || 'Member';

                      return (
                        <tr key={worker.id} className="hover:bg-slate-50/80 transition">
                          
                          {/* WORKER NAME */}
                          <td className="py-4 px-6 font-extrabold text-slate-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-xs uppercase">
                              {name.charAt(0)}
                            </div>
                            <span>{name}</span>
                          </td>

                          {/* ROLE / POSITION */}
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                              role.includes('Pastor') ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                              role.includes('Elder') ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                              role.includes('Deacon') ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                              'bg-emerald-100 text-emerald-950 border border-emerald-200'
                            }`}>
                              <Briefcase size={12} /> {role}
                            </span>
                          </td>

                          {/* DEPARTMENT */}
                          <td className="py-4 px-6 font-bold text-slate-600">
                            {worker.department_name || <span className="text-slate-400 italic">General Ministry</span>}
                          </td>

                          {/* PHONE NUMBER */}
                          <td className="py-4 px-6 font-bold text-slate-800">
                            {worker.phone_number ? (
                              <span className="flex items-center gap-1.5 text-slate-800">
                                <Phone size={14} className="text-emerald-600" /> {worker.phone_number}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">N/A</span>
                            )}
                          </td>

                          {/* ACTIONS */}
                          {canModifyData && (
                            <td className="py-4 px-6 text-right">
                              <button 
                                onClick={() => handleDeleteWorker(worker.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                                title="Delete worker"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={canModifyData ? "5" : "4"} className="py-8 text-center text-slate-400 text-sm font-semibold">
                        No church workers recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD DEPARTMENT                                                    */}
      {/* ========================================================================= */}
      {isAddDeptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-950 p-4 px-6 flex items-center justify-between text-white">
              <h3 className="font-extrabold text-base uppercase tracking-wider flex items-center gap-2">
                <Building2 className="text-emerald-400" size={20} /> Add Department & Council
              </h3>
              <button onClick={() => setIsAddDeptModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <form onSubmit={handleAddDeptSubmit} className="p-6 space-y-4 text-sm font-semibold text-slate-700 overflow-y-auto">
              <div>
                <label className="block font-black text-slate-900 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deaconry Board"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({...deptForm, name: e.target.value, isDiaconate: e.target.value.toLowerCase().includes('deacon')})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-black text-slate-900 mb-1">Department Leader / Head *</label>
                <input
                  type="text"
                  required
                  placeholder="Full Leader Name"
                  value={deptForm.leader}
                  onChange={(e) => setDeptForm({...deptForm, leader: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* COUNCIL MEMBERS SECTION */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-slate-900 uppercase text-xs tracking-wider">
                    Council Members (Executive Roles)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCouncilMember}
                    className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-xs font-black uppercase cursor-pointer"
                  >
                    <Plus size={14} /> Add Council Row
                  </button>
                </div>

                {deptForm.councilMembers.map((member, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      placeholder="Name"
                      value={member.name}
                      onChange={(e) => handleCouncilMemberChange(index, 'name', e.target.value)}
                      className="col-span-4 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. Secretary)"
                      value={member.role}
                      onChange={(e) => handleCouncilMemberChange(index, 'role', e.target.value)}
                      className="col-span-4 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={member.phone_number}
                      onChange={(e) => handleCouncilMemberChange(index, 'phone_number', e.target.value)}
                      className="col-span-3 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                    {deptForm.councilMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCouncilMember(index)}
                        className="col-span-1 text-slate-400 hover:text-rose-600 p-1 flex justify-center cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* DIACONATE GENERAL MEMBERS REGISTRATION OPTION */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDiaconate"
                    checked={deptForm.isDiaconate}
                    onChange={(e) => setDeptForm({ ...deptForm, isDiaconate: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="isDiaconate" className="text-xs font-black text-slate-900 uppercase cursor-pointer">
                    Team Members
                  </label>
                </div>

                {deptForm.isDiaconate && (
                  <div className="space-y-2 pt-2">
                    
                    {deptForm.generalMembers.map((gMem, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Member Name"
                          value={gMem.name}
                          onChange={(e) => {
                            const updated = [...deptForm.generalMembers];
                            updated[idx].name = e.target.value;
                            setDeptForm({ ...deptForm, generalMembers: updated });
                          }}
                          className="px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Phone Number"
                          value={gMem.phone_number}
                          onChange={(e) => {
                            const updated = [...deptForm.generalMembers];
                            updated[idx].phone_number = e.target.value;
                            setDeptForm({ ...deptForm, generalMembers: updated });
                          }}
                          className="px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-bold"
                        />
                        <select
                          value={gMem.role}
                          onChange={(e) => {
                            const updated = [...deptForm.generalMembers];
                            updated[idx].role = e.target.value;
                            setDeptForm({ ...deptForm, generalMembers: updated });
                          }}
                          className="px-2 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-bold"
                        >
                          <option value="Deacon">Deacon</option>
                          <option value="Deaconess">Deaconess</option>
                        </select>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setDeptForm({
                        ...deptForm,
                        generalMembers: [...deptForm.generalMembers, { name: '', phone_number: '', role: 'Deacon' }]
                      })}
                      className="text-emerald-700 hover:underline text-xs font-black cursor-pointer"
                    >
                      + Add Team Member
                    </button>
                  </div>
                )}
              </div>

              {/* TOR FILE */}
              <div className="pt-2">
                <label className="block font-black text-slate-900 mb-1">TOR Document Upload (PDF / Doc)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 transition text-center cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setDeptForm({...deptForm, torFile: e.target.files[0]})}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <Upload size={22} className="text-slate-400" />
                    <p className="text-xs font-bold text-slate-700">
                      {deptForm.torFile ? deptForm.torFile.name : 'Click to upload TOR document'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDeptModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition flex items-center gap-2"
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
      {/* MODAL: ADD NEW CHURCH WORKER                                             */}
      {/* ========================================================================= */}
      {isAddWorkerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-950 p-4 px-6 flex items-center justify-between text-white">
              <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="text-emerald-400" size={18} /> Register Church Worker
              </h3>
              <button onClick={() => setIsAddWorkerModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleAddWorkerSubmit} className="p-5 space-y-3.5 text-xs font-extrabold text-slate-700">
              <div>
                <label className="block font-black text-slate-900 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Worker's Full Name"
                  value={workerForm.name}
                  onChange={(e) => setWorkerForm({...workerForm, name: e.target.value})}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-black text-slate-900 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+254 7XX XXX XXX"
                  value={workerForm.phone_number}
                  onChange={(e) => setWorkerForm({...workerForm, phone_number: e.target.value})}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-black text-slate-900 mb-1">Role / Position *</label>
                <select
                  required
                  value={workerForm.role}
                  onChange={(e) => setWorkerForm({...workerForm, role: e.target.value})}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-extrabold"
                >
                  <option value="Pastor">Pastor</option>
                  <option value="Elder">Elder</option>
                  <option value="Department Leader">Department Leader</option>
                  <option value="Assistant Department Leader">Assistant Department Leader</option>
                  <option value="Head Deacon">Head Deacon</option>
                  <option value="Head Deaconess">Head Deaconess</option>
                  <option value="Deacon">Deacon</option>
                  <option value="Deaconess">Deaconess</option>
                  <option value="Other Church Worker">Other Church Worker</option>
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-900 mb-1">Assigned Department (Optional)</label>
                <select
                  value={workerForm.department}
                  onChange={(e) => setWorkerForm({...workerForm, department: e.target.value})}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold"
                >
                  <option value="">General Ministry / None</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddWorkerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Add Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DEPARTMENT DETAILS DRAWER                                         */}
      {/* ========================================================================= */}
      {selectedDepartment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="bg-slate-950 p-5 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                  {isEditing ? 'Edit Department' : 'Department Details'}
                </p>
                <h3 className="font-extrabold text-lg mt-0.5">{selectedDepartment.name}</h3>
              </div>
              <button onClick={() => { setSelectedDepartment(null); setIsEditing(false); }} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            {!isEditing ? (
              <div className="p-6 space-y-5 text-sm font-semibold text-slate-700 overflow-y-auto">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs uppercase font-black text-slate-400">Department Leader</p>
                  <p className="font-extrabold text-slate-900 text-base mt-1">{selectedDepartment.leader}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase font-black text-slate-400">Council Members & Phone Numbers</p>
                    <span className="text-xs text-slate-500 font-extrabold">
                      {Array.isArray(selectedDepartment.council_members) ? selectedDepartment.council_members.length : 0} Total
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {Array.isArray(selectedDepartment.council_members) && selectedDepartment.council_members.length > 0 ? (
                      selectedDepartment.council_members.map((m, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
                          <div>
                            <span className="font-extrabold text-slate-900 block">{m.name}</span>
                            <span className="text-[11px] text-slate-500 font-bold">{m.role || 'Member'}</span>
                          </div>
                          {m.phone_number ? (
                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                              <Phone size={12} /> {m.phone_number}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">No phone</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic text-xs">No council members listed.</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-700 font-extrabold">Official TOR File:</span>
                  {selectedDepartment.tor_doc_url ? (
                    <a
                      href={selectedDepartment.tor_doc_url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl border border-emerald-200 font-black transition text-xs uppercase"
                    >
                      <Download size={15} /> Download TOR
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs italic">None uploaded</span>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 -mx-6 -mb-6 mt-4 flex items-center justify-between">
                  {canModifyData ? (
                    <button
                      onClick={() => handleDeleteDepartment(selectedDepartment.id)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-black flex items-center gap-1.5 cursor-pointer uppercase"
                    >
                      <Trash2 size={16} /> Delete Dept
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDepartment(null)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase rounded-xl transition cursor-pointer"
                    >
                      Close
                    </button>

                    {canModifyData && (
                      <button
                        onClick={() => handleStartEdit(selectedDepartment)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black uppercase rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit size={14} /> Edit Department
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateDeptSubmit} className="p-6 space-y-4 text-sm font-semibold text-slate-700 overflow-y-auto">
                <div>
                  <label className="block font-black text-slate-900 mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-900 mb-1">Department Leader *</label>
                  <input
                    type="text"
                    required
                    value={editForm.leader}
                    onChange={(e) => setEditForm({ ...editForm, leader: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-black text-slate-900 text-xs uppercase">Council Members</label>
                    <button
                      type="button"
                      onClick={handleAddEditCouncilMember}
                      className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-xs font-black cursor-pointer"
                    >
                      <Plus size={14} /> Add Member
                    </button>
                  </div>

                  {editForm.councilMembers.map((member, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        placeholder="Name"
                        value={member.name}
                        onChange={(e) => handleEditCouncilMemberChange(index, 'name', e.target.value)}
                        className="col-span-4 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Role"
                        value={member.role}
                        onChange={(e) => handleEditCouncilMemberChange(index, 'role', e.target.value)}
                        className="col-span-4 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Phone"
                        value={member.phone_number}
                        onChange={(e) => handleEditCouncilMemberChange(index, 'phone_number', e.target.value)}
                        className="col-span-3 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      />
                      {editForm.councilMembers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEditCouncilMember(index)}
                          className="col-span-1 text-slate-400 hover:text-rose-600 p-1 cursor-pointer flex justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block font-black text-slate-900 mb-1">Update TOR File (Optional)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setEditForm({ ...editForm, torFile: e.target.files[0] })}
                    className="w-full text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black uppercase rounded-xl shadow-md cursor-pointer transition flex items-center gap-2"
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
      {/* MODAL: UPLOAD REPORT MODAL                                               */}
      {/* ========================================================================= */}
      {isUploadReportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-slate-950 p-4 px-6 flex items-center justify-between text-white">
              <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                <Upload className="text-emerald-400" size={18} /> Upload Departmental Report
              </h3>
              <button onClick={() => setIsUploadReportModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-3.5 text-xs font-bold text-slate-700">
              <div>
                <label className="block font-black text-slate-900 mb-1">Department *</label>
                <select
                  required
                  value={uploadForm.departmentId}
                  onChange={(e) => setUploadForm({...uploadForm, departmentId: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="">Select Department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-900 mb-1">Report Type *</label>
                  <select
                    value={uploadForm.reportType}
                    onChange={(e) => setUploadForm({...uploadForm, reportType: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="Monthly Report">Monthly Report</option>
                    <option value="Quarterly Report">Quarterly Report</option>
                    <option value="Event Report">Event Report</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-900 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={uploadForm.date}
                    onChange={(e) => setUploadForm({...uploadForm, date: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-900 mb-1">Report Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q2 Evangelism Progress Report"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-black text-slate-900 mb-1">Document Upload (PDF) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                  className="w-full text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase rounded-xl shadow-md cursor-pointer flex items-center gap-2"
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
      {/* MODAL: REPORT PREVIEW DRAWER                                              */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden h-[85vh] flex flex-col">
            <div className="bg-slate-950 p-4 px-6 flex items-center justify-between text-white shrink-0">
              <div>
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">
                  {previewDoc.department_name} • {previewDoc.report_type}
                </span>
                <h3 className="font-extrabold text-base mt-0.5">{previewDoc.title}</h3>
                <p className="text-xs text-slate-400 font-bold">Date: {previewDoc.date}</p>
              </div>

              <div className="flex items-center gap-3">
                {previewDoc.report_file_url && (
                  <a
                    href={previewDoc.report_file_url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black uppercase transition"
                  >
                    <Download size={14} /> Download
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