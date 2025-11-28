import { NavLink, Outlet } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiImage,
  FiStar,
  FiMessageSquare,
  FiCheckCircle,
  FiSettings,
  FiGift,
  FiAward,
  FiShield,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiLogOut,
  FiHelpCircle,
  FiPackage,
  FiMail,
  FiCalendar
} from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './AdminLayout.scss';

const navItems = [
  { path: '/admin', icon: FiHome, label: 'Dashboard', exact: true },
  { path: '/admin/tailors', icon: FiUsers, label: 'Tailors' },
  { path: '/admin/works', icon: FiImage, label: 'Works' },
  { path: '/admin/reviews', icon: FiStar, label: 'Reviews' },
  { path: '/admin/verifications', icon: FiCheckCircle, label: 'Verifications' },
  { path: '/admin/bookings', icon: FiCalendar, label: 'Bookings' },
  { path: '/admin/orders', icon: FiPackage, label: 'Orders' },
  { path: '/admin/guest-chats', icon: FiMessageSquare, label: 'Guest Chats' },
  { path: '/admin/chat', icon: FiMail, label: 'Messages' },
  { divider: true, label: 'Referral System' },
  { path: '/admin/referrals', icon: FiGift, label: 'Referrals' },
  { path: '/admin/featured', icon: FiAward, label: 'Featured Tailors' },
  { divider: true, label: 'Settings' },
  { path: '/admin/team', icon: FiShield, label: 'Team & Roles' },
  { path: '/admin/faqs', icon: FiHelpCircle, label: 'FAQs' },
  { path: '/admin/settings', icon: FiSettings, label: 'Platform Settings' }
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="admin-layout">
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-icon">TC</div>
          <div className="logo-text">
            <h1>Tailor Connect</h1>
            <p>Admin Panel</p>
          </div>
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <FiSun /> : <FiMoon />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, index) => {
            if (item.divider) {
              return (
                <div key={index} className="nav-divider">
                  <span>{item.label}</span>
                </div>
              );
            }

            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <FiLogOut className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
