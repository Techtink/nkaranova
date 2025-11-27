import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiSearch, FiUser, FiLogOut, FiSettings, FiMessageSquare, FiCalendar, FiSun, FiMoon, FiEdit3, FiPackage } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Header.scss';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, isAuthenticated, isTailor, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container header-container">
        <Link to="/" className="logo">
          <span className="logo-text">Tailor Connect</span>
        </Link>

        <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
          <Link to="/tailors" className="nav-link" onClick={() => setMenuOpen(false)}>
            Find Tailors
          </Link>
          <Link to="/gallery" className="nav-link" onClick={() => setMenuOpen(false)}>
            Gallery
          </Link>
          <Link to="/ai-search" className="nav-link" onClick={() => setMenuOpen(false)}>
            AI Search
          </Link>
        </nav>

        <div className="header-actions">
          <Link to="/tailors" className="header-icon-btn" title="Find Tailors">
            <FiSearch />
          </Link>

          <button
            className="header-icon-btn"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <FiSun /> : <FiMoon />}
          </button>

          {isAuthenticated ? (
            <>
              <Link to="/messages" className="header-icon-btn">
                <FiMessageSquare />
              </Link>

              <div className="profile-dropdown">
                <button
                  className="profile-btn"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <div className="avatar avatar-sm">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.firstName} />
                    ) : (
                      user.firstName?.charAt(0)
                    )}
                  </div>
                </button>

                {profileOpen && (
                  <div className="dropdown-menu" onClick={() => setProfileOpen(false)}>
                    <div className="dropdown-header">
                      <span className="dropdown-name">{user.firstName} {user.lastName}</span>
                      <span className="dropdown-email">{user.email}</span>
                    </div>

                    {isTailor && (
                      <>
                        <Link to="/tailor/dashboard" className="dropdown-item">
                          <FiUser /> Dashboard
                        </Link>
                        <Link to="/tailor/bookings" className="dropdown-item">
                          <FiCalendar /> Bookings
                        </Link>
                      </>
                    )}

                    {isAdmin && (
                      <Link to="/admin" className="dropdown-item">
                        <FiSettings /> Admin Panel
                      </Link>
                    )}

                    {!isTailor && !isAdmin && (
                      <>
                        <Link to="/bookings" className="dropdown-item">
                          <FiCalendar /> My Bookings
                        </Link>
                        <Link to="/orders" className="dropdown-item">
                          <FiPackage /> My Orders
                        </Link>
                        <Link to="/measurements" className="dropdown-item">
                          <FiEdit3 /> My Measurements
                        </Link>
                      </>
                    )}

                    <Link to="/settings" className="dropdown-item">
                      <FiSettings /> Settings
                    </Link>

                    <button onClick={handleLogout} className="dropdown-item dropdown-logout">
                      <FiLogOut /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}

          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </header>
  );
}
