"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  url: string;
  debounce?: number;
  label?: string;
  placeholder?: string;
}

export default function SearchBar({
  url,
  debounce = 500,
  label,
  placeholder = "Search...",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setKeyword] = useState(searchParams.get("search") || "");
  const timer = useRef<NodeJS.Timeout | null>(null);

  const pushSearch = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }

    params.delete("page");
    router.replace(`${url}?${params.toString()}`);
  };

  const clearSearch = () => {
    setKeyword("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("page");
    router.replace(`${url}?${params.toString()}`);
  };

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    if (!search.trim()) {
      pushSearch();
    } else {
      timer.current = setTimeout(pushSearch, debounce);
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [search]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") pushSearch();
  };

  return (
    <div className="flex w-full h-full items-center gap-2">
      {label && (
        <span className="text-xs xl:text-sm font-medium text-gray-700 whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="relative w-full min-w-0">
        {" "}
        {/* Changed to w-full min-w-0 */}
        <Search className="absolute left-1 xl:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 xl:w-4 xl:h-4" />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full pr-4 pl-5 py-0.5 xl:pl-10 xl:py-1 border border-gray-300 bg-white text-gray-800 text-xs xl:text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
        {search && (
          <button
            onClick={clearSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 text-xl font-bold"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
