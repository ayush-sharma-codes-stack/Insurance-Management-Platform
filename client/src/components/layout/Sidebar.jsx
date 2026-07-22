import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  CreditCard,
  FileCheck,
  FolderOpen,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || 'CUSTOMER';

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'AGENT', 'CUSTOMER'] },
    { label: 'Customers', path: '/customers', icon: Users, roles: ['ADMIN', 'AGENT'] },
    { label: 'Policies', path: '/policies', icon: ShieldAlert, roles: ['ADMIN', 'AGENT', 'CUSTOMER'] },
    { label: 'Premiums', path: '/premiums', icon: CreditCard, roles: ['ADMIN', 'AGENT', 'CUSTOMER'] },
    { label: 'Claims', path: '/claims', icon: FileCheck, roles: ['ADMIN', 'AGENT', 'CUSTOMER'] },
    { label: 'Documents', path: '/documents', icon: FolderOpen, roles: ['ADMIN', 'AGENT', 'CUSTOMER'] },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-800 flex flex-col justify-between hidden md:flex min-h-screen">
      <div>
        {/* Brand Logo Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/80">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-600/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white leading-tight">InsurManager</h1>
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              {role} Portal
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-md shadow-blue-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Info Footprint */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 glass-card rounded-xl flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
