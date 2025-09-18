import React, { useState, useEffect } from 'react';
import { 
  MdSearch, 
  MdAdd, 
  MdEdit, 
  MdDelete,
  MdRefresh,
  MdVisibility,
  MdLocationOn,
  MdCancel,
  MdWarning
} from 'react-icons/md';
import type { ParkingLot, ParkingLotRegistrationDTO } from '../types';
import { formatDateTime, cn } from '../utils';
import apiService from '../services/api';

const ParkingLots: React.FC = () => {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [filteredLots, setFilteredLots] = useState<ParkingLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('view');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lotToDelete, setLotToDelete] = useState<ParkingLot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(10);
  
  // Form state for create/edit
  const [formData, setFormData] = useState<ParkingLotRegistrationDTO>({
    source: 'MANUAL',
    name: '',
    description: '',
    address: '',
    active: true,
    publicAccess: true,
    hasChargingStations: false,
    hasDisabledAccess: false,
    hasCctv: false,
    capacity: 0,
    availableSpaces: 0,
    longitude: undefined,
    latitude: undefined,
  });

  const fetchParkingLots = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getParkingLots(currentPage, pageSize);
      setParkingLots(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching parking lots:', error);
      // Set empty data when API fails
      setParkingLots([]);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchParkingLots();
  }, [currentPage]);

  useEffect(() => {
    let filtered = parkingLots;
    
    if (searchTerm) {
      filtered = filtered.filter(lot =>
        lot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredLots(filtered);
  }, [parkingLots, searchTerm]);

  const handleCreateLot = () => {
    setSelectedLot(null);
    setModalType('create');
    setIsSubmitting(false);
    setFormData({
      source: 'MANUAL',
      name: '',
      description: '',
      address: '',
      active: true,
      publicAccess: true,
      hasChargingStations: false,
      hasDisabledAccess: false,
      hasCctv: false,
      capacity: 0,
      availableSpaces: 0,
      longitude: undefined,
      latitude: undefined,
    });
    setShowModal(true);
  };

  const handleEditLot = (lot: ParkingLot) => {
    setSelectedLot(lot);
    setModalType('edit');
    setIsSubmitting(false);
    setFormData({
      source: 'MANUAL',
      name: lot.name,
      description: lot.description || '',
      address: lot.address,
      active: lot.status === 'ACTIVE',
      publicAccess: lot.publicAccess,
      hasChargingStations: lot.hasChargingStations,
      hasDisabledAccess: lot.hasDisabledAccess,
      hasCctv: lot.hasCctv,
      capacity: lot.capacity,
      availableSpaces: lot.availableSpaces,
      longitude: lot.longitude,
      latitude: lot.latitude,
    });
    setShowModal(true);
  };

  const handleViewLot = (lot: ParkingLot) => {
    setSelectedLot(lot);
    setModalType('view');
    setIsSubmitting(false);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setIsSubmitting(false);
  };

  const handleFormChange = (field: keyof ParkingLotRegistrationDTO, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (modalType === 'create') {
        await apiService.createParkingLot(formData);
      } else if (modalType === 'edit' && selectedLot) {
        await apiService.updateParkingLot(selectedLot.id, formData);
      }
      setShowModal(false);
      fetchParkingLots();
    } catch (error) {
      console.error('Error saving parking lot:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (lot: ParkingLot) => {
    setLotToDelete(lot);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!lotToDelete) return;
    
    try {
      setIsDeleting(true);
      await apiService.deleteParkingLot(lotToDelete.id);
      setShowDeleteModal(false);
      setLotToDelete(null);
      fetchParkingLots();
    } catch (error) {
      console.error('Error deleting parking lot:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setLotToDelete(null);
  };

  const getOccupancyRate = (lot: ParkingLot) => {
    if (lot.capacity === 0) return 0;
    return Math.round(((lot.capacity - lot.availableSpaces) / lot.capacity) * 100);
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parking Lots Management</h1>
          <p className="text-gray-600">Manage parking lots and spaces</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchParkingLots}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <MdRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleCreateLot}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <MdAdd className="w-4 h-4" />
            <span>New Lot</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MdSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search parking lots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Parking Lots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))
        ) : filteredLots.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MdLocationOn className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Parking Lots Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'No parking lots match your search criteria.' : 'No parking lots available at the moment.'}
            </p>
          </div>
        ) : (
          filteredLots.map((lot) => (
            <div key={lot.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{lot.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{lot.address}</p>
                </div>
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                  lot.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                )}>
                  {lot.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Capacity</span>
                  <span className="font-medium text-gray-900">{lot.capacity}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Available</span>
                  <span className="font-medium text-gray-900">{lot.availableSpaces}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Occupancy</span>
                  <span className={cn('font-medium', getOccupancyColor(getOccupancyRate(lot)))}>
                    {getOccupancyRate(lot)}%
                  </span>
                </div>
                {lot.description && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Description:</span> {lot.description}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Updated: {formatDateTime(lot.updatedAt)}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewLot(lot)}
                    className="text-blue-600 hover:text-blue-900"
                    title="View details"
                  >
                    <MdVisibility className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditLot(lot)}
                    className="text-gray-600 hover:text-gray-900"
                    title="Edit parking lot"
                  >
                    <MdEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(lot)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete parking lot"
                  >
                    <MdDelete className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage + 1}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Parking Lot Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'create' && 'Create Parking Lot'}
                  {modalType === 'edit' && 'Edit Parking Lot'}
                  {modalType === 'view' && `Parking Lot - ${selectedLot?.name}`}
                </h3>
                <button
                  onClick={handleModalClose}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MdCancel className="w-6 h-6" />
                </button>
              </div>

              {modalType === 'view' && selectedLot ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedLot.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1',
                        selectedLot.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      )}>
                        {selectedLot.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLot.description || 'No description'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLot.address}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Capacity</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedLot.capacity}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Available</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedLot.availableSpaces}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Occupancy</label>
                      <p className={cn('mt-1 text-sm font-medium', getOccupancyColor(getOccupancyRate(selectedLot)))}>
                        {getOccupancyRate(selectedLot)}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Public Access</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedLot.publicAccess ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Charging Stations</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedLot.hasChargingStations ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Disabled Access</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedLot.hasDisabledAccess ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">CCTV</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedLot.hasCctv ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {(selectedLot.latitude && selectedLot.longitude) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Latitude</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedLot.latitude}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Longitude</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedLot.longitude}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedLot.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Updated</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedLot.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter parking lot name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address *</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Enter address"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Capacity *</label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => handleFormChange('capacity', parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Available Spaces *</label>
                      <input
                        type="number"
                        value={formData.availableSpaces}
                        onChange={(e) => handleFormChange('availableSpaces', parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.latitude || ''}
                        onChange={(e) => handleFormChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 41.3275"
                        min="-90"
                        max="90"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.longitude || ''}
                        onChange={(e) => handleFormChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 19.8187"
                        min="-180"
                        max="180"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Features</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.active}
                          onChange={(e) => handleFormChange('active', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.publicAccess}
                          onChange={(e) => handleFormChange('publicAccess', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Public Access</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.hasChargingStations}
                          onChange={(e) => handleFormChange('hasChargingStations', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Charging Stations</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.hasDisabledAccess}
                          onChange={(e) => handleFormChange('hasDisabledAccess', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Disabled Access</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.hasCctv}
                          onChange={(e) => handleFormChange('hasCctv', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">CCTV</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  onClick={handleModalClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalType === 'view' ? 'Close' : 'Cancel'}
                </button>
                {modalType !== 'view' && (
                  <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>
                          {modalType === 'create' ? 'Creating...' : 'Saving...'}
                        </span>
                      </>
                    ) : (
                      <span>
                        {modalType === 'create' ? 'Create' : 'Save Changes'}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && lotToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <MdWarning className="w-6 h-6 text-red-600" />
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Parking Lot
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete <strong>{lotToDelete.name}</strong>? 
                  This action cannot be undone.
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> This will permanently remove the parking lot 
                    and all associated data including spaces, bookings, and sessions.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-3 mt-6">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <MdDelete className="w-4 h-4" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingLots;
