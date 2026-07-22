import React from 'react';
import { 
  LayoutGrid, 
  Users, 
  Droplets, 
  Baby, 
  ClipboardList, 
  Building2, 
  Megaphone, 
  LogOut,
  Church
} from 'lucide-react';

const ClerkSidebar = ({ activeTab, setActiveTab, onLogout, kpiStats, userRole = 'Church Clerk' }) => {
  const menuItems = [
    { 
      id: 'analytics', 
      label: 'Overview & Analytics', 
      icon: <LayoutGrid size={20} />
    },
    { 
      id: 'membership', 
      label: 'Membership Records', 
      icon: <Users size={20} />, 
      
    },
    { 
      id: 'baptisms', 
      label: 'Baptisms', 
      icon: <Droplets size={20} />
    },
    { 
      id: 'dedications', 
      label: 'Child Dedications', 
      icon: <Baby size={20} />
    },
    { 
      id: 'meetings', 
      label: 'Meetings Records', 
      icon: <ClipboardList size={20} />
    },
    { 
      id: 'departments', 
      label: 'Departments & TORs', 
      icon: <Building2 size={20} />
    },
    { 
      id: 'communication', 
      label: 'Communication Hub', 
      icon: <Megaphone size={20} />
    }
  ];

  return (
    <aside className="w-80 bg-[#020617] h-screen flex flex-col justify-between p-6 border-r border-slate-800 flex-shrink-0 shadow-2xl font-sans">
      <div>
        {/* Branding Header */}
        <div className="flex items-center gap-3.5 mb-10 px-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Church size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wider uppercase leading-none">
              NEWLIFE <span className="text-emerald-400">CCIS</span>
            </h1>
            <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest mt-1.5">
              Clerk Portal
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-2.5">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25 scale-[1.02]' 
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white font-bold'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={isActive ? 'text-slate-950' : 'text-slate-400'}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-extrabold tracking-wide uppercase truncate">
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sign Out Button */}
      <div className="pt-6 border-t border-slate-800/80">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white font-black text-xs uppercase tracking-wider transition-all duration-200 border border-rose-500/20 cursor-pointer"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default ClerkSidebar;