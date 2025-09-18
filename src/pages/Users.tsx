import React, { useState, useEffect } from 'react';
import { 
  MdSearch, 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdRefresh,
  MdVisibility,
  MdPeople,
  MdCancel,
  MdWarning,
  MdArrowBack,
  MdArrowForward,
  MdDirectionsCar,
  MdSecurity,
  MdPhone,
  MdEmail,
  MdPerson
} from 'react-icons/md';
import type { 
  UserResponseDTO, 
  UserCreateDTO, 
  UserUpdateDTO,
  UserCarsDTO,
  CarCreateDTO,
  RoleResponseDTO
} from '../types';
import { formatDateTime } from '../utils';
import apiService from '../services/api';

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [roles, setRoles] = useState<RoleResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserResponseDTO | null>(null);
  const [userCars, setUserCars] = useState<UserCarsDTO[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view' | 'cars'>('view');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserResponseDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(10);

  // Form state for users
  const [userFormData, setUserFormData] = useState<UserCreateDTO>({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phoneNumber: '',
    roles: []
  });

  // Form state for cars
  const [carFormData, setCarFormData] = useState<CarCreateDTO>({
    licensePlate: '',
    brand: '',
    model: '',
    color: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [usersResponse, rolesResponse] = await Promise.all([
        apiService.getUsers(currentPage, pageSize),
        apiService.getRoles()
      ]);

      setUsers(usersResponse.content);
      setTotalPages(usersResponse.totalPages);
      setRoles(rolesResponse);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data. Please try again.');
      setUsers([]);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchUserCars = async (userId: number) => {
    try {
      const carsResponse = await apiService.getUserCars(userId, 0, 100);
      setUserCars(carsResponse.content);
    } catch (error) {
      console.error('Error fetching user cars:', error);
      setUserCars([]);
    }
  };

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = () => {
    setSelectedUser(null);
    setUserFormData({
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      phoneNumber: '',
      roles: []
    });
    setModalType('create');
    setShowModal(true);
  };

  const handleEditUser = (user: UserResponseDTO) => {
    setSelectedUser(user);
    setUserFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      password: '',
      confirmPassword: '',
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      roles: user.roles.map(role => role.name)
    });
    setModalType('edit');
    setShowModal(true);
  };

  const handleViewUser = (user: UserResponseDTO) => {
    setSelectedUser(user);
    setModalType('view');
    setShowModal(true);
  };

  const handleViewUserCars = async (user: UserResponseDTO) => {
    setSelectedUser(user);
    await fetchUserCars(user.id);
    setModalType('cars');
    setShowModal(true);
  };

  const handleSubmitUser = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (modalType === 'create') {
        await apiService.createUser(userFormData);
      } else if (modalType === 'edit' && selectedUser) {
        const updateData: UserUpdateDTO = {
          firstName: userFormData.firstName,
          lastName: userFormData.lastName,
          username: userFormData.username,
          email: userFormData.email,
          phoneNumber: userFormData.phoneNumber,
          ...(userFormData.password && { password: userFormData.password, confirmPassword: userFormData.confirmPassword })
        };
        await apiService.updateUser(selectedUser.id, updateData);
      }

      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Failed to save user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: UserResponseDTO) => {
    try {
      setIsDeleting(true);
      await apiService.deleteUser(user.id);
      setShowDeleteModal(false);
      setUserToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddCar = async () => {
    if (!selectedUser) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await apiService.addUserCar(selectedUser.id, carFormData);
      
      setCarFormData({
        licensePlate: '',
        brand: '',
        model: '',
        color: ''
      });
      
      await fetchUserCars(selectedUser.id);
    } catch (error) {
      console.error('Error adding car:', error);
      setError('Failed to add car. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCar = async (carId: number) => {
    if (!selectedUser) return;
    
    try {
      await apiService.removeUserCar(selectedUser.id, carId);
      await fetchUserCars(selectedUser.id);
    } catch (error) {
      console.error('Error removing car:', error);
      setError('Failed to remove car. Please try again.');
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdArrowBack className="w-4 h-4 mr-1" />
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-gray-700">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <MdArrowForward className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage user accounts and vehicles</p>
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
            onClick={handleCreateUser}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <MdAdd className="w-4 h-4" />
            <span>New User</span>
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
        </div>
      </div>

        {/* Users List */}
        <div className="p-6">
              {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading users...</span>
                    </div>
              ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <MdPeople className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                      <p className="text-gray-600">
                {searchTerm ? 'No users match your search criteria.' : 'No users available at the moment.'}
                      </p>
                    </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{user.firstName} {user.lastName}</h3>
                        <p className="text-sm text-gray-600 mt-1">@{user.username}</p>
                        </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.roles.length} roles
                      </span>
                          </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MdEmail className="w-4 h-4 mr-2" />
                        <span className="truncate">{user.email}</span>
                          </div>
                      {user.phoneNumber && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MdPhone className="w-4 h-4 mr-2" />
                          <span>{user.phoneNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <MdPerson className="w-4 h-4 mr-2" />
                        <span>ID: {user.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View User"
                        >
                          <MdVisibility className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewUserCars(user)}
                          className="text-green-600 hover:text-green-900"
                          title="View Cars"
                        >
                          <MdDirectionsCar className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit User"
                        >
                          <MdEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setUserToDelete(user);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
                        >
                          <MdDelete className="w-4 h-4" />
                        </button>
                      </div>
        </div>
            </div>
                ))}
              </div>
              {renderPagination()}
            </>
          )}
          </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'create' && 'Create New User'}
                  {modalType === 'edit' && 'Edit User'}
                  {modalType === 'view' && `User Details - ${selectedUser?.firstName} ${selectedUser?.lastName}`}
                  {modalType === 'cars' && `Cars - ${selectedUser?.firstName} ${selectedUser?.lastName}`}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MdCancel className="w-6 h-6" />
                </button>
              </div>

              {/* User View Modal */}
              {modalType === 'view' && selectedUser ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username</label>
                      <p className="mt-1 text-sm text-gray-900">@{selectedUser.username}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.phoneNumber || 'Not provided'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Roles ({selectedUser.roles.length})</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.roles.map((role) => (
                        <span key={role.name} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          <MdSecurity className="w-3 h-3 mr-1" />
                          {role.name}
                      </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedUser.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Updated</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedUser.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              ) : modalType === 'cars' && selectedUser ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-gray-900">User Cars ({userCars.length})</h4>
                    <button
                      onClick={() => {
                        setCarFormData({
                          licensePlate: '',
                          brand: '',
                          model: '',
                          color: ''
                        });
                        // Show add car form
                      }}
                      className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <MdAdd className="w-4 h-4" />
                      <span>Add Car</span>
                    </button>
                  </div>

                  {/* Add Car Form */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">Add New Car</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">License Plate *</label>
                        <input
                          type="text"
                          value={carFormData.licensePlate}
                          onChange={(e) => setCarFormData({ ...carFormData, licensePlate: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="ABC-123"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Brand *</label>
                        <input
                          type="text"
                          value={carFormData.brand}
                          onChange={(e) => setCarFormData({ ...carFormData, brand: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Toyota"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Model *</label>
                        <input
                          type="text"
                          value={carFormData.model}
                          onChange={(e) => setCarFormData({ ...carFormData, model: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Camry"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Color *</label>
                        <input
                          type="text"
                          value={carFormData.color}
                          onChange={(e) => setCarFormData({ ...carFormData, color: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Red"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={handleAddCar}
                        disabled={isSubmitting || !carFormData.licensePlate || !carFormData.brand || !carFormData.model || !carFormData.color}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Adding...' : 'Add Car'}
                      </button>
                    </div>
                  </div>

                  {/* Cars List */}
                  {userCars.length === 0 ? (
                    <div className="text-center py-8">
                      <MdDirectionsCar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Cars Found</h3>
                      <p className="text-gray-600">This user doesn't have any registered cars.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userCars.map((car) => (
                        <div key={car.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-gray-900">{car.brand} {car.model}</h5>
                              <p className="text-xs text-gray-600">{car.licensePlate}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveCar(car.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Remove Car"
                            >
                              <MdDelete className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-gray-600">
                              <span className="font-medium">Color:</span>
                              <span className="ml-1">{car.color}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <span className="font-medium">Added:</span>
                              <span className="ml-1">{formatDateTime(car.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name *</label>
                      <input
                        type="text"
                        value={userFormData.firstName}
                        onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                      <input
                        type="text"
                        value={userFormData.lastName}
                        onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username *</label>
                      <input
                        type="text"
                        value={userFormData.username}
                        onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter username"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email *</label>
                      <input
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={userFormData.phoneNumber}
                      onChange={(e) => setUserFormData({ ...userFormData, phoneNumber: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>

                  {modalType === 'create' && (
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password *</label>
                      <input
                        type="password"
                          value={userFormData.password}
                          onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter password"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                        <input
                          type="password"
                          value={userFormData.confirmPassword}
                          onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Confirm password"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {modalType === 'edit' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input
                          type="password"
                          value={userFormData.password}
                          onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter new password (leave blank to keep current)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                        <input
                          type="password"
                          value={userFormData.confirmPassword}
                          onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Roles</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {roles.map((role) => (
                        <label key={role.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={userFormData.roles.includes(role.roleName)}
                            onChange={(e) => {
                              const updatedRoles = e.target.checked
                                ? [...userFormData.roles, role.roleName]
                                : userFormData.roles.filter(r => r !== role.roleName);
                              setUserFormData({ ...userFormData, roles: updatedRoles });
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{role.roleName}</span>
                        </label>
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
                  {modalType === 'view' || modalType === 'cars' ? 'Close' : 'Cancel'}
                </button>
                {modalType !== 'view' && modalType !== 'cars' && (
                  <button 
                    onClick={handleSubmitUser}
                    disabled={isSubmitting || !userFormData.firstName.trim() || !userFormData.lastName.trim() || !userFormData.username.trim() || !userFormData.email.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : (modalType === 'create' ? 'Create User' : 'Save Changes')}
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
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete User</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the user "{userToDelete?.firstName} {userToDelete?.lastName}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(userToDelete!)}
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

export default Users;
