'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  fullWidth = true,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn('relative', fullWidth && 'w-full')}>
      {label && (
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          {label}
        </label>
      )}
      
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 text-sm text-secondary-900',
            'bg-white border rounded-xl transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'disabled:bg-secondary-50 disabled:cursor-not-allowed',
            error
              ? 'border-error-500 focus:border-error-500'
              : 'border-secondary-300 focus:border-primary-500',
            isOpen && 'border-primary-500'
          )}
        >
          <span className={cn('flex items-center', !selectedOption && 'text-secondary-400')}>
            {selectedOption?.icon && <span className="mr-2">{selectedOption.icon}</span>}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-secondary-400 transition-transform',
              isOpen && 'transform rotate-180'
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-secondary-200 rounded-xl shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange?.(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center px-4 py-3 text-sm text-left hover:bg-secondary-50 transition-colors',
                  value === option.value && 'bg-primary-50 text-primary-700'
                )}
              >
                {option.icon && <span className="mr-2">{option.icon}</span>}
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-error-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default Dropdown;

