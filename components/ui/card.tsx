import React, { forwardRef, HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import Link from 'next/link';
import Image from 'next/image';

/**
 * Base Card component props
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'ghost';
  padding?: 'none' | 'small' | 'medium' | 'large';
  hover?: boolean;
  clickable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  fullHeight?: boolean;
}

/**
 * Card Header component props
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  separator?: boolean;
}

/**
 * Card Footer component props
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  separator?: boolean;
  sticky?: boolean;
}

/**
 * Memorial Card specific props
 */
export interface MemorialCardProps {
  memorial: {
    id: string;
    name: string;
    dates: {
      birth: string;
      death: string;
    };
    imageUrl?: string;
    coverPhotoUrl?: string;
    headline?: string;
    privacy: 'public' | 'private' | 'password';
    isPublished: boolean;
    createdAt: string;
  };
  variant?: 'grid' | 'list';
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

/**
 * Stat Card props for analytics
 */
export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'highlight';
}

/**
 * Base Card component
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'medium',
      hover = false,
      clickable = false,
      selected = false,
      disabled = false,
      fullHeight = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Padding classes
    const paddingClasses = {
      none: '',
      small: 'p-3',
      medium: 'p-4 sm:p-6',
      large: 'p-6 sm:p-8',
    };

    // Variant classes
    const variantClasses = {
      default: 'bg-white shadow-sm',
      bordered: 'bg-white border border-gray-200',
      elevated: 'bg-white shadow-lg',
      ghost: 'bg-transparent',
    };

    // Interactive states
    const interactiveClasses = clsx(
      clickable && !disabled && 'cursor-pointer',
      hover && !disabled && 'transition-all duration-200 hover:shadow-md hover:scale-[1.02]',
      selected && 'ring-2 ring-marian-blue ring-offset-2',
      disabled && 'opacity-50 cursor-not-allowed'
    );

    const cardClasses = clsx(
      'rounded-lg',
      paddingClasses[padding],
      variantClasses[variant],
      interactiveClasses,
      fullHeight && 'h-full',
      className
    );

    return (
      <div ref={ref} className={cardClasses} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card Header component
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ separator = false, className, children, ...props }, ref) => {
    const headerClasses = clsx(
      'px-6 py-4',
      separator && 'border-b border-gray-200',
      className
    );

    return (
      <div ref={ref} className={headerClasses} {...props}>
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * Card Body component
 */
export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const bodyClasses = clsx('px-6 py-4', className);

    return (
      <div ref={ref} className={bodyClasses} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'CardBody';

/**
 * Card Footer component
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ separator = false, sticky = false, className, children, ...props }, ref) => {
    const footerClasses = clsx(
      'px-6 py-4',
      separator && 'border-t border-gray-200',
      sticky && 'sticky bottom-0 bg-white rounded-b-lg',
      className
    );

    return (
      <div ref={ref} className={footerClasses} {...props}>
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

/**
 * Memorial Card component for displaying memorial summaries
 */
export function MemorialCard({
  memorial,
  variant = 'grid',
  showActions = false,
  onEdit,
  onDelete,
  onShare,
}: MemorialCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getAge = () => {
    const birth = new Date(memorial.dates.birth);
    const death = new Date(memorial.dates.death);
    const age = death.getFullYear() - birth.getFullYear();
    const monthDiff = death.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const privacyIcons = {
    public: (
      <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
      </svg>
    ),
    private: (
      <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
      </svg>
    ),
    password: (
      <svg className="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
      </svg>
    ),
  };

  if (variant === 'list') {
    return (
      <Card variant="bordered" hover clickable className="mb-4">
        <div className="flex items-center space-x-4">
          {/* Image */}
          <div className="flex-shrink-0">
            {memorial.imageUrl ? (
              <Image
                src={memorial.imageUrl}
                alt={memorial.name}
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                </svg>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Link href={`/memorials/${memorial.id}`} className="focus:outline-none">
              <h3 className="text-lg font-semibold text-gray-900 hover:text-marian-blue truncate">
                {memorial.name}
              </h3>
              <p className="text-sm text-gray-600">
                {formatDate(memorial.dates.birth)} - {formatDate(memorial.dates.death)} (Age {getAge()})
              </p>
              {memorial.headline && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{memorial.headline}</p>
              )}
            </Link>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {privacyIcons[memorial.privacy]}
              {!memorial.isPublished && (
                <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                  Draft
                </span>
              )}
            </div>

            {showActions && (
              <div className="flex items-center space-x-1">
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    aria-label="Edit memorial"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                )}
                {onShare && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onShare(); }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    aria-label="Share memorial"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-4.732 2.684m0-5.368a3 3 0 00-4.732-2.684"/>
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    aria-label="Delete memorial"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Grid variant
  return (
    <Card variant="bordered" hover clickable fullHeight>
      <Link href={`/memorials/${memorial.id}`} className="block">
        {/* Cover Photo */}
        <div className="relative h-32 -m-6 mb-4">
          {memorial.coverPhotoUrl ? (
            <Image
              src={memorial.coverPhotoUrl}
              alt=""
              fill
              className="object-cover rounded-t-lg"
            />
          ) : (
            <div className="h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg" />
          )}
          
          {/* Profile Image Overlay */}
          <div className="absolute -bottom-4 left-4">
            {memorial.imageUrl ? (
              <Image
                src={memorial.imageUrl}
                alt={memorial.name}
                width={72}
                height={72}
                className="rounded-full border-4 border-white object-cover"
              />
            ) : (
              <div className="w-[72px] h-[72px] bg-gray-300 rounded-full border-4 border-white flex items-center justify-center">
                <svg className="h-8 w-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="pt-8">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 hover:text-marian-blue truncate">
                {memorial.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(memorial.dates.birth)} - {formatDate(memorial.dates.death)}
              </p>
              <p className="text-sm text-gray-500">Age {getAge()}</p>
            </div>
            <div className="ml-2">
              {privacyIcons[memorial.privacy]}
            </div>
          </div>

          {memorial.headline && (
            <p className="text-sm text-gray-600 mt-3 line-clamp-2">{memorial.headline}</p>
          )}

          {/* Status Badge */}
          <div className="mt-4 flex items-center justify-between">
            {!memorial.isPublished ? (
              <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                Draft
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Published
              </span>
            )}

            {showActions && (
              <div className="flex items-center space-x-1">
                {onEdit && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    aria-label="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                )}
                {onShare && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onShare(); }}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    aria-label="Share"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-4.732 2.684m0-5.368a3 3 0 00-4.732-2.684"/>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}

/**
 * Stat Card component for analytics dashboards
 */
export function StatCard({
  title,
  value,
  description,
  trend,
  icon,
  variant = 'default',
}: StatCardProps) {
  return (
    <Card variant={variant === 'highlight' ? 'elevated' : 'bordered'}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
          
          {trend && (
            <div className="mt-2 flex items-center">
              {trend.isPositive ? (
                <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg className="h-4 w-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              )}
              <span className={clsx(
                'text-sm font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {Math.abs(trend.value)}%
              </span>
              <span className="ml-1 text-sm text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="ml-4 p-2 bg-marian-blue/10 text-marian-blue rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Empty State Card for when there's no data
 */
export interface EmptyStateCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyStateCard({ title, description, icon, action }: EmptyStateCardProps) {
  return (
    <Card variant="bordered" className="text-center py-12">
      {icon && (
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gray-100 rounded-full text-gray-400">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-marian-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marian-blue"
        >
          {action.label}
        </button>
      )}
    </Card>
  );
}