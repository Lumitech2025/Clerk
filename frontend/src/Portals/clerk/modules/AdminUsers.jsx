import React, { useState, useEffect, useCallback } from 'react';
import API from '../../../api/api';
import { 
  UserPlus, 
  Search, 
  ShieldCheck, 
  Building2, 
  Mail, 
  Phone, 
  Loader2,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const DESIGNATION_CHOICES = [
  { value: 'CLERK', label: 'Church Clerk' },
  { value: 'PASTOR', label: 'Pastor' },
  { value: 'ELDER', label: 'Elder' },
  { value: 'COMMUNICATION', label: 'Communication Officer' },
  { value: 'DEPT_LEADER', label: 'Departmental Leader' },
  { value: 'MEMBER', label: 'Church Member' },
];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    designation: 'ELDER',
    department_name: '',
    password: '',
    confirmPassword: '',
  });

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get('users/');
      setUsers(response.data.results || response.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to fetch user accounts. Make sure you have administrative privileges.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Departments from core API endpoint
  const fetchDepartments = useCallback(async () => {
    setDepartmentsLoading(true);
    try {
      const response = await API.get('departments/');
      setDepartments(response.data.results || response.data || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [fetchUsers, fetchDepartments]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Verify Password Match
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match. Please verify before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Exclude confirmPassword before posting to backend
      const { confirmPassword, ...payload } = form;

      await API.post('users/', payload);
      setIsModalOpen(false);
      setForm({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        designation: 'ELDER',
        department_name: '',
        password: '',
        confirmPassword: '',
      });
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      alert(err.response?.data?.detail || 'Failed to create user. Please check required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                          user.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.designation === roleFilter;
    return matchesSearch && matchesRole;
  });

  const isPasswordMatching = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const isPasswordMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <ShieldCheck className="text-emerald-500" size={30} /> Users
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchUsers}
            className="p-3 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-emerald-600' : ''} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm uppercase tracking-wider rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <UserPlus size={18} /> Add New Official
          </button>
        </div>
      </div>

      {/* Search & Designation Filter Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-normal text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              roleFilter === 'ALL' ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Roles
          </button>
          {DESIGNATION_CHOICES.map(role => (
            <button
              key={role.value}
              onClick={() => setRoleFilter(role.value)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                roleFilter === role.value ? 'bg-emerald-500 text-slate-950' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-xl">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
                <th className="py-4 px-5">User</th>
                <th className="py-4 px-5">User ID</th>
                <th className="py-4 px-5">Designation / Role</th>
                <th className="py-4 px-5">Department</th>
                <th className="py-4 px-5">Email Address</th>
                <th className="py-4 px-5">Phone Number</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Loader2 className="animate-spin inline-block w-8 h-8 mb-2 text-emerald-500" />
                    <p className="font-semibold text-base">Loading User Accounts...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-medium text-base">
                    No system users match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-5 font-bold text-slate-900 text-base">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-md text-xs font-semibold">
                        @{u.username}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
                        u.designation === 'CLERK' ? 'bg-purple-100 text-purple-800' :
                        u.designation === 'PASTOR' ? 'bg-amber-100 text-amber-800' :
                        u.designation === 'ELDER' ? 'bg-blue-100 text-blue-800' :
                        u.designation === 'COMMUNICATION' ? 'bg-teal-100 text-teal-800' :
                        u.designation === 'DEPT_LEADER' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {DESIGNATION_CHOICES.find(c => c.value === u.designation)?.label || u.designation}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      {u.department_name ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-800 font-medium">
                          <Building2 size={16} className="text-slate-400" /> {u.department_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-normal">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail size={15} className="text-slate-400" /> {u.email}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      {u.phone_number ? (
                        <div className="flex items-center gap-2 text-slate-600 font-mono text-xs">
                          <Phone size={15} className="text-slate-400" /> {u.phone_number}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-950 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold tracking-wide">ADD NEW OFFICIAL / USER</h3>
                <p className="text-xs text-slate-400 mt-0.5">Register a leader or staff member to the CCIS system</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={form.first_name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    value={form.last_name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Username (User ID) *</label>
                  <input
                    type="text"
                    name="username"
                    required
                    value={form.username}
                    onChange={handleChange}
                    placeholder="e.g. elder_john"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                    placeholder="+254..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Designation / Role *</label>
                  <select
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    {DESIGNATION_CHOICES.map(choice => (
                      <option key={choice.value} value={choice.value}>{choice.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Assigned Department {form.designation === 'DEPT_LEADER' && '*'}
                </label>
                <select
                  name="department_name"
                  required={form.designation === 'DEPT_LEADER'}
                  value={form.department_name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Select Department --</option>
                  {departmentsLoading ? (
                    <option disabled>Loading departments...</option>
                  ) : (
                    departments.map((dept) => (
                      <option key={dept.id || dept.code} value={dept.name}>
                        {dept.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Password & Confirm Password Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Initial Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className={`w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 focus:outline-none transition-colors ${
                        isPasswordMatching
                          ? 'border-emerald-500 bg-emerald-50/20'
                          : isPasswordMismatch
                          ? 'border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 focus:border-emerald-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Real-time Matching Indicator */}
                  {form.confirmPassword.length > 0 && (
                    <div className="mt-1.5 text-xs flex items-center gap-1 font-semibold">
                      {isPasswordMatching ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Passwords match
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <AlertCircle size={14} /> Passwords do not match
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isPasswordMismatch}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : null}
                  {isSubmitting ? 'Saving...' : 'Save User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;