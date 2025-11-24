import { useState } from "react";
import { Filter } from "lucide-react";

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
  isAdmin,
}: FilterDropdownProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<Record<string, string[]>>(() => {
    return (
      initialFilters ??
      Object.fromEntries(
        filterConfig.map((f) => [f.id, f.values?.length ? [...f.values] : []])
      )
    );
  });

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
  //   const searchBranchName = async (
  //     query: string
  //   ): Promise<SearchBranchDto[]> => {
  //     const res = await fetch(
  //       `/api/branches/search?search=${encodeURIComponent(query)}`
  //     );
  //     const json = await res.json();
  //     return json.data || [];
  //   };
  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setShowFilters((prev) => !prev)}
        className="flex items-center gap-1 px-3 py-2 rounded-md border-gray-300 bg-white shadow-sm border hover:bg-gray-50"
      >
        <Filter className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-700 font-semibold">Filters</span>
        <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-0.5 ml-1">
          {Object.values(filters).flat().filter(Boolean).length}
        </span>
      </button>

      {showFilters && (
        <div className="absolute z-50 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-5">
          {filterConfig.map((filter) => (
            <div className="mb-4" key={filter.id}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {filter.label}
              </label>

              <div className="flex flex-wrap gap-2 text-xs">
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

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowFilters(false)}
              className="text-sm px-4 py-1.5 rounded-md border text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleClear}
              className="text-sm px-4 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Clear
            </button>

            <button
              onClick={handleSave}
              className="text-sm px-4 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
