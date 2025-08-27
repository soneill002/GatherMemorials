'use client';

import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

// Base Skeleton Component
export function Skeleton({ 
  className, 
  animate = true 
}: SkeletonProps) {
  return (
    <div
      className={clsx(
        'bg-gray-200',
        animate && 'animate-pulse',
        className
      )}
    />
  );
}

// Text Skeleton - for paragraphs and text blocks
interface SkeletonTextProps extends SkeletonProps {
  lines?: number;
  width?: 'full' | 'three-quarters' | 'half' | 'quarter';
}

export function SkeletonText({ 
  lines = 3, 
  width = 'full',
  className,
  animate = true 
}: SkeletonTextProps) {
  const widthClasses = {
    'full': 'w-full',
    'three-quarters': 'w-3/4',
    'half': 'w-1/2',
    'quarter': 'w-1/4',
  };

  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={clsx(
            'h-4 bg-gray-200 rounded',
            animate && 'animate-pulse',
            index === lines - 1 ? widthClasses[width] : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

// Avatar Skeleton - for profile pictures
interface SkeletonAvatarProps extends SkeletonProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function SkeletonAvatar({ 
  size = 'md',
  className,
  animate = true 
}: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div
      className={clsx(
        'bg-gray-200 rounded-full',
        sizeClasses[size],
        animate && 'animate-pulse',
        className
      )}
    />
  );
}

// Button Skeleton
interface SkeletonButtonProps extends SkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  width?: 'auto' | 'full';
}

export function SkeletonButton({ 
  size = 'md',
  width = 'auto',
  className,
  animate = true 
}: SkeletonButtonProps) {
  const sizeClasses = {
    sm: 'h-8 px-12',
    md: 'h-10 px-16',
    lg: 'h-12 px-20',
  };

  return (
    <div
      className={clsx(
        'bg-gray-200 rounded-lg',
        sizeClasses[size],
        width === 'full' ? 'w-full' : 'inline-block',
        animate && 'animate-pulse',
        className
      )}
    />
  );
}

// Card Skeleton - for memorial cards
interface SkeletonCardProps extends SkeletonProps {
  showImage?: boolean;
  showActions?: boolean;
}

export function SkeletonCard({ 
  showImage = true,
  showActions = false,
  className,
  animate = true 
}: SkeletonCardProps) {
  return (
    <div className={clsx('bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden', className)}>
      {showImage && (
        <div className={clsx('h-48 bg-gray-200', animate && 'animate-pulse')} />
      )}
      <div className="p-4 space-y-3">
        <div className={clsx('h-6 bg-gray-200 rounded w-3/4', animate && 'animate-pulse')} />
        <div className={clsx('h-4 bg-gray-200 rounded w-1/2', animate && 'animate-pulse')} />
        <div className="space-y-2 pt-2">
          <div className={clsx('h-3 bg-gray-200 rounded', animate && 'animate-pulse')} />
          <dystrov className={clsx('h-3 bg-gray-200 rounded', animate && 'animate-pulse')} />
          <div className={clsx('h-3 bg-gray-200 rounded w-4/5', animate && 'animate-pulse')} />
        </div>
        {showActions && (
          <div className="flex gap-2 pt-4">
            <div className={clsx('h-9 bg-gray-200 rounded flex-1', animate && 'animate-pulse')} />
            <div className={clsx('h-9 bg-gray-200 rounded flex-1', animate && 'animate-pulse')} />
          </div>
        )}
      </div>
    </div>
  );
}

// Memorial Preview Skeleton - for full memorial page
export function SkeletonMemorialPreview({ 
  className,
  animate = true 
}: SkeletonProps) {
  return (
    <div className={clsx('space-y-6', className)}>
      {/* Hero Section */}
      <div className={clsx('h-64 bg-gray-200 rounded-lg', animate && 'animate-pulse')} />
      
      {/* Profile Section */}
      <div className="flex items-center gap-4">
        <SkeletonAvatar size="xl" animate={animate} />
        <div className="flex-1 space-y-2">
          <div className={clsx('h-8 bg-gray-200 rounded w-1/3', animate && 'animate-pulse')} />
          <div className={clsx('h-4 bg-gray-200 rounded w-1/4', animate && 'animate-pulse')} />
        </div>
      </div>

      {/* Obituary Section */}
      <div className="space-y-3">
        <div className={clsx('h-6 bg-gray-200 rounded w-32', animate && 'animate-pulse')} />
        <SkeletonText lines={5} animate={animate} />
      </div>

      {/* Service Information */}
      <div className="space-y-3">
        <div className={clsx('h-6 bg-gray-200 rounded w-40', animate && 'animate-pulse')} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className={clsx('h-24 bg-gray-200 rounded', animate && 'animate-pulse')} />
          <div className={clsx('h-24 bg-gray-200 rounded', animate && 'animate-pulse')} />
        </div>
      </div>

      {/* Gallery Section */}
      <div className="space-y-3">
        <div className={clsx('h-6 bg-gray-200 rounded w-24', animate && 'animate-pulse')} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={clsx('h-32 bg-gray-200 rounded', animate && 'animate-pulse')} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Guestbook Entry Skeleton
export function SkeletonGuestbookEntry({ 
  className,
  animate = true 
}: SkeletonProps) {
  return (
    <div className={clsx('bg-white p-4 rounded-lg border border-gray-200 space-y-3', className)}>
      <div className="flex items-start gap-3">
        <SkeletonAvatar size="sm" animate={animate} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className={clsx('h-4 bg-gray-200 rounded w-24', animate && 'animate-pulse')} />
            <div className={clsx('h-3 bg-gray-200 rounded w-16', animate && 'animate-pulse')} />
          </div>
          <SkeletonText lines={2} width="three-quarters" animate={animate} />
        </div>
      </div>
    </div>
  );
}

// Form Field Skeleton
export function SkeletonFormField({ 
  className,
  animate = true 
}: SkeletonProps) {
  return (
    <div className={clsx('space-y-2', className)}>
      <div className={clsx('h-4 bg-gray-200 rounded w-24', animate && 'animate-pulse')} />
      <div className={clsx('h-10 bg-gray-200 rounded', animate && 'animate-pulse')} />
    </div>
  );
}

// Table Row Skeleton
interface SkeletonTableRowProps extends SkeletonProps {
  columns?: number;
}

export function SkeletonTableRow({ 
  columns = 4,
  className,
  animate = true 
}: SkeletonTableRowProps) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className={clsx('h-4 bg-gray-200 rounded', animate && 'animate-pulse')} />
        </td>
      ))}
    </tr>
  );
}

// Stats Card Skeleton
export function SkeletonStatCard({ 
  className,
  animate = true 
}: SkeletonProps) {
  return (
    <div className={clsx('bg-white p-6 rounded-lg border border-gray-200 space-y-2', className)}>
      <div className={clsx('h-4 bg-gray-200 rounded w-20', animate && 'animate-pulse')} />
      <div className={clsx('h-8 bg-gray-200 rounded w-32', animate && 'animate-pulse')} />
      <div className={clsx('h-3 bg-gray-200 rounded w-24', animate && 'animate-pulse')} />
    </div>
  );
}

// Prayer List Item Skeleton
export function SkeletonPrayerListItem({ 
  className,
  animate = true 
}: SkeletonProps) {
  return (
    <div className={clsx('flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200', className)}>
      <div className={clsx('h-12 w-12 bg-gray-200 rounded-full', animate && 'animate-pulse')} />
      <div className="flex-1 space-y-2">
        <div className={clsx('h-5 bg-gray-200 rounded w-1/3', animate && 'animate-pulse')} />
        <div className={clsx('h-3 bg-gray-200 rounded w-1/4', animate && 'animate-pulse')} />
      </div>
      <div className={clsx('h-8 w-8 bg-gray-200 rounded', animate && 'animate-pulse')} />
    </div>
  );
}

// Image Gallery Skeleton
interface SkeletonGalleryProps extends SkeletonProps {
  items?: number;
}

export function SkeletonGallery({ 
  items = 6,
  className,
  animate = true 
}: SkeletonGalleryProps) {
  return (
    <div className={clsx('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className={clsx('aspect-square bg-gray-200 rounded-lg', animate && 'animate-pulse')} />
      ))}
    </div>
  );
}

// Navigation Skeleton (for dynamic nav items)
export function SkeletonNavigation({ 
  className,
  animate = true 
}: SkeletonProps) {
  return (
    <div className={clsx('flex items-center gap-6', className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={clsx('h-4 bg-gray-200 rounded w-16', animate && 'animate-pulse')} />
      ))}
    </div>
  );
}

// Wizard Step Skeleton
export function SkeletonWizardStep({ 
  className,
  animate = true 
}: SkeletonProps) {
  return (
    <div className={clsx('space-y-6', className)}>
      {/* Step header */}
      <div className="space-y-2">
        <div className={clsx('h-8 bg-gray-200 rounded w-1/3', animate && 'animate-pulse')} />
        <div className={clsx('h-4 bg-gray-200 rounded w-2/3', animate && 'animate-pulse')} />
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        <SkeletonFormField animate={animate} />
        <SkeletonFormField animate={animate} />
        <SkeletonFormField animate={animate} />
      </div>

      {/* Action buttons */}
      <div className="flex justify-between">
        <div className={clsx('h-10 w-24 bg-gray-200 rounded', animate && 'animate-pulse')} />
        <div className={clsx('h-10 w-24 bg-gray-200 rounded', animate && 'animate-pulse')} />
      </div>
    </div>
  );
}