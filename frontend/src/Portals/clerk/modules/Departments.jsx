import React, { useState } from 'react';
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
  FileCheck
} from 'lucide-react';

const Departments = () => {
  // Navigation Tabs: 'tors' | 'reports'
  const [activeTab, setActiveTab] = useState('tors');

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All Departments');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All Types');

  // Pagination State for Departments Table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer / Modal States
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isUploadReportModalOpen, setIsUploadReportModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // --- SAMPLE DATA: DEPARTMENTS (Scalable for 47+ departments) ---
  const [departments, setDepartments] = useState([
    {
      id: 1,
      name: 'Clerk\'s Desk & Secretarial',
      leader: 'Collins Kimathi',
      councilMembers: [
        { name: 'Mary Wanjiku', role: 'Assistant Clerk' },
        { name: 'Elder John Kamau', role: 'Records Overseer' }
      ],
      torDoc: { name: 'TOR_Clerk_Desk_2026.pdf', size: '1.4 MB', url: '#' }
    },
    {
      id: 2,
      name: 'Sabbath School & Personal Ministries',
      leader: 'Elder Mark Rotich',
      councilMembers: [
        { name: 'Grace Omwamba', role: 'Superintendent' },
        { name: 'Peter Ndung\'u', role: 'Outreach Coordinator' },
        { name: 'Sarah Cherono', role: 'Secretary' }
      ],
      torDoc: { name: 'TOR_Sabbath_School_2026.pdf', size: '1.1 MB', url: '#' }
    },
    {
      id: 3,
      name: 'Youth Ministries (AY)',
      leader: 'Brian Kiprop',
      councilMembers: [
        { name: 'Kevin Otieno', role: 'Sponsor' },
        { name: 'Joy Muthoni', role: 'Treasurer' }
      ],
      torDoc: { name: 'TOR_Youth_AY_2026.pdf', size: '980 KB', url: '#' }
    },
    {
      id: 4,
      name: 'Deaconry & Ushering',
      leader: 'Head Deacon James Omondi',
      councilMembers: [
        { name: 'Eunice Achieng', role: 'Head Deaconess' },
        { name: 'Samuel Kibet', role: 'Sanctuary Supervisor' }
      ],
      torDoc: { name: 'TOR_Deaconry_2026.pdf', size: '1.2 MB', url: '#' }
    }
  ]);

  // --- SAMPLE DATA: DEPARTMENTAL REPORTS ---
  const [reports, setReports] = useState([
    {
      id: 101,
      department: 'Clerk\'s Desk & Secretarial',
      reportType: 'Monthly Report',
      date: '2026-06-30',
      title: 'June Membership Audit & Minutes Confirmation Report',
      fileName: 'Clerk_June_2026_Monthly_Report.pdf',
      fileSize: '2.1 MB',
      fileUrl: '#'
    },
    {
      id: 102,
      department: 'Sabbath School & Personal Ministries',
      reportType: 'Quarterly Report',
      date: '2026-06-15',
      title: 'Q2 Evangelism Outreach & Baptismal Class Progress',
      fileName: 'SabbathSchool_Q2_2026_Report.pdf',
      fileSize: '3.4 MB',
      fileUrl: '#'
    },
    {
      id: 103,
      department: 'Youth Ministries (AY)',
      reportType: 'Event Report',
      date: '2026-05-28',
      title: 'Annual Youth Revival Week & Community Service Report',
      fileName: 'AY_Revival_Week_Event_Report.pdf',
      fileSize: '4.2 MB',
      fileUrl: '#'
    }
  ]);

  // Form State: Streamlined Add New Department
  const [deptForm, setDeptForm] = useState({
    name: '',
    leader: '',
    councilMembers: [{ name: '', role: '' }],
    torFile: null
  });

  // Dynamic Council Member Row Handlers
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

  // Submit Add Department
  const handleAddDeptSubmit = (e) => {
    e.preventDefault();

    // Clean out empty council member rows
    const cleanedCouncil = deptForm.councilMembers.filter(m => m.name.trim() !== '');

    const newDept = {
      id: Date.now(),
      name: deptForm.name,
      leader: deptForm.leader,
      councilMembers: cleanedCouncil,
      torDoc: deptForm.torFile 
        ? { name: deptForm.torFile.name, size: 'Uploaded', url: URL.createObjectURL(deptForm.torFile) } 
        : null
    };

    setDepartments([newDept, ...departments]);
    setIsAddDeptModalOpen(false);
    
    // Reset Form
    setDeptForm({
      name: '',
      leader: '',
      councilMembers: [{ name: '', role: '' }],
      torFile: null
    });
  };

  // Form State: Upload Report Modal
  const [uploadForm, setUploadForm] = useState({
    department: 'Clerk\'s Desk & Secretarial',
    reportType: 'Monthly Report',
    date: '',
    title: '',
    file: null
  });

  // Submit Upload Report
  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadForm.file) return;

    const newReport = {
      id: Date.now(),
      department: uploadForm.department,
      reportType: uploadForm.reportType,
      date: uploadForm.date,
      title: uploadForm.title || `${uploadForm.reportType} - ${uploadForm.department}`,
      fileName: uploadForm.file.name,
      fileSize: 'Uploaded',
      fileUrl: URL.createObjectURL(uploadForm.file)
    };

    setReports([newReport, ...reports]);
    setIsUploadReportModalOpen(false);
    setUploadForm({ department: 'Clerk\'s Desk & Secretarial', reportType: 'Monthly Report', date: '', title: '', file: null });
  };

  // Filtering & Pagination Logic for Departments
  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.leader.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDepartments = filteredDepartments.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Departments & Terms of Reference</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of Newlife Church department leadership, council structures, and uploaded official TOR documents.
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
      {/* TAB 1: DEPARTMENTS & TORS TABLE + PAGINATION                             */}
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
                  setCurrentPage(1); // Reset page on search
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
                  {paginatedDepartments.length > 0 ? (
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
                          {dept.leader}
                        </td>

                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium border border-slate-200">
                            {dept.councilMembers ? dept.councilMembers.length : 0} Members
                          </span>
                        </td>

                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                          {dept.torDoc ? (
                            <a
                              href={dept.torDoc.url}
                              download={dept.torDoc.name}
                              className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-semibold text-sm hover:underline"
                            >
                              <Download size={15} /> {dept.torDoc.name}
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
      {/* TAB 2: DEPARTMENTAL REPORTS (UNTOUCHED)                                 */}
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
              .filter(r => selectedDeptFilter === 'All Departments' || r.department === selectedDeptFilter)
              .filter(r => selectedTypeFilter === 'All Types' || r.reportType === selectedTypeFilter)
              .filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((report) => (
                <div 
                  key={report.id}
                  className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        report.reportType === 'Monthly Report' ? 'bg-blue-50 text-blue-700' :
                        report.reportType === 'Quarterly Report' ? 'bg-purple-50 text-purple-700' :
                        'bg-amber-50 text-amber-800'
                      }`}>
                        {report.reportType}
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

                    <p className="text-[10px] font-medium text-emerald-800 truncate">{report.department}</p>
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
                      href={report.fileUrl}
                      download={report.fileName}
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
      {/* MODAL 1: ADD NEW DEPARTMENT (STREAMLINED)                                */}
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
              
              {/* 1. Department Name */}
              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Children's Ministries"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({...deptForm, name: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              {/* 2. Department Leader */}
              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Department Leader *</label>
                <input
                  type="text"
                  required
                  placeholder="Leader's Full Name"
                  value={deptForm.leader}
                  onChange={(e) => setDeptForm({...deptForm, leader: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              {/* 3. Council Members & Roles (Dynamic with + Button) */}
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
                      className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. Secretary)"
                      value={member.role}
                      onChange={(e) => handleCouncilMemberChange(index, 'role', e.target.value)}
                      className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
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

              {/* 4. TOR File Upload ONLY */}
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

              {/* Modal Actions */}
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-2xs cursor-pointer transition"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DEPARTMENT DETAILS DRAWER                                        */}
      {/* ========================================================================= */}
      {selectedDepartment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Department Details</p>
                <h3 className="font-bold text-lg mt-0.5">{selectedDepartment.name}</h3>
              </div>
              <button onClick={() => setSelectedDepartment(null)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5 text-sm font-medium text-slate-700">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <p className="text-xs uppercase font-bold text-slate-400">Department Leader</p>
                <p className="font-bold text-slate-900 text-base mt-1">{selectedDepartment.leader}</p>
              </div>

              <div>
                <p className="text-xs uppercase font-bold text-slate-400 mb-2">Council Members & Roles</p>
                <div className="space-y-1.5">
                  {selectedDepartment.councilMembers && selectedDepartment.councilMembers.length > 0 ? (
                    selectedDepartment.councilMembers.map((m, i) => (
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
                {selectedDepartment.torDoc ? (
                  <a
                    href={selectedDepartment.torDoc.url}
                    download={selectedDepartment.torDoc.name}
                    className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg border border-emerald-200 font-bold transition text-sm"
                  >
                    <Download size={15} /> Download Document
                  </a>
                ) : (
                  <span className="text-slate-400 text-xs italic">None uploaded</span>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setSelectedDepartment(null)} 
                className="px-5 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-slate-900 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3 & 4: REPORTS MODALS (UNTOUCHED)                                 */}
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
                  value={uploadForm.department}
                  onChange={(e) => setUploadForm({...uploadForm, department: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-2xs cursor-pointer"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden h-[70vh] flex flex-col">
            <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
              <div>
                <p className="text-[10px] font-semibold text-emerald-400">{previewDoc.department} ({previewDoc.reportType})</p>
                <h3 className="font-bold text-sm">{previewDoc.title || previewDoc.fileName}</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            <div className="p-6 flex-1 bg-slate-100 flex flex-col items-center justify-center text-center">
              <FileText size={48} className="text-slate-400 mb-3" />
              <h4 className="text-sm font-bold text-slate-800">{previewDoc.fileName}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Date: {previewDoc.date} | Size: {previewDoc.fileSize}</p>
              
              <div className="mt-5">
                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.fileName}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2"
                >
                  <Download size={14} /> Download Report File
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Departments;