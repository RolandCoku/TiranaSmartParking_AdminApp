import React, { useState, useEffect } from 'react';
import { 
  MdSearch, 
  MdAdd, 
  MdEdit, 
  MdDelete,
  MdRefresh,
  MdVisibility,
  MdAttachMoney,
  MdSchedule,
  MdLocationOn,
  MdSettings,
  MdCancel,
  MdWarning,
  MdArrowBack,
  MdArrowForward
} from 'react-icons/md';
import type { 
  RatePlan, 
  RatePlanRegistrationDTO,
  RateRule, 
  RateRuleRegistrationDTO,
  LotRateAssignment, 
  LotRateAssignmentRegistrationDTO,
  SpaceRateOverride, 
  SpaceRateOverrideRegistrationDTO,
  ParkingLot,
  ParkingSpace
} from '../types';
import { RatePlanType, VehicleType, UserGroup } from '../types';
import { formatDateTime, formatCurrency, cn } from '../utils';
import apiService from '../services/api';

const Rates: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plans' | 'rules' | 'assignments' | 'overrides'>('plans');
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [rateRules, setRateRules] = useState<RateRule[]>([]);
  const [lotAssignments, setLotAssignments] = useState<LotRateAssignment[]>([]);
  const [spaceOverrides, setSpaceOverrides] = useState<SpaceRateOverride[]>([]);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<RatePlan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('view');
  const [modalEntity, setModalEntity] = useState<'plan' | 'rule' | 'assignment' | 'override'>('plan');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(10);
  
  // Form state for rate plans
  const [planFormData, setPlanFormData] = useState<RatePlanRegistrationDTO>({
    name: '',
    type: RatePlanType.PER_HOUR,
    currency: 'ALL',
    timeZone: 'Europe/Tirane',
    graceMinutes: 15,
    incrementMinutes: 15,
    dailyCap: undefined,
    active: true
  });

  // Form state for rate rules
  const [ruleFormData, setRuleFormData] = useState<RateRuleRegistrationDTO>({
    ratePlanId: 0,
    startMinute: undefined,
    endMinute: undefined,
    startTime: undefined,
    endTime: undefined,
    dayOfWeek: undefined,
    vehicleType: undefined,
    userGroup: undefined,
    pricePerHour: undefined,
    priceFlat: undefined
  });

  // Form state for lot assignments
  const [assignmentFormData, setAssignmentFormData] = useState<LotRateAssignmentRegistrationDTO>({
    parkingLotId: 0,
    ratePlanId: 0,
    priority: 0,
    effectiveFrom: undefined,
    effectiveTo: undefined
  });

  // Form state for space overrides
  const [overrideFormData, setOverrideFormData] = useState<SpaceRateOverrideRegistrationDTO>({
    parkingSpaceId: 0,
    ratePlanId: 0,
    priority: 100,
    effectiveFrom: undefined,
    effectiveTo: undefined
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [plansResponse, assignmentsResponse, overridesResponse, lotsResponse, spacesResponse] = await Promise.all([
        apiService.getRatePlans(currentPage, pageSize),
        apiService.getLotRateAssignments(currentPage, pageSize),
        apiService.getSpaceRateOverrides(currentPage, pageSize),
        apiService.getParkingLots(0, 100),
        apiService.getParkingSpaces(0, 100)
      ]);

      setRatePlans(plansResponse.content);
      setTotalPages(plansResponse.totalPages);
      setLotAssignments(assignmentsResponse.content);
      setSpaceOverrides(overridesResponse.content);
      setParkingLots(lotsResponse.content);
      setParkingSpaces(spacesResponse.content);

      // Fetch rules for the first plan if available
      if (plansResponse.content.length > 0) {
        const rulesResponse = await apiService.getRateRules(currentPage, pageSize, plansResponse.content[0].id);
        setRateRules(rulesResponse.content);
      }
    } catch (error) {
      console.error('Error fetching rate data:', error);
      setError('Failed to load rate data. Please try again.');
      // Set empty data when API fails
      setRatePlans([]);
      setRateRules([]);
      setLotAssignments([]);
      setSpaceOverrides([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const filteredPlans = ratePlans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRules = rateRules.filter(rule =>
    rule.ratePlanId.toString().includes(searchTerm) ||
    (rule.vehicleType && rule.vehicleType.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (rule.userGroup && rule.userGroup.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAssignments = lotAssignments.filter(assignment =>
    assignment.parkingLotId.toString().includes(searchTerm) ||
    assignment.ratePlanId.toString().includes(searchTerm)
  );

  const filteredOverrides = spaceOverrides.filter(override =>
    override.parkingSpaceId.toString().includes(searchTerm) ||
    override.ratePlanId.toString().includes(searchTerm)
  );

  const getPlanTypeColor = (type: RatePlanType) => {
    const colors = {
      [RatePlanType.FLAT_PER_ENTRY]: 'bg-blue-100 text-blue-800',
      [RatePlanType.PER_HOUR]: 'bg-green-100 text-green-800',
      [RatePlanType.TIERED]: 'bg-purple-100 text-purple-800',
      [RatePlanType.TIME_OF_DAY]: 'bg-yellow-100 text-yellow-800',
      [RatePlanType.DAY_OF_WEEK]: 'bg-indigo-100 text-indigo-800',
      [RatePlanType.FREE]: 'bg-gray-100 text-gray-800',
      [RatePlanType.DYNAMIC]: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setPlanFormData({
      name: '',
      type: RatePlanType.PER_HOUR,
      currency: 'ALL',
      timeZone: 'Europe/Tirane',
      graceMinutes: 15,
      incrementMinutes: 15,
      dailyCap: undefined,
      active: true
    });
    setModalType('create');
    setModalEntity('plan');
    setShowModal(true);
  };

  const handleEditPlan = (plan: RatePlan) => {
    setSelectedPlan(plan);
    setPlanFormData({
      name: plan.name,
      type: plan.type,
      currency: plan.currency,
      timeZone: plan.timeZone,
      graceMinutes: plan.graceMinutes,
      incrementMinutes: plan.incrementMinutes,
      dailyCap: plan.dailyCap,
      active: plan.active
    });
    setModalType('edit');
    setModalEntity('plan');
    setShowModal(true);
  };

  const handleViewPlan = (plan: RatePlan) => {
    setSelectedPlan(plan);
    setModalType('view');
    setModalEntity('plan');
    setShowModal(true);
  };

  const handleSubmitPlan = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (modalType === 'create') {
        await apiService.createRatePlan(planFormData);
      } else if (modalType === 'edit' && selectedPlan) {
        await apiService.updateRatePlan(selectedPlan.id, planFormData);
      }

      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving rate plan:', error);
      setError('Failed to save rate plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRule = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (modalType === 'create') {
        await apiService.createRateRule(ruleFormData);
      }

      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving rate rule:', error);
      setError('Failed to save rate rule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAssignment = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (modalType === 'create') {
        await apiService.createLotRateAssignment(assignmentFormData);
      }

      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving lot assignment:', error);
      setError('Failed to save lot assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOverride = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (modalType === 'create') {
        await apiService.createSpaceRateOverride(overrideFormData);
      }

      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving space override:', error);
      setError('Failed to save space override. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (plan: RatePlan) => {
    try {
      setIsDeleting(true);
      await apiService.deleteRatePlan(plan.id);
      setShowDeleteModal(false);
      setItemToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting rate plan:', error);
      setError('Failed to delete rate plan. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateRule = () => {
    setRuleFormData({
      ratePlanId: selectedPlan?.id || 0,
      startMinute: undefined,
      endMinute: undefined,
      startTime: undefined,
      endTime: undefined,
      dayOfWeek: undefined,
      vehicleType: undefined,
      userGroup: undefined,
      pricePerHour: undefined,
      priceFlat: undefined
    });
    setModalType('create');
    setModalEntity('rule');
    setShowModal(true);
  };

  const handleCreateAssignment = () => {
    setAssignmentFormData({
      parkingLotId: 0,
      ratePlanId: 0,
      priority: 0,
      effectiveFrom: undefined,
      effectiveTo: undefined
    });
    setModalType('create');
    setModalEntity('assignment');
    setShowModal(true);
  };

  const handleCreateOverride = () => {
    setOverrideFormData({
      parkingSpaceId: 0,
      ratePlanId: 0,
      priority: 100,
      effectiveFrom: undefined,
      effectiveTo: undefined
    });
    setModalType('create');
    setModalEntity('override');
    setShowModal(true);
  };

  const tabs = [
    { id: 'plans', label: 'Rate Plans', count: ratePlans.length },
    { id: 'rules', label: 'Rate Rules', count: rateRules.length },
    { id: 'assignments', label: 'Lot Assignments', count: lotAssignments.length },
    { id: 'overrides', label: 'Space Overrides', count: spaceOverrides.length },
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Rate Management</h1>
          <p className="text-gray-600">Configure parking rates and pricing rules</p>
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
          {activeTab === 'plans' && (
            <button
              onClick={handleCreatePlan}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <MdAdd className="w-4 h-4" />
              <span>New Rate Plan</span>
            </button>
          )}
          {activeTab === 'rules' && (
            <button
              onClick={handleCreateRule}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <MdAdd className="w-4 h-4" />
              <span>New Rate Rule</span>
            </button>
          )}
          {activeTab === 'assignments' && (
            <button
              onClick={handleCreateAssignment}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <MdAdd className="w-4 h-4" />
              <span>New Assignment</span>
            </button>
          )}
          {activeTab === 'overrides' && (
            <button
              onClick={handleCreateOverride}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <MdAdd className="w-4 h-4" />
              <span>New Override</span>
            </button>
          )}
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

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MdSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Rate Plans Tab */}
          {activeTab === 'plans' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading rate plans...</span>
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="text-center py-12">
                  <MdAttachMoney className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Rate Plans Found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'No rate plans match your search criteria.' : 'No rate plans available at the moment.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlans.map((plan) => (
                      <div key={plan.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                          </div>
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getPlanTypeColor(plan.type)
                          )}>
                            {plan.type.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <MdAttachMoney className="w-4 h-4 mr-2" />
                            <span>Currency: {plan.currency}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MdSchedule className="w-4 h-4 mr-2" />
                            <span>Grace: {plan.graceMinutes || 0} min</span>
                          </div>
                          {plan.dailyCap && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MdSettings className="w-4 h-4 mr-2" />
                              <span>Daily Cap: {formatCurrency(plan.dailyCap, plan.currency)}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={cn(
                            'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                            plan.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          )}>
                            {plan.active ? 'Active' : 'Inactive'}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewPlan(plan)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <MdVisibility className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditPlan(plan)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <MdEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setItemToDelete(plan);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
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
          )}

          {/* Rate Rules Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading rate rules...</span>
                </div>
              ) : filteredRules.length === 0 ? (
                <div className="text-center py-12">
                  <MdSettings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Rate Rules Found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'No rate rules match your search criteria.' : 'No rate rules available at the moment.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Group</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Hour</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRules.map((rule) => (
                        <tr key={rule.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.ratePlanId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.vehicleType || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.userGroup || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.pricePerHour || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.priceFlat || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <MdEdit className="w-4 h-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                <MdDelete className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Lot Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading lot assignments...</span>
                </div>
              ) : filteredAssignments.length === 0 ? (
                <div className="text-center py-12">
                  <MdLocationOn className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Lot Assignments Found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'No lot assignments match your search criteria.' : 'No lot assignments available at the moment.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate Plan ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective From</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAssignments.map((assignment) => (
                        <tr key={assignment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assignment.parkingLotId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assignment.ratePlanId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assignment.priority}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {assignment.effectiveFrom ? formatDateTime(assignment.effectiveFrom) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <MdEdit className="w-4 h-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                <MdDelete className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Space Overrides Tab */}
          {activeTab === 'overrides' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading space overrides...</span>
                </div>
              ) : filteredOverrides.length === 0 ? (
                <div className="text-center py-12">
                  <MdSettings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Space Overrides Found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'No space overrides match your search criteria.' : 'No space overrides available at the moment.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Space ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate Plan ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective From</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOverrides.map((override) => (
                        <tr key={override.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{override.parkingSpaceId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{override.ratePlanId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{override.priority}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {override.effectiveFrom ? formatDateTime(override.effectiveFrom) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <MdEdit className="w-4 h-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                <MdDelete className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'create' && modalEntity === 'plan' && 'Create Rate Plan'}
                  {modalType === 'edit' && modalEntity === 'plan' && 'Edit Rate Plan'}
                  {modalType === 'view' && modalEntity === 'plan' && `Rate Plan - ${selectedPlan?.name}`}
                  {modalType === 'create' && modalEntity === 'rule' && 'Create Rate Rule'}
                  {modalType === 'create' && modalEntity === 'assignment' && 'Create Lot Assignment'}
                  {modalType === 'create' && modalEntity === 'override' && 'Create Space Override'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MdCancel className="w-6 h-6" />
                </button>
              </div>

              {/* Rate Plan Modal Content */}
              {modalEntity === 'plan' && (
                <>
                  {modalType === 'view' && selectedPlan ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedPlan.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Type</label>
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1',
                            getPlanTypeColor(selectedPlan.type)
                          )}>
                            {selectedPlan.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Currency</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedPlan.currency}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Time Zone</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedPlan.timeZone}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Grace Minutes</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedPlan.graceMinutes || 0}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Increment Minutes</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedPlan.incrementMinutes || 0}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Daily Cap</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedPlan.dailyCap ? formatCurrency(selectedPlan.dailyCap, selectedPlan.currency) : 'No cap'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1',
                            selectedPlan.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          )}>
                            {selectedPlan.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Created</label>
                          <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedPlan.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name *</label>
                        <input
                          type="text"
                          value={planFormData.name}
                          onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter rate plan name"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Type *</label>
                          <select 
                            value={planFormData.type}
                            onChange={(e) => setPlanFormData({ ...planFormData, type: e.target.value as RatePlanType })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            {Object.values(RatePlanType).map(type => (
                              <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Currency *</label>
                          <select 
                            value={planFormData.currency}
                            onChange={(e) => setPlanFormData({ ...planFormData, currency: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="ALL">ALL (Albanian Lek)</option>
                            <option value="EUR">EUR (Euro)</option>
                            <option value="USD">USD (US Dollar)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Time Zone *</label>
                        <select 
                          value={planFormData.timeZone}
                          onChange={(e) => setPlanFormData({ ...planFormData, timeZone: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="Europe/Tirane">Europe/Tirane</option>
                          <option value="Europe/London">Europe/London</option>
                          <option value="Europe/Paris">Europe/Paris</option>
                          <option value="America/New_York">America/New_York</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Grace Minutes</label>
                          <input
                            type="number"
                            min="0"
                            value={planFormData.graceMinutes || ''}
                            onChange={(e) => setPlanFormData({ ...planFormData, graceMinutes: e.target.value ? parseInt(e.target.value) : undefined })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="15"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Increment Minutes</label>
                          <input
                            type="number"
                            min="0"
                            value={planFormData.incrementMinutes || ''}
                            onChange={(e) => setPlanFormData({ ...planFormData, incrementMinutes: e.target.value ? parseInt(e.target.value) : undefined })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="15"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Daily Cap</label>
                          <input
                            type="number"
                            min="0"
                            value={planFormData.dailyCap || ''}
                            onChange={(e) => setPlanFormData({ ...planFormData, dailyCap: e.target.value ? parseInt(e.target.value) : undefined })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="2000"
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="active"
                          checked={planFormData.active}
                          onChange={(e) => setPlanFormData({ ...planFormData, active: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                          Active
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Rate Rule Modal Content */}
              {modalEntity === 'rule' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rate Plan *</label>
                    <select 
                      value={ruleFormData.ratePlanId}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, ratePlanId: parseInt(e.target.value) })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value={0}>Select Rate Plan</option>
                      {ratePlans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                      <select 
                        value={ruleFormData.vehicleType || ''}
                        onChange={(e) => setRuleFormData({ ...ruleFormData, vehicleType: e.target.value as VehicleType || undefined })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Any Vehicle Type</option>
                        {Object.values(VehicleType).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User Group</label>
                      <select 
                        value={ruleFormData.userGroup || ''}
                        onChange={(e) => setRuleFormData({ ...ruleFormData, userGroup: e.target.value as UserGroup || undefined })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Any User Group</option>
                        {Object.values(UserGroup).map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price Per Hour</label>
                      <input
                        type="number"
                        min="0"
                        value={ruleFormData.pricePerHour || ''}
                        onChange={(e) => setRuleFormData({ ...ruleFormData, pricePerHour: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Flat Price</label>
                      <input
                        type="number"
                        min="0"
                        value={ruleFormData.priceFlat || ''}
                        onChange={(e) => setRuleFormData({ ...ruleFormData, priceFlat: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Lot Assignment Modal Content */}
              {modalEntity === 'assignment' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parking Lot *</label>
                    <select 
                      value={assignmentFormData.parkingLotId}
                      onChange={(e) => setAssignmentFormData({ ...assignmentFormData, parkingLotId: parseInt(e.target.value) })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value={0}>Select Parking Lot</option>
                      {parkingLots.map(lot => (
                        <option key={lot.id} value={lot.id}>{lot.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rate Plan *</label>
                    <select 
                      value={assignmentFormData.ratePlanId}
                      onChange={(e) => setAssignmentFormData({ ...assignmentFormData, ratePlanId: parseInt(e.target.value) })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value={0}>Select Rate Plan</option>
                      {ratePlans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority *</label>
                    <input
                      type="number"
                      min="0"
                      value={assignmentFormData.priority}
                      onChange={(e) => setAssignmentFormData({ ...assignmentFormData, priority: parseInt(e.target.value) })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Effective From</label>
                      <input
                        type="datetime-local"
                        value={assignmentFormData.effectiveFrom ? assignmentFormData.effectiveFrom.slice(0, 16) : ''}
                        onChange={(e) => setAssignmentFormData({ ...assignmentFormData, effectiveFrom: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Effective To</label>
                      <input
                        type="datetime-local"
                        value={assignmentFormData.effectiveTo ? assignmentFormData.effectiveTo.slice(0, 16) : ''}
                        onChange={(e) => setAssignmentFormData({ ...assignmentFormData, effectiveTo: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Space Override Modal Content */}
              {modalEntity === 'override' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parking Space *</label>
                    <select 
                      value={overrideFormData.parkingSpaceId}
                      onChange={(e) => setOverrideFormData({ ...overrideFormData, parkingSpaceId: parseInt(e.target.value) })}
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
                    <label className="block text-sm font-medium text-gray-700">Rate Plan *</label>
                    <select 
                      value={overrideFormData.ratePlanId}
                      onChange={(e) => setOverrideFormData({ ...overrideFormData, ratePlanId: parseInt(e.target.value) })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value={0}>Select Rate Plan</option>
                      {ratePlans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority *</label>
                    <input
                      type="number"
                      min="0"
                      value={overrideFormData.priority}
                      onChange={(e) => setOverrideFormData({ ...overrideFormData, priority: parseInt(e.target.value) })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="100"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Effective From</label>
                      <input
                        type="datetime-local"
                        value={overrideFormData.effectiveFrom ? overrideFormData.effectiveFrom.slice(0, 16) : ''}
                        onChange={(e) => setOverrideFormData({ ...overrideFormData, effectiveFrom: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Effective To</label>
                      <input
                        type="datetime-local"
                        value={overrideFormData.effectiveTo ? overrideFormData.effectiveTo.slice(0, 16) : ''}
                        onChange={(e) => setOverrideFormData({ ...overrideFormData, effectiveTo: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
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
                    onClick={() => {
                      if (modalEntity === 'plan') handleSubmitPlan();
                      else if (modalEntity === 'rule') handleSubmitRule();
                      else if (modalEntity === 'assignment') handleSubmitAssignment();
                      else if (modalEntity === 'override') handleSubmitOverride();
                    }}
                    disabled={isSubmitting || (modalEntity === 'plan' && !planFormData.name.trim())}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : (modalType === 'create' ? 'Create' : 'Save Changes')}
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
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Rate Plan</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePlan(itemToDelete)}
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

export default Rates;