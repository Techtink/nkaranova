import { useState, useEffect } from 'react';
import MannequinViewer from './MannequinViewer';
import MeasurementForm from './MeasurementForm';
import { FiUser, FiUsers, FiPlus, FiSave, FiRefreshCw } from 'react-icons/fi';
import api from '../../services/api';
import './MeasurementInput.scss';

// Sample default measurement points (will be fetched from API in production)
const defaultMeasurementPoints = [
  { key: 'chest', name: 'Chest', category: 'upper_body', isRequired: true, instructions: 'Measure around the fullest part of your chest, keeping the tape parallel to the ground.', position: { male: { front: { x: 50, y: 28 } }, female: { front: { x: 50, y: 26 } } } },
  { key: 'bust', name: 'Bust', category: 'upper_body', isRequired: true, applicableGenders: ['female'], instructions: 'Wrap the tape measure around the fullest part of your bust.', position: { male: { front: { x: 50, y: 28 } }, female: { front: { x: 50, y: 25 } } } },
  { key: 'waist', name: 'Waist', category: 'upper_body', isRequired: true, instructions: 'Find your natural waistline (smallest part) and measure around it.', position: { male: { front: { x: 50, y: 38 } }, female: { front: { x: 50, y: 36 } } } },
  { key: 'shoulder_width', name: 'Shoulder Width', category: 'upper_body', isRequired: true, instructions: 'Measure from the edge of one shoulder to the edge of the other.', position: { male: { front: { x: 50, y: 18 } }, female: { front: { x: 50, y: 17 } } } },
  { key: 'neck', name: 'Neck', category: 'upper_body', isRequired: false, instructions: 'Measure around the base of your neck where a collar would sit.', position: { male: { front: { x: 50, y: 12 } }, female: { front: { x: 50, y: 11 } } } },
  { key: 'hip', name: 'Hip', category: 'lower_body', isRequired: true, instructions: 'Measure around the fullest part of your hips and buttocks.', position: { male: { front: { x: 50, y: 48 } }, female: { front: { x: 50, y: 46 } } } },
  { key: 'inseam', name: 'Inseam', category: 'legs', isRequired: true, instructions: 'Measure from the crotch seam down to the ankle.', position: { male: { front: { x: 45, y: 70 } }, female: { front: { x: 45, y: 68 } } } },
  { key: 'outseam', name: 'Outseam', category: 'legs', isRequired: false, instructions: 'Measure from your waist down the outside of your leg to your ankle.', position: { male: { front: { x: 35, y: 65 } }, female: { front: { x: 35, y: 63 } } } },
  { key: 'thigh', name: 'Thigh', category: 'legs', isRequired: false, instructions: 'Measure around the fullest part of your thigh.', position: { male: { front: { x: 40, y: 55 } }, female: { front: { x: 40, y: 53 } } } },
  { key: 'sleeve_length', name: 'Sleeve Length', category: 'arms', isRequired: true, instructions: 'Measure from the shoulder seam down to the wrist bone.', position: { male: { front: { x: 20, y: 35 } }, female: { front: { x: 18, y: 33 } } } },
  { key: 'bicep', name: 'Bicep', category: 'arms', isRequired: false, instructions: 'Measure around the fullest part of your upper arm.', position: { male: { front: { x: 22, y: 30 } }, female: { front: { x: 20, y: 28 } } } },
  { key: 'wrist', name: 'Wrist', category: 'arms', isRequired: false, instructions: 'Measure around your wrist at the wrist bone.', position: { male: { front: { x: 15, y: 48 } }, female: { front: { x: 13, y: 46 } } } },
  { key: 'height', name: 'Height', category: 'full_body', isRequired: true, instructions: 'Stand straight against a wall and measure from the floor to the top of your head.', position: { male: { front: { x: 70, y: 50 } }, female: { front: { x: 70, y: 50 } } } }
];

export default function MeasurementInput({
  tailorId = null,
  profileId = null,
  gender: initialGender = 'male',
  onSave,
  onCancel,
  showProfileSelector = true,
  mode = 'customer' // 'customer' or 'tailor-config'
}) {
  const [gender, setGender] = useState(initialGender);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(profileId);
  const [measurements, setMeasurements] = useState({});
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const [highlightedPoint, setHighlightedPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [unit, setUnit] = useState('cm');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileName, setProfileName] = useState('My Measurements');
  const [showNewProfileForm, setShowNewProfileForm] = useState(false);

  // Fetch measurement points and profiles
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch measurement points
        let points = defaultMeasurementPoints;
        if (tailorId) {
          try {
            const { data } = await api.get(`/measurements/tailor/${tailorId}/requirements?gender=${gender}`);
            if (data.success && data.data.points) {
              points = data.data.points;
              setUnit(data.data.settings?.preferredUnit || 'cm');
            }
          } catch (err) {
            console.log('Using default measurement points');
          }
        } else {
          try {
            const { data } = await api.get(`/measurements/points?gender=${gender}`);
            if (data.success) {
              points = data.data;
            }
          } catch (err) {
            console.log('Using default measurement points');
          }
        }

        // Filter by gender
        const filteredPoints = points.filter(p =>
          !p.applicableGenders ||
          p.applicableGenders.includes(gender) ||
          p.applicableGenders.includes('both')
        );
        setMeasurementPoints(filteredPoints);

        // Fetch user's profiles
        if (showProfileSelector) {
          try {
            const { data } = await api.get('/measurements/profiles');
            if (data.success) {
              setProfiles(data.data);
              // Select default profile if none specified
              if (!selectedProfileId && data.data.length > 0) {
                const defaultProfile = data.data.find(p => p.isDefault) || data.data[0];
                setSelectedProfileId(defaultProfile._id);
                setGender(defaultProfile.gender);
                loadProfileMeasurements(defaultProfile);
              }
            }
          } catch (err) {
            console.log('No profiles found');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tailorId, gender, showProfileSelector]);

  // Load measurements from a profile
  const loadProfileMeasurements = (profile) => {
    if (!profile) return;
    const meas = {};
    profile.measurements?.forEach(m => {
      meas[m.pointKey] = m.value;
    });
    setMeasurements(meas);
    setProfileName(profile.profileName);
    setGender(profile.gender);
  };

  // Handle profile selection
  const handleProfileSelect = (profile) => {
    setSelectedProfileId(profile._id);
    loadProfileMeasurements(profile);
    setShowNewProfileForm(false);
  };

  // Handle measurement change
  const handleMeasurementChange = (pointKey, value) => {
    setMeasurements(prev => ({
      ...prev,
      [pointKey]: value
    }));
  };

  // Handle point click from mannequin
  const handlePointClick = (point) => {
    setSelectedPoint(point);
    // Focus the corresponding input field
    const input = document.getElementById(`measurement-${point.key}`);
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert measurements to array format
      const measurementsArray = Object.entries(measurements)
        .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        .map(([pointKey, value]) => ({
          pointKey,
          value: parseFloat(value),
          unit
        }));

      if (selectedProfileId && !showNewProfileForm) {
        // Update existing profile
        await api.put(`/measurements/profiles/${selectedProfileId}/measurements`, {
          measurements: measurementsArray
        });
      } else {
        // Create new profile
        const { data } = await api.post('/measurements/profiles', {
          profileName,
          gender,
          preferredUnit: unit,
          measurements: measurementsArray
        });
        if (data.success) {
          setSelectedProfileId(data.data._id);
          setShowNewProfileForm(false);
          // Refresh profiles
          const profilesRes = await api.get('/measurements/profiles');
          if (profilesRes.data.success) {
            setProfiles(profilesRes.data.data);
          }
        }
      }

      onSave?.({ measurements, profileId: selectedProfileId, profileName, gender });
    } catch (error) {
      console.error('Error saving measurements:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle gender change
  const handleGenderChange = (newGender) => {
    setGender(newGender);
    // Re-filter measurement points based on new gender
    const filtered = defaultMeasurementPoints.filter(p =>
      !p.applicableGenders ||
      p.applicableGenders.includes(newGender) ||
      p.applicableGenders.includes('both')
    );
    setMeasurementPoints(filtered);
  };

  // Create new profile
  const handleNewProfile = () => {
    setShowNewProfileForm(true);
    setSelectedProfileId(null);
    setMeasurements({});
    setProfileName('');
  };

  if (loading) {
    return (
      <div className="measurement-input-loading">
        <div className="spinner" />
        <span>Loading measurement system...</span>
      </div>
    );
  }

  return (
    <div className="measurement-input">
      {/* Header with profile selector */}
      {showProfileSelector && (
        <div className="measurement-header">
          <div className="profile-selector">
            <h3>Measurement Profile</h3>
            <div className="profile-options">
              {profiles.map(profile => (
                <button
                  key={profile._id}
                  className={`profile-btn ${selectedProfileId === profile._id && !showNewProfileForm ? 'active' : ''}`}
                  onClick={() => handleProfileSelect(profile)}
                >
                  <FiUser />
                  <span>{profile.profileName}</span>
                  {profile.isDefault && <span className="default-badge">Default</span>}
                </button>
              ))}
              <button
                className={`profile-btn new ${showNewProfileForm ? 'active' : ''}`}
                onClick={handleNewProfile}
              >
                <FiPlus />
                <span>New Profile</span>
              </button>
            </div>
          </div>

          {showNewProfileForm && (
            <div className="new-profile-form">
              <input
                type="text"
                placeholder="Profile name (e.g., 'My Measurements', 'Partner')"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="profile-name-input"
              />
            </div>
          )}

          {/* Gender selector */}
          <div className="gender-selector">
            <span>Gender:</span>
            <div className="gender-options">
              <button
                className={`gender-btn ${gender === 'male' ? 'active' : ''}`}
                onClick={() => handleGenderChange('male')}
              >
                ♂ Male
              </button>
              <button
                className={`gender-btn ${gender === 'female' ? 'active' : ''}`}
                onClick={() => handleGenderChange('female')}
              >
                ♀ Female
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content: Mannequin + Form */}
      <div className="measurement-content">
        <div className="mannequin-panel">
          <MannequinViewer
            gender={gender}
            measurements={measurementPoints}
            selectedPoint={selectedPoint}
            highlightedPoint={highlightedPoint}
            onPointClick={handlePointClick}
            showLabels={false}
            autoRotate={false}
          />
        </div>

        <div className="form-panel">
          <MeasurementForm
            measurementPoints={measurementPoints}
            measurements={measurements}
            unit={unit}
            onMeasurementChange={handleMeasurementChange}
            onPointFocus={setHighlightedPoint}
            onPointBlur={() => setHighlightedPoint(null)}
            selectedPoint={selectedPoint}
            showInstructions={true}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="measurement-actions">
        {onCancel && (
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <FiRefreshCw className="spinning" />
              Saving...
            </>
          ) : (
            <>
              <FiSave />
              Save Measurements
            </>
          )}
        </button>
      </div>
    </div>
  );
}
