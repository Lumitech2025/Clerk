import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Share2, 
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
  FileUp
} from 'lucide-react';

const Communication = () => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState(null);
  const [notification, setNotification] = useState(null);

  // --- SAMPLE BULLETIN DATA ---
  const [bulletins, setBulletins] = useState([
    {
      id: 1,
      sabbathDate: '2026-07-25',
      title: 'Sabbath Bulletin - July 25, 2026',
      fileName: 'Newlife_Bulletin_25_Jul_2026.pdf',
      fileSize: '2.4 MB',
      fileUrl: '#',
      uploadedBy: 'Church Clerk',
      uploadDate: '2026-07-24'
    },
    {
      id: 2,
      sabbathDate: '2026-07-18',
      title: 'Sabbath Bulletin - July 18, 2026',
      fileName: 'Newlife_Bulletin_18_Jul_2026.pdf',
      fileSize: '2.1 MB',
      fileUrl: '#',
      uploadedBy: 'Church Clerk',
      uploadDate: '2026-07-17'
    },
    {
      id: 3,
      sabbathDate: '2026-07-11',
      title: 'Sabbath Bulletin - July 11, 2026',
      fileName: 'Newlife_Bulletin_11_Jul_2026.pdf',
      fileSize: '1.9 MB',
      fileUrl: '#',
      uploadedBy: 'Church Clerk',
      uploadDate: '2026-07-10'
    },
    {
      id: 4,
      sabbathDate: '2026-07-04',
      title: 'Sabbath Bulletin - July 04, 2026',
      fileName: 'Newlife_Bulletin_04_Jul_2026.pdf',
      fileSize: '2.8 MB',
      fileUrl: '#',
      uploadedBy: 'Church Clerk',
      uploadDate: '2026-07-03'
    }
  ]);

  // --- UPLOAD FORM STATE ---
  const [uploadForm, setUploadForm] = useState({
    sabbathDate: '',
    title: '',
    file: null,
    shareToWhatsappImmediately: true
  });

  // Trigger Notification Toast
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper: Share Bulletin via WhatsApp
  const handleWhatsAppShare = (bulletin) => {
    const formattedDate = new Date(bulletin.sabbathDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const message = 
      `*NEWLIFE SDA CHURCH - WEEKLY BULLETIN*\n` +
      `📅 *Sabbath Date:* ${formattedDate}\n` +
      `📄 *Title:* ${bulletin.title}\n\n` +
      `Greetings saints! Please find the official church bulletin for this Sabbath attached below or download it directly using the link:\n` +
      `🔗 ${window.location.origin}/bulletins/${bulletin.fileName}\n\n` +
      `Blessed Sabbath! 🙏✨`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    showToast(`WhatsApp broadcast initiated for ${bulletin.sabbathDate}`);
  };

  // Submit Upload Form
  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.sabbathDate) return;

    const formattedDateStr = new Date(uploadForm.sabbathDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const newBulletin = {
      id: Date.now(),
      sabbathDate: uploadForm.sabbathDate,
      title: uploadForm.title || `Sabbath Bulletin - ${formattedDateStr}`,
      fileName: uploadForm.file.name,
      fileSize: `${(uploadForm.file.size / (1024 * 1024)).toFixed(1)} MB`,
      fileUrl: URL.createObjectURL(uploadForm.file),
      uploadedBy: 'Church Clerk',
      uploadDate: new Date().toISOString().split('T')[0]
    };

    setBulletins([newBulletin, ...bulletins]);
    setIsUploadModalOpen(false);

    showToast('Bulletin uploaded successfully!');

    if (uploadForm.shareToWhatsappImmediately) {
      setTimeout(() => handleWhatsAppShare(newBulletin), 500);
    }

    setUploadForm({
      sabbathDate: '',
      title: '',
      file: null,
      shareToWhatsappImmediately: true
    });
  };

  // Filter & Pagination Logic
  const filteredBulletins = bulletins.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.sabbathDate.includes(searchTerm);
    const matchesYear = b.sabbathDate.startsWith(selectedYear);
    return matchesSearch && matchesYear;
  });

  const totalPages = Math.ceil(filteredBulletins.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBulletins = filteredBulletins.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased">
      
      {/* TOAST NOTIFICATION */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-base animate-bounce">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <span>{notification}</span>
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
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-base font-semibold transition cursor-pointer shadow-xs self-start md:self-auto"
        >
          <Upload size={20} />
          <span>Upload Weekly Bulletin</span>
        </button>
      </div>

      {/* SEARCH, FILTER & WHATSAPP QUICK ACTION BAR */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          
          {/* Search Bar */}
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

          {/* Year Filter */}
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

        {/* Quick Info Box */}
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
              {paginatedBulletins.length > 0 ? (
                paginatedBulletins.map((bulletin) => (
                  <tr key={bulletin.id} className="hover:bg-slate-50/80 transition">
                    
                    {/* Sabbath Date */}
                    <td className="py-4.5 px-6 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-emerald-600" />
                        <span>{bulletin.sabbathDate}</span>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="py-4.5 px-6 font-bold text-slate-800 text-base">
                      {bulletin.title}
                    </td>

                    {/* File Specs */}
                    <td className="py-4.5 px-6 text-sm text-slate-500">
                      <div className="font-semibold text-slate-700 text-base">{bulletin.fileName}</div>
                      <div>{bulletin.fileSize}</div>
                    </td>

                    {/* Uploaded By */}
                    <td className="py-4.5 px-6 text-sm text-slate-600">
                      <div className="font-medium text-slate-800 text-base">{bulletin.uploadedBy}</div>
                      <div className="text-slate-400">{bulletin.uploadDate}</div>
                    </td>

                    {/* WhatsApp Action Button */}
                    <td className="py-4.5 px-6 text-center">
                      <button
                        onClick={() => handleWhatsAppShare(bulletin)}
                        className="inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-lg font-semibold text-sm transition cursor-pointer"
                        title="Share this bulletin to Church WhatsApp Group"
                      >
                        <Send size={15} className="text-emerald-600" />
                        <span>WhatsApp</span>
                      </button>
                    </td>

                    {/* Action Controls */}
                    <td className="py-4.5 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setSelectedBulletin(bulletin)}
                          className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Preview Bulletin"
                        >
                          <Eye size={20} />
                        </button>

                        <a
                          href={bulletin.fileUrl}
                          download={bulletin.fileName}
                          className="p-2 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Download Bulletin PDF"
                        >
                          <Download size={20} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 text-base">
                    No Sabbath bulletins found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BAR */}
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
              className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer text-slate-700"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 text-sm">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer text-slate-700"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: UPLOAD WEEKLY BULLETIN MODAL                                     */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <h3 className="font-semibold text-lg flex items-center gap-2.5">
                <FileUp className="text-emerald-400" size={22} /> Upload Sabbath Bulletin
              </h3>
              <button 
                onClick={() => setIsUploadModalOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4.5 text-base font-medium text-slate-700">
              
              {/* Sabbath Date Input */}
              <div>
                <label className="block font-semibold mb-1.5 text-slate-800 text-base">Sabbath Date *</label>
                <input
                  type="date"
                  required
                  value={uploadForm.sabbathDate}
                  onChange={(e) => setUploadForm({...uploadForm, sabbathDate: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              {/* Optional Custom Title */}
              <div>
                <label className="block font-semibold mb-1.5 text-slate-800 text-base">Bulletin Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sabbath Bulletin - July 25, 2026"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              {/* Document Dropzone */}
              <div>
                <label className="block font-semibold mb-1.5 text-slate-800 text-base">Upload Bulletin Document (PDF) *</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 hover:bg-slate-100/50 transition text-center cursor-pointer relative">
                  <input
                    type="file"
                    required
                    accept=".pdf"
                    onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <FileText size={30} className="text-emerald-600 mb-1" />
                    <p className="text-base font-semibold text-slate-700">
                      {uploadForm.file ? uploadForm.file.name : 'Click to select or drop Bulletin PDF'}
                    </p>
                    <p className="text-sm text-slate-400">PDF document up to 15MB</p>
                  </div>
                </div>
              </div>

              {/* Checkbox: Auto WhatsApp Share */}
              <div className="pt-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="whatsappCheck"
                  checked={uploadForm.shareToWhatsappImmediately}
                  onChange={(e) => setUploadForm({...uploadForm, shareToWhatsappImmediately: e.target.checked})}
                  className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="whatsappCheck" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Prompt WhatsApp Share immediately after upload
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-base font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold rounded-lg shadow-2xs cursor-pointer transition flex items-center gap-2"
                >
                  <Upload size={18} />
                  <span>Upload Bulletin</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BULLETIN PREVIEW & SHARE MODAL                                   */}
      {/* ========================================================================= */}
      {selectedBulletin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Sabbath Date: {selectedBulletin.sabbathDate}
                </span>
                <h3 className="font-bold text-lg mt-0.5">{selectedBulletin.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedBulletin(null)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>

            {/* Body Preview */}
            <div className="p-6 space-y-4 bg-slate-50">
              <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <FileText size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">{selectedBulletin.fileName}</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Size: {selectedBulletin.fileSize} | Uploaded by {selectedBulletin.uploadedBy} on {selectedBulletin.uploadDate}
                  </p>
                </div>
              </div>

              {/* Action Buttons inside Preview */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleWhatsAppShare(selectedBulletin)}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition cursor-pointer shadow-2xs"
                >
                  <Send size={16} />
                  <span>Send to WhatsApp Group</span>
                </button>

                <a
                  href={selectedBulletin.fileUrl}
                  download={selectedBulletin.fileName}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl text-sm transition cursor-pointer shadow-2xs"
                >
                  <Download size={16} />
                  <span>Download Document</span>
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedBulletin(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg cursor-pointer transition"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Communication;