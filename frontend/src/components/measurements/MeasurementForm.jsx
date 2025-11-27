import { useState, useEffect } from 'react';
import { FiInfo, FiCheck, FiAlertCircle } from 'react-icons/fi';
import './MeasurementForm.scss';

export default function MeasurementForm({
  measurementPoints = [],
  measurements = {},
  unit = 'cm',
  onMeasurementChange,
  onPointFocus,
  onPointBlur,
  selectedPoint,
  readonly = false,
  showInstructions = true
}) {
  const [localMeasurements, setLocalMeasurements] = useState(measurements);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setLocalMeasurements(measurements);
  }, [measurements]);

  const handleInputChange = (pointKey, value) => {
    // Allow empty string or valid numbers
    const numValue = value === '' ? '' : parseFloat(value);

    // Validate
    if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 500)) {
      setErrors(prev => ({ ...prev, [pointKey]: 'Invalid value' }));
      return;
    }

    setErrors(prev => ({ ...prev, [pointKey]: null }));

    const updated = {
      ...localMeasurements,
      [pointKey]: numValue
    };
    setLocalMeasurements(updated);
    onMeasurementChange?.(pointKey, numValue);
  };

  const handleFocus = (point) => {
    onPointFocus?.(point);
  };

  const handleBlur = () => {
    onPointBlur?.();
  };

  // Group points by category
  const groupedPoints = measurementPoints.reduce((acc, point) => {
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

  const categoryOrder = ['full_body', 'upper_body', 'lower_body', 'arms', 'legs', 'other'];

  // Calculate completeness
  const requiredPoints = measurementPoints.filter(p => p.isRequired);
  const completedRequired = requiredPoints.filter(p =>
    localMeasurements[p.key] !== undefined &&
    localMeasurements[p.key] !== '' &&
    localMeasurements[p.key] !== null
  );
  const completeness = requiredPoints.length > 0
    ? Math.round((completedRequired.length / requiredPoints.length) * 100)
    : 100;

  return (
    <div className="measurement-form">
      {/* Progress indicator */}
      <div className="measurement-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${completeness}%` }}
          />
        </div>
        <span className="progress-text">
          {completeness}% Complete ({completedRequired.length}/{requiredPoints.length} required)
        </span>
      </div>

      {/* Unit indicator */}
      <div className="unit-indicator">
        All measurements in <strong>{unit === 'cm' ? 'centimeters (cm)' : 'inches (in)'}</strong>
      </div>

      {/* Grouped measurement inputs */}
      <div className="measurement-groups">
        {categoryOrder.map(category => {
          const points = groupedPoints[category];
          if (!points || points.length === 0) return null;

          return (
            <div key={category} className="measurement-group">
              <h4 className="group-title">{categoryLabels[category]}</h4>
              <div className="measurement-fields">
                {points.map(point => {
                  const value = localMeasurements[point.key];
                  const hasValue = value !== undefined && value !== '' && value !== null;
                  const isActive = selectedPoint?.key === point.key;
                  const error = errors[point.key];

                  return (
                    <div
                      key={point.key}
                      className={`measurement-field ${isActive ? 'active' : ''} ${hasValue ? 'completed' : ''} ${error ? 'error' : ''}`}
                    >
                      <div className="field-header">
                        <label htmlFor={`measurement-${point.key}`}>
                          {point.name}
                          {point.isRequired && <span className="required">*</span>}
                        </label>
                        <div className="field-status">
                          {hasValue ? (
                            <FiCheck className="status-icon success" />
                          ) : point.isRequired ? (
                            <FiAlertCircle className="status-icon warning" />
                          ) : null}
                        </div>
                      </div>

                      <div className="field-input-wrapper">
                        <input
                          type="number"
                          id={`measurement-${point.key}`}
                          value={value ?? ''}
                          onChange={(e) => handleInputChange(point.key, e.target.value)}
                          onFocus={() => handleFocus(point)}
                          onBlur={handleBlur}
                          placeholder="0"
                          step="0.1"
                          min="0"
                          max="500"
                          disabled={readonly}
                          className={error ? 'has-error' : ''}
                        />
                        <span className="unit-label">{unit}</span>
                      </div>

                      {error && (
                        <span className="error-message">{error}</span>
                      )}

                      {showInstructions && point.instructions && (
                        <div className="field-instructions">
                          <FiInfo className="info-icon" />
                          <span>{point.instructions}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
