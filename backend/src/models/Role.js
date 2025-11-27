import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Role name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  permissions: [{
    type: String,
    enum: [
      'manage_tailors',
      'manage_works',
      'manage_reviews',
      'manage_verifications',
      'manage_guest_chats',
      'manage_referrals',
      'manage_featured',
      'manage_settings',
      'manage_team'
    ]
  }],
  isSystem: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Prevent deletion of system roles
roleSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  if (this.isSystem) {
    next(new Error('Cannot delete system roles'));
  } else {
    next();
  }
});

// Static method to get or create default admin role
roleSchema.statics.getDefaultAdminRole = async function() {
  let role = await this.findOne({ name: 'Super Admin', isSystem: true });
  if (!role) {
    role = await this.create({
      name: 'Super Admin',
      description: 'Full access to all admin features',
      permissions: [
        'manage_tailors',
        'manage_works',
        'manage_reviews',
        'manage_verifications',
        'manage_guest_chats',
        'manage_referrals',
        'manage_featured',
        'manage_settings',
        'manage_team'
      ],
      isSystem: true
    });
  }
  return role;
};

export default mongoose.model('Role', roleSchema);
