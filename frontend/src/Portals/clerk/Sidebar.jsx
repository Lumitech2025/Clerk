import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaUsers, 
  FaWater, 
  FaBaby, 
  FaClipboardList, 
  FaBuilding, 
  FaBullhorn, 
  FaSignOutAlt, 
  FaCross 
} from 'react-icons/fa';

/**
 * Shared Visual Theme Standards (Apply consistently across all 6 role sidebars)
 * - Background: Deep Navy (#0F172A)
 * - Active Accent: Royal Blue (#2563EB)
 * - Typography: Inter / Sans-serif, Clean Tracking, High Contrast
 */
const ClerkSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Clear JWT Auth Tokens & User State
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // 2. Redirect to Login Route
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Membership Records',
      path: '/clerk/membership',
      icon: <FaUsers className="w-5 h-5" />,
      badge: '7,500+' // Reflecting master register scale
    },
    {
      name: 'Baptisms',
      path: '/clerk/baptisms',
      icon: <FaWater className="w-5 h-5" />
    },
    {
      name: 'Child Dedications',
      path: '/clerk/dedications',
      icon: <FaBaby className="w-5 h-5" />
    },
    {
      name: 'Meetings Records',
      path: '/clerk/meetings',
      icon: <FaClipboardList className="w-5 h-5" />
    },
    {
      name: 'Departments',
      path: '/clerk/departments',
      icon: <FaBuilding className="w-5 h-5" />
    },
    {
      name: 'Communication',
      path: '/clerk/communication',
      icon: <FaBullhorn className="w-5 h-5" />
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col justify-between border-r border-slate-800 shadow-xl select-none">
      
      {/* 1. Header / Branding */}
      <div>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/80">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
            <FaCross className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-wide leading-snug">
              CCIS PORTAL
            </h1>
            <p className="text-xs text-blue-400 font-medium tracking-wider uppercase">
              Church Clerk Desk
            </p>
          </div>
        </div>

        {/* 2. Primary Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Main Management
          </p>
          
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200 ease-in-out
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'}
              `}
            >
              <div className="flex items-center gap-3.5">
                <span className="text-slate-400 group-hover:text-white">
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </div>
              
              {item.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* 3. Footer Action & System Branding */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all duration-200 border border-rose-500/20 mb-4"
        >
          <FaSignOutAlt className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        <div className="text-center pt-2 border-t border-slate-800/40">
          <p className="text-xs font-semibold text-slate-400">
            Newlife SDA Church
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">
            Clerk Information System v1.0
          </p>
        </div>
      </div>

    </aside>
  );
};

export default ClerkSidebar;