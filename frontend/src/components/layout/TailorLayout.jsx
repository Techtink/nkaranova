import { NavLink, Outlet } from 'react-router-dom';
import {
  FiHome,
  FiImage,
  FiCalendar,
  FiClock,
  FiGift,
  FiSettings,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiLogOut,
  FiEdit3,
  FiPackage
} from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './TailorLayout.scss';

const navItems = [
  { path: '/tailor/dashboard', icon: FiHome, label: 'Dashboard', exact: true },
  { path: '/tailor/portfolio', icon: FiImage, label: 'Portfolio' },
  { path: '/tailor/bookings', icon: FiCalendar, label: 'Bookings' },
  { path: '/tailor/orders', icon: FiPackage, label: 'Orders' },
  { path: '/tailor/availability', icon: FiClock, label: 'Availability' },
  { path: '/tailor/measurements', icon: FiEdit3, label: 'Measurements' },
  { divider: true, label: 'Earn More' },
  { path: '/tailor/referrals', icon: FiGift, label: 'Referrals' },
  { divider: true, label: 'Account' },
  { path: '/tailor/settings', icon: FiSettings, label: 'Settings' }
];

export default function TailorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="tailor-layout">
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
      <aside className={`tailor-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-icon">TC</div>
          <div className="logo-text">
            <h1>Tailor Connect</h1>
            <p>Tailor Dashboard</p>
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
      <main className="tailor-main">
        <Outlet />
      </main>
    </div>
  );
}
