import React, { useState, useEffect } from 'react';
import API from '../../../api/api';
import { 
  FileText, 
  Upload, 
  Download, 
  Search, 
  Calendar, 
  Eye, 
  X, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  MessageSquare,
  FileUp,
  Loader2,
  Pencil
} from 'lucide-react';

const Communication = () => {
  // Data & State Management
  const [bulletins, setBulletins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active user name requirement (Isaac Nyangolo)
  const activeUserName = "Isaac Nyangolo";

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState(null);
  const [editingBulletin, setEditingBulletin] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form State for Upload & Edit
  const [formData, setFormData] = useState({
    sabbathDate: '',
    title: '',
    file: null,
    shareToWhatsappImmediately: true
  });

  const showToast = (msg, isError = false) => {
    setNotification({ message: msg, isError });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- FETCH BULLETINS FROM API ---
  const fetchBulletins = async () => {
    setIsLoading(true);
    try {
      const response = await API.get('/bulletins/', {
        params: { year: selectedYear }
      });
      const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setBulletins(data);
    } catch (err) {
      console.error('Failed to fetch bulletins:', err);
      showToast('Error loading bulletins. Please try again.', true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBulletins();
  }, [selectedYear]);

  // --- WHATSAPP SHARE ---
  const handleWhatsAppShare = (bulletin) => {
    const formattedDate = new Date(bulletin.sabbathDate || bulletin.sabbath_date).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const fileUrl = bulletin.fileUrl || bulletin.file_url || `${window.location.origin}${bulletin.file}`;

    const message = 
      `*NEWLIFE SDA CHURCH - WEEKLY BULLETIN*\n` +
      `📅 *Sabbath Date:* ${formattedDate}\n` +
      `📄 *Title:* ${bulletin.title}\n\n` +
      `Greetings saints! Please find the official church bulletin for this Sabbath attached below or download it directly using the link:\n` +
      `🔗 ${fileUrl}\n\n` +
      `Blessed Sabbath! 🙏✨`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://web.whatsapp.com/send?text=${encodedMessage}`, '_blank');
    showToast(`WhatsApp broadcast message generated.`);
  };

  // --- CREATE BULLETIN ---
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file || !formData.sabbathDate) return;

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('sabbath_date', formData.sabbathDate);
      payload.append('title', formData.title);
      payload.append('file', formData.file);
      payload.append('uploaded_by', activeUserName);

      const response = await API.post('/bulletins/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newBulletin = response.data.data || response.data;
      setBulletins((prev) => [newBulletin, ...prev]);
      setIsUploadModalOpen(false);
      showToast('Bulletin uploaded successfully!');

      if (formData.shareToWhatsappImmediately) {
        setTimeout(() => handleWhatsAppShare(newBulletin), 500);
      }

      setFormData({ sabbathDate: '', title: '', file: null, shareToWhatsappImmediately: true });
    } catch (err) {
      console.error('Failed to upload bulletin:', err);
      showToast(err.response?.data?.message || 'Failed to upload bulletin', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- EDIT BULLETIN ---
  const handleOpenEditModal = (bulletin) => {
    setEditingBulletin(bulletin);
    setFormData({
      sabbathDate: bulletin.sabbathDate || bulletin.sabbath_date || '',
      title: bulletin.title || '',
      file: null,
      shareToWhatsappImmediately: false
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingBulletin) return;

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('sabbath_date', formData.sabbathDate);
      payload.append('title', formData.title);
      if (formData.file) {
        payload.append('file', formData.file);
      }

      const id = editingBulletin.id || editingBulletin._id;
      const response = await API.patch(`/bulletins/${id}/`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const updatedBulletin = response.data.data || response.data;
      setBulletins(prev => prev.map(b => (b.id === id || b._id === id) ? updatedBulletin : b));
      setIsEditModalOpen(false);
      setEditingBulletin(null);
      showToast('Bulletin entry updated successfully!');
    } catch (err) {
      console.error('Failed to update bulletin:', err);
      showToast('Failed to update bulletin entry', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Pagination Logic
  const filteredBulletins = bulletins.filter(b => {
    const title = b.title || '';
    const sabbathDate = b.sabbathDate || b.sabbath_date || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || sabbathDate.includes(searchTerm);
    const matchesYear = sabbathDate.startsWith(selectedYear);
    return matchesSearch && matchesYear;
  });

  const totalPages = Math.ceil(filteredBulletins.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBulletins = filteredBulletins.slice(startIndex, startIndex + itemsPerPage);

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
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Communication Hub</h1>
          <p className="text-base text-slate-500 mt-1">
            Upload weekly Sabbath bulletins, maintain historical archives, and share directly to the Church WhatsApp Group.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ sabbathDate: '', title: '', file: null, shareToWhatsappImmediately: true });
            setIsUploadModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-base font-semibold transition cursor-pointer shadow-xs"
        >
          <Upload size={20} />
          <span>Upload Weekly Bulletin</span>
        </button>
      </div>

      {/* SEARCH & CONTROLS */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-96">
            <Search size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search bulletin by title or date..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-base font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="2026">2026 Bulletins</option>
            <option value="2025">2025 Bulletins</option>
            <option value="2024">2024 Bulletins</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5 text-sm font-semibold text-emerald-800 bg-emerald-50/80 px-4 py-2.5 rounded-lg border border-emerald-200/60 w-full sm:w-auto justify-center">
          <MessageSquare size={18} className="text-emerald-600" />
          <span>Church WhatsApp Integration Active</span>
        </div>
      </div>

      {/* BULLETINS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-sm font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-4 px-6">Sabbath Date</th>
                <th className="py-4 px-6">Bulletin Title</th>
                <th className="py-4 px-6">File Specs</th>
                <th className="py-4 px-6">Uploaded By</th>
                <th className="py-4 px-6 text-center">Share / Broadcast</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={22} className="animate-spin text-emerald-600" />
                      <span>Loading bulletins...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedBulletins.length > 0 ? (
                paginatedBulletins.map((bulletin) => {
                  // Resolve Uploaded By Display Name
                  const rawUser = bulletin.uploadedBy || bulletin.uploaded_by;
                  const displayUser = (typeof rawUser === 'object' && rawUser?.name) 
                    ? rawUser.name 
                    : (typeof rawUser === 'string' && isNaN(rawUser)) 
                      ? rawUser 
                      : activeUserName;

                  const fileUrl = bulletin.fileUrl || bulletin.file_url || bulletin.file;

                  return (
                    <tr key={bulletin.id || bulletin._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4.5 px-6 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={18} className="text-emerald-600" />
                          <span>{bulletin.sabbathDate || bulletin.sabbath_date}</span>
                        </div>
                      </td>

                      <td className="py-4.5 px-6 font-bold text-slate-800 text-base">
                        {bulletin.title}
                      </td>

                      <td className="py-4.5 px-6 text-sm text-slate-500">
                        <div className="font-semibold text-slate-700 text-base">{bulletin.fileName || bulletin.file_name || 'Bulletin PDF'}</div>
                        <div>{bulletin.fileSize || bulletin.file_size || '0.9 MB'}</div>
                      </td>

                      <td className="py-4.5 px-6 text-sm text-slate-600">
                        <div className="font-semibold text-slate-800 text-base">{displayUser}</div>
                        <div className="text-slate-400">{bulletin.uploadDate || bulletin.upload_date || bulletin.createdAt?.split('T')[0] || '2026-07-26'}</div>
                      </td>

                      <td className="py-4.5 px-6 text-center">
                        <button
                          onClick={() => handleWhatsAppShare(bulletin)}
                          className="inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-lg font-semibold text-sm transition cursor-pointer"
                        >
                          <Send size={15} className="text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      </td>

                      <td className="py-4.5 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* VIEW PREVIEW BUTTON */}
                          <button
                            onClick={() => setSelectedBulletin(bulletin)}
                            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Preview Bulletin PDF"
                          >
                            <Eye size={20} />
                          </button>

                          {/* EDIT BUTTON */}
                          <button
                            onClick={() => handleOpenEditModal(bulletin)}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Edit Bulletin Entry"
                          >
                            <Pencil size={19} />
                          </button>

                          {/* DOWNLOAD BUTTON */}
                          <a
                            href={fileUrl}
                            download={bulletin.fileName || bulletin.file_name || 'bulletin.pdf'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Download PDF"
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
                    No Sabbath bulletins found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm font-medium text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-800">{filteredBulletins.length === 0 ? 0 : startIndex + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredBulletins.length)}</span> of{' '}
            <span className="font-semibold text-slate-800">{filteredBulletins.length}</span> bulletins
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

      {/* UPLOAD BULLETIN MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <h3 className="font-semibold text-lg flex items-center gap-2.5">
                <FileUp className="text-emerald-400" size={22} /> Upload Sabbath Bulletin
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-base font-medium text-slate-700">
              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Sabbath Date *</label>
                <input
                  type="date"
                  required
                  value={formData.sabbathDate}
                  onChange={(e) => setFormData({...formData, sabbathDate: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Bulletin Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sabbath Bulletin 2026/25/7"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Upload Bulletin Document (PDF) *</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 text-center relative cursor-pointer">
                  <input
                    type="file"
                    required
                    accept=".pdf"
                    onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <FileText size={30} className="text-emerald-600 mx-auto mb-1" />
                  <p className="font-semibold text-slate-700">{formData.file ? formData.file.name : 'Click to select or drop Bulletin PDF'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="whatsappCheck"
                  checked={formData.shareToWhatsappImmediately}
                  onChange={(e) => setFormData({...formData, shareToWhatsappImmediately: e.target.checked})}
                  className="w-5 h-5 text-emerald-600 rounded border-slate-300"
                />
                <label htmlFor="whatsappCheck" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Prompt WhatsApp Share immediately after upload
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg shadow-2xs hover:bg-emerald-700 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                  <span>{isSubmitting ? 'Uploading...' : 'Upload Bulletin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BULLETIN MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <h3 className="font-semibold text-lg flex items-center gap-2.5">
                <Pencil className="text-amber-400" size={20} /> Edit Bulletin Record
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-base font-medium text-slate-700">
              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Sabbath Date *</label>
                <input
                  type="date"
                  required
                  value={formData.sabbathDate}
                  onChange={(e) => setFormData({...formData, sabbathDate: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Bulletin Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Replace Document (Optional)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 bg-slate-50 text-center relative cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <FileText size={26} className="text-amber-600 mx-auto mb-1" />
                  <p className="font-semibold text-slate-700 text-sm">
                    {formData.file ? formData.file.name : 'Select new PDF file to overwrite existing document'}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-amber-600 text-white font-semibold rounded-lg shadow-2xs hover:bg-amber-700 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Pencil size={18} />}
                  <span>{isSubmitting ? 'Saving...' : 'Update Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW / PREVIEW BULLETIN MODAL */}
      {selectedBulletin && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full h-[85vh] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-4 px-6 flex items-center justify-between text-white shrink-0">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Sabbath Date: {selectedBulletin.sabbathDate || selectedBulletin.sabbath_date}
                </span>
                <h3 className="font-bold text-lg mt-0.5">{selectedBulletin.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedBulletin(null)} 
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X size={24} />
              </button>
            </div>

            {/* Embedded PDF Preview */}
            <div className="flex-1 bg-slate-100 relative">
              <iframe
                src={selectedBulletin.fileUrl || selectedBulletin.file_url || selectedBulletin.file}
                title={selectedBulletin.title}
                className="w-full h-full border-none"
              />
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-sm text-slate-500 font-medium">
                Uploaded by <span className="font-semibold text-slate-800">{activeUserName}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleWhatsAppShare(selectedBulletin)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition cursor-pointer"
                >
                  <Send size={15} />
                  <span>Share via WhatsApp</span>
                </button>
                <a
                  href={selectedBulletin.fileUrl || selectedBulletin.file_url || selectedBulletin.file}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-4 rounded-lg text-sm transition cursor-pointer"
                >
                  <Download size={15} />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Communication;