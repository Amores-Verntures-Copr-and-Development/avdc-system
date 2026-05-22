import { useState, useEffect, useRef } from "react";

import { Filter, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";

import Button from "./Button";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
  values?: string[];
}

interface FilterDropdownProps {
  filterConfig: FilterConfig[];
  initialFilters?: Record<string, string[]>;
  onSave: (filters: Record<string, string[]>) => void;
  isAdmin?: boolean;
}

const FilterDropdown = ({
  filterConfig,
  initialFilters,
  onSave,
}: FilterDropdownProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Record<string, string[]>>(() => {
    if (initialFilters) return initialFilters;

    const urlFilters: Record<string, string[]> = {};

    filterConfig.forEach((filter) => {
      const paramValue = searchParams.get(filter.id);

      if (paramValue) {
        urlFilters[filter.id] = [paramValue];
      } else {
        urlFilters[filter.id] = filter.values?.length ? [...filter.values] : [];
      }
    });

    return urlFilters;
  });

  useEffect(() => {
    const urlFilters: Record<string, string[]> = {};

    filterConfig.forEach((filter) => {
      const paramValue = searchParams.get(filter.id);

      if (paramValue) {
        urlFilters[filter.id] = [paramValue];
      } else {
        urlFilters[filter.id] = [];
      }
    });

    setFilters(urlFilters);
  }, [searchParams, filterConfig]);
  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownWidth = Math.min(340, window.innerWidth - 24);

    let left = rect.left;

    if (left + dropdownWidth > window.innerWidth - 12) {
      left = window.innerWidth - dropdownWidth - 12;
    }

    if (left < 12) {
      left = 12;
    }

    setPosition({
      top: rect.bottom + 8,
      left,
      width: dropdownWidth,
    });
  };

  const toggleDropdown = () => {
    updatePosition();
    setShowFilters((prev) => !prev);
  };

  useEffect(() => {
    if (!showFilters) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }

      setShowFilters(false);
    };

    const handleUpdatePosition = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handleClickOutside);

    window.addEventListener("resize", handleUpdatePosition);

    window.addEventListener("scroll", handleUpdatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);

      window.removeEventListener("resize", handleUpdatePosition);

      window.removeEventListener("scroll", handleUpdatePosition, true);
    };
  }, [showFilters]);

  const selectOption = (id: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [id]: [value],
    }));
  };

  const handleClear = () => {
    const cleared = Object.fromEntries(filterConfig.map((f) => [f.id, []]));

    setFilters(cleared);
    onSave(cleared);
    setShowFilters(false);
  };

  const handleSave = () => {
    onSave(filters);
    setShowFilters(false);
  };

  const totalSelected = Object.values(filters).flat().filter(Boolean).length;

  return (
    <>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        className={`
          flex items-center gap-1 2xl:gap-2
          rounded-xl border border-gray-200
          bg-white p-1 2xl:px-2.5 py-1 2xl:py-1.5
          text-[8px] 2xl:text-xs font-medium text-gray-700
          transition-all
          hover:border-gray-300
          hover:bg-gray-50
          
          ${showFilters ? "border-gray-300 bg-gray-50" : ""}
        `}
      >
        <Filter className="h-3 2xl:h-4 w2xl:-4 text-gray-400" />

        <span>Filters</span>

        {totalSelected > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-900 px-1.5 text-[10px] font-semibold text-white">
            {totalSelected}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showFilters &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
              zIndex: 9999,
            }}
            className="
              overflow-hidden rounded-2xl
              border border-gray-100
              bg-white/95
              shadow-2xl
              backdrop-blur-sm
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <h3 className="text-xs 2xl:text-sm font-semibold text-gray-900">
                  Filters
                </h3>

                <p className="mt-0.5 text-[10px] 2xl:text-xs text-gray-400">
                  Refine your results
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="no-scrollbar max-h-[420px] overflow-y-auto px-4 py-4">
              <div className="space-y-5">
                {filterConfig.map((filter) => (
                  <div key={filter.id}>
                    <label className="mb-2 block text-xs font-medium text-gray-500">
                      {filter.label}
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {filter.options
                        .filter((opt) => opt.value !== "")
                        .map((opt) => {
                          const isSelected = filters[filter.id]?.includes(
                            opt.value,
                          );

                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => selectOption(filter.id, opt.value)}
                              className={`
                                rounded-xl border px-3 py-2
                                text-xs font-medium transition-all
                                
                                ${
                                  isSelected
                                    ? `
                                      border-gray-900
                                      bg-gray-900
                                      text-white
                                    `
                                    : `
                                      border-gray-200
                                      bg-white
                                      text-gray-600
                                      hover:border-gray-300
                                      hover:bg-gray-50
                                    `
                                }
                              `}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3">
              <button
                type="button"
                onClick={handleClear}
                className="
                  text-xs font-medium
                  text-gray-400 transition
                  hover:text-gray-600
                "
              >
                Clear all
              </button>

              <div className="flex items-center gap-2">
                <Button
                  label="Cancel"
                  size="sm"
                  color="secondary"
                  onClick={() => setShowFilters(false)}
                />

                <Button label="Apply" size="sm" onClick={handleSave} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default FilterDropdown;
