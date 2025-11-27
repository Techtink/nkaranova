import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import { tailorsAPI } from '../../services/api';
import { DAYS_OF_WEEK } from '../../utils/constants';
import './Availability.scss';

export default function TailorAvailability() {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await tailorsAPI.getMyProfile();
      setAvailability(response.data.data.availability || getDefaultSchedule());
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSchedule = () => ({
    schedule: {
      monday: { isOpen: false, slots: [] },
      tuesday: { isOpen: false, slots: [] },
      wednesday: { isOpen: false, slots: [] },
      thursday: { isOpen: false, slots: [] },
      friday: { isOpen: false, slots: [] },
      saturday: { isOpen: false, slots: [] },
      sunday: { isOpen: false, slots: [] }
    },
    slotDuration: 60,
    bufferTime: 15,
    advanceBookingDays: 30
  });

  const toggleDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          isOpen: !prev.schedule[day].isOpen,
          slots: !prev.schedule[day].isOpen ? [{ start: '09:00', end: '17:00' }] : []
        }
      }
    }));
  };

  const updateSlot = (day, index, field, value) => {
    setAvailability(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          slots: prev.schedule[day].slots.map((slot, i) =>
            i === index ? { ...slot, [field]: value } : slot
          )
        }
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await tailorsAPI.updateMyAvailability({
        schedule: availability.schedule,
        slotDuration: availability.slotDuration,
        bufferTime: availability.bufferTime,
        advanceBookingDays: availability.advanceBookingDays
      });
      toast.success('Availability saved');
    } catch (error) {
      toast.error('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="availability-page page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Availability</h1>
            <p>Set your weekly schedule for customer bookings</p>
          </div>
          <Button onClick={handleSave} loading={saving}>Save Changes</Button>
        </div>

        <div className="availability-settings">
          <div className="settings-card">
            <h3>Settings</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label>Appointment Duration (minutes)</label>
                <select
                  value={availability.slotDuration}
                  onChange={(e) => setAvailability(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Buffer Between Appointments</label>
                <select
                  value={availability.bufferTime}
                  onChange={(e) => setAvailability(prev => ({ ...prev, bufferTime: parseInt(e.target.value) }))}
                >
                  <option value="0">No buffer</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Advance Booking (days)</label>
                <select
                  value={availability.advanceBookingDays}
                  onChange={(e) => setAvailability(prev => ({ ...prev, advanceBookingDays: parseInt(e.target.value) }))}
                >
                  <option value="7">1 week</option>
                  <option value="14">2 weeks</option>
                  <option value="30">1 month</option>
                  <option value="60">2 months</option>
                </select>
              </div>
            </div>
          </div>

          <div className="schedule-card">
            <h3>Weekly Schedule</h3>
            <div className="schedule-list">
              {DAYS_OF_WEEK.map(({ key, label }) => (
                <div key={key} className="day-row">
                  <label className="day-toggle">
                    <input
                      type="checkbox"
                      checked={availability.schedule[key]?.isOpen || false}
                      onChange={() => toggleDay(key)}
                    />
                    <span className="day-label">{label}</span>
                  </label>

                  {availability.schedule[key]?.isOpen && (
                    <div className="time-slots">
                      {availability.schedule[key].slots.map((slot, index) => (
                        <div key={index} className="time-slot">
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateSlot(key, index, 'start', e.target.value)}
                          />
                          <span>to</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateSlot(key, index, 'end', e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {!availability.schedule[key]?.isOpen && (
                    <span className="closed-label">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
