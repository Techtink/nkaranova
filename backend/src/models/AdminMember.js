import mongoose from 'mongoose';

const adminMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  inviteToken: {
    type: String,
    default: null
  },
  inviteExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for faster lookups
adminMemberSchema.index({ user: 1, isActive: 1 });

// Instance method to check if member has a specific permission
adminMemberSchema.methods.hasPermission = async function(permission) {
  await this.populate('role');
  return this.role?.permissions?.includes(permission) || false;
};

// Static method to check if a user is an admin member
adminMemberSchema.statics.isAdminMember = async function(userId) {
  const member = await this.findOne({ user: userId, isActive: true });
  return !!member;
};

// Static method to get member with permissions
adminMemberSchema.statics.getMemberWithPermissions = async function(userId) {
  return this.findOne({ user: userId, isActive: true }).populate('role user');
};

export default mongoose.model('AdminMember', adminMemberSchema);
