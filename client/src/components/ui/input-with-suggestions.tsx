"use client";

import * as React from "react";
import * as Portal from "@radix-ui/react-portal";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface SuggestionOption {
  value: string;
  label?: string;
}

interface InputWithSuggestionsProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suggestions: SuggestionOption[];
  onValueChange?: (value: string) => void;
}

export const InputWithSuggestions = React.forwardRef<HTMLInputElement, InputWithSuggestionsProps>(
  ({ suggestions, onValueChange, className, value: controlledValue, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState("");
    const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Use controlled value if provided, otherwise use internal state
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const filteredSuggestions = suggestions.filter(suggestion =>
      suggestion.value.toLowerCase().includes(String(value).toLowerCase())
    );

    // Update dropdown position when open changes or on scroll/resize
    React.useEffect(() => {
      const updatePosition = () => {
        if (wrapperRef.current && open) {
          const rect = wrapperRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
          });
        }
      };

      updatePosition();

      if (open) {
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        return () => {
          window.removeEventListener("scroll", updatePosition, true);
          window.removeEventListener("resize", updatePosition);
        };
      }
    }, [open]);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(event.target as Node) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
      props.onChange?.(e);
      setOpen(true);
    };

    const handleSuggestionClick = (suggestion: string) => {
      if (controlledValue === undefined) {
        setInternalValue(suggestion);
      }
      onValueChange?.(suggestion);
      if (props.onChange) {
        const syntheticEvent = {
          target: { value: suggestion },
        } as React.ChangeEvent<HTMLInputElement>;
        props.onChange(syntheticEvent);
      }
      setOpen(false);
    };

    return (
      <div ref={wrapperRef} className="relative">
        <Input
          ref={ref}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          className={className}
          {...props}
        />
        {open && filteredSuggestions.length > 0 && (
          <Portal.Root>
            <div
              ref={dropdownRef}
              style={{
                position: "absolute",
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
              }}
              className="z-50 max-h-60 overflow-auto rounded-md border border-neutral-150 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              {filteredSuggestions.map(suggestion => (
                <div
                  key={suggestion.value}
                  className="relative cursor-pointer px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={() => handleSuggestionClick(suggestion.value)}
                >
                  {suggestion.label || suggestion.value}
                </div>
              ))}
            </div>
          </Portal.Root>
        )}
      </div>
    );
  }
);

InputWithSuggestions.displayName = "InputWithSuggestions";
