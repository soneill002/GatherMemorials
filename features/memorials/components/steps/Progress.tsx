'use client';

import { clsx } from 'clsx';
import { Fragment } from 'react';

// Base Progress Bar Component
interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  className?: string;
  animate?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  className,
  animate = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-amber-500',
    error: 'bg-red-600',
  };

  return (
    <div className={clsx('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-gray-700">{label}</span>}
          {showLabel && (
            <span className="text-sm font-medium text-gray-900">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={clsx(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300 ease-out',
            variantClasses[variant],
            animate && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}

// Step Progress Component for Wizard
export interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  status?: 'complete' | 'current' | 'upcoming' | 'error';
  optional?: boolean;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  variant?: 'circles' | 'dots' | 'numbers';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  allowNavigation?: boolean;
  className?: string;
}

export function StepProgress({
  steps,
  currentStep,
  onStepClick,
  variant = 'circles',
  size = 'md',
  orientation = 'horizontal',
  showLabels = true,
  allowNavigation = true,
  className,
}: StepProgressProps) {
  const sizeClasses = {
    sm: {
      circle: 'w-8 h-8 text-xs',
      dot: 'w-2 h-2',
      number: 'w-6 h-6 text-xs',
      text: 'text-xs',
    },
    md: {
      circle: 'w-10 h-10 text-sm',
      dot: 'w-3 h-3',
      number: 'w-8 h-8 text-sm',
      text: 'text-sm',
    },
    lg: {
      circle: 'w-12 h-12 text-base',
      dot: 'w-4 h-4',
      number: 'w-10 h-10 text-base',
      text: 'text-base',
    },
  };

  const getStepStatus = (index: number): Step['status'] => {
    if (steps[index].status) return steps[index].status;
    if (index < currentStep) return 'complete';
    if (index === currentStep) return 'current';
    return 'upcoming';
  };

  const isClickable = (index: number) => {
    return allowNavigation && index < currentStep && onStepClick;
  };

  if (orientation === 'vertical') {
    return (
      <div className={clsx('flex flex-col', className)}>
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const clickable = isClickable(index);
          
          return (
            <div key={step.id} className="flex items-start">
              <div className="flex flex-col items-center">
                <StepIndicator
                  step={step}
                  index={index}
                  status={status}
                  variant={variant}
                  size={size}
                  onClick={clickable ? () => onStepClick!(index) : undefined}
                  clickable={clickable}
                />
                {index < steps.length - 1 && (
                  <StepConnector
                    status={status}
                    orientation="vertical"
                    size={size}
                  />
                )}
              </div>
              {showLabels && (
                <div className={clsx('ml-4 pb-8', index === steps.length - 1 && 'pb-0')}>
                  <p className={clsx(
                    'font-medium',
                    sizeClasses[size].text,
                    status === 'current' ? 'text-blue-600' : 'text-gray-900'
                  )}>
                    {step.title}
                    {step.optional && (
                      <span className="ml-1 text-gray-500 font-normal">(Optional)</span>
                    )}
                  </p>
                  {step.description && (
                    <p className={clsx(
                      'mt-1 text-gray-600',
                      sizeClasses[size].text
                    )}>
                      {step.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const clickable = isClickable(index);
          
          return (
            <Fragment key={step.id}>
              <div className={clsx(
                'flex flex-col items-center',
                index !== 0 && index !== steps.length - 1 && 'flex-1'
              )}>
                <StepIndicator
                  step={step}
                  index={index}
                  status={status}
                  variant={variant}
                  size={size}
                  onClick={clickable ? () => onStepClick!(index) : undefined}
                  clickable={clickable}
                />
                {showLabels && (
                  <div className={clsx('mt-2 text-center', sizeClasses[size].text)}>
                    <p className={clsx(
                      'font-medium',
                      status === 'current' ? 'text-blue-600' : 
                      status === 'complete' ? 'text-gray-900' : 
                      'text-gray-500'
                    )}>
                      {step.title}
                    </p>
                    {step.description && size !== 'sm' && (
                      <p className="text-gray-600 text-xs mt-1">
                        {step.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {index < steps.length - 1 && (
                <StepConnector
                  status={status}
                  orientation="horizontal"
                  size={size}
                  className="flex-1"
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

// Step Indicator Component
interface StepIndicatorProps {
  step: Step;
  index: number;
  status: Step['status'];
  variant: 'circles' | 'dots' | 'numbers';
  size: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  clickable: boolean;
}

function StepIndicator({
  step,
  index,
  status,
  variant,
  size,
  onClick,
  clickable,
}: StepIndicatorProps) {
  const sizeClasses = {
    sm: {
      circle: 'w-8 h-8 text-xs',
      dot: 'w-2 h-2',
      number: 'w-6 h-6 text-xs',
    },
    md: {
      circle: 'w-10 h-10 text-sm',
      dot: 'w-3 h-3',
      number: 'w-8 h-8 text-sm',
    },
    lg: {
      circle: 'w-12 h-12 text-base',
      dot: 'w-4 h-4',
      number: 'w-10 h-10 text-base',
    },
  };

  const statusClasses = {
    complete: 'bg-blue-600 text-white border-blue-600',
    current: 'bg-white text-blue-600 border-blue-600 border-2',
    upcoming: 'bg-white text-gray-400 border-gray-300 border',
    error: 'bg-red-100 text-red-600 border-red-600 border-2',
  };

  if (variant === 'dots') {
    return (
      <button
        onClick={onClick}
        disabled={!clickable}
        className={clsx(
          'rounded-full transition-all',
          sizeClasses[size].dot,
          status === 'complete' || status === 'current' ? 'bg-blue-600' : 'bg-gray-300',
          clickable && 'cursor-pointer hover:scale-110',
          !clickable && 'cursor-default'
        )}
        aria-label={`Step ${index + 1}: ${step.title}`}
      />
    );
  }

  const checkIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );

  const errorIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );

  return (
    <button
      onClick={onClick}
      disabled={!clickable}
      className={clsx(
        'rounded-full flex items-center justify-center font-semibold transition-all',
        sizeClasses[size][variant === 'numbers' ? 'number' : 'circle'],
        statusClasses[status || 'upcoming'],
        clickable && 'cursor-pointer hover:scale-105',
        !clickable && 'cursor-default'
      )}
      aria-label={`Step ${index + 1}: ${step.title}`}
      aria-current={status === 'current' ? 'step' : undefined}
    >
      {status === 'complete' && variant === 'circles' ? checkIcon :
       status === 'error' ? errorIcon :
       step.icon && variant === 'circles' ? step.icon :
       index + 1}
    </button>
  );
}

// Step Connector Component
interface StepConnectorProps {
  status?: Step['status'];
  orientation: 'horizontal' | 'vertical';
  size: 'sm' | 'md' | 'lg';
  className?: string;
}

function StepConnector({
  status,
  orientation,
  size,
  className,
}: StepConnectorProps) {
  const sizeClasses = {
    sm: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5 h-8',
    md: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5 h-12',
    lg: orientation === 'horizontal' ? 'h-1' : 'w-1 h-16',
  };

  return (
    <div
      className={clsx(
        'transition-all',
        sizeClasses[size],
        status === 'complete' ? 'bg-blue-600' : 'bg-gray-300',
        orientation === 'horizontal' ? 'mx-2' : 'my-2',
        className
      )}
    />
  );
}

// Memorial Wizard Progress Component
interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  onStepClick?: (step: number) => void;
  allowNavigation?: boolean;
  className?: string;
  completedSteps?: number[];
  errorSteps?: number[];
}

export function WizardProgress({
  currentStep,
  totalSteps,
  stepTitles,
  onStepClick,
  allowNavigation = true,
  className,
  completedSteps = [],
  errorSteps = [],
}: WizardProgressProps) {
  const steps: Step[] = Array.from({ length: totalSteps }, (_, i) => ({
    id: `step-${i + 1}`,
    title: stepTitles[i] || `Step ${i + 1}`,
    status: errorSteps.includes(i) ? 'error' :
            completedSteps.includes(i) ? 'complete' :
            i === currentStep ? 'current' :
            i < currentStep ? 'complete' : 'upcoming',
    optional: [4, 5, 6].includes(i), // Service, Donation, Gallery steps are optional
  }));

  return (
    <div className={className}>
      {/* Mobile Progress Bar */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-sm text-gray-600">
            {stepTitles[currentStep]}
          </span>
        </div>
        <ProgressBar 
          value={currentStep + 1} 
          max={totalSteps}
          size="md"
          variant={errorSteps.includes(currentStep) ? 'error' : 'default'}
        />
        {errorSteps.includes(currentStep) && (
          <p className="mt-2 text-sm text-red-600">
            Please fix the errors before continuing
          </p>
        )}
      </div>

      {/* Desktop Step Progress */}
      <div className="hidden md:block">
        <StepProgress
          steps={steps}
          currentStep={currentStep}
          onStepClick={onStepClick}
          variant="circles"
          size="md"
          showLabels={true}
          allowNavigation={allowNavigation}
        />
      </div>
    </div>
  );
}

// Circular Progress Component
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 'md',
  strokeWidth,
  showLabel = false,
  label,
  variant = 'default',
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeValues = {
    sm: { width: 40, height: 40, stroke: strokeWidth || 3 },
    md: { width: 64, height: 64, stroke: strokeWidth || 4 },
    lg: { width: 96, height: 96, stroke: strokeWidth || 5 },
    xl: { width: 128, height: 128, stroke: strokeWidth || 6 },
  };

  const variantColors = {
    default: 'stroke-blue-600',
    success: 'stroke-green-600',
    warning: 'stroke-amber-500',
    error: 'stroke-red-600',
  };

  const { width, height, stroke } = sizeValues[size];
  const radius = (width - stroke * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      <svg width={width} height={height} className="transform -rotate-90">
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          className={clsx('transition-all duration-300 ease-out', variantColors[variant])}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      {(showLabel || label) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx(
            'font-semibold',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
            size === 'xl' && 'text-lg'
          )}>
            {label || `${Math.round(percentage)}%`}
          </span>
        </div>
      )}
    </div>
  );
}

// Memorial Creation Progress Summary
interface MemorialProgressSummaryProps {
  completedSections: string[];
  totalSections: number;
  className?: string;
}

export function MemorialProgressSummary({
  completedSections,
  totalSections,
  className,
}: MemorialProgressSummaryProps) {
  const percentage = (completedSections.length / totalSections) * 100;
  
  return (
    <div className={clsx('bg-white rounded-lg border border-gray-200 p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Memorial Completion</h3>
        <span className="text-2xl font-bold text-blue-600">
          {Math.round(percentage)}%
        </span>
      </div>
      
      <ProgressBar value={percentage} max={100} size="lg" />
      
      <p className="mt-3 text-xs text-gray-600">
        {completedSections.length} of {totalSections} sections complete
        {completedSections.length === totalSections && (
          <span className="ml-2 text-green-600 font-medium">Ready to publish!</span>
        )}
      </p>
    </div>
  );
}