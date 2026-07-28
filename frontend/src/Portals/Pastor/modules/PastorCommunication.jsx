import React, { useState, useEffect } from 'react';
import API from '../../../api/api';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  Eye, 
  X, 
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

const PastorCommunication = () => {
  // Data & State Management
  const [bulletins, setBulletins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [selectedBulletin, setSelectedBulletin] = useState(null);

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBulletins();
  }, [selectedYear]);

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
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Communication Hub</h1>
            
          </div>
          
        </div>
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
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={22} className="animate-spin text-emerald-600" />
                      <span>Loading bulletins...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedBulletins.length > 0 ? (
                paginatedBulletins.map((bulletin) => {
                  const rawUser = bulletin.uploadedBy || bulletin.uploaded_by;
                  const displayUser = (typeof rawUser === 'object' && rawUser?.name) 
                    ? rawUser.name 
                    : (typeof rawUser === 'string' && isNaN(rawUser)) 
                      ? rawUser 
                      : 'Church Clerk';

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
                  <td colSpan="5" className="py-12 text-center text-slate-400">
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
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <a
                href={selectedBulletin.fileUrl || selectedBulletin.file_url || selectedBulletin.file}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition cursor-pointer"
              >
                <Download size={15} />
                <span>Download PDF</span>
              </a>
              <button
                onClick={() => setSelectedBulletin(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-sm transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PastorCommunication;