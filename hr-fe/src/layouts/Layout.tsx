import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, History, ClipboardCheck, Menu, X, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { getInitials } from '../lib/utils';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const employeeNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Check In', href: '/check-in', icon: Clock },
    { name: 'Attendance History', href: '/attendance-history', icon: History },
  ];

  const hrNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Employee Management', href: '/employees', icon: Users },
    { name: 'Attendance Monitoring', href: '/monitoring', icon: ClipboardCheck },
  ];

  const navigation = user?.role === 'hr_admin' ? hrNavigation : employeeNavigation;

  return (
    <div className="min-h-screen bg-brown-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-brown-950/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-brown-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-brown-700">
          <h1 className="text-xl font-bold text-white">HR System</h1>
          <button
            className="lg:hidden text-brown-200 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        <nav className="mt-6 px-3">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-colors',
                  isActive
                    ? 'bg-brown-800 text-white'
                    : 'text-brown-200 hover:bg-brown-800 hover:text-white'
                )
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-brown-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-brown-200 hover:bg-brown-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-white border-b border-brown-200 px-4 lg:px-8">
          <button
            className="lg:hidden text-brown-700 hover:text-brown-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brown-200 flex items-center justify-center">
                <span className="text-sm font-medium text-brown-700">
                  {user ? getInitials(user.name) : 'U'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-brown-900">{user?.name}</span>
                <span className="text-xs text-brown-500 capitalize">{user?.role?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
