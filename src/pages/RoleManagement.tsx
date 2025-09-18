import React, { useState, useEffect } from 'react';
import { 
  MdSearch, 
  MdAdd, 
  MdEdit, 
  MdDelete,
  MdRefresh,
  MdVisibility,
  MdSecurity,
  MdCancel,
  MdWarning,
  MdCheck,
  MdClose
} from 'react-icons/md';
import type { Role, RoleDTO, RoleResponseDTO } from '../types';
import { formatDateTime, cn } from '../utils';
import apiService from '../services/api';

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<RoleResponseDTO[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleResponseDTO | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('view');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleResponseDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<RoleDTO>({
    name: '',
    description: '',
    permissions: []
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [rolesResponse, permissionsResponse] = await Promise.all([
        apiService.getRoles(),
        apiService.getAllPermissions()
      ]);

      setRoles(rolesResponse);
      setPermissions(permissionsResponse);
    } catch (error) {
      console.error('Error fetching role data:', error);
      setError('Failed to load role data. Please try again.');
      setRoles([]);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRoles = roles.filter(role =>
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRole = () => {
    setSelectedRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
    setModalType('create');
    setShowModal(true);
  };

  const handleEditRole = (role: RoleResponseDTO) => {
    setSelectedRole(role);
    setFormData({
      name: role.roleName,
      description: role.description,
      permissions: [...role.permissions]
    });
    setModalType('edit');
    setShowModal(true);
  };

  const handleViewRole = (role: RoleResponseDTO) => {
    setSelectedRole(role);
    setModalType('view');
    setShowModal(true);
  };

  const handleSubmitRole = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (modalType === 'create') {
        await apiService.createRole(formData);
      } else if (modalType === 'edit' && selectedRole) {
        await apiService.updateRole(selectedRole.id, formData);
      }

      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving role:', error);
      setError('Failed to save role. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: RoleResponseDTO) => {
    try {
      setIsDeleting(true);
      await apiService.deleteRole(role.id);
      setShowDeleteModal(false);
      setRoleToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting role:', error);
      setError('Failed to delete role. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePermissionToggle = (permission: string) => {
    const updatedPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission];
    
    setFormData({ ...formData, permissions: updatedPermissions });
  };

  const handleSelectAllPermissions = () => {
    setFormData({ ...formData, permissions: [...permissions] });
  };

  const handleDeselectAllPermissions = () => {
    setFormData({ ...formData, permissions: [] });
  };

  const groupPermissionsByCategory = (permissions: string[]) => {
    const categories: { [key: string]: string[] } = {};
    
    permissions.forEach(permission => {
      const parts = permission.split('_');
      const category = parts.length > 1 ? parts.slice(0, -1).join('_') : 'OTHER';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(permission);
    });
    
    return categories;
  };

  const getPermissionCategoryName = (category: string) => {
    const categoryNames: { [key: string]: string } = {
      'EDIT_ROLES': 'Role Management',
      'PERMISSION_GRANT': 'Permission Management',
      'ROLE': 'Role Management',
      'USER': 'User Management',
      'CAR': 'Vehicle Management',
      'BOOKING': 'Booking Management',
      'SESSION': 'Session Management',
      'RATE': 'Rate Management',
      'PRICING': 'Pricing Management',
      'SENSOR': 'Sensor Management',
      'DASHBOARD': 'Dashboard Access',
      'PARKING_LOT': 'Parking Lot Management',
      'PARKING_SPACE': 'Parking Space Management',
      'OTHER': 'Other Permissions'
    };
    
    return categoryNames[category] || category.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600">Manage user roles and permissions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <MdRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleCreateRole}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <MdAdd className="w-4 h-4" />
            <span>New Role</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <MdWarning className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Roles List */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading roles...</span>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-12">
              <MdSecurity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Roles Found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No roles match your search criteria.' : 'No roles available at the moment.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoles.map((role) => (
                <div key={role.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{role.roleName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {role.permissions.length} permissions
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MdSecurity className="w-4 h-4 mr-2" />
                      <span>ID: {role.id}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Permissions:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission) => (
                          <span key={permission} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {permission}
                          </span>
                        ))}
                        {role.permissions.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{role.permissions.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewRole(role)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Role"
                      >
                        <MdVisibility className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditRole(role)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit Role"
                      >
                        <MdEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setRoleToDelete(role);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Role"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Role Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'create' && 'Create New Role'}
                  {modalType === 'edit' && 'Edit Role'}
                  {modalType === 'view' && `Role Details - ${selectedRole?.roleName}`}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MdCancel className="w-6 h-6" />
                </button>
              </div>

              {modalType === 'view' && selectedRole ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedRole.roleName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role ID</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedRole.id}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRole.description}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Permissions ({selectedRole.permissions.length})</label>
                    <div className="space-y-4">
                      {Object.entries(groupPermissionsByCategory(selectedRole.permissions)).map(([category, categoryPermissions]) => (
                        <div key={category} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">{getPermissionCategoryName(category)}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {categoryPermissions.map((permission) => (
                              <span key={permission} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                <MdCheck className="w-3 h-3 mr-1" />
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter role name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter role description"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Permissions ({formData.permissions.length} selected)
                      </label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={handleSelectAllPermissions}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAllPermissions}
                          className="text-xs text-gray-600 hover:text-gray-800"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      {Object.entries(groupPermissionsByCategory(permissions)).map(([category, categoryPermissions]) => (
                        <div key={category} className="border border-gray-100 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">{getPermissionCategoryName(category)}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {categoryPermissions.map((permission) => (
                              <label key={permission} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.includes(permission)}
                                  onChange={() => handlePermissionToggle(permission)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">{permission}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  {modalType === 'view' ? 'Close' : 'Cancel'}
                </button>
                {modalType !== 'view' && (
                  <button 
                    onClick={handleSubmitRole}
                    disabled={isSubmitting || !formData.name.trim() || !formData.description.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : (modalType === 'create' ? 'Create Role' : 'Save Changes')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <MdWarning className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Role</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the role "{roleToDelete?.roleName}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setRoleToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteRole(roleToDelete!)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
