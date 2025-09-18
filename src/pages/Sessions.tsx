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
  MdAccessTime,
  MdPerson,
  MdLocationOn,
  MdDirectionsCar,
  MdAttachMoney,
  MdSchedule,
  MdStop,
  MdFilterList,
  MdClose
} from 'react-icons/md';
import type { 
  ParkingSessionDTO,
  ParkingSessionStartDTO,
  ParkingSessionUpdateDTO,
  ParkingSessionStopDTO,
  ParkingSessionQuoteDTO,
  SessionQuoteResponse,
  ParkingLot,
  ParkingSpace,
  UserResponseDTO
} from '../types';
import { SessionStatus, VehicleType, UserGroup } from '../types';
import { formatDateTime, formatCurrency, cn } from '../utils';
import apiService from '../services/api';

const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<ParkingSessionDTO[]>([]);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<ParkingSessionDTO | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view' | 'stop' | 'quote'>('view');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<ParkingSessionDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(10);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'ALL'>('ALL');
  const [lotFilter, setLotFilter] = useState<number | 'ALL'>('ALL');
  const [userFilter, setUserFilter] = useState<number | 'ALL'>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  
  // Form state for sessions
  const [sessionFormData, setSessionFormData] = useState<ParkingSessionStartDTO>({
    parkingSpaceId: 0,
    vehiclePlate: '',
    vehicleType: VehicleType.CAR,
    userGroup: UserGroup.PUBLIC,
    paymentMethodId: '',
    notes: ''
  });

  // Stop session state
  const [stopFormData, setStopFormData] = useState<ParkingSessionStopDTO>({
    endTime: '',
    notes: ''
  });

  // Quote state
  const [quoteData, setQuoteData] = useState<ParkingSessionQuoteDTO>({
    parkingSpaceId: 0,
    vehicleType: VehicleType.CAR,
    userGroup: UserGroup.PUBLIC,
    startTime: '',
    endTime: ''
  });
  const [quoteResult, setQuoteResult] = useState<SessionQuoteResponse | null>(null);
  const [isGettingQuote, setIsGettingQuote] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [sessionsResponse, lotsResponse, spacesResponse, usersResponse] = await Promise.all([
        apiService.getSessions(currentPage, pageSize),
        apiService.getParkingLots(0, 100),
        apiService.getParkingSpaces(0, 100),
        apiService.getUsers(0, 100)
      ]);

      setSessions(sessionsResponse.content);
      setTotalPages(sessionsResponse.totalPages);
      setParkingLots(lotsResponse.content);
      setParkingSpaces(spacesResponse.content);
      setUsers(usersResponse.content);
    } catch (error) {
      console.error('Error fetching session data:', error);
      setError('Failed to load session data. Please try again.');
      setSessions([]);
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

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.sessionReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.parkingSpaceLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.parkingLotName && session.parkingLotName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || session.status === statusFilter;
    const matchesLot = lotFilter === 'ALL' || session.parkingLotId === lotFilter;
    const matchesUser = userFilter === 'ALL' || session.userId === userFilter;
    
    return matchesSearch && matchesStatus && matchesLot && matchesUser;
  });

  const getStatusColor = (status: SessionStatus) => {
    const colors = {
      [SessionStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [SessionStatus.COMPLETED]: 'bg-gray-100 text-gray-800',
      [SessionStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [SessionStatus.EXPIRED]: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleStartSession = () => {
    setSelectedSession(null);
    setSessionFormData({
      parkingSpaceId: 0,
      vehiclePlate: '',
      vehicleType: VehicleType.CAR,
      userGroup: UserGroup.PUBLIC,
      paymentMethodId: '',
      notes: ''
    });
    setModalType('create');
    setShowModal(true);
  };

  const handleEditSession = (session: ParkingSessionDTO) => {
    setSelectedSession(session);
    setSessionFormData({
      parkingSpaceId: session.parkingSpaceId,
      vehiclePlate: session.vehiclePlate,
      vehicleType: session.vehicleType,
      userGroup: session.userGroup,
      paymentMethodId: session.paymentMethodId || '',
      notes: session.notes || ''
    });
    setModalType('edit');
    setShowModal(true);
  };

  const handleViewSession = (session: ParkingSessionDTO) => {
    setSelectedSession(session);
    setModalType('view');
    setShowModal(true);
  };

  const handleStopSession = (session: ParkingSessionDTO) => {
    setSelectedSession(session);
    setStopFormData({
      endTime: new Date().toISOString().slice(0, 16),
      notes: ''
    });
    setModalType('stop');
    setShowModal(true);
  };

  const handleGetQuote = () => {
    setQuoteData({
      parkingSpaceId: sessionFormData.parkingSpaceId,
      vehicleType: sessionFormData.vehicleType,
      userGroup: sessionFormData.userGroup,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
    });
    setModalType('quote');
    setShowModal(true);
  };

  const handleSubmitSession = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (modalType === 'create') {
        await apiService.startSession(sessionFormData);
      } else if (modalType === 'edit' && selectedSession) {
        const updateData: ParkingSessionUpdateDTO = {
          vehiclePlate: sessionFormData.vehiclePlate,
          vehicleType: sessionFormData.vehicleType,
          userGroup: sessionFormData.userGroup,
          paymentMethodId: sessionFormData.paymentMethodId,
          notes: sessionFormData.notes
        };
        await apiService.updateSession(selectedSession.id, updateData);
      }

      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving session:', error);
      setError('Failed to save session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopSessionSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (selectedSession) {
        await apiService.stopSession(selectedSession.id, stopFormData);
      }

      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error('Error stopping session:', error);
      setError('Failed to stop session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSession = async (session: ParkingSessionDTO) => {
    try {
      setIsDeleting(true);
      await apiService.deleteSession(session.id);
      setShowDeleteModal(false);
      setSessionToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete session. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelSession = async (session: ParkingSessionDTO) => {
    try {
      await apiService.cancelSession(session.id);
      await fetchData();
    } catch (error) {
      console.error('Error cancelling session:', error);
      setError('Failed to cancel session. Please try again.');
    }
  };

  const handleGetSessionQuote = async () => {
    try {
      setIsGettingQuote(true);
      setError(null);
      
      const quote = await apiService.getSessionQuote(quoteData);
      setQuoteResult(quote);
    } catch (error) {
      console.error('Error getting quote:', error);
      setError('Failed to get session quote. Please try again.');
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
          <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
          <p className="text-gray-600">Manage parking sessions and active parking</p>
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
            onClick={handleStartSession}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <MdAdd className="w-4 h-4" />
            <span>Start Session</span>
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
                onChange={(e) => setStatusFilter(e.target.value as SessionStatus | 'ALL')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Statuses</option>
                {Object.values(SessionStatus).map(status => (
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
              placeholder="Search sessions by reference, vehicle plate, user email, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading sessions...</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <MdAccessTime className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'ALL' || lotFilter !== 'ALL' || userFilter !== 'ALL' 
                  ? 'No sessions match your search criteria.' 
                  : 'No sessions available at the moment.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <MdAccessTime className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{session.sessionReference}</div>
                              <div className="text-sm text-gray-500">ID: {session.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <MdPerson className="w-4 h-4 text-gray-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{session.userEmail}</div>
                              <div className="text-sm text-gray-500">ID: {session.userId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <MdLocationOn className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{session.parkingSpaceLabel}</div>
                              <div className="text-sm text-gray-500">{session.parkingLotName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <MdDirectionsCar className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{session.vehiclePlate}</div>
                              <div className="text-sm text-gray-500">{session.vehicleType}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <MdSchedule className="w-4 h-4 mr-1 text-gray-400" />
                              {formatDateTime(session.startedAt)}
                            </div>
                            {session.endedAt && (
                              <div className="text-sm text-gray-500">
                                <MdStop className="w-4 h-4 mr-1 text-gray-400" />
                                {formatDateTime(session.endedAt)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MdAttachMoney className="w-4 h-4 mr-1 text-green-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(session.billedAmount, session.currency)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getStatusColor(session.status)
                          )}>
                            {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewSession(session)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Session"
                            >
                              <MdVisibility className="w-4 h-4" />
                            </button>
                            {session.status === SessionStatus.ACTIVE && (
                              <>
                                <button
                                  onClick={() => handleEditSession(session)}
                                  className="text-gray-600 hover:text-gray-900"
                                  title="Edit Session"
                                >
                                  <MdEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleStopSession(session)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Stop Session"
                                >
                                  <MdStop className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleCancelSession(session)}
                                  className="text-orange-600 hover:text-orange-900"
                                  title="Cancel Session"
                                >
                                  <MdCancel className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {(session.status === SessionStatus.ACTIVE || session.status === SessionStatus.COMPLETED) && (
                              <button
                                onClick={() => {
                                  setSessionToDelete(session);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Session"
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

      {/* Session Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'create' && 'Start New Session'}
                  {modalType === 'edit' && 'Edit Session'}
                  {modalType === 'view' && `Session Details - ${selectedSession?.sessionReference}`}
                  {modalType === 'stop' && `Stop Session - ${selectedSession?.sessionReference}`}
                  {modalType === 'quote' && 'Get Session Quote'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>

              {/* Session View Modal */}
              {modalType === 'view' && selectedSession ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Session Reference</label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">{selectedSession.sessionReference}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1',
                        getStatusColor(selectedSession.status)
                      )}>
                        {selectedSession.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedSession.userEmail}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedSession.vehiclePlate} ({selectedSession.vehicleType})</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedSession.parkingSpaceLabel}</p>
                      <p className="text-sm text-gray-500">{selectedSession.parkingLotName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User Group</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedSession.userGroup}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Started At</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedSession.startedAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ended At</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedSession.endedAt ? formatDateTime(selectedSession.endedAt) : 'Still Active'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Billed Amount</label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">
                        {formatCurrency(selectedSession.billedAmount, selectedSession.currency)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedSession.createdAt)}</p>
                    </div>
                  </div>

                  {selectedSession.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedSession.notes}</p>
                    </div>
                  )}
                </div>
              ) : modalType === 'stop' ? (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <MdWarning className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                          <strong>Stopping Session:</strong> {selectedSession?.sessionReference} for {selectedSession?.vehiclePlate}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time *</label>
                    <input
                      type="datetime-local"
                      value={stopFormData.endTime}
                      onChange={(e) => setStopFormData({ ...stopFormData, endTime: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={stopFormData.notes}
                      onChange={(e) => setStopFormData({ ...stopFormData, notes: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Optional notes about stopping the session"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStopSessionSubmit}
                      disabled={isSubmitting || !stopFormData.endTime}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Stopping...' : 'Stop Session'}
                    </button>
                  </div>
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
                        value={quoteData.startTime.slice(0, 16)}
                        onChange={(e) => setQuoteData({ ...quoteData, startTime: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Time *</label>
                      <input
                        type="datetime-local"
                        value={quoteData.endTime.slice(0, 16)}
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
                      onClick={handleGetSessionQuote}
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
                        value={sessionFormData.parkingSpaceId}
                        onChange={(e) => setSessionFormData({ ...sessionFormData, parkingSpaceId: parseInt(e.target.value) })}
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
                        value={sessionFormData.vehiclePlate}
                        onChange={(e) => setSessionFormData({ ...sessionFormData, vehiclePlate: e.target.value })}
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
                        value={sessionFormData.vehicleType}
                        onChange={(e) => setSessionFormData({ ...sessionFormData, vehicleType: e.target.value as VehicleType })}
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
                        value={sessionFormData.userGroup}
                        onChange={(e) => setSessionFormData({ ...sessionFormData, userGroup: e.target.value as UserGroup })}
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
                      <label className="block text-sm font-medium text-gray-700">Payment Method ID</label>
                      <input
                        type="text"
                        value={sessionFormData.paymentMethodId}
                        onChange={(e) => setSessionFormData({ ...sessionFormData, paymentMethodId: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Payment method reference"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <input
                        type="text"
                        value={sessionFormData.notes}
                        onChange={(e) => setSessionFormData({ ...sessionFormData, notes: e.target.value })}
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
                      onClick={handleSubmitSession}
                      disabled={isSubmitting || !sessionFormData.parkingSpaceId || !sessionFormData.vehiclePlate.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Saving...' : (modalType === 'create' ? 'Start Session' : 'Save Changes')}
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
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Session</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the session "{sessionToDelete?.sessionReference}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSessionToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSession(sessionToDelete!)}
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

export default Sessions;
