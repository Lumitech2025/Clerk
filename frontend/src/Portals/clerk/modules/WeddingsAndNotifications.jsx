import React, { useState, useEffect, useCallback } from 'react';
import API from '../../../api/api';
import { 
  Heart, 
  PlusCircle, 
  Search, 
  FileText, 
  Calendar, 
  Loader2, 
  RefreshCw, 
  Printer,
  ChevronRight,
  User,
  Paperclip,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const WeddingsAndNotifications = () => {
  const [activeTab, setActiveTab] = useState('registry'); 
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [selectedWeddingForPrint, setSelectedWeddingForPrint] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload State for attachments
  const [files, setFiles] = useState({
    groom_consent: null,
    bride_consent: null,
    recommendation_letter: null,
  });

  // Initial Empty Form State
  const initialFormState = {
    // 1. Applicant (Groom/Bride)
    applicant_name: '',
    applicant_membership: 'NEWLIFE SDA CHURCH, 5TH AVENUE',
    applicant_dob: '',
    applicant_occupation: '',
    applicant_phone: '',
    applicant_address: '',
    applicant_signature_date: new Date().toISOString().split('T')[0],
    
    // 2. Spouse Particulars
    spouse_name: '',
    spouse_church: '',
    spouse_conference: '',
    spouse_membership_no: 'N/A',
    spouse_dob: '',
    spouse_occupation: '',
    spouse_phone: '',
    spouse_address: '',
    spouse_signature_date: new Date().toISOString().split('T')[0],

    // 3. Event & Officiating Details
    wedding_date: '',
    wedding_place: 'NEWLIFE SDA CHURCH',
    officiating_pastor: '',
    counseling_pastor: '',
    officiating_elder: '',
    reception_venue: '',

    // 4. Clerk Receipt Details
    notice_received_by: '',
    notice_received_date: new Date().toISOString().split('T')[0],

    // Checklist Flags
    has_applicant_parent_consent: false,
    has_spouse_parent_consent: false,
    has_recommendation_letter: false,

    // Board Action Status
    status: 'PENDING',
    board_action_date: '',
    board_recommendations: '',
    board_chairman_signature: '',
  };

  const [form, setForm] = useState(initialFormState);

  // Fetch real data directly from the Django backend API
  const fetchWeddings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get('weddings/');
      // Handles both paginated responses (response.data.results) and flat arrays (response.data)
      const data = response.data.results ? response.data.results : response.data;
      setWeddings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load weddings:', err);
      setError('Unable to retrieve wedding records from server. Please check your network connection.');
      setWeddings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeddings();
  }, [fetchWeddings]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
      
      if (name === 'groom_consent') setForm(prev => ({ ...prev, has_applicant_parent_consent: true }));
      if (name === 'bride_consent') setForm(prev => ({ ...prev, has_spouse_parent_consent: true }));
      if (name === 'recommendation_letter') setForm(prev => ({ ...prev, has_recommendation_letter: true }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (form[key] !== null && form[key] !== undefined) {
        formData.append(key, form[key]);
      }
    });

    if (files.groom_consent) formData.append('groom_consent_file', files.groom_consent);
    if (files.bride_consent) formData.append('bride_consent_file', files.bride_consent);
    if (files.recommendation_letter) formData.append('recommendation_letter_file', files.recommendation_letter);

    try {
      await API.post('weddings/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Wedding Notification recorded successfully!');
      
      // Reset form states
      setForm(initialFormState);
      setFiles({ groom_consent: null, bride_consent: null, recommendation_letter: null });
      
      await fetchWeddings();
      setActiveTab('registry');
    } catch (err) {
      console.error('Submission error:', err);
      alert('Failed to record Wedding Notification. Please ensure all required fields are filled correctly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = (wedding) => {
    setSelectedWeddingForPrint(wedding);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const filteredWeddings = weddings.filter(w => {
    const search = searchQuery.toLowerCase();
    const matchesSearch = 
      (w.applicant_name && w.applicant_name.toLowerCase().includes(search)) ||
      (w.spouse_name && w.spouse_name.toLowerCase().includes(search)) ||
      (w.officiating_pastor && w.officiating_pastor.toLowerCase().includes(search));
    
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');
        
        .font-roboto {
          font-family: 'Roboto', sans-serif;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          #printable-form, #printable-form * {
            visibility: visible;
          }
          #printable-form {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
          }
        }
      `}</style>

      <div className="space-y-6 text-slate-800 font-roboto print:p-0 print:m-0">
        
        {/* HEADER BAR */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
               Weddings Notifications
            </h2>
            
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchWeddings}
              className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              title="Refresh Registry"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin text-emerald-600' : ''} />
            </button>
            
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('registry')}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition ${
                  activeTab === 'registry' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Weddings Registry
              </button>
              <button
                onClick={() => setActiveTab('new_form')}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition flex items-center gap-2 ${
                  activeTab === 'new_form' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PlusCircle size={16} /> New Notification Form
              </button>
            </div>
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="print:hidden bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
            <AlertCircle size={20} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* NEW NOTIFICATION FORM */}
        {activeTab === 'new_form' && (
          <form onSubmit={handleSubmit} className="print:hidden bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText size={20} className="text-emerald-600" /> New Marriage Notification Form
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* 1. Applicant Particulars */}
              <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-black text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                  <User size={18} /> 1. Applicant Particulars
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="applicant_name"
                      required
                      value={form.applicant_name}
                      onChange={handleInputChange}
                      placeholder="e.g. JARED OKWANY ONYANGO"
                      className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mobile No. *</label>
                      <input
                        type="text"
                        name="applicant_phone"
                        required
                        value={form.applicant_phone}
                        onChange={handleInputChange}
                        placeholder="07..."
                        className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        name="applicant_dob"
                        value={form.applicant_dob}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Occupation</label>
                      <input
                        type="text"
                        name="applicant_occupation"
                        value={form.applicant_occupation}
                        onChange={handleInputChange}
                        placeholder="e.g. NURSE"
                        className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Address / Town</label>
                      <input
                        type="text"
                        name="applicant_address"
                        value={form.applicant_address}
                        onChange={handleInputChange}
                        placeholder="e.g. NGONG"
                        className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Church Membership</label>
                    <input
                      type="text"
                      name="applicant_membership"
                      value={form.applicant_membership}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Particulars of Spouse To Be */}
              <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-black text-rose-800 uppercase tracking-wider flex items-center gap-2">
                  <User size={18} /> 2. Particulars of Spouse to Be
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="spouse_name"
                      required
                      value={form.spouse_name}
                      onChange={handleInputChange}
                      placeholder="e.g. BEATRICE AWUOR NYAKIYA"
                      className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mobile No. *</label>
                      <input
                        type="text"
                        name="spouse_phone"
                        required
                        value={form.spouse_phone}
                        onChange={handleInputChange}
                        placeholder="07..."
                        className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        name="spouse_dob"
                        value={form.spouse_dob}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Home Church *</label>
                      <input
                        type="text"
                        name="spouse_church"
                        required
                        value={form.spouse_church}
                        onChange={handleInputChange}
                        placeholder="e.g. MTONGWE SDA"
                        className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Conference / Field</label>
                      <input
                        type="text"
                        name="spouse_conference"
                        value={form.spouse_conference}
                        onChange={handleInputChange}
                        placeholder="e.g. KENYA COAST FIELD (KCF)"
                        className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Occupation</label>
                      <input
                        type="text"
                        name="spouse_occupation"
                        value={form.spouse_occupation}
                        onChange={handleInputChange}
                        placeholder="TEACHER"
                        className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Membership No.</label>
                      <input
                        type="text"
                        name="spouse_membership_no"
                        value={form.spouse_membership_no}
                        onChange={handleInputChange}
                        placeholder="N/A"
                        className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Address / Town</label>
                      <input
                        type="text"
                        name="spouse_address"
                        value={form.spouse_address}
                        onChange={handleInputChange}
                        placeholder="MOMBASA"
                        className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* 3. Event & Officiating Section */}
            <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-sm font-black text-blue-800 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={18} /> 3. Event & Officiating Details
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Intended Date of Wedding *</label>
                  <input
                    type="date"
                    name="wedding_date"
                    required
                    value={form.wedding_date}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Place of Wedding *</label>
                  <input
                    type="text"
                    name="wedding_place"
                    required
                    value={form.wedding_place}
                    onChange={handleInputChange}
                    placeholder="NEWLIFE CHURCH"
                    className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reception Venue</label>
                  <input
                    type="text"
                    name="reception_venue"
                    value={form.reception_venue}
                    onChange={handleInputChange}
                    placeholder="e.g. MARO GARDENS, KAREN"
                    className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Officiating Pastor *</label>
                  <input
                    type="text"
                    name="officiating_pastor"
                    required
                    value={form.officiating_pastor}
                    onChange={handleInputChange}
                    placeholder="PR. GERALD MOCHOGE"
                    className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Counseling Pastor *</label>
                  <input
                    type="text"
                    name="counseling_pastor"
                    required
                    value={form.counseling_pastor}
                    onChange={handleInputChange}
                    placeholder="PR. GERALD MOCHOGE"
                    className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Officiating Elder *</label>
                  <input
                    type="text"
                    name="officiating_elder"
                    required
                    value={form.officiating_elder}
                    onChange={handleInputChange}
                    placeholder="ELD. INELLHAM OTIENO"
                    className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. Clerk Receipt Details */}
            <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={18} /> 4. Clerk Desk Office Receipt
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Notice Received By (Clerk/Official)</label>
                  <input
                    type="text"
                    name="notice_received_by"
                    value={form.notice_received_by}
                    onChange={handleInputChange}
                    placeholder="Church Clerk Name"
                    className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Received On Date</label>
                  <input
                    type="date"
                    name="notice_received_date"
                    value={form.notice_received_date}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 5. Supporting Documents Upload Section */}
            <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/80 space-y-4">
              <h4 className="text-sm font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                <Paperclip size={18} /> 5. Upload Required Documents
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                
                {/* Groom Consent */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800 text-xs uppercase tracking-wide">
                    1. Groom's Parental Consent
                  </label>
                  <input 
                    type="file" 
                    name="groom_consent" 
                    onChange={handleFileChange} 
                    className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer w-full"
                  />
                  {files.groom_consent && (
                    <p className="text-xs text-emerald-600 font-semibold truncate flex items-center gap-1">
                      ✓ {files.groom_consent.name}
                    </p>
                  )}
                </div>

                {/* Bride Consent */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800 text-xs uppercase tracking-wide">
                    2. Bride's Parental Consent
                  </label>
                  <input 
                    type="file" 
                    name="bride_consent" 
                    onChange={handleFileChange} 
                    className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer w-full"
                  />
                  {files.bride_consent && (
                    <p className="text-xs text-emerald-600 font-semibold truncate flex items-center gap-1">
                      ✓ {files.bride_consent.name}
                    </p>
                  )}
                </div>

                {/* Recommendation Letter */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800 text-xs uppercase tracking-wide">
                    3. Recommendation Letter
                  </label>
                  <input 
                    type="file" 
                    name="recommendation_letter" 
                    onChange={handleFileChange} 
                    className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer w-full"
                  />
                  {files.recommendation_letter && (
                    <p className="text-xs text-emerald-600 font-semibold truncate flex items-center gap-1">
                      ✓ {files.recommendation_letter.name}
                    </p>
                  )}
                </div>

              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <ChevronRight size={18} />}
                {isSubmitting ? 'Saving...' : 'Save & Record Notification'}
              </button>
            </div>
          </form>
        )}

        {/* REGISTRY TAB */}
        {activeTab === 'registry' && (
          <div className="print:hidden space-y-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by groom, bride, or pastor name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
                {['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      statusFilter === st ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs">
                      <th className="py-4 px-5">Couple Details</th>
                      <th className="py-4 px-5">Intended Date</th>
                      <th className="py-4 px-5">Venue & Officials</th>
                      <th className="py-4 px-5">Status</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-slate-500">
                          <Loader2 className="animate-spin inline-block mr-2" size={20} />
                          Loading wedding records...
                        </td>
                      </tr>
                    ) : filteredWeddings.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-slate-500">
                          No wedding notifications found matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredWeddings.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-4 px-5">
                            <p className="font-bold text-slate-900 text-base">{w.applicant_name}</p>
                            <p className="font-bold text-rose-600 text-xs">{w.spouse_name}</p>
                          </td>
                          <td className="py-4 px-5 text-sm font-semibold">{w.wedding_date}</td>
                          <td className="py-4 px-5 text-xs space-y-0.5">
                            <p className="text-slate-800 font-bold">{w.wedding_place}</p>
                            <p className="text-slate-500">Pastor: {w.officiating_pastor}</p>
                          </td>
                          <td className="py-4 px-5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                              w.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 
                              w.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {w.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <button
                              onClick={() => handlePrint(w)}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Printer size={15} /> Print Form
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* COMPLETE PRINTABLE DOCUMENT MATCHING FORM TEMPLATE EXACTLY */}
      {selectedWeddingForPrint && (
        <div id="printable-form" className="hidden print:block font-serif text-black max-w-3xl mx-auto space-y-4">
          <div className="text-center space-y-1 border-b-2 border-black pb-3">
            <h1 className="text-lg font-bold uppercase tracking-wider">NEWLIFE SEVENTH-DAY ADVENTIST CHURCH</h1>
            <p className="text-[10px] uppercase tracking-widest font-sans font-semibold">5TH AVENUE, NAIROBI • CHURCH CLERK DESK</p>
            <h2 className="text-sm font-bold underline mt-2 uppercase font-sans">WEDDING NOTIFICATION FORM</h2>
          </div>

          <div className="text-xs space-y-2 font-mono leading-relaxed">
            <p>1. Full name of applicant: <span className="font-bold underline">{selectedWeddingForPrint.applicant_name}</span></p>
            <p>2. Church membership: <span className="font-bold underline">{selectedWeddingForPrint.applicant_membership || 'NEWLIFE SDA CHURCH, 5TH AVENUE'}</span></p>
            <p>3. Date of birth: <span className="font-bold underline">{selectedWeddingForPrint.applicant_dob || '—'}</span></p>
            <p>4. Occupation: <span className="font-bold underline">{selectedWeddingForPrint.applicant_occupation || '—'}</span></p>
            <p>5. Mobile number: <span className="font-bold underline">{selectedWeddingForPrint.applicant_phone}</span></p>
            <p>6. Address: <span className="font-bold underline">{selectedWeddingForPrint.applicant_address || '—'}</span></p>
            <p>7. Intended date of wedding: <span className="font-bold underline">{selectedWeddingForPrint.wedding_date}</span></p>
            <p>8. Place of wedding: <span className="font-bold underline">{selectedWeddingForPrint.wedding_place}</span></p>
            <p>9. The officiating pastor: <span className="font-bold underline">{selectedWeddingForPrint.officiating_pastor}</span></p>
            <p>10. The counseling pastor: <span className="font-bold underline">{selectedWeddingForPrint.counseling_pastor || selectedWeddingForPrint.officiating_pastor}</span></p>
            <p>11. The officiating elder: <span className="font-bold underline">{selectedWeddingForPrint.officiating_elder}</span></p>
            <p>12. Wedding reception venue: <span className="font-bold underline">{selectedWeddingForPrint.reception_venue || '—'}</span></p>
            
            <div className="pt-2 flex justify-between">
              <p>13. Signed: ___________________________</p>
              <p>On this date: <span className="font-bold underline">{selectedWeddingForPrint.applicant_signature_date || selectedWeddingForPrint.notification_date || '—'}</span></p>
            </div>

            <div className="border-t border-black my-2"></div>

            <h3 className="font-bold uppercase text-xs text-center my-1 font-sans">PARTICULARS OF SPOUSE TO BE</h3>
            <p>1. Name: <span className="font-bold underline">{selectedWeddingForPrint.spouse_name}</span></p>
            <p>2. Name of church where membership is: <span className="font-bold underline">{selectedWeddingForPrint.spouse_church}</span></p>
            <p>3. Conference or field: <span className="font-bold underline">{selectedWeddingForPrint.spouse_conference || '—'}</span></p>
            <p>4. Membership number if in Newlife: <span className="font-bold underline">{selectedWeddingForPrint.spouse_membership_no || 'N/A'}</span></p>
            <p>5. Date of birth: <span className="font-bold underline">{selectedWeddingForPrint.spouse_dob || '—'}</span></p>
            <p>6. Occupation: <span className="font-bold underline">{selectedWeddingForPrint.spouse_occupation || '—'}</span></p>
            <p>7. Mobile Number: <span className="font-bold underline">{selectedWeddingForPrint.spouse_phone}</span></p>
            <p>8. Address: <span className="font-bold underline">{selectedWeddingForPrint.spouse_address || '—'}</span></p>

            <div className="pt-2 flex justify-between">
              <p>9. Signed: ___________________________</p>
              <p>On this date: <span className="font-bold underline">{selectedWeddingForPrint.spouse_signature_date || selectedWeddingForPrint.notification_date || '—'}</span></p>
            </div>

            <div className="border-t border-black my-2"></div>

            <div className="flex justify-between font-mono">
              <p>This notice was received by: <span className="font-bold underline">{selectedWeddingForPrint.notice_received_by || '___________________________'}</span></p>
              <p>On this date: <span className="font-bold underline">{selectedWeddingForPrint.notice_received_date || '___________________'}</span></p>
            </div>
          </div>

          <div className="border-t border-black pt-2 text-[9px] font-sans italic text-slate-700">
            <p>This notice must be given to the church at least three months in advance to give the church ample time to prepare the applicants for a decent and acceptable church wedding. The preparation involves prayer and counseling. The applicants are supposed to choose the officiating Pastor and Elder. The elder must be a serving Elder of Newlife SDA Church.</p>
          </div>

          <div className="border border-black p-2 space-y-1 text-[11px] font-mono">
            <p className="font-bold text-center font-sans uppercase">FOR OFFICIAL USE ONLY</p>
            <p>Action taken by the Newlife SDA Church board on Date: ____________________</p>
            <p>Status: [ {selectedWeddingForPrint.status === 'APPROVED' ? 'X' : ' '} ] Approved &nbsp;&nbsp;&nbsp;&nbsp; [ {selectedWeddingForPrint.status === 'REJECTED' ? 'X' : ' '} ] Not approved</p>
            <p>Signed by the Chairman of the board: ____________________________</p>
            <p>Recommendations: _______________________________________________________</p>
          </div>
        </div>
      )}
    </>
  );
};

export default WeddingsAndNotifications;