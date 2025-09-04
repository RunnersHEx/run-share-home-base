import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface CustomMultiSelectProps {
  placeholder?: string;
  value?: string[];
  onValueChange?: (value: string[]) => void;
  options: SelectOption[];
  className?: string;
  disabled?: boolean;
}

export const CustomMultiSelect = ({
  placeholder = "Select options",
  value = [],
  onValueChange,
  options,
  className,
  disabled = false
}: CustomMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Style scrollbar to be thin and modern
  useEffect(() => {
    // Add CSS for modern thin scrollbar if not already added
    if (!document.querySelector('#modern-scrollbar-style')) {
      const style = document.createElement('style');
      style.id = 'modern-scrollbar-style';
      style.textContent = `
        .modern-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .modern-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .modern-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Handle option selection
  const handleOptionSelect = (option: SelectOption) => {
    const newValue = value.includes(option.value)
      ? value.filter(v => v !== option.value)
      : [...value, option.value];
    
    onValueChange?.(newValue);
  };

  // Remove specific option
  const handleRemoveOption = (optionValue: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newValue = value.filter(v => v !== optionValue);
    onValueChange?.(newValue);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          handleOptionSelect(options[focusedIndex]);
        } else {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setFocusedIndex(0);
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => Math.min(prev + 1, options.length - 1));
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => Math.max(prev - 1, 0));
        }
        break;
    }
  };

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({
        block: 'nearest'
      });
    }
  }, [focusedIndex, isOpen]);

  // Get display text for selected values
  const getDisplayText = () => {
    if (value.length === 0) {
      return placeholder;
    }
    if (value.length === 1) {
      const option = options.find(opt => opt.value === value[0]);
      return option ? option.label : value[0];
    }
    return `${value.length} provincia(s) seleccionada(s)`;
  };

  return (
    <div ref={selectRef} className="relative">
      {/* Trigger */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        <span className={cn(
          "block truncate",
          value.length === 0 && "text-gray-500"
        )}>
          {getDisplayText()}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-400 transition-transform duration-200",
          isOpen && "transform rotate-180"
        )} />
      </div>

      {/* Selected items tags (only show if multiple selected) */}
      {value.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map(selectedValue => {
            const option = options.find(opt => opt.value === selectedValue);
            return (
              <span
                key={selectedValue}
                className="inline-flex items-center px-3 py-1 bg-[#FF6F0F] text-white rounded-full text-sm font-medium"
              >
                {option ? option.label : selectedValue}
                <button
                  type="button"
                  onClick={(e) => handleRemoveOption(selectedValue, e)}
                  className="ml-2 hover:text-orange-200 focus:outline-none focus:text-orange-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown Content */}
      {isOpen && (
        <div
          ref={contentRef}
          className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-md overflow-hidden"
          role="listbox"
          style={{
            zIndex: 99999,
            position: 'absolute',
            top: '100%'
          }}
          onMouseLeave={() => setFocusedIndex(-1)}
        >
          <div 
            ref={scrollContainerRef}
            className="max-h-60 overflow-y-auto py-1 modern-scrollbar"
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                ref={el => optionRefs.current[index] = el}
                role="option"
                aria-selected={value.includes(option.value)}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center justify-center py-2 px-4 text-sm transition-colors duration-150"
                )}
                style={{
                  backgroundColor: focusedIndex === index ? '#FF6F0F' : value.includes(option.value) ? '#fff7ed' : 'transparent',
                  color: focusedIndex === index ? 'white' : value.includes(option.value) ? '#ea580c' : '#111827'
                }}
                onMouseEnter={() => setFocusedIndex(index)}
                onClick={() => handleOptionSelect(option)}
              >
                {/* Check icon for selected option */}
                {value.includes(option.value) && (
                  <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className={cn(
                      "h-4 w-4",
                      focusedIndex === index ? "text-white" : "text-orange-600"
                    )} />
                  </span>
                )}
                {/* Centered text container */}
                <div className="flex-1 text-center">
                  <span className="block">{option.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
