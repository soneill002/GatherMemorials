'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Calendar, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Memorial } from '@/types/memorial';
import clsx from 'clsx';

interface BasicInfoStepProps {
  data: Memorial;
  updateData: (updates: Partial<Memorial>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirstStep: boolean;
  errors?: Record<string, string>;
}

// Standard cover photos available as options
const standardCoverPhotos = [
  {
    id: 'peaceful-field',
    name: 'Peaceful Field',
    url: '/images/cover-photos/peaceful-field.jpg',
    thumbnail: '/images/cover-photos/peaceful-field.jpg'
  },
  {
    id: 'stained-glass',
    name: 'Stained Glass',
    url: '/images/cover-photos/stained-glass.jpg',
    thumbnail: '/images/cover-photos/stained-glass.jpg'
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    url: '/images/cover-photos/ocean-waves.jpg',
    thumbnail: '/images/cover-photos/ocean-waves.jpg'
  },
  {
    id: 'forest',
    name: 'Forest',
    url: '/images/cover-photos/forest.jpg',
    thumbnail: '/images/cover-photos/forest.jpg'
  }
];

export function BasicInfoStep({
  data,
  updateData,
  onNext,
  onPrevious,
  isFirstStep,
  errors = {}
}: BasicInfoStepProps) {
  const [showCoverOptions, setShowCoverOptions] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const featuredImageRef = useRef<HTMLInputElement>(null);
  const coverPhotoRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Validate required fields
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!data.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!data.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!data.birthDate) {
      newErrors.birthDate = 'Birth date is required';
    }
    if (!data.deathDate) {
      newErrors.deathDate = 'Death date is required';
    }
    if (!data.featuredImage) {
      newErrors.featuredImage = 'Featured image is required';
    }
    if (!data.coverPhoto) {
      newErrors.coverPhoto = 'Cover photo is required';
    }

    // Validate date logic
    if (data.birthDate && data.deathDate) {
      const birth = new Date(data.birthDate);
      const death = new Date(data.deathDate);
      if (birth >= death) {
        newErrors.deathDate = 'Death date must be after birth date';
      }
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    } else {
      showToast('Please fill in all required fields', 'error');
    }
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be less than 10MB', 'error');
      return;
    }

    // For now, create a local URL. In production, upload to Cloudinary
    const localUrl = URL.createObjectURL(file);
    updateData({ 
      featuredImage: localUrl,
      featuredImageFile: file // Store file for later upload
    });
    showToast('Featured image added', 'success');
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be less than 10MB', 'error');
      return;
    }

    // For now, create a local URL. In production, upload to Cloudinary
    const localUrl = URL.createObjectURL(file);
    updateData({ 
      coverPhoto: localUrl,
      coverPhotoFile: file // Store file for later upload
    });
    setShowCoverOptions(false);
    showToast('Cover photo added', 'success');
  };

  const selectStandardCover = (photo: typeof standardCoverPhotos[0]) => {
    updateData({ 
      coverPhoto: photo.url,
      coverPhotoType: 'standard',
      coverPhotoId: photo.id
    });
    setShowCoverOptions(false);
    showToast(`Selected ${photo.name} cover`, 'success');
  };

  const removeFeaturedImage = () => {
    updateData({ featuredImage: undefined, featuredImageFile: undefined });
  };

  const removeCoverPhoto = () => {
    updateData({ 
      coverPhoto: undefined, 
      coverPhotoFile: undefined,
      coverPhotoType: undefined,
      coverPhotoId: undefined
    });
  };

  // Format date for input field
  const formatDateForInput = (date: string | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Calculate age for display
  const calculateAge = () => {
    if (!data.birthDate || !data.deathDate) return null;
    const birth = new Date(data.birthDate);
    const death = new Date(data.deathDate);
    const age = Math.floor((death.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age;
  };

  const age = calculateAge();

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Basic Information
        </h2>
        <p className="text-gray-600">
          Let's start with some basic information about your loved one.
        </p>
      </div>

      {/* Name Fields */}
      <Card>
        <div className="p-6 space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Name</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={data.firstName || ''}
              onChange={(e) => updateData({ firstName: e.target.value })}
              error={localErrors.firstName || errors?.firstName}
              required
              placeholder="John"
            />
            
            <Input
              label="Middle Name"
              value={data.middleName || ''}
              onChange={(e) => updateData({ middleName: e.target.value })}
              placeholder="Michael (optional)"
            />
            
            <Input
              label="Last Name"
              value={data.lastName || ''}
              onChange={(e) => updateData({ lastName: e.target.value })}
              error={localErrors.lastName || errors?.lastName}
              required
              placeholder="Doe"
            />
            
            <Input
              label="Nickname"
              value={data.nickname || ''}
              onChange={(e) => updateData({ nickname: e.target.value })}
              placeholder="Johnny (optional)"
            />
          </div>
        </div>
      </Card>

      {/* Date Fields */}
      <Card>
        <div className="p-6 space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Important Dates</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={formatDateForInput(data.birthDate)}
              onChange={(e) => updateData({ birthDate: e.target.value })}
              error={localErrors.birthDate || errors?.birthDate}
              required
              icon={Calendar}
            />
            
            <Input
              label="Date of Death"
              type="date"
              value={formatDateForInput(data.deathDate)}
              onChange={(e) => updateData({ deathDate: e.target.value })}
              error={localErrors.deathDate || errors?.deathDate}
              required
              icon={Calendar}
            />
          </div>
          
          {age !== null && (
            <p className="text-sm text-gray-500">
              Age: {age} year{age === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </Card>

      {/* Featured Image */}
      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Featured Image</h3>
            <p className="text-sm text-gray-500">
              This will be the main photo displayed on the memorial
            </p>
          </div>
          
          {data.featuredImage ? (
            <div className="relative">
              <div className="relative w-full max-w-md mx-auto">
                <img
                  src={data.featuredImage}
                  alt="Featured"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeFeaturedImage}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                  aria-label="Remove featured image"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => featuredImageRef.current?.click()}
              className={clsx(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                localErrors.featuredImage 
                  ? "border-red-300 bg-red-50 hover:bg-red-100" 
                  : "border-gray-300 hover:border-marianBlue hover:bg-blue-50"
              )}
            >
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                Click to upload featured image
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG or GIF (max. 10MB)
              </p>
              {localErrors.featuredImage && (
                <p className="text-xs text-red-600 mt-2">{localErrors.featuredImage}</p>
              )}
            </div>
          )}
          
          <input
            ref={featuredImageRef}
            type="file"
            accept="image/*"
            onChange={handleFeaturedImageUpload}
            className="hidden"
          />
        </div>
      </Card>

      {/* Cover Photo */}
      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Cover Photo</h3>
            <p className="text-sm text-gray-500">
              Background image for the memorial page
            </p>
          </div>
          
          {data.coverPhoto ? (
            <div className="relative">
              <div className="relative w-full">
                <img
                  src={data.coverPhoto}
                  alt="Cover"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeCoverPhoto}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                  aria-label="Remove cover photo"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={showCoverOptions ? 'secondary' : 'primary'}
                  onClick={() => coverPhotoRef.current?.click()}
                  icon={Upload}
                >
                  Upload Your Own
                </Button>
                <Button
                  type="button"
                  variant={showCoverOptions ? 'primary' : 'secondary'}
                  onClick={() => setShowCoverOptions(!showCoverOptions)}
                >
                  Choose Standard Cover
                </Button>
              </div>
              
              {showCoverOptions && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {standardCoverPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => selectStandardCover(photo)}
                      className="group relative aspect-video rounded-lg overflow-hidden border-2 border-gray-200 hover:border-marianBlue transition-colors"
                    >
                      <img
                        src={photo.thumbnail}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          {photo.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {localErrors.coverPhoto && (
                <p className="text-sm text-red-600">{localErrors.coverPhoto}</p>
              )}
            </div>
          )}
          
          <input
            ref={coverPhotoRef}
            type="file"
            accept="image/*"
            onChange={handleCoverPhotoUpload}
            className="hidden"
          />
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onPrevious}
          disabled={isFirstStep}
        >
          Previous
        </Button>
        
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
        >
          Continue to Headline
        </Button>
      </div>
    </div>
  );
}