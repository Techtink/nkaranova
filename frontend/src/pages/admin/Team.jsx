import { useState, useEffect } from 'react';
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiShield,
  FiUsers, FiCheck, FiX, FiMail
} from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import './Admin.scss';

// Default permissions structure
const DEFAULT_PERMISSIONS = {
  manage_tailors: { label: 'Manage Tailors', description: 'Approve, reject, and suspend tailors' },
  manage_works: { label: 'Manage Works', description: 'Approve and reject tailor portfolio works' },
  manage_reviews: { label: 'Manage Reviews', description: 'Moderate and delete reviews' },
  manage_verifications: { label: 'Manage Verifications', description: 'Verify tailor identities' },
  manage_guest_chats: { label: 'Guest Chats', description: 'Respond to guest chat inquiries' },
  manage_referrals: { label: 'Manage Referrals', description: 'View and manage referral system' },
  manage_featured: { label: 'Manage Featured', description: 'Control featured tailor placements' },
  manage_settings: { label: 'Platform Settings', description: 'Modify platform configuration' },
  manage_team: { label: 'Manage Team', description: 'Add, edit, and remove team members' }
};

export default function AdminTeam() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [search, setSearch] = useState('');

  // Modal states
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  // Form states
  const [memberForm, setMemberForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    roleId: ''
  });
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, rolesRes] = await Promise.all([
        adminAPI.getTeamMembers(),
        adminAPI.getRoles()
      ]);
      setTeamMembers(membersRes.data.data || []);
      setRoles(rolesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Member functions
  const openMemberModal = (member = null) => {
    if (member) {
      setSelectedMember(member);
      setMemberForm({
        email: member.user?.email || '',
        firstName: member.user?.firstName || '',
        lastName: member.user?.lastName || '',
        roleId: member.role?._id || ''
      });
    } else {
      setSelectedMember(null);
      setMemberForm({ email: '', firstName: '', lastName: '', roleId: '' });
    }
    setError('');
    setShowMemberModal(true);
  };

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      if (selectedMember) {
        await adminAPI.updateTeamMember(selectedMember._id, {
          roleId: memberForm.roleId
        });
      } else {
        await adminAPI.addTeamMember(memberForm);
      }
      setShowMemberModal(false);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;

    try {
      await adminAPI.removeTeamMember(memberId);
      fetchData();
    } catch (error) {
      console.error('Error removing member:', error);
      alert(error.response?.data?.message || 'Failed to remove member');
    }
  };

  // Role functions
  const openRoleModal = (role = null) => {
    if (role) {
      setSelectedRole(role);
      setRoleForm({
        name: role.name || '',
        description: role.description || '',
        permissions: role.permissions || []
      });
    } else {
      setSelectedRole(null);
      setRoleForm({ name: '', description: '', permissions: [] });
    }
    setError('');
    setShowRoleModal(true);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      if (selectedRole) {
        await adminAPI.updateRole(selectedRole._id, roleForm);
      } else {
        await adminAPI.createRole(roleForm);
      }
      setShowRoleModal(false);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role? Members with this role will need to be reassigned.')) return;

    try {
      await adminAPI.deleteRole(roleId);
      fetchData();
    } catch (error) {
      console.error('Error deleting role:', error);
      alert(error.response?.data?.message || 'Failed to delete role');
    }
  };

  const togglePermission = (permission) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const filteredMembers = teamMembers.filter(member => {
    const searchLower = search.toLowerCase();
    const fullName = `${member.user?.firstName} ${member.user?.lastName}`.toLowerCase();
    const email = member.user?.email?.toLowerCase() || '';
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-page admin-team-page page">
      <div className="container">
        {/* ERP Page Header */}
        <div className="erp-page-header">
          <div className="header-top">
            <div className="header-left">
              <div className="header-icon">
                <FiShield />
              </div>
              <div className="header-text">
                <h1>Team & Roles</h1>
                <p>Manage admin team members and their permissions</p>
              </div>
            </div>
          </div>
          <div className="header-line" />
        </div>

        {/* ERP Tabs */}
        <div className="erp-tabs">
          <button
            className={`erp-tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <FiUsers />
            Team Members ({teamMembers.length})
          </button>
          <button
            className={`erp-tab ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <FiShield />
            Roles ({roles.length})
          </button>
        </div>

        {/* Members Tab */}
        {activeTab === 'members' && (
          <>
            <div className="erp-filters">
              <div className="search-input">
                <span className="search-icon"><FiSearch /></span>
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="btn-erp btn-erp-primary" onClick={() => openMemberModal()}>
                <FiPlus />
                Add Member
              </button>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="erp-table-container">
                <div className="erp-empty-state">
                  <FiUsers />
                  <p className="empty-title">No team members found</p>
                  <p>Add team members to help manage the platform.</p>
                </div>
              </div>
            ) : (
              <div className="erp-table-container">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member._id}>
                        <td>
                          <div className="user-cell">
                            <div className="avatar">
                              {member.user?.firstName?.charAt(0)}
                              {member.user?.lastName?.charAt(0)}
                            </div>
                            <div className="user-info">
                              <span className="name">
                                {member.user?.firstName} {member.user?.lastName}
                              </span>
                              <span className="email">{member.user?.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="erp-badge badge-primary">
                            <FiShield />
                            {member.role?.name || 'No Role'}
                          </span>
                        </td>
                        <td>
                          <span className={`erp-badge ${member.isActive ? 'badge-success' : 'badge-gray'}`}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {new Date(member.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="cell-actions">
                            <button
                              className="erp-action-btn action-view"
                              onClick={() => openMemberModal(member)}
                              title="Edit"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              className="erp-action-btn action-delete"
                              onClick={() => handleRemoveMember(member._id)}
                              title="Remove"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <>
            <div className="erp-filters" style={{ justifyContent: 'flex-end' }}>
              <button className="btn-erp btn-erp-primary" onClick={() => openRoleModal()}>
                <FiPlus />
                Create Role
              </button>
            </div>

            {roles.length === 0 ? (
              <div className="erp-table-container">
                <div className="erp-empty-state">
                  <FiShield />
                  <p className="empty-title">No roles defined</p>
                  <p>Create roles to assign different permissions to team members.</p>
                </div>
              </div>
            ) : (
              <div className="roles-grid">
                {roles.map((role) => (
                  <div key={role._id} className="role-card">
                    <div className="role-header">
                      <div className="role-icon">
                        <FiShield />
                      </div>
                      <div className="role-info">
                        <h3>{role.name}</h3>
                        <p>{role.description || 'No description'}</p>
                      </div>
                      <div className="role-actions">
                        <button onClick={() => openRoleModal(role)} title="Edit">
                          <FiEdit2 />
                        </button>
                        {!role.isSystem && (
                          <button onClick={() => handleDeleteRole(role._id)} title="Delete">
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="role-permissions">
                      <h4>Permissions</h4>
                      <div className="permission-tags">
                        {role.permissions?.length > 0 ? (
                          role.permissions.map((perm) => (
                            <span key={perm} className="permission-tag">
                              <FiCheck />
                              {DEFAULT_PERMISSIONS[perm]?.label || perm}
                            </span>
                          ))
                        ) : (
                          <span className="no-permissions">No permissions assigned</span>
                        )}
                      </div>
                    </div>
                    <div className="role-footer">
                      <span className="member-count">
                        <FiUsers />
                        {teamMembers.filter(m => m.role?._id === role._id).length} members
                      </span>
                      {role.isSystem && (
                        <span className="system-badge">System Role</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Add/Edit Member Modal */}
        <Modal
          isOpen={showMemberModal}
          onClose={() => setShowMemberModal(false)}
          title={selectedMember ? 'Edit Team Member' : 'Add Team Member'}
        >
          <form onSubmit={handleMemberSubmit} className="team-form">
            {error && <div className="form-error">{error}</div>}

            {!selectedMember && (
              <>
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-with-icon">
                    <FiMail />
                    <input
                      type="email"
                      value={memberForm.email}
                      onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <p className="form-help">
                    An invitation will be sent if this email is not registered
                  </p>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={memberForm.firstName}
                      onChange={(e) => setMemberForm({ ...memberForm, firstName: e.target.value })}
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={memberForm.lastName}
                      onChange={(e) => setMemberForm({ ...memberForm, lastName: e.target.value })}
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Assign Role</label>
              <select
                value={memberForm.roleId}
                onChange={(e) => setMemberForm({ ...memberForm, roleId: e.target.value })}
                required
              >
                <option value="">Select a role...</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={() => setShowMemberModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Saving...' : selectedMember ? 'Update Member' : 'Add Member'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Add/Edit Role Modal */}
        <Modal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          title={selectedRole ? 'Edit Role' : 'Create Role'}
        >
          <form onSubmit={handleRoleSubmit} className="team-form">
            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
              <label>Role Name</label>
              <input
                type="text"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="e.g., Support Agent"
                required
                disabled={selectedRole?.isSystem}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Brief description of this role..."
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Permissions</label>
              <div className="permissions-list">
                {Object.entries(DEFAULT_PERMISSIONS).map(([key, perm]) => (
                  <label key={key} className="permission-checkbox">
                    <input
                      type="checkbox"
                      checked={roleForm.permissions.includes(key)}
                      onChange={() => togglePermission(key)}
                    />
                    <div className="permission-info">
                      <span className="permission-label">{perm.label}</span>
                      <span className="permission-desc">{perm.description}</span>
                    </div>
                    {roleForm.permissions.includes(key) ? (
                      <FiCheck className="check-icon" />
                    ) : (
                      <FiX className="x-icon" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={() => setShowRoleModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Saving...' : selectedRole ? 'Update Role' : 'Create Role'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
