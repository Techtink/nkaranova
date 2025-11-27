import { useState, useEffect } from 'react';
import {
  FiSave,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiToggleLeft,
  FiToggleRight,
  FiInfo,
  FiRefreshCw
} from 'react-icons/fi';
import { MannequinViewer } from '../../components/measurements';
import api from '../../services/api';
import './Measurements.scss';

export default function TailorMeasurements() {
  const [config, setConfig] = useState(null);
  const [systemPoints, setSystemPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewGender, setPreviewGender] = useState('male');
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customPointForm, setCustomPointForm] = useState({
    name: '',
    description: '',
    category: 'other',
    applicableGenders: ['both'],
    instructions: '',
    isRequired: true
  });

  // Fetch config and system points
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch system points
        const pointsRes = await api.get('/measurements/points');
        if (pointsRes.data.success) {
          setSystemPoints(pointsRes.data.data);
        }

        // Fetch tailor's config
        const configRes = await api.get('/measurements/tailor/config');
        if (configRes.data.success) {
          setConfig(configRes.data.data.config);
        }
      } catch (error) {
        console.error('Error fetching measurement config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get combined measurement points for preview
  const getCombinedPoints = () => {
    if (!config) return systemPoints;

    const points = [];

    // Add configured system points
    const configuredKeys = new Set(config.requiredSystemPoints?.map(rsp => rsp.pointKey) || []);

    systemPoints
      .filter(sp => configuredKeys.has(sp.key))
      .forEach(sp => {
        const tailorConfig = config.requiredSystemPoints.find(rsp => rsp.pointKey === sp.key);
        points.push({
          ...sp,
          isRequired: tailorConfig?.isRequired ?? true,
          instructions: tailorConfig?.customInstructions || sp.instructions,
          isCustom: false
        });
      });

    // Add custom points
    config.customPoints?.forEach(cp => {
      points.push({
        ...cp,
        isCustom: true
      });
    });

    // Filter by gender
    return points.filter(p =>
      !p.applicableGenders ||
      p.applicableGenders.includes(previewGender) ||
      p.applicableGenders.includes('both')
    );
  };

  // Toggle system point
  const toggleSystemPoint = (pointKey) => {
    if (!config) return;

    const existingIndex = config.requiredSystemPoints.findIndex(rsp => rsp.pointKey === pointKey);

    let updatedPoints;
    if (existingIndex >= 0) {
      // Remove point
      updatedPoints = config.requiredSystemPoints.filter(rsp => rsp.pointKey !== pointKey);
    } else {
      // Add point
      updatedPoints = [
        ...config.requiredSystemPoints,
        { pointKey, isRequired: true, order: config.requiredSystemPoints.length + 1 }
      ];
    }

    setConfig(prev => ({
      ...prev,
      requiredSystemPoints: updatedPoints
    }));
  };

  // Toggle point required status
  const toggleRequired = (pointKey) => {
    if (!config) return;

    const updated = config.requiredSystemPoints.map(rsp => {
      if (rsp.pointKey === pointKey) {
        return { ...rsp, isRequired: !rsp.isRequired };
      }
      return rsp;
    });

    setConfig(prev => ({
      ...prev,
      requiredSystemPoints: updated
    }));
  };

  // Save configuration
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/measurements/tailor/config/system-points', {
        requiredSystemPoints: config.requiredSystemPoints
      });

      // Show success message
      alert('Measurement configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // Add custom point
  const handleAddCustomPoint = async () => {
    if (!customPointForm.name) {
      alert('Please enter a name for the measurement point');
      return;
    }

    try {
      const position = selectedPoint ? {
        male: { front: { x: 50, y: 50 } },
        female: { front: { x: 50, y: 50 } }
      } : {
        male: { front: { x: 50, y: 50 } },
        female: { front: { x: 50, y: 50 } }
      };

      const res = await api.post('/measurements/tailor/config/custom-point', {
        ...customPointForm,
        position
      });

      if (res.data.success) {
        // Refresh config
        const configRes = await api.get('/measurements/tailor/config');
        if (configRes.data.success) {
          setConfig(configRes.data.data.config);
        }

        // Reset form
        setCustomPointForm({
          name: '',
          description: '',
          category: 'other',
          applicableGenders: ['both'],
          instructions: '',
          isRequired: true
        });
        setShowAddCustom(false);
      }
    } catch (error) {
      console.error('Error adding custom point:', error);
      alert('Failed to add custom point');
    }
  };

  // Delete custom point
  const handleDeleteCustomPoint = async (pointKey) => {
    if (!confirm('Are you sure you want to delete this custom measurement point?')) return;

    try {
      await api.delete(`/measurements/tailor/config/custom-point/${pointKey}`);

      // Refresh config
      const configRes = await api.get('/measurements/tailor/config');
      if (configRes.data.success) {
        setConfig(configRes.data.data.config);
      }
    } catch (error) {
      console.error('Error deleting custom point:', error);
    }
  };

  // Group system points by category
  const groupedSystemPoints = systemPoints.reduce((acc, point) => {
    const category = point.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(point);
    return acc;
  }, {});

  const categoryLabels = {
    upper_body: 'Upper Body',
    lower_body: 'Lower Body',
    full_body: 'Full Body',
    arms: 'Arms',
    legs: 'Legs',
    other: 'Other'
  };

  if (loading) {
    return (
      <div className="tailor-measurements loading">
        <div className="spinner" />
        <span>Loading measurement configuration...</span>
      </div>
    );
  }

  return (
    <div className="tailor-measurements">
      <div className="page-header">
        <div>
          <h1>Measurement Configuration</h1>
          <p>Configure which measurements you require from customers</p>
        </div>
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
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="measurements-layout">
        {/* Preview Panel */}
        <div className="preview-panel">
          <div className="preview-header">
            <h3>Preview</h3>
            <div className="gender-toggle">
              <button
                className={previewGender === 'male' ? 'active' : ''}
                onClick={() => setPreviewGender('male')}
              >
                Male
              </button>
              <button
                className={previewGender === 'female' ? 'active' : ''}
                onClick={() => setPreviewGender('female')}
              >
                Female
              </button>
            </div>
          </div>

          <MannequinViewer
            gender={previewGender}
            measurements={getCombinedPoints()}
            selectedPoint={selectedPoint}
            onPointClick={setSelectedPoint}
            showLabels={true}
          />

          <div className="preview-info">
            <FiInfo />
            <span>Click on the mannequin to position custom measurement points</span>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="config-panel">
          {/* System Points */}
          <div className="config-section">
            <h3>Standard Measurements</h3>
            <p className="section-desc">
              Select which standard measurements you want to collect from customers
            </p>

            {Object.entries(groupedSystemPoints).map(([category, points]) => (
              <div key={category} className="point-category">
                <h4>{categoryLabels[category]}</h4>
                <div className="points-list">
                  {points.map(point => {
                    const isEnabled = config?.requiredSystemPoints?.some(rsp => rsp.pointKey === point.key);
                    const tailorConfig = config?.requiredSystemPoints?.find(rsp => rsp.pointKey === point.key);

                    return (
                      <div
                        key={point.key}
                        className={`point-item ${isEnabled ? 'enabled' : ''}`}
                      >
                        <div className="point-toggle">
                          <button
                            className="toggle-btn"
                            onClick={() => toggleSystemPoint(point.key)}
                          >
                            {isEnabled ? <FiToggleRight className="on" /> : <FiToggleLeft className="off" />}
                          </button>
                        </div>

                        <div className="point-info">
                          <span className="point-name">{point.name}</span>
                          {point.description && (
                            <span className="point-desc">{point.description}</span>
                          )}
                        </div>

                        {isEnabled && (
                          <div className="point-actions">
                            <label className="required-toggle">
                              <input
                                type="checkbox"
                                checked={tailorConfig?.isRequired !== false}
                                onChange={() => toggleRequired(point.key)}
                              />
                              <span>Required</span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Points */}
          <div className="config-section">
            <div className="section-header">
              <h3>Custom Measurements</h3>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setShowAddCustom(!showAddCustom)}
              >
                <FiPlus />
                Add Custom
              </button>
            </div>

            {showAddCustom && (
              <div className="custom-point-form">
                <input
                  type="text"
                  placeholder="Measurement name"
                  value={customPointForm.name}
                  onChange={(e) => setCustomPointForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={customPointForm.description}
                  onChange={(e) => setCustomPointForm(prev => ({ ...prev, description: e.target.value }))}
                />
                <select
                  value={customPointForm.category}
                  onChange={(e) => setCustomPointForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="upper_body">Upper Body</option>
                  <option value="lower_body">Lower Body</option>
                  <option value="arms">Arms</option>
                  <option value="legs">Legs</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={customPointForm.applicableGenders[0]}
                  onChange={(e) => setCustomPointForm(prev => ({
                    ...prev,
                    applicableGenders: e.target.value === 'both' ? ['both'] : [e.target.value]
                  }))}
                >
                  <option value="both">Both Genders</option>
                  <option value="male">Male Only</option>
                  <option value="female">Female Only</option>
                </select>
                <textarea
                  placeholder="Instructions for customer"
                  value={customPointForm.instructions}
                  onChange={(e) => setCustomPointForm(prev => ({ ...prev, instructions: e.target.value }))}
                />
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={customPointForm.isRequired}
                    onChange={(e) => setCustomPointForm(prev => ({ ...prev, isRequired: e.target.checked }))}
                  />
                  Required measurement
                </label>
                <div className="form-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowAddCustom(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={handleAddCustomPoint}>
                    Add Point
                  </button>
                </div>
              </div>
            )}

            {config?.customPoints?.length > 0 ? (
              <div className="custom-points-list">
                {config.customPoints.map(point => (
                  <div key={point.key} className="custom-point-item">
                    <div className="point-info">
                      <span className="point-name">{point.name}</span>
                      {point.description && (
                        <span className="point-desc">{point.description}</span>
                      )}
                      <span className="point-meta">
                        {categoryLabels[point.category]} •{' '}
                        {point.applicableGenders?.includes('both') ? 'Both' :
                          point.applicableGenders?.includes('male') ? 'Male' : 'Female'} •{' '}
                        {point.isRequired ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    <div className="point-actions">
                      <button
                        className="action-btn danger"
                        onClick={() => handleDeleteCustomPoint(point.key)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-custom">
                <p>No custom measurements added yet</p>
                <span>Add custom measurement points specific to your services</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
