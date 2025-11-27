import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
  start: {
    type: String,
    required: true
  },
  end: {
    type: String,
    required: true
  }
}, { _id: false });

const dayScheduleSchema = new mongoose.Schema({
  isOpen: {
    type: Boolean,
    default: false
  },
  slots: [timeSlotSchema]
}, { _id: false });

const tailorAvailabilitySchema = new mongoose.Schema({
  tailor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TailorProfile',
    required: true,
    unique: true
  },
  // Weekly schedule
  schedule: {
    monday: {
      type: dayScheduleSchema,
      default: { isOpen: false, slots: [] }
    },
    tuesday: {
      type: dayScheduleSchema,
      default: { isOpen: false, slots: [] }
    },
    wednesday: {
      type: dayScheduleSchema,
      default: { isOpen: false, slots: [] }
    },
    thursday: {
      type: dayScheduleSchema,
      default: { isOpen: false, slots: [] }
    },
    friday: {
      type: dayScheduleSchema,
      default: { isOpen: false, slots: [] }
    },
    saturday: {
      type: dayScheduleSchema,
      default: { isOpen: false, slots: [] }
    },
    sunday: {
      type: dayScheduleSchema,
      default: { isOpen: false, slots: [] }
    }
  },
  // Exceptions (holidays, vacation, etc.)
  exceptions: [{
    date: {
      type: Date,
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: false
    },
    slots: [timeSlotSchema],
    reason: String
  }],
  // Slot duration in minutes
  slotDuration: {
    type: Number,
    default: 60
  },
  // Buffer time between appointments
  bufferTime: {
    type: Number,
    default: 15
  },
  // How far in advance can bookings be made
  advanceBookingDays: {
    type: Number,
    default: 30
  },
  // Timezone
  timezone: {
    type: String,
    default: 'UTC'
  }
}, {
  timestamps: true
});

// Get available slots for a specific date
tailorAvailabilitySchema.methods.getAvailableSlotsForDate = function(date, existingBookings = []) {
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });

  // Check for exceptions first
  const exception = this.exceptions.find(
    exc => exc.date.toDateString() === date.toDateString()
  );

  let daySchedule;
  if (exception) {
    if (!exception.isAvailable) {
      return [];
    }
    daySchedule = { isOpen: true, slots: exception.slots };
  } else {
    daySchedule = this.schedule[dayOfWeek];
  }

  if (!daySchedule.isOpen) {
    return [];
  }

  // Generate all possible slots
  const availableSlots = [];

  daySchedule.slots.forEach(slot => {
    const [startHour, startMin] = slot.start.split(':').map(Number);
    const [endHour, endMin] = slot.end.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

      // Calculate slot end
      let slotEndMin = currentMin + this.slotDuration;
      let slotEndHour = currentHour;
      while (slotEndMin >= 60) {
        slotEndMin -= 60;
        slotEndHour++;
      }

      // Check if slot end is within the time range
      if (slotEndHour < endHour || (slotEndHour === endHour && slotEndMin <= endMin)) {
        const slotEnd = `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}`;

        // Check if slot is not already booked
        const isBooked = existingBookings.some(booking => {
          return booking.startTime === slotStart ||
            (booking.startTime < slotEnd && booking.endTime > slotStart);
        });

        if (!isBooked) {
          availableSlots.push({
            start: slotStart,
            end: slotEnd
          });
        }
      }

      // Move to next slot (including buffer time)
      currentMin += this.slotDuration + this.bufferTime;
      while (currentMin >= 60) {
        currentMin -= 60;
        currentHour++;
      }
    }
  });

  return availableSlots;
};

export default mongoose.model('TailorAvailability', tailorAvailabilitySchema);
