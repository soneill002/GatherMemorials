import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      className,
      ...props
    },
    ref
  ) => {
    // Base styles that apply to all buttons
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    // Variant styles
    const variantStyles = {
      primary: 'bg-marian-500 text-white hover:bg-marian-600 active:bg-marian-700 focus:ring-marian-500',
      secondary: 'bg-liturgical-500 text-vatican-900 hover:bg-liturgical-600 active:bg-liturgical-700 focus:ring-liturgical-500',
      ghost: 'bg-transparent text-vatican-700 hover:bg-vatican-100 hover:text-vatican-900 focus:ring-vatican-400',
      danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500',
    };
    
    // Size styles
    const sizeStyles = {
      sm: 'text-sm rounded px-3 py-1.5 gap-1.5',
      md: 'text-base rounded-md px-4 py-2 gap-2',
      lg: 'text-lg rounded-md px-6 py-3 gap-2.5',
    };
    
    // Width styles
    const widthStyles = fullWidth ? 'w-full' : '';
    
    // Loading spinner component
    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );
    
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          widthStyles,
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

// Example usage components for reference (not exported)
const ButtonExamples = () => (
  <div className="space-y-4 p-4">
    {/* Primary buttons */}
    <div className="flex gap-4">
      <Button size="sm">Small Primary</Button>
      <Button size="md">Medium Primary</Button>
      <Button size="lg">Large Primary</Button>
    </div>
    
    {/* Secondary buttons */}
    <div className="flex gap-4">
      <Button variant="secondary" size="sm">Small Secondary</Button>
      <Button variant="secondary" size="md">Medium Secondary</Button>
      <Button variant="secondary" size="lg">Large Secondary</Button>
    </div>
    
    {/* Ghost buttons */}
    <div className="flex gap-4">
      <Button variant="ghost" size="sm">Small Ghost</Button>
      <Button variant="ghost" size="md">Medium Ghost</Button>
      <Button variant="ghost" size="lg">Large Ghost</Button>
    </div>
    
    {/* Danger buttons */}
    <div className="flex gap-4">
      <Button variant="danger" size="sm">Delete</Button>
      <Button variant="danger" size="md">Remove</Button>
      <Button variant="danger" size="lg">Cancel Subscription</Button>
    </div>
    
    {/* Loading states */}
    <div className="flex gap-4">
      <Button loading size="sm">Processing</Button>
      <Button loading variant="secondary">Saving</Button>
      <Button loading variant="ghost">Loading</Button>
    </div>
    
    {/* Disabled states */}
    <div className="flex gap-4">
      <Button disabled>Disabled Primary</Button>
      <Button disabled variant="secondary">Disabled Secondary</Button>
      <Button disabled variant="ghost">Disabled Ghost</Button>
    </div>
    
    {/* With icons (using placeholder symbols) */}
    <div className="flex gap-4">
      <Button leftIcon={<span>✝</span>}>Create Memorial</Button>
      <Button rightIcon={<span>→</span>} variant="secondary">Continue</Button>
      <Button leftIcon={<span>🙏</span>} rightIcon={<span>→</span>} variant="ghost">
        Add to Prayer List
      </Button>
    </div>
    
    {/* Full width */}
    <div className="max-w-sm">
      <Button fullWidth>Full Width Button</Button>
    </div>
  </div>
);