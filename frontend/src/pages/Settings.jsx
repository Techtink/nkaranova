import { useState, useRef, useEffect } from 'react';
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
  FiPlus,
  FiEdit3,
  FiMapPin,
  FiCreditCard,
  FiTrash2,
  FiCheck
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI, uploadsAPI, measurementsAPI } from '../services/api';
import './Settings.scss';

const navItems = [
  { id: 'profile', icon: FiUser, label: 'My Profile' },
  { id: 'security', icon: FiLock, label: 'Account Security' },
  { divider: true, label: 'Customer Settings' },
  { id: 'measurements', icon: FiEdit3, label: 'Measurements' },
  { id: 'addresses', icon: FiMapPin, label: 'Addresses' },
  { id: 'payments', icon: FiCreditCard, label: 'Payment Methods' },
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

  // Measurement profiles
  const [measurementProfiles, setMeasurementProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postalCode: '',
    isDefault: false
  });

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || ''
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

  // Load measurement profiles
  useEffect(() => {
    if (activeTab === 'measurements') {
      loadMeasurementProfiles();
    }
  }, [activeTab]);

  const loadMeasurementProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const response = await measurementsAPI.getProfiles();
      setMeasurementProfiles(response.data.data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

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

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let updatedAddresses;
      if (editingAddress !== null) {
        updatedAddresses = addresses.map((addr, idx) =>
          idx === editingAddress ? addressForm : addr
        );
      } else {
        updatedAddresses = [...addresses, addressForm];
      }

      // If this address is default, unset others
      if (addressForm.isDefault) {
        updatedAddresses = updatedAddresses.map((addr, idx) => ({
          ...addr,
          isDefault: addr === addressForm || idx === (editingAddress ?? updatedAddresses.length - 1)
        }));
      }

      await authAPI.updateDetails({ addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      updateUser({ addresses: updatedAddresses });
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({
        label: '',
        street: '',
        city: '',
        state: '',
        country: 'Nigeria',
        postalCode: '',
        isDefault: false
      });
      toast.success(editingAddress !== null ? 'Address updated' : 'Address added');
    } catch (error) {
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (index) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    const updatedAddresses = addresses.filter((_, idx) => idx !== index);
    try {
      await authAPI.updateDetails({ addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      updateUser({ addresses: updatedAddresses });
      toast.success('Address deleted');
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (index) => {
    const updatedAddresses = addresses.map((addr, idx) => ({
      ...addr,
      isDefault: idx === index
    }));
    try {
      await authAPI.updateDetails({ addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      updateUser({ addresses: updatedAddresses });
      toast.success('Default address updated');
    } catch (error) {
      toast.error('Failed to update default address');
    }
  };

  const editAddress = (index) => {
    setAddressForm(addresses[index]);
    setEditingAddress(index);
    setShowAddressForm(true);
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
              {activeTab === 'measurements' && 'My Measurements'}
              {activeTab === 'addresses' && 'My Addresses'}
              {activeTab === 'payments' && 'Payment Methods'}
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

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="disabled"
                      />
                      <small>Contact support to change your email</small>
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    </div>
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

          {/* Measurements Tab */}
          {activeTab === 'measurements' && (
            <div className="settings-card">
              <div className="card-section">
                <div className="section-header">
                  <h3>Measurement Profiles</h3>
                  <Link to="/measurements" className="btn btn-primary">
                    <FiPlus /> Manage Profiles
                  </Link>
                </div>

                {loadingProfiles ? (
                  <p className="loading-text">Loading profiles...</p>
                ) : measurementProfiles.length === 0 ? (
                  <div className="empty-state">
                    <FiEdit3 className="empty-icon" />
                    <h4>No Measurement Profiles</h4>
                    <p>Create measurement profiles to speed up your bookings with tailors.</p>
                    <Link to="/measurements" className="btn btn-primary">
                      Create Profile
                    </Link>
                  </div>
                ) : (
                  <div className="profiles-list">
                    {measurementProfiles.map((profile) => (
                      <div key={profile._id} className="profile-item">
                        <div className="profile-info">
                          <h4>
                            {profile.name}
                            {profile.isDefault && <span className="default-badge">Default</span>}
                          </h4>
                          <p>{profile.gender} • {Object.keys(profile.measurements || {}).length} measurements</p>
                        </div>
                        <Link to={`/measurements?profile=${profile._id}`} className="btn btn-outline btn-sm">
                          Edit
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card-section">
                <h3>Why Add Measurements?</h3>
                <ul className="benefits-list">
                  <li><FiCheck /> Faster booking process with tailors</li>
                  <li><FiCheck /> More accurate quotes and estimates</li>
                  <li><FiCheck /> Better fitting custom garments</li>
                  <li><FiCheck /> Save time on repeat orders</li>
                </ul>
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="settings-card">
              <div className="card-section">
                <div className="section-header">
                  <h3>Saved Addresses</h3>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setShowAddressForm(true);
                      setEditingAddress(null);
                      setAddressForm({
                        label: '',
                        street: '',
                        city: '',
                        state: '',
                        country: 'Nigeria',
                        postalCode: '',
                        isDefault: false
                      });
                    }}
                  >
                    <FiPlus /> Add Address
                  </button>
                </div>

                {showAddressForm && (
                  <form className="address-form" onSubmit={handleAddressSubmit}>
                    <div className="form-group">
                      <label>Address Label</label>
                      <input
                        type="text"
                        value={addressForm.label}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="e.g., Home, Office, etc."
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Street Address</label>
                      <input
                        type="text"
                        value={addressForm.street}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="Enter street address"
                        required
                      />
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>City</label>
                        <input
                          type="text"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Enter city"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>State</label>
                        <input
                          type="text"
                          value={addressForm.state}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="Enter state"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Country</label>
                        <select
                          value={addressForm.country}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                        >
                          <option value="Nigeria">Nigeria</option>
                          <option value="Ghana">Ghana</option>
                          <option value="Kenya">Kenya</option>
                          <option value="South Africa">South Africa</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="United States">United States</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Postal Code</label>
                        <input
                          type="text"
                          value={addressForm.postalCode}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, postalCode: e.target.value }))}
                          placeholder="Enter postal code"
                        />
                      </div>
                    </div>

                    <div className="toggle-row">
                      <div className="toggle-info">
                        <h4>Set as default address</h4>
                        <p>Use this address by default for deliveries</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          setShowAddressForm(false);
                          setEditingAddress(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : (editingAddress !== null ? 'Update Address' : 'Add Address')}
                      </button>
                    </div>
                  </form>
                )}

                {!showAddressForm && addresses.length === 0 && (
                  <div className="empty-state">
                    <FiMapPin className="empty-icon" />
                    <h4>No Saved Addresses</h4>
                    <p>Add addresses to speed up your checkout process.</p>
                  </div>
                )}

                {!showAddressForm && addresses.length > 0 && (
                  <div className="addresses-list">
                    {addresses.map((address, index) => (
                      <div key={index} className="address-item">
                        <div className="address-info">
                          <h4>
                            {address.label}
                            {address.isDefault && <span className="default-badge">Default</span>}
                          </h4>
                          <p>{address.street}</p>
                          <p>{address.city}, {address.state} {address.postalCode}</p>
                          <p>{address.country}</p>
                        </div>
                        <div className="address-actions">
                          {!address.isDefault && (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleSetDefaultAddress(index)}
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => editAddress(index)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-outline btn-sm btn-icon"
                            onClick={() => handleDeleteAddress(index)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'payments' && (
            <div className="settings-card">
              <div className="card-section">
                <div className="section-header">
                  <h3>Payment Methods</h3>
                </div>

                <div className="empty-state">
                  <FiCreditCard className="empty-icon" />
                  <h4>No Payment Methods</h4>
                  <p>Payment methods will be saved automatically when you make your first payment.</p>
                </div>
              </div>

              <div className="card-section">
                <h3>Payment Security</h3>
                <p className="security-note">
                  Your payment information is securely processed by Stripe. We never store your full card details on our servers.
                </p>
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
