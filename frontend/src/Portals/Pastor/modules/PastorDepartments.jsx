import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  FileText, 
  Users,
  Download, 
  Search, 
  X, 
  Eye, 
  ChevronRight,
  ChevronLeft,
  Loader2,
  Mail,
  Phone,
  UserCheck
} from 'lucide-react';
import API from '../../../api/api';

// --- HELPER TO SAFELY EXTRACT WORKER DETAILS FROM VARIOUS BACKEND SCHEMAS ---
const getWorkerDetails = (worker) => {
  if (!worker) {
    return { name: 'Unknown Worker', role: 'Worker', department: 'General', phone: '', email: '', status: 'Active' };
  }

  // 1. Name Resolution (Flat or Nested in user/member)
  const name =
    worker.name ||
    worker.full_name ||
    (worker.first_name ? `${worker.first_name} ${worker.last_name || ''}`.trim() : null) ||
    worker.user?.full_name ||
    (worker.user?.first_name ? `${worker.user.first_name} ${worker.user.last_name || ''}`.trim() : null) ||
    worker.member?.full_name ||
    worker.member?.name ||
    worker.username ||
    'Unnamed Worker';

  // 2. Role Resolution
  const role =
    worker.role ||
    worker.position ||
    worker.title ||
    worker.designation ||
    'Worker';

  // 3. Department Resolution
  const department = typeof worker.department === 'string'
    ? worker.department
    : (worker.department_name || worker.department?.name || 'General');

  // 4. Contact Info Resolution
  const phone =
    worker.phone ||
    worker.phone_number ||
    worker.mobile ||
    worker.user?.phone ||
    worker.member?.phone ||
    '';

  const email =
    worker.email ||
    worker.user?.email ||
    worker.member?.email ||
    '';

  const status = worker.status || 'Active';

  return { name, role, department, phone, email, status };
};

const PastorDepartments = () => {
  // Navigation Tabs: 'tors' | 'workers' | 'reports'
  const [activeTab, setActiveTab] = useState('tors');

  // API State
  const [departments, setDepartments] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All Departments');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All Types');

  // Pagination State for Tables
  const [deptPage, setDeptPage] = useState(1);
  const [workerPage, setWorkerPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer / Modal States
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  // --- FETCH DATA FROM BACKEND ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, reportsRes, workersRes] = await Promise.all([
        API.get('/departments/'),
        API.get('/departmental-reports/'),
        API.get('/church-workers/').catch(() => ({ data: [] }))
      ]);

      const deptData = deptRes.data?.results || (Array.isArray(deptRes.data) ? deptRes.data : []);
      const reportData = reportsRes.data?.results || (Array.isArray(reportsRes.data) ? reportsRes.data : []);
      let workerData = workersRes.data?.results || (Array.isArray(workersRes.data) ? workersRes.data : []);

      // Fallback: Aggregate members from departments if dedicated endpoint returns no data
      if (!Array.isArray(workerData) || workerData.length === 0) {
        const aggregatedWorkers = [];
        deptData.forEach((dept) => {
          const members = dept.council_members || dept.members || dept.councilMembers || [];
          if (Array.isArray(members)) {
            members.forEach((m, idx) => {
              aggregatedWorkers.push({
                id: `${dept.id}-${idx}`,
                ...m,
                department_name: dept.name
              });
            });
          }
        });
        workerData = aggregatedWorkers;
      }

      setDepartments(deptData);
      setReports(reportData);
      setWorkers(workerData);
    } catch (err) {
      console.error('Error fetching pastoral department data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FILTERING LOGIC ---
  const filteredDepartments = departments.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.leader && d.leader.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const totalDeptPages = Math.ceil(filteredDepartments.length / itemsPerPage) || 1;
  const startDeptIndex = (deptPage - 1) * itemsPerPage;
  const paginatedDepartments = filteredDepartments.slice(startDeptIndex, startDeptIndex + itemsPerPage);

  // Church Workers Filter (Safe extraction)
  const filteredWorkers = workers.filter(w => {
    const details = getWorkerDetails(w);
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      details.name.toLowerCase().includes(search) ||
      details.role.toLowerCase().includes(search);

    const matchesDept =
      selectedDeptFilter === 'All Departments' ||
      details.department === selectedDeptFilter;

    return matchesSearch && matchesDept;
  });

  const totalWorkerPages = Math.ceil(filteredWorkers.length / itemsPerPage) || 1;
  const startWorkerIndex = (workerPage - 1) * itemsPerPage;
  const paginatedWorkers = filteredWorkers.slice(startWorkerIndex, startWorkerIndex + itemsPerPage);

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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Departmental Overview</h1>
         
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => { setActiveTab('tors'); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'tors' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 size={16} />
            <span>Departments & TORs</span>
          </button>

          <button
            onClick={() => { setActiveTab('workers'); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'workers' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={16} />
            <span>Church Workers</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('reports'); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'reports' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={16} />
            <span>Departmental Reports</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DEPARTMENTS & TORS TABLE */}
      {activeTab === 'tors' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search department or leader..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setDeptPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>

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
                        onClick={() => setSelectedDepartment(dept)}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                      >
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          {dept.name}
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-800">
                          {dept.leader || 'Not Assigned'}
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
                          <button className="text-slate-400 hover:text-slate-700 p-1 transition cursor-pointer">
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

            <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-600">
              <div>
                Showing <span className="font-semibold text-slate-800">{filteredDepartments.length === 0 ? 0 : startDeptIndex + 1}</span> to{' '}
                <span className="font-semibold text-slate-800">{Math.min(startDeptIndex + itemsPerPage, filteredDepartments.length)}</span> of{' '}
                <span className="font-semibold text-slate-800">{filteredDepartments.length}</span> departments
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={deptPage === 1}
                  onClick={() => setDeptPage(prev => Math.max(prev - 1, 1))}
                  className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer text-slate-700"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800">
                  Page {deptPage} of {totalDeptPages}
                </span>

                <button
                  disabled={deptPage === totalDeptPages}
                  onClick={() => setDeptPage(prev => Math.min(prev + 1, totalDeptPages))}
                  className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer text-slate-700"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHURCH WORKERS */}
      {activeTab === 'workers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search worker or role..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setWorkerPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <select
                value={selectedDeptFilter}
                onChange={(e) => {
                  setSelectedDeptFilter(e.target.value);
                  setWorkerPage(1);
                }}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
              >
                <option value="All Departments">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Worker Name</th>
                    <th className="py-3.5 px-6">Role / Position</th>
                    <th className="py-3.5 px-6">Department</th>
                    <th className="py-3.5 px-6">Contact Info</th>
                    <th className="py-3.5 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400">
                        <Loader2 className="animate-spin mx-auto mb-2 text-emerald-600" size={24} />
                        Loading workers...
                      </td>
                    </tr>
                  ) : paginatedWorkers.length > 0 ? (
                    paginatedWorkers.map((worker, index) => {
                      const { name, role, department, phone, email, status } = getWorkerDetails(worker);
                      return (
                        <tr key={worker.id || index} className="hover:bg-slate-50/80 transition">
                          <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {name ? name.charAt(0).toUpperCase() : 'W'}
                            </div>
                            <span>{name}</span>
                          </td>

                          <td className="py-4 px-6 font-medium text-slate-800">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium">
                              <UserCheck size={13} className="text-slate-500" />
                              {role}
                            </span>
                          </td>

                          <td className="py-4 px-6 font-medium text-slate-700">
                            {department}
                          </td>

                          <td className="py-4 px-6 text-xs text-slate-600">
                            <div className="flex flex-col space-y-1">
                              {phone && (
                                <span className="flex items-center gap-1.5 text-slate-600">
                                  <Phone size={12} className="text-slate-400" /> {phone}
                                </span>
                              )}
                              {email && (
                                <span className="flex items-center gap-1.5 text-slate-600">
                                  <Mail size={12} className="text-slate-400" /> {email}
                                </span>
                              )}
                              {!phone && !email && (
                                <span className="text-slate-400 italic">No contact provided</span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                        No church workers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-600">
              <div>
                Showing <span className="font-semibold text-slate-800">{filteredWorkers.length === 0 ? 0 : startWorkerIndex + 1}</span> to{' '}
                <span className="font-semibold text-slate-800">{Math.min(startWorkerIndex + itemsPerPage, filteredWorkers.length)}</span> of{' '}
                <span className="font-semibold text-slate-800">{filteredWorkers.length}</span> church workers
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={workerPage === 1}
                  onClick={() => setWorkerPage(prev => Math.max(prev - 1, 1))}
                  className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer text-slate-700"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800">
                  Page {workerPage} of {totalWorkerPages}
                </span>

                <button
                  disabled={workerPage === totalWorkerPages}
                  onClick={() => setWorkerPage(prev => Math.min(prev + 1, totalWorkerPages))}
                  className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer text-slate-700"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENTAL REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
              >
                <option value="All Departments">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>

              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
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
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {reports
              .filter(r => selectedDeptFilter === 'All Departments' || r.department_name === selectedDeptFilter)
              .filter(r => selectedTypeFilter === 'All Types' || r.report_type === selectedTypeFilter)
              .filter(r => r.title?.toLowerCase().includes(searchTerm.toLowerCase()))
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

      {/* MODAL: DEPARTMENT DETAILS */}
      {selectedDepartment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Department Details
                </p>
                <h3 className="font-bold text-lg mt-0.5">{selectedDepartment.name}</h3>
              </div>
              <button onClick={() => setSelectedDepartment(null)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5 text-sm font-medium text-slate-700 overflow-y-auto">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <p className="text-xs uppercase font-bold text-slate-400">Department Leader</p>
                <p className="font-bold text-slate-900 text-base mt-1">{selectedDepartment.leader || 'Not Assigned'}</p>
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
                        <span className="font-semibold text-slate-800">{m.name || m.full_name || 'Member'}</span>
                        <span className="text-xs text-slate-500 font-medium bg-slate-200/60 px-2 py-0.5 rounded">{m.role || m.position || 'Member'}</span>
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

              <div className="p-4 bg-slate-50 border-t border-slate-200 -mx-6 -mb-6 mt-4 flex items-center justify-end">
                <button
                  onClick={() => setSelectedDepartment(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPORT PREVIEW DRAWER */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden h-[85vh] flex flex-col">
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

            <div className="flex-1 bg-slate-100 overflow-hidden relative">
              {renderDocumentPreview(previewDoc.report_file_url || previewDoc.file)}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PastorDepartments;