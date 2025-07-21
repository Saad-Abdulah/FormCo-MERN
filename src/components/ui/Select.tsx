import { forwardRef } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      value,
      onChange,
      required,
      placeholder,
      className = '',
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            value={value}
            onChange={handleChange}
            className={`
              block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset 
              ${error ? 'ring-red-300' : 'ring-gray-300'} 
              focus:outline-none focus:ring-2 focus:ring-inset 
              ${error ? 'focus:ring-red-500' : 'focus:ring-blue-600'}
              sm:text-sm sm:leading-6
              ${error ? 'text-red-900' : ''}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ExclamationCircleIcon
                className="h-5 w-5 text-red-500"
                aria-hidden="true"
              />
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600" id={`${props.id}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select'; 