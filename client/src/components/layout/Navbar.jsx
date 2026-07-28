import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout, switchRole } = useAuth();

  const handleRoleChange = (e) => {
    switchRole(e.target.value);
  };

  return (
    <header className="h-16 bg-slate-950/60 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-300">
          Welcome back, <span className="text-white font-bold">{user?.name}</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Role Switcher Selector */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-blue-500/30 px-3 py-1.5 rounded-xl shadow-sm">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Role:</span>
          <select
            value={user?.role || 'CUSTOMER'}
            onChange={handleRoleChange}
            className="bg-transparent text-xs font-bold text-blue-400 focus:outline-none cursor-pointer"
          >
            <option value="ADMIN" className="bg-slate-900 text-white">ADMIN (Full Access)</option>
            <option value="AGENT" className="bg-slate-900 text-white">AGENT (Manage)</option>
            <option value="CUSTOMER" className="bg-slate-900 text-white">CUSTOMER</option>
          </select>
        </div>

        <div className="h-6 w-px bg-slate-800"></div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/60 transition"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          Logout
        </button>
      </div>
    </header>
  );
}
