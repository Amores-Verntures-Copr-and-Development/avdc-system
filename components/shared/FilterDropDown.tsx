import { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { useSearchParams } from "next/navigation"; // or useRouter for Pages Router
import Button from "./Button";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
  values?: string[]; // default selected internal values
}

interface FilterDropdownProps {
  filterConfig: FilterConfig[];
  initialFilters?: Record<string, string[]>; // stores internal values (not labels)
  onSave: (filters: Record<string, string[]>) => void;
  isAdmin?: boolean;
}

const FilterDropdown = ({
  filterConfig,
  initialFilters,
  onSave,
}: FilterDropdownProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const searchParams = useSearchParams(); // Get current URL parameters

  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<Record<string, string[]>>(() => {
    // If initialFilters provided, use them
    if (initialFilters) return initialFilters;

    // Otherwise, get filters from URL parameters
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

  // Sync filters when URL parameters change (on refresh)
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

  const selectOption = (id: string, value: string) => {
    setFilters((prev) => ({ ...prev, [id]: [value] }));
  };

  const handleClear = () => {
    const cleared = {
      ...Object.fromEntries(filterConfig.map((f) => [f.id, []])),
      branch: [], // ✅ make sure branch is cleared too
    };
    setFilters(cleared);
    onSave(cleared);
    setShowFilters(false);
  };

  const handleSave = () => {
    onSave(filters);
    setShowFilters(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setShowFilters((prev) => !prev)}
        className="flex items-center gap-1 px-1.5 py-1 rounded-md border-gray-300 bg-white shadow-sm border hover:bg-gray-50"
      >
        <Filter className="w-2 h-2 2xl:w-4 2xl:h-4 text-gray-600" />
        <span className="text-[9px] lg:text-xs 2xl:text-sm text-gray-700 font-semibold">
          Filters
        </span>
        <span className="text-[9px] 2xl:text-xs bg-blue-600 text-white rounded-full px-1 py-.5 2xl:px-2 2xl:py-0.5 2xl:ml-1">
          {Object.values(filters).flat().filter(Boolean).length}
        </span>
      </button>

      {showFilters && (
        <div className="absolute z-50 mt-2 w-72 sm:w-80 md:w-96 max-h-[50vh] bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col">
          {/* Scrollable content */}
          <div className="p-5 overflow-y-auto flex-1">
            {filterConfig.map((filter) => (
              <div className="mb-4" key={filter.id}>
                <label className="block text-[9px] xl:text-xs font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>

                <div className="flex flex-wrap gap-2 text-[9px] xl:text-xs">
                  {filter.options
                    .filter((opt) => opt.value !== "")
                    .map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => selectOption(filter.id, opt.value)}
                        className={`px-1 py-1 rounded-md border ${
                          filters[filter.id]?.includes(opt.value)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Fixed footer */}
          <div className="flex justify-end gap-2 p-3 border-t border-gray-200 bg-white">
            <Button
              label="Cancel"
              size="sm"
              color="secondary"
              onClick={() => setShowFilters(false)}
            />
            <Button
              label="Clear"
              size="sm"
              color="danger"
              onClick={handleClear}
            />
            <Button
              label="Save"
              size="sm"
              color="primary"
              onClick={handleSave}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
