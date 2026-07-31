import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  User, 
  Building, 
  X, 
  FileCheck2, 
  CalendarDays, 
  Tag,
  Edit3,
  Layers,
  Ban,
  Phone,
  DollarSign,
  Loader2
} from 'lucide-react';
import API from '../../../api/api';

// --- DJANGO BACKEND CHOICE ENUMS ---
const EVENT_STATUSES = [
  { value: 'PROPOSED', label: 'Proposed' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

const DepartmentEventsWorkspace = () => {
  // --- STATES ---
  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All Departments');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Statuses');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null); // For View/Edit Modal

  // Form State for New Event
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    leader_in_charge: '',
    leader_phone: '',
    start_date: '',
    end_date: '',
    start_time: '09:00',
    end_time: '17:00',
    venue: 'Main Sanctuary',
    budget_estimate: '',
    description: '',
    status: 'PROPOSED'
  });

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Fetch departments and events concurrently
      const [deptRes, eventRes] = await Promise.all([
        API.get('/departments/').catch(() => ({ data: [] })),
        API.get('/departmental-events/')
      ]);

      const deptList = Array.isArray(deptRes.data) ? deptRes.data : deptRes.data.results || [];
      const eventList = Array.isArray(eventRes.data) ? eventRes.data : eventRes.data.results || [];

      setDepartments(deptList);
      setEvents(eventList);

      // Pre-select first department in form if available
      if (deptList.length > 0) {
        setFormData(prev => ({
          ...prev,
          department: deptList[0].id,
          leader_in_charge: deptList[0].leader || deptList[0].leader_name || '',
          leader_phone: deptList[0].leader_phone || ''
        }));
      }
    } catch (err) {
      console.error('Failed to fetch events data:', err);
      setErrorMsg('Failed to load events from the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // --- AUTO-POPULATE LEADER ON DEPARTMENT CHANGE (ADD FORM) ---
  const handleDepartmentChange = (deptId) => {
    const selectedDept = departments.find(d => d.id === parseInt(deptId));
    setFormData(prev => ({
      ...prev,
      department: deptId,
      leader_in_charge: selectedDept ? (selectedDept.leader || selectedDept.leader_name || '') : '',
      leader_phone: selectedDept ? (selectedDept.leader_phone || '') : ''
    }));
  };

  // --- AUTO-POPULATE LEADER ON DEPARTMENT CHANGE (EDIT FORM) ---
  const handleEditDepartmentChange = (deptId) => {
    const selectedDept = departments.find(d => d.id === parseInt(deptId));
    setSelectedEvent(prev => ({
      ...prev,
      department: deptId,
      department_name: selectedDept ? selectedDept.name : prev.department_name,
      leader_in_charge: selectedDept ? (selectedDept.leader || selectedDept.leader_name) : prev.leader_in_charge,
      leader_phone: selectedDept ? selectedDept.leader_phone : prev.leader_phone
    }));
  };

  // --- SUBMIT NEW EVENT TO BACKEND ---
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...formData,
      department: parseInt(formData.department),
      end_date: formData.end_date || formData.start_date,
      budget_estimate: formData.budget_estimate ? parseFloat(formData.budget_estimate) : null
    };

    try {
      const res = await API.post('/departmental-events/', payload);
      setEvents(prev => [res.data, ...prev]);
      setIsAddModalOpen(false);
      
      // Reset Form
      setFormData({
        title: '',
        department: departments[0]?.id || '',
        leader_in_charge: departments[0]?.leader || '',
        leader_phone: departments[0]?.leader_phone || '',
        start_date: '',
        end_date: '',
        start_time: '09:00',
        end_time: '17:00',
        venue: 'Main Sanctuary',
        budget_estimate: '',
        description: '',
        status: 'PROPOSED'
      });
    } catch (err) {
      console.error('Error creating event:', err);
      alert('Failed to save event. Please verify required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- UPDATE EXISTING EVENT ON BACKEND ---
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setSubmitting(true);

    const payload = {
      ...selectedEvent,
      department: parseInt(selectedEvent.department),
      budget_estimate: selectedEvent.budget_estimate ? parseFloat(selectedEvent.budget_estimate) : null
    };

    try {
      const res = await API.put(`/departmental-events/${selectedEvent.id}/`, payload);
      setEvents(prev => prev.map(ev => ev.id === selectedEvent.id ? res.data : ev));
      setSelectedEvent(null);
    } catch (err) {
      console.error('Error updating event:', err);
      alert('Failed to update event details.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- STATUS BADGE HELPER ---
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PROPOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
            <Clock size={13} /> Proposed
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
            <CheckCircle2 size={13} /> Approved
          </span>
        );
      case 'ONGOING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 shrink-0">
            <Clock size={13} /> Ongoing
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300 shrink-0">
            <FileCheck2 size={13} /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
            <Ban size={13} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shrink-0">
            {status}
          </span>
        );
    }
  };

  // --- FILTERED EVENTS ---
  const filteredEvents = events.filter(ev => {
    const titleMatch = ev.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const venueMatch = ev.venue?.toLowerCase().includes(searchTerm.toLowerCase());
    const leaderMatch = ev.leader_in_charge?.toLowerCase().includes(searchTerm.toLowerCase());
    const deptNameMatch = ev.department_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSearch = titleMatch || venueMatch || leaderMatch || deptNameMatch;
    
    const matchesDept = selectedDeptFilter === 'All Departments' || ev.department_name === selectedDeptFilter;
    const matchesStatus = selectedStatusFilter === 'All Statuses' || ev.status === selectedStatusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-7 font-sans text-slate-800 antialiased p-6 sm:p-8 bg-slate-100/60 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <CalendarDays className="text-emerald-600" size={36} />
            Departmental Events Calendar
          </h1>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus size={20} /> Schedule New Event
        </button>
      </div>

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-200/60 p-5 rounded-2xl border border-slate-300/70 shadow-2xs">
          <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Total Events</p>
          <p className="text-4xl font-black text-slate-900 mt-2">{events.length}</p>
        </div>

        <div className="bg-amber-100/60 p-5 rounded-2xl border border-amber-300/70 shadow-2xs">
          <p className="text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wider">Proposed</p>
          <p className="text-4xl font-black text-amber-900 mt-2">
            {events.filter(e => e.status === 'PROPOSED').length}
          </p>
        </div>

        <div className="bg-emerald-100/60 p-5 rounded-2xl border border-emerald-300/70 shadow-2xs">
          <p className="text-xs sm:text-sm font-bold text-emerald-800 uppercase tracking-wider">Approved</p>
          <p className="text-4xl font-black text-emerald-900 mt-2">
            {events.filter(e => e.status === 'APPROVED').length}
          </p>
        </div>

        <div className="bg-blue-100/60 p-5 rounded-2xl border border-blue-300/70 shadow-2xs">
          <p className="text-xs sm:text-sm font-bold text-blue-800 uppercase tracking-wider">Completed</p>
          <p className="text-4xl font-black text-blue-900 mt-2">
            {events.filter(e => e.status === 'COMPLETED').length}
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3.5 w-full">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search event, department, venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 text-sm font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="All Departments">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 text-sm font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="All Statuses">All Statuses</option>
            {EVENT_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ERROR MESSAGE DISPLAY */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* LOADING STATE */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
          <p className="font-semibold text-sm">Loading departmental events...</p>
        </div>
      ) : (
        /* EVENT GRID LAYOUT */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((ev) => (
              <div 
                key={ev.id} 
                onClick={() => setSelectedEvent(ev)}
                className="bg-slate-50/90 rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group hover:border-emerald-500/80"
              >
                <div>
                  {/* TOP BAR: STATUS BADGE */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-200/80 truncate">
                      <Layers size={12} /> {ev.department_name || 'Department'}
                    </span>
                    {renderStatusBadge(ev.status)}
                  </div>

                  {/* EVENT TITLE */}
                  <h3 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-emerald-700 transition">
                    {ev.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {ev.description || 'No description provided.'}
                  </p>

                  {/* DETAILS LIST */}
                  <div className="mt-5 space-y-2 text-sm font-medium text-slate-700">
                    <div className="flex items-center gap-2.5">
                      <CalendarIcon size={16} className="text-emerald-600 shrink-0" />
                      <span>{ev.start_date} {ev.start_time ? `(${ev.start_time.slice(0, 5)})` : ''}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <MapPin size={16} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{ev.venue || 'Main Sanctuary'}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <User size={16} className="text-emerald-600 shrink-0" />
                      <span className="truncate">Leader: <strong className="text-slate-900">{ev.leader_in_charge || 'Unassigned'}</strong></span>
                    </div>

                    {ev.budget_estimate && (
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <DollarSign size={16} className="text-emerald-600 shrink-0" />
                        <span>Budget: <strong>KES {parseFloat(ev.budget_estimate).toLocaleString()}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-500 text-base font-medium">
              No departmental events found matching your filter criteria.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SCHEDULE NEW EVENT                                               */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-slate-50 rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* MODAL HEADER */}
            <div className="bg-slate-900 p-5 sm:p-6 flex items-center justify-between text-white shrink-0">
              <div>
                <h3 className="font-extrabold text-lg sm:text-xl">Schedule Department Event</h3>
                <p className="text-sm text-slate-400 mt-0.5">Add an event to the annual departmental calendar</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer transition p-1"
              >
                <X size={22} />
              </button>
            </div>

            {/* MODAL FORM */}
            <form onSubmit={handleCreateEvent} className="p-6 sm:p-7 space-y-5 text-sm font-medium text-slate-700 overflow-y-auto">
              
              {/* Event Title */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5 text-sm">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Youth Camp Meeting"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                />
              </div>

              {/* Department Dropdown */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5 text-sm">Department *</label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition cursor-pointer font-medium"
                >
                  <option value="" disabled>Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Leader in Charge & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5 text-sm">Leader in Charge</label>
                  <input
                    type="text"
                    placeholder="Extracted from department..."
                    value={formData.leader_in_charge}
                    onChange={(e) => setFormData({...formData, leader_in_charge: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1.5 text-sm">Leader Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +254 700 000000"
                    value={formData.leader_phone}
                    onChange={(e) => setFormData({...formData, leader_phone: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                  />
                </div>
              </div>

              {/* Date & Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5 text-sm">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5 text-sm">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5 text-sm">Start Time</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5 text-sm">End Time</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                  />
                </div>
              </div>

              {/* Venue & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5 text-sm">Venue / Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Sanctuary, Kajiado Grounds"
                    value={formData.venue}
                    onChange={(e) => setFormData({...formData, venue: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5 text-sm">Estimated Budget (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 50000"
                    value={formData.budget_estimate}
                    onChange={(e) => setFormData({...formData, budget_estimate: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5 text-sm">Description / Objectives</label>
                <textarea
                  rows="3"
                  placeholder="Summary of goals, target group, or requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                ></textarea>
              </div>

              {/* SUBMIT BUTTONS */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-3 bg-slate-200/80 hover:bg-slate-300/80 text-slate-800 font-bold rounded-xl transition text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Submit Event
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT EVENT DETAILS / UPDATE STATUS                               */}
      {/* ========================================================================= */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-slate-50 rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* MODAL HEADER */}
            <div className="bg-slate-900 p-5 sm:p-6 flex items-center justify-between text-white shrink-0">
              <div>
                <h3 className="font-extrabold text-lg sm:text-xl">Manage Event Details</h3>
                <p className="text-sm text-slate-400 mt-0.5">Update event status or schedule details</p>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)} 
                className="text-slate-400 hover:text-white cursor-pointer transition p-1"
              >
                <X size={22} />
              </button>
            </div>

            {/* EDIT FORM */}
            <form onSubmit={handleUpdateEvent} className="p-6 sm:p-7 space-y-5 text-sm font-medium text-slate-700 overflow-y-auto">
              
              {/* STATUS SELECTOR FIELD */}
              <div className="p-4 bg-emerald-100/60 rounded-xl border border-emerald-300/80">
                <label className="block text-emerald-950 font-extrabold mb-1.5 text-sm">
                  Event Lifecycle Status
                </label>
                <select
                  value={selectedEvent.status}
                  onChange={(e) => setSelectedEvent({...selectedEvent, status: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-emerald-300 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:border-emerald-600 transition cursor-pointer"
                >
                  {EVENT_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5 text-sm">Event Title</label>
                <input
                  type="text"
                  required
                  value={selectedEvent.title}
                  onChange={(e) => setSelectedEvent({...selectedEvent, title: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5 text-sm">Department</label>
                <select
                  value={selectedEvent.department}
                  onChange={(e) => handleEditDepartmentChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition cursor-pointer font-medium"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Leader & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5 text-sm">Leader in Charge</label>
                  <input
                    type="text"
                    value={selectedEvent.leader_in_charge || ''}
                    onChange={(e) => setSelectedEvent({...selectedEvent, leader_in_charge: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1.5 text-sm">Leader Phone</label>
                  <input
                    type="text"
                    value={selectedEvent.leader_phone || ''}
                    onChange={(e) => setSelectedEvent({...selectedEvent, leader_phone: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5 text-sm">Start Date</label>
                  <input
                    type="date"
                    required
                    value={selectedEvent.start_date || ''}
                    onChange={(e) => setSelectedEvent({...selectedEvent, start_date: e.target.value})}
                    className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5 text-sm">End Date</label>
                  <input
                    type="date"
                    value={selectedEvent.end_date || ''}
                    onChange={(e) => setSelectedEvent({...selectedEvent, end_date: e.target.value})}
                    className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                  />
                </div>
              </div>

              {/* Venue & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5 text-sm">Venue / Location</label>
                  <input
                    type="text"
                    required
                    value={selectedEvent.venue || ''}
                    onChange={(e) => setSelectedEvent({...selectedEvent, venue: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5 text-sm">Budget Estimate (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedEvent.budget_estimate || ''}
                    onChange={(e) => setSelectedEvent({...selectedEvent, budget_estimate: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5 text-sm">Description / Brief</label>
                <textarea
                  rows="3"
                  value={selectedEvent.description || ''}
                  onChange={(e) => setSelectedEvent({...selectedEvent, description: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm transition font-medium"
                ></textarea>
              </div>

              {/* ACTIONS */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-5 py-3 bg-slate-200/80 hover:bg-slate-300/80 text-slate-800 font-bold rounded-xl transition text-sm cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default DepartmentEventsWorkspace;