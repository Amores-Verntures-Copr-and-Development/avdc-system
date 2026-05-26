import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PaginationProps {
  totalItems: number;
  defaultLimit?: number;
  maxVisiblePages?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  defaultLimit = 100,
  maxVisiblePages = 5,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [memoTotalItems, setMemoTotalItems] = useState(totalItems ?? 0);

  useEffect(() => {
    if (typeof totalItems === "number" && totalItems > 0) {
      setMemoTotalItems(totalItems);
    }
  }, [totalItems]);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const limit = Math.max(
    1,
    parseInt(searchParams.get("limit") || `${defaultLimit}`, 10),
  );

  const totalPages = Math.max(1, Math.ceil(memoTotalItems / limit));

  const setPageAndLimit = (newPage: number, newLimit: number = limit) => {
    const safePage = Math.max(1, Math.min(newPage, totalPages));
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", safePage.toString());
    params.set("limit", newLimit.toString());

    router.push(`?${params.toString()}`);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageAndLimit(1, newLimit);
  };

  const startItem = memoTotalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, memoTotalItems);

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const half = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, page + half);

    if (end - start + 1 < maxVisiblePages) {
      if (start === 1) {
        end = Math.min(totalPages, start + maxVisiblePages - 1);
      } else if (end === totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
    }

    if (start > 1) {
      pages.push(1);

      if (start > 2) {
        pages.push("...");
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  useEffect(() => {
    if (page > totalPages) {
      setPageAndLimit(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-white px-2 py-1.5 2xl:px-4 2xl:py-3">
      {/* Rows per page */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="limit"
          className="text-[10px] font-medium text-gray-500 2xl:text-xs"
        >
          Rows per page
        </label>

        <select
          id="limit"
          value={limit}
          onChange={handleLimitChange}
          className="
            rounded-xl border border-gray-200
            bg-white px-1.5 py-1
            text-[8px] font-medium text-gray-700
            shadow-sm outline-none transition
            hover:border-gray-300
            focus:border-gray-300
            2xl:px-3 2xl:py-2 2xl:text-xs
          "
          aria-label="Select rows per page"
        >
          {[10, 20, 50, 100, 200, 300].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-1">
        <button
          className="
            flex h-5 w-5 items-center justify-center
            rounded-xl border border-transparent
            text-gray-500 transition
            hover:bg-gray-100
            disabled:cursor-not-allowed
            disabled:opacity-40
            2xl:h-9 2xl:w-9
          "
          onClick={() => setPageAndLimit(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ArrowLeft className="h-5 w-5 2xl:h-4 2xl:w-4" />
        </button>

        {visiblePages.map((pageNum, index) => {
          if (pageNum === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-[8px] text-gray-400 2xl:text-xs"
              >
                ...
              </span>
            );
          }

          const isCurrentPage = pageNum === page;

          return (
            <button
              key={pageNum}
              onClick={() => setPageAndLimit(Number(pageNum))}
              aria-label={`Go to page ${pageNum}`}
              aria-current={isCurrentPage ? "page" : undefined}
              className={`
                min-w-[20px] rounded-xl px-1.5 py-1
                text-[8px] font-medium transition-all
                2xl:px-3 2xl:py-2 2xl:text-xs
                
                ${
                  isCurrentPage
                    ? "bg-primary-1 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }
              `}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          className="
            flex h-7 w-7 items-center justify-center
            rounded-xl border border-transparent
            text-gray-500 transition
            hover:bg-gray-100
            disabled:cursor-not-allowed
            disabled:opacity-40
            2xl:h-9 2xl:w-9
          "
          onClick={() => setPageAndLimit(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ArrowRight className="h-5 w-5 2xl:h-4 2xl:w-4" />
        </button>
      </div>

      {/* Showing Info */}
      <div className="text-center text-[8px] 2xl:text-sm font-medium text-gray-500 lg:text-right">
        Showing{" "}
        <span className="text-[8px] 2xl:text-sm font-semibold text-gray-800">
          {startItem}
        </span>
        –
        <span className="text-[8px] 2xl:text-sm font-semibold text-gray-800">
          {endItem}
        </span>{" "}
        of{" "}
        <span className="text-[8px] 2xl:text-sm font-semibold text-gray-800">
          {memoTotalItems}
        </span>{" "}
        items
      </div>
    </div>
  );
};

export default Pagination;
