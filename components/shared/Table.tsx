import { Loader2 } from "lucide-react";
import React, {
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
} from "react";
import Pagination from "./Pagintation";
import SearchBar from "./SearchBar";

export interface Column<T = any> {
  name: string;
  key: string;
  selector?: (row: T, index: number) => React.ReactNode;
  editable?: boolean | ((row: T, rowIndex: number) => boolean); // Dynamic editable
  inputType?: "text" | "number" | "date" | "email" | "tel" | "url" | "select";
  options?:
    | { label: string; value: any }[]
    | ((row: T) => { label: string; value: any }[]);
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>; // Additional input props
  validate?: (value: any, row: T) => boolean; // Validation function
  format?: (value: any) => string;
  compute?: (row: T) => any;
  dependsOn?: (keyof T | string)[];
  // Format display value
}

interface TableProps<T> {
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
    row: T
  ) => void; // Individual cell change callback
  searchUrl?: string;
  maxHeight?: string;
  debounceTime?: number; // Configurable debounce time
  editMode?: "inline" | "row";
  isRounded?: boolean; // Edit mode: inline (cell by cell) or row (entire row)
}
export interface TableHandle {
  clearSelection: () => void;
}
const TableInner = <T extends Record<string, any>>(
  {
    columns,
    data,
    loading = false,
    showActions = false,
    renderActions,
    renderTopActions,
    Datalabel,
    textSize = "xs",
    rowSize = "h-10",
    totalCount,
    showCheckBox,
    onSelectionChange,
    onRowSelection,
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
  }: TableProps<T>,
  ref?: React.Ref<TableHandle>
) => {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editableData, setEditableData] = useState<T[]>(data);

  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    setEditableData(data);
  }, [data]);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const clearSelection = () => {
    setSelectedRows(new Set());
    console.log("Table Clear");
    if (onClearSelection) onClearSelection();
    if (onSelectionChange) onSelectionChange([]);
  };
  useImperativeHandle(ref, () => ({
    clearSelection,
  }));
  const handleInputChange = (
    rowIndex: number,
    columnKey: string,
    value: string,
    column: Column<T>
  ) => {
    const newData = [...editableData];
    newData[rowIndex] = { ...newData[rowIndex], [columnKey]: value };

    // 👇 NEW: After updating the field, check for computed columns
    columns.forEach((col) => {
      if (col.compute && col.key) {
        // Only compute if this column depends on the changed field
        if (!col.dependsOn || col.dependsOn.includes(columnKey)) {
          const computedValue = col.compute(newData[rowIndex]);
          newData[rowIndex] = {
            ...newData[rowIndex],
            [col.key]: computedValue,
          };
        }
      }
    });

    setEditableData(newData);

    // Validate if validation function exists
    if (column.validate) {
      const isValid = column.validate(value, newData[rowIndex]);
      const errorKey = `${rowIndex}-${columnKey}`;

      if (!isValid) {
        setErrors(new Map(errors.set(errorKey, `Invalid ${column.name}`)));
      } else {
        const newErrors = new Map(errors);
        newErrors.delete(errorKey);
        setErrors(newErrors);
      }
    }

    // Call individual cell change callback immediately
    if (onCellChange) {
      onCellChange(rowIndex, columnKey, value, newData[rowIndex]);
    }

    // Debounce parent update to avoid erasing input
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
    rowIndex: number
  ): boolean => {
    if (typeof column.editable === "function") {
      return column.editable(row, rowIndex);
    }
    return column.editable === true;
  };

  const toggleRow = (index: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedRows(newSelection);

    if (onSelectionChange) {
      onSelectionChange(Array.from(newSelection).map((i) => data[i]));
    }
  };

  const toggleAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
      if (onSelectionChange) onSelectionChange([]);
    } else {
      const allIndexes = new Set(data.map((_, i) => i));
      setSelectedRows(allIndexes);
      if (onSelectionChange) onSelectionChange(data);
    }
  };

  const renderCell = (column: Column<T>, row: T, rowIndex: number) => {
    const editable = isFieldEditable(column, row, rowIndex);
    const errorKey = `${rowIndex}-${column.key}`;
    const hasError = errors.has(errorKey);

    if (editable && editMode === "inline") {
      if (column.inputType === "select") {
        // ✅ handle dynamic or static options
        const opts =
          typeof column.options === "function"
            ? column.options(row)
            : column.options || [];

        return (
          <select
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="border rounded px-1 py-0.5 xl:px-2 xl:py-1 w-full text-[10px] xl:text-sm border-gray-300"
            value={editableData[rowIndex]?.[column.key] ?? ""}
            onChange={(e) =>
              handleInputChange(rowIndex, column.key, e.target.value, column)
            }
          >
            <option value="">Select...</option>
            {opts.map((opt, idx) => (
              <option key={idx} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      } else {
        return (
          <div className="flex flex-col">
            <input
              onClick={(e) => {
                e.stopPropagation();
              }}
              type={column.inputType ?? "text"}
              name={column.name}
              value={editableData[rowIndex]?.[column.key] ?? ""}
              onChange={(e) =>
                handleInputChange(rowIndex, column.key, e.target.value, column)
              }
              className={`border rounded px-1 py-0.5 xl:px-2 xl:py-1 text-[10px] xl:text-sm text-gray-800 caret-black
    ${hasError ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}
    w-auto
  `}
              {...(column.inputProps || {})}
            />
          </div>
        );
      }
    }

    if (column.selector) return column.selector(row, rowIndex);

    const value = row[column.key];
    return column.format ? column.format(value) : value;
  };

  return (
    <div
      className={`w-full h-full flex flex-col text-white bg-white ${
        isRounded && "rounded-lg"
      }`}
    >
      <div
        className={`flex flex-col h-full ${
          isRounded && "rounded-lg"
        } border border-gray-200`}
      >
        {/* Top Actions Bar */}
        {(searchUrl || renderTopActions || subtitle || title) && (
          <div className="bg-white flex p-1 lg:p-2 gap-5 items-center align-middle justify-between border-b border-gray-200">
            {(subtitle || title) && (
              <div className="flex flex-col">
                {title && <span className="text-black text-sm">{title}</span>}
                {subtitle && (
                  <span className="text-xs text-gray-600">{subtitle}</span>
                )}
              </div>
            )}
            <div className="w-25 xl:w-40 items-center align-middle">
              {searchUrl && <SearchBar url={searchUrl} />}
            </div>
            <div className="flex gap-1 lg:gap-2">{renderTopActions}</div>
          </div>
        )}

        {/* Table Container with Sticky Header */}
        <div className="flex-1 overflow-auto " style={{ maxHeight }}>
          <table
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-full border-collapse text-black overflow-auto"
          >
            <thead className="sticky top-0 z-20 bg-gray-50 border-b border-gray-300">
              <tr
                className={`xl:${rowSize} text-[10px] xl:text-${textSize} border-b-1 border-gray-300`}
              >
                {/* Select-all column */}
                {showCheckBox && (
                  <th className="px-1 py-1 w-5 xl:px-2 xl:py-3 xl:w-12 text-center bg-gray-50 border-r border-gray-300">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={
                        selectedRows.size === data.length && data.length > 0
                      }
                      onChange={toggleAll}
                    />
                  </th>
                )}

                {columns.map((column, index) => (
                  <th
                    key={column.key}
                    className={`px-1 py-1 xl:px-2 xl:py-3 font-semibold text-left text-[10px] lg:text-${textSize} text-gray-700 bg-gray-50 ${
                      index < columns.length - 1
                        ? "border-r border-gray-300"
                        : ""
                    }`}
                  >
                    {column.name}
                  </th>
                ))}

                {showActions && (
                  <th
                    className={`px-1 py-1 xl:px-2 xl:py-1 text-center border-l border-r border-gray-300  font-semibold text-[10px] lg:text-${textSize} text-gray-700 bg-gray-50`}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={
                      columns.length +
                      (showActions ? 1 : 0) +
                      (showCheckBox ? 1 : 0)
                    }
                    className="py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-1" />
                      <span className="text-gray-500 text-sm">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : !Array.isArray(data) || data.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      columns.length +
                      (showActions ? 1 : 0) +
                      (showCheckBox ? 1 : 0)
                    }
                    className="py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg
                        className="w-12 h-12 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>{Datalabel ?? "No data available"}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                editableData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`hover:bg-gray-50 transition-colors duration-150 text-[10px] xl:text-${textSize} border-b-2  border-gray-100`}
                    onClick={() => {
                      if (onRowSelection) {
                        onRowSelection(row);
                      }
                    }}
                  >
                    {/* Row checkbox */}
                    {showCheckBox && (
                      <td
                        onClick={(e) => e.stopPropagation()}
                        className="px-1 py-0.5 xl:px-2 xl:py-1 text-center border-r border-gray-100"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedRows.has(rowIndex)}
                          onChange={() => toggleRow(rowIndex)}
                        />
                      </td>
                    )}

                    {columns.map((column, colIndex) => (
                      <td
                        key={column.key}
                        className={`px-1 py-0.5 xl:px-2 xl:py-1 border-r-2 border-gray-100 text-[10px] xl:text-${textSize} ${
                          colIndex < columns.length - 1 ? "" : ""
                        }`}
                      >
                        {renderCell(column, row, rowIndex)}
                      </td>
                    ))}

                    {showActions && renderActions && (
                      <td
                        className={`px-1 py-0.5 xl:px-2 xl:py-1 text-center text-[10px] xl:text-${textSize}`}
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

        {/* Pagination */}
        {typeof totalCount === "number" && (
          <div className="bg-white border-t border-gray-200 px-2 py-1.5 lg:px-4 lg:py-3">
            <Pagination totalItems={totalCount} defaultLimit={20} />
          </div>
        )}
      </div>
    </div>
  );
};

export default forwardRef(TableInner) as <T extends Record<string, any>>(
  props: TableProps<T> & { ref?: React.Ref<TableHandle> }
) => React.ReactElement;
