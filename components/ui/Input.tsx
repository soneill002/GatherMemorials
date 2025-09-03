import React, { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, useState } from 'react';
import { clsx } from 'clsx';

/**
 * Input component variants and types
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'ghost';
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'date' | 'time' | 'datetime-local' | 'search';
  showPasswordToggle?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  required?: boolean;
  fullWidth?: boolean;
}

/**
 * Textarea component props
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'ghost';
  containerClassName?: string;
  labelClassName?: string;
  required?: boolean;
  fullWidth?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
}

/**
 * Main Input component
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      iconPosition = 'left',
      size = 'medium',
      variant = 'default',
      type = 'text',
      showPasswordToggle = false,
      containerClassName,
      labelClassName,
      className,
      required,
      disabled,
      fullWidth = true,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine actual input type
    const inputType = type === 'password' && showPassword ? 'text' : type;
    const shouldShowToggle = type === 'password' && showPasswordToggle;

    // Size classes
    const sizeClasses = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-3 py-2 text-sm',
      large: 'px-4 py-3 text-base',
    };

    // Variant classes
    const variantClasses = {
      default: clsx(
        'border bg-white',
        error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
          : 'border-gray-300 focus:border-marian-blue focus:ring-marian-blue/20',
        disabled && 'bg-gray-50 cursor-not-allowed'
      ),
      filled: clsx(
        'border-0 bg-gray-100',
        error
          ? 'focus:bg-red-50 focus:ring-red-200'
          : 'focus:bg-white focus:ring-marian-blue/20',
        disabled && 'bg-gray-200 cursor-not-allowed'
      ),
      ghost: clsx(
        'border-0 bg-transparent',
        error
          ? 'focus:bg-red-50 focus:ring-red-200'
          : 'focus:bg-gray-50 focus:ring-marian-blue/20',
        disabled && 'cursor-not-allowed'
      ),
    };

    // Icon padding adjustments
    const iconPaddingClasses = {
      left: icon ? 'pl-10' : '',
      right: icon || shouldShowToggle ? 'pr-10' : '',
    };

    const inputClasses = clsx(
      'block rounded-md shadow-sm transition-all duration-200',
      'placeholder-gray-400',
      'focus:outline-none focus:ring-2',
      sizeClasses[size],
      variantClasses[variant],
      iconPosition === 'left' ? iconPaddingClasses.left : iconPaddingClasses.right,
      fullWidth && 'w-full',
      className
    );

    return (
      <div className={clsx(fullWidth && 'w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={clsx(
              'block text-sm font-medium text-gray-700 mb-1',
              labelClassName
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Left Icon */}
          {icon && iconPosition === 'left' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{icon}</span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled}
            required={required}
            className={inputClasses}
            {...props}
          />

          {/* Right Icon or Password Toggle */}
          {(icon && iconPosition === 'right') || shouldShowToggle ? (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {shouldShowToggle ? (
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" 
                      />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                      />
                    </svg>
                  )}
                </button>
              ) : (
                <span className="pointer-events-none">{icon}</span>
              )}
            </div>
          ) : null}
        </div>

        {/* Hint Text */}
        {hint && !error && (
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        )}

        {/* Error Text */}
        {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea component
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      size = 'medium',
      variant = 'default',
      containerClassName,
      labelClassName,
      className,
      required,
      disabled,
      fullWidth = true,
      showCharCount = false,
      maxLength,
      value,
      onChange,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const [charCount, setCharCount] = useState(
      typeof value === 'string' ? value.length : 0
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      if (onChange) {
        onChange(e);
      }
    };

    // Size classes
    const sizeClasses = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-3 py-2 text-sm',
      large: 'px-4 py-3 text-base',
    };

    // Variant classes
    const variantClasses = {
      default: clsx(
        'border bg-white',
        error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
          : 'border-gray-300 focus:border-marian-blue focus:ring-marian-blue/20',
        disabled && 'bg-gray-50 cursor-not-allowed'
      ),
      filled: clsx(
        'border-0 bg-gray-100',
        error
          ? 'focus:bg-red-50 focus:ring-red-200'
          : 'focus:bg-white focus:ring-marian-blue/20',
        disabled && 'bg-gray-200 cursor-not-allowed'
      ),
      ghost: clsx(
        'border-0 bg-transparent',
        error
          ? 'focus:bg-red-50 focus:ring-red-200'
          : 'focus:bg-gray-50 focus:ring-marian-blue/20',
        disabled && 'cursor-not-allowed'
      ),
    };

    const textareaClasses = clsx(
      'block rounded-md shadow-sm transition-all duration-200',
      'placeholder-gray-400',
      'focus:outline-none focus:ring-2',
      'resize-y min-h-[80px]',
      sizeClasses[size],
      variantClasses[variant],
      fullWidth && 'w-full',
      className
    );

    return (
      <div className={clsx(fullWidth && 'w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className={clsx(
              'block text-sm font-medium text-gray-700 mb-1',
              labelClassName
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          className={textareaClasses}
          {...props}
        />

        {/* Footer with hint/error and char count */}
        <div className="mt-1 flex justify-between">
          <div className="flex-1">
            {hint && !error && (
              <p className="text-xs text-gray-500">{hint}</p>
            )}
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
          
          {showCharCount && maxLength && (
            <span
              className={clsx(
                'text-xs ml-2',
                charCount > maxLength * 0.9 ? 'text-amber-600' : 'text-gray-500'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * Search Input component with built-in search icon
 */
export const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'icon' | 'iconPosition'>>(
  ({ placeholder = 'Search...', ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        placeholder={placeholder}
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        }
        iconPosition="left"
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

/**
 * Select component that matches Input styling
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'ghost';
  containerClassName?: string;
  labelClassName?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      size = 'medium',
      variant = 'default',
      containerClassName,
      labelClassName,
      className,
      required,
      disabled,
      fullWidth = true,
      options,
      placeholder = 'Select an option',
      id,
      value,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    // Size classes
    const sizeClasses = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-3 py-2 text-sm',
      large: 'px-4 py-3 text-base',
    };

    // Variant classes
    const variantClasses = {
      default: clsx(
        'border bg-white',
        error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
          : 'border-gray-300 focus:border-marian-blue focus:ring-marian-blue/20',
        disabled && 'bg-gray-50 cursor-not-allowed'
      ),
      filled: clsx(
        'border-0 bg-gray-100',
        error
          ? 'focus:bg-red-50 focus:ring-red-200'
          : 'focus:bg-white focus:ring-marian-blue/20',
        disabled && 'bg-gray-200 cursor-not-allowed'
      ),
      ghost: clsx(
        'border-0 bg-transparent',
        error
          ? 'focus:bg-red-50 focus:ring-red-200'
          : 'focus:bg-gray-50 focus:ring-marian-blue/20',
        disabled && 'cursor-not-allowed'
      ),
    };

    const selectClasses = clsx(
      'block rounded-md shadow-sm transition-all duration-200',
      'focus:outline-none focus:ring-2',
      'appearance-none cursor-pointer',
      'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%27%20viewBox%3D%270%200%2020%2020%27%3E%3Cpath%20stroke%3D%27%236b7280%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%271.5%27%20d%3D%27M6%208l4%204%204-4%27%2F%3E%3C%2Fsvg%3E")] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10',
      sizeClasses[size],
      variantClasses[variant],
      fullWidth && 'w-full',
      !value && 'text-gray-400',
      className
    );

    return (
      <div className={clsx(fullWidth && 'w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className={clsx(
              'block text-sm font-medium text-gray-700 mb-1',
              labelClassName
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          value={value}
          className={selectClasses}
          {...props}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Hint Text */}
        {hint && !error && (
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        )}

        {/* Error Text */}
        {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';