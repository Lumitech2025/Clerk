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
  ShieldAlert,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import API from '../../../api/api';

const DepartmentPortal = ({ userRole = 'Departmental Leader' }) => {
  // --- PERMISSIONS ---
  const canManageDeptMembers = true;

  // Navigation Tabs: 'departments' | 'tors' | 'workers'
  const [activeTab, setActiveTab] = useState('departments');

  // API State
  const [departments, setDepartments] = useState([]);
  const [churchWorkers, setChurchWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All Departments');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All Roles');

  // Pagination State for Tables
  const [currentPage, setCurrentPage] = useState(1);
  const [workerCurrentPage, setWorkerCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer / Modal States
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // --- FETCH DATA FROM BACKEND ---
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [deptRes, workersRes] = await Promise.all([
        API.get('/departments/'),
        API.get('/church-workers/')
      ]);

      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.results || []);
      setChurchWorkers(Array.isArray(workersRes.data) ? workersRes.data : workersRes.data?.results || []);
    } catch (err) {
      console.error('Error fetching department portal data:', err);
      setErrorMsg('Failed to load system data from the backend servers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- EDIT DEPARTMENT / MEMBERS FORM STATE ---
  const [editForm, setEditForm] = useState({
    id: null,
    name: '',
    leader: '',
    councilMembers: [],
    torFile: null
  });

  // Start Edit Mode Handler for Department Members
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

  // Council / Department Member Dynamic Row Handlers (EDIT)
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

  // Submit Update Department / Members (PATCH)
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
      console.error('Error updating department members:', err);
      alert('Failed to update department details.');
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

  // Pagination Calculations
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDepartments = filteredDepartments.slice(startIndex, startIndex + itemsPerPage);

  const workerTotalPages = Math.ceil(filteredWorkers.length / itemsPerPage) || 1;
  const workerStartIndex = (workerCurrentPage - 1) * itemsPerPage;
  const paginatedWorkers = filteredWorkers.slice(workerStartIndex, workerStartIndex + itemsPerPage);

  // --- EXPORT & PRINT HANDLERS FOR CHURCH WORKERS ---
  const exportWorkersToExcel = () => {
    if (filteredWorkers.length === 0) {
      alert('No church worker data available to export.');
      return;
    }

    const headers = ['Full Name', 'Role / Position', 'Department', 'Phone Number'];
    const rows = filteredWorkers.map(w => [
      `"${w.full_name || w.name || ''}"`,
      `"${w.designation || w.role || ''}"`,
      `"${w.department_name || 'General Ministry'}"`,
      `"${w.phone_number || 'N/A'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Church_Workers_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintWorkers = () => {
    if (filteredWorkers.length === 0) {
      alert('No church worker records available to print.');
      return;
    }

    const printWindow = window.open('', '_blank');
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Church Workers Directory</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; padding: 30px; color: #0f172a; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 12px; }
            .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 0.5px; }
            .header p { margin: 4px 0 0; font-size: 12px; color: #64748b; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { background-color: #f8fafc; color: #475569; text-transform: uppercase; font-size: 10px; padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; background: #dcfce7; color: #14532d; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>New Life Church - Directory</h1>
            <p>Generated on ${dateStr} • Department Portal</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Role / Position</th>
                <th>Department</th>
                <th>Phone Number</th>
              </tr>
            </thead>
            <tbody>
              ${filteredWorkers.map((w, index) => {
                const name = w.full_name || w.name || 'N/A';
                const role = w.designation || w.role || 'Member';
                const dept = w.department_name || 'General Ministry';
                const phone = w.phone_number || 'N/A';
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td><strong>${name}</strong></td>
                    <td><span class="badge">${role}</span></td>
                    <td>${dept}</td>
                    <td>${phone}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Official Record — Departmental Portal</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const renderDocumentPreview = (fileUrl) => {
    if (!fileUrl) return null;
    const lowerUrl = fileUrl.toLowerCase();
    
    if (lowerUrl.includes('.pdf')) {
      return (
        <iframe
          src={`${fileUrl}#toolbar=0`}
          title="TOR Document Preview"
          className="w-full h-full rounded-b-xl border-none"
        />
      );
    }

    if (lowerUrl.includes('.doc') || lowerUrl.includes('.docx')) {
      const googleEmbedUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      return (
        <iframe
          src={googleEmbedUrl}
          title="TOR Document Preview"
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
              Department Portal
            </h1>
          </div>
        </div>

        {/* 3 TOGGLE TABS */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto gap-1">
          <button
            onClick={() => { setActiveTab('departments'); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'departments' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <Building2 size={16} />
            <span>Departments</span>
          </button>
          
          {/* TAB 2: TORs (Replaced Departmental Reports) */}
          <button
            onClick={() => { setActiveTab('tors'); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'tors' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <FileText size={16} />
            <span>TORs (Terms of Reference)</span>
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
      {/* TAB 1: DEPARTMENTS TABLE                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'departments' && (
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
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-900 uppercase tracking-wider">
                    <th className="py-3.5 px-6 font-black text-slate-900">Department Name</th>
                    <th className="py-3.5 px-6 font-black text-slate-900">Leader</th>
                    <th className="py-3.5 px-6 font-black text-slate-900">Council / Members</th>
                    <th className="py-3.5 px-6 font-black text-slate-900">TOR Document</th>
                    <th className="py-3.5 px-6 font-black text-slate-900 text-right">Details</th>
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
                          {dept.tor_doc_url || dept.tor_doc ? (
                            <a
                              href={dept.tor_doc_url || dept.tor_doc}
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
      {/* TAB 2: TORs (TERMS OF REFERENCE VAULT GRID)                              */}
      {/* ========================================================================= */}
      {activeTab === 'tors' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="All Departments">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>

              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search department or TOR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* TOR CARDS GRID VIEW */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {departments
              .filter(d => selectedDeptFilter === 'All Departments' || d.name === selectedDeptFilter)
              .filter(d => (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
              .map((dept) => {
                const torUrl = dept.tor_doc_url || dept.tor_doc;

                return (
                  <div 
                    key={dept.id}
                    className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div>
                      {/* Badge Header */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                          TOR Document
                        </span>
                      </div>

                      {/* Document Preview Placeholder */}
                      <div 
                        onClick={() => {
                          if (torUrl) {
                            setPreviewDoc({
                              title: `Terms of Reference - ${dept.name}`,
                              department_name: dept.name,
                              report_file_url: torUrl
                            });
                          }
                        }}
                        className={`w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-2 my-2 relative overflow-hidden transition flex flex-col justify-between ${
                          torUrl ? 'cursor-pointer group-hover:border-emerald-300' : 'opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="space-y-1 opacity-50">
                          <div className="h-1 bg-slate-400 rounded w-3/4"></div>
                          <div className="h-1 bg-slate-300 rounded w-full"></div>
                          <div className="h-1 bg-slate-300 rounded w-5/6"></div>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-extrabold uppercase">
                          <span>{torUrl ? 'Preview' : 'No File'}</span>
                          <Eye size={11} className="text-slate-500 group-hover:text-emerald-600" />
                        </div>
                      </div>

                      {/* DEPARTMENT NAME PROMINENTLY DISPLAYED */}
                      <p className="text-[11px] font-black text-emerald-700 uppercase truncate" title={dept.name}>
                        {dept.name}
                      </p>

                      <h4 className="font-extrabold text-slate-900 text-xs line-clamp-2 leading-tight mt-0.5">
                        Terms of Reference ({dept.name})
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-1">
                        Leader: {dept.leader || 'Not Assigned'}
                      </p>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="grid grid-cols-2 gap-1 pt-2.5 mt-2 border-t border-slate-100">
                      <button
                        disabled={!torUrl}
                        onClick={() => setPreviewDoc({
                          title: `Terms of Reference - ${dept.name}`,
                          department_name: dept.name,
                          report_file_url: torUrl
                        })}
                        className="flex items-center justify-center gap-1 p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-[10px] font-black uppercase transition cursor-pointer"
                      >
                        <Eye size={12} /> View
                      </button>

                      {torUrl ? (
                        <a
                          href={torUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="flex items-center justify-center gap-1 p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black uppercase transition cursor-pointer"
                        >
                          <Download size={12} /> Get
                        </a>
                      ) : (
                        <span className="flex items-center justify-center p-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 rounded-lg">
                          N/A
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CHURCH WORKERS TAB                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'workers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name or phone..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setWorkerCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={selectedRoleFilter}
                onChange={(e) => {
                  setSelectedRoleFilter(e.target.value);
                  setWorkerCurrentPage(1);
                }}
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
                onChange={(e) => {
                  setSelectedDeptFilter(e.target.value);
                  setWorkerCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="All Departments">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* ACTION & EXPORT BUTTONS */}
            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              <button
                onClick={exportWorkersToExcel}
                title="Export list to Excel / CSV"
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 transition cursor-pointer"
              >
                <FileSpreadsheet size={16} className="text-emerald-600" />
                <span className="hidden sm:inline">Excel</span>
              </button>

              <button
                onClick={handlePrintWorkers}
                title="Print or Save PDF"
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 transition cursor-pointer"
              >
                <Printer size={16} className="text-slate-600" />
                <span className="hidden sm:inline">Print / PDF</span>
              </button>
            </div>
          </div>

          {/* WORKERS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-900 uppercase tracking-wider">
                    <th className="py-3.5 px-6 font-black text-slate-900">Worker Name</th>
                    <th className="py-3.5 px-6 font-black text-slate-900">Role / Position</th>
                    <th className="py-3.5 px-6 font-black text-slate-900">Department</th>
                    <th className="py-3.5 px-6 font-black text-slate-900">Phone Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400 font-bold">
                        <Loader2 className="animate-spin mx-auto mb-2 text-emerald-500" size={24} />
                        Loading church workers...
                      </td>
                    </tr>
                  ) : paginatedWorkers.length > 0 ? (
                    paginatedWorkers.map((worker) => {
                      const name = worker.full_name || worker.name || 'Church Worker';
                      const role = worker.designation || worker.role || 'Member';

                      return (
                        <tr key={worker.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-4 px-6 font-extrabold text-slate-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-xs uppercase">
                              {name.charAt(0)}
                            </div>
                            <span>{name}</span>
                          </td>

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

                          <td className="py-4 px-6 font-bold text-slate-600">
                            {worker.department_name || <span className="text-slate-400 italic">General Ministry</span>}
                          </td>

                          <td className="py-4 px-6 font-bold text-slate-800">
                            {worker.phone_number ? (
                              <span className="flex items-center gap-1.5 text-slate-800">
                                <Phone size={14} className="text-emerald-600" /> {worker.phone_number}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400 text-sm font-semibold">
                        No church workers recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* WORKERS PAGINATION BAR */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-600">
              <div>
                Showing <span className="font-extrabold text-slate-900">{filteredWorkers.length === 0 ? 0 : workerStartIndex + 1}</span> to{' '}
                <span className="font-extrabold text-slate-900">{Math.min(workerStartIndex + itemsPerPage, filteredWorkers.length)}</span> of{' '}
                <span className="font-extrabold text-slate-900">{filteredWorkers.length}</span> church workers
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={workerCurrentPage === 1}
                  onClick={() => setWorkerCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition cursor-pointer text-slate-700"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-extrabold text-slate-800">
                  Page {workerCurrentPage} of {workerTotalPages}
                </span>

                <button
                  disabled={workerCurrentPage === workerTotalPages}
                  onClick={() => setWorkerCurrentPage(prev => Math.min(prev + 1, workerTotalPages))}
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
      {/* MODAL: DEPARTMENT DETAILS / EDIT MEMBERS                                  */}
      {/* ========================================================================= */}
      {selectedDepartment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-950 p-5 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                  {isEditing ? 'Manage Department Members' : 'Department Details'}
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
                    <p className="text-xs uppercase font-black text-slate-400">Department Members</p>
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
                      <p className="text-slate-400 italic text-xs">No department members listed.</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-700 font-extrabold">Official TOR File:</span>
                  {selectedDepartment.tor_doc_url || selectedDepartment.tor_doc ? (
                    <a
                      href={selectedDepartment.tor_doc_url || selectedDepartment.tor_doc}
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

                <div className="p-4 bg-slate-50 border-t border-slate-200 -mx-6 -mb-6 mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedDepartment(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase rounded-xl transition cursor-pointer"
                  >
                    Close
                  </button>

                  {canManageDeptMembers && (
                    <button
                      onClick={() => handleStartEdit(selectedDepartment)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black uppercase rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit size={14} /> Manage / Add Members
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateDeptSubmit} className="p-6 space-y-4 text-sm font-semibold text-slate-700 overflow-y-auto">
                <div>
                  <label className="block font-black text-slate-900 mb-1">Department Name</label>
                  <input
                    type="text"
                    required
                    disabled
                    value={editForm.name}
                    className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-sm cursor-not-allowed"
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
                    <label className="block font-black text-slate-900 text-xs uppercase">Department Members List</label>
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
                    Save Details
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DOCUMENT PREVIEW DRAWER                                            */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden h-[85vh] flex flex-col">
            <div className="bg-slate-950 p-4 px-6 flex items-center justify-between text-white shrink-0">
              <div>
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">
                  {previewDoc.department_name}
                </span>
                <h3 className="font-extrabold text-base mt-0.5">{previewDoc.title}</h3>
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
              {renderDocumentPreview(previewDoc.report_file_url)}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DepartmentPortal;