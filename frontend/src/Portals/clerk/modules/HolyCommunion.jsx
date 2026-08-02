import React, { useState, useEffect } from 'react';
import API from '../../../api/api';
import { 
  Users, 
  Upload, 
  Download, 
  Search, 
  Calendar, 
  Eye, 
  X, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  FileUp, 
  Loader2, 
  Pencil, 
  FileText,
  BookmarkCheck,
  Plus
} from 'lucide-react';

const HolyCommunion = () => {
  // Data & State Management
  const [communionRecords, setCommunionRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Clerk context
  const activeUserName = "Isaac Nyangolo";

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedQuarter, setSelectedQuarter] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form State for Add & Edit
  const [formData, setFormData] = useState({
    year: '2026',
    quarter: 'Q3',
    serviceDate: '',
    membersPresent: '',
    remarks: '',
    file: null
  });

  const showToast = (msg, isError = false) => {
    setNotification({ message: msg, isError });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- FETCH RECORDS FROM API ---
  const fetchCommunionRecords = async () => {
    setIsLoading(true);
    try {
      const response = await API.get('/holy-communion/', {
        params: { year: selectedYear }
      });
      const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setCommunionRecords(data);
    } catch (err) {
      console.error('Failed to fetch communion records:', err);
      // Fallback dummy data if API endpoint is not yet connected
      setCommunionRecords([
        {
          id: '1',
          year: '2026',
          quarter: 'Q2',
          serviceDate: '2026-04-11',
          membersPresent: 342,
          fileName: 'Q2_2026_Holy_Communion_Roster.pdf',
          fileSize: '1.2 MB',
          fileUrl: '/sample-roster.pdf',
          recordedBy: 'Isaac Nyangolo',
          createdAt: '2026-04-12',
          remarks: 'Q2 Service held successfully. High attendance observed.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunionRecords();
  }, [selectedYear]);

  // Reset form helper
  const resetForm = () => {
    setFormData({
      year: new Date().getFullYear().toString(),
      quarter: 'Q3',
      serviceDate: '',
      membersPresent: '',
      remarks: '',
      file: null
    });
  };

  // --- CREATE COMMUNION RECORD ---
  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serviceDate || !formData.membersPresent || !formData.file) {
      showToast('Please fill all required fields and upload the attendance sheet.', true);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('year', formData.year);
      payload.append('quarter', formData.quarter);
      payload.append('service_date', formData.serviceDate);
      payload.append('members_present', formData.membersPresent);
      payload.append('remarks', formData.remarks);
      payload.append('file', formData.file);
      payload.append('recorded_by', activeUserName);

      const response = await API.post('/holy-communion/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newRecord = response.data.data || response.data;
      setCommunionRecords(prev => [newRecord, ...prev]);
      setIsRecordModalOpen(false);
      resetForm();
      showToast('Holy Communion record saved successfully!');
    } catch (err) {
      console.error('Failed to save communion record:', err);
      showToast(err.response?.data?.message || 'Failed to save record', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- EDIT COMMUNION RECORD ---
  const handleOpenEditModal = (record) => {
    setEditingRecord(record);
    setFormData({
      year: record.year || '2026',
      quarter: record.quarter || 'Q1',
      serviceDate: record.serviceDate || record.service_date || '',
      membersPresent: record.membersPresent || record.members_present || '',
      remarks: record.remarks || '',
      file: null
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('year', formData.year);
      payload.append('quarter', formData.quarter);
      payload.append('service_date', formData.serviceDate);
      payload.append('members_present', formData.membersPresent);
      payload.append('remarks', formData.remarks);
      if (formData.file) {
        payload.append('file', formData.file);
      }

      const id = editingRecord.id || editingRecord._id;
      const response = await API.patch(`/holy-communion/${id}/`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const updatedRecord = response.data.data || response.data;
      setCommunionRecords(prev => prev.map(item => (item.id === id || item._id === id) ? updatedRecord : item));
      setIsEditModalOpen(false);
      setEditingRecord(null);
      resetForm();
      showToast('Communion entry updated successfully!');
    } catch (err) {
      console.error('Failed to update communion entry:', err);
      showToast('Failed to update entry', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Pagination Logic
  const filteredRecords = communionRecords.filter(item => {
    const year = item.year || '';
    const quarter = item.quarter || '';
    const date = item.serviceDate || item.service_date || '';
    
    const matchesSearch = year.includes(searchTerm) || 
                          quarter.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          date.includes(searchTerm);
    
    const matchesYear = year === selectedYear;
    const matchesQuarter = selectedQuarter === 'ALL' || quarter === selectedQuarter;

    return matchesSearch && matchesYear && matchesQuarter;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased">
      
      {/* TOAST NOTIFICATION */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-base ${
          notification.isError ? 'bg-rose-900' : 'bg-slate-900'
        }`}>
          <CheckCircle2 size={20} className={notification.isError ? 'text-rose-400' : 'text-emerald-400'} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Holy Communion Report</h1>
          
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsRecordModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-base font-semibold transition cursor-pointer shadow-xs"
        >
          <Plus size={20} />
          <span>Record Holy Communion</span>
        </button>
      </div>

      {/* SEARCH & CONTROLS */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          {/* Search Field */}
          <div className="relative w-full sm:w-80">
            <Search size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by date or quarter..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          {/* Filter Year */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-base font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="2026">2026 Records</option>
            <option value="2025">2025 Records</option>
            <option value="2024">2024 Records</option>
          </select>

          {/* Filter Quarter */}
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-base font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="ALL">All Quarters</option>
            <option value="Q1">Quarter 1 (Q1)</option>
            <option value="Q2">Quarter 2 (Q2)</option>
            <option value="Q3">Quarter 3 (Q3)</option>
            <option value="Q4">Quarter 4 (Q4)</option>
          </select>
        </div>

        
      </div>

      {/* COMMUNION RECORDS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-sm font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-4 px-6">Year & Quarter</th>
                <th className="py-4 px-6">Service Date</th>
                <th className="py-4 px-6">Members Partaking</th>
                <th className="py-4 px-6">Attendance Sheet</th>
                <th className="py-4 px-6">Recorded By</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={22} className="animate-spin text-emerald-600" />
                      <span>Loading communion records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRecords.length > 0 ? (
                paginatedRecords.map((item) => {
                  const rawUser = item.recordedBy || item.recorded_by;
                  const displayUser = (typeof rawUser === 'object' && rawUser?.name) 
                    ? rawUser.name 
                    : (typeof rawUser === 'string' && isNaN(rawUser)) 
                      ? rawUser 
                      : activeUserName;

                  const fileUrl = item.fileUrl || item.file_url || item.file;

                  return (
                    <tr key={item.id || item._id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Year & Quarter */}
                      <td className="py-4.5 px-6 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-md font-extrabold uppercase">
                            {item.quarter || 'Q1'}
                          </span>
                          <span>{item.year || '2026'}</span>
                        </div>
                      </td>

                      {/* Service Date */}
                      <td className="py-4.5 px-6 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <Calendar size={18} className="text-emerald-600" />
                          <span>{item.serviceDate || item.service_date}</span>
                        </div>
                      </td>

                      {/* Members Present */}
                      <td className="py-4.5 px-6">
                        <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg font-bold text-slate-900">
                          <Users size={16} className="text-emerald-600" />
                          <span>{item.membersPresent || item.members_present || 0} Members</span>
                        </div>
                      </td>

                      {/* File Specs */}
                      <td className="py-4.5 px-6 text-sm text-slate-500">
                        <div className="font-semibold text-slate-700 text-base max-w-[200px] truncate">
                          {item.fileName || item.file_name || 'Attendance_Sheet.pdf'}
                        </div>
                        <div>{item.fileSize || item.file_size || '1.1 MB'}</div>
                      </td>

                      {/* Recorded By */}
                      <td className="py-4.5 px-6 text-sm text-slate-600">
                        <div className="font-semibold text-slate-800 text-base">{displayUser}</div>
                        <div className="text-slate-400">{item.createdAt?.split('T')[0] || item.upload_date || '2026-07-28'}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-4.5 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* VIEW/PREVIEW BUTTON */}
                          <button
                            onClick={() => setSelectedRecord(item)}
                            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Preview Attendance Sheet & Details"
                          >
                            <Eye size={20} />
                          </button>

                          {/* EDIT BUTTON */}
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Edit Record"
                          >
                            <Pencil size={19} />
                          </button>

                          {/* DOWNLOAD SHEET */}
                          <a
                            href={fileUrl}
                            download={item.fileName || item.file_name || 'Holy_Communion_Attendance.pdf'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Download Attendance Sheet"
                          >
                            <Download size={20} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No Holy Communion records found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm font-medium text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-800">{filteredRecords.length === 0 ? 0 : startIndex + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredRecords.length)}</span> of{' '}
            <span className="font-semibold text-slate-800">{filteredRecords.length}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* RECORD COMMUNION MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <h3 className="font-semibold text-lg flex items-center gap-2.5">
                <FileUp className="text-emerald-400" size={22} /> Record Holy Communion
              </h3>
              <button onClick={() => setIsRecordModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="p-6 space-y-4 text-base font-medium text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1.5 text-slate-800">Year *</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1.5 text-slate-800">Quarter *</label>
                  <select
                    value={formData.quarter}
                    onChange={(e) => setFormData({...formData, quarter: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="Q1">Quarter 1 (Q1)</option>
                    <option value="Q2">Quarter 2 (Q2)</option>
                    <option value="Q3">Quarter 3 (Q3)</option>
                    <option value="Q4">Quarter 4 (Q4)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1.5 text-slate-800">Sabbath Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.serviceDate}
                    onChange={(e) => setFormData({...formData, serviceDate: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1.5 text-slate-800">Members Present *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 350"
                    required
                    value={formData.membersPresent}
                    onChange={(e) => setFormData({...formData, membersPresent: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Remarks / Notes (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Service led by Pastor Johnson. High turnout in youth ministry."
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Upload Attendance Sheet (PDF/Doc) *</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 text-center relative cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <FileText size={30} className="text-emerald-600 mx-auto mb-1" />
                  <p className="font-semibold text-slate-700">
                    {formData.file ? formData.file.name : 'Click to select or drop Attendance PDF'}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg shadow-2xs hover:bg-emerald-700 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                  <span>{isSubmitting ? 'Saving...' : 'Save Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COMMUNION RECORD MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <h3 className="font-semibold text-lg flex items-center gap-2.5">
                <Pencil className="text-amber-400" size={20} /> Edit Holy Communion Record
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-base font-medium text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1.5 text-slate-800">Year *</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1.5 text-slate-800">Quarter *</label>
                  <select
                    value={formData.quarter}
                    onChange={(e) => setFormData({...formData, quarter: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="Q1">Quarter 1 (Q1)</option>
                    <option value="Q2">Quarter 2 (Q2)</option>
                    <option value="Q3">Quarter 3 (Q3)</option>
                    <option value="Q4">Quarter 4 (Q4)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1.5 text-slate-800">Sabbath Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.serviceDate}
                    onChange={(e) => setFormData({...formData, serviceDate: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1.5 text-slate-800">Members Present *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.membersPresent}
                    onChange={(e) => setFormData({...formData, membersPresent: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Remarks / Notes</label>
                <textarea
                  rows="2"
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Replace Sheet Document (Optional)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 bg-slate-50 text-center relative cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <FileText size={26} className="text-amber-600 mx-auto mb-1" />
                  <p className="font-semibold text-slate-700 text-sm">
                    {formData.file ? formData.file.name : 'Select new file to overwrite existing document'}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-amber-600 text-white font-semibold rounded-lg shadow-2xs hover:bg-amber-700 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Pencil size={18} />}
                  <span>{isSubmitting ? 'Saving...' : 'Update Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW / PREVIEW ATTENDANCE SHEET MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full h-[85vh] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-4 px-6 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs bg-emerald-500 text-white font-bold px-2.5 py-1 rounded uppercase">
                  {selectedRecord.quarter || 'Q1'} - {selectedRecord.year || '2026'}
                </span>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Holy Communion Attendance Report</h3>
                  <div className="text-xs text-slate-300 flex items-center gap-4 mt-0.5">
                    <span>Date: <strong>{selectedRecord.serviceDate || selectedRecord.service_date}</strong></span>
                    <span>Partakers: <strong>{selectedRecord.membersPresent || selectedRecord.members_present} Members</strong></span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedRecord(null)} 
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X size={24} />
              </button>
            </div>

            {/* Embedded PDF Preview */}
            <div className="flex-1 bg-slate-100 relative">
              <iframe
                src={selectedRecord.fileUrl || selectedRecord.file_url || selectedRecord.file}
                title="Holy Communion Attendance Sheet"
                className="w-full h-full border-none"
              />
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-sm text-slate-600 font-medium max-w-md truncate">
                {selectedRecord.remarks ? (
                  <span><strong>Notes:</strong> {selectedRecord.remarks}</span>
                ) : (
                  <span>Recorded by <strong className="text-slate-800">{activeUserName}</strong></span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={selectedRecord.fileUrl || selectedRecord.file_url || selectedRecord.file}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-4 rounded-lg text-sm transition cursor-pointer"
                >
                  <Download size={15} />
                  <span>Download Sheet</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default HolyCommunion;