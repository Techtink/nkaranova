import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { FiCheck, FiX, FiLoader, FiCamera, FiUpload } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { tailorsAPI, uploadsAPI } from '../../services/api';
import { SPECIALTIES } from '../../utils/constants';
import './Settings.scss';

export default function TailorSettings() {
  const { tailorProfile, updateTailorProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: tailorProfile?.username || '',
    businessName: tailorProfile?.businessName || '',
    bio: tailorProfile?.bio || '',
    profilePhoto: tailorProfile?.profilePhoto || '',
    coverPhoto: tailorProfile?.coverPhoto || '',
    specialties: tailorProfile?.specialties || [],
    location: {
      city: tailorProfile?.location?.city || '',
      state: tailorProfile?.location?.state || '',
      country: tailorProfile?.location?.country || ''
    },
    acceptingBookings: tailorProfile?.acceptingBookings ?? true,
    minimumPrice: tailorProfile?.minimumPrice || ''
  });

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: null,
    message: ''
  });
  const usernameCheckTimeout = useRef(null);
  const originalUsername = useRef(tailorProfile?.username || '');

  // Debounced username check
  const checkUsername = useCallback(async (username) => {
    if (!username || username.length < 3) {
      setUsernameStatus({
        checking: false,
        available: null,
        message: username.length > 0 ? 'Username must be at least 3 characters' : ''
      });
      return;
    }

    // If it's the original username, mark as available
    if (username === originalUsername.current) {
      setUsernameStatus({
        checking: false,
        available: true,
        message: 'This is your current username'
      });
      return;
    }

    setUsernameStatus({ checking: true, available: null, message: '' });

    try {
      const response = await tailorsAPI.checkUsername(username);
      setUsernameStatus({
        checking: false,
        available: response.data.available,
        message: response.data.message
      });
    } catch (error) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: error.response?.data?.message || 'Error checking username'
      });
    }
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Trigger username check with debounce
    if (field === 'username') {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
      usernameCheckTimeout.current = setTimeout(() => {
        checkUsername(value);
      }, 500);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, []);

  const handleLocationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value }
    }));
  };

  const toggleSpecialty = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = type === 'profile' ? setUploadingProfile : setUploadingCover;
    setUploading(true);

    try {
      const response = await uploadsAPI.uploadProfilePhoto(file);
      const photoUrl = response.data.url;

      setFormData(prev => ({
        ...prev,
        [type === 'profile' ? 'profilePhoto' : 'coverPhoto']: photoUrl
      }));

      toast.success(`${type === 'profile' ? 'Profile' : 'Cover'} photo uploaded`);
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent submission if username is unavailable
    if (usernameStatus.available === false) {
      toast.error('Please choose an available username');
      return;
    }

    // Prevent submission while checking username
    if (usernameStatus.checking) {
      toast.error('Please wait while we verify your username');
      return;
    }

    setSaving(true);

    try {
      await tailorsAPI.updateMyProfile(formData);
      updateTailorProfile(formData);
      // Update the original username reference after successful save
      originalUsername.current = formData.username;
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tailor-settings-page page">
      <div className="container">
        <div className="page-header">
          <h1>Profile Settings</h1>
          <p>Manage your tailor profile and preferences</p>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          {/* Photo Upload Section */}
          <section className="settings-section photos-section">
            <h2>Profile Photos</h2>

            <div className="photos-grid">
              {/* Cover Photo */}
              <div className="photo-upload cover-upload">
                <label>Cover Photo</label>
                <div
                  className="upload-area cover"
                  onClick={() => coverInputRef.current?.click()}
                  style={formData.coverPhoto ? { backgroundImage: `url(${formData.coverPhoto})` } : {}}
                >
                  {uploadingCover ? (
                    <FiLoader className="spinner" />
                  ) : formData.coverPhoto ? (
                    <div className="upload-overlay">
                      <FiCamera />
                      <span>Change Cover</span>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FiUpload />
                      <span>Upload Cover Photo</span>
                    </div>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'cover')}
                  hidden
                />
              </div>

              {/* Profile Photo */}
              <div className="photo-upload profile-upload">
                <label>Profile Photo</label>
                <div
                  className="upload-area profile"
                  onClick={() => profileInputRef.current?.click()}
                >
                  {uploadingProfile ? (
                    <FiLoader className="spinner" />
                  ) : formData.profilePhoto ? (
                    <>
                      <img src={formData.profilePhoto} alt="Profile" />
                      <div className="upload-overlay">
                        <FiCamera />
                      </div>
                    </>
                  ) : (
                    <div className="upload-placeholder">
                      <FiCamera />
                      <span>Add Photo</span>
                    </div>
                  )}
                </div>
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'profile')}
                  hidden
                />
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2>Basic Information</h2>

            <div className="username-field">
              <label>Username</label>
              <div className="username-input-wrapper">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="your-username"
                />
                <span className={`username-status ${usernameStatus.checking ? 'checking' : usernameStatus.available === true ? 'available' : usernameStatus.available === false ? 'unavailable' : ''}`}>
                  {usernameStatus.checking ? (
                    <FiLoader className="spinner" />
                  ) : usernameStatus.available === true ? (
                    <FiCheck />
                  ) : usernameStatus.available === false ? (
                    <FiX />
                  ) : null}
                </span>
              </div>
              <span className={`username-message ${usernameStatus.available === false ? 'error' : usernameStatus.available === true ? 'success' : ''}`}>
                {usernameStatus.message || 'This is your unique identifier on the platform'}
              </span>
            </div>

            <Input
              label="Business Name"
              value={formData.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              placeholder="Your business or brand name"
            />

            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Tell customers about yourself and your work..."
                rows={4}
                maxLength={1000}
              />
              <span className="char-count">{formData.bio.length}/1000</span>
            </div>
          </section>

          <section className="settings-section">
            <h2>Specialties</h2>
            <p className="section-desc">Select the services you specialize in</p>

            <div className="specialties-grid">
              {SPECIALTIES.map(specialty => (
                <label key={specialty} className="specialty-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.specialties.includes(specialty)}
                    onChange={() => toggleSpecialty(specialty)}
                  />
                  <span>{specialty}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <h2>Location</h2>

            <div className="location-grid">
              <Input
                label="City"
                value={formData.location.city}
                onChange={(e) => handleLocationChange('city', e.target.value)}
              />
              <Input
                label="State/Province"
                value={formData.location.state}
                onChange={(e) => handleLocationChange('state', e.target.value)}
              />
              <Input
                label="Country"
                value={formData.location.country}
                onChange={(e) => handleLocationChange('country', e.target.value)}
              />
            </div>
          </section>

          <section className="settings-section">
            <h2>Booking Settings</h2>

            <label className="toggle-setting">
              <input
                type="checkbox"
                checked={formData.acceptingBookings}
                onChange={(e) => handleChange('acceptingBookings', e.target.checked)}
              />
              <div>
                <span className="toggle-title">Accepting Bookings</span>
                <span className="toggle-desc">Allow customers to book appointments with you</span>
              </div>
            </label>

            <Input
              label="Minimum Price (USD)"
              type="number"
              value={formData.minimumPrice}
              onChange={(e) => handleChange('minimumPrice', e.target.value)}
              placeholder="0"
            />
          </section>

          <div className="form-actions">
            <Button type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
