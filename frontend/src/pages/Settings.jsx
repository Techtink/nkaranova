import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { authAPI } from '../services/api';
import './Settings.scss';

export default function Settings() {
  const { user, updateUser } = useAuth();

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
    personalizedRecommendations: user?.preferences?.personalizedRecommendations ?? true
  });

  const [saving, setSaving] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
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

  const handlePreferencesUpdate = async () => {
    setSaving(true);

    try {
      await authAPI.updateDetails({ preferences });
      updateUser({ preferences });
      toast.success('Preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page page">
      <div className="container">
        <div className="page-header">
          <h1>Settings</h1>
          <p>Manage your account settings and preferences</p>
        </div>

        <div className="settings-grid">
          {/* Profile Settings */}
          <section className="settings-section">
            <h2>Profile</h2>
            <form onSubmit={handleProfileUpdate}>
              <Input
                label="First Name"
                value={profileData.firstName}
                onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
              />
              <Input
                label="Last Name"
                value={profileData.lastName}
                onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
              />
              <Input
                label="Email"
                value={user?.email || ''}
                disabled
                helperText="Email cannot be changed"
              />
              <Button type="submit" loading={saving}>Save Changes</Button>
            </form>
          </section>

          {/* Password Settings */}
          <section className="settings-section">
            <h2>Password</h2>
            <form onSubmit={handlePasswordUpdate}>
              <Input
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              />
              <Input
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
              <Button type="submit" loading={saving}>Update Password</Button>
            </form>
          </section>

          {/* Notification Preferences */}
          <section className="settings-section">
            <h2>Notifications</h2>
            <div className="preferences-list">
              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                />
                <div>
                  <span className="preference-title">Email Notifications</span>
                  <span className="preference-desc">Receive booking and message notifications via email</span>
                </div>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences.personalizedRecommendations}
                  onChange={(e) => setPreferences(prev => ({ ...prev, personalizedRecommendations: e.target.checked }))}
                />
                <div>
                  <span className="preference-title">Personalized Recommendations</span>
                  <span className="preference-desc">Get tailor recommendations based on your browsing history</span>
                </div>
              </label>
            </div>
            <Button onClick={handlePreferencesUpdate} loading={saving}>Save Preferences</Button>
          </section>
        </div>
      </div>
    </div>
  );
}
