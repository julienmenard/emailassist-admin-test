import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { BarChart3, Users, Mail, Building2, ScrollText, LineChart, Home, Moon, Globe, LogOut } from 'lucide-react';
import { logoutAdmin } from '../lib/auth';
import Payments from './dashboard/Payments';
import UsersStats from './dashboard/UsersStats';
import EmailStats from './dashboard/EmailStats';
import EnterprisePlans from './dashboard/EnterprisePlans';
import Logs from './dashboard/Logs';
import LLMComparison from './dashboard/LLMComparison';
import Overview from './dashboard/Overview';

const menuItems = [
  { path: '', icon: Home, label: 'Overview' },
  { path: 'payments', icon: BarChart3, label: 'Payments' },
  { path: 'users', icon: Users, label: 'Users' },
  { path: 'emails', icon: Mail, label: 'Email Stats' },
  { path: 'enterprise', icon: Building2, label: 'Enterprise Plans' },
  { path: 'logs', icon: ScrollText, label: 'Logs' },
  { path: 'llm', icon: LineChart, label: 'LLM Comparison' },
];

const Dashboard = () => {
  const location = useLocation();

  const renderMenuItem = (item: any, isSubItem = false) => {
    const Icon = item.icon;
    const fullPath = isSubItem ? `logs/${item.path}` : item.path;
    const isActive = location.pathname === `/dashboard/${fullPath}`;
    
    return (
      <React.Fragment key={item.path}>
        <NavLink
          to={fullPath}
          className={({ isActive }) =>
            `sidebar-item ${isActive ? 'active' : ''} ${isSubItem ? 'pl-12' : ''}`
          }
        >
          <Icon className="w-5 h-5 mr-3" />
          <span className="truncate">{item.label}</span>
        </NavLink>
        {item.subItems?.map((subItem: any) => renderMenuItem(subItem, true))}
      </React.Fragment>
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-72 bg-[#1a2333]/50 backdrop-blur-sm">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Mail className="w-6 h-6 text-emerald-400 mr-2" />
          <h1 className="text-xl font-bold text-white">EmailAssist.ai</h1>
        </div>
        <nav className="mt-4 flex-1">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-gray-400">
              <Moon className="w-5 h-5" />
              <Globe className="w-5 h-5" />
            </div>
            <button
              onClick={logoutAdmin}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="py-8 px-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/users" element={<UsersStats />} />
            <Route path="/emails" element={<EmailStats />} />
            <Route path="/enterprise" element={<EnterprisePlans />} />
            <Route path="/logs/*" element={<Logs />} />
            <Route path="/llm" element={<LLMComparison />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;