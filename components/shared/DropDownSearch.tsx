import { useDebounce } from "@/hooks/useDebounce";
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import toast from "react-hot-toast";

type DropdownSearchProps<T> = {
  searchFn: (query: string) => Promise<T[]>;
  onSelect: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
  displayValue: (item: T) => string;
  canSelect?: (item: T) => boolean;
  selectedValue?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  clearSignal?: number;
  sizes?: "xs" | "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onQueryChange?: (query: string) => void;
};

export function DropdownSearch<T>({
  searchFn,
  onSelect,
  canSelect,
  onQueryChange,
  renderItem,
  displayValue,
  selectedValue = "",
  placeholder = "Search...",
  label,
  required = false,
  error,
  clearSignal,
  sizes = "md",
  disabled = false,
  loading = false,
}: DropdownSearchProps<T>) {
  const [query, setQuery] = useState(selectedValue);
  const debouncedQuery = useDebounce(query, 300);
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSelected, setHasSelected] = useState(!!selectedValue);
  const [isLoading, setIsLoading] = useState(false);
  const portalRef = useRef<HTMLUListElement>(null);
  const clearedRef = useRef(false);
  const handleClickOutside = (e: MouseEvent) => {
    if (
      !dropdownRef.current?.contains(e.target as Node) &&
      !portalRef.current?.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  };
  // Sizes consistent with DropdownSelect
  const sizeStyles = {
    xs: "h-8 xl:h-8 text-xs px-2",
    sm: "h-8 xl:h-8 text-xs xl:text-sm px-2",
    md: "h-8 xl:h-10 text-xs xl:text-base px-3",
    lg: "h-12 text-md md:text-lg px-4",
  }[sizes];
  const labelClass = {
    xs: "text-[10px] xl:text-xs",
    sm: "text-[10px] lg:text-md xl:text-sm",
    md: "text-sm xl:text-md md:text-base",
    lg: "text-md md:text-lg",
  }[sizes];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setHasSelected(false);
    onQueryChange?.(newQuery);
  };

  useEffect(() => {
    setQuery(selectedValue);
    setHasSelected(!!selectedValue);
  }, [selectedValue]);

  useEffect(() => {
    if (clearSignal !== undefined) {
      setQuery("");
      setHasSelected(false);
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [clearSignal]);

  useEffect(() => {
    if (!query) return;

    if (clearedRef.current) {
      clearedRef.current = false;
      return;
    }

    if (!debouncedQuery.trim() || hasSelected) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    searchFn(debouncedQuery)
      .then((res) => {
        setSuggestions(res);
        setIsOpen(true);
      })
      .catch((err) => toast.error("Search error: " + err))
      .finally(() => setIsLoading(false));
  }, [debouncedQuery, searchFn, hasSelected]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !dropdownRef.current?.contains(e.target as Node) &&
        !portalRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: T) => {
    if (canSelect && !canSelect(item)) {
      return;
    }

    const display = displayValue(item);
    setQuery(display);
    setHasSelected(true);
    setIsOpen(false);
    onSelect(item);
  };

  const handleClear = () => {
    clearedRef.current = true;
    setQuery("");
    setHasSelected(false);
    setSuggestions([]);
    setIsOpen(false);
    onSelect(undefined as unknown as T);
    onQueryChange?.("");
  };

  return (
    <div ref={dropdownRef} className="flex flex-1 flex-col gap-1 w-full">
      {label && (
        <label className={`${labelClass} font-semibold text-gray-700`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative w-full">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || loading}
          className={`w-full border rounded-md ${sizeStyles} ${
            error ? "border-red-500" : "border-gray-300"
          } disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-blue-400`}
        />

        {hasSelected && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
          >
            ✕
          </button>
        )}

        {isLoading && !hasSelected && (
          <div className="absolute right-3 top-2 text-gray-400 text-sm">
            Loading...
          </div>
        )}

        {isOpen &&
          suggestions.length > 0 &&
          ReactDOM.createPortal(
            <ul
              ref={portalRef}
              className="absolute z-50 w-60 bg-white border border-gray-300 rounded-md shadow-md max-h-48 overflow-y-auto"
              style={{
                top: dropdownRef.current
                  ? dropdownRef.current.getBoundingClientRect().bottom +
                    window.scrollY +
                    4
                  : 0,

                left: dropdownRef.current
                  ? dropdownRef.current.getBoundingClientRect().left +
                    window.scrollX
                  : 0,

                width: dropdownRef.current
                  ? dropdownRef.current.getBoundingClientRect().width
                  : undefined,
              }}
            >
              {suggestions.map((item, index) => (
                <li
                  key={index}
                  onClick={() => handleSelect(item)}
                  className="hover:bg-blue-100 cursor-pointer px-3 py-2 text-sm"
                >
                  {renderItem(item)}
                </li>
              ))}
            </ul>,
            document.body,
          )}
      </div>

      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
}
