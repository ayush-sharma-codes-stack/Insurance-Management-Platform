import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-950/60 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-300">
          Welcome back, <span className="text-white font-bold">{user?.name}</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 cursor-pointer transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
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
