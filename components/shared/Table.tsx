import {
  Loader2,
  ChevronDown,
  Menu,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import React, {
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
} from "react";
import Pagination from "./Pagintation";
import SearchBar from "./SearchBar";
import FilterDropdown from "./FilterDropDown";
import Input from "./Input";
import DateRange from "./DateRange";
import { createPortal } from "react-dom";
import Button, { ButtonProps } from "./Button";
import IconButton from "./IconButton";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
export interface SelectOption {
  label: string;
  value: any;
  color?: string;
  bg?: string;
  disabled?: boolean;
}
interface RenderTopActionButtons {
  props: ButtonProps;
  isShow?: boolean;
}
type LocalFilter<T> = {
  keys?: (keyof T)[];
  values?: Partial<T>;
};

export interface Column<T = any> {
  name: string;
  key: string;
  selector?: (row: T, index: number) => React.ReactNode;
  editable?: boolean | ((row: T, rowIndex: number) => boolean);
  inputType?: "text" | "number" | "date" | "email" | "tel" | "url" | "select";
  options?: SelectOption[] | ((row: T) => SelectOption[]);
  value?: (row: T) => any;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  validate?: (value: any, row: T) => boolean;
  format?: (value: any) => string;
  compute?: (row: T) => any;
  dependsOn?: (keyof T | string)[];
  selectOptionVariant?: SelectOptionVariant;
  bgCol?: string;
  bgHeader?: string;
  sortable?: boolean;
}

type SelectOptionVariant = "native" | "custom";

interface FilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
  values?: string[];
}

interface FilterOption {
  label: string;
  value: string;
}

interface TableProps<T> {
  filterConfig?: FilterConfig[];
  initialFilters?: Record<string, string[]>;
  onSave?: (filters: Record<string, string[]>) => void;
  showFilter?: boolean;
  showPagination?: boolean;
  title?: string;
  subtitle?: string;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  showActions?: boolean;
  renderActions?: (row: T, rowIndex: number) => React.ReactNode;
  renderTopActions?: React.ReactNode;
  Datalabel?: string;
  textSize?: "xs" | "sm" | "base" | "lg" | "xl";
  rowSize?: string;
  totalCount?: number;
  showCheckBox?: boolean;
  onClearSelection?: () => void;
  onSelectionChange?: (selected: T[]) => void;
  updateData?: (data: T[]) => void;
  onRowSelection?: (data: T) => void;
  onCellChange?: (
    rowIndex: number,
    columnKey: string,
    value: any,
    row: T,
  ) => void;
  addContentLeftTitle?: React.ReactNode;
  searchUrl?: string;
  maxHeight?: string;
  debounceTime?: number;
  editMode?: "inline" | "row";
  isRounded?: boolean;
  uniqueIdKey?: keyof T;
  onSelectedData?: T[];
  defaultLimit?: number;
  fetchMode?: boolean;
  localSearch?: boolean;
  localFilter?: LocalFilter<T>;
  showDateRange?: boolean;
  onDateRangeChange?: (range: { from: string; to: string }) => void;
  renderTopActionButtons?: RenderTopActionButtons[];
}

export interface TableHandle {
  clearSelection: () => void;
}

const TableInner = <T extends Record<string, any>>(
  {
    localFilter,
    onDateRangeChange,
    showFilter,
    showDateRange = false,
    columns,
    data,
    loading = false,
    showActions = false,
    renderActions,
    renderTopActions,
    renderTopActionButtons,
    Datalabel,
    textSize = "xs",
    totalCount = 0,
    showCheckBox,
    onSelectionChange,
    onRowSelection,
    showPagination,
    searchUrl,
    updateData,
    onCellChange,
    maxHeight = "400px",
    debounceTime = 300,
    editMode = "inline",
    isRounded = true,
    onClearSelection,
    title,
    subtitle,
    filterConfig,
    initialFilters,
    onSave,
    uniqueIdKey,
    onSelectedData,
    defaultLimit = 100,
    localSearch,
    addContentLeftTitle,
  }: TableProps<T>,
  ref?: React.Ref<TableHandle>,
) => {
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [editableData, setEditableData] = useState<T[]>(data);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sortKey = searchParams.get("sort");
  const sortOrder = searchParams.get("order");
  const handleSort = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());

    const currentSort = params.get("sort");
    const currentOrder = params.get("order");

    if (currentSort !== key) {
      params.set("sort", key);
      params.set("order", "asc");
    } else if (currentOrder === "asc") {
      params.set("order", "desc");
    } else {
      params.delete("sort");
      params.delete("order");
    }

    router.push(`${pathname}?${params.toString()}`);
  };
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setShowMobileActions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    setEditableData(data ?? []);
  }, [data]);
  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownWidth = 210;
    const padding = 8;

    let left = rect.right - dropdownWidth;

    if (left < padding) left = padding;
    if (left + dropdownWidth > window.innerWidth - padding) {
      left = window.innerWidth - dropdownWidth - padding;
    }

    setPosition({
      top: rect.bottom + 6,
      left,
      width: dropdownWidth,
    });
  };
  const filteredData = React.useMemo(() => {
    let rows = [...editableData];

    if (
      localFilter?.keys &&
      localFilter.values &&
      Object.values(localFilter.values).some(
        (v) => v !== "" && v !== null && v !== undefined,
      )
    ) {
      rows = rows.filter((row) =>
        localFilter.keys!.every((key) => {
          const filterValue = localFilter.values![key];

          if (
            filterValue === "" ||
            filterValue === null ||
            filterValue === undefined
          ) {
            return true;
          }

          return row[key] === filterValue;
        }),
      );
    }

    if (localSearchQuery) {
      const query = localSearchQuery.toLowerCase();

      rows = rows.filter((row) =>
        columns.some((col) =>
          String(row[col.key] ?? "")
            .toLowerCase()
            .includes(query),
        ),
      );
    }

    return rows;
  }, [editableData, columns, localSearchQuery, localFilter]);

  const clearSelection = () => {
    setSelectedRows([]);
    onClearSelection?.();
    onSelectionChange?.([]);
  };

  useImperativeHandle(ref, () => ({
    clearSelection,
  }));

  const getUniqueId = React.useCallback(
    (row: T): string | number => {
      const key = uniqueIdKey || ("id" as keyof T);
      return row[key];
    },
    [uniqueIdKey],
  );

  const getRowById = (row: T) =>
    editableData.find((r) => getUniqueId(r) === getUniqueId(row));

  const toggleRow = (row: T) => {
    setSelectedRows((prev) => {
      const uniqueId = getUniqueId(row);
      const isSelected = prev.some((item) => getUniqueId(item) === uniqueId);

      return isSelected
        ? prev.filter((item) => getUniqueId(item) !== uniqueId)
        : [...prev, row];
    });
  };

  const toggleAll = () => {
    setSelectedRows((prev) =>
      prev.length === filteredData.length ? [] : filteredData,
    );
  };

  useEffect(() => {
    if (onSelectedData && editableData.length > 0) {
      const selectedRows = editableData.filter((row: T) =>
        (onSelectedData as any[]).some(
          (selectedItem) =>
            selectedItem.storeId === row[uniqueIdKey as keyof T],
        ),
      );

      setSelectedRows(selectedRows);
    }
  }, [onSelectedData, editableData, uniqueIdKey]);

  useEffect(() => {
    onSelectionChange?.(selectedRows);
  }, [selectedRows, onSelectionChange]);

  const isRowSelected = (row: T) =>
    selectedRows.some((item) => getUniqueId(item) === getUniqueId(row));

  const handleInputChange = (row: T, columnKey: string, value: any) => {
    const rowId = getUniqueId(row);

    const newData = editableData.map((r) =>
      getUniqueId(r) === rowId ? { ...r, [columnKey]: value } : r,
    );

    columns.forEach((col) => {
      if (!col.compute) return;

      newData.forEach((r, idx) => {
        if (!col.dependsOn || col.dependsOn.includes(columnKey)) {
          newData[idx] = {
            ...newData[idx],
            [col.key]: col.compute!(r),
          };
        }
      });
    });

    setEditableData(newData);

    const rowIndex = editableData.findIndex((r) => getUniqueId(r) === rowId);
    const updatedRow = newData.find((r) => getUniqueId(r) === rowId)!;

    onCellChange?.(rowIndex, columnKey, value, updatedRow);

    const errorKey = `${rowIndex}-${columnKey}`;

    setErrors((prev) => {
      const newErrors = new Map(prev);
      const column = columns.find((c) => c.key === columnKey);

      if (column?.validate && !column.validate(value, updatedRow)) {
        newErrors.set(errorKey, "Invalid value");
      } else {
        newErrors.delete(errorKey);
      }

      return newErrors;
    });

    if (updateData) {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        updateData(newData);
      }, debounceTime);
    }
  };

  const isFieldEditable = (
    column: Column<T>,
    row: T,
    rowIndex: number,
  ): boolean => {
    if (typeof column.editable === "function") {
      return column.editable(row, rowIndex);
    }

    return column.editable === true;
  };

  const renderCell = (column: Column<T>, row: T, rowIndex: number) => {
    const editable = isFieldEditable(column, row, rowIndex);
    const errorKey = `${rowIndex}-${column.key}`;
    const hasError = errors.has(errorKey);
    const cellBg = column.bgCol ?? "";
    const realRow = getRowById(row);

    if (editable && editMode === "inline") {
      if (column.inputType === "select") {
        const opts =
          typeof column.options === "function"
            ? column.options(row)
            : column.options || [];

        const rawValue = column.value
          ? column.value(row)
          : realRow?.[column.key];

        const selectedValue =
          rawValue === null || rawValue === undefined ? "" : String(rawValue);

        if (column.selectOptionVariant === "custom") {
          return (
            <div className={cellBg}>
              <CustomSelect
                value={selectedValue}
                options={opts}
                onChange={(v) => handleInputChange(row, column.key, v)}
              />
            </div>
          );
        }

        return (
          <div className={cellBg}>
            <select
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 outline-none transition focus:border-gray-300 focus:bg-white"
              value={selectedValue}
              onChange={(e) =>
                handleInputChange(realRow ?? row, column.key, e.target.value)
              }
            >
              {opts.map((opt, idx) => (
                <option key={idx} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );
      }

      return (
        <div className={`${cellBg} flex flex-col`}>
          <input
            onClick={(e) => e.stopPropagation()}
            type={column.inputType ?? "text"}
            name={column.name}
            onWheel={
              column.inputType === "number"
                ? (e) => e.currentTarget.blur()
                : undefined
            }
            value={
              column.value
                ? column.value(row)
                : column.inputType === "number"
                  ? realRow?.[column.key] === 0 || realRow?.[column.key] === 0.0
                    ? ""
                    : (realRow?.[column.key] ?? "")
                  : realRow?.[column.key] || ""
            }
            onChange={(e) => handleInputChange(row, column.key, e.target.value)}
            className={`
              w-full rounded-xl border px-3 py-2 text-xs text-gray-800 outline-none transition
              ${
                hasError
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-gray-50 focus:border-gray-300 focus:bg-white"
              }
            `}
            {...(column.inputProps || {})}
          />
        </div>
      );
    }

    if (column.selector) {
      return <div className={cellBg}>{column.selector(row, rowIndex)}</div>;
    }

    const value = row[column.key];

    return (
      <div className={cellBg}>
        {column.format ? column.format(value) : value}
      </div>
    );
  };

  const colSpanCount = React.useMemo(
    () => columns.length + (showActions ? 1 : 0) + (showCheckBox ? 1 : 0),
    [columns.length, showActions, showCheckBox],
  );

  return (
    <div
      className={`
        flex h-full w-full flex-col bg-white text-gray-900
        ${isRounded ? "rounded-2xl" : ""}
      `}
    >
      <div
        className={`
          flex h-full flex-col overflow-hidden border border-gray-100 bg-white shadow-sm
          ${isRounded ? "rounded-2xl" : ""}
        `}
      >
        {(searchUrl ||
          renderTopActions ||
          renderTopActionButtons ||
          subtitle ||
          title ||
          localSearch ||
          showDateRange ||
          addContentLeftTitle) && (
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-white/90 2xl:px-4 2xl:py-3 px-2 py-1.5 backdrop-blur-sm">
            {(subtitle || title) && (
              <div className="min-w-0">
                {title && (
                  <h3 className="truncate text-sm font-semibold text-gray-900">
                    {title}
                  </h3>
                )}

                {subtitle && (
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-1 items-center justify-end gap-3">
              {searchUrl && (
                <div className="w-36 xl:w-48">
                  <SearchBar url={searchUrl} />
                </div>
              )}

              {localSearch && (
                <div
                  className="w-40 xl:w-56"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    label=""
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    sizes="sm"
                    placeholder="Search..."
                  />
                </div>
              )}

              {showDateRange && (
                <DateRange onDateRangeChange={onDateRangeChange} />
              )}

              {showFilter && onSave && (
                <FilterDropdown
                  filterConfig={filterConfig ?? []}
                  initialFilters={initialFilters}
                  onSave={onSave}
                />
              )}

              {addContentLeftTitle}

              {renderTopActionButtons && (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  {/* Mobile */}
                  <div className="block 2xl:hidden">
                    <IconButton
                      ref={triggerRef}
                      onClick={() => {
                        updatePosition();
                        setShowMobileActions((prev) => !prev);
                      }}
                      label=""
                      icon={<Menu className="h-3.5 w-3.5" />}
                      bg="nobg"
                    />
                  </div>

                  {/* Mobile Floating Menu */}
                  {showMobileActions &&
                    typeof window !== "undefined" &&
                    createPortal(
                      <div
                        ref={dropdownRef}
                        className="fixed z-[9999]  rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl 2xl:hidden"
                        style={{
                          top: position.top,
                          left: position.left,
                          width: position.width,
                        }}
                      >
                        <div className="flex  flex-col gap-2">
                          {renderTopActionButtons
                            .filter((button) => button.isShow ?? true)
                            .map((button, index) => (
                              <Button
                                key={index}
                                size="sm"
                                {...button.props}
                                className={`
                    w-full justify-start font-semibold
                    ${button.props.className ?? ""}
                  `}
                                onClick={() => {
                                  button.props.onClick?.();
                                  setShowMobileActions(false);
                                }}
                              />
                            ))}
                        </div>
                      </div>,
                      document.body,
                    )}

                  {/* Desktop */}
                  <div className="hidden items-center gap-2 2xl:flex">
                    {renderTopActionButtons
                      .filter((button) => button.isShow ?? true)
                      .map((button, index) => (
                        <Button key={index} size="sm" {...button.props} />
                      ))}
                  </div>
                </div>
              )}
              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {renderTopActions}
              </div>
            </div>
          </div>
        )}

        <div
          className="no-scrollbar flex-1 overflow-auto"
          style={{ maxHeight }}
        >
          <table
            onClick={(e) => e.stopPropagation()}
            className="w-full border-collapse text-left"
          >
            <thead className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
              <tr>
                {showCheckBox && (
                  <th className="w-12 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded-md border-gray-300 text-gray-900 focus:ring-0"
                      checked={
                        selectedRows.length === filteredData.length &&
                        filteredData.length > 0
                      }
                      onChange={toggleAll}
                    />
                  </th>
                )}

                {columns.map((column) => (
                  <th
                    key={column.key}
                    onClick={() => column.sortable && handleSort(column.key)}
                    className={`
    px-2 py-1.5 2xl:px-4 2xl:py-3
    text-[8px] 2xl:text-[11px]
    font-medium uppercase tracking-wide
    ${column.sortable ? "cursor-pointer" : ""}
    ${column.bgHeader ?? "bg-white"}
  `}
                  >
                    <div className="flex items-center gap-1">
                      <span>{column.name}</span>

                      {column.sortable &&
                        (sortKey !== column.key ? (
                          <ArrowUpDown className="h-3 w-3 text-gray-300" />
                        ) : sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-gray-600" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-gray-600" />
                        ))}
                    </div>
                  </th>
                ))}

                {showActions && (
                  <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={colSpanCount} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-400">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : !Array.isArray(filteredData) || filteredData.length === 0 ? (
                <tr>
                  <td colSpan={colSpanCount} className="py-20 text-center">
                    <p className="text-sm text-gray-400">
                      {Datalabel ?? "No records found"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, rowIndex) => (
                  <tr
                    key={getUniqueId(row) ?? rowIndex}
                    className={`
                      cursor-pointer text-[11px] text-gray-700 transition-colors
                      hover:bg-gray-50/80 xl:text-${textSize}
                    `}
                    onClick={() => onRowSelection?.(row)}
                  >
                    {showCheckBox && (
                      <td
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-3 text-center"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded-md border-gray-300 text-gray-900 focus:ring-0"
                          checked={isRowSelected(row)}
                          onChange={() => toggleRow(row)}
                        />
                      </td>
                    )}

                    {columns.map((column) => {
                      const cellBg = column.bgCol ?? "";

                      return (
                        <td
                          key={column.key}
                          className={`
                            px-4 py-3 align-middle text-xs transition-colors xl:text-${textSize}
                            ${cellBg}
                          `}
                        >
                          {renderCell(column, row, rowIndex)}
                        </td>
                      );
                    })}

                    {showActions && renderActions && (
                      <td
                        className={`px-4 py-3 text-center text-xs xl:text-${textSize}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {renderActions(row, rowIndex)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showPagination && (
          <div className="border-t border-gray-100 bg-white ">
            <Pagination totalItems={totalCount} defaultLimit={defaultLimit} />
          </div>
        )}
      </div>
    </div>
  );
};

export default forwardRef(TableInner) as <T extends Record<string, any>>(
  props: TableProps<T> & { ref?: React.Ref<TableHandle> },
) => React.ReactElement;

const CustomSelect = ({
  value,
  options,
  onChange,
}: {
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => String(o.value) === String(value));
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();

      setPos({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [open]);

  return (
    <div ref={triggerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`
          flex w-full items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-left text-xs outline-none transition
          hover:border-gray-300
          ${selected?.bg ?? "bg-gray-50"}
          ${selected?.color ?? "text-gray-700"}
        `}
      >
        <span className="truncate">{selected?.label ?? "Select"}</span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              zIndex: 9999,
            }}
            className="no-scrollbar max-h-60 overflow-y-auto rounded-xl border border-gray-100 bg-white p-1 shadow-xl"
          >
            {options.map((opt) => {
              const isSelected = String(value) === String(opt.value);

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (opt.disabled) return;

                    onChange(String(opt.value));
                    setOpen(false);
                  }}
                  disabled={opt.disabled}
                  className={`
                    w-full rounded-lg px-3 py-2 text-left text-xs transition
                    ${
                      opt.disabled
                        ? "cursor-not-allowed text-gray-300"
                        : "text-gray-600 hover:bg-gray-50"
                    }
                    ${isSelected ? "bg-gray-100 font-medium text-gray-900" : ""}
                    ${opt.color || ""}
                  `}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
};
