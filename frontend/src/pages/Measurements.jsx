import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiUser,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiStar,
  FiCheck,
  FiX,
  FiChevronRight,
  FiInfo
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { measurementsAPI } from '../services/api';
import { MeasurementInput } from '../components/measurements';
import Button from '../components/common/Button';
import './Measurements.scss';

export default function Measurements() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data } = await measurementsAPI.getProfiles();
      if (data.success) {
        setProfiles(data.data);
        // Auto-select default profile if exists
        const defaultProfile = data.data.find(p => p.isDefault);
        if (defaultProfile && !selectedProfile) {
          setSelectedProfile(defaultProfile);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = () => {
    setEditingProfile(null);
    setShowEditor(true);
  };

  const handleEditProfile = (profile) => {
    setEditingProfile(profile);
    setSelectedProfile(profile);
    setShowEditor(true);
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Are you sure you want to delete this measurement profile?')) {
      return;
    }

    setDeletingId(profileId);
    try {
      await measurementsAPI.deleteProfile(profileId);
      toast.success('Profile deleted');
      if (selectedProfile?._id === profileId) {
        setSelectedProfile(null);
      }
      fetchProfiles();
    } catch (error) {
      toast.error('Failed to delete profile');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (profileId) => {
    try {
      await measurementsAPI.setDefaultProfile(profileId);
      toast.success('Default profile updated');
      fetchProfiles();
    } catch (error) {
      toast.error('Failed to set default');
    }
  };

  const handleSave = async (data) => {
    toast.success('Measurements saved successfully');
    setShowEditor(false);
    fetchProfiles();
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingProfile(null);
  };

  // Calculate profile completeness
  const getCompleteness = (profile) => {
    if (!profile.measurements || profile.measurements.length === 0) return 0;
    // Basic completeness based on essential measurements
    const essentialPoints = ['chest', 'waist', 'hip', 'shoulder_width', 'height'];
    const filled = essentialPoints.filter(key =>
      profile.measurements.some(m => m.pointKey === key && m.value)
    ).length;
    return Math.round((filled / essentialPoints.length) * 100);
  };

  if (loading) {
    return (
      <div className="measurements-page page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="measurements-page page">
      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <h1>My Measurements</h1>
            <p>
              Save your body measurements to quickly book tailoring services.
              You can create multiple profiles for yourself, family members, or friends.
            </p>
          </div>
          {!showEditor && (
            <Button onClick={handleCreateProfile}>
              <FiPlus /> New Profile
            </Button>
          )}
        </div>

        {showEditor ? (
          <div className="measurement-editor">
            <div className="editor-header">
              <h2>{editingProfile ? 'Edit Profile' : 'Create New Profile'}</h2>
              <button className="close-btn" onClick={handleCancel}>
                <FiX />
              </button>
            </div>
            <MeasurementInput
              profileId={editingProfile?._id}
              gender={editingProfile?.gender || 'male'}
              onSave={handleSave}
              onCancel={handleCancel}
              showProfileSelector={!editingProfile}
              mode="customer"
            />
          </div>
        ) : (
          <div className="profiles-section">
            {profiles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <FiUser />
                </div>
                <h3>No Measurement Profiles Yet</h3>
                <p>
                  Create your first measurement profile to get started.
                  Your measurements will be saved and can be reused across bookings.
                </p>
                <Button onClick={handleCreateProfile}>
                  <FiPlus /> Create Your First Profile
                </Button>
              </div>
            ) : (
              <>
                <div className="profiles-grid">
                  {profiles.map(profile => (
                    <div
                      key={profile._id}
                      className={`profile-card ${selectedProfile?._id === profile._id ? 'selected' : ''}`}
                      onClick={() => setSelectedProfile(profile)}
                    >
                      <div className="profile-header">
                        <div className="profile-avatar">
                          <FiUser />
                        </div>
                        <div className="profile-info">
                          <h3>
                            {profile.profileName}
                            {profile.isDefault && (
                              <span className="default-badge">
                                <FiStar /> Default
                              </span>
                            )}
                          </h3>
                          <p className="profile-meta">
                            {profile.gender === 'male' ? '♂ Male' : '♀ Female'}
                            {profile.bodyType && ` • ${profile.bodyType}`}
                          </p>
                        </div>
                      </div>

                      <div className="profile-completeness">
                        <div className="completeness-label">
                          <span>Profile Completeness</span>
                          <span>{getCompleteness(profile)}%</span>
                        </div>
                        <div className="completeness-bar">
                          <div
                            className="completeness-fill"
                            style={{ width: `${getCompleteness(profile)}%` }}
                          />
                        </div>
                      </div>

                      <div className="profile-measurements-preview">
                        {profile.measurements?.slice(0, 4).map(m => (
                          <div key={m.pointKey} className="measurement-preview">
                            <span className="label">{m.pointKey.replace(/_/g, ' ')}</span>
                            <span className="value">{m.value} {m.unit}</span>
                          </div>
                        ))}
                        {profile.measurements?.length > 4 && (
                          <div className="measurement-preview more">
                            +{profile.measurements.length - 4} more
                          </div>
                        )}
                        {(!profile.measurements || profile.measurements.length === 0) && (
                          <p className="no-measurements">No measurements added yet</p>
                        )}
                      </div>

                      <div className="profile-actions">
                        <button
                          className="action-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProfile(profile);
                          }}
                        >
                          <FiEdit2 /> Edit
                        </button>
                        {!profile.isDefault && (
                          <button
                            className="action-btn default"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(profile._id);
                            }}
                          >
                            <FiStar /> Set Default
                          </button>
                        )}
                        <button
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(profile._id);
                          }}
                          disabled={deletingId === profile._id}
                        >
                          <FiTrash2 /> {deletingId === profile._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add new profile card */}
                  <div className="profile-card add-new" onClick={handleCreateProfile}>
                    <div className="add-content">
                      <FiPlus />
                      <span>Add New Profile</span>
                    </div>
                    <p className="add-hint">
                      Create a profile for someone else (partner, child, etc.)
                    </p>
                  </div>
                </div>

                {/* Selected profile detail view */}
                {selectedProfile && (
                  <div className="profile-detail">
                    <div className="detail-header">
                      <h2>{selectedProfile.profileName}</h2>
                      <Button
                        variant="secondary"
                        onClick={() => handleEditProfile(selectedProfile)}
                      >
                        <FiEdit2 /> Edit Measurements
                      </Button>
                    </div>

                    <div className="detail-content">
                      <div className="info-section">
                        <h3>Profile Information</h3>
                        <div className="info-grid">
                          <div className="info-item">
                            <span className="label">Gender</span>
                            <span className="value">
                              {selectedProfile.gender === 'male' ? '♂ Male' : '♀ Female'}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="label">Body Type</span>
                            <span className="value">
                              {selectedProfile.bodyType || 'Not specified'}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="label">Preferred Unit</span>
                            <span className="value">
                              {selectedProfile.preferredUnit === 'inches' ? 'Inches' : 'Centimeters'}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="label">Last Updated</span>
                            <span className="value">
                              {new Date(selectedProfile.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {selectedProfile.notes && (
                          <div className="notes-section">
                            <span className="label">Notes</span>
                            <p className="value">{selectedProfile.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="measurements-section">
                        <h3>All Measurements</h3>
                        {selectedProfile.measurements?.length > 0 ? (
                          <div className="measurements-grid">
                            {selectedProfile.measurements.map(m => (
                              <div key={m.pointKey} className="measurement-item">
                                <span className="label">
                                  {m.pointKey.replace(/_/g, ' ')}
                                </span>
                                <span className="value">
                                  {m.value} {m.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-measurements">
                            <FiInfo />
                            <p>No measurements recorded yet.</p>
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => handleEditProfile(selectedProfile)}
                            >
                              Add Measurements
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tips section */}
        <div className="tips-section">
          <h3>Tips for Accurate Measurements</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">1</div>
              <h4>Use a Flexible Tape</h4>
              <p>Use a cloth or flexible measuring tape for accurate body measurements.</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">2</div>
              <h4>Stand Naturally</h4>
              <p>Stand relaxed with arms at your sides. Don't hold your breath or suck in.</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">3</div>
              <h4>Get Help</h4>
              <p>Have someone else take measurements for better accuracy, especially for back measurements.</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">4</div>
              <h4>Wear Fitted Clothes</h4>
              <p>Wear light, fitted clothing or undergarments when measuring.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
