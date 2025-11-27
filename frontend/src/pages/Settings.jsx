import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { FiGrid, FiUser, FiBell, FiGlobe, FiSettings, FiUsers, FiCreditCard, FiPlus, FiLogOut, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { authAPI, uploadsAPI } from '../services/api';
import './Settings.scss';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('account');
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

  const [showPasswordForm, setShowPasswordForm] = useState(false);

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

  const handleProfileUpdate = async () => {
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
      setShowPasswordForm(false);
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

  const handleLogoutAllDevices = async () => {
    if (!confirm('Are you sure you want to log out of all devices?')) return;

    try {
      await logout();
      toast.success('Logged out of all devices');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const handleDeleteAccount = () => {
    toast.error('Please contact support to delete your account');
  };

  const sidebarItems = [
    {
      title: 'GENERAL SETTINGS',
      items: [
        { id: 'apps', label: 'Apps', icon: FiGrid },
        { id: 'account', label: 'Account', icon: FiUser },
        { id: 'notification', label: 'Notification', icon: FiBell },
        { id: 'language', label: 'Language & Region', icon: FiGlobe }
      ]
    },
    {
      title: 'WORKSPACE SETTINGS',
      items: [
        { id: 'general', label: 'General', icon: FiSettings },
        { id: 'members', label: 'Members', icon: FiUsers },
        { id: 'billing', label: 'Billing', icon: FiCreditCard }
      ]
    }
  ];

  return (
    <div className="account-settings">
      <h1 className="settings-title">Account Settings</h1>

      <div className="settings-layout">
        {/* Sidebar */}
        <aside className="settings-sidebar">
          {sidebarItems.map((section, idx) => (
            <div key={idx} className="sidebar-section">
              <h3 className="sidebar-section-title">{section.title}</h3>
              <ul className="sidebar-menu">
                {section.items.map(item => (
                  <li key={item.id}>
                    <button
                      className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <item.icon className="sidebar-icon" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Main Content */}
        <main className="settings-content">
          {activeTab === 'account' && (
            <>
              {/* My Profile Section */}
              <section className="settings-section">
                <h2 className="section-title">My Profile</h2>

                <div className="profile-avatar-section">
                  <div className="avatar-preview">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.firstName} />
                    ) : (
                      <span className="avatar-initial">{user?.firstName?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <div className="avatar-actions">
                    <button
                      className="btn-avatar btn-change"
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                    >
                      <FiPlus />
                      {uploadingAvatar ? 'Uploading...' : 'Change Image'}
                    </button>
                    <button
                      className="btn-avatar btn-remove"
                      onClick={handleRemoveAvatar}
                      disabled={!user?.avatar || saving}
                    >
                      Remove Image
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                  <p className="avatar-hint">We support PNGs, JPEGs and GIFs under 2MB</p>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      onBlur={handleProfileUpdate}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      onBlur={handleProfileUpdate}
                    />
                  </div>
                </div>
              </section>

              {/* Account Security Section */}
              <section className="settings-section">
                <h2 className="section-title">Account Security</h2>

                <div className="security-item">
                  <div className="security-info">
                    <label>Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="disabled-input"
                    />
                  </div>
                  <button className="btn-action">
                    Change email
                  </button>
                </div>

                <div className="security-item">
                  <div className="security-info">
                    <label>Password</label>
                    <input
                      type="password"
                      value="************"
                      disabled
                      className="disabled-input"
                    />
                  </div>
                  <button className="btn-action" onClick={() => setShowPasswordForm(!showPasswordForm)}>
                    Change password
                  </button>
                </div>

                {showPasswordForm && (
                  <form className="password-form" onSubmit={handlePasswordUpdate}>
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="button" className="btn-cancel" onClick={() => setShowPasswordForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? 'Saving...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="security-toggle-item">
                  <div>
                    <h4>2-Step Verification</h4>
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
              </section>

              {/* Support Access Section */}
              <section className="settings-section">
                <h2 className="section-title">Support Access</h2>

                <div className="security-toggle-item">
                  <div>
                    <h4>Support access</h4>
                    <p>Grant us access to your account for support purposes.</p>
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

                <div className="support-item">
                  <div>
                    <h4>Log out of all devices</h4>
                    <p>Log out of all other active sessions on other devices besides this one.</p>
                  </div>
                  <button className="btn-action" onClick={handleLogoutAllDevices}>
                    Log out
                  </button>
                </div>

                <div className="support-item danger">
                  <div>
                    <h4 className="danger-text">Delete my account</h4>
                    <p>Permanently delete the account and remove access from all workspaces.</p>
                  </div>
                  <button className="btn-action btn-danger" onClick={handleDeleteAccount}>
                    Delete Account
                  </button>
                </div>
              </section>
            </>
          )}

          {activeTab === 'notification' && (
            <section className="settings-section">
              <h2 className="section-title">Notification Preferences</h2>

              <div className="security-toggle-item">
                <div>
                  <h4>Email Notifications</h4>
                  <p>Receive booking and message notifications via email.</p>
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

              <div className="security-toggle-item">
                <div>
                  <h4>Push Notifications</h4>
                  <p>Receive push notifications on your device.</p>
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
            </section>
          )}

          {(activeTab !== 'account' && activeTab !== 'notification') && (
            <section className="settings-section">
              <h2 className="section-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
              <p className="coming-soon">This section is coming soon.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
