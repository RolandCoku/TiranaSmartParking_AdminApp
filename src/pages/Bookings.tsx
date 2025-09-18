import React, { useState, useEffect } from 'react';
import { 
  MdSearch, 
  MdAdd, 
  MdEdit, 
  MdDelete,
  MdRefresh,
  MdVisibility,
  MdCancel,
  MdWarning,
  MdArrowBack,
  MdArrowForward,
  MdEvent,
  MdPerson,
  MdLocationOn,
  MdDirectionsCar,
  MdAttachMoney,
  MdSchedule,
  MdPlayArrow,
  MdStop,
  MdAccessTime,
  MdFilterList,
  MdClose
} from 'react-icons/md';
import type { 
  BookingDTO,
  BookingRegistrationDTO,
  BookingUpdateDTO,
  BookingQuoteDTO,
  BookingQuoteResponse,
  ParkingLot,
  ParkingSpace,
  UserResponseDTO
} from '../types';
import { BookingStatus, VehicleType, UserGroup } from '../types';
import { formatDateTime, formatCurrency, cn } from '../utils';
import apiService from '../services/api';

const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingDTO | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view' | 'quote'>('view');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<BookingDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(10);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [lotFilter, setLotFilter] = useState<number | 'ALL'>('ALL');
  const [userFilter, setUserFilter] = useState<number | 'ALL'>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  
  // Form state for bookings
  const [bookingFormData, setBookingFormData] = useState<BookingRegistrationDTO>({
    parkingSpaceId: 0,
    vehiclePlate: '',
    vehicleType: VehicleType.CAR,
    userGroup: UserGroup.PUBLIC,
    startTime: '',
    endTime: '',
    paymentMethodId: '',
    notes: ''
  });

  // Quote state
  const [quoteData, setQuoteData] = useState<BookingQuoteDTO>({
    parkingSpaceId: 0,
    vehicleType: VehicleType.CAR,
    userGroup: UserGroup.PUBLIC,
    startTime: '',
    endTime: ''
  });
  const [quoteResult, setQuoteResult] = useState<BookingQuoteResponse | null>(null);
  const [isGettingQuote, setIsGettingQuote] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [bookingsResponse, lotsResponse, spacesResponse, usersResponse] = await Promise.all([
        apiService.getBookings(currentPage, pageSize),
        apiService.getParkingLots(0, 100),
        apiService.getParkingSpaces(0, 100),
        apiService.getUsers(0, 100)
      ]);

      setBookings(bookingsResponse.content);
      setTotalPages(bookingsResponse.totalPages);
      setParkingLots(lotsResponse.content);
      setParkingSpaces(spacesResponse.content);
      setUsers(usersResponse.content);
    } catch (error) {
      console.error('Error fetching booking data:', error);
      setError('Failed to load booking data. Please try again.');
      setBookings([]);
      setParkingLots([]);
      setParkingSpaces([]);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.parkingSpaceLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.parkingLotName && booking.parkingLotName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
    const matchesLot = lotFilter === 'ALL' || booking.parkingLotId === lotFilter;
    const matchesUser = userFilter === 'ALL' || booking.userId === userFilter;
    
    return matchesSearch && matchesStatus && matchesLot && matchesUser;
  });

  const getStatusColor = (status: BookingStatus) => {
    const colors = {
      [BookingStatus.UPCOMING]: 'bg-blue-100 text-blue-800',
      [BookingStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [BookingStatus.COMPLETED]: 'bg-gray-100 text-gray-800',
      [BookingStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [BookingStatus.EXPIRED]: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleCreateBooking = () => {
    setSelectedBooking(null);
    setBookingFormData({
      parkingSpaceId: 0,
      vehiclePlate: '',
      vehicleType: VehicleType.CAR,
      userGroup: UserGroup.PUBLIC,
      startTime: '',
      endTime: '',
      paymentMethodId: '',
      notes: ''
    });
    setModalType('create');
    setShowModal(true);
  };

  const handleEditBooking = (booking: BookingDTO) => {
    setSelectedBooking(booking);
    setBookingFormData({
      parkingSpaceId: booking.parkingSpaceId,
      vehiclePlate: booking.vehiclePlate,
      vehicleType: booking.vehicleType,
      userGroup: booking.userGroup,
      startTime: booking.startTime.slice(0, 16), // Convert to datetime-local format
      endTime: booking.endTime.slice(0, 16),
      paymentMethodId: booking.paymentMethodId || '',
      notes: booking.notes || ''
    });
    setModalType('edit');
    setShowModal(true);
  };

  const handleViewBooking = (booking: BookingDTO) => {
    setSelectedBooking(booking);
    setModalType('view');
    setShowModal(true);
  };

  const handleGetQuote = () => {
    setQuoteData({
      parkingSpaceId: bookingFormData.parkingSpaceId,
      vehicleType: bookingFormData.vehicleType,
      userGroup: bookingFormData.userGroup,
      startTime: bookingFormData.startTime,
      endTime: bookingFormData.endTime
    });
    setModalType('quote');
    setShowModal(true);
  };

  const handleSubmitBooking = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (modalType === 'create') {
        await apiService.createBooking(bookingFormData);
      } else if (modalType === 'edit' && selectedBooking) {
        const updateData: BookingUpdateDTO = {
          vehiclePlate: bookingFormData.vehiclePlate,
          vehicleType: bookingFormData.vehicleType,
          userGroup: bookingFormData.userGroup,
          startTime: bookingFormData.startTime,
          endTime: bookingFormData.endTime,
          paymentMethodId: bookingFormData.paymentMethodId,
          notes: bookingFormData.notes
        };
        await apiService.updateBooking(selectedBooking.id, updateData);
      }

      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving booking:', error);
      setError('Failed to save booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBooking = async (booking: BookingDTO) => {
    try {
      setIsDeleting(true);
      await apiService.deleteBooking(booking.id);
      setShowDeleteModal(false);
      setBookingToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      setError('Failed to delete booking. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelBooking = async (booking: BookingDTO) => {
    try {
      await apiService.cancelBooking(booking.id);
      await fetchData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError('Failed to cancel booking. Please try again.');
    }
  };

  const handleStartBooking = async (booking: BookingDTO) => {
    try {
      await apiService.startBooking(booking.id);
      await fetchData();
    } catch (error) {
      console.error('Error starting booking:', error);
      setError('Failed to start booking. Please try again.');
    }
  };

  const handleCompleteBooking = async (booking: BookingDTO) => {
    try {
      await apiService.completeBooking(booking.id);
      await fetchData();
    } catch (error) {
      console.error('Error completing booking:', error);
      setError('Failed to complete booking. Please try again.');
    }
  };

  const handleGetBookingQuote = async () => {
    try {
      setIsGettingQuote(true);
      setError(null);
      
      const quote = await apiService.getBookingQuote(quoteData);
      setQuoteResult(quote);
    } catch (error) {
      console.error('Error getting quote:', error);
      setError('Failed to get booking quote. Please try again.');
    } finally {
      setIsGettingQuote(false);
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

  const clearFilters = () => {
    setStatusFilter('ALL');
    setLotFilter('ALL');
    setUserFilter('ALL');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600">Manage parking bookings and reservations</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <MdFilterList className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <MdRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleCreateBooking}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <MdAdd className="w-4 h-4" />
            <span>New Booking</span>
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

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <MdClose className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'ALL')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Statuses</option>
                {Object.values(BookingStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parking Lot</label>
              <select
                value={lotFilter}
                onChange={(e) => setLotFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Lots</option>
                {parkingLots.map(lot => (
                  <option key={lot.id} value={lot.id}>{lot.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
                ))}
              </select>
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
              placeholder="Search bookings by reference, vehicle plate, user email, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Bookings List */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading bookings...</span>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <MdEvent className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'ALL' || lotFilter !== 'ALL' || userFilter !== 'ALL' 
                  ? 'No bookings match your search criteria.' 
                  : 'No bookings available at the moment.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <MdEvent className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{booking.bookingReference}</div>
                              <div className="text-sm text-gray-500">ID: {booking.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <MdPerson className="w-4 h-4 text-gray-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{booking.userEmail}</div>
                              <div className="text-sm text-gray-500">ID: {booking.userId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <MdLocationOn className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{booking.parkingSpaceLabel}</div>
                              <div className="text-sm text-gray-500">{booking.parkingLotName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <MdDirectionsCar className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{booking.vehiclePlate}</div>
                              <div className="text-sm text-gray-500">{booking.vehicleType}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <MdSchedule className="w-4 h-4 mr-1 text-gray-400" />
                              {formatDateTime(booking.startTime)}
                            </div>
                            <div className="text-sm text-gray-500">
                              <MdAccessTime className="w-4 h-4 mr-1 text-gray-400" />
                              {formatDateTime(booking.endTime)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MdAttachMoney className="w-4 h-4 mr-1 text-green-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(booking.totalPrice, booking.currency)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getStatusColor(booking.status)
                          )}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewBooking(booking)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Booking"
                            >
                              <MdVisibility className="w-4 h-4" />
                            </button>
                            {booking.status === BookingStatus.UPCOMING && (
                              <>
                                <button
                                  onClick={() => handleEditBooking(booking)}
                                  className="text-gray-600 hover:text-gray-900"
                                  title="Edit Booking"
                                >
                                  <MdEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleStartBooking(booking)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Start Booking"
                                >
                                  <MdPlayArrow className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleCancelBooking(booking)}
                                  className="text-orange-600 hover:text-orange-900"
                                  title="Cancel Booking"
                                >
                                  <MdCancel className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {booking.status === BookingStatus.ACTIVE && (
                              <button
                                onClick={() => handleCompleteBooking(booking)}
                                className="text-green-600 hover:text-green-900"
                                title="Complete Booking"
                              >
                                <MdStop className="w-4 h-4" />
                              </button>
                            )}
                            {(booking.status === BookingStatus.UPCOMING || booking.status === BookingStatus.ACTIVE) && (
                              <button
                                onClick={() => {
                                  setBookingToDelete(booking);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Booking"
                              >
                                <MdDelete className="w-4 h-4" />
                              </button>
                            )}
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

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'create' && 'Create New Booking'}
                  {modalType === 'edit' && 'Edit Booking'}
                  {modalType === 'view' && `Booking Details - ${selectedBooking?.bookingReference}`}
                  {modalType === 'quote' && 'Get Booking Quote'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>

              {/* Booking View Modal */}
              {modalType === 'view' && selectedBooking ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Booking Reference</label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">{selectedBooking.bookingReference}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1',
                        getStatusColor(selectedBooking.status)
                      )}>
                        {selectedBooking.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedBooking.userEmail}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedBooking.vehiclePlate} ({selectedBooking.vehicleType})</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedBooking.parkingSpaceLabel}</p>
                      <p className="text-sm text-gray-500">{selectedBooking.parkingLotName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User Group</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedBooking.userGroup}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Time</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedBooking.startTime)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Time</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedBooking.endTime)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Price</label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">
                        {formatCurrency(selectedBooking.totalPrice, selectedBooking.currency)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedBooking.createdAt)}</p>
                    </div>
                  </div>

                  {selectedBooking.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>
              ) : modalType === 'quote' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Parking Space *</label>
                      <select
                        value={quoteData.parkingSpaceId}
                        onChange={(e) => setQuoteData({ ...quoteData, parkingSpaceId: parseInt(e.target.value) })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value={0}>Select Parking Space</option>
                        {parkingSpaces.map(space => (
                          <option key={space.id} value={space.id}>{space.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle Type *</label>
                      <select
                        value={quoteData.vehicleType}
                        onChange={(e) => setQuoteData({ ...quoteData, vehicleType: e.target.value as VehicleType })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        {Object.values(VehicleType).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">User Group *</label>
                    <select
                      value={quoteData.userGroup}
                      onChange={(e) => setQuoteData({ ...quoteData, userGroup: e.target.value as UserGroup })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {Object.values(UserGroup).map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Time *</label>
                      <input
                        type="datetime-local"
                        value={quoteData.startTime}
                        onChange={(e) => setQuoteData({ ...quoteData, startTime: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Time *</label>
                      <input
                        type="datetime-local"
                        value={quoteData.endTime}
                        onChange={(e) => setQuoteData({ ...quoteData, endTime: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {quoteResult && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-800 mb-2">Quote Result</h4>
                      <div className="text-sm text-green-700">
                        <p><strong>Amount:</strong> {formatCurrency(quoteResult.amount, quoteResult.currency)}</p>
                        <p><strong>Breakdown:</strong> {quoteResult.breakdown}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleGetBookingQuote}
                      disabled={isGettingQuote || !quoteData.parkingSpaceId || !quoteData.startTime || !quoteData.endTime}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGettingQuote ? 'Getting Quote...' : 'Get Quote'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Parking Space *</label>
                      <select
                        value={bookingFormData.parkingSpaceId}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, parkingSpaceId: parseInt(e.target.value) })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value={0}>Select Parking Space</option>
                        {parkingSpaces.map(space => (
                          <option key={space.id} value={space.id}>{space.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle Plate *</label>
                      <input
                        type="text"
                        value={bookingFormData.vehiclePlate}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, vehiclePlate: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ABC-123"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle Type *</label>
                      <select
                        value={bookingFormData.vehicleType}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, vehicleType: e.target.value as VehicleType })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        {Object.values(VehicleType).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User Group *</label>
                      <select
                        value={bookingFormData.userGroup}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, userGroup: e.target.value as UserGroup })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        {Object.values(UserGroup).map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Time *</label>
                      <input
                        type="datetime-local"
                        value={bookingFormData.startTime}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, startTime: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Time *</label>
                      <input
                        type="datetime-local"
                        value={bookingFormData.endTime}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, endTime: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Method ID</label>
                      <input
                        type="text"
                        value={bookingFormData.paymentMethodId}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, paymentMethodId: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Payment method reference"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <input
                        type="text"
                        value={bookingFormData.notes}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, notes: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Additional notes"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGetQuote}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                    >
                      Get Quote
                    </button>
                    <button
                      onClick={handleSubmitBooking}
                      disabled={isSubmitting || !bookingFormData.parkingSpaceId || !bookingFormData.vehiclePlate.trim() || !bookingFormData.startTime || !bookingFormData.endTime}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Saving...' : (modalType === 'create' ? 'Create Booking' : 'Save Changes')}
                    </button>
                  </div>
                </div>
              )}
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
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Booking</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the booking "{bookingToDelete?.bookingReference}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setBookingToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteBooking(bookingToDelete!)}
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

export default Bookings;
