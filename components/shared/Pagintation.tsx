import React, { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PaginationProps {
  totalItems: number;
  defaultLimit?: number;
  maxVisiblePages?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  defaultLimit = 20,
  maxVisiblePages = 5,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Memoize params for stability
  const currentParams = useMemo(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams]
  );

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(
    1,
    parseInt(searchParams.get("limit") || `${defaultLimit}`, 10)
  );
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  const setPageAndLimit = (newPage: number, newLimit: number = limit) => {
    const safePage = Math.max(1, Math.min(newPage, totalPages));
    const params = new URLSearchParams(currentParams.toString());
    params.set("page", safePage.toString());
    params.set("limit", newLimit.toString());

    router.replace(`?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageAndLimit(1, newLimit);
  };

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  // Generate visible page numbers
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const half = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, page + half);

    // Adjust if we're near the beginning or end
    if (end - start + 1 < maxVisiblePages) {
      if (start === 1) {
        end = Math.min(totalPages, start + maxVisiblePages - 1);
      } else if (end === totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
    }

    // Add first page and ellipsis if needed
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push("...");
      }
    }

    // Add visible pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis and last page if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  // Clamp invalid page numbers
  useEffect(() => {
    if (page > totalPages) {
      setPageAndLimit(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="flex flex-row items-center justify-between sm:justify-between gap-3 text-black sm:pl-5 sm:pr-5">
      {/* Row selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="limit" className="text-xs font-semibold">
          Rows per page:
        </label>
        <select
          id="limit"
          value={limit}
          onChange={handleLimitChange}
          className="border rounded px-2 py-1 text-xs font-semibold"
          aria-label="Select rows per page"
        >
          {[10, 20, 50, 100].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        <button
          className="px-3 py-1 rounded text-primary-1 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setPageAndLimit(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Page numbers */}
        {visiblePages.map((pageNum, index) => {
          if (pageNum === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-1 text-gray-400"
              >
                ...
              </span>
            );
          }

          const isCurrentPage = pageNum === page;
          return (
            <button
              key={pageNum}
              className={`px-3 py-1 rounded transition-colors text-xs ${
                isCurrentPage
                  ? "bg-primary-1 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setPageAndLimit(Number(pageNum))}
              aria-label={`Go to page ${pageNum}`}
              aria-current={isCurrentPage ? "page" : undefined}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          className="px-3 py-1 rounded text-primary-1 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setPageAndLimit(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Showing info */}
      <div className="text-xs font-semibold text-gray-700">
        Showing {totalItems === 0 ? 0 : startItem}–{endItem} of {totalItems}{" "}
        items
      </div>
    </div>
  );
};

export default Pagination;
