import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiUser,
  FiLock,
  FiBell,
  FiGlobe,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiHome,
  FiPlus
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI, uploadsAPI } from '../services/api';
import './Settings.scss';

const navItems = [
  { id: 'profile', icon: FiUser, label: 'My Profile' },
  { id: 'security', icon: FiLock, label: 'Account Security' },
  { divider: true, label: 'Preferences' },
  { id: 'notifications', icon: FiBell, label: 'Notifications' },
  { id: 'language', icon: FiGlobe, label: 'Language & Region' }
];

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const fileInputRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    pushNotifications: user?.preferences?.pushNotifications ?? true,
    twoFactorAuth: false
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const response = await uploadsAPI.uploadProfilePhoto(file);
      const avatarUrl = response.data.url;
      await authAPI.updateDetails({ avatar: avatarUrl });
      updateUser({ avatar: avatarUrl });
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setSaving(true);
    try {
      await authAPI.updateDetails({ avatar: null });
      updateUser({ avatar: null });
      toast.success('Profile photo removed');
    } catch (error) {
      toast.error('Failed to remove photo');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateDetails(profileData);
      updateUser(profileData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await authAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceToggle = async (key) => {
    const newValue = !preferences[key];
    setPreferences(prev => ({ ...prev, [key]: newValue }));

    try {
      await authAPI.updateDetails({ preferences: { ...preferences, [key]: newValue } });
      updateUser({ preferences: { ...preferences, [key]: newValue } });
    } catch (error) {
      setPreferences(prev => ({ ...prev, [key]: !newValue }));
      toast.error('Failed to update preference');
    }
  };

  return (
    <div className="settings-layout">
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

      {/* Sidebar - Exactly like Admin */}
      <aside className={`settings-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-icon">TC</div>
          <div className="logo-text">
            <h1>Tailor Connect</h1>
            <p>Account Settings</p>
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
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="back-btn">
            <FiHome className="nav-icon" />
            <span>Back to Home</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="settings-main">
        <div className="settings-page">
          <div className="settings-page-header">
            <h1>
              {activeTab === 'profile' && 'My Profile'}
              {activeTab === 'security' && 'Account Security'}
              {activeTab === 'notifications' && 'Notifications'}
              {activeTab === 'language' && 'Language & Region'}
            </h1>
          </div>

          {/* My Profile Tab */}
          {activeTab === 'profile' && (
            <div className="settings-card">
              <div className="card-section">
                <h3>Profile Photo</h3>
                <div className="profile-photo-section">
                  <div className="avatar-preview">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.firstName} />
                    ) : (
                      <span className="avatar-initial">{user?.firstName?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <div className="avatar-info">
                    <p>Upload a new avatar. Recommended size is 256x256px.</p>
                    <div className="avatar-actions">
                      <button
                        className="btn btn-primary"
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                      >
                        <FiPlus />
                        {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                      </button>
                      {user?.avatar && (
                        <button
                          className="btn btn-outline"
                          onClick={handleRemoveAvatar}
                          disabled={saving}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div className="card-section">
                <h3>Personal Information</h3>
                <form onSubmit={handleProfileUpdate}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="disabled"
                    />
                    <small>Contact support to change your email address</small>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Account Security Tab */}
          {activeTab === 'security' && (
            <div className="settings-card">
              <div className="card-section">
                <h3>Change Password</h3>
                <form onSubmit={handlePasswordUpdate}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="card-section">
                <h3>Two-Factor Authentication</h3>
                <div className="toggle-row">
                  <div className="toggle-info">
                    <h4>Enable 2FA</h4>
                    <p>Add an additional layer of security to your account during login.</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={preferences.twoFactorAuth}
                      onChange={() => handlePreferenceToggle('twoFactorAuth')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="card-section danger-zone">
                <h3>Danger Zone</h3>
                <div className="danger-item">
                  <div>
                    <h4>Delete Account</h4>
                    <p>Permanently delete your account and all associated data.</p>
                  </div>
                  <button className="btn btn-danger" onClick={() => toast.error('Contact support to delete your account')}>
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="settings-card">
              <div className="card-section">
                <h3>Email Notifications</h3>
                <div className="toggle-row">
                  <div className="toggle-info">
                    <h4>Email Notifications</h4>
                    <p>Receive booking updates and messages via email.</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={() => handlePreferenceToggle('emailNotifications')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="card-section">
                <h3>Push Notifications</h3>
                <div className="toggle-row">
                  <div className="toggle-info">
                    <h4>Push Notifications</h4>
                    <p>Receive real-time notifications on your device.</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={preferences.pushNotifications}
                      onChange={() => handlePreferenceToggle('pushNotifications')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <div className="settings-card">
              <div className="card-section">
                <h3>Language</h3>
                <div className="form-group">
                  <label>Display Language</label>
                  <select defaultValue="en">
                    <option value="en">English (US)</option>
                    <option value="en-gb">English (UK)</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
              </div>

              <div className="card-section">
                <h3>Region</h3>
                <div className="form-group">
                  <label>Time Zone</label>
                  <select defaultValue="WAT">
                    <option value="WAT">West Africa Time (WAT)</option>
                    <option value="GMT">Greenwich Mean Time (GMT)</option>
                    <option value="EST">Eastern Standard Time (EST)</option>
                    <option value="PST">Pacific Standard Time (PST)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
