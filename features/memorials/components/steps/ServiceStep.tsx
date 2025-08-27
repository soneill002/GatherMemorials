'use client';

import { useState } from 'react';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  X, 
  Church,
  Users,
  Heart,
  Flower2,
  Info,
  ChevronUp,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { Memorial, ServiceEvent, ServiceType } from '@/types/memorial';
import clsx from 'clsx';

interface ServiceStepProps {
  data: Memorial;
  updateData: (updates: Partial<Memorial>) => void;
  onNext: () => void;
  onPrevious: () => void;
  errors?: Record<string, string>;
}

// Service type options with icons and descriptions
const serviceTypeOptions: Array<{
  value: ServiceType;
  label: string;
  icon: any;
  description: string;
}> = [
  {
    value: 'visitation',
    label: 'Visitation / Wake',
    icon: Users,
    description: 'Time for friends and family to pay respects'
  },
  {
    value: 'funeral',
    label: 'Funeral Mass',
    icon: Church,
    description: 'Catholic funeral liturgy and Mass'
  },
  {
    value: 'burial',
    label: 'Burial / Committal',
    icon: Flower2,
    description: 'Graveside service or interment'
  },
  {
    value: 'celebration',
    label: 'Celebration of Life',
    icon: Heart,
    description: 'Memorial gathering or reception'
  }
];

// Helper to format date for input
const formatDateForInput = (date: string | undefined) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Helper to format time for input
const formatTimeForInput = (time: string | undefined) => {
  if (!time) return '';
  // Ensure time is in HH:MM format
  return time.substring(0, 5);
};

export function ServiceStep({
  data,
  updateData,
  onNext,
  onPrevious,
  errors = {}
}: ServiceStepProps) {
  const [services, setServices] = useState<ServiceEvent[]>(data.services || []);
  const [expandedService, setExpandedService] = useState<number | null>(
    services.length === 1 ? 0 : null
  );
  const [skipServices, setSkipServices] = useState(services.length === 0);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  // Add a new service
  const addService = () => {
    const newService: ServiceEvent = {
      id: Date.now().toString(),
      type: 'visitation',
      date: '',
      time: '',
      location: '',
      address: '',
      notes: ''
    };
    const updatedServices = [...services, newService];
    setServices(updatedServices);
    updateData({ services: updatedServices });
    setExpandedService(updatedServices.length - 1);
    setSkipServices(false);
    showToast('Service added', 'success');
  };

  // Update a specific service
  const updateService = (index: number, updates: Partial<ServiceEvent>) => {
    const updatedServices = services.map((service, i) => 
      i === index ? { ...service, ...updates } : service
    );
    setServices(updatedServices);
    updateData({ services: updatedServices });
  };

  // Remove a service
  const removeService = (index: number) => {
    const updatedServices = services.filter((_, i) => i !== index);
    setServices(updatedServices);
    updateData({ services: updatedServices });
    
    if (expandedService === index) {
      setExpandedService(null);
    } else if (expandedService !== null && expandedService > index) {
      setExpandedService(expandedService - 1);
    }
    
    showToast('Service removed', 'success');
  };

  // Toggle service expansion
  const toggleServiceExpansion = (index: number) => {
    setExpandedService(expandedService === index ? null : index);
  };

  // Validate services
  const validate = (): boolean => {
    if (skipServices) {
      return true; // No validation needed if skipping
    }

    const newErrors: Record<string, string> = {};
    
    if (services.length === 0) {
      newErrors.services = 'Please add at least one service or choose to skip';
      setLocalErrors(newErrors);
      return false;
    }

    // Validate each service
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      if (!service.date) {
        newErrors[`service_${i}_date`] = 'Date is required';
      }
      if (!service.time) {
        newErrors[`service_${i}_time`] = 'Time is required';
      }
      if (!service.location) {
        newErrors[`service_${i}_location`] = 'Location name is required';
      }
      if (!service.address) {
        newErrors[`service_${i}_address`] = 'Address is required';
      }
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      if (skipServices) {
        updateData({ services: [] });
      }
      onNext();
    } else {
      showToast('Please complete all service information', 'error');
    }
  };

  const handleSkipToggle = () => {
    const newSkipState = !skipServices;
    setSkipServices(newSkipState);
    if (newSkipState) {
      setExpandedService(null);
      showToast('Services will be skipped', 'info');
    } else if (services.length === 0) {
      addService();
    }
  };

  // Generate Google Maps URL
  const getMapUrl = (address: string) => {
    const encoded = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  };

  // Format display date
  const formatDisplayDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date + 'T00:00:00'); // Ensure local timezone
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format display time
  const formatDisplayTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Service Information
        </h2>
        <p className="text-gray-600">
          Add details about visitation, funeral, burial, or celebration of life services.
        </p>
      </div>

      {/* Skip Option */}
      <Card className="bg-gray-50">
        <div className="p-6">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={skipServices}
              onChange={handleSkipToggle}
              className="mt-1 w-4 h-4 text-marianBlue border-gray-300 rounded focus:ring-marianBlue"
            />
            <div className="ml-3">
              <span className="font-medium text-gray-900">
                No services at this time
              </span>
              <p className="text-sm text-gray-600 mt-1">
                Select this if service details are not yet available or if services are private
              </p>
            </div>
          </label>
        </div>
      </Card>

      {!skipServices && (
        <>
          {/* Services List */}
          {services.length > 0 ? (
            <div className="space-y-4">
              {services.map((service, index) => {
                const isExpanded = expandedService === index;
                const serviceType = serviceTypeOptions.find(opt => opt.value === service.type);
                const Icon = serviceType?.icon || Church;
                
                return (
                  <Card key={service.id} className={clsx(
                    "transition-all",
                    isExpanded && "ring-2 ring-marianBlue"
                  )}>
                    {/* Service Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <button
                          type="button"
                          onClick={() => toggleServiceExpansion(index)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-marianBlue/10 rounded-lg">
                              <Icon className="w-6 h-6 text-marianBlue" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-900">
                                {serviceType?.label || 'Service'}
                              </h3>
                              {service.date && service.time && (
                                <p className="text-gray-600 mt-1">
                                  {formatDisplayDate(service.date)} at {formatDisplayTime(service.time)}
                                </p>
                              )}
                              {service.location && (
                                <p className="text-gray-500 text-sm mt-1">
                                  {service.location}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remove service"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Service Details */}
                    {isExpanded && (
                      <div className="px-6 pb-6 space-y-4 border-t">
                        {/* Service Type */}
                        <div className="pt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Service Type
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {serviceTypeOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => updateService(index, { type: option.value })}
                                className={clsx(
                                  "p-3 rounded-lg border-2 text-left transition-all",
                                  service.type === option.value
                                    ? "border-marianBlue bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <option.icon className="w-5 h-5 text-marianBlue mt-0.5" />
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{option.label}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Date and Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Date"
                            type="date"
                            value={formatDateForInput(service.date)}
                            onChange={(e) => updateService(index, { date: e.target.value })}
                            error={localErrors[`service_${index}_date`]}
                            required
                            icon={Calendar}
                          />
                          <Input
                            label="Time"
                            type="time"
                            value={formatTimeForInput(service.time)}
                            onChange={(e) => updateService(index, { time: e.target.value })}
                            error={localErrors[`service_${index}_time`]}
                            required
                            icon={Clock}
                          />
                        </div>

                        {/* Location */}
                        <div className="space-y-4">
                          <Input
                            label="Location Name"
                            value={service.location}
                            onChange={(e) => updateService(index, { location: e.target.value })}
                            placeholder="St. Mary's Catholic Church"
                            error={localErrors[`service_${index}_location`]}
                            required
                            icon={MapPin}
                          />
                          
                          <Textarea
                            label="Address"
                            value={service.address}
                            onChange={(e) => updateService(index, { address: e.target.value })}
                            placeholder="123 Main Street, City, State 12345"
                            error={localErrors[`service_${index}_address`]}
                            rows={2}
                            required
                          />

                          {service.address && (
                            <a
                              href={getMapUrl(service.address)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-marianBlue hover:text-blue-700"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View on Google Maps
                            </a>
                          )}

                          <Textarea
                            label="Additional Notes"
                            value={service.notes}
                            onChange={(e) => updateService(index, { notes: e.target.value })}
                            placeholder="Reception to follow, parking available behind church, etc."
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}

              {/* Add Another Service */}
              <Button
                type="button"
                variant="secondary"
                onClick={addService}
                icon={Plus}
                className="w-full sm:w-auto"
              >
                Add Another Service
              </Button>
            </div>
          ) : (
            /* No Services Yet */
            !skipServices && (
              <Card>
                <div className="p-8 text-center">
                  <Church className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Services Added
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Add service information to help visitors know when and where to pay their respects.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={addService}
                    icon={Plus}
                  >
                    Add First Service
                  </Button>
                </div>
              </Card>
            )
          )}

          {/* Service Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Info className="w-5 h-5 mr-2 text-liturgicalGold" />
                Service Planning Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>List services in chronological order (visitation, funeral, burial)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>Include the full address to help visitors find the location</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>Add notes about parking, reception details, or special requests</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>Consider timezone if services are in different locations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>You can always update this information later if details change</span>
                </li>
              </ul>
            </div>
          </Card>
        </>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onPrevious}
        >
          Back to Obituary
        </Button>
        
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
        >
          Continue to Donations
        </Button>
      </div>
    </div>
  );
}