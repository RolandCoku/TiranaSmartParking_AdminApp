import React, { useState, useEffect } from 'react';
import { 
  MdSearch, 
  MdEdit, 
  MdDelete,
  MdRefresh,
  MdVisibility,
  MdCancel,
  MdWarning,
  MdArrowBack,
  MdArrowForward,
  MdDirectionsCar,
  MdPerson,
  MdEmail,
  MdPhone,
  MdAdd
} from 'react-icons/md';
import type { 
  CarResponseDTO,
  CarCreateDTO,
  UserResponseDTO
} from '../types';
import { formatDateTime } from '../utils';
import apiService from '../services/api';

const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<CarResponseDTO[]>([]);
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<CarResponseDTO | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserResponseDTO | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'create' | 'selectUser'>('view');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<CarResponseDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(10);
  
  // Form state for vehicles
  const [vehicleFormData, setVehicleFormData] = useState<CarCreateDTO>({
    licensePlate: '',
    brand: '',
    model: '',
    color: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [vehiclesResponse, usersResponse] = await Promise.all([
        apiService.getCars(currentPage, pageSize),
        apiService.getUsers(0, 100) // Get all users for selection
      ]);
      
      setVehicles(vehiclesResponse.content);
      setTotalPages(vehiclesResponse.totalPages);
      setUsers(usersResponse.content);
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      setError('Failed to load vehicle data. Please try again.');
      setVehicles([]);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.userFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.userLastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateVehicle = () => {
    setSelectedVehicle(null);
    setSelectedUser(null);
    setVehicleFormData({
      licensePlate: '',
      brand: '',
      model: '',
      color: ''
    });
    setModalType('selectUser');
    setShowModal(true);
  };

  const handleUserSelected = (user: UserResponseDTO) => {
    setSelectedUser(user);
    setModalType('create');
  };

  const handleEditVehicle = (vehicle: CarResponseDTO) => {
    setSelectedVehicle(vehicle);
    setVehicleFormData({
      licensePlate: vehicle.licensePlate,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color
    });
    setModalType('edit');
    setShowModal(true);
  };

  const handleViewVehicle = (vehicle: CarResponseDTO) => {
    setSelectedVehicle(vehicle);
    setModalType('view');
    setShowModal(true);
  };

  const handleSubmitVehicle = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (modalType === 'create' && selectedUser) {
        await apiService.addUserCar(selectedUser.id, vehicleFormData);
      } else if (modalType === 'edit' && selectedVehicle) {
        await apiService.updateCar(selectedVehicle.id, vehicleFormData);
      }

      setShowModal(false);
      setSelectedUser(null);
      await fetchData();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      setError('Failed to save vehicle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (vehicle: CarResponseDTO) => {
    try {
      setIsDeleting(true);
      await apiService.deleteCar(vehicle.id);
      setShowDeleteModal(false);
      setVehicleToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      setError('Failed to delete vehicle. Please try again.');
    } finally {
      setIsDeleting(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-600">Manage all registered vehicles in the system</p>
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
            onClick={handleCreateVehicle}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <MdAdd className="w-4 h-4" />
            <span>Register Vehicle</span>
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
              placeholder="Search vehicles by license plate, brand, model, color, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Vehicles List */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading vehicles...</span>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <MdDirectionsCar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Vehicles Found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No vehicles match your search criteria.' : 'No vehicles registered in the system.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <MdDirectionsCar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">ID: {vehicle.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <MdPerson className="w-4 h-4 text-gray-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {vehicle.userFirstName} {vehicle.userLastName}
                              </div>
                              <div className="text-sm text-gray-500">ID: {vehicle.userId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{vehicle.licensePlate}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vehicle.brand}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vehicle.model}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {vehicle.color}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewVehicle(vehicle)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Vehicle"
                            >
                              <MdVisibility className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditVehicle(vehicle)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit Vehicle"
                            >
                              <MdEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setVehicleToDelete(vehicle);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Vehicle"
                            >
                              <MdDelete className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination()}
            </>
          )}
        </div>
      </div>

      {/* Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'selectUser' && 'Select Vehicle Owner'}
                  {modalType === 'create' && `Register New Vehicle - ${selectedUser?.firstName} ${selectedUser?.lastName}`}
                  {modalType === 'edit' && 'Edit Vehicle'}
                  {modalType === 'view' && `Vehicle Details - ${selectedVehicle?.licensePlate}`}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MdCancel className="w-6 h-6" />
                </button>
              </div>

              {/* User Selection Modal */}
              {modalType === 'selectUser' ? (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-600">
                      Select the user who will own this vehicle. All vehicles must be assigned to a user.
                    </p>
                  </div>
                  
                  {users.length === 0 ? (
                    <div className="text-center py-8">
                      <MdPerson className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                      <p className="text-gray-600">No users available to assign as vehicle owners.</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleUserSelected(user)}
                          className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <MdPerson className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                            <div className="text-xs text-gray-400">{user.email}</div>
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {user.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : modalType === 'view' && selectedVehicle ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">License Plate</label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">{selectedVehicle.licensePlate}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle ID</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedVehicle.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Brand</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedVehicle.brand}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Model</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedVehicle.model}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Color</label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 bg-gray-100 text-gray-800">
                      {selectedVehicle.color}
                    </span>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Owner Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedVehicle.userFirstName} {selectedVehicle.userLastName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">User ID</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedVehicle.userId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Plate *</label>
                    <input
                      type="text"
                      value={vehicleFormData.licensePlate}
                      onChange={(e) => setVehicleFormData({ ...vehicleFormData, licensePlate: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ABC-123"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Brand *</label>
                      <input
                        type="text"
                        value={vehicleFormData.brand}
                        onChange={(e) => setVehicleFormData({ ...vehicleFormData, brand: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Toyota"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Model *</label>
                      <input
                        type="text"
                        value={vehicleFormData.model}
                        onChange={(e) => setVehicleFormData({ ...vehicleFormData, model: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Camry"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Color *</label>
                    <input
                      type="text"
                      value={vehicleFormData.color}
                      onChange={(e) => setVehicleFormData({ ...vehicleFormData, color: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Red"
                      required
                    />
                  </div>

                  {modalType === 'create' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex">
                        <MdPerson className="w-5 h-5 text-green-400 mt-0.5" />
                        <div className="ml-3">
                          <p className="text-sm text-green-800">
                            <strong>Owner:</strong> This vehicle will be registered for {selectedUser?.firstName} {selectedUser?.lastName} ({selectedUser?.email}).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  {modalType === 'view' ? 'Close' : 'Cancel'}
                </button>
                {modalType !== 'view' && modalType !== 'selectUser' && (
                  <button 
                    onClick={handleSubmitVehicle}
                    disabled={isSubmitting || !vehicleFormData.licensePlate.trim() || !vehicleFormData.brand.trim() || !vehicleFormData.model.trim() || !vehicleFormData.color.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : (modalType === 'create' ? 'Register Vehicle' : 'Save Changes')}
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
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Vehicle</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the vehicle "{vehicleToDelete?.licensePlate}" ({vehicleToDelete?.brand} {vehicleToDelete?.model})? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setVehicleToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteVehicle(vehicleToDelete!)}
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

export default VehicleManagement;
