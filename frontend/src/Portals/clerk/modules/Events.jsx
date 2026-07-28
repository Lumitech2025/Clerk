import React, { useState, useEffect } from 'react';
import API from '../../../api/api';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Search, 
  Pencil, 
  Trash2,
  CheckCircle2, 
  Loader2, 
  X, 
  CalendarDays, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Heart
} from 'lucide-react';

const EVENT_CATEGORIES = [
  'Board Meeting',
  'Church Business Meeting',
  'Baptism',
  'Child Dedication',
  'Wedding',
  'Holy Communion',
  'Camp Meeting',
  'Evangelism & Mission',
  'Departmental Event',
  'General Fellowship'
];

const VISIBILITY_ROLES = [
  { id: 'ALL', label: 'All Members & Public' },
  { id: 'BOARD', label: 'Church Board Only' },
  { id: 'ELDERS', label: 'Elders Only' },
  { id: 'LEADERS', label: 'Departmental Leaders Only' },
  { id: 'COMMUNICATION', label: 'Communication Team Only' },
  { id: 'CLERK_PASTOR', label: 'Clerk & Pastors Only' }
];

const Events = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedVisibility, setSelectedVisibility] = useState('ALL');

  // Modal Controls
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form State
  const initialFormState = {
    title: '',
    category: 'Camp Meeting',
    isMultiDay: false,
    startDate: '',
    endDate: '',
    isAllDay: false,
    startTime: '09:00',
    endTime: '12:00',
    venue: 'Main Sanctuary',
    organizer: 'Church Clerk Desk',
    targetAudience: 'ALL',
    description: '',
    groomName: '',
    brideName: '',
    status: 'Upcoming'
  };

  const [formData, setFormData] = useState(initialFormState);

  const showToast = (msg, isError = false) => {
    setNotification({ message: msg, isError });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Fetch Events from Backend Endpoint
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await API.get('/events/?timeframe=upcoming');
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || response.data.data || []);
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events from API:', err);
      showToast('Could not load events from server.', true);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedEvent(null);
    setFormData(initialFormState);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (event) => {
    setModalMode('edit');
    setSelectedEvent(event);
    setFormData({
      title: event.title || '',
      category: event.category || event.event_type || 'Camp Meeting',
      isMultiDay: event.isMultiDay ?? event.is_multi_day ?? false,
      startDate: event.startDate || event.start_date || '',
      endDate: event.endDate || event.end_date || '',
      isAllDay: event.isAllDay ?? event.is_all_day ?? false,
      startTime: event.startTime || event.start_time || '09:00',
      endTime: event.endTime || event.end_time || '12:00',
      venue: event.venue || '',
      organizer: event.organizer || '',
      targetAudience: event.targetAudience || event.target_audience || 'ALL',
      description: event.description || '',
      groomName: event.groomName || event.groom_name || '',
      brideName: event.brideName || event.bride_name || '',
      status: event.status || 'Upcoming'
    });
    setIsFormModalOpen(true);
  };

  // 2. Create or Update Event
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate) {
      showToast('Please fill in the event title and start date.', true);
      return;
    }

    if (formData.isMultiDay && !formData.endDate) {
      showToast('Please specify the end date for multi-day events.', true);
      return;
    }

    if (formData.category === 'Wedding' && (!formData.groomName || !formData.brideName)) {
      showToast('Please provide both Bride and Groom names for wedding events.', true);
      return;
    }

    setIsSubmitting(true);

    const payload = {
        title: formData.title,
        eventType: formData.category,
        targetAudience: formData.targetAudience,
        status: formData.status,
        isMultiDay: formData.isMultiDay,
        isAllDay: formData.isAllDay,
        startDate: formData.startDate,
        endDate: formData.isMultiDay ? formData.endDate : formData.startDate,
        startTime: formData.isAllDay ? null : formData.startTime,
        endTime: formData.isAllDay ? null : formData.endTime,
        venue: formData.venue,
        organizer: formData.organizer,
        description: formData.description,
        groomName: formData.category === 'Wedding' ? formData.groomName : '',
        brideName: formData.category === 'Wedding' ? formData.brideName : ''
        };

    try {
      if (modalMode === 'create') {
        const response = await API.post('/events/', payload);
        const newEvent = response.data.data || response.data;
        setEvents(prev => [...prev, newEvent]);
        showToast('Event created successfully!');
      } else {
        const id = selectedEvent.id || selectedEvent._id;
        const response = await API.patch(`/events/${id}/`, payload);
        const updated = response.data.data || response.data;
        setEvents(prev => prev.map(item => (item.id === id || item._id === id) ? updated : item));
        showToast('Event updated successfully!');
      }
      setIsFormModalOpen(false);
      setFormData(initialFormState);
      fetchEvents(); 
    } catch (err) {
      console.error('Failed to save event:', err);
      showToast('Failed to save event. Check fields and retry.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Delete Event
  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await API.delete(`/events/${id}/`);
      setEvents(prev => prev.filter(item => (item.id !== id && item._id !== id)));
      showToast('Event removed successfully.');
      if (isDetailsModalOpen) setIsDetailsModalOpen(false);
    } catch (err) {
      console.error('Failed to delete event:', err);
      showToast('Failed to delete event.', true);
    }
  };

  // Search & Filter Sorting
  const filteredEvents = events
    .filter(event => {
      const title = event.title || '';
      const category = event.category || event.event_type || '';
      const audience = event.targetAudience || event.target_audience || 'ALL';

      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || category === selectedCategory;
      const matchesVisibility = selectedVisibility === 'ALL' || audience === selectedVisibility;

      return matchesSearch && matchesCategory && matchesVisibility;
    })
    .sort((a, b) => new Date(a.startDate || a.start_date) - new Date(b.startDate || b.start_date));

  const renderFormattedDateRange = (event) => {
    const start = event.startDate || event.start_date;
    const end = event.endDate || event.end_date;
    const isMulti = event.isMultiDay || event.is_multi_day;

    if (isMulti && end && start !== end) {
      return `${start} to ${end}`;
    }
    return start;
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 antialiased">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-base ${
          notification.isError ? 'bg-rose-900' : 'bg-slate-900'
        }`}>
          <CheckCircle2 size={20} className={notification.isError ? 'text-rose-400' : 'text-emerald-400'} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Upcoming Events</h1>
          
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-base font-semibold transition cursor-pointer shadow-xs"
        >
          <Plus size={20} />
          <span>Schedule New Event</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search event title or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-base font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="ALL">All Event Categories</option>
            {EVENT_CATEGORIES.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedVisibility}
            onChange={(e) => setSelectedVisibility(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-base font-semibold rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="ALL">All Visibility Roles</option>
            {VISIBILITY_ROLES.map((role) => (
              <option key={role.id} value={role.id}>{role.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 bg-emerald-50 px-4 py-2.5 rounded-lg border border-emerald-200 w-full lg:w-auto justify-center">
          <CalendarDays size={18} className="text-emerald-600" />
          <span>{filteredEvents.length} Upcoming Events Scheduled</span>
        </div>
      </div>

      {/* Streamlined Events Table/Card List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200/80">
            <Loader2 size={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">Loading upcoming schedule...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((item) => {
            const isMulti = item.isMultiDay || item.is_multi_day;
            const isAllDay = item.isAllDay || item.is_all_day;
            const audienceTag = VISIBILITY_ROLES.find(r => r.id === (item.targetAudience || item.target_audience))?.label || 'All Members';
            const category = item.category || item.event_type;
            const groom = item.groomName || item.groom_name;
            const bride = item.brideName || item.bride_name;
            const id = item.id || item._id;

            return (
              <div 
                key={id} 
                className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden"
              >
                {/* Visual indicator bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                  isMulti ? 'bg-amber-500' : category === 'Wedding' ? 'bg-rose-500' : 'bg-emerald-600'
                }`} />

                {/* Date Badge + Compact Summary */}
                <div className="flex items-center gap-4 pl-3">
                  <div className="bg-slate-900 text-white py-2 px-3.5 rounded-xl text-center min-w-[75px] shrink-0 border border-slate-800">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      {new Date(item.startDate || item.start_date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="block text-2xl font-black leading-none my-0.5">
                      {new Date(item.startDate || item.start_date).getDate()}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-semibold">
                      {new Date(item.startDate || item.start_date).getFullYear()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-md uppercase">
                        {category}
                      </span>
                      {isMulti && (
                        <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Sparkles size={12} /> Multi-Day
                        </span>
                      )}
                      <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200">
                        <ShieldCheck size={13} className="text-slate-500" /> {audienceTag}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pt-0.5">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-emerald-600" />
                        <span>{renderFormattedDateRange(item)}</span>
                      </div>

                      {!isAllDay && (
                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-emerald-600" />
                          <span>{(item.startTime || item.start_time)} - {(item.endTime || item.end_time)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-emerald-600" />
                        <span>{item.venue}</span>
                      </div>

                      {category === 'Wedding' && groom && bride && (
                        <div className="flex items-center gap-1 text-rose-600 font-bold">
                          <Heart size={14} className="text-rose-500 fill-rose-500" />
                          <span>{groom} & {bride}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Users size={14} className="text-slate-400" />
                        <span>{item.organizer}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center pl-3 md:pl-0 border-t md:border-t-0 border-slate-100 pt-2 md:pt-0 w-full md:w-auto justify-end">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Edit Event"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() => handleDeleteEvent(id)}
                    className="p-2 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Delete Event"
                  >
                    <Trash2 size={18} />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedEvent(item);
                      setIsDetailsModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer"
                  >
                    <span>Details</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200/80 text-slate-400 font-medium">
            No upcoming events.
          </div>
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white shrink-0">
              <h3 className="font-semibold text-lg flex items-center gap-2.5">
                <CalendarDays className="text-emerald-400" size={22} />
                {modalMode === 'create' ? 'Schedule New Event' : 'Edit Event Record'}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-base font-medium text-slate-700 overflow-y-auto">
              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Camp Meeting / Holy Matrimony"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1.5 text-slate-800">Event Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    {EVENT_CATEGORIES.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1.5 text-slate-800">Target Audience (RBAC) *</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    {VISIBILITY_ROLES.map((role) => (
                      <option key={role.id} value={role.id}>{role.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Wedding Fields */}
              {formData.category === 'Wedding' && (
                <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-rose-900 mb-1">Groom's Full Name *</label>
                    <input
                      type="text"
                      required={formData.category === 'Wedding'}
                      placeholder="e.g. Samuel Kimani"
                      value={formData.groomName}
                      onChange={(e) => setFormData({...formData, groomName: e.target.value})}
                      className="w-full px-4 py-2 bg-white border border-rose-200 rounded-lg focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-rose-900 mb-1">Bride's Full Name *</label>
                    <input
                      type="text"
                      required={formData.category === 'Wedding'}
                      placeholder="e.g. Sarah Mwangi"
                      value={formData.brideName}
                      onChange={(e) => setFormData({...formData, brideName: e.target.value})}
                      className="w-full px-4 py-2 bg-white border border-rose-200 rounded-lg focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Multi-Day Event</div>
                    <div className="text-[11px] text-slate-500">Spans multiple consecutive days</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isMultiDay}
                    onChange={(e) => setFormData({...formData, isMultiDay: e.target.checked})}
                    className="w-5 h-5 accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Whole Day Event</div>
                    <div className="text-[11px] text-slate-500">No specific start/end hour</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isAllDay}
                    onChange={(e) => setFormData({...formData, isAllDay: e.target.checked})}
                    className="w-5 h-5 accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1.5 text-slate-800">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {formData.isMultiDay && (
                  <div>
                    <label className="block font-semibold mb-1.5 text-slate-800">End Date *</label>
                    <input
                      type="date"
                      required={formData.isMultiDay}
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Times & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {!formData.isAllDay && (
                  <>
                    <div>
                      <label className="block font-semibold mb-1.5 text-slate-800">Start Time</label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1.5 text-slate-800">End Time</label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </>
                )}

                <div className={formData.isAllDay ? "sm:col-span-3" : ""}>
                  <label className="block font-semibold mb-1.5 text-slate-800">Venue / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Sanctuary"
                    value={formData.venue}
                    onChange={(e) => setFormData({...formData, venue: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Organized By / Host</label>
                <input
                  type="text"
                  placeholder="e.g. Pastoral Desk, Family Life Ministry"
                  value={formData.organizer}
                  onChange={(e) => setFormData({...formData, organizer: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-slate-800">Event Description / Agenda</label>
                <textarea
                  rows="3"
                  placeholder="Provide additional details or order of service for this event..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg shadow-2xs hover:bg-emerald-700 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  <span>{isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Save Event' : 'Update Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && isDetailsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
              <span className="bg-emerald-500 text-xs font-bold px-2.5 py-1 rounded uppercase">
                {selectedEvent.category || selectedEvent.event_type}
              </span>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 leading-snug">{selectedEvent.title}</h2>

              {(selectedEvent.category === 'Wedding' || selectedEvent.event_type === 'Wedding') && (selectedEvent.groomName || selectedEvent.groom_name) && (
                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-center gap-3 text-rose-900">
                  <Heart className="text-rose-500 fill-rose-500 shrink-0" size={20} />
                  <div>
                    <div className="text-xs uppercase font-extrabold tracking-wider text-rose-500">Groom & Bride</div>
                    <div className="text-base font-bold">
                      {selectedEvent.groomName || selectedEvent.groom_name} & {selectedEvent.brideName || selectedEvent.bride_name}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm font-semibold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <Calendar size={18} className="text-emerald-600 shrink-0" />
                  <span>Dates: {renderFormattedDateRange(selectedEvent)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock size={18} className="text-emerald-600 shrink-0" />
                  <span>
                    Time: {(selectedEvent.isAllDay || selectedEvent.is_all_day) 
                      ? 'Whole Day Event' 
                      : `${selectedEvent.startTime || selectedEvent.start_time} - ${selectedEvent.endTime || selectedEvent.end_time}`}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin size={18} className="text-emerald-600 shrink-0" />
                  <span>Venue: {selectedEvent.venue}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Users size={18} className="text-emerald-600 shrink-0" />
                  <span>Organized By: {selectedEvent.organizer}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description & Agenda</h4>
                <p className="text-slate-700 text-base leading-relaxed bg-white p-3 rounded-lg border border-slate-100 whitespace-pre-line">
                  {selectedEvent.description || 'No description provided.'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm cursor-pointer"
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

export default Events;