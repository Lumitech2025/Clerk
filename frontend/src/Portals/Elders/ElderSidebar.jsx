import React from 'react';
import { 
  LayoutGrid, 
  Users, 
  Heart, 
  ClipboardList, 
  BookOpen, 
  FileBarChart, 
  LogOut, 
  ShieldCheck,
  Baby
} from 'lucide-react';

const ElderSidebar = ({ activeTab, setActiveTab, onLogout, userRole = 'Elders Board' }) => {
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Home', 
      icon: <LayoutGrid size={20} /> 
    },
    { 
      id: 'membership', 
      label: 'Membership Records', 
      icon: <Users size={20} /> 
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
      label: 'Departments', 
      icon: <BookOpen size={20} /> 
    },
    { 
      id: 'communication', 
      label: 'Communication Hub', 
      icon: <Heart size={20} /> 
    },
    { 
      id: 'weddings', 
      label: 'Weddings & Notifs', 
      icon: <Heart size={20} /> 
    },
    { 
      id: 'reports', 
      label: 'Conference Reports', 
      icon: <FileBarChart size={20} /> 
    }
  ];

  return (
    <aside className="w-80 bg-[#020617] h-screen flex flex-col justify-between p-6 border-r border-slate-800 flex-shrink-0 shadow-2xl font-['Plus_Jakarta_Sans',sans-serif] select-none">
      
      {/* 1. Header Section */}
      <div className="flex items-center gap-3.5 px-2 pt-1 pb-4 border-b border-slate-800/60 shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <ShieldCheck size={28} />
        </div>
        <div className="overflow-hidden">
          <h1 className="text-xl font-black text-white tracking-wider uppercase leading-none truncate">
            NEWLIFE <span className="text-emerald-400">CCIS</span>
          </h1>
          <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest mt-1.5 truncate">
            {userRole}
          </p>
        </div>
      </div>

      {/* 2. Main Navigation Area */}
      <nav className="flex-1 flex flex-col justify-evenly my-4 py-1 overflow-y-auto pr-1 gap-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                isActive 
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25 scale-[1.02]' 
                  : 'text-slate-300 hover:bg-slate-900/80 hover:text-white font-black'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={isActive ? 'text-slate-900' : 'text-emerald-400/80'}>
                  {item.icon}
                </div>
                <span className="text-sm font-black tracking-wide uppercase truncate">
                  {item.label}
                </span>
              </div>

              {item.badge && (
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full shrink-0 ml-2 ${
                  isActive 
                    ? 'bg-slate-950/20 text-slate-950' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Footer / Logout Section */}
      <div className="pt-2 border-t border-slate-800/80 shrink-0">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white font-black text-sm uppercase tracking-wider transition-all duration-200 border border-rose-500/20 cursor-pointer shadow-sm"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>

    </aside>
  );
};

export default ElderSidebar;