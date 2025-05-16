import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { BarChart3, Users, Mail, Building2, ScrollText, LineChart, Home, Webhook, CreditCard, FileTerminal, RefreshCcw, Key } from 'lucide-react';
import Payments from './dashboard/Payments';
import UsersStats from './dashboard/UsersStats';
import EmailStats from './dashboard/EmailStats';
import EnterprisePlans from './dashboard/EnterprisePlans';
import Logs from './dashboard/Logs';
import LLMComparison from './dashboard/LLMComparison';
import Overview from './dashboard/Overview';

const edgeFunctions = [
  { path: 'stripe-webhook', label: 'stripe-webhook', icon: Webhook },
  { path: 'create-checkout', label: 'create-checkout', icon: CreditCard },
  { path: 'get-invoice', label: 'get-invoice', icon: FileTerminal },
  { path: 'cancel-subscription', label: 'cancel-subscription', icon: CreditCard },
  { path: 'deactivate-google-subscription', label: 'deactivate-google-subscription', icon: RefreshCcw },
  { path: 'create-google-subscription', label: 'create-google-subscription', icon: RefreshCcw },
  { path: 'google-api-manage-mail-sub-pub', label: 'google-api-manage-mail-sub-pub', icon: Mail },
  { path: 'google-create-subscription', label: 'google-create-subscription', icon: RefreshCcw },
  { path: 'google-users', label: 'google-users', icon: Users },
  { path: 'microsoft_oauth2_token_exchange_dv', label: 'microsoft_oauth2_token_exchange_dv', icon: Key },
  { path: 'microsoft_oauth2_token_exchange_ea', label: 'microsoft_oauth2_token_exchange_ea', icon: Key },
  { path: 'microsoft_refresh_oauth2_token_dv', label: 'microsoft_refresh_oauth2_token_dv', icon: RefreshCcw },
  { path: 'microsoft_refresh_oauth2_token_ea', label: 'microsoft_refresh_oauth2_token_ea', icon: RefreshCcw },
  { path: 'refresh_mail_subscription_upon_microsoft_notification_dv', label: 'refresh_mail_subscription_upon_microsoft_notification_dv', icon: Mail },
];

const menuItems = [
  { path: '', icon: Home, label: 'Overview' },
  { path: 'payments', icon: BarChart3, label: 'Payments' },
  { path: 'users', icon: Users, label: 'Users' },
  { path: 'emails', icon: Mail, label: 'Email Stats' },
  { path: 'enterprise', icon: Building2, label: 'Enterprise Plans' },
  {
    path: 'logs',
    icon: ScrollText,
    label: 'Logs',
    subItems: edgeFunctions.map(fn => ({
      path: `logs/${fn.path}`,
      icon: fn.icon,
      label: fn.label
    }))
  },
  { path: 'llm', icon: LineChart, label: 'LLM Comparison' },
];

const Dashboard = () => {
  const location = useLocation();

  const renderMenuItem = (item: any, isSubItem = false) => {
    const Icon = item.icon;
    const isActive = location.pathname === `/dashboard/${item.path}`;
    const baseClasses = `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
      isActive
        ? 'text-blue-600 bg-blue-50'
        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
    }`;
    
    return (
      <React.Fragment key={item.path}>
        <NavLink
          to={item.path}
          className={({ isActive }) =>
            `${baseClasses} ${isSubItem ? 'pl-12' : ''}`
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-72 bg-white shadow-lg">
        <div className="h-16 flex items-center px-6">
          <h1 className="text-xl font-bold text-gray-900">EmailAssist.ai</h1>
        </div>
        <nav className="mt-4">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
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