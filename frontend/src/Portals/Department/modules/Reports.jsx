import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Search, 
  Plus, 
  X, 
  Eye, 
  Filter, 
  Trash2, 
  Building2, 
  Calendar, 
  Loader2, 
  ShieldAlert, 
  CheckCircle2, 
  Grid, 
  List, 
  FileSpreadsheet, 
  Printer, 
  Clock,
  ChevronLeft,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import API from '../../../api/api';

const Reports = ({ userRole = 'Church Clerk' }) => {
  // --- ROLE-BASED ACCESS CONTROL (RBAC) ---
  const isClerk = userRole === 'Church Clerk';
  const isPastor = userRole === 'Pastor';
  const isElder = userRole === 'Elder';
  const isDeptLeader = userRole === 'Departmental Leader';

  // Permissions
  const canUpload = ['Church Clerk', 'Pastor', 'Departmental Leader'].includes(userRole);
  const canDelete = ['Church Clerk', 'Pastor'].includes(userRole);

  // --- COMPONENT STATES ---
  const [reports, setReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering & View States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All Departments');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All Types');
  const [selectedYearFilter, setSelectedYearFilter] = useState('All Years');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 12 : 10;

  // Modal & Drawer States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    departmentId: '',
    reportType: 'Monthly Report',
    date: new Date().toISOString().split('T')[0],
    title: '',
    file: null
  });

  // --- FETCH DATA FROM BACKEND ---
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [reportsRes, deptRes] = await Promise.all([
        API.get('/departmental-reports/'),
        API.get('/departments/')
      ]);

      const reportData = Array.isArray(reportsRes.data) ? reportsRes.data : reportsRes.data?.results || [];
      const deptData = Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.results || [];

      setReports(reportData);
      setDepartments(deptData);
    } catch (err) {
      console.error('Error loading departmental reports:', err);
      setErrorMsg('Failed to sync reports from the backend server. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLE REPORT UPLOAD ---
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!canUpload) return;
    if (!uploadForm.file || !uploadForm.departmentId) {
      alert('Please select both a department and a report file.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('department', uploadForm.departmentId);
      formData.append('report_type', uploadForm.reportType);
      formData.append('date', uploadForm.date);
      formData.append('title', uploadForm.title || `${uploadForm.reportType} - ${uploadForm.date}`);
      formData.append('report_file', uploadForm.file);

      await API.post('/departmental-reports/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg('Departmental report uploaded successfully.');
      setIsUploadModalOpen(false);
      setUploadForm({
        departmentId: '',
        reportType: 'Monthly Report',
        date: new Date().toISOString().split('T')[0],
        title: '',
        file: null
      });

      await fetchData();

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error submitting report:', err);
      setErrorMsg('Failed to upload the report. Please ensure file format is PDF/Doc.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- HANDLE REPORT DELETE ---
  const handleDeleteReport = async (id) => {
    if (!canDelete) return;
    if (!window.confirm('Are you sure you want to permanently delete this departmental report?')) return;

    setDeletingId(id);
    try {
      await API.delete(`/departmental-reports/${id}/`);
      setSuccessMsg('Report removed from repository.');
      setReports(prev => prev.filter(r => r.id !== id));
      if (previewDoc && previewDoc.id === id) setPreviewDoc(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error deleting report:', err);
      alert('Could not delete report. Server error encountered.');
    } finally {
      setDeletingId(null);
    }
  };

  // --- COMPUTED DATA & FILTERS ---
  const availableYears = Array.from(
    new Set(reports.map(r => r.date ? new Date(r.date).getFullYear().toString() : null).filter(Boolean))
  ).sort((a, b) => b - a);

  const filteredReports = reports.filter(r => {
    const deptName = r.department_name || r.department?.name || '';
    const matchesDept = selectedDeptFilter === 'All Departments' || deptName === selectedDeptFilter;
    const matchesType = selectedTypeFilter === 'All Types' || r.report_type === selectedTypeFilter;
    const reportYear = r.date ? new Date(r.date).getFullYear().toString() : '';
    const matchesYear = selectedYearFilter === 'All Years' || reportYear === selectedYearFilter;
    const matchesSearch = (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          deptName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDept && matchesType && matchesYear && matchesSearch;
  });

  // Summary Metrics
  const totalReportsCount = reports.length;
  const monthlyCount = reports.filter(r => r.report_type === 'Monthly Report').length;
  const quarterlyCount = reports.filter(r => r.report_type === 'Quarterly Report').length;
  const eventCount = reports.filter(r => r.report_type === 'Event Report').length;

  // Pagination Calculations
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + itemsPerPage);

  // --- EXPORT & PRINT FUNCTIONS ---
  const exportReportsListCSV = () => {
    if (filteredReports.length === 0) {
      alert('No reports available to export.');
      return;
    }

    const headers = ['Department', 'Report Title', 'Type', 'Date Recorded', 'File URL'];
    const rows = filteredReports.map(r => [
      `"${r.department_name || r.department?.name || 'N/A'}"`,
      `"${r.title || ''}"`,
      `"${r.report_type || ''}"`,
      `"${r.date || ''}"`,
      `"${r.report_file_url || r.report_file || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Departmental_Reports_Directory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintSummary = () => {
    if (filteredReports.length === 0) {
      alert('No reports to print.');
      return;
    }

    const printWindow = window.open('', '_blank');
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Departmental Reports Register</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #0f172a; }
            .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #10b981; padding-bottom: 12px; }
            .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 0.5px; }
            .header p { margin: 4px 0 0; font-size: 12px; color: #64748b; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { background-color: #f8fafc; color: #475569; text-transform: uppercase; font-size: 10px; padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; background: #e0f2fe; color: #0369a1; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Newlife SDA Church — Departmental Reports Register</h1>
            <p>Generated on ${dateStr} • Office of the Church Clerk</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Department</th>
                <th>Report Title</th>
                <th>Type</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredReports.map((r, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${r.department_name || r.department?.name || 'General'}</strong></td>
                  <td>${r.title}</td>
                  <td><span class="badge">${r.report_type}</span></td>
                  <td>${r.date}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Confidential Internal Document — Newlife SDA Church Clerk Desk</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // --- PREVIEW RENDERER ---
  const renderDocumentPreview = (fileUrl) => {
    if (!fileUrl) return null;
    const lowerUrl = fileUrl.toLowerCase();

    if (lowerUrl.includes('.pdf')) {
      return (
        <iframe
          src={`${fileUrl}#toolbar=0`}
          title="Departmental Report PDF Preview"
          className="w-full h-full rounded-b-xl border-none"
        />
      );
    }

    if (lowerUrl.includes('.doc') || lowerUrl.includes('.docx')) {
      const googleEmbedUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      return (
        <iframe
          src={googleEmbedUrl}
          title="Departmental Report DOC Preview"
          className="w-full h-full rounded-b-xl border-none"
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-500 space-y-3">
        <FileText size={48} className="text-slate-400" />
        <p className="text-sm font-semibold">Direct browser preview is not available for this file type.</p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          download
          className="px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-black uppercase hover:bg-emerald-600 transition shadow-md"
        >
          Download Document Directly
        </a>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 antialiased">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                DEPARTMENT REPORTS
              </h1>
              
            </div>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={exportReportsListCSV}
            title="Export CSV"
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 transition cursor-pointer"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handlePrintSummary}
            title="Print List"
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 transition cursor-pointer"
          >
            <Printer size={16} className="text-slate-600" />
            <span className="hidden sm:inline">Print</span>
          </button>

          {canUpload && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md transition"
            >
              <Upload size={16} />
              <span>Upload Report</span>
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK NOTIFICATIONS */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-extrabold flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-extrabold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Filed</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalReportsCount}</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-100">
            <FolderOpen size={20} />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-wider">Monthly Reports</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{monthlyCount}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Calendar size={20} />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-purple-600 uppercase tracking-wider">Quarterly Reports</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{quarterlyCount}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-amber-600 uppercase tracking-wider">Event Reports</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{eventCount}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <FileText size={20} />
          </div>
        </div>
      </div>

      {/* 3. FILTERING & SEARCH CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Search Bar & Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          
          {/* Title / Dept Search */}
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search title or department..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => { setSelectedDeptFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All Departments">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => { setSelectedTypeFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All Types">All Report Types</option>
            <option value="Monthly Report">Monthly Report</option>
            <option value="Quarterly Report">Quarterly Report</option>
            <option value="Event Report">Event Report</option>
          </select>

          {/* Year Filter */}
          {availableYears.length > 0 && (
            <select
              value={selectedYearFilter}
              onChange={(e) => { setSelectedYearFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All Years">All Years</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          )}

        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-end lg:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Grid View"
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-emerald-600 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Table View"
          >
            <List size={16} />
          </button>
        </div>

      </div>

      {/* 4. MAIN REPORTS CONTENT DISPLAY */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <Loader2 className="animate-spin mx-auto mb-3 text-emerald-500" size={28} />
          <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Loading departmental reports archive...</p>
        </div>
      ) : paginatedReports.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
          <FileText size={40} className="mx-auto text-slate-300 mb-2" />
          <h3 className="font-extrabold text-slate-700 text-sm">No Departmental Reports Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            No report records match your selected search criteria or filters.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        
        /* GRID VIEW LAYOUT */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedReports.map((report) => {
            const deptName = report.department_name || report.department?.name || 'General Department';
            const fileUrl = report.report_file_url || report.report_file;

            return (
              <div 
                key={report.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md ${
                      report.report_type === 'Monthly Report' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      report.report_type === 'Quarterly Report' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {report.report_type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Calendar size={11} /> {report.date}
                    </span>
                  </div>

                  {/* Thumbnail Mock Card Preview */}
                  <div 
                    onClick={() => setPreviewDoc(report)}
                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 my-2 cursor-pointer relative overflow-hidden group-hover:border-emerald-400 transition flex flex-col justify-between"
                  >
                    <div className="space-y-1.5 opacity-40">
                      <div className="h-1 bg-slate-500 rounded w-3/4"></div>
                      <div className="h-1 bg-slate-300 rounded w-full"></div>
                      <div className="h-1 bg-slate-300 rounded w-5/6"></div>
                      <div className="h-1 bg-slate-200 rounded w-1/2"></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-extrabold uppercase">
                      <span>View File</span>
                      <Eye size={13} className="text-slate-500 group-hover:text-emerald-600 transition" />
                    </div>
                  </div>

                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider truncate mt-1">
                    {deptName}
                  </p>
                  <h4 className="font-extrabold text-slate-800 text-xs line-clamp-2 leading-snug mt-0.5" title={report.title}>
                    {report.title}
                  </h4>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 gap-1.5">
                  <div className="flex items-center gap-1.5 w-full">
                    <button
                      onClick={() => setPreviewDoc(report)}
                      className="flex-1 flex items-center justify-center gap-1 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase transition cursor-pointer"
                    >
                      <Eye size={13} /> View
                    </button>

                    {fileUrl && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="flex-1 flex items-center justify-center gap-1 p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-[10px] font-black uppercase transition cursor-pointer"
                      >
                        <Download size={13} /> Get
                      </a>
                    )}
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      disabled={deletingId === report.id}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Delete report"
                    >
                      {deletingId === report.id ? <Loader2 size={13} className="animate-spin text-rose-600" /> : <Trash2 size={14} />}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      ) : (

        /* TABLE VIEW LAYOUT */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Report Title</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {paginatedReports.map((report) => {
                  const deptName = report.department_name || report.department?.name || 'General';
                  const fileUrl = report.report_file_url || report.report_file;

                  return (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-6 font-extrabold text-slate-900">
                        {deptName}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-800 max-w-xs truncate">
                        {report.title}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          report.report_type === 'Monthly Report' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          report.report_type === 'Quarterly Report' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {report.report_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-500 font-extrabold">
                        {report.date}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewDoc(report)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Preview File"
                          >
                            <Eye size={16} />
                          </button>
                          {fileUrl && (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Download Report"
                            >
                              <Download size={16} />
                            </a>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete Report"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      )}

      {/* 5. PAGINATION BAR */}
      {filteredReports.length > 0 && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-600 shadow-xs">
          <div>
            Showing <span className="font-extrabold text-slate-900">{startIndex + 1}</span> to{' '}
            <span className="font-extrabold text-slate-900">{Math.min(startIndex + itemsPerPage, filteredReports.length)}</span> of{' '}
            <span className="font-extrabold text-slate-900">{filteredReports.length}</span> reports
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition cursor-pointer text-slate-700"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg font-extrabold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition cursor-pointer text-slate-700"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPLOAD REPORT                                                      */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-950 p-4 px-6 flex items-center justify-between text-white">
              <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                <Upload className="text-emerald-400" size={18} /> Upload Departmental Report
              </h3>
              <button 
                onClick={() => setIsUploadModalOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-3.5 text-xs font-bold text-slate-700">
              <div>
                <label className="block font-black text-slate-900 mb-1">Target Department *</label>
                <select
                  required
                  value={uploadForm.departmentId}
                  onChange={(e) => setUploadForm({...uploadForm, departmentId: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-extrabold"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Monthly Report">Monthly Report</option>
                    <option value="Quarterly Report">Quarterly Report</option>
                    <option value="Event Report">Event Report</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-900 mb-1">Report Date *</label>
                  <input
                    type="date"
                    required
                    value={uploadForm.date}
                    onChange={(e) => setUploadForm({...uploadForm, date: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-900 mb-1">Report Title / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Q2 Youth Evangelism & Financial Report"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-black text-slate-900 mb-1">Document File (PDF / Doc) *</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 transition text-center cursor-pointer relative">
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <Upload size={20} className="text-slate-400" />
                    <p className="text-xs font-bold text-slate-700">
                      {uploadForm.file ? uploadForm.file.name : 'Click or drop PDF / Doc report file here'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Submit Report
                </button>
              </div>
            </form>
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
                  {previewDoc.department_name || previewDoc.department?.name || 'Departmental Report'} • {previewDoc.report_type}
                </span>
                <h3 className="font-extrabold text-base mt-0.5">{previewDoc.title}</h3>
                <p className="text-xs text-slate-400 font-bold">Date: {previewDoc.date}</p>
              </div>

              <div className="flex items-center gap-3">
                {(previewDoc.report_file_url || previewDoc.report_file) && (
                  <a
                    href={previewDoc.report_file_url || previewDoc.report_file}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition shadow-xs"
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
              {renderDocumentPreview(previewDoc.report_file_url || previewDoc.report_file)}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;